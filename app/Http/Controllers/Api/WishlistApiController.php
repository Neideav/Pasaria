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
        $user = $request->user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        $wishlists = Wishlist::with('product')
            ->where('user_id', $user->id)
            ->orderBy('id', 'desc')
            ->get();

        $products = $wishlists->map(function ($w) {
            if (!$w->product || (isset($w->product->is_active) && !$w->product->is_active)) return null;
            $arr = $w->product->toArray();
            $arr['price'] = (float) $w->product->price;
            $arr['is_wishlisted'] = true;
            return $arr;
        })->filter()->values();

        return response()->json([
            'success' => true,
            'data'    => $products,
            'count'   => count($products),
        ]);
    }

    /**
     * Add product to wishlist.
     */
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        $request->validate([
            'product_id' => 'required|integer',
        ]);

        $productId = (int) $request->input('product_id');
        $product = Product::find($productId);
        if (!$product || (isset($product->is_active) && !$product->is_active)) {
            return response()->json(['success' => false, 'message' => 'Produk tidak ditemukan atau sedang tidak aktif.'], 404);
        }

        $wishlist = Wishlist::firstOrCreate([
            'user_id'    => $user->id,
            'product_id' => $productId,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Produk berhasil ditambahkan ke Wishlist Anda.',
            'data'    => $wishlist,
        ], 201);
    }

    /**
     * Remove product from wishlist.
     */
    public function destroy(Request $request, int $productId): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        Wishlist::where('user_id', $user->id)->where('product_id', $productId)->delete();

        return response()->json([
            'success' => true,
            'message' => 'Produk berhasil dihapus dari Wishlist.',
        ]);
    }
}
