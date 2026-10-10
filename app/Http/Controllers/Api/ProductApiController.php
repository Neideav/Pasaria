<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\PublicQuestionResource;
use App\Http\Resources\PublicReviewResource;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\ProductImage;
use App\Models\Shop;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ProductApiController extends Controller
{
    /**
     * Get products list with search, filter, and pagination support.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $q = trim($request->input('q', ''));
            $category = trim($request->input('category', ''));
            $sort = $request->input('sort', 'popular');
            $minPrice = (float) $request->input('minPrice', 0);
            $maxPrice = (float) $request->input('maxPrice', 999999999);
            $minRating = (float) $request->input('minRating', 0);
            $shopId = $request->input('shop_id');
            $perPage = min(100, max(6, (int) $request->input('per_page', 24)));

            $formattedProducts = [];

            // Parameterized Eloquent Query
            $query = Product::with(['variants', 'shop']);

            if (!empty($q)) {
                $query->where(function ($sub) use ($q) {
                    $sub->where('name', 'LIKE', "%{$q}%")
                        ->orWhere('description', 'LIKE', "%{$q}%")
                        ->orWhere('short_desc', 'LIKE', "%{$q}%")
                        ->orWhere('category', 'LIKE', "%{$q}%");
                });
            }

            if (!empty($category) && strtolower($category) !== 'all') {
                $query->whereRaw('LOWER(category) = ?', [strtolower($category)]);
            }

            if ($minPrice > 0) {
                $query->where('price', '>=', $minPrice);
            }

            if ($maxPrice < 999999999) {
                $query->where('price', '<=', $maxPrice);
            }

            if ($minRating > 0) {
                $query->where('rating', '>=', $minRating);
            }

            if (!empty($shopId)) {
                $query->where('shop_id', (int) $shopId);
            }

            match ($sort) {
                'price-asc'  => $query->orderBy('price', 'asc'),
                'price-desc' => $query->orderBy('price', 'desc'),
                'rating'     => $query->orderBy('rating', 'desc'),
                'newest'     => $query->orderBy('id', 'desc'),
                default      => $query->orderBy('id', 'asc'),
            };

            $paginated = $query->paginate($perPage);
            $products = $paginated->items();
            $totalCount = $paginated->total();

            // Normalization
            foreach ($products as $p) {
                $item = is_array($p) ? $p : $p->toArray();
                $item['id'] = (int) ($item['id'] ?? 0);
                $item['price'] = (float) ($item['price'] ?? 0);
                $item['original_price'] = isset($item['original_price']) && $item['original_price'] !== null ? (float) $item['original_price'] : null;
                $item['monthly_price'] = isset($item['monthly_price']) && $item['monthly_price'] !== null ? (float) $item['monthly_price'] : null;
                $item['rating'] = (float) ($item['rating'] ?? 5.0);
                $item['review_count'] = (int) ($item['review_count'] ?? 0);
                $item['stock'] = (int) ($item['stock'] ?? 0);
                $item['shop_id'] = (int) ($item['shop_id'] ?? 1);
                $item['shop_name'] = $item['shop_name'] ?? 'PASARIA Official Store';
                $item['shop_city'] = $item['shop_city'] ?? 'Jakarta';

                if (isset($item['colors']) && is_string($item['colors'])) {
                    $decoded = json_decode($item['colors'], true);
                    $item['colors'] = json_last_error() === JSON_ERROR_NONE ? $decoded : [];
                }
                if (isset($item['specs']) && is_string($item['specs'])) {
                    $decoded = json_decode($item['specs'], true);
                    $item['specs'] = json_last_error() === JSON_ERROR_NONE ? $decoded : (object)[];
                }
                $formattedProducts[] = $item;
            }

            return response()->json([
                'success'   => true,
                'count'     => $totalCount,
                'data'      => $formattedProducts,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => config('app.debug') ? $e->getMessage() : 'Gagal memuat katalog produk.',
            ], 500);
        }
    }

    /**
     * Get single product by slug or ID with full details.
     */
    public function show(string $slug): JsonResponse
    {
        try {
            $product = Product::with([
                'variants',
                'images',
                'shop',
                'reviews' => function ($q) {
                    $q->where('status', 'approved')->with(['user', 'media'])->latest()->take(20);
                },
                'questions' => function ($q) {
                    $q->where('status', 'approved')->with(['user', 'answers.shop'])->latest()->take(20);
                },
            ])
                ->where('slug', $slug)
                ->orWhere('id', is_numeric($slug) ? (int)$slug : 0)
                ->first();

            if (!$product) {
                return response()->json([
                    'success' => false,
                    'message' => 'Produk tidak ditemukan di PASARIA.',
                ], 404);
            }

            $productData = $product->toArray();
            $productData['id'] = (int) ($productData['id'] ?? 0);
            $productData['price'] = (float) ($productData['price'] ?? 0);
            $productData['original_price'] = isset($productData['original_price']) && $productData['original_price'] !== null ? (float) $productData['original_price'] : null;
            $productData['monthly_price'] = isset($productData['monthly_price']) && $productData['monthly_price'] !== null ? (float) $productData['monthly_price'] : null;
            $productData['rating'] = (float) ($productData['rating'] ?? 5.0);
            $productData['review_count'] = (int) ($productData['review_count'] ?? 0);
            $productData['stock'] = (int) ($productData['stock'] ?? 0);
            if (is_string($productData['colors'] ?? null)) {
                $productData['colors'] = json_decode($productData['colors'], true) ?? [];
            }
            if (is_string($productData['specs'] ?? null)) {
                $productData['specs'] = json_decode($productData['specs'], true) ?? (object)[];
            }

            // Scrub privacy data from nested reviews and questions
            $productData['reviews'] = PublicReviewResource::collection($product->reviews)->resolve();
            $productData['questions'] = PublicQuestionResource::collection($product->questions)->resolve();

            $related = Product::where('category', $product->category)
                ->where('id', '!=', $product->id)
                ->take(4)
                ->get()
                ->map(function ($item) {
                    $arr = $item->toArray();
                    $arr['price'] = (float) $item->price;
                    return $arr;
                });

            return response()->json([
                'success' => true,
                'data'    => $productData,
                'related' => $related,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => config('app.debug') ? $e->getMessage() : 'Gagal memuat detail produk.',
            ], 500);
        }
    }

    /**
     * Store a new product. Strictly authorized to Seller or Admin.
     */
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        if (!$user->isSeller() && !$user->isAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Hanya penjual atau administrator yang dapat menambahkan produk.',
            ], 403);
        }

        $shop = $user->shop;
        if (!$shop && !$user->isAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Anda belum memiliki toko terdaftar untuk menambahkan produk.',
            ], 403);
        }

        if (!$user->isAdmin() && (!$shop || $shop->status !== 'approved')) {
            return response()->json([
                'success' => false,
                'message' => 'Toko Anda belum disetujui untuk menjual produk di PASARIA.',
            ], 403);
        }

        $request->validate([
            'name'           => 'required|string|max:255',
            'category'       => 'required|string|max:100',
            'price'          => 'required|numeric|min:0',
            'original_price' => 'nullable|numeric|min:0',
            'stock'          => 'required|integer|min:0|max:1000000',
            'short_desc'     => 'nullable|string|max:500',
            'description'    => 'nullable|string',
            'image'          => 'nullable|string|max:500',
            'variants'       => 'nullable|array',
            'variants.*.name'=> 'required_with:variants|string|max:100',
            'variants.*.price'=> 'required_with:variants|numeric|min:0',
            'variants.*.stock'=> 'required_with:variants|integer|min:0',
        ]);

        if ($request->has('rating') || $request->has('review_count')) {
            return response()->json([
                'success' => false,
                'message' => 'Field rating atau review_count tidak boleh dimanipulasi secara manual.',
            ], 422);
        }

        if ($request->has('shop_id') && !$user->isAdmin()) {
            if ((int) $request->input('shop_id') !== (int) ($shop ? $shop->id : 0)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Anda tidak diizinkan membuat produk atas nama toko lain.',
                ], 403);
            }
        }

        $shopId = $shop ? $shop->id : 1;
        $shopName = $shop ? $shop->name : 'PASARIA Official Store';
        $shopCity = $shop ? $shop->city : 'Jakarta';

        $name = trim($request->input('name'));
        $baseSlug = Str::slug($name);
        $slug = $baseSlug;
        $counter = 1;
        while (Product::where('slug', $slug)->exists()) {
            $slug = $baseSlug . '-' . $counter++;
        }

        $product = Product::create([
            'name'           => $name,
            'slug'           => $slug,
            'category'       => trim($request->input('category')),
            'price'          => (float) $request->input('price'),
            'original_price' => $request->has('original_price') ? (float) $request->input('original_price') : null,
            'monthly_price'  => $request->has('monthly_price') ? (float) $request->input('monthly_price') : null,
            'short_desc'     => $request->input('short_desc'),
            'description'    => $request->input('description', ''),
            'image'          => $request->input('image', 'airpods-max'),
            'rating'         => 5.0,
            'review_count'   => 0,
            'stock'          => (int) $request->input('stock', 10),
            'colors'         => $request->input('colors', []),
            'specs'          => $request->input('specs', []),
            'shop_id'        => $shopId,
            'shop_name'      => $shopName,
            'shop_logo'      => $shop?->logo,
            'shop_city'      => $shopCity,
        ]);

        // Add variants if provided
        $variants = $request->input('variants', []);
        if (is_array($variants) && count($variants) > 0) {
            foreach ($variants as $v) {
                ProductVariant::create([
                    'product_id'   => $product->id,
                    'sku'          => $v['sku'] ?? ('SKU-' . strtoupper(Str::random(6))),
                    'name'         => $v['name'] ?? 'Default Variant',
                    'price'        => (float) ($v['price'] ?? $product->price),
                    'stock'        => (int) ($v['stock'] ?? 10),
                    'weight_grams' => (int) ($v['weight_grams'] ?? 200),
                ]);
            }
        }

        return response()->json([
            'success' => true,
            'product' => $product->load(['variants', 'shop'])->toArray(),
            'message' => 'Produk berhasil ditambahkan ke PASARIA!',
        ], 201);
    }

    /**
     * Update an existing product. Strictly authorized to the owning Seller or Admin.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        if (!$user->isSeller() && !$user->isAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Hanya penjual atau administrator yang dapat mengubah produk.',
            ], 403);
        }

        $product = Product::with(['variants', 'shop'])->find($id);
        if (!$product) {
            return response()->json(['success' => false, 'message' => 'Produk tidak ditemukan.'], 404);
        }

        // Ownership check: seller must own product's shop, or user must be admin
        if (!$user->isAdmin()) {
            if (!$user->shop || $user->shop->id !== $product->shop_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Anda tidak memiliki hak untuk mengubah produk toko lain.',
                ], 403);
            }
            if ($user->shop->status !== 'approved') {
                return response()->json([
                    'success' => false,
                    'message' => 'Toko Anda belum disetujui atau sedang ditangguhkan.',
                ], 403);
            }
        }

        // Protection against internal fields manipulation
        if ($request->has('rating') || $request->has('review_count')) {
            return response()->json([
                'success' => false,
                'message' => 'Field rating atau review_count tidak boleh dimanipulasi secara manual.',
            ], 422);
        }

        if ($request->has('shop_id') && !$user->isAdmin()) {
            if ((int) $request->input('shop_id') !== (int) $product->shop_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Kepemilikan toko produk tidak dapat diubah.',
                ], 403);
            }
        }

        $request->validate([
            'name'           => 'sometimes|required|string|max:255',
            'category'       => 'sometimes|required|string|max:100',
            'price'          => 'sometimes|required|numeric|min:0',
            'original_price' => 'nullable|numeric|min:0',
            'stock'          => 'sometimes|required|integer|min:0|max:1000000',
            'short_desc'     => 'nullable|string|max:500',
            'description'    => 'nullable|string',
            'image'          => 'nullable|string|max:500',
            'is_active'      => 'nullable|boolean',
            'variants'       => 'nullable|array',
            'variants.*.name'=> 'required_with:variants|string|max:100',
            'variants.*.price'=> 'required_with:variants|numeric|min:0',
            'variants.*.stock'=> 'required_with:variants|integer|min:0',
        ]);

        if ($request->has('name') && trim($request->input('name')) !== $product->name) {
            $product->name = trim($request->input('name'));
            $baseSlug = Str::slug($product->name);
            $slug = $baseSlug;
            $counter = 1;
            while (Product::where('slug', $slug)->where('id', '!=', $product->id)->exists()) {
                $slug = $baseSlug . '-' . $counter++;
            }
            $product->slug = $slug;
        }

        if ($request->has('category')) {
            $product->category = trim($request->input('category'));
        }
        if ($request->has('price')) {
            $product->price = (float) $request->input('price');
        }
        if ($request->has('original_price')) {
            $product->original_price = $request->input('original_price') !== null ? (float) $request->input('original_price') : null;
        }
        if ($request->has('monthly_price')) {
            $product->monthly_price = $request->input('monthly_price') !== null ? (float) $request->input('monthly_price') : null;
        }
        if ($request->has('stock')) {
            $product->stock = (int) $request->input('stock');
        }
        if ($request->has('short_desc')) {
            $product->short_desc = $request->input('short_desc');
        }
        if ($request->has('description')) {
            $product->description = $request->input('description', '');
        }
        if ($request->has('image')) {
            $product->image = $request->input('image');
        }
        if ($request->has('is_active')) {
            $product->is_active = $request->boolean('is_active');
        }
        if ($request->has('colors')) {
            $product->colors = $request->input('colors');
        }
        if ($request->has('specs')) {
            $product->specs = $request->input('specs');
        }

        $product->save();

        // Update or recreate variants if provided
        if ($request->has('variants') && is_array($request->input('variants'))) {
            $variants = $request->input('variants');
            foreach ($variants as $v) {
                if (isset($v['id']) && $v['id']) {
                    ProductVariant::where('id', $v['id'])->where('product_id', $product->id)->update([
                        'name'         => $v['name'],
                        'price'        => (float) $v['price'],
                        'stock'        => (int) $v['stock'],
                        'weight_grams' => (int) ($v['weight_grams'] ?? 200),
                    ]);
                } else {
                    ProductVariant::create([
                        'product_id'   => $product->id,
                        'sku'          => $v['sku'] ?? ('SKU-' . strtoupper(Str::random(6))),
                        'name'         => $v['name'],
                        'price'        => (float) ($v['price'] ?? $product->price),
                        'stock'        => (int) ($v['stock'] ?? 10),
                        'weight_grams' => (int) ($v['weight_grams'] ?? 200),
                    ]);
                }
            }
        }

        return response()->json([
            'success' => true,
            'data'    => $product->fresh()->load(['variants', 'shop'])->toArray(),
            'product' => $product->fresh()->load(['variants', 'shop'])->toArray(),
            'message' => 'Produk berhasil diperbarui.',
        ]);
    }

    /**
     * Toggle active/inactive status of a product.
     */
    public function toggleStatus(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        $product = Product::find($id);
        if (!$product) {
            return response()->json(['success' => false, 'message' => 'Produk tidak ditemukan.'], 404);
        }

        // Ownership check
        if (!$user->isAdmin()) {
            if (!$user->shop || $user->shop->id !== $product->shop_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Anda tidak memiliki hak untuk mengubah status produk toko lain.',
                ], 403);
            }
        }

        if ($request->has('is_active')) {
            $product->is_active = $request->boolean('is_active');
        } else {
            $product->is_active = !$product->is_active;
        }
        $product->save();

        $statusLabel = $product->is_active ? 'diaktifkan' : 'dinonaktifkan';

        return response()->json([
            'success'   => true,
            'is_active' => (bool) $product->is_active,
            'product'   => $product,
            'message'   => "Produk berhasil {$statusLabel}.",
        ]);
    }

    /**
     * Delete a product by ID with strict ownership authorization and safe soft-delete.
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        $product = Product::find($id);
        if (!$product) {
            return response()->json(['success' => false, 'message' => 'Produk tidak ditemukan.'], 404);
        }

        // Ownership check: seller must own product's shop, or user must be admin
        if (!$user->isAdmin()) {
            if (!$user->shop || $user->shop->id !== $product->shop_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Anda tidak memiliki hak untuk menghapus produk toko lain.',
                ], 403);
            }
            if ($user->shop->status !== 'approved') {
                return response()->json([
                    'success' => false,
                    'message' => 'Toko Anda belum disetujui atau sedang ditangguhkan.',
                ], 403);
            }
        }

        // Soft delete safe preservation: de-activate first, then soft delete
        $product->is_active = false;
        $product->save();
        $product->delete();

        return response()->json(['success' => true, 'message' => 'Produk berhasil dihapus.']);
    }
}
