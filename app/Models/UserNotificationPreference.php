<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserNotificationPreference extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'order_updates_email',
        'order_updates_in_app',
        'chat_messages_email',
        'chat_messages_in_app',
        'promotions_email',
        'promotions_in_app',
        'wishlist_alerts_email',
        'wishlist_alerts_in_app',
        'security_alerts_email',
        'security_alerts_in_app',
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
        'quiet_hours_start',
        'quiet_hours_end',
        'timezone',
        'email_digest_frequency',
    ];

    protected $casts = [
        'user_id' => 'integer',
        'order_updates_email' => 'boolean',
        'order_updates_in_app' => 'boolean',
        'chat_messages_email' => 'boolean',
        'chat_messages_in_app' => 'boolean',
        'promotions_email' => 'boolean',
        'promotions_in_app' => 'boolean',
        'wishlist_alerts_email' => 'boolean',
        'wishlist_alerts_in_app' => 'boolean',
        'security_alerts_email' => 'boolean',
        'security_alerts_in_app' => 'boolean',
        'shipping_updates_email' => 'boolean',
        'shipping_updates_in_app' => 'boolean',
        'product_qa_email' => 'boolean',
        'product_qa_in_app' => 'boolean',
        'review_activity_email' => 'boolean',
        'review_activity_in_app' => 'boolean',
        'shop_updates_email' => 'boolean',
        'shop_updates_in_app' => 'boolean',
        'price_alerts_email' => 'boolean',
        'price_alerts_in_app' => 'boolean',
        'stock_alerts_email' => 'boolean',
        'stock_alerts_in_app' => 'boolean',
        'quiet_hours_enabled' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get existing preferences or initialize with default system values.
     */
    public static function getOrCreateForUser(int $userId): self
    {
        return static::firstOrCreate(
            ['user_id' => $userId],
            [
                'order_updates_email' => true,
                'order_updates_in_app' => true,
                'chat_messages_email' => true,
                'chat_messages_in_app' => true,
                'promotions_email' => false,
                'promotions_in_app' => false,
                'wishlist_alerts_email' => true,
                'wishlist_alerts_in_app' => true,
                'security_alerts_email' => true,
                'security_alerts_in_app' => true,
                'shipping_updates_email' => true,
                'shipping_updates_in_app' => true,
                'product_qa_email' => true,
                'product_qa_in_app' => true,
                'review_activity_email' => true,
                'review_activity_in_app' => true,
                'shop_updates_email' => true,
                'shop_updates_in_app' => true,
                'price_alerts_email' => true,
                'price_alerts_in_app' => true,
                'stock_alerts_email' => true,
                'stock_alerts_in_app' => true,
                'quiet_hours_enabled' => false,
                'quiet_hours_start' => '22:00',
                'quiet_hours_end' => '07:00',
                'timezone' => 'Asia/Jakarta',
                'email_digest_frequency' => 'instant',
            ]
        );
    }
}
