<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\UserNotificationPreference;
use App\Models\UserPrivacyPreference;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserPreferenceApiController extends Controller
{
    /**
     * Get notification preferences for the authenticated user.
     */
    public function getNotificationPreferences(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        $preferences = UserNotificationPreference::getOrCreateForUser($user->id);

        return response()->json([
            'success' => true,
            'data'    => $preferences,
        ]);
    }

    /**
     * Update notification preferences for the authenticated user.
     * Enforces persistent storage and protects mandatory security alerts.
     */
    public function updateNotificationPreferences(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        $request->validate([
            'order_updates_email'   => 'nullable|boolean',
            'order_updates_in_app'  => 'nullable|boolean',
            'chat_messages_email'   => 'nullable|boolean',
            'chat_messages_in_app'  => 'nullable|boolean',
            'promotions_email'      => 'nullable|boolean',
            'promotions_in_app'     => 'nullable|boolean',
            'wishlist_alerts_email' => 'nullable|boolean',
            'wishlist_alerts_in_app'=> 'nullable|boolean',
        ]);

        $preferences = UserNotificationPreference::getOrCreateForUser($user->id);

        $updatable = [
            'order_updates_email',
            'order_updates_in_app',
            'chat_messages_email',
            'chat_messages_in_app',
            'promotions_email',
            'promotions_in_app',
            'wishlist_alerts_email',
            'wishlist_alerts_in_app',
        ];

        foreach ($updatable as $key) {
            if ($request->has($key)) {
                $preferences->{$key} = $request->boolean($key);
            }
        }

        // Essential account security notifications are mandatory and cannot be disabled
        $preferences->security_alerts_email = true;
        $preferences->security_alerts_in_app = true;

        $preferences->save();

        return response()->json([
            'success' => true,
            'message' => 'Preferensi notifikasi berhasil disimpan.',
            'data'    => $preferences,
        ]);
    }

    /**
     * Get privacy preferences for the authenticated user.
     */
    public function getPrivacyPreferences(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        $preferences = UserPrivacyPreference::getOrCreateForUser($user->id);

        return response()->json([
            'success' => true,
            'data'    => $preferences,
        ]);
    }

    /**
     * Update privacy preferences for the authenticated user.
     */
    public function updatePrivacyPreferences(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        $request->validate([
            'personalization_enabled' => 'nullable|boolean',
            'marketing_communication' => 'nullable|boolean',
            'activity_logging'        => 'nullable|boolean',
        ]);

        $preferences = UserPrivacyPreference::getOrCreateForUser($user->id);

        $keys = ['personalization_enabled', 'marketing_communication', 'activity_logging'];
        foreach ($keys as $k) {
            if ($request->has($k)) {
                $preferences->{$k} = $request->boolean($k);
            }
        }

        $preferences->save();

        return response()->json([
            'success' => true,
            'message' => 'Pengaturan privasi berhasil diperbarui.',
            'data'    => $preferences,
        ]);
    }
}
