<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserShoppingPreference extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'favorite_categories',
        'favorite_brands',
        'min_price',
        'max_price',
        'hide_out_of_stock',
        'prioritize_official_stores',
        'default_sort',
        'preferred_density',
        'recommendation_personalization',
        'theme',
        'font_size',
        'reduced_motion',
        'high_contrast',
    ];

    protected $casts = [
        'user_id' => 'integer',
        'favorite_categories' => 'array',
        'favorite_brands' => 'array',
        'min_price' => 'decimal:2',
        'max_price' => 'decimal:2',
        'hide_out_of_stock' => 'boolean',
        'prioritize_official_stores' => 'boolean',
        'recommendation_personalization' => 'boolean',
        'reduced_motion' => 'boolean',
        'high_contrast' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public static function getOrCreateForUser(int $userId): self
    {
        return static::firstOrCreate(
            ['user_id' => $userId],
            [
                'favorite_categories' => [],
                'favorite_brands' => [],
                'min_price' => null,
                'max_price' => null,
                'hide_out_of_stock' => false,
                'prioritize_official_stores' => false,
                'default_sort' => 'popular',
                'preferred_density' => 'comfortable',
                'recommendation_personalization' => true,
                'theme' => 'light',
                'font_size' => 'normal',
                'reduced_motion' => false,
                'high_contrast' => false,
            ]
        );
    }
}
