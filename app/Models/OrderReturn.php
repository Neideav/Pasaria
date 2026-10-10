<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OrderReturn extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_id',
        'order_item_id',
        'quantity',
        'user_id',
        'shop_id',
        'status',
        'reason',
        'description',
        'evidence_urls_json',
        'items_json',
        'requested_amount',
        'refund_amount',
        'seller_note',
        'admin_note',
        'processed_by',
        'processed_at',
    ];

    protected $casts = [
        'evidence_urls_json' => 'array',
        'items_json'         => 'array',
        'requested_amount'   => 'decimal:2',
        'refund_amount'      => 'decimal:2',
        'order_id'           => 'integer',
        'order_item_id'      => 'integer',
        'quantity'           => 'integer',
        'user_id'            => 'integer',
        'shop_id'            => 'integer',
        'processed_by'       => 'integer',
        'processed_at'       => 'datetime',
    ];

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function item()
    {
        return $this->belongsTo(OrderItem::class, 'order_item_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function shop()
    {
        return $this->belongsTo(Shop::class);
    }

    public function processor()
    {
        return $this->belongsTo(User::class, 'processed_by');
    }

    public function dispute()
    {
        return $this->hasOne(Dispute::class, 'return_id');
    }

    public function refund()
    {
        return $this->hasOne(Refund::class, 'return_id');
    }
}
