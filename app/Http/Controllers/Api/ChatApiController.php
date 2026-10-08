<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\Shop;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ChatApiController extends Controller
{
    /**
     * List user's conversations (as customer or seller).
     */
    public function getConversations(Request $request): JsonResponse
    {
        $user = $request->user();
        $userId = $user ? $user->id : (int) ($request->input('user_id') ?: 1);

        $query = Conversation::with(['shop', 'customer'])
            ->withCount(['messages as unread_count' => function ($q) use ($userId) {
                $q->where('is_read', false)->where('sender_id', '!=', $userId);
            }])
            ->orderBy('last_message_at', 'desc');

        if ($user && $user->isSeller() && $user->shop) {
            $query->where('shop_id', $user->shop->id);
        } else {
            $query->where('customer_id', $userId);
        }

        $conversations = $query->get()->map(function ($c) {
            $lastMsg = $c->messages()->latest()->first();
            $arr = $c->toArray();
            $arr['last_message'] = $lastMsg ? $lastMsg->message : 'Belum ada pesan';
            return $arr;
        });

        return response()->json([
            'success' => true,
            'data' => $conversations,
        ]);
    }

    /**
     * Get messages in a conversation.
     */
    public function getMessages(Request $request, int $conversationId): JsonResponse
    {
        $user = $request->user();
        $userId = $user ? $user->id : (int) ($request->input('user_id') ?: 1);

        $conversation = Conversation::with(['shop', 'customer'])->find($conversationId);
        if (!$conversation) {
            return response()->json(['success' => false, 'message' => 'Percakapan tidak ditemukan.'], 404);
        }

        // Ownership check
        if ($user && !$user->isAdmin()) {
            $isCustomer = $conversation->customer_id === $user->id;
            $isSeller = $user->shop && $conversation->shop_id === $user->shop->id;
            if (!$isCustomer && !$isSeller) {
                return response()->json(['success' => false, 'message' => 'Akses ditolak.'], 403);
            }
        }

        // Mark incoming messages as read
        Message::where('conversation_id', $conversationId)
            ->where('sender_id', '!=', $userId)
            ->update(['is_read' => true]);

        $messages = Message::where('conversation_id', $conversationId)
            ->orderBy('created_at', 'asc')
            ->get();

        return response()->json([
            'success' => true,
            'conversation' => $conversation,
            'data' => $messages,
        ]);
    }

    /**
     * Send a message in a conversation.
     */
    public function sendMessage(Request $request): JsonResponse
    {
        $user = $request->user();
        $userId = $user ? $user->id : (int) ($request->input('user_id') ?: 1);

        $request->validate([
            'conversation_id' => 'required|integer',
            'message' => 'required|string|min:1|max:2000',
        ]);

        $conversationId = (int) $request->input('conversation_id');
        $conversation = Conversation::find($conversationId);
        if (!$conversation) {
            return response()->json(['success' => false, 'message' => 'Percakapan tidak ditemukan.'], 404);
        }

        $senderType = ($user && $user->shop && $user->shop->id === $conversation->shop_id)
            ? 'seller'
            : 'customer';

        $msg = Message::create([
            'conversation_id' => $conversationId,
            'sender_id' => $userId,
            'sender_type' => $senderType,
            'message' => trim($request->input('message')),
            'attachment_url' => $request->input('attachment_url'),
            'is_read' => false,
        ]);

        $conversation->last_message_at = now();
        $conversation->save();

        return response()->json([
            'success' => true,
            'data' => $msg,
        ], 201);
    }

    /**
     * Start or retrieve conversation with a shop.
     */
    public function startConversation(Request $request): JsonResponse
    {
        $user = $request->user();
        $userId = $user ? $user->id : (int) ($request->input('user_id') ?: 1);
        $shopId = (int) $request->input('shop_id', 1);

        $conversation = Conversation::firstOrCreate(
            ['shop_id' => $shopId, 'customer_id' => $userId],
            ['last_message_at' => now()]
        );

        return response()->json([
            'success' => true,
            'data' => $conversation->load(['shop', 'customer']),
        ]);
    }
}
