<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Review extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'order_id',
        'order_item_id',
        'product_id',
        'shop_id',
        'rating',
        'review_text',
        'is_anonymous',
        'is_verified_purchase',
        'status',
        'seller_reply',
        'replied_at',
    ];

    protected $casts = [
        'rating' => 'integer',
        'is_anonymous' => 'boolean',
        'is_verified_purchase' => 'boolean',
        'replied_at' => 'datetime',
        'user_id' => 'integer',
        'product_id' => 'integer',
        'shop_id' => 'integer',
        'order_id' => 'integer',
        'order_item_id' => 'integer',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function shop()
    {
        return $this->belongsTo(Shop::class);
    }

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function orderItem()
    {
        return $this->belongsTo(OrderItem::class);
    }

    public function media()
    {
        return $this->hasMany(ReviewMedia::class);
    }
}
