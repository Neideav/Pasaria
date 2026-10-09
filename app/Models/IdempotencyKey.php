<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class IdempotencyKey extends Model
{
    use HasFactory;

    protected $fillable = [
        'key',
        'user_id',
        'action',
        'resource_id',
        'response_json',
    ];

    protected $casts = [
        'response_json' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
