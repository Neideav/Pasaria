<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ShipmentEvent extends Model
{
    use HasFactory;

    protected $fillable = [
        'shipment_id',
        'title',
        'location',
        'description',
        'status',
        'event_time',
    ];

    protected $casts = [
        'event_time' => 'datetime',
    ];

    public function shipment()
    {
        return $this->belongsTo(Shipment::class, 'shipment_id', 'shipment_id');
    }
}
