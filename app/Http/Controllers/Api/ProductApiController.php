<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class ProductApiController extends Controller
{
    /**
     * Get products list with search, filter, and SQLi demo mode support.
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
            $maxPrice = (float) $request->input('maxPrice', 999999);
            $minRating = (float) $request->input('minRating', 0);

            $demoSqliMode = Cache::get('demo_sqli_mode', config('shopcart.demo_sqli_mode', env('DEMO_SQLI_MODE', true)));

            $orderByClause = match ($sort) {
                'price-asc' => 'price ASC',
                'price-desc' => 'price DESC',
                'rating' => 'rating DESC',
                'newest' => 'id DESC',
                default => 'id ASC',
            };

            $products = [];

            if (!empty($q)) {
                if ($demoSqliMode) {
                    // ===================================================================
                    // INTENTIONALLY VULNERABLE FOR LOCAL EDUCATIONAL DEMONSTRATION
                    // Direct string interpolation for SQLi demonstration
                    // ===================================================================
                    $rawSql = "SELECT * FROM products WHERE (name LIKE '%{$q}%' OR description LIKE '%{$q}%' OR short_desc LIKE '%{$q}%' OR category LIKE '%{$q}%') AND price >= {$minPrice} AND price <= {$maxPrice} AND rating >= {$minRating} ORDER BY {$orderByClause}";

                    try {
                        $results = DB::select($rawSql);
                        $products = array_map(function ($item) {
                            return (array) $item;
                        }, $results);
                    } catch (\Throwable $sqlErr) {
                        return response()->json([
                            'success' => true,
                            'data' => [],
                            'count' => 0,
                            'sqli_mode' => true,
                            'sql_error' => $sqlErr->getMessage(),
                        ]);
                    }
                } else {
                    // ===================================================================
                    // SECURE IMPLEMENTATION USING ELOQUENT / PARAMETERIZED QUERY
                    // ===================================================================
                    $query = Product::where(function ($query) use ($q) {
                        $query->where('name', 'LIKE', "%{$q}%")
                              ->orWhere('description', 'LIKE', "%{$q}%")
                              ->orWhere('short_desc', 'LIKE', "%{$q}%")
                              ->orWhere('category', 'LIKE', "%{$q}%");
                    })
                    ->where('price', '>=', $minPrice)
                    ->where('price', '<=', $maxPrice)
                    ->where('rating', '>=', $minRating);

                    match ($sort) {
                        'price-asc' => $query->orderBy('price', 'asc'),
                        'price-desc' => $query->orderBy('price', 'desc'),
                        'rating' => $query->orderBy('rating', 'desc'),
                        'newest' => $query->orderBy('id', 'desc'),
                        default => $query->orderBy('id', 'asc'),
                    };

                    $products = $query->get()->toArray();
                }
            } else {
                // Standard listing with filters
                $query = Product::query();

                if (!empty($category) && strtolower($category) !== 'all') {
                    $query->whereRaw('LOWER(category) = ?', [strtolower($category)]);
                }

                if ($minPrice > 0) {
                    $query->where('price', '>=', $minPrice);
                }

                if ($maxPrice < 999999) {
                    $query->where('price', '<=', $maxPrice);
                }

                if ($minRating > 0) {
                    $query->where('rating', '>=', $minRating);
                }

                match ($sort) {
                    'price-asc' => $query->orderBy('price', 'asc'),
                    'price-desc' => $query->orderBy('price', 'desc'),
                    'rating' => $query->orderBy('rating', 'desc'),
                    'newest' => $query->orderBy('id', 'desc'),
                    default => $query->orderBy('id', 'asc'),
                };

                $products = $query->get()->toArray();
            }

            // Helper to parse JSON fields safely
            $formattedProducts = array_map(function ($p) {
                $item = (array) $p;
                if (isset($item['colors']) && is_string($item['colors'])) {
                    $decoded = json_decode($item['colors'], true);
                    $item['colors'] = json_last_error() === JSON_ERROR_NONE ? $decoded : [];
                }
                if (isset($item['specs']) && is_string($item['specs'])) {
                    $decoded = json_decode($item['specs'], true);
                    $item['specs'] = json_last_error() === JSON_ERROR_NONE ? $decoded : (object)[];
                }
                return $item;
            }, $products);

            return response()->json([
                'success' => true,
                'count' => count($formattedProducts),
                'data' => $formattedProducts,
                'sqli_mode' => (bool) $demoSqliMode,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get single product by slug along with related products.
     *
     * @param string $slug
     * @return JsonResponse
     */
    public function show(string $slug): JsonResponse
    {
        try {
            $product = Product::where('slug', $slug)->first();

            if (!$product) {
                return response()->json([
                    'success' => false,
                    'message' => 'Product not found',
                ], 404);
            }

            $productData = $product->toArray();
            if (is_string($productData['colors'])) {
                $productData['colors'] = json_decode($productData['colors'], true) ?? [];
            }
            if (is_string($productData['specs'])) {
                $productData['specs'] = json_decode($productData['specs'], true) ?? (object)[];
            }

            $related = Product::where('category', $product->category)
                ->where('id', '!=', $product->id)
                ->take(4)
                ->get()
                ->map(function ($item) {
                    $arr = $item->toArray();
                    if (is_string($arr['colors'])) {
                        $arr['colors'] = json_decode($arr['colors'], true) ?? [];
                    }
                    if (is_string($arr['specs'])) {
                        $arr['specs'] = json_decode($arr['specs'], true) ?? (object)[];
                    }
                    return $arr;
                });

            return response()->json([
                'success' => true,
                'data' => $productData,
                'related' => $related,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
