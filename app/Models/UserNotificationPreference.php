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
            ]
        );
    }
}
