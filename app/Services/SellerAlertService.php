<?php

namespace App\Services;

use App\Models\Product;
use App\Models\SellerPreference;
use Illuminate\Support\Facades\Cache;

class SellerAlertService
{
    /**
     * Check if a product's stock has reached or dropped below the seller's low-stock threshold.
     */
    public static function handleLowStock(Product $product): bool
    {
        if (!$product->shop_id) {
            return false;
        }

        $sellerPref = SellerPreference::where('shop_id', $product->shop_id)->first();
        if (!$sellerPref || !$sellerPref->notify_low_stock) {
            return false;
        }

        $threshold = (int) ($sellerPref->low_stock_threshold ?: 5);

        // Check if stock is low (between 1 and threshold)
        if ($product->stock > 0 && $product->stock <= $threshold) {
            $cacheKey = "seller_low_stock_alert_{$product->id}_{$product->stock}";
            if (Cache::has($cacheKey)) {
                return false; // Prevent repeated alert for the same stock count
            }

            Cache::put($cacheKey, true, now()->addHours(12));

            NotificationDispatcher::dispatch(
                $sellerPref->user_id,
                'Peringatan Stok Menipis!',
                "Produk '{$product->name}' tersisa {$product->stock} unit (batas ambang: {$threshold}). Segera lakukan penambahan stok di Seller Center.",
                'system',
                '/seller/inventory'
            );

            return true;
        }

        return false;
    }
}
