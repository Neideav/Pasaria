<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PaymentEvent extends Model
{
    use HasFactory;

    protected $fillable = [
        'payment_id',
        'event_id',
        'provider',
        'event_type',
        'payload_json',
        'status',
    ];

    protected $casts = [
        'payload_json' => 'array',
        'payment_id' => 'integer',
    ];

    public function payment()
    {
        return $this->belongsTo(Payment::class);
    }
}
