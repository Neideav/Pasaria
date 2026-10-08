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
        $calculatedItems = [];
        $subtotal = 0.0;
        $shopIds = [];

        foreach ($rawItems as $item) {
            $productId = (int) ($item['product_id'] ?? $item['id'] ?? 0);
            $variantId = isset($item['variant_id']) ? (int) $item['variant_id'] : null;
            $quantity = max(1, (int) ($item['quantity'] ?? 1));

            $product = Product::find($productId);
            if (!$product) {
                throw new \InvalidArgumentException("Product with ID {$productId} not found or unavailable.");
            }

            $price = (float) $product->price;
            $sku = null;
            $variantName = null;

            if ($variantId) {
                $variant = ProductVariant::where('product_id', $productId)->find($variantId);
                if ($variant) {
                    $price = (float) $variant->price;
                    $sku = $variant->sku;
                    $variantName = $variant->name;
                }
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

        // Voucher discount calculation
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

        // Tax: 11% PPN on subtotal after discount
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
