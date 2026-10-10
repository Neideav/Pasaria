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
     * Execute atomic, concurrency-safe, idempotent server-controlled checkout.
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

        // 1. Validate structure and consolidate duplicate lines
        $consolidatedItems = [];
        $demandedProductStock = [];
        $demandedVariantStock = [];

        foreach ($rawItems as $item) {
            $pId = (int) ($item['product_id'] ?? $item['id'] ?? 0);
            if ($pId <= 0) {
                throw new \InvalidArgumentException("ID produk tidak valid.");
            }

            $qty = (int) ($item['quantity'] ?? 1);
            if ($qty < 1) {
                throw new \InvalidArgumentException("Jumlah item harus minimal 1.");
            }

            $vId = isset($item['variant_id']) && $item['variant_id'] !== '' && $item['variant_id'] !== null
                ? (int) $item['variant_id']
                : null;

            $color = $item['selectedColor'] ?? $item['color'] ?? null;
            $lineKey = "{$pId}:" . ($vId ?? 'null') . ":" . ($color ?? 'null');

            if (isset($consolidatedItems[$lineKey])) {
                $consolidatedItems[$lineKey]['quantity'] += $qty;
            } else {
                $consolidatedItems[$lineKey] = [
                    'product_id' => $pId,
                    'variant_id' => $vId,
                    'quantity'   => $qty,
                    'color'      => $color,
                ];
            }

            // Total demanded stock per base product
            $demandedProductStock[$pId] = ($demandedProductStock[$pId] ?? 0) + $qty;

            // Total demanded stock per variant
            if ($vId !== null) {
                $demandedVariantStock[$vId] = ($demandedVariantStock[$vId] ?? 0) + $qty;
            }
        }

        // 2. Canonical payload normalization & Request Hashing for Idempotency
        $canonicalItems = array_values($consolidatedItems);
        usort($canonicalItems, function ($a, $b) {
            return [$a['product_id'], $a['variant_id'] ?? 0, $a['color'] ?? '']
                <=> [$b['product_id'], $b['variant_id'] ?? 0, $b['color'] ?? ''];
        });

        $canonicalPayload = [
            'user_id'          => $userId,
            'items'            => $canonicalItems,
            'shipping_address' => $shippingAddress,
            'voucher_code'     => $voucherCode ? strtoupper($voucherCode) : null,
            'payment_method'   => strtolower($paymentMethod),
        ];
        $requestHash = hash('sha256', json_encode($canonicalPayload));

        // 3. Persistent & Concurrency-Safe Idempotency Handling
        $claim = null;
        if (!empty($idempotencyKey)) {
            $existing = IdempotencyKey::where('key', $idempotencyKey)
                ->where('user_id', $userId)
                ->where('action', 'checkout')
                ->first();

            if ($existing) {
                // Reject if key is reused with different payload parameters
                if (!empty($existing->request_hash) && $existing->request_hash !== $requestHash) {
                    throw new \InvalidArgumentException("Idempotency key sudah digunakan untuk request dengan payload berbeda.");
                }

                if ($existing->status === 'completed' && !empty($existing->response_json)) {
                    $cachedResponse = is_array($existing->response_json)
                        ? $existing->response_json
                        : json_decode($existing->response_json, true);
                    $cachedResponse['idempotent'] = true;
                    $cachedResponse['message'] = 'Pesanan sudah pernah dibuat (Idempotent replay).';
                    return $cachedResponse;
                }

                if ($existing->status === 'in_progress') {
                    if ($existing->created_at && $existing->created_at->diffInSeconds(now()) < 60) {
                        throw new \RuntimeException("Pesanan dengan idempotency key ini sedang diproses. Silakan tunggu.");
                    }
                    // Stale or abandoned in_progress claim (>60s), remove it to permit reclamation
                    $existing->delete();
                }
            }

            // Fallback check on orders table for historical records
            $existingOrder = Order::where('user_id', $userId)
                ->where('idempotency_key', $idempotencyKey)
                ->first();

            if ($existingOrder) {
                return [
                    'success'             => true,
                    'order_number'        => $existingOrder->master_order_number ?: $existingOrder->order_number,
                    'master_order_number' => $existingOrder->master_order_number ?: $existingOrder->order_number,
                    'total'               => (float) $existingOrder->total,
                    'status'              => $existingOrder->status,
                    'idempotent'          => true,
                    'message'             => 'Pesanan sudah pernah dibuat (Idempotent replay).',
                ];
            }

            // Atomically claim the idempotency key using database unique constraint
            try {
                $claim = IdempotencyKey::create([
                    'key'          => $idempotencyKey,
                    'user_id'      => $userId,
                    'action'       => 'checkout',
                    'request_hash' => $requestHash,
                    'status'       => 'in_progress',
                ]);
            } catch (\Illuminate\Database\QueryException $e) {
                // Concurrently claimed by parallel thread
                $existing = IdempotencyKey::where('key', $idempotencyKey)
                    ->where('user_id', $userId)
                    ->where('action', 'checkout')
                    ->first();

                if ($existing) {
                    if (!empty($existing->request_hash) && $existing->request_hash !== $requestHash) {
                        throw new \InvalidArgumentException("Idempotency key sudah digunakan untuk request dengan payload berbeda.");
                    }
                    if ($existing->status === 'completed' && !empty($existing->response_json)) {
                        $cachedResponse = is_array($existing->response_json)
                            ? $existing->response_json
                            : json_decode($existing->response_json, true);
                        $cachedResponse['idempotent'] = true;
                        $cachedResponse['message'] = 'Pesanan sudah pernah dibuat (Idempotent replay).';
                        return $cachedResponse;
                    }
                }
                throw new \RuntimeException("Pesanan dengan idempotency key ini sedang diproses secara simultan.");
            }
        }

        try {
            // 4. Atomic Database Transaction with Pessimistic Locking in Ascending Order
            return DB::transaction(function () use (
                $canonicalItems,
                $demandedProductStock,
                $demandedVariantStock,
                $voucherCode,
                $userId,
                $customerName,
                $customerEmail,
                $customerPhone,
                $shippingAddress,
                $paymentMethod,
                $idempotencyKey,
                $claim
            ) {
                // Lock and validate voucher if provided
                $lockedVoucher = null;
                if (!empty($voucherCode)) {
                    $lockedVoucher = Voucher::where('code', strtoupper(trim($voucherCode)))
                        ->lockForUpdate()
                        ->first();

                    if (!$lockedVoucher || !$lockedVoucher->is_active) {
                        throw new \InvalidArgumentException("Kode voucher tidak valid atau sudah dinonaktifkan.");
                    }
                    if ($lockedVoucher->usage_count >= $lockedVoucher->usage_limit) {
                        throw new \InvalidArgumentException("Kuota pemakaian voucher '{$lockedVoucher->name}' telah habis.");
                    }
                    if ($lockedVoucher->start_at && now()->lt($lockedVoucher->start_at)) {
                        throw new \InvalidArgumentException("Voucher belum dapat digunakan.");
                    }
                    if ($lockedVoucher->end_at && now()->gt($lockedVoucher->end_at)) {
                        throw new \InvalidArgumentException("Voucher telah kadaluarsa.");
                    }
                    if ($userId && !empty($lockedVoucher->usage_per_user) && $lockedVoucher->usage_per_user > 0) {
                        $userUsage = VoucherRedemption::where('voucher_id', $lockedVoucher->id)
                            ->where('user_id', $userId)
                            ->where('status', '!=', 'rolled_back')
                            ->count();
                        if ($userUsage >= $lockedVoucher->usage_per_user) {
                            throw new \InvalidArgumentException("Anda telah mencapai batas penggunaan maksimal ({$lockedVoucher->usage_per_user}x) untuk voucher ini.");
                        }
                    }
                }

                // A. Lock products in strict ascending ID order to prevent deadlocks
                $sortedProductIds = array_keys($demandedProductStock);
                sort($sortedProductIds, SORT_NUMERIC);

                $lockedProducts = Product::whereIn('id', $sortedProductIds)
                    ->orderBy('id', 'asc')
                    ->lockForUpdate()
                    ->get()
                    ->keyBy('id');

                foreach ($sortedProductIds as $pId) {
                    $product = $lockedProducts->get($pId);
                    if (!$product) {
                        throw new \InvalidArgumentException("Produk #{$pId} tidak ditemukan atau sudah tidak tersedia.");
                    }

                    // Check active status of product
                    if (isset($product->is_active) && !$product->is_active) {
                        throw new \InvalidArgumentException("Produk '{$product->name}' sedang tidak aktif dan tidak dapat dibeli.");
                    }
                    if (isset($product->status) && in_array(strtolower($product->status), ['inactive', 'suspended', 'archived', 'draft'])) {
                        throw new \InvalidArgumentException("Produk '{$product->name}' tidak aktif atau tidak dapat dijual.");
                    }

                    // Check seller shop status
                    if ($product->shop && in_array(strtolower($product->shop->status ?? ''), ['suspended', 'rejected', 'inactive'])) {
                        throw new \InvalidArgumentException("Toko '{$product->shop->name}' sedang tidak aktif atau ditangguhkan.");
                    }

                    $demandedQty = $demandedProductStock[$pId];
                    if ($product->stock < $demandedQty) {
                        throw new \RuntimeException("Stok untuk '{$product->name}' tidak mencukupi. Tersedia: {$product->stock}, diminta: {$demandedQty}.");
                    }
                }

                // B. Lock variants in strict ascending ID order
                if (!empty($demandedVariantStock)) {
                    $sortedVariantIds = array_keys($demandedVariantStock);
                    sort($sortedVariantIds, SORT_NUMERIC);

                    $lockedVariants = ProductVariant::whereIn('id', $sortedVariantIds)
                        ->orderBy('id', 'asc')
                        ->lockForUpdate()
                        ->get()
                        ->keyBy('id');

                    foreach ($sortedVariantIds as $vId) {
                        $variant = $lockedVariants->get($vId);
                        if (!$variant) {
                            throw new \InvalidArgumentException("Varian #{$vId} tidak ditemukan.");
                        }

                        if (isset($variant->is_active) && !$variant->is_active) {
                            throw new \InvalidArgumentException("Varian '{$variant->name}' sedang tidak aktif.");
                        }

                        $demandedQty = $demandedVariantStock[$vId];
                        if ($variant->stock < $demandedQty) {
                            throw new \RuntimeException("Stok untuk varian '{$variant->name}' tidak mencukupi. Tersedia: {$variant->stock}, diminta: {$demandedQty}.");
                        }
                    }
                }

                // C. Server-side Pricing Recalculation (discards any client-sent prices/totals)
                $pricing = $this->pricingService->calculate($canonicalItems, $voucherCode, $userId);

                // D. Decrement stock atomically with non-negative guarantee (stock >= demanded)
                foreach ($demandedProductStock as $pId => $demandedQty) {
                    $affected = Product::where('id', $pId)
                        ->where('stock', '>=', $demandedQty)
                        ->decrement('stock', $demandedQty);

                    if ($affected === 0) {
                        $p = $lockedProducts->get($pId);
                        $pName = $p ? $p->name : "#{$pId}";
                        throw new \RuntimeException("Gagal mengurangi stok untuk '{$pName}' karena stok berubah atau tidak mencukupi.");
                    }
                }

                foreach ($demandedVariantStock as $vId => $demandedQty) {
                    $affected = ProductVariant::where('id', $vId)
                        ->where('stock', '>=', $demandedQty)
                        ->decrement('stock', $demandedQty);

                    if ($affected === 0) {
                        throw new \RuntimeException("Gagal mengurangi stok untuk varian #{$vId} karena stok berubah atau tidak mencukupi.");
                    }
                }

                // E. Generate Master Order Number
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

                    // Initial order state is pending_payment (not assumed paid at creation)
                    $order = Order::create([
                        'order_number'        => $shopOrderNumber,
                        'master_order_number' => $masterOrderNumber,
                        'user_id'             => $userId,
                        'shop_id'             => $shopId,
                        'customer_name'       => $customerName,
                        'customer_email'      => $customerEmail,
                        'customer_phone'      => $customerPhone,
                        'shipping_address'    => $shippingAddress,
                        'payment_method'      => $paymentMethod,
                        'subtotal'            => $shopSubtotal,
                        'tax'                 => $shopTax,
                        'discount'            => $shopVoucherDiscount,
                        'shipping_cost'       => $shopShipping,
                        'total'               => $shopTotal,
                        'status'              => 'pending_payment',
                        'courier'             => 'PASARIA Express',
                        'courier_service'     => 'Reguler 2-3 Hari',
                        'tracking_number'     => 'PAS-TRK-' . strtoupper(Str::random(8)),
                        'voucher_code'        => $pricing['voucher_code'],
                        'voucher_discount'    => $shopVoucherDiscount,
                        'idempotency_key'     => $idempotencyKey,
                        'items_json'          => $shopItems,
                    ]);

                    // Create OrderItem records
                    foreach ($shopItems as $sItem) {
                        OrderItem::create([
                            'order_id'     => $order->id,
                            'shop_id'      => $shopId,
                            'product_id'   => $sItem['product_id'],
                            'variant_id'   => $sItem['variant_id'],
                            'product_name' => $sItem['product_name'],
                            'product_slug' => $sItem['product_slug'],
                            'price'        => $sItem['price'],
                            'quantity'     => $sItem['quantity'],
                            'color'        => $sItem['color'],
                            'image'        => $sItem['product_image'],
                            'subtotal'     => $sItem['subtotal'],
                        ]);
                    }

                    // Create Payment record in pending state
                    Payment::create([
                        'order_id'           => $order->id,
                        'user_id'            => $userId,
                        'transaction_id'     => 'TXN-' . strtoupper(Str::random(10)),
                        'payment_method'     => $paymentMethod,
                        'amount'             => $shopTotal,
                        'currency'           => 'IDR',
                        'provider'           => config('pasaria.payment.default', 'sandbox'),
                        'provider_reference' => $shopOrderNumber,
                        'status'             => 'pending',
                        'paid_at'            => null,
                        'payload_json'       => [
                            'gateway'    => config('pasaria.payment.default', 'sandbox'),
                            'method'     => $paymentMethod,
                            'created_at' => now()->toIso8601String(),
                        ],
                    ]);

                    // Create Shipment record in pending state
                    $shipmentId = 'SHP-' . strtoupper(Str::random(10));
                    Shipment::create([
                        'shipment_id'        => $shipmentId,
                        'order_number'       => $shopOrderNumber,
                        'user_id'            => $userId,
                        'courier_name'       => 'PASARIA Express',
                        'courier_service'    => 'Reguler Standard',
                        'tracking_number'    => $order->tracking_number,
                        'status'             => 'pending',
                        'status_label'       => 'Menunggu Pembayaran',
                        'recipient_name'     => $customerName,
                        'recipient_phone'    => $customerPhone,
                        'delivery_address'   => $shippingAddress,
                        'origin_address'     => 'Gudang PASARIA Logistics, Jakarta Barat',
                        'estimated_arrival'  => now()->addDays(3)->format('d M Y'),
                        'current_location'   => 'Sorting Hub Jakarta Pusat',
                        'items_count'        => count($shopItems),
                        'items_preview_json' => $shopItems,
                        'total_amount'       => $shopTotal,
                        'checkpoints_json'   => [
                            [
                                'id'          => 'chk-1',
                                'title'       => 'Pesanan Dibuat',
                                'location'    => 'PASARIA Payment Gateway',
                                'timestamp'   => now()->format('d M Y, H:i'),
                                'status'      => 'current',
                                'description' => 'Pesanan berhasil dibuat, menunggu konfirmasi pembayaran pelanggan.',
                            ],
                        ],
                    ]);

                    ShipmentEvent::create([
                        'shipment_id' => $shipmentId,
                        'title'       => 'Pesanan Dibuat',
                        'location'    => 'PASARIA Payment Gateway',
                        'description' => 'Pesanan berhasil dibuat dan menunggu pembayaran.',
                        'status'      => 'pending',
                        'event_time'  => now(),
                    ]);

                    $createdOrders[] = $order;
                }

                // F. Record Voucher Redemption if voucher was applied
                if (!empty($pricing['voucher_code'])) {
                    $voucherToRedeem = $lockedVoucher ?: Voucher::where('code', $pricing['voucher_code'])->lockForUpdate()->first();
                    if ($voucherToRedeem) {
                        $voucherToRedeem->increment('usage_count');
                        VoucherRedemption::create([
                            'voucher_id'      => $voucherToRedeem->id,
                            'user_id'         => $userId,
                            'order_id'        => $createdOrders[0]->id,
                            'discount_amount' => $pricing['voucher_discount'],
                            'status'          => 'applied',
                        ]);
                    }
                }

                // G. Send in-app notification
                Notification::create([
                    'user_id'    => $userId,
                    'title'      => 'Pesanan Berhasil Dibuat!',
                    'message'    => "Pesanan #{$masterOrderNumber} telah berhasil dibuat dengan total Rp" . number_format($pricing['total'], 0, ',', '.') . " dan menunggu pembayaran.",
                    'type'       => 'order',
                    'action_url' => "/orders/{$masterOrderNumber}",
                ]);

                // H. Clear user's cart in database
                $userCart = Cart::where('user_id', $userId)->first();
                if ($userCart) {
                    CartItem::where('cart_id', $userCart->id)->delete();
                    $userCart->update(['items_json' => []]);
                }

                $result = [
                    'success'             => true,
                    'order_number'        => $masterOrderNumber,
                    'master_order_number' => $masterOrderNumber,
                    'transaction_id'      => $masterOrderNumber,
                    'orders_count'        => count($createdOrders),
                    'pricing'             => $pricing,
                    'status'              => 'pending_payment',
                    'message'             => 'Pesanan berhasil dibuat dan menunggu verifikasi pembayaran.',
                ];

                // I. Finalize and persist claimed IdempotencyKey
                if ($claim) {
                    $claim->update([
                        'status'        => 'completed',
                        'resource_id'   => $masterOrderNumber,
                        'response_json' => $result,
                        'status_code'   => 201,
                    ]);
                }

                return $result;
            }, 3); // Automatically retry up to 3 times on database deadlock
        } catch (\Throwable $e) {
            // Rollback in-progress claim on failure to allow clean user retry
            if ($claim) {
                try {
                    $claim->delete();
                } catch (\Throwable $ignored) {}
            }
            throw $e;
        }
    }
}
