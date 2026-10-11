<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserPrivacyPreference extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'personalization_enabled',
        'marketing_communication',
        'activity_logging',
    ];

    protected $casts = [
        'user_id' => 'integer',
        'personalization_enabled' => 'boolean',
        'marketing_communication' => 'boolean',
        'activity_logging' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get existing preferences or initialize with system defaults.
     */
    public static function getOrCreateForUser(int $userId): self
    {
        return static::firstOrCreate(
            ['user_id' => $userId],
            [
                'personalization_enabled' => true,
                'marketing_communication' => false,
                'activity_logging' => true,
            ]
        );
    }
}
