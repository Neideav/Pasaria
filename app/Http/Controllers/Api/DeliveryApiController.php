<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Shipment;
use App\Models\ShipmentEvent;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DeliveryApiController extends Controller
{
    /**
     * Get deliveries for a user with persistent events.
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $userId = $request->user()?->id ?: (int) ($request->input('user_id') ?: 1);

            $shipments = Shipment::where('user_id', $userId)
                ->orderBy('id', 'desc')
                ->get()
                ->map(function ($shipment) {
                    $item = $shipment->toArray();
                    $item['total_amount'] = (float) $shipment->total_amount;
                    $item['items_preview'] = is_array($shipment->items_preview_json) ? $shipment->items_preview_json : (json_decode($shipment->items_preview_json, true) ?: []);
                    $item['checkpoints'] = is_array($shipment->checkpoints_json) ? $shipment->checkpoints_json : (json_decode($shipment->checkpoints_json, true) ?: []);
                    return $item;
                });

            return response()->json([
                'success' => true,
                'data' => $shipments,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
                'data' => [],
            ], 200);
        }
    }

    /**
     * Get single delivery by shipment_id, tracking_number, or order_number.
     */
    public function show(string $code): JsonResponse
    {
        try {
            $shipment = Shipment::where('shipment_id', $code)
                ->orWhere('tracking_number', $code)
                ->orWhere('order_number', $code)
                ->first();

            if (!$shipment) {
                return response()->json([
                    'success' => false,
                    'message' => 'Data pengiriman tidak ditemukan di sistem PASARIA Logistics.',
                ], 404);
            }

            $item = $shipment->toArray();
            $item['total_amount'] = (float) $shipment->total_amount;
            $item['items_preview'] = is_array($shipment->items_preview_json) ? $shipment->items_preview_json : (json_decode($shipment->items_preview_json, true) ?: []);
            $item['checkpoints'] = is_array($shipment->checkpoints_json) ? $shipment->checkpoints_json : (json_decode($shipment->checkpoints_json, true) ?: []);

            return response()->json([
                'success' => true,
                'data' => $item,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Store or update delivery shipment.
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $data = $request->all();
            $userId = $request->user()?->id ?: (int) ($data['user_id'] ?? 1);
            $shipmentId = $data['id'] ?? $data['shipment_id'] ?? ('shp-' . ($data['order_number'] ?? time()));
            $trackingNumber = $data['tracking_number'] ?? ('PAS-TRK-' . strtoupper(substr(md5($shipmentId), 0, 8)));

            $shipment = Shipment::updateOrCreate(
                ['shipment_id' => $shipmentId],
                [
                    'order_number' => $data['order_number'] ?? (string) time(),
                    'user_id' => $userId,
                    'courier_name' => $data['courier_name'] ?? 'PASARIA Express',
                    'courier_service' => $data['courier_service'] ?? 'Reguler Standard',
                    'tracking_number' => $trackingNumber,
                    'status' => $data['status'] ?? 'in_transit',
                    'status_label' => $data['status_label'] ?? 'Sedang Dalam Pengiriman',
                    'recipient_name' => $data['recipient_name'] ?? 'Customer',
                    'recipient_phone' => $data['recipient_phone'] ?? '+62 812 0000 0000',
                    'delivery_address' => $data['delivery_address'] ?? 'DKI Jakarta',
                    'origin_address' => $data['origin_address'] ?? 'Fulfillment Center PASARIA',
                    'estimated_arrival' => $data['estimated_arrival'] ?? now()->addDays(2)->format('d M Y'),
                    'driver_name' => $data['driver_name'] ?? 'Kurir Mitra PASARIA',
                    'driver_phone' => $data['driver_phone'] ?? '+62 813 1234 5678',
                    'driver_vehicle' => $data['driver_vehicle'] ?? 'B 1234 PAS (Motor)',
                    'current_location' => $data['current_location'] ?? 'Hub Jakarta Barat',
                    'items_count' => (int) ($data['items_count'] ?? 1),
                    'items_preview_json' => $data['items_preview'] ?? ($data['items_preview_json'] ?? []),
                    'total_amount' => (float) ($data['total_amount'] ?? 0),
                    'checkpoints_json' => $data['checkpoints'] ?? ($data['checkpoints_json'] ?? []),
                ]
            );

            return response()->json([
                'success' => true,
                'message' => 'Status pengiriman berhasil disimpan.',
                'data' => $shipment,
                'shipment' => $shipment,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
