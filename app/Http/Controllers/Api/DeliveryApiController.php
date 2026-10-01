<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DeliveryApiController extends Controller
{
    /**
     * Get deliveries for a user.
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = DB::table('shipments')->orderBy('id', 'desc');
            if ($request->has('user_id') && !empty($request->input('user_id'))) {
                $query->where('user_id', (int) $request->input('user_id'));
            }

            $shipments = $query->get()->map(function ($row) {
                $item = (array) $row;
                $item['items_preview'] = !empty($row->items_preview_json) ? json_decode($row->items_preview_json, true) : [];
                $item['checkpoints'] = !empty($row->checkpoints_json) ? json_decode($row->checkpoints_json, true) : [];
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
     * Get single delivery by code / tracking number.
     */
    public function show(string $code): JsonResponse
    {
        try {
            $row = DB::table('shipments')
                ->where('shipment_id', $code)
                ->orWhere('tracking_number', $code)
                ->orWhere('order_number', $code)
                ->first();

            if (!$row) {
                return response()->json([
                    'success' => false,
                    'message' => 'Shipment not found',
                ], 404);
            }

            $item = (array) $row;
            $item['items_preview'] = !empty($row->items_preview_json) ? json_decode($row->items_preview_json, true) : [];
            $item['checkpoints'] = !empty($row->checkpoints_json) ? json_decode($row->checkpoints_json, true) : [];

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
            $shipmentId = $data['id'] ?? ('shp-' . ($data['order_number'] ?? time()));
            $trackingNumber = $data['tracking_number'] ?? ('SC-TRK-' . ($data['order_number'] ?? rand(100000, 999999)));
            $itemsPreviewJson = isset($data['items_preview']) ? json_encode($data['items_preview']) : ($data['items_preview_json'] ?? '[]');
            $checkpointsJson = isset($data['checkpoints']) ? json_encode($data['checkpoints']) : ($data['checkpoints_json'] ?? '[]');

            $insertData = [
                'shipment_id' => $shipmentId,
                'order_number' => $data['order_number'] ?? (string) time(),
                'user_id' => isset($data['user_id']) ? (int) $data['user_id'] : (auth()->id() ?: 1),
                'courier_name' => $data['courier_name'] ?? 'Shopcart Express Priority',
                'courier_service' => $data['courier_service'] ?? 'Fast Local & Ground Tracking',
                'tracking_number' => $trackingNumber,
                'status' => $data['status'] ?? 'in_transit',
                'status_label' => $data['status_label'] ?? 'In Transit — Tracking Active',
                'recipient_name' => $data['recipient_name'] ?? 'Customer',
                'recipient_phone' => $data['recipient_phone'] ?? '+1 (555) 234-5678',
                'delivery_address' => $data['delivery_address'] ?? '4140 Parker Rd. Allentown, New Mexico 31134',
                'origin_address' => $data['origin_address'] ?? 'Central Fulfillment Center #4, North Hub',
                'estimated_arrival' => $data['estimated_arrival'] ?? 'Tomorrow by 2:00 PM',
                'driver_name' => $data['driver_name'] ?? 'Marcus Vance (Courier Specialist)',
                'driver_phone' => $data['driver_phone'] ?? '+1 (555) 987-6543',
                'driver_vehicle' => $data['driver_vehicle'] ?? 'Eco Delivery Van #EV-428',
                'current_location' => $data['current_location'] ?? 'Regional Distribution Center, Sector 7',
                'items_count' => (int) ($data['items_count'] ?? 1),
                'items_preview_json' => $itemsPreviewJson,
                'total_amount' => (float) ($data['total_amount'] ?? 0),
                'checkpoints_json' => $checkpointsJson,
                'updated_at' => now(),
            ];

            $exists = DB::table('shipments')->where('shipment_id', $shipmentId)->exists();
            if ($exists) {
                DB::table('shipments')->where('shipment_id', $shipmentId)->update($insertData);
            } else {
                $insertData['created_at'] = now();
                DB::table('shipments')->insert($insertData);
            }

            return response()->json([
                'success' => true,
                'message' => 'Delivery shipment saved',
                'shipment' => array_merge($data, ['id' => $shipmentId, 'tracking_number' => $trackingNumber]),
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 200);
        }
    }
}
