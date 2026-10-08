<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Shipment extends Model
{
    use HasFactory;

    protected $fillable = [
        'shipment_id',
        'order_number',
        'user_id',
        'courier_name',
        'courier_service',
        'tracking_number',
        'status',
        'status_label',
        'recipient_name',
        'recipient_phone',
        'delivery_address',
        'origin_address',
        'estimated_arrival',
        'driver_name',
        'driver_phone',
        'driver_vehicle',
        'current_location',
        'items_count',
        'items_preview_json',
        'total_amount',
        'checkpoints_json',
    ];

    protected $casts = [
        'items_preview_json' => 'array',
        'checkpoints_json' => 'array',
        'total_amount' => 'decimal:2',
        'items_count' => 'integer',
        'user_id' => 'integer',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function order()
    {
        return $this->belongsTo(Order::class, 'order_number', 'order_number');
    }

    public function events()
    {
        return $this->hasMany(ShipmentEvent::class, 'shipment_id', 'shipment_id')->orderBy('event_time', 'asc');
    }
}
