<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProductQuestion extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_id',
        'user_id',
        'question',
        'is_public',
        'status',
    ];

    protected $casts = [
        'is_public' => 'boolean',
        'product_id' => 'integer',
        'user_id' => 'integer',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function answers()
    {
        return $this->hasMany(ProductAnswer::class, 'question_id')->where('status', 'approved');
    }
}
