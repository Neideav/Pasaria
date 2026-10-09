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

        $calculatedItems = [];
        $subtotal = 0.0;
        $shopIds = [];

        foreach ($rawItems as $item) {
            $productId = (int) ($item['product_id'] ?? $item['id'] ?? 0);
            $variantId = isset($item['variant_id']) && $item['variant_id'] !== '' && $item['variant_id'] !== null
                ? (int) $item['variant_id']
                : null;
            $quantity = (int) ($item['quantity'] ?? 1);

            if ($quantity < 1) {
                throw new \InvalidArgumentException("Jumlah produk harus minimal 1.");
            }

            $product = Product::find($productId);
            if (!$product) {
                throw new \InvalidArgumentException("Produk dengan ID {$productId} tidak ditemukan atau sudah tidak tersedia.");
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
                'color' => $item['selectedColor'] ?? $item['color'] ?? null,
                'price' => $price,
                'original_price' => (float) ($product->original_price ?: $price),
                'quantity' => $quantity,
                'subtotal' => $itemSubtotal,
                'shop_id' => $shopId,
                'shop_name' => $product->shop_name ?: 'PASARIA Official Store',
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

            if ($voucher && $voucher->isValidForAmount($subtotal)) {
                $voucherDiscount = $voucher->calculateDiscount($subtotal, $shippingCost);
                $appliedVoucher = $voucher;
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
