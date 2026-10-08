<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AdminAction extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'action',
        'target_type',
        'target_id',
        'details_json',
        'ip_address',
        'user_agent',
    ];

    protected $casts = [
        'details_json' => 'array',
        'user_id' => 'integer',
        'target_id' => 'integer',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
