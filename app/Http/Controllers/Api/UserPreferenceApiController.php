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
            'order_updates_email'     => 'nullable|boolean',
            'order_updates_in_app'    => 'nullable|boolean',
            'chat_messages_email'     => 'nullable|boolean',
            'chat_messages_in_app'    => 'nullable|boolean',
            'promotions_email'        => 'nullable|boolean',
            'promotions_in_app'       => 'nullable|boolean',
            'wishlist_alerts_email'   => 'nullable|boolean',
            'wishlist_alerts_in_app'  => 'nullable|boolean',
            'shipping_updates_email'  => 'nullable|boolean',
            'shipping_updates_in_app' => 'nullable|boolean',
            'product_qa_email'        => 'nullable|boolean',
            'product_qa_in_app'       => 'nullable|boolean',
            'review_activity_email'   => 'nullable|boolean',
            'review_activity_in_app'  => 'nullable|boolean',
            'shop_updates_email'      => 'nullable|boolean',
            'shop_updates_in_app'     => 'nullable|boolean',
            'price_alerts_email'      => 'nullable|boolean',
            'price_alerts_in_app'     => 'nullable|boolean',
            'stock_alerts_email'      => 'nullable|boolean',
            'stock_alerts_in_app'     => 'nullable|boolean',
            'quiet_hours_enabled'     => 'nullable|boolean',
            'quiet_hours_start'       => 'nullable|string|max:10',
            'quiet_hours_end'         => 'nullable|string|max:10',
            'timezone'                => 'nullable|string|max:50',
            'email_digest_frequency'  => 'nullable|string|in:instant,daily,weekly',
        ]);

        $preferences = UserNotificationPreference::getOrCreateForUser($user->id);

        $updatableBools = [
            'order_updates_email',
            'order_updates_in_app',
            'chat_messages_email',
            'chat_messages_in_app',
            'promotions_email',
            'promotions_in_app',
            'wishlist_alerts_email',
            'wishlist_alerts_in_app',
            'shipping_updates_email',
            'shipping_updates_in_app',
            'product_qa_email',
            'product_qa_in_app',
            'review_activity_email',
            'review_activity_in_app',
            'shop_updates_email',
            'shop_updates_in_app',
            'price_alerts_email',
            'price_alerts_in_app',
            'stock_alerts_email',
            'stock_alerts_in_app',
            'quiet_hours_enabled',
        ];

        foreach ($updatableBools as $key) {
            if ($request->has($key)) {
                $preferences->{$key} = $request->boolean($key);
            }
        }

        $stringKeys = ['quiet_hours_start', 'quiet_hours_end', 'timezone', 'email_digest_frequency'];
        foreach ($stringKeys as $sKey) {
            if ($request->has($sKey) && !empty($request->input($sKey))) {
                $preferences->{$sKey} = trim((string) $request->input($sKey));
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
            'personalization_enabled'    => 'nullable|boolean',
            'marketing_communication'    => 'nullable|boolean',
            'activity_logging'           => 'nullable|boolean',
            'default_anonymous_reviews'  => 'nullable|boolean',
            'show_profile_publicly'      => 'nullable|boolean',
        ]);

        $preferences = UserPrivacyPreference::getOrCreateForUser($user->id);

        $keys = [
            'personalization_enabled',
            'marketing_communication',
            'activity_logging',
            'default_anonymous_reviews',
            'show_profile_publicly',
        ];

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
