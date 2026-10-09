<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProductVariant extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_id',
        'sku',
        'name',
        'attributes_json',
        'price',
        'stock',
        'is_active',
        'weight_grams',
        'image',
    ];

    protected $casts = [
        'attributes_json' => 'array',
        'price' => 'decimal:2',
        'stock' => 'integer',
        'is_active' => 'boolean',
        'weight_grams' => 'integer',
        'product_id' => 'integer',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
