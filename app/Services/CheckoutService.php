<?php

namespace App\Services;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Shipment;
use App\Models\ShipmentEvent;
use App\Models\Voucher;
use App\Models\VoucherRedemption;
use App\Models\Notification;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\IdempotencyKey;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CheckoutService
{
    protected PricingService $pricingService;

    public function __construct(PricingService $pricingService)
    {
        $this->pricingService = $pricingService;
    }

    /**
     * Execute atomic server-controlled checkout.
     *
     * @param array $checkoutData
     * @param int $userId
     * @return array
     */
    public function checkout(array $checkoutData, int $userId): array
    {
        $rawItems = $checkoutData['items'] ?? [];
        if (empty($rawItems)) {
            throw new \InvalidArgumentException('Keranjang belanja Anda kosong.');
        }

        $shippingAddress = trim($checkoutData['shipping_address'] ?? 'DKI Jakarta, Indonesia');
        $customerName = trim($checkoutData['customer_name'] ?? 'PASARIA Customer');
        $customerEmail = trim($checkoutData['customer_email'] ?? 'customer@pasaria.id');
        $customerPhone = trim($checkoutData['customer_phone'] ?? '+62 812 3456 7890');
        $paymentMethod = trim($checkoutData['payment_method'] ?? 'QRIS Instant');
        $voucherCode = !empty($checkoutData['voucher_code']) ? trim($checkoutData['voucher_code']) : null;
        $idempotencyKey = !empty($checkoutData['idempotency_key']) ? (string) $checkoutData['idempotency_key'] : null;

        // 1. Persistent Idempotency check via idempotency_keys table
        if (!empty($idempotencyKey)) {
            $cachedKey = IdempotencyKey::where('key', $idempotencyKey)
                ->where('user_id', $userId)
                ->first();

            if ($cachedKey && !empty($cachedKey->response_json)) {
                $response = is_array($cachedKey->response_json)
                    ? $cachedKey->response_json
                    : json_decode($cachedKey->response_json, true);
                $response['idempotent'] = true;
                $response['message'] = 'Pesanan sudah pernah dibuat (Idempotent replay).';
                return $response;
            }

            // Fallback check on orders table
            $existing = Order::where('user_id', $userId)
                ->where('idempotency_key', $idempotencyKey)
                ->first();

            if ($existing) {
                return [
                    'success' => true,
                    'order_number' => $existing->master_order_number ?: $existing->order_number,
                    'master_order_number' => $existing->master_order_number ?: $existing->order_number,
                    'total' => (float) $existing->total,
                    'status' => $existing->status,
                    'idempotent' => true,
                    'message' => 'Pesanan sudah pernah dibuat (Idempotent replay).',
                ];
            }
        }

        // 2. Atomic Database Transaction with pessimistic locking
        return DB::transaction(function () use (
            $rawItems,
            $voucherCode,
            $userId,
            $customerName,
            $customerEmail,
            $customerPhone,
            $shippingAddress,
            $paymentMethod,
            $idempotencyKey
        ) {
            // A. Stock validation & pessimistic row-level locking (FOR UPDATE)
            foreach ($rawItems as $item) {
                $pId = (int) ($item['product_id'] ?? $item['id'] ?? 0);
                $qty = (int) ($item['quantity'] ?? 1);
                $vId = isset($item['variant_id']) && $item['variant_id'] !== '' && $item['variant_id'] !== null
                    ? (int) $item['variant_id']
                    : null;

                if ($qty < 1) {
                    throw new \InvalidArgumentException("Jumlah item harus minimal 1.");
                }

                $product = Product::where('id', $pId)->lockForUpdate()->first();
                if (!$product) {
                    throw new \InvalidArgumentException("Produk #{$pId} tidak ditemukan atau sudah tidak tersedia.");
                }

                if ($product->stock < $qty) {
                    throw new \RuntimeException("Stok untuk '{$product->name}' tidak mencukupi. Tersedia: {$product->stock}, diminta: {$qty}.");
                }

                if ($vId !== null) {
                    $variant = ProductVariant::where('id', $vId)
                        ->where('product_id', $pId)
                        ->lockForUpdate()
                        ->first();

                    if (!$variant) {
                        throw new \InvalidArgumentException("Varian #{$vId} tidak cocok atau tidak ditemukan pada produk '{$product->name}'.");
                    }

                    if ($variant->stock < $qty) {
                        throw new \RuntimeException("Stok untuk varian '{$variant->name}' tidak mencukupi. Tersedia: {$variant->stock}, diminta: {$qty}.");
                    }
                }
            }

            // B. Server-side Pricing Recalculation (discards any client-sent prices/totals)
            $pricing = $this->pricingService->calculate($rawItems, $voucherCode, $userId);

            // C. Decrement stock atomically
            foreach ($pricing['items'] as $calcItem) {
                Product::where('id', $calcItem['product_id'])->decrement('stock', $calcItem['quantity']);
                if (!empty($calcItem['variant_id'])) {
                    ProductVariant::where('id', $calcItem['variant_id'])->decrement('stock', $calcItem['quantity']);
                }
            }

            // D. Generate Master Order Number
            $masterOrderNumber = 'PAS-' . date('Ymd') . '-' . strtoupper(Str::random(6));

            // Group items by shop for multi-vendor atomic sub-orders
            $itemsByShop = [];
            foreach ($pricing['items'] as $item) {
                $shopId = $item['shop_id'];
                if (!isset($itemsByShop[$shopId])) {
                    $itemsByShop[$shopId] = [];
                }
                $itemsByShop[$shopId][] = $item;
            }

            $createdOrders = [];
            $totalShops = count($itemsByShop);

            foreach ($itemsByShop as $shopId => $shopItems) {
                $shopSubtotal = array_sum(array_column($shopItems, 'subtotal'));
                $shopShipping = 15000.0;
                $proportion = $pricing['subtotal'] > 0 ? ($shopSubtotal / $pricing['subtotal']) : (1.0 / $totalShops);
                $shopVoucherDiscount = round($pricing['voucher_discount'] * $proportion, 2);
                $shopTax = round($pricing['tax'] * $proportion, 2);
                $shopTotal = round($shopSubtotal - $shopVoucherDiscount + $shopShipping + $shopTax, 2);

                $shopOrderNumber = $totalShops > 1
                    ? $masterOrderNumber . '-S' . $shopId
                    : $masterOrderNumber;

                $order = Order::create([
                    'order_number' => $shopOrderNumber,
                    'master_order_number' => $masterOrderNumber,
                    'user_id' => $userId,
                    'shop_id' => $shopId,
                    'customer_name' => $customerName,
                    'customer_email' => $customerEmail,
                    'customer_phone' => $customerPhone,
                    'shipping_address' => $shippingAddress,
                    'payment_method' => $paymentMethod,
                    'subtotal' => $shopSubtotal,
                    'tax' => $shopTax,
                    'discount' => $shopVoucherDiscount,
                    'shipping_cost' => $shopShipping,
                    'total' => $shopTotal,
                    'status' => 'paid',
                    'courier' => 'PASARIA Express',
                    'courier_service' => 'Reguler 2-3 Hari',
                    'tracking_number' => 'PAS-TRK-' . strtoupper(Str::random(8)),
                    'voucher_code' => $pricing['voucher_code'],
                    'voucher_discount' => $shopVoucherDiscount,
                    'idempotency_key' => $idempotencyKey,
                    'items_json' => $shopItems,
                ]);

                // Create OrderItem records
                foreach ($shopItems as $sItem) {
                    OrderItem::create([
                        'order_id' => $order->id,
                        'shop_id' => $shopId,
                        'product_id' => $sItem['product_id'],
                        'variant_id' => $sItem['variant_id'],
                        'product_name' => $sItem['product_name'],
                        'product_slug' => $sItem['product_slug'],
                        'price' => $sItem['price'],
                        'quantity' => $sItem['quantity'],
                        'color' => $sItem['color'],
                        'image' => $sItem['product_image'],
                        'subtotal' => $sItem['subtotal'],
                    ]);
                }

                // Create Payment record
                Payment::create([
                    'order_id' => $order->id,
                    'user_id' => $userId,
                    'transaction_id' => 'TXN-' . strtoupper(Str::random(10)),
                    'payment_method' => $paymentMethod,
                    'amount' => $shopTotal,
                    'status' => 'paid',
                    'paid_at' => now(),
                    'payload_json' => [
                        'gateway' => 'PASARIA Instant Gateway',
                        'method' => $paymentMethod,
                        'paid_at' => now()->toIso8601String(),
                    ],
                ]);

                // Create Shipment record & initial Event
                $shipmentId = 'SHP-' . strtoupper(Str::random(10));
                Shipment::create([
                    'shipment_id' => $shipmentId,
                    'order_number' => $shopOrderNumber,
                    'user_id' => $userId,
                    'courier_name' => 'PASARIA Express',
                    'courier_service' => 'Reguler Standard',
                    'tracking_number' => $order->tracking_number,
                    'status' => 'processing',
                    'status_label' => 'Pesanan Diproses Penjual',
                    'recipient_name' => $customerName,
                    'recipient_phone' => $customerPhone,
                    'delivery_address' => $shippingAddress,
                    'origin_address' => 'Gudang PASARIA Logistics, Jakarta Barat',
                    'estimated_arrival' => now()->addDays(3)->format('d M Y'),
                    'current_location' => 'Sorting Hub Jakarta Pusat',
                    'items_count' => count($shopItems),
                    'items_preview_json' => $shopItems,
                    'total_amount' => $shopTotal,
                    'checkpoints_json' => [
                        [
                            'id' => 'chk-1',
                            'title' => 'Pembayaran Terverifikasi & Pesanan Dibuat',
                            'location' => 'PASARIA Payment Gateway',
                            'timestamp' => now()->format('d M Y, H:i'),
                            'status' => 'completed',
                            'description' => 'Pembayaran berhasil dikonfirmasi secara aman.',
                        ],
                        [
                            'id' => 'chk-2',
                            'title' => 'Penjual Menyiapkan Pesanan',
                            'location' => 'Merchant Fulfillment Center',
                            'timestamp' => now()->addMinutes(10)->format('d M Y, H:i'),
                            'status' => 'current',
                            'description' => 'Penjual sedang mengemas produk dan mencetak label pengiriman.',
                        ],
                    ],
                ]);

                ShipmentEvent::create([
                    'shipment_id' => $shipmentId,
                    'title' => 'Pembayaran Terverifikasi',
                    'location' => 'PASARIA Payment Gateway',
                    'description' => 'Pesanan berhasil dibuat dan diteruskan ke penjual.',
                    'status' => 'completed',
                    'event_time' => now(),
                ]);

                $createdOrders[] = $order;
            }

            // E. Record Voucher Redemption if voucher was applied
            if (!empty($pricing['voucher_code'])) {
                $voucher = Voucher::where('code', $pricing['voucher_code'])->first();
                if ($voucher) {
                    $voucher->increment('usage_count');
                    VoucherRedemption::create([
                        'voucher_id' => $voucher->id,
                        'user_id' => $userId,
                        'order_id' => $createdOrders[0]->id,
                        'discount_amount' => $pricing['voucher_discount'],
                    ]);
                }
            }

            // F. Send in-app notification
            Notification::create([
                'user_id' => $userId,
                'title' => 'Pesanan Berhasil Dibuat!',
                'message' => "Pesanan #{$masterOrderNumber} telah berhasil dibuat dengan total Rp" . number_format($pricing['total'], 0, ',', '.') . ".",
                'type' => 'order',
                'action_url' => "/orders/{$masterOrderNumber}",
            ]);

            // G. Clear user's cart in database (both relational cart_items and legacy json)
            $userCart = Cart::where('user_id', $userId)->first();
            if ($userCart) {
                CartItem::where('cart_id', $userCart->id)->delete();
                $userCart->update(['items_json' => []]);
            }

            $result = [
                'success' => true,
                'order_number' => $masterOrderNumber,
                'master_order_number' => $masterOrderNumber,
                'transaction_id' => $masterOrderNumber,
                'orders_count' => count($createdOrders),
                'pricing' => $pricing,
                'message' => 'Pesanan berhasil dibuat dan diverifikasi oleh PASARIA.',
            ];

            // H. Persist Idempotency Key record
            if (!empty($idempotencyKey)) {
                try {
                    IdempotencyKey::create([
                        'key' => $idempotencyKey,
                        'user_id' => $userId,
                        'action' => 'checkout',
                        'resource_id' => $masterOrderNumber,
                        'response_json' => $result,
                    ]);
                } catch (\Throwable $e) {
                    // Ignore duplicate key race in database
                }
            }

            return $result;
        });
    }
}
