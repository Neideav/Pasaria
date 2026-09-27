<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use App\Models\Order;
use App\Models\OrderItem;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Categories
        $categories = [
            ['name' => 'Headphone', 'slug' => 'headphones', 'item_count' => 240, 'icon' => 'headphones'],
            ['name' => 'Furniture', 'slug' => 'furniture', 'item_count' => 240, 'icon' => 'armchair'],
            ['name' => 'Shoe', 'slug' => 'shoes', 'item_count' => 240, 'icon' => 'footprints'],
            ['name' => 'Bag', 'slug' => 'bags', 'item_count' => 240, 'icon' => 'shopping-bag'],
            ['name' => 'Laptop', 'slug' => 'laptops', 'item_count' => 240, 'icon' => 'laptop'],
            ['name' => 'Book', 'slug' => 'books', 'item_count' => 240, 'icon' => 'book'],
        ];

        foreach ($categories as $cat) {
            Category::updateOrCreate(['slug' => $cat['slug']], $cat);
        }

        // 2. Demo Users
        $customer = User::updateOrCreate(
            ['email' => 'customer@shopcart.com'],
            [
                'name' => 'Wade Warren',
                'username' => 'wadewarren',
                'password' => Hash::make('password123'),
                'address' => '4140 Parker Rd.',
                'city' => 'Allentown',
                'zip' => '31134',
                'phone' => '+001234567890',
                'role' => 'customer',
            ]
        );

        $admin = User::updateOrCreate(
            ['email' => 'admin@shopcart.com'],
            [
                'name' => 'Administrator',
                'username' => 'admin',
                'password' => Hash::make('admin123'),
                'address' => '100 Executive Way',
                'city' => 'San Francisco',
                'zip' => '94105',
                'phone' => '+001987654321',
                'role' => 'admin',
            ]
        );

        // 3. Products
        $products = [
            [
                'name' => 'Airpods- Max',
                'slug' => 'airpods-max',
                'category' => 'Headphone',
                'price' => 549.00,
                'original_price' => 599.00,
                'monthly_price' => 99.99,
                'short_desc' => 'a perfect balance of exhilarating high-fidelity audio and the effortless magic of AirPods.',
                'description' => 'Apple-designed dynamic driver provides high-fidelity audio. Active Noise Cancellation with Transparency mode.',
                'image' => 'airpods-max',
                'rating' => 5.0,
                'review_count' => 121,
                'stock' => 12,
                'colors' => [
                    ['name' => 'Pink', 'hex' => '#e87373'],
                    ['name' => 'Space Gray', 'hex' => '#44474d'],
                    ['name' => 'Green', 'hex' => '#b3cfbe'],
                    ['name' => 'Silver', 'hex' => '#dce0e3'],
                    ['name' => 'Sky Blue', 'hex' => '#7795ad'],
                ],
                'specs' => [
                    'General' => ['Brand' => 'Apple', 'Model' => 'AirPods Max', 'Connectivity' => 'Bluetooth 5.0'],
                    'ProductDetails' => ['BatteryLife' => '20 Hours', 'Weight' => '384.8g', 'NoiseCancellation' => 'Active']
                ]
            ],
            [
                'name' => 'Wireless Earbuds, IPX8',
                'slug' => 'wireless-earbuds-ipx8',
                'category' => 'Headphone',
                'price' => 89.00,
                'original_price' => 119.00,
                'monthly_price' => 19.99,
                'short_desc' => 'Organic Cotton, fairtrade certified casing',
                'description' => 'High performance IPX8 waterproof bluetooth earbuds with dual LED digital battery display case.',
                'image' => 'wireless-earbuds-ipx8',
                'rating' => 4.9,
                'review_count' => 121,
                'stock' => 25,
            ],
            [
                'name' => 'Bose BT Earphones',
                'slug' => 'bose-bt-earphones',
                'category' => 'Headphone',
                'price' => 289.00,
                'original_price' => 329.00,
                'monthly_price' => 49.99,
                'short_desc' => 'Table with air purifier, stained venner/black',
                'description' => 'World-class noise cancellation headphones engineered with proprietary acoustic technologies.',
                'image' => 'bose-bt-earphones',
                'rating' => 4.8,
                'review_count' => 121,
                'stock' => 18,
            ],
            [
                'name' => 'VIVEFOX Headphones',
                'slug' => 'vivefox-headphones',
                'category' => 'Headphone',
                'price' => 39.00,
                'original_price' => 49.00,
                'monthly_price' => 9.99,
                'short_desc' => 'Wired Stereo Headsets With Mic',
                'description' => 'Comfortable on-ear wired headphones with tangle-free 3.5mm braided cable and in-line HD mic.',
                'image' => 'vivefox-headphones',
                'rating' => 4.7,
                'review_count' => 121,
                'stock' => 40,
            ],
            [
                'name' => 'JBL TUNE 600BTNC',
                'slug' => 'jbl-tune-600btnc',
                'category' => 'Headphone',
                'price' => 59.00,
                'original_price' => 79.00,
                'monthly_price' => 14.99,
                'short_desc' => 'Premium Bone Conduction Open Ear Bluetooth',
                'description' => 'JBL Pure Bass Sound with active noise cancellation and flat folding design.',
                'image' => 'jbl-tune-600btnc',
                'rating' => 4.9,
                'review_count' => 121,
                'stock' => 30,
            ],
            [
                'name' => 'TAGRY Bluetooth',
                'slug' => 'tagry-bluetooth',
                'category' => 'Headphone',
                'price' => 109.00,
                'original_price' => 139.00,
                'monthly_price' => 24.99,
                'short_desc' => '256, 8 core GPU, 8 GB audio acceleration',
                'description' => 'Cyber-case wireless earbuds with dual LED battery monitor and 60 hours total endurance.',
                'image' => 'tagry-bluetooth',
                'rating' => 5.0,
                'review_count' => 121,
                'stock' => 22,
            ],
            [
                'name' => 'Monster MNFLEX',
                'slug' => 'monster-mnflex',
                'category' => 'Headphone',
                'price' => 89.75,
                'original_price' => 110.00,
                'monthly_price' => 18.50,
                'short_desc' => 'Flex Active Noise Canceling Bluetooth',
                'description' => 'Ergonomic neckband open-ear sports earphones engineered for runners and athletes.',
                'image' => 'monster-mnflex',
                'rating' => 4.8,
                'review_count' => 121,
                'stock' => 19,
            ],
            [
                'name' => 'Mpow CH6',
                'slug' => 'mpow-ch6',
                'category' => 'Headphone',
                'price' => 569.00,
                'original_price' => 599.00,
                'monthly_price' => 99.00,
                'short_desc' => 'Kids Headphones With Mic, Hearing Protection',
                'description' => 'Safe 85dB volume limiting over-ear headphones with ultra-soft plush ear cushions.',
                'image' => 'mpow-ch6',
                'rating' => 5.0,
                'review_count' => 121,
                'stock' => 14,
            ],
            [
                'name' => 'TaoTronics Earbuds',
                'slug' => 'taotronics-earbuds',
                'category' => 'Headphone',
                'price' => 59.00,
                'original_price' => 79.00,
                'monthly_price' => 12.00,
                'short_desc' => 'Wireless Earbuds with Smart Touch',
                'description' => 'True wireless earbuds with smart touch controls and clear voice noise reduction.',
                'image' => 'taotronics-earbuds',
                'rating' => 4.8,
                'review_count' => 121,
                'stock' => 35,
            ],
            [
                'name' => 'Gaming Headphone',
                'slug' => 'gaming-headphone',
                'category' => 'Accessories',
                'price' => 239.00,
                'original_price' => 279.00,
                'monthly_price' => 45.00,
                'short_desc' => 'Table with air purifier, stained venner/black',
                'description' => 'Pro tournament grade esports gaming headset with 7.1 virtual surround sound.',
                'image' => 'gaming-headphone',
                'rating' => 4.9,
                'review_count' => 121,
                'stock' => 15,
            ],
            [
                'name' => 'Macbook pro 13"',
                'slug' => 'macbook-pro-13',
                'category' => 'Laptop',
                'price' => 1099.00,
                'original_price' => 1299.00,
                'monthly_price' => 189.00,
                'short_desc' => '256, 8 core GPU, 8 GB Unified Memory',
                'description' => 'Retina display, Magic Keyboard, Touch ID, and incredible battery life.',
                'image' => 'macbook-pro-13',
                'rating' => 5.0,
                'review_count' => 121,
                'stock' => 8,
            ],
            [
                'name' => 'HomePod mini',
                'slug' => 'homepod-mini',
                'category' => 'Speakers',
                'price' => 59.00,
                'original_price' => 99.00,
                'monthly_price' => 12.00,
                'short_desc' => '5 Colors Available, Room-filling 360-degree sound',
                'description' => 'Compact acoustic powerhouse designed to fit anywhere in the home.',
                'image' => 'homepod-mini',
                'rating' => 4.8,
                'review_count' => 121,
                'stock' => 24,
            ],
            [
                'name' => 'Laptop sleeve MacBook',
                'slug' => 'laptop-sleeve-macbook',
                'category' => 'Accessories',
                'price' => 59.00,
                'original_price' => 69.00,
                'monthly_price' => 11.00,
                'short_desc' => 'Organic Cotton, fairtrade certified',
                'description' => 'Tailored protective sleeve crafted from organic water-repellent canvas.',
                'image' => 'laptop-sleeve-macbook',
                'rating' => 4.9,
                'review_count' => 121,
                'stock' => 35,
            ]
        ];

        foreach ($products as $p) {
            Product::updateOrCreate(['slug' => $p['slug']], $p);
        }

        // 4. Initial Demo Order
        Order::updateOrCreate(
            ['order_number' => '9945284820'],
            [
                'user_id' => $customer->id,
                'customer_name' => 'Wade Warren',
                'customer_email' => 'customer@shopcart.com',
                'shipping_address' => '4140 Parker Rd. Allentown, New Mexico 31134',
                'payment_method' => 'Credit or Debit Card',
                'subtotal' => 549.00,
                'tax' => 54.90,
                'discount' => 54.90,
                'shipping_cost' => 0.00,
                'total' => 494.10,
                'status' => 'Delivered',
                'items_json' => [
                    [
                        'id' => 1,
                        'name' => 'Airpods- Max',
                        'slug' => 'airpods-max',
                        'price' => 549.00,
                        'quantity' => 1,
                        'color' => 'Pink'
                    ]
                ]
            ]
        );

        // 5. Call Additional Products Seeder
        $this->call(AdditionalProductsSeeder::class);
    }
}
