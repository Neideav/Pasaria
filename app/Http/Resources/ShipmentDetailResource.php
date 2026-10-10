<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ShipmentDetailResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     * Full logistics shipment representation authorized strictly to buyer, authorized seller, or admin.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $itemsPreview = is_array($this->items_preview_json)
            ? $this->items_preview_json
            : (json_decode($this->items_preview_json ?? '[]', true) ?: []);

        $checkpoints = is_array($this->checkpoints_json)
            ? $this->checkpoints_json
            : (json_decode($this->checkpoints_json ?? '[]', true) ?: []);

        return [
            'id'                => $this->shipment_id ?: (string) $this->id,
            'shipment_id'       => $this->shipment_id,
            'order_number'      => $this->order_number,
            'user_id'           => $this->user_id,
            'courier_name'      => $this->courier_name,
            'courier_service'   => $this->courier_service,
            'tracking_number'   => $this->tracking_number,
            'status'            => $this->status,
            'status_label'      => $this->status_label,
            'recipient_name'    => $this->recipient_name,
            'recipient_phone'   => $this->recipient_phone,
            'delivery_address'  => $this->delivery_address,
            'origin_address'    => $this->origin_address,
            'estimated_arrival' => $this->estimated_arrival,
            'driver_name'       => $this->driver_name,
            'driver_phone'      => $this->driver_phone,
            'driver_vehicle'    => $this->driver_vehicle,
            'current_location'  => $this->current_location,
            'items_count'       => (int) ($this->items_count ?? count($itemsPreview)),
            'items_preview'     => $itemsPreview,
            'total_amount'      => (float) $this->total_amount,
            'checkpoints'       => $checkpoints,
            'created_at'        => $this->created_at?->toIso8601String(),
        ];
    }
}
