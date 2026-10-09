<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Services\CheckoutService;
use App\Services\PricingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OrderApiController extends Controller
{
    protected CheckoutService $checkoutService;
    protected PricingService $pricingService;

    public function __construct(CheckoutService $checkoutService, PricingService $pricingService)
    {
        $this->checkoutService = $checkoutService;
        $this->pricingService = $pricingService;
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

        $newStatus = strtolower(trim($request->input('status', '')));
        $currentStatus = strtolower($order->status);

        // State Machine validation
        $allowedTransitions = [
            'pending_payment' => ['paid', 'cancelled'],
            'paid'            => ['processing', 'cancelled'],
            'processing'      => ['packed', 'shipped', 'cancelled'],
            'packed'          => ['shipped', 'cancelled'],
            'shipped'         => ['delivered'],
            'delivered'       => ['completed', 'return_requested'],
            'return_requested'=> ['refunded', 'completed'],
            'completed'       => [],
            'cancelled'       => [],
            'refunded'        => [],
        ];

        if ($currentStatus === $newStatus) {
            // No state change
            return response()->json([
                'success' => true,
                'message' => 'Status pesanan tidak berubah.',
                'data' => $order,
            ]);
        }

        if (!isset($allowedTransitions[$currentStatus]) || !in_array($newStatus, $allowedTransitions[$currentStatus], true)) {
            // Admin can override except terminal completed/cancelled
            if (!$user->isAdmin() || in_array($currentStatus, ['cancelled', 'completed', 'refunded'])) {
                return response()->json([
                    'success' => false,
                    'message' => "Transisi status dari '{$currentStatus}' ke '{$newStatus}' tidak diizinkan.",
                ], 422);
            }
        }

        $order->status = $newStatus;
        if ($request->has('tracking_number')) {
            $order->tracking_number = trim($request->input('tracking_number'));
        }
        $order->save();

        return response()->json([
            'success' => true,
            'message' => 'Status pesanan berhasil diperbarui.',
            'data' => $order,
        ]);
    }

    /**
     * Cancel order (Customer or Admin) with atomic inventory restock.
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

        if ($order->user_id !== $user->id && !$user->isAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Akses ditolak.',
            ], 403);
        }

        if (!in_array($order->status, ['pending_payment', 'paid', 'processing'], true)) {
            return response()->json([
                'success' => false,
                'message' => 'Pesanan tidak dapat dibatalkan karena sudah dikemas, dikirim, atau selesai.',
            ], 422);
        }

        // Restore stock atomically in transaction
        DB::transaction(function () use ($order) {
            foreach ($order->items as $item) {
                if ($item->product_id) {
                    Product::where('id', $item->product_id)->increment('stock', $item->quantity);
                }
                if ($item->variant_id) {
                    ProductVariant::where('id', $item->variant_id)->increment('stock', $item->quantity);
                }
            }

            $order->status = 'cancelled';
            $order->save();
        });

        return response()->json([
            'success' => true,
            'message' => 'Pesanan berhasil dibatalkan dan stok produk telah dikembalikan.',
            'data' => $order,
        ]);
    }
}
