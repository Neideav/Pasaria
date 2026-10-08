<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OrderItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_id',
        'shop_id',
        'product_id',
        'variant_id',
        'product_name',
        'product_slug',
        'price',
        'quantity',
        'color',
        'image',
        'subtotal',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'subtotal' => 'decimal:2',
        'quantity' => 'integer',
        'order_id' => 'integer',
        'shop_id' => 'integer',
        'product_id' => 'integer',
        'variant_id' => 'integer',
    ];

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function variant()
    {
        return $this->belongsTo(ProductVariant::class, 'variant_id');
    }

    public function shop()
    {
        return $this->belongsTo(Shop::class);
    }

    public function review()
    {
        return $this->hasOne(Review::class, 'order_item_id');
    }
}
