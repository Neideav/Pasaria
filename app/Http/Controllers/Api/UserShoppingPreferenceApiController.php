<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Brand;
use App\Models\Category;
use App\Models\UserShoppingPreference;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserShoppingPreferenceApiController extends Controller
{
    /**
     * Get shopping preferences for the authenticated user along with catalog metadata.
     */
    public function getPreferences(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        $preferences = UserShoppingPreference::getOrCreateForUser($user->id);

        $availableCategories = Category::select('id', 'name', 'slug')->orderBy('name')->get();
        $availableBrands = Brand::select('id', 'name', 'slug')->orderBy('name')->get();

        return response()->json([
            'success'              => true,
            'data'                 => $preferences,
            'available_categories' => $availableCategories,
            'available_brands'     => $availableBrands,
        ]);
    }

    /**
     * Update shopping and catalog preferences for the authenticated user.
     */
    public function updatePreferences(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        $request->validate([
            'favorite_categories'            => 'nullable|array',
            'favorite_categories.*'          => 'string|max:100',
            'favorite_brands'                => 'nullable|array',
            'favorite_brands.*'              => 'string|max:100',
            'min_price'                      => 'nullable|numeric|min:0|max:1000000000',
            'max_price'                      => 'nullable|numeric|min:0|max:1000000000',
            'hide_out_of_stock'              => 'nullable|boolean',
            'prioritize_official_stores'     => 'nullable|boolean',
            'default_sort'                   => 'nullable|string|in:popular,price_asc,price_desc,rating,newest',
            'preferred_density'              => 'nullable|string|in:comfortable,compact',
            'recommendation_personalization' => 'nullable|boolean',
            'theme'                          => 'nullable|string|in:light,dark,system',
            'font_size'                      => 'nullable|string|in:normal,large',
            'reduced_motion'                 => 'nullable|boolean',
            'high_contrast'                  => 'nullable|boolean',
        ]);

        $minPrice = $request->has('min_price') ? ($request->input('min_price') !== null ? (float) $request->input('min_price') : null) : null;
        $maxPrice = $request->has('max_price') ? ($request->input('max_price') !== null ? (float) $request->input('max_price') : null) : null;

        if ($minPrice !== null && $maxPrice !== null && $minPrice > $maxPrice) {
            return response()->json([
                'success' => false,
                'message' => 'Harga minimum tidak boleh lebih besar dari harga maksimum.',
                'errors'  => [
                    'min_price' => ['Harga minimum tidak boleh lebih besar dari harga maksimum.'],
                ],
            ], 422);
        }

        $preferences = UserShoppingPreference::getOrCreateForUser($user->id);

        if ($request->has('favorite_categories')) {
            $preferences->favorite_categories = array_values(array_unique(array_filter($request->input('favorite_categories'))));
        }

        if ($request->has('favorite_brands')) {
            $preferences->favorite_brands = array_values(array_unique(array_filter($request->input('favorite_brands'))));
        }

        if ($request->has('min_price')) {
            $preferences->min_price = $minPrice;
        }

        if ($request->has('max_price')) {
            $preferences->max_price = $maxPrice;
        }

        $booleanKeys = [
            'hide_out_of_stock',
            'prioritize_official_stores',
            'recommendation_personalization',
            'reduced_motion',
            'high_contrast',
        ];

        foreach ($booleanKeys as $key) {
            if ($request->has($key)) {
                $preferences->{$key} = $request->boolean($key);
            }
        }

        $stringKeys = ['default_sort', 'preferred_density', 'theme', 'font_size'];
        foreach ($stringKeys as $key) {
            if ($request->has($key) && !empty($request->input($key))) {
                $preferences->{$key} = trim((string) $request->input($key));
            }
        }

        $preferences->save();

        return response()->json([
            'success' => true,
            'message' => 'Preferensi belanja berhasil disimpan.',
            'data'    => $preferences,
        ]);
    }
}
