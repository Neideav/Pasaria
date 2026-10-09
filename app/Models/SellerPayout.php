<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SellerPayout extends Model
{
    use HasFactory;

    protected $fillable = [
        'shop_id',
        'amount',
        'bank_name',
        'account_number',
        'account_holder',
        'status',
        'reference_id',
        'note',
        'processed_by',
        'processed_at',
        'failure_reason',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'shop_id' => 'integer',
        'processed_by' => 'integer',
        'processed_at' => 'datetime',
    ];

    public function shop()
    {
        return $this->belongsTo(Shop::class);
    }

    public function processor()
    {
        return $this->belongsTo(User::class, 'processed_by');
    }
}
