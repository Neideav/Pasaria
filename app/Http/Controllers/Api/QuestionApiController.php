<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductQuestion;
use App\Models\ProductAnswer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class QuestionApiController extends Controller
{
    /**
     * Get list of questions and answers for a product.
     */
    public function index(int $productId): JsonResponse
    {
        $questions = ProductQuestion::with(['user', 'answers.shop'])
            ->where('product_id', $productId)
            ->where('status', 'approved')
            ->orderBy('id', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $questions,
        ]);
    }

    /**
     * Buyer asks a question about a product.
     */
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();
        $userId = $user ? $user->id : (int) ($request->input('user_id') ?: 1);

        $request->validate([
            'product_id' => 'required|integer',
            'question' => 'required|string|min:5|max:1000',
        ]);

        $productId = (int) $request->input('product_id');
        $product = Product::find($productId);
        if (!$product) {
            return response()->json(['success' => false, 'message' => 'Produk tidak ditemukan.'], 404);
        }

        $question = ProductQuestion::create([
            'product_id' => $productId,
            'user_id' => $userId,
            'question' => trim($request->input('question')),
            'is_public' => true,
            'status' => 'approved',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Pertanyaan Anda telah diajukan kepada penjual.',
            'data' => $question->load('user'),
        ], 201);
    }

    /**
     * Seller answers a question about their product.
     */
    public function answer(Request $request, int $questionId): JsonResponse
    {
        $user = $request->user();
        $question = ProductQuestion::with('product')->find($questionId);

        if (!$question) {
            return response()->json(['success' => false, 'message' => 'Pertanyaan tidak ditemukan.'], 404);
        }

        // Ownership check: seller must own product's shop, or be admin
        if ($user && !$user->isAdmin()) {
            if (!$user->shop || $user->shop->id !== $question->product->shop_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Hanya pemilik toko yang dapat menjawab pertanyaan produk ini.',
                ], 403);
            }
        }

        $request->validate([
            'answer' => 'required|string|min:2|max:1000',
        ]);

        $shopId = $user?->shop?->id ?: ($question->product->shop_id ?: 1);

        $answer = ProductAnswer::create([
            'question_id' => $questionId,
            'user_id' => $user?->id ?: 1,
            'shop_id' => $shopId,
            'answer' => trim($request->input('answer')),
            'status' => 'approved',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Jawaban berhasil disimpan.',
            'data' => $answer->load('shop'),
        ], 201);
    }
}
