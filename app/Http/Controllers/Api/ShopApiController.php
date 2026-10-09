<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Shop;
use App\Models\User;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ShopApiController extends Controller
{
    /**
     * Get shop profile with products and statistics.
     */
    public function show(string $slugOrId): JsonResponse
    {
        $shop = Shop::withCount(['followers', 'products'])
            ->where('slug', $slugOrId)
            ->orWhere('id', is_numeric($slugOrId) ? (int)$slugOrId : 0)
            ->first();

        if (!$shop) {
            return response()->json(['success' => false, 'message' => 'Toko tidak ditemukan di PASARIA.'], 404);
        }

        $products = Product::where('shop_id', $shop->id)
            ->orderBy('id', 'desc')
            ->get()
            ->map(function ($p) {
                $arr = $p->toArray();
                $arr['price'] = (float) $p->price;
                return $arr;
            });

        $shopData = $shop->toArray();
        $shopData['rating'] = (float) $shop->rating;
        $shopData['followers_count'] = $shop->followers_count;
        $shopData['products_count'] = $shop->products_count;

        return response()->json([
            'success'  => true,
            'data'     => $shopData,
            'products' => $products,
        ]);
    }

    /**
     * Create or register a shop (Seller onboarding).
     */
    public function store(Request $request): JsonResponse
    {
        $user = $request->user()?->fresh() ?? $request->user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        // Email verification requirement for seller registration
        if (!$user->hasVerifiedEmail()) {
            return response()->json([
                'success' => false,
                'message' => 'Silakan verifikasi email Anda terlebih dahulu sebelum mendaftar sebagai penjual.',
            ], 403);
        }

        $protectedFields = ['status', 'verified', 'rating', 'user_id'];
        foreach ($protectedFields as $pf) {
            if ($request->has($pf) && !$user->isAdmin()) {
                return response()->json([
                    'success' => false,
                    'message' => "Field '{$pf}' tidak dapat ditentukan saat pendaftaran toko.",
                ], 422);
            }
        }

        $request->validate([
            'name' => 'required|string|max:100',
        ]);

        $name = trim($request->input('name'));
        $baseSlug = Str::slug($name);
        $slug = $baseSlug;
        $counter = 1;
        while (Shop::where('slug', $slug)->exists()) {
            $slug = $baseSlug . '-' . $counter++;
        }

        // Shop is registered in 'pending' status awaiting administrator approval
        $shop = Shop::updateOrCreate(
            ['user_id' => $user->id],
            [
                'name'        => $name,
                'slug'        => $slug,
                'slogan'      => $request->input('slogan', 'Toko Resmi PASARIA'),
                'description' => $request->input('description', ''),
                'city'        => $request->input('city', 'Jakarta'),
                'phone'       => $request->input('phone', $user->phone),
                'logo'        => $request->input('logo'),
                'banner'      => $request->input('banner'),
                'status'      => 'pending',
                'verified'    => false,
            ]
        );

        // Security rule: Do NOT automatically promote role to seller until admin approves the shop.

        return response()->json([
            'success' => true,
            'message' => 'Pendaftaran toko berhasil diajukan dan sedang menunggu persetujuan administrator PASARIA.',
            'shop'    => $shop,
            'data'    => $shop,
        ], 201);
    }

    /**
     * Update shop profile (Only shop owner or admin).
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        $shop = Shop::find($id);
        if (!$shop) {
            return response()->json(['success' => false, 'message' => 'Toko tidak ditemukan.'], 404);
        }

        if (!$user->isAdmin() && $shop->user_id !== $user->id) {
            return response()->json(['success' => false, 'message' => 'Akses ditolak.'], 403);
        }

        $protectedFields = ['verified', 'status', 'rating', 'user_id', 'total_sales'];
        foreach ($protectedFields as $pf) {
            if ($request->has($pf) && !$user->isAdmin()) {
                return response()->json([
                    'success' => false,
                    'message' => "Field '{$pf}' hanya dapat diubah oleh administrator PASARIA.",
                ], 422);
            }
        }

        $shop->update($request->only([
            'name', 'slogan', 'description', 'city', 'phone', 'logo', 'banner'
        ]));

        return response()->json([
            'success' => true,
            'message' => 'Profil toko berhasil diperbarui.',
            'data'    => $shop,
        ]);
    }

    /**
     * Follow a shop.
     */
    public function follow(Request $request, int $shopId): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        $shop = Shop::find($shopId);
        if (!$shop) {
            return response()->json(['success' => false, 'message' => 'Toko tidak ditemukan.'], 404);
        }

        DB::table('shop_followers')->updateOrInsert(
            ['user_id' => $user->id, 'shop_id' => $shopId],
            ['created_at' => now(), 'updated_at' => now()]
        );

        return response()->json([
            'success' => true,
            'message' => 'Anda sekarang mengikuti ' . $shop->name,
        ]);
    }

    /**
     * Unfollow a shop.
     */
    public function unfollow(Request $request, int $shopId): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        DB::table('shop_followers')
            ->where('user_id', $user->id)
            ->where('shop_id', $shopId)
            ->delete();

        return response()->json([
            'success' => true,
            'message' => 'Berhenti mengikuti toko.',
        ]);
    }

    /**
     * Get shops followed by authenticated user.
     */
    public function following(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        $userId = $user->id;
        $shops = Shop::whereIn('id', function ($query) use ($userId) {
            $query->select('shop_id')->from('shop_followers')->where('user_id', $userId);
        })->withCount('products')->get();

        return response()->json([
            'success' => true,
            'data'    => $shops,
        ]);
    }
}
