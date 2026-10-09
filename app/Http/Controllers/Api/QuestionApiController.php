<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\PublicQuestionResource;
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
            'data' => PublicQuestionResource::collection($questions)->resolve(),
        ]);
    }

    /**
     * Buyer asks a question about a product.
     */
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

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
            'user_id' => $user->id,
            'question' => trim($request->input('question')),
            'is_public' => true,
            'status' => 'approved',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Pertanyaan Anda telah diajukan kepada penjual.',
            'data' => (new PublicQuestionResource($question->load('user')))->resolve(),
        ], 201);
    }

    /**
     * Seller answers a question about their product.
     */
    public function answer(Request $request, int $questionId): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        $question = ProductQuestion::with('product')->find($questionId);
        if (!$question) {
            return response()->json(['success' => false, 'message' => 'Pertanyaan tidak ditemukan.'], 404);
        }

        // Ownership check: seller must own product's shop, or be admin
        if (!$user->isAdmin()) {
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

        $shopId = $user->shop ? $user->shop->id : $question->product->shop_id;

        $answer = ProductAnswer::create([
            'question_id' => $questionId,
            'user_id' => $user->id,
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
