<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Refund extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_id',
        'payment_id',
        'return_id',
        'shop_id',
        'user_id',
        'type',
        'amount',
        'currency',
        'reason',
        'status',
        'provider',
        'provider_reference',
        'refund_reference',
        'processed_by',
        'processed_at',
        'failure_reason',
        'notes',
    ];

    protected $casts = [
        'amount'       => 'decimal:2',
        'order_id'     => 'integer',
        'payment_id'   => 'integer',
        'return_id'    => 'integer',
        'shop_id'      => 'integer',
        'user_id'      => 'integer',
        'processed_by' => 'integer',
        'processed_at' => 'datetime',
    ];

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function payment()
    {
        return $this->belongsTo(Payment::class);
    }

    public function return()
    {
        return $this->belongsTo(OrderReturn::class, 'return_id');
    }

    public function shop()
    {
        return $this->belongsTo(Shop::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function processor()
    {
        return $this->belongsTo(User::class, 'processed_by');
    }
}
