<?php

namespace App\Services;

use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Voucher;

class PricingService
{
    /**
     * Calculate order totals server-side.
     *
     * @param array $rawItems Array of ['product_id' => int, 'variant_id' => int|null, 'quantity' => int]
     * @param string|null $voucherCode
     * @param int|null $userId
     * @return array
     */
    public function calculate(array $rawItems, ?string $voucherCode = null, ?int $userId = null): array
    {
        if (empty($rawItems)) {
            throw new \InvalidArgumentException('Daftar item belanja tidak boleh kosong.');
        }

        // 1. Group and consolidate identical lines (same product_id, variant_id, and color)
        $consolidatedItems = [];
        foreach ($rawItems as $item) {
            $productId = (int) ($item['product_id'] ?? $item['id'] ?? 0);
            if ($productId <= 0) {
                throw new \InvalidArgumentException("ID produk tidak valid.");
            }

            $quantity = (int) ($item['quantity'] ?? 1);
            if ($quantity < 1) {
                throw new \InvalidArgumentException("Jumlah produk harus minimal 1.");
            }

            $variantId = isset($item['variant_id']) && $item['variant_id'] !== '' && $item['variant_id'] !== null
                ? (int) $item['variant_id']
                : null;

            $color = $item['selectedColor'] ?? $item['color'] ?? null;
            $lineKey = "{$productId}:" . ($variantId ?? 'null') . ":" . ($color ?? 'null');

            if (isset($consolidatedItems[$lineKey])) {
                $consolidatedItems[$lineKey]['quantity'] += $quantity;
            } else {
                $consolidatedItems[$lineKey] = [
                    'product_id' => $productId,
                    'variant_id' => $variantId,
                    'quantity' => $quantity,
                    'color' => $color,
                ];
            }
        }

        $calculatedItems = [];
        $subtotal = 0.0;
        $shopIds = [];

        // 2. Fetch products and shops from database to ensure fresh active status and pricing
        foreach ($consolidatedItems as $item) {
            $productId = $item['product_id'];
            $variantId = $item['variant_id'];
            $quantity = $item['quantity'];

            $product = Product::with('shop')->find($productId);
            if (!$product) {
                throw new \InvalidArgumentException("Produk dengan ID {$productId} tidak ditemukan atau sudah tidak tersedia.");
            }

            // Verify product is active
            if (isset($product->is_active) && !$product->is_active) {
                throw new \InvalidArgumentException("Produk '{$product->name}' sedang tidak aktif dan tidak dapat dibeli.");
            }
            if (isset($product->status) && in_array(strtolower($product->status), ['inactive', 'suspended', 'archived', 'draft'])) {
                throw new \InvalidArgumentException("Produk '{$product->name}' tidak aktif atau tidak dapat dijual.");
            }

            // Verify seller shop is active and approved
            if ($product->shop && in_array(strtolower($product->shop->status ?? ''), ['suspended', 'rejected', 'inactive'])) {
                throw new \InvalidArgumentException("Toko '{$product->shop->name}' sedang tidak aktif atau ditangguhkan.");
            }

            // Check min/max purchase limits if configured
            if (isset($product->min_order) && $product->min_order > 0 && $quantity < $product->min_order) {
                throw new \InvalidArgumentException("Jumlah pesanan untuk '{$product->name}' kurang dari batas minimum ({$product->min_order}).");
            }
            if (isset($product->max_order) && $product->max_order > 0 && $quantity > $product->max_order) {
                throw new \InvalidArgumentException("Jumlah pesanan untuk '{$product->name}' melebihi batas maksimum ({$product->max_order}).");
            }

            $price = (float) $product->price;
            $sku = null;
            $variantName = null;

            // Reject invalid or mismatched variant
            if ($variantId !== null) {
                $variant = ProductVariant::where('product_id', $productId)->find($variantId);
                if (!$variant) {
                    throw new \InvalidArgumentException("Varian #{$variantId} tidak ditemukan atau tidak sesuai untuk produk '{$product->name}'.");
                }
                if (isset($variant->is_active) && !$variant->is_active) {
                    throw new \InvalidArgumentException("Varian '{$variant->name}' sedang tidak aktif.");
                }
                $price = (float) $variant->price;
                $sku = $variant->sku;
                $variantName = $variant->name;
            }

            $itemSubtotal = round($price * $quantity, 2);
            $subtotal += $itemSubtotal;

            $shopId = (int) ($product->shop_id ?: 1);
            $shopIds[$shopId] = true;

            $calculatedItems[] = [
                'product_id' => $product->id,
                'variant_id' => $variantId,
                'product_name' => $product->name,
                'product_slug' => $product->slug,
                'product_image' => $product->image,
                'sku' => $sku,
                'variant_name' => $variantName,
                'color' => $item['color'],
                'price' => $price,
                'original_price' => (float) ($product->original_price ?: $price),
                'quantity' => $quantity,
                'subtotal' => $itemSubtotal,
                'shop_id' => $shopId,
                'shop_name' => $product->shop_name ?: ($product->shop?->name ?: 'PASARIA Official Store'),
            ];
        }

        // Multi-vendor shipping: IDR 15,000 per shop
        $numberOfShops = max(1, count($shopIds));
        $shippingCost = $numberOfShops * 15000.0;

        // Voucher discount calculation strictly server-side
        $voucherDiscount = 0.0;
        $appliedVoucher = null;

        if (!empty($voucherCode)) {
            $voucher = Voucher::where('code', strtoupper(trim($voucherCode)))
                ->where('is_active', true)
                ->first();

            if ($voucher) {
                $applicableSubtotal = $subtotal;
                $isShopMatch = true;
                if ($voucher->shop_id !== null) {
                    $shopItemsSubtotal = 0.0;
                    foreach ($calculatedItems as $cItem) {
                        if ((int) $cItem['shop_id'] === (int) $voucher->shop_id) {
                            $shopItemsSubtotal += $cItem['subtotal'];
                        }
                    }
                    if ($shopItemsSubtotal <= 0) {
                        $isShopMatch = false;
                    } else {
                        $applicableSubtotal = $shopItemsSubtotal;
                    }
                }

                if ($isShopMatch && $voucher->isValidForAmount($applicableSubtotal, $userId, $voucher->shop_id)) {
                    $voucherDiscount = $voucher->calculateDiscount($applicableSubtotal, $shippingCost, $userId, $voucher->shop_id);
                    $appliedVoucher = $voucher;
                }
            }
        }

        // Tax: 11% PPN on subtotal after voucher discount
        $taxableAmount = max(0, $subtotal - $voucherDiscount);
        $tax = round($taxableAmount * 0.11, 2);

        $total = max(0, round($subtotal - $voucherDiscount + $shippingCost + $tax, 2));

        return [
            'items' => $calculatedItems,
            'subtotal' => round($subtotal, 2),
            'shipping_cost' => round($shippingCost, 2),
            'voucher_code' => $appliedVoucher ? $appliedVoucher->code : null,
            'voucher_discount' => round($voucherDiscount, 2),
            'tax' => round($tax, 2),
            'total' => round($total, 2),
            'distinct_shops_count' => $numberOfShops,
        ];
    }
}
