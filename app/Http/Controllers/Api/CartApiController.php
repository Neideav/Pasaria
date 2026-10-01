<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CartApiController extends Controller
{
    /**
     * Get cart items for a user.
     */
    public function getCart(Request $request): JsonResponse
    {
        try {
            $userId = (int) ($request->input('user_id') ?: (auth()->id() ?: 1));
            $cart = DB::table('carts')->where('user_id', $userId)->first();
            $items = [];
            if ($cart && !empty($cart->items_json)) {
                $items = json_decode($cart->items_json, true) ?: [];
            }
            return response()->json([
                'success' => true,
                'data' => $items,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
                'data' => [],
            ], 200);
        }
    }

    /**
     * Save/sync cart items for a user.
     */
    public function syncCart(Request $request): JsonResponse
    {
        try {
            $userId = (int) ($request->input('user_id') ?: (auth()->id() ?: 1));
            $items = $request->input('items', []);
            $itemsJson = is_array($items) ? json_encode($items) : (string) $items;

            $exists = DB::table('carts')->where('user_id', $userId)->exists();
            if ($exists) {
                DB::table('carts')->where('user_id', $userId)->update([
                    'items_json' => $itemsJson,
                    'updated_at' => now(),
                ]);
            } else {
                DB::table('carts')->insert([
                    'user_id' => $userId,
                    'items_json' => $itemsJson,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Cart synced successfully',
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 200);
        }
    }

    /**
     * Clear cart for a user.
     */
    public function clearCart(Request $request): JsonResponse
    {
        try {
            $userId = (int) ($request->input('user_id') ?: (auth()->id() ?: 1));
            DB::table('carts')->where('user_id', $userId)->delete();

            return response()->json([
                'success' => true,
                'message' => 'Cart cleared',
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 200);
        }
    }
}
