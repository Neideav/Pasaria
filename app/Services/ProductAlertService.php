<?php

namespace App\Services;

use App\Models\Product;
use App\Models\ProductAlert;
use App\Models\UserNotificationPreference;
use Illuminate\Support\Facades\DB;

class ProductAlertService
{
    /**
     * Trigger eligible price-drop and target-price alerts when a product price changes.
     */
    public static function handlePriceDrop(Product $product, float $oldPrice, float $newPrice): int
    {
        if ($newPrice >= $oldPrice) {
            return 0;
        }

        $alerts = ProductAlert::where('product_id', $product->id)
            ->where('is_active', true)
            ->whereIn('alert_type', ['price_drop', 'target_price'])
            ->get();

        $notifiedCount = 0;

        foreach ($alerts as $alert) {
            $shouldNotify = false;

            if ($alert->alert_type === 'price_drop') {
                $shouldNotify = true;
            } elseif ($alert->alert_type === 'target_price') {
                if ($alert->target_price !== null && (float)$newPrice <= (float)$alert->target_price) {
                    $shouldNotify = true;
                }
            }

            if ($shouldNotify) {
                // Throttle: avoid spamming within 1 hour for the same alert
                if ($alert->last_notified_at && now()->diffInMinutes($alert->last_notified_at) < 60) {
                    continue;
                }

                $alert->last_observed_price = $newPrice;
                $alert->last_notified_at = now();
                $alert->save();

                $formattedNew = number_format($newPrice, 0, ',', '.');
                $formattedOld = number_format($oldPrice, 0, ',', '.');

                NotificationDispatcher::dispatch(
                    $alert->user_id,
                    'Penurunan Harga Produk!',
                    "Harga untuk '{$product->name}' turun menjadi Rp{$formattedNew} (sebelumnya Rp{$formattedOld}). Segera cek sebelum kehabisan!",
                    'price_alert',
                    "/products/{$product->slug}"
                );

                $notifiedCount++;
            }
        }

        return $notifiedCount;
    }

    /**
     * Trigger back-in-stock alerts when stock transitions from 0 to > 0.
     */
    public static function handleBackInStock(Product $product): int
    {
        if ($product->stock <= 0) {
            return 0;
        }

        $alerts = ProductAlert::where('product_id', $product->id)
            ->where('is_active', true)
            ->where('alert_type', 'back_in_stock')
            ->get();

        $notifiedCount = 0;

        foreach ($alerts as $alert) {
            if ($alert->last_notified_at && now()->diffInMinutes($alert->last_notified_at) < 60) {
                continue;
            }

            $alert->last_observed_price = $product->price;
            $alert->last_notified_at = now();
            $alert->save();

            NotificationDispatcher::dispatch(
                $alert->user_id,
                'Produk Tersedia Kembali!',
                "Produk impian Anda '{$product->name}' kini kembali tersedia dengan stok {$product->stock} unit. Segera pesan sekarang!",
                'stock_alert',
                "/products/{$product->slug}"
            );

            $notifiedCount++;
        }

        return $notifiedCount;
    }

    /**
     * Trigger shop-follow new product alerts when seller publishes a new product.
     */
    public static function handleNewProductPublished(Product $product): int
    {
        if (!$product->shop_id) {
            return 0;
        }

        $followerUserIds = DB::table('shop_followers')
            ->where('shop_id', $product->shop_id)
            ->where('notify_new_products', true)
            ->pluck('user_id');

        $notifiedCount = 0;

        foreach ($followerUserIds as $userId) {
            NotificationDispatcher::dispatch(
                (int)$userId,
                'Produk Baru dari Toko Favorit!',
                "Toko '{$product->shop_name}' baru saja merilis produk baru: '{$product->name}'. Lihat koleksi terbarunya sekarang!",
                'shop',
                "/products/{$product->slug}"
            );
            $notifiedCount++;
        }

        return $notifiedCount;
    }
}
