<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Wishlist;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WishlistApiController extends Controller
{
    /**
     * Get user's wishlist products.
     */
    public function index(Request $request): JsonResponse
    {
        $userId = $request->user()?->id ?: (int) ($request->input('user_id') ?: 1);

        $wishlists = Wishlist::with('product')
            ->where('user_id', $userId)
            ->orderBy('id', 'desc')
            ->get();

        $products = $wishlists->map(function ($w) {
            if (!$w->product) return null;
            $arr = $w->product->toArray();
            $arr['price'] = (float) $w->product->price;
            $arr['is_wishlisted'] = true;
            return $arr;
        })->filter()->values();

        return response()->json([
            'success' => true,
            'data' => $products,
            'count' => count($products),
        ]);
    }

    /**
     * Add product to wishlist.
     */
    public function store(Request $request): JsonResponse
    {
        $userId = $request->user()?->id ?: (int) ($request->input('user_id') ?: 1);
        $productId = (int) $request->input('product_id');

        $product = Product::find($productId);
        if (!$product) {
            return response()->json(['success' => false, 'message' => 'Produk tidak ditemukan.'], 404);
        }

        $wishlist = Wishlist::firstOrCreate([
            'user_id' => $userId,
            'product_id' => $productId,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Produk berhasil ditambahkan ke Wishlist Anda.',
            'data' => $wishlist,
        ], 201);
    }

    /**
     * Remove product from wishlist.
     */
    public function destroy(Request $request, int $productId): JsonResponse
    {
        $userId = $request->user()?->id ?: (int) ($request->input('user_id') ?: 1);

        Wishlist::where('user_id', $userId)->where('product_id', $productId)->delete();

        return response()->json([
            'success' => true,
            'message' => 'Produk berhasil dihapus dari Wishlist.',
        ]);
    }
}
