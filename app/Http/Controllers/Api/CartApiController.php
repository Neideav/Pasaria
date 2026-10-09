<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CartApiController extends Controller
{
    /**
     * Get cart items using relational cart_items as source of truth.
     */
    public function getCart(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        try {
            $cart = Cart::firstOrCreate(['user_id' => $user->id]);

            $cartItems = CartItem::where('cart_id', $cart->id)
                ->with(['product'])
                ->get();

            $formatted = [];
            foreach ($cartItems as $item) {
                $product = $item->product;
                if (!$product) {
                    continue; // Skip dangling items
                }

                $variant = null;
                $price = (float) $product->price;
                $stock = (int) $product->stock;

                if ($item->variant_id) {
                    $variant = ProductVariant::where('id', $item->variant_id)
                        ->where('product_id', $product->id)
                        ->first();
                    if ($variant) {
                        $price = (float) $variant->price;
                        $stock = (int) $variant->stock;
                    }
                }

                $productArr = $product->toArray();
                $productArr['price'] = $price;
                $productArr['stock'] = $stock;

                $formatted[] = [
                    'id'            => $item->id,
                    'cart_item_id'  => $item->id,
                    'product_id'    => $product->id,
                    'variant_id'    => $item->variant_id,
                    'variant'       => $variant,
                    'quantity'      => (int) $item->quantity,
                    'selectedColor' => $item->selected_color,
                    'price'         => $price,
                    'stock'         => $stock,
                    'product'       => $productArr,
                ];
            }

            return response()->json([
                'success' => true,
                'data'    => $formatted,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => config('app.debug') ? $e->getMessage() : 'Gagal memuat keranjang belanja.',
                'data'    => [],
            ], 500);
        }
    }

    /**
     * Save/sync relational cart items for authenticated user.
     */
    public function syncCart(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        $request->validate([
            'items' => 'present|array',
            'items.*.product_id' => 'required_without:items.*.id|integer',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.variant_id' => 'nullable|integer',
        ]);

        try {
            return DB::transaction(function () use ($user, $request) {
                $cart = Cart::firstOrCreate(['user_id' => $user->id]);
                CartItem::where('cart_id', $cart->id)->delete();

                $rawItems = $request->input('items', []);
                foreach ($rawItems as $item) {
                    $pId = (int) ($item['product_id'] ?? $item['product']['id'] ?? $item['id'] ?? 0);
                    $product = Product::find($pId);
                    if (!$product) continue;

                    $vId = isset($item['variant_id']) ? (int) $item['variant_id'] : null;
                    $qty = max(1, (int) ($item['quantity'] ?? 1));
                    $color = $item['selectedColor'] ?? $item['color'] ?? null;

                    CartItem::create([
                        'cart_id'        => $cart->id,
                        'product_id'     => $product->id,
                        'variant_id'     => $vId,
                        'quantity'       => $qty,
                        'selected_color' => $color,
                    ]);
                }

                return response()->json([
                    'success' => true,
                    'message' => 'Keranjang berhasil disinkronkan ke database.',
                ]);
            });
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => config('app.debug') ? $e->getMessage() : 'Gagal menyinkronkan keranjang.',
            ], 500);
        }
    }

    /**
     * Add single item to cart relational table.
     */
    public function addItem(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        $request->validate([
            'product_id' => 'required|integer',
            'quantity'   => 'required|integer|min:1',
            'variant_id' => 'nullable|integer',
        ]);

        $productId = (int) $request->input('product_id');
        $variantId = $request->has('variant_id') ? (int) $request->input('variant_id') : null;
        $quantity = (int) $request->input('quantity', 1);
        $color = $request->input('selectedColor');

        $product = Product::find($productId);
        if (!$product) {
            return response()->json(['success' => false, 'message' => 'Produk tidak ditemukan.'], 404);
        }

        if ($variantId) {
            $variant = ProductVariant::where('id', $variantId)->where('product_id', $productId)->first();
            if (!$variant) {
                return response()->json(['success' => false, 'message' => 'Varian produk tidak valid.'], 422);
            }
        }

        $cart = Cart::firstOrCreate(['user_id' => $user->id]);

        $itemQuery = CartItem::where('cart_id', $cart->id)
            ->where('product_id', $productId);

        if ($variantId) {
            $itemQuery->where('variant_id', $variantId);
        } else {
            $itemQuery->whereNull('variant_id');
        }

        if ($color) {
            $itemQuery->where('selected_color', $color);
        }

        $existingItem = $itemQuery->first();

        if ($existingItem) {
            $existingItem->increment('quantity', $quantity);
        } else {
            CartItem::create([
                'cart_id'        => $cart->id,
                'product_id'     => $productId,
                'variant_id'     => $variantId,
                'quantity'       => $quantity,
                'selected_color' => $color,
            ]);
        }

        return $this->getCart($request);
    }

    /**
     * Clear cart for authenticated user.
     */
    public function clearCart(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        $cart = Cart::where('user_id', $user->id)->first();
        if ($cart) {
            CartItem::where('cart_id', $cart->id)->delete();
            $cart->update(['items_json' => []]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Keranjang berhasil dikosongkan.',
        ]);
    }
}
