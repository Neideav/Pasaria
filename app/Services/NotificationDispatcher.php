<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\UserNotificationPreference;

class NotificationDispatcher
{
    /**
     * Dispatch an in-app notification respecting user-configured preferences.
     * Essential security, mandatory, and transaction notifications are never suppressed.
     */
    public static function dispatch(
        int $userId,
        string $title,
        string $message,
        string $type = 'general',
        ?string $actionUrl = null
    ): ?Notification {
        $preferences = UserNotificationPreference::getOrCreateForUser($userId);

        $shouldDeliver = match ($type) {
            'order'    => $preferences->order_updates_in_app,
            'chat'     => $preferences->chat_messages_in_app,
            'promo'    => $preferences->promotions_in_app,
            'wishlist' => $preferences->wishlist_alerts_in_app,
            'security', 'mandatory', 'system' => true,
            default    => true,
        };

        if (!$shouldDeliver) {
            return null;
        }

        return Notification::create([
            'user_id'    => $userId,
            'title'      => $title,
            'message'    => $message,
            'type'       => $type,
            'action_url' => $actionUrl,
            'is_read'    => false,
        ]);
    }
}
