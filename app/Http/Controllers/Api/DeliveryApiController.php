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
     * Get deliveries for authenticated user.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        try {
            $query = Shipment::orderBy('id', 'desc');

            if ($user->isAdmin()) {
                // Admin can view all shipments
            } else {
                $query->where('user_id', $user->id);
            }

            $shipments = $query->get()->map(function ($shipment) {
                $item = $shipment->toArray();
                $item['total_amount'] = (float) $shipment->total_amount;
                $item['items_preview'] = is_array($shipment->items_preview_json) ? $shipment->items_preview_json : (json_decode($shipment->items_preview_json, true) ?: []);
                $item['checkpoints'] = is_array($shipment->checkpoints_json) ? $shipment->checkpoints_json : (json_decode($shipment->checkpoints_json, true) ?: []);
                return $item;
            });

            return response()->json([
                'success' => true,
                'data'    => $shipments,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => config('app.debug') ? $e->getMessage() : 'Gagal memuat status pengiriman.',
                'data'    => [],
            ], 500);
        }
    }

    /**
     * Get single delivery by shipment_id, tracking_number, or order_number (Public tracking).
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
                'data'    => $item,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => config('app.debug') ? $e->getMessage() : 'Gagal memuat data pengiriman.',
            ], 500);
        }
    }

    /**
     * Store or update delivery shipment. Strictly authorized to Seller or Admin.
     */
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        if (!$user->isSeller() && !$user->isAdmin()) {
            return response()->json(['success' => false, 'message' => 'Akses ditolak.'], 403);
        }

        $request->validate([
            'order_number'    => 'required|string',
            'status'          => 'required|string',
            'courier_name'    => 'nullable|string',
            'tracking_number' => 'nullable|string',
        ]);

        try {
            $data = $request->all();
            $shipmentId = $data['id'] ?? $data['shipment_id'] ?? ('shp-' . $data['order_number']);
            $trackingNumber = $data['tracking_number'] ?? ('PAS-TRK-' . strtoupper(substr(md5($shipmentId), 0, 8)));

            $shipment = Shipment::updateOrCreate(
                ['shipment_id' => $shipmentId],
                [
                    'order_number'        => $data['order_number'],
                    'courier_name'        => $data['courier_name'] ?? 'PASARIA Express',
                    'courier_service'     => $data['courier_service'] ?? 'Reguler Standard',
                    'tracking_number'     => $trackingNumber,
                    'status'              => $data['status'],
                    'status_label'        => $data['status_label'] ?? 'Sedang Dalam Pengiriman',
                    'recipient_name'      => $data['recipient_name'] ?? 'Customer',
                    'recipient_phone'     => $data['recipient_phone'] ?? '+62 812 0000 0000',
                    'delivery_address'    => $data['delivery_address'] ?? 'DKI Jakarta',
                    'origin_address'      => $data['origin_address'] ?? 'Fulfillment Center PASARIA',
                    'estimated_arrival'   => $data['estimated_arrival'] ?? now()->addDays(2)->format('d M Y'),
                    'current_location'    => $data['current_location'] ?? 'Hub Jakarta Barat',
                    'checkpoints_json'    => $data['checkpoints'] ?? ($data['checkpoints_json'] ?? []),
                ]
            );

            return response()->json([
                'success' => true,
                'message' => 'Status pengiriman berhasil disimpan.',
                'data'    => $shipment,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => config('app.debug') ? $e->getMessage() : 'Gagal menyimpan status pengiriman.',
            ], 500);
        }
    }
}
