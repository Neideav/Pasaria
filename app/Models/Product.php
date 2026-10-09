<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Product extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'slug',
        'category',
        'price',
        'original_price',
        'monthly_price',
        'short_desc',
        'description',
        'image',
        'rating',
        'review_count',
        'stock',
        'is_active',
        'colors',
        'specs',
        'shop_id',
        'shop_name',
        'shop_logo',
        'shop_city',
    ];

    protected $casts = [
        'colors' => 'array',
        'specs' => 'array',
        'price' => 'decimal:2',
        'original_price' => 'decimal:2',
        'monthly_price' => 'decimal:2',
        'rating' => 'float',
        'review_count' => 'integer',
        'stock' => 'integer',
        'is_active' => 'boolean',
        'shop_id' => 'integer',
    ];

    public function categoryModel()
    {
        return $this->belongsTo(Category::class, 'category', 'name');
    }

    public function shop()
    {
        return $this->belongsTo(Shop::class);
    }

    public function variants()
    {
        return $this->hasMany(ProductVariant::class);
    }

    public function images()
    {
        return $this->hasMany(ProductImage::class)->orderBy('sort_order');
    }

    public function reviews()
    {
        return $this->hasMany(Review::class)->where('status', 'approved');
    }

    public function allReviews()
    {
        return $this->hasMany(Review::class);
    }

    public function questions()
    {
        return $this->hasMany(ProductQuestion::class)->where('status', 'approved');
    }
}
