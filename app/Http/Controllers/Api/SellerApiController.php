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
        if (!$user && app()->environment('local', 'testing')) {
            $user = \App\Models\User::find($request->input('user_id') ?: 1);
        }

        $shop = $user?->shop ?: Shop::first();
        if (!$shop) {
            return response()->json(['success' => false, 'message' => 'Toko belum terdaftar.'], 404);
        }

        $shopId = $shop->id;

        // Real database aggregations
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

        $avgRating = (float) (Review::where('shop_id', $shopId)->avg('rating') ?: 5.0);
        $totalReviews = Review::where('shop_id', $shopId)->count();

        $wallet = Wallet::firstOrCreate(['shop_id' => $shopId], ['user_id' => $shop->user_id, 'balance' => $totalRevenue * 0.95]);

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
        $shop = $user?->shop ?: Shop::first();
        if (!$shop) {
            return response()->json(['success' => true, 'data' => []]);
        }

        $products = Product::with(['variants'])
            ->where('shop_id', $shop->id)
            ->orderBy('id', 'desc')
            ->get()
            ->map(function ($p) {
                $arr = $p->toArray();
                $arr['price'] = (float) $p->price;
                return $arr;
            });

        return response()->json([
            'success' => true,
            'data' => $products,
        ]);
    }

    /**
     * Get seller orders.
     */
    public function orders(Request $request): JsonResponse
    {
        $user = $request->user();
        $shop = $user?->shop ?: Shop::first();
        if (!$shop) {
            return response()->json(['success' => true, 'data' => []]);
        }

        $orders = Order::with(['items', 'payment', 'shipment'])
            ->where('shop_id', $shop->id)
            ->orderBy('id', 'desc')
            ->get()
            ->map(function ($order) {
                $arr = $order->toArray();
                $arr['subtotal'] = (float) $order->subtotal;
                $arr['total'] = (float) $order->total;
                return $arr;
            });

        return response()->json([
            'success' => true,
            'data' => $orders,
        ]);
    }

    /**
     * Update stock for a product or variant.
     */
    public function updateStock(Request $request, int $productId): JsonResponse
    {
        $user = $request->user();
        $product = Product::find($productId);

        if (!$product) {
            return response()->json(['success' => false, 'message' => 'Produk tidak ditemukan.'], 404);
        }

        if ($user && !$user->isAdmin()) {
            if (!$user->shop || $user->shop->id !== $product->shop_id) {
                return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
            }
        }

        $stock = max(0, (int) $request->input('stock', 0));
        $product->stock = $stock;
        $product->save();

        if ($request->has('variant_id')) {
            $variant = ProductVariant::find($request->input('variant_id'));
            if ($variant && $variant->product_id === $product->id) {
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
        $shop = $user?->shop ?: Shop::first();
        if (!$shop) {
            return response()->json(['success' => false, 'message' => 'Toko tidak ditemukan.'], 404);
        }

        $grossSales = (float) Order::where('shop_id', $shop->id)->whereIn('status', ['paid', 'processing', 'packed', 'shipped', 'delivered', 'completed'])->sum('subtotal');
        $platformFee = round($grossSales * 0.05, 2); // 5% platform fee
        $netRevenue = round($grossSales - $platformFee, 2);

        $wallet = Wallet::firstOrCreate(['shop_id' => $shop->id], ['user_id' => $shop->user_id, 'balance' => $netRevenue]);
        $payouts = SellerPayout::where('shop_id', $shop->id)->orderBy('id', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => [
                'gross_sales' => $grossSales,
                'platform_fee' => $platformFee,
                'net_revenue' => $netRevenue,
                'available_balance' => (float) $wallet->balance,
                'payouts' => $payouts,
            ],
        ]);
    }

    /**
     * Request payout withdrawal.
     */
    public function requestPayout(Request $request): JsonResponse
    {
        $user = $request->user();
        $shop = $user?->shop ?: Shop::first();
        if (!$shop) {
            return response()->json(['success' => false, 'message' => 'Toko tidak ditemukan.'], 404);
        }

        $request->validate([
            'amount' => 'required|numeric|min:10000',
            'bank_name' => 'required|string',
            'account_number' => 'required|string',
            'account_holder' => 'required|string',
        ]);

        $amount = (float) $request->input('amount');
        $wallet = Wallet::firstOrCreate(['shop_id' => $shop->id], ['user_id' => $shop->user_id, 'balance' => 0]);

        if ($wallet->balance < $amount) {
            return response()->json([
                'success' => false,
                'message' => 'Saldo dompet tidak mencukupi untuk penarikan ini.',
            ], 422);
        }

        return DB::transaction(function () use ($shop, $wallet, $amount, $request) {
            $wallet->decrement('balance', $amount);

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

            return response()->json([
                'success' => true,
                'message' => 'Permintaan penarikan dana berhasil diajukan.',
                'data' => $payout,
            ], 201);
        });
    }

    /**
     * Get inventory list of products & variants.
     */
    public function inventory(Request $request): JsonResponse
    {
        $user = $request->user();
        $shop = $user?->shop ?: Shop::first();
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

