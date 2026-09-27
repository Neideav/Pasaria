<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use HasFactory;

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
        'colors',
        'specs',
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
    ];

    public function categoryModel()
    {
        return $this->belongsTo(Category::class, 'category', 'name');
    }
}
