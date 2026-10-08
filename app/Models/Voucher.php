<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Voucher extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'name',
        'type',
        'discount_value',
        'min_purchase',
        'max_discount',
        'usage_limit',
        'usage_count',
        'start_at',
        'end_at',
        'shop_id',
        'is_active',
    ];

    protected $casts = [
        'discount_value' => 'decimal:2',
        'min_purchase' => 'decimal:2',
        'max_discount' => 'decimal:2',
        'usage_limit' => 'integer',
        'usage_count' => 'integer',
        'is_active' => 'boolean',
        'start_at' => 'datetime',
        'end_at' => 'datetime',
        'shop_id' => 'integer',
    ];

    public function shop()
    {
        return $this->belongsTo(Shop::class);
    }

    public function redemptions()
    {
        return $this->hasMany(VoucherRedemption::class);
    }

    public function isValidForAmount(float $subtotal): bool
    {
        if (!$this->is_active) return false;
        if ($this->usage_count >= $this->usage_limit) return false;
        if ($this->start_at && now()->lt($this->start_at)) return false;
        if ($this->end_at && now()->gt($this->end_at)) return false;
        if ($subtotal < $this->min_purchase) return false;
        return true;
    }

    public function calculateDiscount(float $subtotal, float $shippingCost = 0): float
    {
        if (!$this->isValidForAmount($subtotal)) return 0;

        if ($this->type === 'free_shipping') {
            return $shippingCost;
        }

        if ($this->type === 'percentage') {
            $discount = ($subtotal * $this->discount_value) / 100.0;
            if ($this->max_discount !== null && $this->max_discount > 0) {
                $discount = min($discount, (float) $this->max_discount);
            }
            return round($discount, 2);
        }

        // fixed_amount
        return min((float) $this->discount_value, $subtotal);
    }
}
