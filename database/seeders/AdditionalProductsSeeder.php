<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Product;

class AdditionalProductsSeeder extends Seeder
{
    /**
     * Run the database seeds to supplement products to at least 15 items
     * and cover all specified categories: Headphones, Earbuds, Speakers, Laptop, Accessories.
     */
    public function run(): void
    {
        $additionalProducts = [
            [
                'name' => 'Studio Pro Over-Ear ANC',
                'slug' => 'studio-pro-over-ear-anc',
                'category' => 'Headphones',
                'price' => 349.99,
                'original_price' => 399.99,
                'monthly_price' => 59.99,
                'short_desc' => 'High-resolution lossless spatial audio headphones',
                'description' => 'Custom 40mm active drivers delivering zero distortion at high volumes with personalized spatial audio.',
                'image' => 'studio-pro-anc',
                'rating' => 4.9,
                'review_count' => 148,
                'stock' => 20,
            ],
            [
                'name' => 'AeroTune True Wireless Earbuds',
                'slug' => 'aerotune-true-wireless-earbuds',
                'category' => 'Earbuds',
                'price' => 79.99,
                'original_price' => 99.99,
                'monthly_price' => 15.00,
                'short_desc' => 'Featherlight ergonomic earbuds with deep bass response',
                'description' => 'Engineered for all-day comfort with IPX7 sweat resistance, crystal clear call clarity, and quick charge.',
                'image' => 'aerotune-earbuds',
                'rating' => 4.8,
                'review_count' => 95,
                'stock' => 35,
            ],
            [
                'name' => 'SoundWave Horizon 360 Speaker',
                'slug' => 'soundwave-horizon-360-speaker',
                'category' => 'Speakers',
                'price' => 129.00,
                'original_price' => 159.00,
                'monthly_price' => 22.00,
                'short_desc' => 'Waterproof 360-degree room-filling acoustic speaker',
                'description' => 'Dual passive radiators and DSP sound processing deliver rich resonant sound anywhere indoors or outdoors.',
                'image' => 'soundwave-speaker',
                'rating' => 4.9,
                'review_count' => 210,
                'stock' => 18,
            ],
            [
                'name' => 'Ultrabook Air 14" M3',
                'slug' => 'ultrabook-air-14-m3',
                'category' => 'Laptop',
                'price' => 1199.00,
                'original_price' => 1299.00,
                'monthly_price' => 199.00,
                'short_desc' => 'Liquid Retina display, all-day 18-hour battery life',
                'description' => 'Next-generation performance in an impossibly thin aluminum enclosure with silent fanless thermal design.',
                'image' => 'ultrabook-air-14',
                'rating' => 5.0,
                'review_count' => 84,
                'stock' => 10,
            ],
            [
                'name' => 'MagStand Magnetic Charging Dock',
                'slug' => 'magstand-magnetic-charging-dock',
                'category' => 'Accessories',
                'price' => 49.50,
                'original_price' => 65.00,
                'monthly_price' => 9.50,
                'short_desc' => '3-in-1 fast wireless charging dock with aerospace aluminum arm',
                'description' => 'Simultaneously powers your smartphone, wireless earbuds, and smartwatch with weighted anti-slip base.',
                'image' => 'magstand-dock',
                'rating' => 4.7,
                'review_count' => 64,
                'stock' => 42,
            ],
        ];

        foreach ($additionalProducts as $item) {
            Product::updateOrCreate(['slug' => $item['slug']], $item);
        }
    }
}
