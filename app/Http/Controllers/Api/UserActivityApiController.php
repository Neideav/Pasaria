<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\UserPrivacyPreference;
use App\Models\UserSearchHistory;
use App\Models\UserViewedProduct;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserActivityApiController extends Controller
{
    // =========================================================================
    // 1. RECENT SEARCHES
    // =========================================================================

    /**
     * Get recent searches for the authenticated user.
     */
    public function getRecentSearches(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        $searches = UserSearchHistory::where('user_id', $user->id)
            ->orderBy('updated_at', 'desc')
            ->limit(20)
            ->get();

        return response()->json([
            'success' => true,
            'data'    => $searches,
        ]);
    }

    /**
     * Store or update a recent search query.
     */
    public function storeRecentSearch(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        $request->validate([
            'query' => 'required|string|min:1|max:100',
        ]);

        $query = trim(strip_tags((string) $request->input('query')));
        if (empty($query)) {
            return response()->json(['success' => false, 'message' => 'Kata kunci pencarian tidak boleh kosong.'], 422);
        }

        // Check privacy setting: skip recording if activity_logging is disabled
        $privacy = UserPrivacyPreference::getOrCreateForUser($user->id);
        if (!$privacy->activity_logging) {
            return response()->json([
                'success' => true,
                'message' => 'Perekaman riwayat pencarian dilewati karena pengaturan privasi dinonaktifkan.',
                'tracked' => false,
            ]);
        }

        $entry = UserSearchHistory::updateOrCreate(
            ['user_id' => $user->id, 'query' => $query],
            ['updated_at' => now()]
        );

        return response()->json([
            'success' => true,
            'data'    => $entry,
            'tracked' => true,
        ]);
    }

    /**
     * Delete an individual search history entry.
     */
    public function destroyRecentSearch(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        $entry = UserSearchHistory::where('id', $id)
            ->where('user_id', $user->id)
            ->first();

        if ($entry) {
            $entry->delete();
        }

        return response()->json([
            'success' => true,
            'message' => 'Entri pencarian berhasil dihapus.',
        ]);
    }

    /**
     * Clear all search histories for authenticated user.
     */
    public function clearRecentSearches(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        UserSearchHistory::where('user_id', $user->id)->delete();

        return response()->json([
            'success' => true,
            'message' => 'Semua riwayat pencarian berhasil dibersihkan.',
        ]);
    }

    // =========================================================================
    // 2. RECENTLY VIEWED PRODUCTS
    // =========================================================================

    /**
     * Get recently viewed products for the authenticated user.
     */
    public function getRecentlyViewed(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        $viewed = UserViewedProduct::with(['product' => function ($q) {
            $q->select('id', 'name', 'slug', 'price', 'original_price', 'image', 'stock', 'is_active', 'shop_name', 'rating', 'review_count');
        }])
            ->where('user_id', $user->id)
            ->orderBy('updated_at', 'desc')
            ->limit(30)
            ->get()
            ->filter(fn($item) => $item->product !== null) // Safely ignore deleted products
            ->values()
            ->map(function ($item) {
                return [
                    'id'         => $item->id,
                    'user_id'    => $item->user_id,
                    'product_id' => $item->product_id,
                    'viewed_at'  => $item->updated_at,
                    'product'    => [
                        'id'             => $item->product->id,
                        'name'           => $item->product->name,
                        'slug'           => $item->product->slug,
                        'price'          => (float) $item->product->price,
                        'original_price' => $item->product->original_price ? (float) $item->product->original_price : null,
                        'image'          => $item->product->image,
                        'stock'          => (int) $item->product->stock,
                        'is_active'      => (bool) $item->product->is_active,
                        'shop_name'      => $item->product->shop_name,
                        'rating'         => (float) $item->product->rating,
                        'review_count'   => (int) $item->product->review_count,
                    ],
                ];
            });

        return response()->json([
            'success' => true,
            'data'    => $viewed,
        ]);
    }

    /**
     * Record a product view.
     */
    public function storeRecentlyViewed(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        $request->validate([
            'product_id' => 'required|integer|exists:products,id',
        ]);

        $productId = (int) $request->input('product_id');

        // Check privacy setting: skip recording if activity_logging is disabled
        $privacy = UserPrivacyPreference::getOrCreateForUser($user->id);
        if (!$privacy->activity_logging) {
            return response()->json([
                'success' => true,
                'message' => 'Perekaman produk yang dilihat dilewati karena pengaturan privasi dinonaktifkan.',
                'tracked' => false,
            ]);
        }

        $entry = UserViewedProduct::updateOrCreate(
            ['user_id' => $user->id, 'product_id' => $productId],
            ['updated_at' => now()]
        );

        return response()->json([
            'success' => true,
            'data'    => $entry,
            'tracked' => true,
        ]);
    }

    /**
     * Delete an individual recently viewed product entry.
     */
    public function destroyRecentlyViewed(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        $entry = UserViewedProduct::where('id', $id)
            ->where('user_id', $user->id)
            ->first();

        if ($entry) {
            $entry->delete();
        }

        return response()->json([
            'success' => true,
            'message' => 'Produk berhasil dihapus dari riwayat.',
        ]);
    }

    /**
     * Clear all viewed products for authenticated user.
     */
    public function clearRecentlyViewed(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        UserViewedProduct::where('user_id', $user->id)->delete();

        return response()->json([
            'success' => true,
            'message' => 'Semua riwayat produk yang dilihat berhasil dibersihkan.',
        ]);
    }
}
