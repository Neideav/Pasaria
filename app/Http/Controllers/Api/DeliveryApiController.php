<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\PublicTrackingResource;
use App\Http\Resources\ShipmentDetailResource;
use App\Models\Order;
use App\Models\Shipment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DeliveryApiController extends Controller
{
    /**
     * Get deliveries for authenticated user (buyer or admin).
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
            } elseif ($user->isSeller() && $user->shop) {
                // Seller can view shipments for their shop's orders or their own
                $shopId = $user->shop->id;
                $query->where(function ($q) use ($user, $shopId) {
                    $q->where('user_id', $user->id)
                      ->orWhereHas('order', fn($oq) => $oq->where('shop_id', $shopId));
                });
            } else {
                $query->where('user_id', $user->id);
            }

            $perPage = min(50, max(5, (int) $request->input('per_page', 20)));
            $shipments = $query->paginate($perPage);
            $data = ShipmentDetailResource::collection($shipments->items())->resolve();

            return response()->json([
                'success'    => true,
                'data'       => $data,
                'pagination' => [
                    'current_page' => $shipments->currentPage(),
                    'last_page'    => $shipments->lastPage(),
                    'per_page'     => $shipments->perPage(),
                    'total'        => $shipments->total(),
                ],
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
     * Get single delivery by shipment_id, tracking_number, or order_number.
     * Separates public tracking info (sanitized) from authorized full shipping details.
     */
    public function show(Request $request, string $code): JsonResponse
    {
        try {
            $shipment = Shipment::with('order')
                ->where('shipment_id', $code)
                ->orWhere('tracking_number', $code)
                ->orWhere('order_number', $code)
                ->first();

            if (!$shipment) {
                return response()->json([
                    'success' => false,
                    'message' => 'Data pengiriman tidak ditemukan di sistem PASARIA Logistics.',
                ], 404);
            }

            // Determine if requester is authorized to view full recipient & order private details
            $user = $request->user() ?: auth('sanctum')->user();
            $isAuthorized = false;

            if ($user) {
                if ($user->isAdmin()) {
                    $isAuthorized = true;
                } elseif ($shipment->user_id && $shipment->user_id === $user->id) {
                    $isAuthorized = true;
                } else {
                    $order = $shipment->order;
                    if ($order && $order->user_id === $user->id) {
                        $isAuthorized = true;
                    } elseif ($order && $user->shop && $order->shop_id === $user->shop->id) {
                        $isAuthorized = true;
                    }
                }
            }

            if ($isAuthorized) {
                return response()->json([
                    'success'    => true,
                    'data'       => (new ShipmentDetailResource($shipment))->resolve(),
                    'authorized' => true,
                ]);
            }

            // Public tracking lookup: No recipient phone, full address, buyer identity, or monetary totals
            return response()->json([
                'success'    => true,
                'data'       => (new PublicTrackingResource($shipment))->resolve(),
                'authorized' => false,
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
            'order_number'    => 'required|string|max:100',
            'status'          => 'required|string|max:50',
            'courier_name'    => 'nullable|string|max:100',
            'courier_service' => 'nullable|string|max:100',
            'tracking_number' => 'nullable|string|max:100',
            'status_label'    => 'nullable|string|max:100',
            'current_location'=> 'nullable|string|max:200',
            'checkpoints'     => 'nullable|array',
        ]);

        $orderNumber = trim((string) $request->input('order_number'));
        $order = Order::where('order_number', $orderNumber)->first();

        if (!$order) {
            return response()->json([
                'success' => false,
                'message' => 'Pesanan tidak ditemukan.',
            ], 404);
        }

        // Ownership & Cross-shop authorization check
        if (!$user->isAdmin()) {
            if (!$user->shop || $order->shop_id !== $user->shop->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Akses ditolak. Anda tidak memiliki izin untuk mengelola pengiriman pesanan toko lain.',
                ], 403);
            }
            if ($user->shop->status !== 'approved') {
                return response()->json([
                    'success' => false,
                    'message' => 'Toko Anda belum disetujui untuk memperbarui pengiriman.',
                ], 403);
            }
        }

        try {
            $shipmentId = 'shp-' . $order->order_number;
            $trackingNumber = trim((string) $request->input('tracking_number')) ?: ('PAS-TRK-' . strtoupper(substr(md5($shipmentId), 0, 8)));

            $checkpoints = $request->input('checkpoints', [
                [
                    'id' => 'cp-1',
                    'title' => 'Pesanan Diproses',
                    'location' => $user->shop ? $user->shop->city : 'Jakarta',
                    'timestamp' => now()->format('d M Y, H:i'),
                    'status' => 'completed',
                    'description' => 'Paket sedang dikemas oleh penjual.',
                ]
            ]);

            $shipment = Shipment::updateOrCreate(
                ['shipment_id' => $shipmentId],
                [
                    'order_number'        => $order->order_number,
                    'user_id'             => $order->user_id,
                    'courier_name'        => trim((string) $request->input('courier_name', $order->courier ?: 'PASARIA Express')),
                    'courier_service'     => trim((string) $request->input('courier_service', 'Reguler Standard')),
                    'tracking_number'     => $trackingNumber,
                    'status'              => strtolower(trim((string) $request->input('status'))),
                    'status_label'        => trim((string) $request->input('status_label', 'Sedang Dalam Pengiriman')),
                    'recipient_name'      => $order->customer_name ?: 'Customer',
                    'recipient_phone'     => $order->customer_phone ?: '',
                    'delivery_address'    => $order->shipping_address ?: 'DKI Jakarta',
                    'origin_address'      => $user->shop ? ($user->shop->name . ', ' . $user->shop->city) : 'PASARIA Logistics',
                    'estimated_arrival'   => now()->addDays(2)->format('d M Y'),
                    'current_location'    => trim((string) $request->input('current_location', 'Hub Logistik')),
                    'total_amount'        => (float) $order->total,
                    'items_count'         => $order->items()->count(),
                    'checkpoints_json'    => $checkpoints,
                ]
            );

            // Sync tracking number on order if not set
            if (empty($order->tracking_number)) {
                $order->tracking_number = $trackingNumber;
                $order->save();
            }

            return response()->json([
                'success' => true,
                'message' => 'Status pengiriman berhasil disimpan.',
                'data'    => (new ShipmentDetailResource($shipment))->resolve(),
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => config('app.debug') ? $e->getMessage() : 'Gagal menyimpan status pengiriman.',
            ], 500);
        }
    }
}
