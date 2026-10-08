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
     * Server-controlled checkout & order creation.
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            $userId = $user ? $user->id : (int) ($request->input('user_id') ?: 1);

            $result = $this->checkoutService->checkout($request->all(), $userId);

            return response()->json($result, 201);
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
            return response()->json([
                'success' => false,
                'message' => 'Gagal memproses pesanan: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Calculate order totals preview (server-side pricing endpoint).
     */
    public function calculate(Request $request): JsonResponse
    {
        try {
            $items = $request->input('items', []);
            $voucherCode = $request->input('voucher_code');
            $userId = $request->user()?->id ?: (int) ($request->input('user_id') ?: 1);

            $pricing = $this->pricingService->calculate($items, $voucherCode, $userId);

            return response()->json([
                'success' => true,
                'data' => $pricing,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * List orders with ownership enforcement.
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            $query = Order::with(['items', 'shop', 'payment'])->orderBy('id', 'desc');

            if ($user) {
                if ($user->isAdmin()) {
                    // Admin can see all orders
                } elseif ($user->isSeller() && $user->shop) {
                    // Seller sees orders for their shop
                    $query->where('shop_id', $user->shop->id);
                } else {
                    // Customer sees only their own orders
                    $query->where('user_id', $user->id);
                }
            } else {
                // Local fallback
                $userId = (int) ($request->input('user_id') ?: 1);
                $query->where('user_id', $userId);
            }

            if ($request->has('status') && !empty($request->input('status')) && $request->input('status') !== 'all') {
                $query->where('status', strtolower($request->input('status')));
            }

            $orders = $query->get()->map(function ($order) {
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
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get single order by order_number with IDOR protection.
     */
    public function show(Request $request, string $orderNumber): JsonResponse
    {
        $user = $request->user();
        $order = Order::with(['items.review', 'shop', 'payment', 'shipment.events'])
            ->where('order_number', $orderNumber)
            ->first();

        if (!$order) {
            return response()->json(['success' => false, 'message' => 'Pesanan tidak ditemukan.'], 404);
        }

        // BOLA / IDOR ownership validation
        if ($user) {
            $isBuyer = $order->user_id === $user->id;
            $isSeller = $user->shop && $order->shop_id === $user->shop->id;
            $isAdmin = $user->isAdmin();

            if (!$isBuyer && !$isSeller && !$isAdmin) {
                return response()->json(['success' => false, 'message' => 'Anda tidak memiliki hak akses ke pesanan ini.'], 403);
            }
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
     * Update order status (Seller or Admin only).
     */
    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $order = Order::find($id);

        if (!$order) {
            return response()->json(['success' => false, 'message' => 'Pesanan tidak ditemukan.'], 404);
        }

        if ($user && !$user->isAdmin()) {
            if (!$user->shop || $user->shop->id !== $order->shop_id) {
                return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
            }
        }

        $newStatus = strtolower($request->input('status', 'processing'));
        $validStatuses = ['pending_payment', 'paid', 'processing', 'packed', 'shipped', 'delivered', 'completed', 'cancelled'];

        if (!in_array($newStatus, $validStatuses)) {
            return response()->json(['success' => false, 'message' => 'Status pesanan tidak valid.'], 422);
        }

        $order->status = $newStatus;
        if ($request->has('tracking_number')) {
            $order->tracking_number = $request->input('tracking_number');
        }
        $order->save();

        return response()->json([
            'success' => true,
            'message' => 'Status pesanan berhasil diperbarui.',
            'data' => $order,
        ]);
    }

    /**
     * Cancel order (Customer within eligible period).
     */
    public function cancel(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $order = Order::find($id);

        if (!$order) {
            return response()->json(['success' => false, 'message' => 'Pesanan tidak ditemukan.'], 404);
        }

        if ($user && $order->user_id !== $user->id && !$user->isAdmin()) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        if (!in_array($order->status, ['pending_payment', 'paid', 'processing'])) {
            return response()->json([
                'success' => false,
                'message' => 'Pesanan tidak dapat dibatalkan karena sudah dalam proses pengiriman atau selesai.',
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
            'message' => 'Pesanan berhasil dibatalkan dan stok dikembalikan.',
            'data' => $order,
        ]);
    }
}
