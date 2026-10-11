<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable implements MustVerifyEmail
{
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes;

    protected $fillable = [
        'name',
        'username',
        'email',
        'password',
        'address',
        'city',
        'zip',
        'phone',
        'avatar',
        'role',
        'status',
        'email_verified_at',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
    ];

    public function shop()
    {
        return $this->hasOne(Shop::class);
    }

    public function orders()
    {
        return $this->hasMany(Order::class);
    }

    public function addresses()
    {
        return $this->hasMany(UserAddress::class);
    }

    public function wishlists()
    {
        return $this->hasMany(Wishlist::class);
    }

    public function followingShops()
    {
        return $this->belongsToMany(Shop::class, 'shop_followers');
    }

    public function reviews()
    {
        return $this->hasMany(Review::class);
    }

    public function notifications()
    {
        return $this->hasMany(Notification::class);
    }

    public function wallet()
    {
        return $this->hasOne(Wallet::class);
    }

    public function cart()
    {
        return $this->hasOne(Cart::class);
    }

    public function refunds()
    {
        return $this->hasMany(Refund::class);
    }

    public function adminActions()
    {
        return $this->hasMany(AdminAction::class);
    }

    public function notificationPreferences()
    {
        return $this->hasOne(UserNotificationPreference::class);
    }

    public function privacyPreferences()
    {
        return $this->hasOne(UserPrivacyPreference::class);
    }

    public function twoFactorAuth()
    {
        return $this->hasOne(UserTwoFactorAuth::class);
    }

    public function shoppingPreference()
    {
        return $this->hasOne(UserShoppingPreference::class);
    }

    public function productAlerts()
    {
        return $this->hasMany(ProductAlert::class);
    }

    public function searchHistories()
    {
        return $this->hasMany(UserSearchHistory::class);
    }

    public function viewedProducts()
    {
        return $this->hasMany(UserViewedProduct::class);
    }

    public function sellerPreference()
    {
        return $this->hasOne(SellerPreference::class);
    }

    public function hasTwoFactorEnabled(): bool
    {
        return (bool) ($this->twoFactorAuth?->enabled);
    }

    public function isCustomer(): bool
    {
        return $this->role === 'customer';
    }

    public function isSeller(): bool
    {
        return $this->role === 'seller';
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function isSupport(): bool
    {
        return $this->role === 'support' || $this->role === 'admin';
    }

    public function isSuspended(): bool
    {
        return in_array(strtolower($this->status ?? 'active'), ['suspended', 'banned', 'disabled'], true);
    }

    public function isActive(): bool
    {
        return !$this->isSuspended();
    }
}
