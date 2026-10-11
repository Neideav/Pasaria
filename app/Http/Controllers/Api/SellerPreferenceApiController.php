<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SellerPreference;
use App\Models\Shop;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SellerPreferenceApiController extends Controller
{
    /**
     * Get seller preferences for the authenticated seller's shop.
     */
    public function getPreferences(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        if (!$user->isSeller() && !$user->isAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Hanya akun penjual yang dapat mengakses preferensi toko.',
            ], 403);
        }

        $shop = $user->shop ?: Shop::where('user_id', $user->id)->first();
        if (!$shop && !$user->isAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Anda belum memiliki toko terdaftar di PASARIA.',
            ], 404);
        }

        $shopId = $shop ? $shop->id : 1;
        $preferences = SellerPreference::getOrCreateForShop($user->id, $shopId);

        return response()->json([
            'success' => true,
            'data'    => $preferences,
            'shop'    => $shop ? [
                'id'       => $shop->id,
                'name'     => $shop->name,
                'verified' => (bool) $shop->verified,
                'status'   => $shop->status,
            ] : null,
        ]);
    }

    /**
     * Update seller preferences for the authenticated seller's shop.
     */
    public function updatePreferences(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        if (!$user->isSeller() && !$user->isAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Hanya akun penjual yang dapat mengubah preferensi toko.',
            ], 403);
        }

        $shop = $user->shop ?: Shop::where('user_id', $user->id)->first();
        if (!$shop && !$user->isAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Anda belum memiliki toko terdaftar di PASARIA.',
            ], 404);
        }

        $request->validate([
            'notify_new_orders'   => 'nullable|boolean',
            'notify_customer_chat'=> 'nullable|boolean',
            'notify_low_stock'    => 'nullable|boolean',
            'notify_reviews'      => 'nullable|boolean',
            'notify_returns'      => 'nullable|boolean',
            'low_stock_threshold' => 'nullable|integer|min:1|max:100',
            'vacation_mode'       => 'nullable|boolean',
            'vacation_message'    => 'nullable|string|max:500',
            'vacation_start'      => 'nullable|date',
            'vacation_end'        => 'nullable|date',
        ]);

        $shopId = $shop ? $shop->id : 1;
        $preferences = SellerPreference::getOrCreateForShop($user->id, $shopId);

        $boolKeys = [
            'notify_new_orders',
            'notify_customer_chat',
            'notify_low_stock',
            'notify_reviews',
            'notify_returns',
            'vacation_mode',
        ];

        foreach ($boolKeys as $key) {
            if ($request->has($key)) {
                $preferences->{$key} = $request->boolean($key);
            }
        }

        if ($request->has('low_stock_threshold')) {
            $preferences->low_stock_threshold = max(1, min(100, (int) $request->input('low_stock_threshold')));
        }

        if ($request->has('vacation_message')) {
            $preferences->vacation_message = $request->input('vacation_message') ? trim((string) $request->input('vacation_message')) : null;
        }

        if ($request->has('vacation_start')) {
            $preferences->vacation_start = $request->input('vacation_start');
        }

        if ($request->has('vacation_end')) {
            $preferences->vacation_end = $request->input('vacation_end');
        }

        $preferences->save();

        return response()->json([
            'success' => true,
            'message' => 'Preferensi toko berhasil diperbarui.',
            'data'    => $preferences,
        ]);
    }
}
