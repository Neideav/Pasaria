<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Dispute extends Model
{
    use HasFactory;

    protected $fillable = [
        'return_id',
        'order_id',
        'user_id',
        'shop_id',
        'status',
        'resolution',
        'resolution_note',
        'resolved_by',
    ];

    protected $casts = [
        'return_id' => 'integer',
        'order_id' => 'integer',
        'user_id' => 'integer',
        'shop_id' => 'integer',
        'resolved_by' => 'integer',
    ];

    public function return()
    {
        return $this->belongsTo(OrderReturn::class, 'return_id');
    }

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

    public function resolver()
    {
        return $this->belongsTo(User::class, 'resolved_by');
    }
}
