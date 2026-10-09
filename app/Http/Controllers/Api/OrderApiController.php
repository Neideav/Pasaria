<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Services\CheckoutService;
use App\Services\PricingService;
use App\Services\OrderStateMachine;
use App\Services\LedgerService;
use App\Services\RefundService;
use App\Models\Notification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OrderApiController extends Controller
{
    protected CheckoutService $checkoutService;
    protected PricingService $pricingService;
    protected OrderStateMachine $stateMachine;
    protected LedgerService $ledgerService;
    protected RefundService $refundService;

    public function __construct(
        CheckoutService $checkoutService,
        PricingService $pricingService,
        OrderStateMachine $stateMachine,
        LedgerService $ledgerService,
        RefundService $refundService
    ) {
        $this->checkoutService = $checkoutService;
        $this->pricingService  = $pricingService;
        $this->stateMachine    = $stateMachine;
        $this->ledgerService   = $ledgerService;
        $this->refundService   = $refundService;
    }

    /**
     * Server-controlled checkout & atomic order creation.
     */
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated.',
            ], 401);
        }

        $request->validate([
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|integer',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.variant_id' => 'nullable|integer',
            'shipping_address' => 'nullable|string|max:500',
            'customer_name' => 'nullable|string|max:100',
            'customer_phone' => 'nullable|string|max:50',
            'payment_method' => 'nullable|string|max:50',
            'voucher_code' => 'nullable|string|max:50',
            'idempotency_key' => 'nullable|string|max:100',
        ]);

        $tamperFields = ['status', 'paid_at', 'refund_status'];
        foreach ($tamperFields as $tf) {
            if ($request->has($tf)) {
                return response()->json([
                    'success' => false,
                    'message' => "Field '{$tf}' dikontrol oleh server dan tidak boleh ditentukan dalam request.",
                ], 422);
            }
        }

        try {
            $payload = [
                'items' => $request->input('items'),
                'shipping_address' => $request->input('shipping_address'),
                'customer_name' => $request->input('customer_name', $user->name),
                'customer_email' => $user->email,
                'customer_phone' => $request->input('customer_phone', $user->phone),
                'payment_method' => $request->input('payment_method', 'cod'),
                'voucher_code' => $request->input('voucher_code'),
                'idempotency_key' => $request->input('idempotency_key') ?: $request->header('Idempotency-Key'),
            ];

            $result = $this->checkoutService->checkout($payload, $user->id);

            $statusCode = (!empty($result['idempotent'])) ? 200 : 201;
            return response()->json($result, $statusCode);
        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        } catch (\RuntimeException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('OrderApiController error: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json([
                'success' => false,
                'message' => (config('app.debug') || app()->environment('testing')) ? $e->getMessage() : 'Gagal memproses pesanan.',
            ], 500);
        }
    }

    /**
     * Calculate order totals preview (server-side pricing endpoint).
     */
    public function calculate(Request $request): JsonResponse
    {
        $request->validate([
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|integer',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.variant_id' => 'nullable|integer',
            'voucher_code' => 'nullable|string|max:50',
        ]);

        try {
            $items = $request->input('items', []);
            $voucherCode = $request->input('voucher_code');
            $userId = $request->user()?->id;

            $pricing = $this->pricingService->calculate($items, $voucherCode, $userId);

            return response()->json([
                'success' => true,
                'data' => $pricing,
            ]);
        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => config('app.debug') ? $e->getMessage() : 'Gagal menghitung kalkulasi pesanan.',
            ], 500);
        }
    }

    /**
     * List orders with strict ownership enforcement and pagination.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated.',
            ], 401);
        }

        try {
            $query = Order::with(['items', 'shop', 'payment'])->orderBy('id', 'desc');

            if ($user->isAdmin()) {
                // Admin can inspect all orders
            } elseif ($user->isSeller() && $user->shop) {
                // Seller sees only their shop's orders
                $query->where('shop_id', $user->shop->id);
            } else {
                // Customer strictly sees only their own orders
                $query->where('user_id', $user->id);
            }

            if ($request->has('status') && !empty($request->input('status')) && $request->input('status') !== 'all') {
                $query->where('status', strtolower($request->input('status')));
            }

            $perPage = min(50, max(5, (int) $request->input('per_page', 20)));
            $paginated = $query->paginate($perPage);

            $orders = collect($paginated->items())->map(function ($order) {
                $arr = $order->toArray();
                $arr['subtotal'] = (float) $order->subtotal;
                $arr['tax'] = (float) $order->tax;
                $arr['discount'] = (float) $order->discount;
                $arr['shipping_cost'] = (float) $order->shipping_cost;
                $arr['total'] = (float) $order->total;
                $arr['items'] = $order->items->map(function ($item) {
                    $itemArr = $item->toArray();
                    $itemArr['price'] = (float) $item->price;
                    $itemArr['subtotal'] = (float) $item->subtotal;
                    return $itemArr;
                });
                return $arr;
            });

            return response()->json([
                'success' => true,
                'data' => $orders,
                'pagination' => [
                    'current_page' => $paginated->currentPage(),
                    'last_page' => $paginated->lastPage(),
                    'per_page' => $paginated->perPage(),
                    'total' => $paginated->total(),
                ],
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => config('app.debug') ? $e->getMessage() : 'Gagal memuat daftar pesanan.',
            ], 500);
        }
    }

    /**
     * Get single order by order_number with strict BOLA/IDOR protection.
     */
    public function show(Request $request, string $orderNumber): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated.',
            ], 401);
        }

        $order = Order::with(['items.review', 'shop', 'payment', 'shipment.events'])
            ->where(function ($q) use ($orderNumber) {
                $q->where('order_number', $orderNumber)
                  ->orWhere('master_order_number', $orderNumber);
            })
            ->first();

        if (!$order) {
            return response()->json(['success' => false, 'message' => 'Pesanan tidak ditemukan.'], 404);
        }

        // BOLA / IDOR ownership validation
        $isBuyer = ($order->user_id === $user->id);
        $isSeller = ($user->shop && $order->shop_id === $user->shop->id);
        $isAdmin = $user->isAdmin();

        if (!$isBuyer && !$isSeller && !$isAdmin) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki hak akses ke pesanan ini.',
            ], 403);
        }

        $arr = $order->toArray();
        $arr['subtotal'] = (float) $order->subtotal;
        $arr['tax'] = (float) $order->tax;
        $arr['discount'] = (float) $order->discount;
        $arr['shipping_cost'] = (float) $order->shipping_cost;
        $arr['total'] = (float) $order->total;

        return response()->json(['success' => true, 'data' => $arr]);
    }

    /**
     * Update order status with state machine transition rules and authorization.
     */
    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        $order = Order::find($id);
        if (!$order) {
            return response()->json(['success' => false, 'message' => 'Pesanan tidak ditemukan.'], 404);
        }

        // Only the seller owning this order's shop, or admin can update status
        if (!$user->isAdmin()) {
            if (!$user->shop || $user->shop->id !== $order->shop_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Akses ditolak. Anda bukan pemilik toko untuk pesanan ini.',
                ], 403);
            }
            if ($user->shop->status !== 'approved') {
                return response()->json([
                    'success' => false,
                    'message' => 'Toko Anda belum disetujui untuk memproses pesanan.',
                ], 403);
            }
        }

        $request->validate([
            'status'          => 'required|string',
            'tracking_number' => 'nullable|string|max:100',
        ]);

        $newStatus = strtolower(trim($request->input('status', '')));
        $currentStatus = strtolower($order->status);

        if ($currentStatus === $newStatus) {
            return response()->json([
                'success' => true,
                'message' => 'Status pesanan tidak berubah.',
                'data'    => $order,
            ]);
        }

        $userRole = $user->isAdmin() ? 'admin' : ($user->isSeller() ? 'seller' : 'customer');

        try {
            $this->stateMachine->assertCanTransition($currentStatus, $newStatus, $userRole);
        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }

        return DB::transaction(function () use ($order, $newStatus, $request) {
            $order = Order::where('id', $order->id)->lockForUpdate()->first();
            $order->status = $newStatus;
            if ($request->has('tracking_number')) {
                $order->tracking_number = trim($request->input('tracking_number'));
            }
            $order->save();

            // Release escrow and credit seller wallet when order transitions to completed
            if ($newStatus === OrderStateMachine::STATUS_COMPLETED) {
                if ($order->subOrders()->exists()) {
                    foreach ($order->subOrders as $sub) {
                        $this->ledgerService->creditSale($sub);
                    }
                } else {
                    $this->ledgerService->creditSale($order);
                }
            }

            // Sync shipment status if exists
            if ($order->shipment) {
                if ($newStatus === OrderStateMachine::STATUS_SHIPPED) {
                    $order->shipment->update([
                        'status'          => 'in_transit',
                        'status_label'    => 'Pesanan Sedang Dikirim',
                        'tracking_number' => $order->tracking_number,
                    ]);
                } elseif ($newStatus === OrderStateMachine::STATUS_DELIVERED || $newStatus === OrderStateMachine::STATUS_COMPLETED) {
                    $order->shipment->update([
                        'status'       => 'delivered',
                        'status_label' => 'Pesanan Telah Tiba di Tujuan',
                    ]);
                }
            }

            try {
                Notification::create([
                    'user_id'    => $order->user_id,
                    'title'      => 'Pembaruan Status Pesanan',
                    'message'    => "Status pesanan #{$order->order_number} diperbarui menjadi: " . OrderStateMachine::getStatusLabel($newStatus),
                    'type'       => 'order',
                    'action_url' => "/orders/{$order->order_number}",
                ]);
            } catch (\Throwable $e) {}

            return response()->json([
                'success' => true,
                'message' => 'Status pesanan berhasil diperbarui.',
                'data'    => $order,
            ]);
        });
    }

    /**
     * Cancel order (Customer, Seller, or Admin) with atomic inventory restock and refund initiation.
     */
    public function cancel(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        $order = Order::with('items')->find($id);
        if (!$order) {
            return response()->json(['success' => false, 'message' => 'Pesanan tidak ditemukan.'], 404);
        }

        $isBuyer = ($order->user_id === $user->id);
        $isSeller = ($user->shop && $order->shop_id === $user->shop->id);
        $isAdmin = $user->isAdmin();

        if (!$isBuyer && !$isSeller && !$isAdmin) {
            return response()->json([
                'success' => false,
                'message' => 'Akses ditolak. Anda tidak berhak membatalkan pesanan ini.',
            ], 403);
        }

        $reason = trim((string) $request->input('reason', $isBuyer ? 'Dibatalkan oleh pembeli' : ($isSeller ? 'Dibatalkan oleh penjual (Stok habis)' : 'Dibatalkan oleh administrator')));

        return DB::transaction(function () use ($order, $user, $reason) {
            $lockedOrder = Order::where('id', $order->id)->lockForUpdate()->first();

            // 1. Idempotency Guard: If already cancelled, do not cancel or restock again!
            if ($lockedOrder->status === OrderStateMachine::STATUS_CANCELLED) {
                return response()->json([
                    'success'    => true,
                    'message'    => 'Pesanan sudah dibatalkan sebelumnya.',
                    'idempotent' => true,
                    'data'       => $lockedOrder,
                ], 200);
            }

            // 2. Eligibility Guard
            if (!$this->stateMachine->isCancellable($lockedOrder, $user)) {
                return response()->json([
                    'success' => false,
                    'message' => "Pesanan dengan status '" . OrderStateMachine::getStatusLabel($lockedOrder->status) . "' sudah tidak dapat dibatalkan.",
                ], 422);
            }

            $ordersToCancel = [$lockedOrder];
            if ($lockedOrder->subOrders()->exists()) {
                foreach ($lockedOrder->subOrders()->lockForUpdate()->get() as $sub) {
                    $ordersToCancel[] = $sub;
                }
            }

            foreach ($ordersToCancel as $ord) {
                // Restock inventory exactly once
                foreach ($ord->items as $item) {
                    if ($item->product_id) {
                        Product::where('id', $item->product_id)->increment('stock', $item->quantity);
                    }
                    if ($item->variant_id) {
                        ProductVariant::where('id', $item->variant_id)->increment('stock', $item->quantity);
                    }
                }

                // Handle payment status
                if ($ord->payment) {
                    if (in_array($ord->payment->status, ['pending', 'processing'], true)) {
                        $ord->payment->update(['status' => 'failed']);
                    } elseif ($ord->payment->status === 'paid') {
                        // Order was already paid: initiate refund flow
                        $this->refundService->processRefund(
                            $ord,
                            (float) $ord->total,
                            "Pengembalian dana pembatalan pesanan: {$reason}",
                            null,
                            $user
                        );
                    }
                }

                if ($ord->shipment && $ord->shipment->status === 'pending') {
                    $ord->shipment->update([
                        'status'       => 'cancelled',
                        'status_label' => 'Pesanan Dibatalkan',
                    ]);
                }

                $ord->status = OrderStateMachine::STATUS_CANCELLED;
                $ord->cancelled_at = now();
                $ord->cancelled_by = $user->id;
                $ord->cancellation_reason = $reason;
                $ord->save();
            }

            // Restore voucher usage quota
            if (!empty($lockedOrder->voucher_code)) {
                $voucher = \App\Models\Voucher::where('code', $lockedOrder->voucher_code)->first();
                if ($voucher) {
                    $voucher->decrement('usage_count');
                }
                \App\Models\VoucherRedemption::where('order_id', $lockedOrder->id)->delete();
            }

            // Safe notification
            try {
                Notification::create([
                    'user_id'    => $lockedOrder->user_id,
                    'title'      => 'Pesanan Dibatalkan',
                    'message'    => "Pesanan #{$lockedOrder->order_number} telah dibatalkan. Alasan: {$reason}",
                    'type'       => 'order',
                    'action_url' => "/orders/{$lockedOrder->order_number}",
                ]);
            } catch (\Throwable $e) {}

            return response()->json([
                'success' => true,
                'message' => 'Pesanan berhasil dibatalkan dan stok produk telah dikembalikan.',
                'data'    => $lockedOrder->fresh(),
            ]);
        }, 3);
    }
}
