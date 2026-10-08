<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CartApiController extends Controller
{
    /**
     * Get cart items for authenticated user.
     */
    public function getCart(Request $request): JsonResponse
    {
        try {
            $userId = $request->user()?->id ?: (int) ($request->input('user_id') ?: 1);
            $cart = Cart::where('user_id', $userId)->first();

            $items = [];
            if ($cart && !empty($cart->items_json)) {
                $rawItems = is_array($cart->items_json) ? $cart->items_json : json_decode($cart->items_json, true);
                if (is_array($rawItems)) {
                    // Enrich items with current database price, availability, and stock
                    foreach ($rawItems as $item) {
                        $pId = $item['product']['id'] ?? $item['product_id'] ?? $item['id'] ?? 0;
                        $product = Product::find($pId);
                        if ($product) {
                            $item['product'] = array_merge($product->toArray(), [
                                'price' => (float) $product->price,
                                'stock' => (int) $product->stock,
                            ]);
                            $items[] = $item;
                        }
                    }
                }
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
            $userId = $request->user()?->id ?: (int) ($request->input('user_id') ?: 1);
            $items = $request->input('items', []);

            $cart = Cart::firstOrCreate(['user_id' => $userId]);
            $cart->items_json = $items;
            $cart->save();

            return response()->json([
                'success' => true,
                'message' => 'Keranjang berhasil disinkronkan ke database.',
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Add single item to cart.
     */
    public function addItem(Request $request): JsonResponse
    {
        try {
            $userId = $request->user()?->id ?: (int) ($request->input('user_id') ?: 1);
            $productId = (int) $request->input('product_id');
            $variantId = $request->input('variant_id');
            $quantity = max(1, (int) $request->input('quantity', 1));
            $color = $request->input('selectedColor');

            $product = Product::find($productId);
            if (!$product) {
                return response()->json(['success' => false, 'message' => 'Produk tidak ditemukan.'], 404);
            }

            $cart = Cart::firstOrCreate(['user_id' => $userId]);
            $currentItems = is_array($cart->items_json) ? $cart->items_json : (json_decode($cart->items_json, true) ?: []);

            $found = false;
            foreach ($currentItems as &$cItem) {
                $cId = $cItem['product']['id'] ?? $cItem['product_id'] ?? 0;
                $cColor = $cItem['selectedColor'] ?? null;
                if ($cId === $productId && $cColor === $color) {
                    $cItem['quantity'] += $quantity;
                    $found = true;
                    break;
                }
            }

            if (!$found) {
                $currentItems[] = [
                    'product' => $product->toArray(),
                    'quantity' => $quantity,
                    'selectedColor' => $color,
                    'variant_id' => $variantId,
                ];
            }

            $cart->items_json = $currentItems;
            $cart->save();

            return response()->json([
                'success' => true,
                'message' => 'Produk berhasil ditambahkan ke keranjang.',
                'data' => $currentItems,
            ]);
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Clear cart for a user.
     */
    public function clearCart(Request $request): JsonResponse
    {
        try {
            $userId = $request->user()?->id ?: (int) ($request->input('user_id') ?: 1);
            Cart::where('user_id', $userId)->update(['items_json' => []]);

            return response()->json([
                'success' => true,
                'message' => 'Keranjang berhasil dikosongkan.',
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 200);
        }
    }
}
