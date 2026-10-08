<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\Category;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\User;
use App\Models\UserAddress;
use App\Models\Shop;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\Shipment;
use App\Models\ShipmentEvent;
use App\Models\Review;
use App\Models\ProductQuestion;
use App\Models\ProductAnswer;
use App\Models\Voucher;
use App\Models\Wallet;
use App\Models\Notification;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Categories
        $categories = [
            ['name' => 'Audio & Headphone', 'slug' => 'headphones', 'item_count' => 240, 'icon' => 'headphones'],
            ['name' => 'Furniture & Rumah', 'slug' => 'furniture', 'item_count' => 180, 'icon' => 'armchair'],
            ['name' => 'Sepatu & Fashion', 'slug' => 'shoes', 'item_count' => 310, 'icon' => 'footprints'],
            ['name' => 'Tas & Aksesoris', 'slug' => 'bags', 'item_count' => 150, 'icon' => 'shopping-bag'],
            ['name' => 'Laptop & Komputer', 'slug' => 'laptops', 'item_count' => 120, 'icon' => 'laptop'],
            ['name' => 'Buku & Edukasi', 'slug' => 'books', 'item_count' => 95, 'icon' => 'book'],
        ];

        foreach ($categories as $cat) {
            Category::updateOrCreate(['slug' => $cat['slug']], $cat);
        }

        // 2. Users for all 4 roles
        $customer = User::updateOrCreate(
            ['username' => 'budisantoso'],
            [
                'name' => 'Budi Santoso',
                'email' => 'customer@pasaria.id',
                'password' => Hash::make('password123'),
                'address' => 'Jl. Sudirman No. 45, RT 02 / RW 05',
                'city' => 'Jakarta Selatan',
                'zip' => '12190',
                'phone' => '+62 812-3456-7890',
                'role' => 'customer',
                'status' => 'active',
                'email_verified_at' => now(),
            ]
        );

        $sellerUser = User::updateOrCreate(
            ['username' => 'hendrowijaya'],
            [
                'name' => 'Hendro Wijaya',
                'email' => 'seller@pasaria.id',
                'password' => Hash::make('password123'),
                'address' => 'Ruko ITC Cempaka Mas Blok B No. 12',
                'city' => 'Jakarta Pusat',
                'zip' => '10640',
                'phone' => '+62 813-8899-7766',
                'role' => 'seller',
                'status' => 'active',
                'email_verified_at' => now(),
            ]
        );

        $admin = User::updateOrCreate(
            ['username' => 'admin'],
            [
                'name' => 'PASARIA Administrator',
                'email' => 'admin@pasaria.id',
                'password' => Hash::make('admin123'),
                'address' => 'Gedung PASARIA Tower Lantai 18',
                'city' => 'Jakarta Selatan',
                'zip' => '12950',
                'phone' => '+62 811-0000-1111',
                'role' => 'admin',
                'status' => 'active',
                'email_verified_at' => now(),
            ]
        );

        $support = User::updateOrCreate(
            ['username' => 'support'],
            [
                'name' => 'Customer Care PASARIA',
                'email' => 'support@pasaria.id',
                'password' => Hash::make('support123'),
                'address' => 'PASARIA Care Center',
                'city' => 'Jakarta Barat',
                'zip' => '11480',
                'phone' => '+62 800-1234-5678',
                'role' => 'support',
                'status' => 'active',
                'email_verified_at' => now(),
            ]
        );

        // User Addresses
        UserAddress::updateOrCreate(
            ['user_id' => $customer->id, 'recipient_name' => 'Budi Santoso (Rumah)'],
            [
                'phone' => '+62 812-3456-7890',
                'address_line' => 'Jl. Sudirman No. 45, Komplek Perumahan Indah',
                'city' => 'Jakarta Selatan',
                'province' => 'DKI Jakarta',
                'postal_code' => '12190',
                'is_default' => true,
            ]
        );

        // 3. Shops
        $officialShop = Shop::updateOrCreate(
            ['slug' => 'pasaria-official'],
            [
                'user_id' => $admin->id,
                'name' => 'PASARIA Official Store',
                'slogan' => 'Pusat Belanja Terpercaya & Terlengkap',
                'description' => 'Toko resmi langsung dari PASARIA yang menjamin 100% keaslian produk dan garansi resmi.',
                'city' => 'Jakarta Selatan',
                'phone' => '+62 811-0000-1111',
                'rating' => 4.9,
                'review_count' => 1240,
                'verified' => true,
                'status' => 'approved',
                'total_sales' => 185000000,
            ]
        );

        $sellerShop = Shop::updateOrCreate(
            ['slug' => 'techzone-gadget'],
            [
                'user_id' => $sellerUser->id,
                'name' => 'TechZone Gadget Store',
                'slogan' => 'Original Audio & Smart Electronics Specialist',
                'description' => 'Distributor terpercaya untuk headphone premium, wireless earbuds, dan aksesoris audio berkualitas tinggi.',
                'city' => 'Jakarta Pusat',
                'phone' => '+62 813-8899-7766',
                'rating' => 4.8,
                'review_count' => 380,
                'verified' => true,
                'status' => 'approved',
                'total_sales' => 42000000,
            ]
        );

        // 4. Products with IDR / Rupiah values
        $products = [
            [
                'name' => 'AirPods Max Wireless Over-Ear',
                'slug' => 'airpods-max',
                'category' => 'Audio & Headphone',
                'price' => 8499000.00,
                'original_price' => 8999000.00,
                'monthly_price' => 749000.00,
                'short_desc' => 'Keseimbangan sempurna antara audio fidelitas tinggi dan keajaiban AirPods.',
                'description' => 'Driver dinamis rancangan Apple memberikan audio fidelitas tinggi. Peredam Kebisingan Aktif dengan mode Transparansi. Audio spasial dengan pelacakan gerakan kepala dinamis menghadirkan suara teater di sekeliling Anda.',
                'image' => 'airpods-max',
                'rating' => 5.0,
                'review_count' => 128,
                'stock' => 15,
                'shop_id' => $officialShop->id,
                'shop_name' => $officialShop->name,
                'shop_city' => $officialShop->city,
                'colors' => [
                    ['name' => 'Pink Coral', 'hex' => '#e87373'],
                    ['name' => 'Space Gray', 'hex' => '#44474d'],
                    ['name' => 'Silver White', 'hex' => '#dce0e3'],
                    ['name' => 'Sky Blue', 'hex' => '#7795ad'],
                ],
                'specs' => [
                    'General' => ['Brand' => 'Apple', 'Model' => 'AirPods Max', 'Konektivitas' => 'Bluetooth 5.0'],
                    'Spesifikasi' => ['Baterai' => 'Hingga 20 Jam', 'Fitur' => 'Active Noise Cancellation', 'Garansi' => '1 Tahun Resmi TAM']
                ]
            ],
            [
                'name' => 'Wireless Earbuds IPX8 Waterproof Bass',
                'slug' => 'wireless-earbuds-ipx8',
                'category' => 'Audio & Headphone',
                'price' => 1350000.00,
                'original_price' => 1750000.00,
                'monthly_price' => 125000.00,
                'short_desc' => 'Earbuds tahan air dengan deep punchy bass dan LED display baterai digital.',
                'description' => 'Earbuds bluetooth performa tinggi dengan sertifikasi tahan air IPX8, dual LED display baterai, dan daya tahan hingga 48 jam penggunaan.',
                'image' => 'wireless-earbuds-ipx8',
                'rating' => 4.9,
                'review_count' => 96,
                'stock' => 35,
                'shop_id' => $sellerShop->id,
                'shop_name' => $sellerShop->name,
                'shop_city' => $sellerShop->city,
                'colors' => [
                    ['name' => 'Midnight Black', 'hex' => '#1c1c1e'],
                    ['name' => 'Frost White', 'hex' => '#f2f2f7'],
                ],
            ],
            [
                'name' => 'Bose QuietComfort BT Earphones',
                'slug' => 'bose-bt-earphones',
                'category' => 'Audio & Headphone',
                'price' => 4450000.00,
                'original_price' => 4990000.00,
                'monthly_price' => 395000.00,
                'short_desc' => 'World-class noise cancellation dengan suara jernih dan imersif.',
                'description' => 'Headphone noise cancellation kelas dunia yang dirancang dengan teknologi akustik eksklusif untuk suara jernih dan nyaman dipakai berjam-jam.',
                'image' => 'bose-bt-earphones',
                'rating' => 4.8,
                'review_count' => 74,
                'stock' => 12,
                'shop_id' => $officialShop->id,
                'shop_name' => $officialShop->name,
                'shop_city' => $officialShop->city,
            ],
            [
                'name' => 'MacBook Pro 14 M3 Pro Chip',
                'slug' => 'macbook-pro-13',
                'category' => 'Laptop & Komputer',
                'price' => 28999000.00,
                'original_price' => 31999000.00,
                'monthly_price' => 2500000.00,
                'short_desc' => 'Performa profesional bertenaga dengan Liquid Retina XDR display.',
                'description' => 'Laptop bertenaga dengan arsitektur chip tercanggih, daya tahan baterai hingga 22 jam, dan layar Liquid Retina XDR memukau.',
                'image' => 'macbook-pro-13',
                'rating' => 5.0,
                'review_count' => 42,
                'stock' => 8,
                'shop_id' => $officialShop->id,
                'shop_name' => $officialShop->name,
                'shop_city' => $officialShop->city,
            ],
            [
                'name' => 'JBL TUNE ANC Pure Bass Headset',
                'slug' => 'jbl-tune-600btnc',
                'category' => 'Audio & Headphone',
                'price' => 899000.00,
                'original_price' => 1199000.00,
                'monthly_price' => 89000.00,
                'short_desc' => 'JBL Pure Bass Sound dengan active noise cancellation.',
                'description' => 'Streaming nirkabel beresolusi tinggi dengan bass bertenaga dan desain lipat yang ringkas dibawa bepergian.',
                'image' => 'jbl-tune-600btnc',
                'rating' => 4.8,
                'review_count' => 110,
                'stock' => 20,
                'shop_id' => $sellerShop->id,
                'shop_name' => $sellerShop->name,
                'shop_city' => $sellerShop->city,
            ],
        ];

        foreach ($products as $pData) {
            $product = Product::updateOrCreate(['slug' => $pData['slug']], $pData);

            // Add variants
            ProductVariant::updateOrCreate(
                ['product_id' => $product->id, 'sku' => strtoupper($product->slug) . '-STD'],
                [
                    'name' => 'Edisi Standar',
                    'price' => $product->price,
                    'stock' => $product->stock,
                    'weight_grams' => 350,
                ]
            );
        }

        // 5. Vouchers
        Voucher::updateOrCreate(
            ['code' => 'PASARIAHEMAT'],
            [
                'name' => 'Diskon Kilat PASARIA 10%',
                'type' => 'percentage',
                'discount_value' => 10.0,
                'min_purchase' => 100000.0,
                'max_discount' => 50000.0,
                'usage_limit' => 500,
                'usage_count' => 12,
                'is_active' => true,
            ]
        );

        Voucher::updateOrCreate(
            ['code' => 'GRATISONGKIR'],
            [
                'name' => 'Voucher Gratis Ongkir PASARIA Express',
                'type' => 'free_shipping',
                'discount_value' => 15000.0,
                'min_purchase' => 50000.0,
                'max_discount' => 15000.0,
                'usage_limit' => 1000,
                'usage_count' => 45,
                'is_active' => true,
            ]
        );

        // 6. Demo Orders & Order Items
        $firstProduct = Product::where('slug', 'airpods-max')->first();
        $sampleOrder = Order::updateOrCreate(
            ['order_number' => 'PAS-20261008-994528'],
            [
                'master_order_number' => 'PAS-20261008-994528',
                'user_id' => $customer->id,
                'shop_id' => $officialShop->id,
                'customer_name' => 'Budi Santoso',
                'customer_email' => 'customer@pasaria.id',
                'customer_phone' => '+62 812-3456-7890',
                'shipping_address' => 'Jl. Sudirman No. 45, Jakarta Selatan 12190',
                'payment_method' => 'QRIS Instant',
                'subtotal' => 8499000.00,
                'tax' => 929390.00,
                'discount' => 50000.00,
                'shipping_cost' => 15000.00,
                'total' => 9393390.00,
                'status' => 'delivered',
                'courier' => 'PASARIA Express',
                'courier_service' => 'Reguler Standard',
                'tracking_number' => 'PAS-TRK-88991122',
                'voucher_code' => 'PASARIAHEMAT',
                'voucher_discount' => 50000.00,
                'items_json' => [
                    [
                        'id' => $firstProduct->id,
                        'name' => $firstProduct->name,
                        'slug' => $firstProduct->slug,
                        'price' => $firstProduct->price,
                        'quantity' => 1,
                        'color' => 'Space Gray',
                        'image' => $firstProduct->image,
                    ]
                ],
            ]
        );

        $orderItem = OrderItem::updateOrCreate(
            ['order_id' => $sampleOrder->id, 'product_id' => $firstProduct->id],
            [
                'shop_id' => $officialShop->id,
                'product_name' => $firstProduct->name,
                'product_slug' => $firstProduct->slug,
                'price' => $firstProduct->price,
                'quantity' => 1,
                'color' => 'Space Gray',
                'image' => $firstProduct->image,
                'subtotal' => $firstProduct->price,
            ]
        );

        // Payment Record
        Payment::updateOrCreate(
            ['order_id' => $sampleOrder->id],
            [
                'user_id' => $customer->id,
                'transaction_id' => 'TXN-PAS-889900',
                'payment_method' => 'QRIS Instant',
                'amount' => $sampleOrder->total,
                'status' => 'paid',
                'paid_at' => now()->subDays(2),
            ]
        );

        // Shipment Record
        $shipment = Shipment::updateOrCreate(
            ['shipment_id' => 'SHP-PAS-994528'],
            [
                'order_number' => $sampleOrder->order_number,
                'user_id' => $customer->id,
                'courier_name' => 'PASARIA Express',
                'courier_service' => 'Reguler Standard',
                'tracking_number' => $sampleOrder->tracking_number,
                'status' => 'delivered',
                'status_label' => 'Paket Telah Diterima Pembeli',
                'recipient_name' => 'Budi Santoso',
                'recipient_phone' => '+62 812-3456-7890',
                'delivery_address' => 'Jl. Sudirman No. 45, Jakarta Selatan 12190',
                'origin_address' => 'Gudang Pusat PASARIA Logistics, Jakarta Barat',
                'estimated_arrival' => now()->format('d M Y'),
                'current_location' => 'Alamat Tujuan (Diterima)',
                'items_count' => 1,
                'total_amount' => $sampleOrder->total,
                'checkpoints_json' => [
                    [
                        'id' => 'c1',
                        'title' => 'Pesanan Berhasil Dibayar',
                        'location' => 'PASARIA Payment Gateway',
                        'timestamp' => now()->subDays(2)->format('d M Y, 10:15'),
                        'status' => 'completed',
                        'description' => 'Pembayaran QRIS telah diverifikasi secara otomatis.',
                    ],
                    [
                        'id' => 'c2',
                        'title' => 'Paket Dikemas & Diserahkan ke Kurir',
                        'location' => 'Fulfillment Center PASARIA',
                        'timestamp' => now()->subDays(1)->format('d M Y, 14:30'),
                        'status' => 'completed',
                        'description' => 'Paket telah lolos uji kualitas dan diserahkan ke kurir pengantar.',
                    ],
                    [
                        'id' => 'c3',
                        'title' => 'Paket Telah Tiba & Diterima',
                        'location' => 'Jakarta Selatan',
                        'timestamp' => now()->format('d M Y, 11:20'),
                        'status' => 'completed',
                        'description' => 'Paket diterima oleh pemilik rumah: Budi Santoso.',
                    ],
                ],
            ]
        );

        // 7. Verified Purchase Review
        Review::updateOrCreate(
            ['order_item_id' => $orderItem->id],
            [
                'user_id' => $customer->id,
                'order_id' => $sampleOrder->id,
                'product_id' => $firstProduct->id,
                'shop_id' => $officialShop->id,
                'rating' => 5,
                'review_text' => 'Barang original 100%, suaranya luar biasa mantap dan pengiriman sangat cepat dengan PASARIA Express! Sangat recommended belanja di sini.',
                'is_anonymous' => false,
                'is_verified_purchase' => true,
                'status' => 'approved',
                'seller_reply' => 'Terima kasih banyak Kak Budi telah berbelanja di PASARIA Official Store! Semoga awet dan bermanfaat ya Kak.',
                'replied_at' => now()->subHours(5),
            ]
        );

        // 8. Q&A
        $q = ProductQuestion::updateOrCreate(
            ['product_id' => $firstProduct->id, 'user_id' => $customer->id],
            [
                'question' => 'Apakah produk ini mendapatkan kartu garansi resmi TAM Indonesia?',
                'is_public' => true,
                'status' => 'approved',
            ]
        );

        ProductAnswer::updateOrCreate(
            ['question_id' => $q->id],
            [
                'user_id' => $admin->id,
                'shop_id' => $officialShop->id,
                'answer' => 'Halo Kak! Betul sekali, semua unit AirPods Max di toko resmi PASARIA dilengkapi garansi resmi TAM Indonesia selama 1 tahun penuh.',
                'status' => 'approved',
            ]
        );

        // 9. Initial Notification
        Notification::updateOrCreate(
            ['user_id' => $customer->id, 'title' => 'Selamat Datang di PASARIA!'],
            [
                'message' => 'Gunakan kode voucher PASARIAHEMAT untuk mendapatkan diskon 10% pada transaksi pertama Anda!',
                'type' => 'promo',
                'action_url' => '/',
                'is_read' => false,
            ]
        );

        // 10. Initial Wallets
        Wallet::updateOrCreate(['shop_id' => $officialShop->id], ['user_id' => $admin->id, 'balance' => 125000000.00]);
        Wallet::updateOrCreate(['shop_id' => $sellerShop->id], ['user_id' => $sellerUser->id, 'balance' => 38000000.00]);
    }
}
