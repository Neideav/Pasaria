<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Shop;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\IdempotencyKey;
use App\Models\Voucher;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class CheckoutIntegrityAndConcurrencyTest extends TestCase
{
    use RefreshDatabase;

    protected User $customer;
    protected User $seller;
    protected Shop $shop;
    protected Product $product;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seller = User::create([
            'name'     => 'Seller Pasaria',
            'username' => 'seller_pasaria',
            'email'    => 'seller@pasaria.id',
            'password' => Hash::make('secret123'),
            'role'     => 'seller',
            'status'   => 'active',
        ]);

        $this->shop = Shop::create([
            'user_id'     => $this->seller->id,
            'name'        => 'Pasaria Official Store',
            'slug'        => 'pasaria-official',
            'city'        => 'Jakarta',
            'status'      => 'approved',
            'total_sales' => 0,
        ]);

        $this->product = Product::create([
            'name'           => 'Smartphone Flagship X',
            'slug'           => 'smartphone-flagship-x',
            'category'       => 'Elektronik',
            'image'          => 'flagship-x.jpg',
            'price'          => 5000000.00,
            'original_price' => 6000000.00,
            'stock'          => 5,
            'is_active'      => true,
            'shop_id'        => $this->shop->id,
            'shop_name'      => $this->shop->name,
        ]);

        $this->customer = User::create([
            'name'     => 'Budi Pembeli',
            'username' => 'budipembeli',
            'email'    => 'budi@pasaria.id',
            'password' => Hash::make('secret123'),
            'role'     => 'customer',
            'status'   => 'active',
        ]);
    }

    /**
     * 1. Duplicate lines of the same product in a single request must be aggregated
     *    and rejected if the sum exceeds available inventory (overselling protection).
     */
    public function test_duplicate_lines_of_same_product_accumulates_and_rejects_overselling()
    {
        // Available stock is 5.
        // Request sends two lines: line 1 = 4, line 2 = 4 (total 8).
        // A naive per-line check would approve both lines (4 <= 5), resulting in stock = -3.
        $payload = [
            'items' => [
                ['product_id' => $this->product->id, 'quantity' => 4],
                ['product_id' => $this->product->id, 'quantity' => 4],
            ],
            'shipping_address' => 'Jl. Thamrin No. 5, Jakarta',
            'payment_method'   => 'QRIS Instant',
        ];

        $response = $this->actingAs($this->customer, 'sanctum')->postJson('/api/orders', $payload);

        $response->assertStatus(400);
        $this->assertFalse($response->json('success'));
        $this->assertStringContainsString('tidak mencukupi', $response->json('message'));

        // Verify database stock is completely untouched
        $this->product->refresh();
        $this->assertEquals(5, $this->product->stock);

        // Verify no order or order items were created
        $this->assertEquals(0, Order::count());
        $this->assertEquals(0, OrderItem::count());
    }

    /**
     * 2. Duplicate lines of the same product within available stock are merged correctly.
     */
    public function test_duplicate_lines_of_same_product_within_stock_merges_and_decrements_properly()
    {
        // Available stock is 5.
        // Request sends line 1 = 2, line 2 = 2 (total 4 <= 5).
        $payload = [
            'items' => [
                ['product_id' => $this->product->id, 'quantity' => 2],
                ['product_id' => $this->product->id, 'quantity' => 2],
            ],
            'shipping_address' => 'Jl. Thamrin No. 5, Jakarta',
            'payment_method'   => 'QRIS Instant',
        ];

        $response = $this->actingAs($this->customer, 'sanctum')->postJson('/api/orders', $payload);

        $response->assertStatus(201);
        $this->assertTrue($response->json('success'));

        // Stock must be decremented by total 4 (5 - 4 = 1)
        $this->product->refresh();
        $this->assertEquals(1, $this->product->stock);

        // Order subtotal must reflect 4 units: 4 * 5,000,000 = 20,000,000
        $this->assertEquals(20000000.0, (float) $response->json('pricing.subtotal'));
    }

    /**
     * 3. Request exceeding available stock is rejected cleanly without changing stock.
     */
    public function test_checkout_fails_when_demanded_quantity_exceeds_available_stock()
    {
        $payload = [
            'items' => [
                ['product_id' => $this->product->id, 'quantity' => 6], // Available is 5
            ],
            'shipping_address' => 'Jl. Sudirman No. 1, Jakarta',
        ];

        $response = $this->actingAs($this->customer, 'sanctum')->postJson('/api/orders', $payload);

        $response->assertStatus(400);
        $this->product->refresh();
        $this->assertEquals(5, $this->product->stock);
        $this->assertEquals(0, Order::count());
    }

    /**
     * 4. Client-submitted prices and totals are discarded; server recalculates all values from DB.
     */
    public function test_client_price_and_subtotal_manipulation_is_completely_ignored()
    {
        // Client attempts to pay Rp 10 for a Rp 5,000,000 product
        $payload = [
            'items' => [
                [
                    'product_id' => $this->product->id,
                    'quantity'   => 1,
                    'price'      => 10.00,
                ],
            ],
            'price'            => 10.00,
            'subtotal'         => 10.00,
            'total'            => 10.00,
            'tax'              => 1.00,
            'shipping_cost'    => 1.00,
            'shipping_address' => 'Jakarta Barat',
            'payment_method'   => 'QRIS Instant',
        ];

        $response = $this->actingAs($this->customer, 'sanctum')->postJson('/api/orders', $payload);

        $response->assertStatus(201);

        // Real calculations:
        // Subtotal: 5,000,000
        // Shipping: 15,000 (1 shop)
        // Tax (11% on 5,000,000): 550,000
        // Total: 5,565,000
        $this->assertEquals(5000000.0, (float) $response->json('pricing.subtotal'));
        $this->assertEquals(15000.0, (float) $response->json('pricing.shipping_cost'));
        $this->assertEquals(550000.0, (float) $response->json('pricing.tax'));
        $this->assertEquals(5565000.0, (float) $response->json('pricing.total'));

        // Check order stored in database matches server pricing
        $order = Order::first();
        $this->assertNotNull($order);
        $this->assertEquals(5565000.00, (float) $order->total);
        $this->assertEquals('pending_payment', $order->status);

        // Check payment record is recorded in pending state
        $payment = Payment::where('order_id', $order->id)->first();
        $this->assertNotNull($payment);
        $this->assertEquals('pending', $payment->status);
        $this->assertNull($payment->paid_at);
    }

    /**
     * 5. Inactive products cannot be purchased and return 422.
     */
    public function test_inactive_product_is_rejected_at_checkout()
    {
        $this->product->update(['is_active' => false]);

        $payload = [
            'items' => [
                ['product_id' => $this->product->id, 'quantity' => 1],
            ],
            'shipping_address' => 'Jakarta',
        ];

        $response = $this->actingAs($this->customer, 'sanctum')->postJson('/api/orders', $payload);

        $response->assertStatus(422);
        $this->assertStringContainsString('tidak aktif', $response->json('message'));
        $this->assertEquals(0, Order::count());
    }

    /**
     * 6. Products from a suspended or inactive shop cannot be purchased.
     */
    public function test_product_from_suspended_shop_is_rejected_at_checkout()
    {
        $this->shop->update(['status' => 'suspended']);

        $payload = [
            'items' => [
                ['product_id' => $this->product->id, 'quantity' => 1],
            ],
            'shipping_address' => 'Jakarta',
        ];

        $response = $this->actingAs($this->customer, 'sanctum')->postJson('/api/orders', $payload);

        $response->assertStatus(422);
        $this->assertStringContainsString('ditangguhkan', $response->json('message'));
        $this->assertEquals(0, Order::count());
    }

    /**
     * 7. Identical checkout request with identical idempotency key returns idempotent replay (200),
     *    reuses the existing order, and does NOT decrement inventory a second time.
     */
    public function test_identical_checkout_request_with_same_idempotency_key_replays_consistently()
    {
        $idempotencyKey = 'IDEM-KEY-' . Str::random(16);

        $payload = [
            'items' => [
                ['product_id' => $this->product->id, 'quantity' => 1],
            ],
            'shipping_address' => 'Jl. Gatot Subroto No. 8, Jakarta',
            'idempotency_key'  => $idempotencyKey,
        ];

        // 1st request -> Created (201)
        $resp1 = $this->actingAs($this->customer, 'sanctum')->postJson('/api/orders', $payload);
        $resp1->assertStatus(201);
        $orderNumber = $resp1->json('order_number');

        $this->product->refresh();
        $this->assertEquals(4, $this->product->stock); // 5 - 1 = 4

        // 2nd identical request -> Replay (200)
        $resp2 = $this->actingAs($this->customer, 'sanctum')->postJson('/api/orders', $payload);
        $resp2->assertStatus(200);
        $this->assertTrue($resp2->json('idempotent'));
        $this->assertEquals($orderNumber, $resp2->json('order_number'));

        // Stock must remain 4 (NOT 3!)
        $this->product->refresh();
        $this->assertEquals(4, $this->product->stock);

        // Only 1 order exists in database
        $this->assertEquals(1, Order::count());
    }

    /**
     * 8. Reusing the same idempotency key with a DIFFERENT payload must be rejected (422).
     */
    public function test_same_idempotency_key_with_different_payload_is_rejected()
    {
        $idempotencyKey = 'IDEM-KEY-' . Str::random(16);

        $payload1 = [
            'items' => [
                ['product_id' => $this->product->id, 'quantity' => 1],
            ],
            'shipping_address' => 'Jl. Merdeka No. 1, Jakarta',
            'idempotency_key'  => $idempotencyKey,
        ];

        $resp1 = $this->actingAs($this->customer, 'sanctum')->postJson('/api/orders', $payload1);
        $resp1->assertStatus(201);

        // 2nd request with SAME key but DIFFERENT quantity (different payload)
        $payload2 = [
            'items' => [
                ['product_id' => $this->product->id, 'quantity' => 2],
            ],
            'shipping_address' => 'Jl. Merdeka No. 1, Jakarta',
            'idempotency_key'  => $idempotencyKey,
        ];

        $resp2 = $this->actingAs($this->customer, 'sanctum')->postJson('/api/orders', $payload2);
        $resp2->assertStatus(422);
        $this->assertStringContainsString('payload berbeda', $resp2->json('message'));
    }

    /**
     * 9. Simulated concurrent claim: an in_progress key blocks simultaneous requests
     *    and prevents duplicate processing.
     */
    public function test_concurrent_idempotent_claims_blocked_when_in_progress()
    {
        $idempotencyKey = 'IDEM-KEY-' . Str::random(16);

        // Simulate an ongoing concurrent request claiming the key
        IdempotencyKey::create([
            'key'          => $idempotencyKey,
            'user_id'      => $this->customer->id,
            'action'       => 'checkout',
            'request_hash' => 'dummy_hash',
            'status'       => 'in_progress',
        ]);

        $payload = [
            'items' => [
                ['product_id' => $this->product->id, 'quantity' => 1],
            ],
            'shipping_address' => 'Jakarta',
            'idempotency_key'  => $idempotencyKey,
        ];

        $response = $this->actingAs($this->customer, 'sanctum')->postJson('/api/orders', $payload);

        // Must reject concurrent collision
        $this->assertTrue(in_array($response->status(), [400, 422]));
        $this->assertEquals(0, Order::count());
    }

    /**
     * 10. Mid-transaction failure cleans up in-progress idempotency key and rolls back cleanly.
     */
    public function test_mid_transaction_failure_cleans_up_idempotency_and_rolls_back()
    {
        $idempotencyKey = 'IDEM-KEY-' . Str::random(16);

        // We simulate a failure by attempting to check out with an invalid/non-existent variant ID
        $payload = [
            'items' => [
                [
                    'product_id' => $this->product->id,
                    'variant_id' => 999999, // Does not exist, will throw in transaction
                    'quantity'   => 1,
                ],
            ],
            'shipping_address' => 'Jakarta',
            'idempotency_key'  => $idempotencyKey,
        ];

        $response = $this->actingAs($this->customer, 'sanctum')->postJson('/api/orders', $payload);
        $response->assertStatus(422);

        // Verify the in-progress claim was cleaned up so the user can retry with the same key
        $claim = IdempotencyKey::where('key', $idempotencyKey)->first();
        $this->assertNull($claim, 'In-progress idempotency claim must be deleted on failure to allow retry');

        // Verify inventory untouched and no order created
        $this->product->refresh();
        $this->assertEquals(5, $this->product->stock);
        $this->assertEquals(0, Order::count());
    }

    /**
     * 11. Order cancellation restores inventory atomically, marks pending payment failed,
     *     and preserves transaction audit records.
     */
    public function test_order_cancellation_safely_restores_inventory_and_marks_payment_failed()
    {
        // 1. Create order
        $checkoutResp = $this->actingAs($this->customer, 'sanctum')->postJson('/api/orders', [
            'items' => [
                ['product_id' => $this->product->id, 'quantity' => 2],
            ],
            'shipping_address' => 'Jakarta',
        ]);
        $checkoutResp->assertStatus(201);

        $this->product->refresh();
        $this->assertEquals(3, $this->product->stock); // 5 - 2 = 3

        $order = Order::first();
        $this->assertNotNull($order);
        $this->assertEquals('pending_payment', $order->status);

        // 2. Cancel order
        $cancelResp = $this->actingAs($this->customer, 'sanctum')->postJson("/api/orders/{$order->id}/cancel");
        $cancelResp->assertStatus(200);

        // 3. Verify stock restored
        $this->product->refresh();
        $this->assertEquals(5, $this->product->stock);

        // 4. Verify order and payment status
        $order->refresh();
        $this->assertEquals('cancelled', $order->status);

        $payment = Payment::where('order_id', $order->id)->first();
        $this->assertEquals('failed', $payment->status);

        // 5. Verify records still exist for financial audit trails
        $this->assertNotNull(Order::find($order->id));
        $this->assertNotNull(Payment::where('order_id', $order->id)->first());
    }
}
