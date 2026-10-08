<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationApiController extends Controller
{
    /**
     * Get user notifications.
     */
    public function index(Request $request): JsonResponse
    {
        $userId = $request->user()?->id ?: (int) ($request->input('user_id') ?: 1);

        $notifications = Notification::where('user_id', $userId)
            ->orderBy('id', 'desc')
            ->take(30)
            ->get();

        $unreadCount = Notification::where('user_id', $userId)->where('is_read', false)->count();

        return response()->json([
            'success' => true,
            'data' => $notifications,
            'unread_count' => $unreadCount,
        ]);
    }

    /**
     * Mark notification as read.
     */
    public function markAsRead(Request $request, int $id): JsonResponse
    {
        $userId = $request->user()?->id ?: (int) ($request->input('user_id') ?: 1);

        Notification::where('id', $id)->where('user_id', $userId)->update(['is_read' => true]);

        return response()->json([
            'success' => true,
            'message' => 'Notifikasi ditandai telah dibaca.',
        ]);
    }

    /**
     * Mark all notifications as read.
     */
    public function markAllAsRead(Request $request): JsonResponse
    {
        $userId = $request->user()?->id ?: (int) ($request->input('user_id') ?: 1);

        Notification::where('user_id', $userId)->update(['is_read' => true]);

        return response()->json([
            'success' => true,
            'message' => 'Semua notifikasi ditandai telah dibaca.',
        ]);
    }
}
