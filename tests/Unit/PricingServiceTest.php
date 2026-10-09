<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Services\PricingService;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Voucher;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;

class PricingServiceTest extends TestCase
{
    use RefreshDatabase;

    protected PricingService $service;
    protected Product $product1;
    protected Product $product2;
    protected Shop $shop1;
    protected Shop $shop2;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new PricingService();

        $seller = User::create([
            'name' => 'Seller One',
            'username' => 'sellerone',
            'email' => 'seller1@pasaria.id',
            'password' => Hash::make('secret'),
            'role' => 'seller',
        ]);

        $this->shop1 = Shop::create([
            'user_id' => $seller->id,
            'name' => 'Shop 1',
            'slug' => 'shop-1',
        ]);

        $this->shop2 = Shop::create([
            'user_id' => $seller->id,
            'name' => 'Shop 2',
            'slug' => 'shop-2',
        ]);

        $this->product1 = Product::create([
            'name' => 'Item A',
            'slug' => 'item-a',
            'category' => 'Audio',
            'image' => 'item-a.jpg',
            'price' => 100000.00,
            'stock' => 10,
            'shop_id' => $this->shop1->id,
        ]);

        $this->product2 = Product::create([
            'name' => 'Item B',
            'slug' => 'item-b',
            'category' => 'Audio',
            'image' => 'item-b.jpg',
            'price' => 200000.00,
            'stock' => 5,
            'shop_id' => $this->shop2->id,
        ]);
    }

    public function test_pricing_service_initialization()
    {
        $this->assertInstanceOf(PricingService::class, $this->service);
    }

    public function test_empty_items_throws_invalid_argument_exception()
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->service->calculate([]);
    }

    public function test_nonexistent_product_throws_invalid_argument_exception()
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->service->calculate([['product_id' => 9999, 'quantity' => 1]]);
    }

    public function test_invalid_variant_throws_invalid_argument_exception()
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->service->calculate([
            ['product_id' => $this->product1->id, 'variant_id' => 8888, 'quantity' => 1]
        ]);
    }

    public function test_server_calculates_accurate_subtotal_tax_and_multivendor_shipping()
    {
        // 2 items from 2 different shops:
        // Item A (qty 2): 200,000
        // Item B (qty 1): 200,000
        // Total Subtotal: 400,000
        // Shipping: 2 shops * 15,000 = 30,000
        // Tax (11% on 400,000): 44,000
        // Total: 474,000
        $result = $this->service->calculate([
            ['product_id' => $this->product1->id, 'quantity' => 2],
            ['product_id' => $this->product2->id, 'quantity' => 1],
        ]);

        $this->assertEquals(400000.00, $result['subtotal']);
        $this->assertEquals(30000.00, $result['shipping_cost']);
        $this->assertEquals(44000.00, $result['tax']);
        $this->assertEquals(474000.00, $result['total']);
        $this->assertEquals(2, $result['distinct_shops_count']);
    }

    public function test_voucher_discount_applies_correctly()
    {
        Voucher::create([
            'code' => 'HEMAT10',
            'name' => 'Diskon 10%',
            'type' => 'percentage',
            'discount_value' => 10.0,
            'min_purchase' => 50000.0,
            'max_discount' => 15000.0,
            'is_active' => true,
        ]);

        // Subtotal = 200,000. 10% = 20,000, capped at max_discount 15,000.
        // Taxable = 200,000 - 15,000 = 185,000.
        // Tax 11% = 20,350.
        // Shipping = 15,000 (1 shop).
        // Total = 185,000 + 15,000 + 20,350 = 220,350.
        $result = $this->service->calculate([
            ['product_id' => $this->product1->id, 'quantity' => 2]
        ], 'HEMAT10');

        $this->assertEquals(200000.00, $result['subtotal']);
        $this->assertEquals('HEMAT10', $result['voucher_code']);
        $this->assertEquals(15000.00, $result['voucher_discount']);
        $this->assertEquals(20350.00, $result['tax']);
        $this->assertEquals(220350.00, $result['total']);
    }
}
