<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Shop extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'name',
        'slug',
        'slogan',
        'city',
        'phone',
        'description',
        'logo',
        'banner',
        'rating',
        'review_count',
        'verified',
        'status',
        'total_sales',
    ];

    protected $casts = [
        'rating' => 'float',
        'review_count' => 'integer',
        'verified' => 'boolean',
        'total_sales' => 'decimal:2',
        'user_id' => 'integer',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function products()
    {
        return $this->hasMany(Product::class);
    }

    public function orders()
    {
        return $this->hasMany(Order::class);
    }

    public function followers()
    {
        return $this->belongsToMany(User::class, 'shop_followers');
    }

    public function reviews()
    {
        return $this->hasMany(Review::class);
    }

    public function vouchers()
    {
        return $this->hasMany(Voucher::class);
    }

    public function wallet()
    {
        return $this->hasOne(Wallet::class);
    }
}
