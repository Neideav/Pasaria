<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Shop;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use App\Models\SellerPayout;
use App\Models\Review;
use App\Models\IdempotencyKey;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class SellerApiController extends Controller
{
    /**
     * Get seller dashboard statistics.
     */
    public function dashboard(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        $shop = $user->shop;
        if (!$shop) {
            return response()->json([
                'success' => false,
                'message' => 'Anda belum memiliki toko terdaftar di PASARIA.',
            ], 404);
        }

        $shopId = $shop->id;

        // Real database aggregations for this seller's shop only
        $totalOrders = Order::where('shop_id', $shopId)->count();
        $pendingOrders = Order::where('shop_id', $shopId)->whereIn('status', ['paid', 'processing'])->count();
        $totalRevenue = (float) Order::where('shop_id', $shopId)->whereIn('status', ['paid', 'processing', 'packed', 'shipped', 'delivered', 'completed'])->sum('total');

        $todayRevenue = (float) Order::where('shop_id', $shopId)
            ->whereDate('created_at', today())
            ->whereIn('status', ['paid', 'processing', 'packed', 'shipped', 'delivered', 'completed'])
            ->sum('total');

        $productsSold = (int) OrderItem::where('shop_id', $shopId)->sum('quantity');
        $totalProducts = Product::where('shop_id', $shopId)->count();
        $lowStockProducts = Product::where('shop_id', $shopId)->where('stock', '<=', 5)->count();

        $avgRating = (float) (Review::where('shop_id', $shopId)->where('status', 'approved')->avg('rating') ?: 5.0);
        $totalReviews = Review::where('shop_id', $shopId)->where('status', 'approved')->count();

        // Wallet ledger: never synthesize balance from gross revenue
        $wallet = Wallet::firstOrCreate(
            ['shop_id' => $shopId],
            ['user_id' => $shop->user_id, 'balance' => 0.00]
        );

        return response()->json([
            'success' => true,
            'data' => [
                'shop' => $shop,
                'stats' => [
                    'today_revenue' => $todayRevenue,
                    'total_revenue' => $totalRevenue,
                    'total_orders' => $totalOrders,
                    'pending_orders' => $pendingOrders,
                    'products_sold' => $productsSold,
                    'total_products' => $totalProducts,
                    'low_stock_products' => $lowStockProducts,
                    'average_rating' => round($avgRating, 1),
                    'total_reviews' => $totalReviews,
                    'wallet_balance' => (float) $wallet->balance,
                ],
            ],
        ]);
    }

    /**
     * Get seller products with inventory details.
     */
    public function products(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        $shop = $user->shop;
        if (!$shop) {
            return response()->json(['success' => true, 'data' => []]);
        }

        $perPage = min(50, max(5, (int) $request->input('per_page', 20)));
        $paginated = Product::with(['variants'])
            ->where('shop_id', $shop->id)
            ->orderBy('id', 'desc')
            ->paginate($perPage);

        $products = collect($paginated->items())->map(function ($p) {
            $arr = $p->toArray();
            $arr['price'] = (float) $p->price;
            return $arr;
        });

        return response()->json([
            'success' => true,
            'data' => $products,
            'pagination' => [
                'current_page' => $paginated->currentPage(),
                'last_page' => $paginated->lastPage(),
                'total' => $paginated->total(),
            ],
        ]);
    }

    /**
     * Get seller orders.
     */
    public function orders(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        $shop = $user->shop;
        if (!$shop) {
            return response()->json(['success' => true, 'data' => []]);
        }

        $query = Order::with(['items', 'payment', 'shipment'])
            ->where('shop_id', $shop->id)
            ->orderBy('id', 'desc');

        if ($request->has('status') && !empty($request->input('status')) && $request->input('status') !== 'all') {
            $query->where('status', strtolower($request->input('status')));
        }

        $perPage = min(50, max(5, (int) $request->input('per_page', 20)));
        $paginated = $query->paginate($perPage);

        $orders = collect($paginated->items())->map(function ($order) {
            $arr = $order->toArray();
            $arr['subtotal'] = (float) $order->subtotal;
            $arr['total'] = (float) $order->total;
            return $arr;
        });

        return response()->json([
            'success' => true,
            'data' => $orders,
            'pagination' => [
                'current_page' => $paginated->currentPage(),
                'last_page' => $paginated->lastPage(),
                'total' => $paginated->total(),
            ],
        ]);
    }

    /**
     * Update stock for a product or variant.
     */
    public function updateStock(Request $request, int $productId): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        $product = Product::find($productId);
        if (!$product) {
            return response()->json(['success' => false, 'message' => 'Produk tidak ditemukan.'], 404);
        }

        // Ownership validation
        if (!$user->isAdmin()) {
            if (!$user->shop || $user->shop->id !== $product->shop_id) {
                return response()->json(['success' => false, 'message' => 'Akses ditolak.'], 403);
            }
            if ($user->shop->status !== 'approved') {
                return response()->json([
                    'success' => false,
                    'message' => 'Toko Anda belum disetujui untuk mengubah stok produk.',
                ], 403);
            }
        }

        $request->validate([
            'stock' => 'required|integer|min:0|max:1000000',
            'variant_id' => 'nullable|integer',
        ]);

        $stock = (int) $request->input('stock');
        $product->stock = $stock;
        $product->save();

        if ($request->has('variant_id') && !empty($request->input('variant_id'))) {
            $variant = ProductVariant::where('id', $request->input('variant_id'))
                ->where('product_id', $product->id)
                ->first();
            if ($variant) {
                $variant->stock = $stock;
                $variant->save();
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Stok produk berhasil diperbarui.',
            'product' => $product,
        ]);
    }

    /**
     * Get finances and payouts ledger.
     */
    public function finances(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        $shop = $user->shop;
        if (!$shop) {
            return response()->json(['success' => false, 'message' => 'Toko tidak ditemukan.'], 404);
        }

        $grossSales = (float) Order::where('shop_id', $shop->id)
            ->whereIn('status', ['paid', 'processing', 'packed', 'shipped', 'delivered', 'completed'])
            ->sum('subtotal');
        $platformFee = round($grossSales * 0.05, 2); // 5% platform fee
        $netRevenue = round($grossSales - $platformFee, 2);

        $wallet = Wallet::firstOrCreate(
            ['shop_id' => $shop->id],
            ['user_id' => $shop->user_id, 'balance' => 0.00]
        );

        $payouts = SellerPayout::where('shop_id', $shop->id)->orderBy('id', 'desc')->get();
        $transactions = WalletTransaction::where('wallet_id', $wallet->id)->orderBy('id', 'desc')->take(30)->get();

        return response()->json([
            'success' => true,
            'data' => [
                'gross_sales' => $grossSales,
                'platform_fee' => $platformFee,
                'net_revenue' => $netRevenue,
                'available_balance' => (float) $wallet->balance,
                'payouts' => $payouts,
                'transactions' => $transactions,
            ],
        ]);
    }

    /**
     * Request payout withdrawal with transaction & idempotency.
     */
    public function requestPayout(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        $shop = $user->shop;
        if (!$shop) {
            return response()->json(['success' => false, 'message' => 'Toko tidak ditemukan.'], 404);
        }

        if ($shop->status !== 'approved') {
            return response()->json([
                'success' => false,
                'message' => 'Toko Anda belum disetujui untuk mengajukan penarikan dana.',
            ], 403);
        }

        if (!$user->hasVerifiedEmail()) {
            return response()->json([
                'success' => false,
                'message' => 'Verifikasi email diperlukan untuk mengajukan penarikan dana.',
            ], 403);
        }

        $forbiddenPayoutFields = ['status', 'reference_id', 'shop_id'];
        foreach ($forbiddenPayoutFields as $ff) {
            if ($request->has($ff)) {
                return response()->json([
                    'success' => false,
                    'message' => "Field '{$ff}' dikontrol oleh server dan tidak boleh ditentukan dalam request.",
                ], 422);
            }
        }

        $request->validate([
            'amount' => 'required|numeric|min:10000',
            'bank_name' => 'required|string|max:100',
            'account_number' => 'required|string|max:50',
            'account_holder' => 'required|string|max:100',
            'idempotency_key' => 'nullable|string|max:100',
        ]);

        $idempotencyKey = $request->header('Idempotency-Key') ?: $request->input('idempotency_key');
        if (!empty($idempotencyKey)) {
            $cached = IdempotencyKey::where('key', $idempotencyKey)->where('user_id', $user->id)->first();
            if ($cached && !empty($cached->response_json)) {
                return response()->json($cached->response_json, 200);
            }
        }

        $amount = (float) $request->input('amount');

        return DB::transaction(function () use ($shop, $user, $amount, $request, $idempotencyKey) {
            $wallet = Wallet::where('shop_id', $shop->id)->lockForUpdate()->first();
            if (!$wallet) {
                $wallet = Wallet::create(['shop_id' => $shop->id, 'user_id' => $shop->user_id, 'balance' => 0]);
            }

            if ($wallet->balance < $amount) {
                return response()->json([
                    'success' => false,
                    'message' => 'Saldo dompet tidak mencukupi untuk penarikan ini.',
                ], 422);
            }

            $wallet->decrement('balance', $amount);
            $wallet->refresh();

            $payout = SellerPayout::create([
                'shop_id' => $shop->id,
                'amount' => $amount,
                'bank_name' => $request->input('bank_name'),
                'account_number' => $request->input('account_number'),
                'account_holder' => $request->input('account_holder'),
                'status' => 'pending',
                'reference_id' => 'PAYOUT-' . date('Ymd') . '-' . strtoupper(Str::random(6)),
                'note' => 'Permintaan penarikan dana penjual PASARIA',
            ]);

            WalletTransaction::create([
                'wallet_id' => $wallet->id,
                'type' => 'debit',
                'amount' => $amount,
                'balance_after' => (float) $wallet->balance,
                'reference_type' => 'payout',
                'reference_id' => $payout->reference_id,
                'description' => 'Penarikan saldo ke rekening ' . $request->input('bank_name'),
            ]);

            $responsePayload = [
                'success' => true,
                'message' => 'Permintaan penarikan dana berhasil diajukan.',
                'data' => $payout,
            ];

            if (!empty($idempotencyKey)) {
                try {
                    IdempotencyKey::create([
                        'key' => $idempotencyKey,
                        'user_id' => $user->id,
                        'action' => 'payout',
                        'resource_id' => $payout->reference_id,
                        'response_json' => $responsePayload,
                    ]);
                } catch (\Throwable $e) {}
            }

            return response()->json($responsePayload, 201);
        });
    }

    /**
     * Get inventory list of products & variants.
     */
    public function inventory(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        $shop = $user->shop;
        if (!$shop) {
            return response()->json(['success' => true, 'data' => []]);
        }

        $variants = ProductVariant::whereHas('product', function ($q) use ($shop) {
            $q->where('shop_id', $shop->id);
        })->with('product')->get();

        if ($variants->isEmpty()) {
            $variants = Product::where('shop_id', $shop->id)->get()->map(function ($p) {
                return [
                    'id' => $p->id,
                    'product_id' => $p->id,
                    'name' => $p->name,
                    'sku' => 'SKU-' . str_pad((string) $p->id, 5, '0', STR_PAD_LEFT),
                    'price' => (float) $p->price,
                    'stock' => (int) $p->stock,
                ];
            });
        }

        return response()->json([
            'success' => true,
            'data' => $variants,
        ]);
    }
}
