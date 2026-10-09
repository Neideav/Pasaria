<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Wallet extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'shop_id',
        'balance',
        'reserved_balance',
        'pending_balance',
        'total_withdrawn',
    ];

    protected $casts = [
        'balance' => 'decimal:2',
        'reserved_balance' => 'decimal:2',
        'pending_balance' => 'decimal:2',
        'total_withdrawn' => 'decimal:2',
        'user_id' => 'integer',
        'shop_id' => 'integer',
    ];

    public function getAvailableBalanceAttribute(): float
    {
        return max(0.0, round((float) $this->balance - (float) $this->reserved_balance, 2));
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function shop()
    {
        return $this->belongsTo(Shop::class);
    }

    public function transactions()
    {
        return $this->hasMany(WalletTransaction::class)->orderBy('created_at', 'desc');
    }
}
