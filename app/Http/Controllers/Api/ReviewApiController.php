<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Review;
use App\Models\ReviewMedia;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReviewApiController extends Controller
{
    /**
     * Get reviews and rating breakdown for a product.
     */
    public function index(Request $request, int $productId): JsonResponse
    {
        $perPage = min(50, max(5, (int) $request->input('per_page', 20)));

        $reviews = Review::with(['user', 'media'])
            ->where('product_id', $productId)
            ->where('status', 'approved')
            ->orderBy('id', 'desc')
            ->paginate($perPage);

        // Calculate breakdown from approved reviews
        $allReviews = Review::where('product_id', $productId)->where('status', 'approved')->get();
        $breakdown = [5 => 0, 4 => 0, 3 => 0, 2 => 0, 1 => 0];
        $totalRating = 0;
        foreach ($allReviews as $rev) {
            $star = max(1, min(5, (int) $rev->rating));
            $breakdown[$star]++;
            $totalRating += $star;
        }

        $totalReviews = count($allReviews);
        $averageRating = $totalReviews > 0 ? round($totalRating / $totalReviews, 1) : 5.0;

        return response()->json([
            'success' => true,
            'data' => $reviews->items(),
            'pagination' => [
                'current_page' => $reviews->currentPage(),
                'last_page' => $reviews->lastPage(),
                'total' => $reviews->total(),
            ],
            'summary' => [
                'average_rating' => $averageRating,
                'total_reviews' => $totalReviews,
                'breakdown' => $breakdown,
            ],
        ]);
    }

    /**
     * Submit a product review. Verified purchase strictly enforced without exceptions.
     */
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        $request->validate([
            'product_id' => 'required|integer',
            'rating' => 'required|integer|min:1|max:5',
            'review_text' => 'nullable|string|max:2000',
            'media_urls' => 'nullable|array',
            'media_urls.*' => 'string|max:500',
        ]);

        $productId = (int) $request->input('product_id');
        $product = Product::find($productId);
        if (!$product) {
            return response()->json(['success' => false, 'message' => 'Produk tidak ditemukan.'], 404);
        }

        // 1. Strict verified purchase check: User must have an order with status delivered/completed containing this product
        $orderItem = OrderItem::where('product_id', $productId)
            ->whereHas('order', function ($q) use ($user) {
                $q->where('user_id', $user->id)
                  ->whereIn(DB::raw('LOWER(status)'), ['delivered', 'completed']);
            })
            ->whereDoesntHave('review')
            ->first();

        if (!$orderItem) {
            // Check if user has already reviewed every purchased instance of this product
            $alreadyReviewed = OrderItem::where('product_id', $productId)
                ->whereHas('order', function ($q) use ($user) {
                    $q->where('user_id', $user->id)
                      ->whereIn(DB::raw('LOWER(status)'), ['delivered', 'completed']);
                })
                ->whereHas('review')
                ->exists();

            if ($alreadyReviewed) {
                return response()->json([
                    'success' => false,
                    'message' => 'Anda sudah memberikan ulasan untuk seluruh pesanan produk ini.',
                ], 422);
            }

            return response()->json([
                'success' => false,
                'message' => 'Hanya pembeli terverifikasi yang telah menerima produk ini (status delivered/completed) yang dapat memberikan ulasan.',
            ], 403);
        }

        // 2. Prevent duplicate reviews
        if (Review::where('order_item_id', $orderItem->id)->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Ulasan untuk pesanan ini sudah pernah dikirimkan.',
            ], 422);
        }

        return DB::transaction(function () use ($request, $user, $productId, $product, $orderItem) {
            $review = Review::create([
                'user_id' => $user->id,
                'order_id' => $orderItem->order_id,
                'order_item_id' => $orderItem->id,
                'product_id' => $productId,
                'shop_id' => $product->shop_id ?: 1,
                'rating' => (int) $request->input('rating'),
                'review_text' => trim($request->input('review_text', '')),
                'is_anonymous' => $request->boolean('is_anonymous', false),
                'is_verified_purchase' => true,
                'status' => 'approved',
            ]);

            // Save review media photos if provided
            $mediaUrls = $request->input('media_urls', []);
            if (is_array($mediaUrls)) {
                foreach ($mediaUrls as $url) {
                    if (!empty($url)) {
                        ReviewMedia::create([
                            'review_id' => $review->id,
                            'media_url' => $url,
                            'media_type' => 'image',
                        ]);
                    }
                }
            }

            // Recalculate product rating & review_count
            $allProductReviews = Review::where('product_id', $productId)->where('status', 'approved')->get();
            $newCount = count($allProductReviews);
            $newAvg = $newCount > 0 ? round($allProductReviews->avg('rating'), 1) : 5.0;

            $product->rating = $newAvg;
            $product->review_count = $newCount;
            $product->save();

            return response()->json([
                'success' => true,
                'message' => 'Terima kasih! Ulasan Anda telah berhasil disimpan.',
                'data' => $review->load(['user', 'media']),
            ], 201);
        });
    }

    /**
     * Seller reply to a review. Strictly authorized to the product's shop owner.
     */
    public function reply(Request $request, int $reviewId): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        $review = Review::with('product')->find($reviewId);
        if (!$review) {
            return response()->json(['success' => false, 'message' => 'Ulasan tidak ditemukan.'], 404);
        }

        // Ownership authorization: user must own the shop of this product, or be admin
        if (!$user->isAdmin()) {
            if (!$user->shop || $user->shop->id !== $review->shop_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Anda tidak memiliki hak untuk membalas ulasan toko lain.',
                ], 403);
            }
        }

        $request->validate([
            'reply' => 'required|string|min:2|max:1000',
        ]);

        $review->seller_reply = trim($request->input('reply'));
        $review->replied_at = now();
        $review->save();

        return response()->json([
            'success' => true,
            'message' => 'Balasan penjual berhasil dikirim.',
            'data' => $review,
        ]);
    }
}
