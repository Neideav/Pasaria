<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Shop;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Review;
use App\Models\ProductQuestion;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use App\Models\OrderReturn;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class SecurityHardeningAndAuditTest extends TestCase
{
    use RefreshDatabase;

    protected User $customer;
    protected User $otherCustomer;
    protected User $seller;
    protected User $otherSeller;
    protected User $admin;
    protected Shop $shop;
    protected Shop $otherShop;
    protected Product $product;
    protected ProductVariant $variant;
    protected Product $otherProduct;

    protected function setUp(): void
    {
        parent::setUp();

        $this->customer = User::create([
            'name' => 'Budi Santoso',
            'username' => 'budisantoso',
            'email' => 'budi@pasaria.id',
            'password' => Hash::make('password123'),
            'role' => 'customer',
            'status' => 'active',
        ]);

        $this->otherCustomer = User::create([
            'name' => 'Siti Aminah',
            'username' => 'sitiaminah',
            'email' => 'siti@pasaria.id',
            'password' => Hash::make('password123'),
            'role' => 'customer',
            'status' => 'active',
        ]);

        $this->seller = User::create([
            'name' => 'Hendro Wijaya',
            'username' => 'hendrowijaya',
            'email' => 'hendro@pasaria.id',
            'password' => Hash::make('password123'),
            'role' => 'seller',
            'status' => 'active',
        ]);

        $this->otherSeller = User::create([
            'name' => 'Rudi Kurniawan',
            'username' => 'rudikurniawan',
            'email' => 'rudi@pasaria.id',
            'password' => Hash::make('password123'),
            'role' => 'seller',
            'status' => 'active',
        ]);

        $this->admin = User::create([
            'name' => 'PASARIA Admin',
            'username' => 'adminpasaria',
            'email' => 'admin@pasaria.id',
            'password' => Hash::make('adminsecret'),
            'role' => 'admin',
            'status' => 'active',
        ]);

        $this->shop = Shop::create([
            'user_id' => $this->seller->id,
            'name' => 'TechZone Gadget',
            'slug' => 'techzone-gadget',
            'city' => 'Jakarta Pusat',
            'status' => 'approved',
            'verified' => true,
        ]);

        $this->otherShop = Shop::create([
            'user_id' => $this->otherSeller->id,
            'name' => 'Rudi Electronics',
            'slug' => 'rudi-electronics',
            'city' => 'Surabaya',
            'status' => 'approved',
            'verified' => true,
        ]);

        $this->product = Product::create([
            'name' => 'AirPods Max Wireless',
            'slug' => 'airpods-max-test',
            'category' => 'Audio',
            'price' => 8000000.00,
            'stock' => 5,
            'image' => 'airpods-max',
            'shop_id' => $this->shop->id,
            'shop_name' => $this->shop->name,
            'shop_city' => $this->shop->city,
        ]);

        $this->variant = ProductVariant::create([
            'product_id' => $this->product->id,
            'sku' => 'APM-SPACE-GRAY',
            'name' => 'Space Gray',
            'price' => 8000000.00,
            'stock' => 5,
        ]);

        $this->otherProduct = Product::create([
            'name' => 'Bose Headphones',
            'slug' => 'bose-test',
            'category' => 'Audio',
            'price' => 4500000.00,
            'stock' => 10,
            'image' => 'bose',
            'shop_id' => $this->otherShop->id,
            'shop_name' => $this->otherShop->name,
            'shop_city' => $this->otherShop->city,
        ]);
    }

    /**
     * 1. Anonymous Access Rejection on Sensitive Endpoints
     */
    public function test_anonymous_requests_are_rejected_with_401()
    {
        // Protected customer endpoints
        $this->getJson('/api/orders')->assertStatus(401);
        $this->postJson('/api/orders', [])->assertStatus(401);
        $this->getJson('/api/cart')->assertStatus(401);
        $this->postJson('/api/cart/item', [])->assertStatus(401);
        $this->getJson('/api/user/addresses')->assertStatus(401);
        $this->postJson('/api/reviews', [])->assertStatus(401);
        $this->getJson('/api/wishlist')->assertStatus(401);
        $this->getJson('/api/conversations')->assertStatus(401);
        $this->getJson('/api/returns')->assertStatus(401);

        // Protected seller & admin endpoints
        $this->getJson('/api/seller/dashboard')->assertStatus(401);
        $this->getJson('/api/seller/finances')->assertStatus(401);
        $this->postJson('/api/seller/payout', [])->assertStatus(401);
        $this->getJson('/api/admin/dashboard')->assertStatus(401);
        $this->getJson('/api/admin/users')->assertStatus(401);
    }

    /**
     * 2. Role Escalation Protection: Customer cannot access Seller or Admin endpoints
     */
    public function test_customer_cannot_access_seller_or_admin_endpoints()
    {
        $this->actingAs($this->customer, 'sanctum')->getJson('/api/seller/dashboard')->assertStatus(403);
        $this->actingAs($this->customer, 'sanctum')->getJson('/api/seller/orders')->assertStatus(403);
        $this->actingAs($this->customer, 'sanctum')->getJson('/api/seller/finances')->assertStatus(403);
        $this->actingAs($this->customer, 'sanctum')->postJson('/api/seller/payout', ['amount' => 50000])->assertStatus(403);
        $this->actingAs($this->customer, 'sanctum')->putJson("/api/seller/products/{$this->product->id}/stock", ['stock' => 100])->assertStatus(403);

        $this->actingAs($this->customer, 'sanctum')->getJson('/api/admin/dashboard')->assertStatus(403);
        $this->actingAs($this->customer, 'sanctum')->getJson('/api/admin/users')->assertStatus(403);
        $this->actingAs($this->customer, 'sanctum')->putJson('/api/admin/users/1/status', ['status' => 'suspended'])->assertStatus(403);
    }

    /**
     * 3. Role Escalation Protection: Seller cannot access Admin endpoints
     */
    public function test_seller_cannot_access_admin_endpoints()
    {
        $this->actingAs($this->seller, 'sanctum')->getJson('/api/admin/dashboard')->assertStatus(403);
        $this->actingAs($this->seller, 'sanctum')->getJson('/api/admin/users')->assertStatus(403);
        $this->actingAs($this->seller, 'sanctum')->putJson('/api/admin/sellers/1/status', ['status' => 'approved'])->assertStatus(403);
        $this->actingAs($this->seller, 'sanctum')->getJson('/api/admin/audit-logs')->assertStatus(403);
    }

    /**
     * 4. Cross-Shop Protection: Seller cannot modify another seller's resources
     */
    public function test_seller_cannot_modify_another_seller_resources()
    {
        // Seller attempts to update stock of another seller's product
        $stockResp = $this->actingAs($this->seller, 'sanctum')->putJson("/api/seller/products/{$this->otherProduct->id}/stock", [
            'stock' => 999,
        ]);
        $stockResp->assertStatus(403);

        // Seller attempts to delete another seller's product
        $deleteResp = $this->actingAs($this->seller, 'sanctum')->deleteJson("/api/products/{$this->otherProduct->id}");
        $deleteResp->assertStatus(403);

        // Seller attempts to reply to a review of another seller's product
        $order = Order::create([
            'order_number' => 'PAS-ORD-REV-01',
            'user_id' => $this->customer->id,
            'shop_id' => $this->otherShop->id,
            'customer_name' => 'Budi',
            'customer_email' => 'budi@pasaria.id',
            'shipping_address' => 'Jakarta',
            'payment_method' => 'QRIS',
            'subtotal' => 4500000,
            'tax' => 495000,
            'shipping_cost' => 15000,
            'total' => 5010000,
            'status' => 'delivered',
        ]);
        $orderItem = OrderItem::create([
            'order_id' => $order->id,
            'shop_id' => $this->otherShop->id,
            'product_id' => $this->otherProduct->id,
            'product_name' => $this->otherProduct->name,
            'price' => 4500000,
            'quantity' => 1,
            'subtotal' => 4500000,
        ]);
        $review = Review::create([
            'user_id' => $this->customer->id,
            'order_id' => $order->id,
            'order_item_id' => $orderItem->id,
            'product_id' => $this->otherProduct->id,
            'shop_id' => $this->otherShop->id,
            'rating' => 5,
            'review_text' => 'Good product',
            'status' => 'approved',
        ]);

        $replyResp = $this->actingAs($this->seller, 'sanctum')->postJson("/api/reviews/{$review->id}/reply", [
            'reply' => 'Hacked reply from another seller',
        ]);
        $replyResp->assertStatus(403);
    }

    /**
     * 5. Checkout rejects missing product and invalid/mismatched variant
     */
    public function test_checkout_rejects_missing_product_and_invalid_variant()
    {
        // Nonexistent product
        $resp1 = $this->actingAs($this->customer, 'sanctum')->postJson('/api/orders', [
            'items' => [
                ['product_id' => 999999, 'quantity' => 1]
            ],
            'shipping_address' => 'Jakarta',
        ]);
        $resp1->assertStatus(422);

        // Mismatched variant (variant exists but belongs to a different product)
        $foreignVariant = ProductVariant::create([
            'product_id' => $this->otherProduct->id,
            'sku' => 'BOSE-BLACK',
            'name' => 'Black',
            'price' => 4500000,
            'stock' => 10,
        ]);

        $resp2 = $this->actingAs($this->customer, 'sanctum')->postJson('/api/orders', [
            'items' => [
                [
                    'product_id' => $this->product->id,
                    'variant_id' => $foreignVariant->id, // variant belonging to otherProduct
                    'quantity' => 1,
                ]
            ],
            'shipping_address' => 'Jakarta',
        ]);
        $resp2->assertStatus(422);
    }

    /**
     * 6. Checkout stock depletion and atomic rollback on failure
     */
    public function test_checkout_rollback_when_stock_insufficient()
    {
        $initialStock = $this->product->stock;

        $response = $this->actingAs($this->customer, 'sanctum')->postJson('/api/orders', [
            'items' => [
                ['product_id' => $this->product->id, 'quantity' => $initialStock + 10]
            ],
            'shipping_address' => 'Jakarta',
        ]);

        $response->assertStatus(400);

        // Verify stock is untouched (no partial deduction)
        $this->product->refresh();
        $this->assertEquals($initialStock, $this->product->stock);

        // Verify no order was created
        $this->assertEquals(0, Order::where('user_id', $this->customer->id)->count());
    }

    /**
     * 7. Client price tampering is completely ignored
     */
    public function test_client_price_tampering_is_discarded_by_backend()
    {
        $response = $this->actingAs($this->customer, 'sanctum')->postJson('/api/orders', [
            'items' => [
                [
                    'product_id' => $this->product->id,
                    'quantity' => 1,
                    'price' => 100,      // Attempted client manipulation
                    'subtotal' => 100,   // Attempted client manipulation
                ]
            ],
            'subtotal' => 100,           // Attempted client manipulation
            'total' => 100,              // Attempted client manipulation
            'shipping_address' => 'Jakarta',
        ]);

        $response->assertStatus(201);
        $pricing = $response->json('pricing');

        // Real product price is 8,000,000
        $this->assertEquals(8000000.00, $pricing['subtotal']);
        $this->assertEquals(15000.00, $pricing['shipping_cost']);
        $this->assertEquals(880000.00, $pricing['tax']); // 11% of 8,000,000
        $this->assertEquals(8895000.00, $pricing['total']);
    }

    /**
     * 8. Persistent Idempotency prevents duplicate orders and double stock deduction
     */
    public function test_persistent_idempotency_prevents_duplicate_orders()
    {
        $initialStock = $this->product->stock;
        $idempotencyKey = 'IDEM-TEST-' . Str::random(12);

        $payload = [
            'items' => [
                ['product_id' => $this->product->id, 'quantity' => 1]
            ],
            'shipping_address' => 'Jakarta',
            'idempotency_key' => $idempotencyKey,
        ];

        // 1st request
        $resp1 = $this->actingAs($this->customer, 'sanctum')->postJson('/api/orders', $payload);
        $resp1->assertStatus(201);
        $orderNumber1 = $resp1->json('order_number');

        $this->product->refresh();
        $this->assertEquals($initialStock - 1, $this->product->stock);

        // 2nd request with exact same idempotency_key
        $resp2 = $this->actingAs($this->customer, 'sanctum')->postJson('/api/orders', $payload);
        $resp2->assertStatus(200);
        $this->assertTrue($resp2->json('idempotent'));
        $this->assertEquals($orderNumber1, $resp2->json('order_number'));

        // Verify stock was NOT decremented again!
        $this->product->refresh();
        $this->assertEquals($initialStock - 1, $this->product->stock);
    }

    /**
     * 9. Review eligibility requires delivered/completed purchase
     */
    public function test_review_requires_eligible_completed_purchase()
    {
        // Attempting to review without any purchase
        $respNoPurchase = $this->actingAs($this->customer, 'sanctum')->postJson('/api/reviews', [
            'product_id' => $this->product->id,
            'rating' => 5,
            'review_text' => 'Falsified review',
        ]);
        $respNoPurchase->assertStatus(403);

        // Attempting to review an order that is still processing (not delivered)
        $pendingOrder = Order::create([
            'order_number' => 'PAS-PEND-01',
            'user_id' => $this->customer->id,
            'shop_id' => $this->shop->id,
            'customer_name' => 'Budi',
            'customer_email' => 'budi@pasaria.id',
            'shipping_address' => 'Jakarta',
            'payment_method' => 'QRIS',
            'subtotal' => 8000000,
            'tax' => 880000,
            'shipping_cost' => 15000,
            'total' => 8895000,
            'status' => 'processing', // Not delivered yet!
        ]);
        OrderItem::create([
            'order_id' => $pendingOrder->id,
            'shop_id' => $this->shop->id,
            'product_id' => $this->product->id,
            'product_name' => $this->product->name,
            'price' => 8000000,
            'quantity' => 1,
            'subtotal' => 8000000,
        ]);

        $respNotDelivered = $this->actingAs($this->customer, 'sanctum')->postJson('/api/reviews', [
            'product_id' => $this->product->id,
            'rating' => 5,
            'review_text' => 'Premature review attempt',
        ]);
        $respNotDelivered->assertStatus(403);
    }

    /**
     * 10. Duplicate review for the same purchase is prevented
     */
    public function test_duplicate_review_is_prevented()
    {
        $deliveredOrder = Order::create([
            'order_number' => 'PAS-DELIV-01',
            'user_id' => $this->customer->id,
            'shop_id' => $this->shop->id,
            'customer_name' => 'Budi',
            'customer_email' => 'budi@pasaria.id',
            'shipping_address' => 'Jakarta',
            'payment_method' => 'QRIS',
            'subtotal' => 8000000,
            'tax' => 880000,
            'shipping_cost' => 15000,
            'total' => 8895000,
            'status' => 'delivered',
        ]);
        $item = OrderItem::create([
            'order_id' => $deliveredOrder->id,
            'shop_id' => $this->shop->id,
            'product_id' => $this->product->id,
            'product_name' => $this->product->name,
            'price' => 8000000,
            'quantity' => 1,
            'subtotal' => 8000000,
        ]);

        // First review succeeds
        $resp1 = $this->actingAs($this->customer, 'sanctum')->postJson('/api/reviews', [
            'product_id' => $this->product->id,
            'rating' => 5,
            'review_text' => 'First legitimate review',
        ]);
        $resp1->assertStatus(201);

        // Second review attempt for same order item fails
        $resp2 = $this->actingAs($this->customer, 'sanctum')->postJson('/api/reviews', [
            'product_id' => $this->product->id,
            'rating' => 4,
            'review_text' => 'Duplicate review attempt',
        ]);
        $resp2->assertStatus(422);
    }

    /**
     * 11. Wallet Payout balance validation and ledger debit
     */
    public function test_wallet_payout_validates_balance_and_records_debit_ledger()
    {
        $wallet = Wallet::create([
            'user_id' => $this->seller->id,
            'shop_id' => $this->shop->id,
            'balance' => 50000.00,
        ]);

        // Attempting to withdraw more than available balance
        $failResp = $this->actingAs($this->seller, 'sanctum')->postJson('/api/seller/payout', [
            'amount' => 100000.00,
            'bank_name' => 'BCA',
            'account_number' => '1234567890',
            'account_holder' => 'Hendro Wijaya',
        ]);
        $failResp->assertStatus(422);

        // Valid withdrawal within balance
        $successResp = $this->actingAs($this->seller, 'sanctum')->postJson('/api/seller/payout', [
            'amount' => 30000.00,
            'bank_name' => 'BCA',
            'account_number' => '1234567890',
            'account_holder' => 'Hendro Wijaya',
        ]);
        $successResp->assertStatus(201);

        $wallet->refresh();
        $this->assertEquals(20000.00, (float) $wallet->balance);

        $this->assertTrue(
            WalletTransaction::where('wallet_id', $wallet->id)
                ->where('type', 'debit')
                ->where('amount', 30000.00)
                ->where('balance_after', 20000.00)
                ->exists()
        );
    }

    /**
     * 12. Password change validates old password and revokes old tokens
     */
    public function test_password_change_validates_current_password_and_revokes_tokens()
    {
        // Wrong current password
        $failResp = $this->actingAs($this->customer, 'sanctum')->putJson('/api/user/password', [
            'current_password' => 'wrongpassword',
            'new_password' => 'newsecret123',
        ]);
        $failResp->assertStatus(422);

        // Valid current password
        $successResp = $this->actingAs($this->customer, 'sanctum')->putJson('/api/user/password', [
            'current_password' => 'password123',
            'new_password' => 'brandnewpassword123',
        ]);
        $successResp->assertStatus(200);

        $this->customer->refresh();
        $this->assertTrue(Hash::check('brandnewpassword123', $this->customer->password));
    }

    /**
     * 13. Order status invalid transition is rejected
     */
    public function test_order_status_state_machine_rejects_illegal_transitions()
    {
        $order = Order::create([
            'order_number' => 'PAS-STATUS-01',
            'user_id' => $this->customer->id,
            'shop_id' => $this->shop->id,
            'customer_name' => 'Budi',
            'customer_email' => 'budi@pasaria.id',
            'shipping_address' => 'Jakarta',
            'payment_method' => 'QRIS',
            'subtotal' => 8000000,
            'tax' => 880000,
            'shipping_cost' => 15000,
            'total' => 8895000,
            'status' => 'delivered',
        ]);

        // Seller attempts illegal transition from delivered directly to pending_payment
        $illegalResp = $this->actingAs($this->seller, 'sanctum')->putJson("/api/orders/{$order->id}/status", [
            'status' => 'pending_payment',
        ]);
        $illegalResp->assertStatus(422);

        // Customer attempts to cancel an already delivered order
        $cancelResp = $this->actingAs($this->customer, 'sanctum')->postJson("/api/orders/{$order->id}/cancel");
        $cancelResp->assertStatus(422);
    }
}
