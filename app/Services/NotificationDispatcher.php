<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\UserNotificationPreference;
use Carbon\Carbon;

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
            'order'        => $preferences->order_updates_in_app,
            'shipping'     => $preferences->shipping_updates_in_app,
            'chat'         => $preferences->chat_messages_in_app,
            'promo'        => $preferences->promotions_in_app,
            'price_alert'  => $preferences->price_alerts_in_app,
            'stock_alert'  => $preferences->stock_alerts_in_app,
            'wishlist'     => $preferences->wishlist_alerts_in_app,
            'shop'         => $preferences->shop_updates_in_app,
            'qa'           => $preferences->product_qa_in_app,
            'review'       => $preferences->review_activity_in_app,
            'security', 'mandatory', 'system' => true,
            default        => true,
        };

        if (!$shouldDeliver) {
            return null;
        }

        // Quiet hours handling for non-essential notifications
        if ($preferences->quiet_hours_enabled && !in_array($type, ['security', 'mandatory', 'order', 'system'])) {
            if (self::isInQuietHours($preferences)) {
                return null;
            }
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

    /**
     * Determine if current time falls within user's quiet hours window.
     */
    public static function isInQuietHours(UserNotificationPreference $preferences): bool
    {
        try {
            $tz = $preferences->timezone ?: 'Asia/Jakarta';
            $now = Carbon::now($tz);
            $startStr = $preferences->quiet_hours_start ?: '22:00';
            $endStr = $preferences->quiet_hours_end ?: '07:00';

            $start = Carbon::createFromTimeString($startStr, $tz);
            $end = Carbon::createFromTimeString($endStr, $tz);

            if ($start->gt($end)) {
                // Interval spans midnight (e.g. 22:00 to 07:00)
                return $now->gte($start) || $now->lt($end);
            } else {
                return $now->gte($start) && $now->lt($end);
            }
        } catch (\Throwable $e) {
            return false;
        }
    }
}
