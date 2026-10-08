<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProductAnswer extends Model
{
    use HasFactory;

    protected $fillable = [
        'question_id',
        'user_id',
        'shop_id',
        'answer',
        'status',
    ];

    protected $casts = [
        'question_id' => 'integer',
        'user_id' => 'integer',
        'shop_id' => 'integer',
    ];

    public function question()
    {
        return $this->belongsTo(ProductQuestion::class, 'question_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function shop()
    {
        return $this->belongsTo(Shop::class);
    }
}
