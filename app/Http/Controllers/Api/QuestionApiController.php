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
     * Get list of questions and answers for a product with pagination.
     */
    public function index(Request $request, int $productId): JsonResponse
    {
        $perPage = min(50, max(5, (int) $request->input('per_page', 20)));

        $questions = ProductQuestion::with(['user', 'answers.shop'])
            ->where('product_id', $productId)
            ->where('status', 'approved')
            ->orderBy('id', 'desc')
            ->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => PublicQuestionResource::collection($questions->items())->resolve(),
            'pagination' => [
                'current_page' => $questions->currentPage(),
                'last_page'    => $questions->lastPage(),
                'total'        => $questions->total(),
            ],
        ]);
    }

    /**
     * Buyer asks a question about a product with spam prevention.
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

        $cleanedQuestion = trim($request->input('question'));

        // Spam prevention: prevent identical question within last 10 minutes
        $duplicate = ProductQuestion::where('product_id', $productId)
            ->where('user_id', $user->id)
            ->where('question', $cleanedQuestion)
            ->where('created_at', '>=', now()->subMinutes(10))
            ->exists();

        if ($duplicate) {
            return response()->json([
                'success' => false,
                'message' => 'Anda sudah mengajukan pertanyaan yang sama baru-baru ini. Mohon tunggu tanggapan penjual.',
            ], 429);
        }

        $question = ProductQuestion::create([
            'product_id' => $productId,
            'user_id' => $user->id,
            'question' => $cleanedQuestion,
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
