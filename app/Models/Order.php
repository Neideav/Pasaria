<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_number',
        'master_order_number',
        'user_id',
        'shop_id',
        'customer_name',
        'customer_email',
        'customer_phone',
        'shipping_address',
        'payment_method',
        'subtotal',
        'tax',
        'discount',
        'shipping_cost',
        'total',
        'status',
        'courier',
        'courier_service',
        'tracking_number',
        'voucher_code',
        'voucher_discount',
        'idempotency_key',
        'items_json',
    ];

    protected $casts = [
        'items_json' => 'array',
        'subtotal' => 'decimal:2',
        'tax' => 'decimal:2',
        'discount' => 'decimal:2',
        'shipping_cost' => 'decimal:2',
        'total' => 'decimal:2',
        'voucher_discount' => 'decimal:2',
        'user_id' => 'integer',
        'shop_id' => 'integer',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function shop()
    {
        return $this->belongsTo(Shop::class);
    }

    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }

    public function payment()
    {
        return $this->hasOne(Payment::class);
    }

    public function shipment()
    {
        return $this->hasOne(Shipment::class, 'order_number', 'order_number');
    }

    public function returns()
    {
        return $this->hasMany(OrderReturn::class);
    }

    public function subOrders()
    {
        return $this->hasMany(Order::class, 'master_order_number', 'master_order_number')
            ->where('id', '!=', $this->id);
    }
}
