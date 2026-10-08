<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OrderReturn extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_id',
        'user_id',
        'shop_id',
        'status',
        'reason',
        'description',
        'evidence_urls_json',
        'requested_amount',
        'refund_amount',
        'seller_note',
        'admin_note',
    ];

    protected $casts = [
        'evidence_urls_json' => 'array',
        'requested_amount' => 'decimal:2',
        'refund_amount' => 'decimal:2',
        'order_id' => 'integer',
        'user_id' => 'integer',
        'shop_id' => 'integer',
    ];

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function shop()
    {
        return $this->belongsTo(Shop::class);
    }

    public function dispute()
    {
        return $this->hasOne(Dispute::class, 'return_id');
    }
}
