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
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'shop_id' => 'integer',
    ];

    public function shop()
    {
        return $this->belongsTo(Shop::class);
    }
}
