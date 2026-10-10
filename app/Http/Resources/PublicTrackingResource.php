<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PublicTrackingResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     * Sanitizes tracking output to prevent leaking recipient identity, full street address,
     * phone number, purchased items, or order financial totals to unauthorized public lookups.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        // Extract destination city without exposing full street address
        $destinationCity = 'Kota Tujuan';
        if (!empty($this->delivery_address)) {
            $parts = array_map('trim', explode(',', $this->delivery_address));
            $destinationCity = end($parts) ?: $this->delivery_address;
        }

        $originCity = 'Kota Asal';
        if (!empty($this->origin_address)) {
            $parts = array_map('trim', explode(',', $this->origin_address));
            $originCity = end($parts) ?: $this->origin_address;
        }

        $checkpoints = is_array($this->checkpoints_json)
            ? $this->checkpoints_json
            : (json_decode($this->checkpoints_json ?? '[]', true) ?: []);

        return [
            'tracking_number'   => $this->tracking_number,
            'courier_name'      => $this->courier_name,
            'courier_service'   => $this->courier_service,
            'status'            => $this->status,
            'status_label'      => $this->status_label,
            'origin_city'       => $originCity,
            'destination_city'  => $destinationCity,
            'estimated_arrival' => $this->estimated_arrival,
            'current_location'  => $this->current_location,
            'checkpoints'       => $checkpoints,
            'created_at'        => $this->created_at?->toIso8601String(),
        ];
    }
}
