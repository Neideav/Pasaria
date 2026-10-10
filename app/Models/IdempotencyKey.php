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
        'request_hash',
        'status',
        'resource_id',
        'response_json',
        'status_code',
    ];

    protected $casts = [
        'response_json' => 'array',
        'status_code' => 'integer',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
