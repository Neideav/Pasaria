<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SellerPreference extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'shop_id',
        'notify_new_orders',
        'notify_customer_chat',
        'notify_low_stock',
        'notify_reviews',
        'notify_returns',
        'low_stock_threshold',
        'vacation_mode',
        'vacation_message',
        'vacation_start',
        'vacation_end',
    ];

    protected $casts = [
        'user_id' => 'integer',
        'shop_id' => 'integer',
        'notify_new_orders' => 'boolean',
        'notify_customer_chat' => 'boolean',
        'notify_low_stock' => 'boolean',
        'notify_reviews' => 'boolean',
        'notify_returns' => 'boolean',
        'low_stock_threshold' => 'integer',
        'vacation_mode' => 'boolean',
        'vacation_start' => 'datetime',
        'vacation_end' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function shop()
    {
        return $this->belongsTo(Shop::class);
    }

    public static function getOrCreateForShop(int $userId, int $shopId): self
    {
        return static::firstOrCreate(
            ['shop_id' => $shopId],
            [
                'user_id' => $userId,
                'notify_new_orders' => true,
                'notify_customer_chat' => true,
                'notify_low_stock' => true,
                'notify_reviews' => true,
                'notify_returns' => true,
                'low_stock_threshold' => 5,
                'vacation_mode' => false,
                'vacation_message' => null,
                'vacation_start' => null,
                'vacation_end' => null,
            ]
        );
    }
}
