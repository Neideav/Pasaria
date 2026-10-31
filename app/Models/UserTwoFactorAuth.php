<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserTwoFactorAuth extends Model
{
    use HasFactory;

    protected $table = 'user_two_factor_auth';

    protected $fillable = [
        'user_id',
        'enabled',
        'secret',
        'recovery_codes_json',
        'confirmed_at',
    ];

    protected $casts = [
        'user_id' => 'integer',
        'enabled' => 'boolean',
        'secret' => 'encrypted',
        'recovery_codes_json' => 'array',
        'confirmed_at' => 'datetime',
    ];

    protected $hidden = [
        'secret',
        'recovery_codes_json',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
