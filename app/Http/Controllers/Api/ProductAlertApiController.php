<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductAlert;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductAlertApiController extends Controller
{
    /**
     * List existing product alerts for the authenticated user.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        $alerts = ProductAlert::with(['product:id,name,slug,price,original_price,image,stock,is_active,shop_id,shop_name'])
            ->where('user_id', $user->id)
            ->orderBy('id', 'desc')
            ->get()
            ->map(function ($alert) {
                return [
                    'id'                  => $alert->id,
                    'user_id'             => $alert->user_id,
                    'product_id'          => $alert->product_id,
                    'alert_type'          => $alert->alert_type,
                    'target_price'        => $alert->target_price ? (float) $alert->target_price : null,
                    'last_observed_price' => $alert->last_observed_price ? (float) $alert->last_observed_price : null,
                    'is_active'           => (bool) $alert->is_active,
                    'last_notified_at'    => $alert->last_notified_at,
                    'created_at'          => $alert->created_at,
                    'product'             => $alert->product ? [
                        'id'             => $alert->product->id,
                        'name'           => $alert->product->name,
                        'slug'           => $alert->product->slug,
                        'price'          => (float) $alert->product->price,
                        'original_price' => $alert->product->original_price ? (float) $alert->product->original_price : null,
                        'image'          => $alert->product->image,
                        'stock'          => (int) $alert->product->stock,
                        'is_active'      => (bool) $alert->product->is_active,
                        'shop_name'      => $alert->product->shop_name,
                    ] : null,
                ];
            });

        return response()->json([
            'success' => true,
            'data'    => $alerts,
        ]);
    }

    /**
     * Create a new product alert subscription.
     */
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        $request->validate([
            'product_id'   => 'required|integer|exists:products,id',
            'alert_type'   => 'required|string|in:price_drop,back_in_stock,target_price,shop_new_product',
            'target_price' => 'nullable|numeric|min:0|max:1000000000',
        ]);

        $productId = (int) $request->input('product_id');
        $alertType = (string) $request->input('alert_type');
        $targetPrice = $request->has('target_price') && $request->input('target_price') !== null
            ? (float) $request->input('target_price')
            : null;

        $product = Product::find($productId);
        if (!$product) {
            return response()->json(['success' => false, 'message' => 'Produk tidak ditemukan.'], 404);
        }

        // Check if an alert for this user, product, and alert_type already exists
        $existing = ProductAlert::where('user_id', $user->id)
            ->where('product_id', $productId)
            ->where('alert_type', $alertType)
            ->first();

        if ($existing) {
            $existing->is_active = true;
            if ($targetPrice !== null) {
                $existing->target_price = $targetPrice;
            }
            $existing->last_observed_price = $product->price;
            $existing->save();

            return response()->json([
                'success' => true,
                'message' => 'Pengingat produk berhasil diperbarui dan diaktifkan.',
                'data'    => $existing->load('product'),
            ], 200);
        }

        $alert = ProductAlert::create([
            'user_id'             => $user->id,
            'product_id'          => $productId,
            'alert_type'          => $alertType,
            'target_price'        => $targetPrice,
            'last_observed_price' => $product->price,
            'is_active'           => true,
            'last_notified_at'    => null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Pengingat produk berhasil dibuat.',
            'data'    => $alert->load('product'),
        ], 201);
    }

    /**
     * Update an alert (change target price or toggle active status).
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        $alert = ProductAlert::where('id', $id)
            ->where('user_id', $user->id)
            ->first();

        if (!$alert) {
            return response()->json([
                'success' => false,
                'message' => 'Pengingat produk tidak ditemukan atau Anda tidak memiliki akses.',
            ], 404);
        }

        $request->validate([
            'is_active'    => 'nullable|boolean',
            'target_price' => 'nullable|numeric|min:0|max:1000000000',
        ]);

        if ($request->has('is_active')) {
            $alert->is_active = $request->boolean('is_active');
        }

        if ($request->has('target_price')) {
            $alert->target_price = $request->input('target_price') !== null ? (float) $request->input('target_price') : null;
        }

        $alert->save();

        return response()->json([
            'success' => true,
            'message' => 'Pengingat produk berhasil diperbarui.',
            'data'    => $alert->load('product'),
        ]);
    }

    /**
     * Delete an alert.
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        $alert = ProductAlert::where('id', $id)
            ->where('user_id', $user->id)
            ->first();

        if (!$alert) {
            return response()->json([
                'success' => false,
                'message' => 'Pengingat produk tidak ditemukan atau Anda tidak memiliki akses.',
            ], 404);
        }

        $alert->delete();

        return response()->json([
            'success' => true,
            'message' => 'Pengingat produk berhasil dihapus.',
        ]);
    }
}
