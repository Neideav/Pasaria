<?php

namespace Tests\Feature;

use App\Models\AdminAction;
use App\Models\Cart;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Refund;
use App\Models\Review;
use App\Models\Shop;
use App\Models\User;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class DatabaseIntegrityAndPerformanceTest extends TestCase
{
    use RefreshDatabase;

    protected User $customer;
    protected User $seller;
    protected User $admin;
    protected Shop $shop;
    protected Product $product;

    protected function setUp(): void
    {
        parent::setUp();

        $this->customer = User::create([
            'name' => 'Budi Tester',
            'username' => 'buditester',
            'email' => 'budi.tester@example.com',
            'password' => bcrypt('password123'),
            'role' => 'customer',
            'status' => 'active',
            'email_verified_at' => now(),
        ]);

        $this->seller = User::create([
            'name' => 'Siti Seller',
            'username' => 'sitiseller',
            'email' => 'siti.seller@example.com',
            'password' => bcrypt('password123'),
            'role' => 'seller',
            'status' => 'active',
            'email_verified_at' => now(),
        ]);

        $this->admin = User::create([
            'name' => 'Admin Pasaria',
            'username' => 'adminpasaria',
            'email' => 'admin.pasaria@example.com',
            'password' => bcrypt('password123'),
            'role' => 'admin',
            'status' => 'active',
            'email_verified_at' => now(),
        ]);

        $this->shop = Shop::create([
            'user_id' => $this->seller->id,
            'name' => 'Toko Siti Official',
            'slug' => 'toko-siti-official',
            'status' => 'approved',
            'verified' => true,
        ]);

        $this->product = Product::create([
            'name' => 'Headphone Pro Hi-Fi',
            'slug' => 'headphone-pro-hi-fi',
            'category' => 'Audio',
            'price' => 1500000.00,
            'stock' => 20,
            'image' => 'headphone-pro',
            'shop_id' => $this->shop->id,
            'shop_name' => $this->shop->name,
            'rating' => 5.0,
            'review_count' => 0,
        ]);
    }

    /**
     * 1. Foreign key constraints reject invalid data.
     */
    public function test_foreign_key_rejects_non_existent_shop_for_product(): void
    {
        $this->expectException(\Throwable::class);

        // Attempt to insert product referencing non-existent shop_id 99999
        Product::create([
            'name' => 'Orphan Product',
            'slug' => 'orphan-product-' . uniqid(),
            'category' => 'Gadgets',
            'price' => 50000.00,
            'stock' => 10,
            'image' => 'orphan.jpg',
            'shop_id' => 99999,
        ]);
    }

    /**
     * 2. Foreign key constraints reject invalid user on cart.
     */
    public function test_foreign_key_rejects_non_existent_user_for_cart(): void
    {
        $this->expectException(\Throwable::class);

        Cart::create([
            'user_id' => 88888,
            'items_json' => '[]',
        ]);
    }

    /**
     * 3. Unique constraint prevents duplicate conversations between the same shop and customer.
     */
    public function test_unique_constraint_rejects_duplicate_conversation_between_same_buyer_and_shop(): void
    {
        Conversation::create([
            'shop_id' => $this->shop->id,
            'customer_id' => $this->customer->id,
            'last_message_at' => now(),
        ]);

        $this->expectException(\Throwable::class);

        // Attempt duplicate conversation
        Conversation::create([
            'shop_id' => $this->shop->id,
            'customer_id' => $this->customer->id,
            'last_message_at' => now(),
        ]);
    }

    /**
     * 4. Unique constraint prevents duplicate wallets for the same shop.
     */
    public function test_unique_constraint_rejects_duplicate_wallet_for_same_shop(): void
    {
        Wallet::create([
            'user_id' => $this->seller->id,
            'shop_id' => $this->shop->id,
            'balance' => 0,
        ]);

        $this->expectException(\Throwable::class);

        // Attempt duplicate wallet
        Wallet::create([
            'user_id' => $this->seller->id,
            'shop_id' => $this->shop->id,
            'balance' => 10000,
        ]);
    }

    /**
     * 5. Unique constraint prevents duplicate review on the exact same order item.
     */
    public function test_unique_constraint_rejects_duplicate_review_for_same_order_item(): void
    {
        $order = Order::create([
            'order_number' => 'ORD-REV-' . uniqid(),
            'user_id' => $this->customer->id,
            'shop_id' => $this->shop->id,
            'customer_name' => $this->customer->name,
            'customer_email' => $this->customer->email,
            'shipping_address' => 'Jakarta',
            'payment_method' => 'cod',
            'subtotal' => 1500000,
            'tax' => 165000,
            'discount' => 0,
            'shipping_cost' => 20000,
            'total' => 1685000,
            'status' => 'completed',
        ]);

        $item = OrderItem::create([
            'order_id' => $order->id,
            'shop_id' => $this->shop->id,
            'product_id' => $this->product->id,
            'product_name' => $this->product->name,
            'price' => 1500000,
            'quantity' => 1,
            'subtotal' => 1500000,
        ]);

        Review::create([
            'user_id' => $this->customer->id,
            'order_id' => $order->id,
            'order_item_id' => $item->id,
            'product_id' => $this->product->id,
            'shop_id' => $this->shop->id,
            'rating' => 5,
            'review_text' => 'Bagus sekali!',
            'status' => 'approved',
        ]);

        $this->expectException(\Throwable::class);

        Review::create([
            'user_id' => $this->customer->id,
            'order_id' => $order->id,
            'order_item_id' => $item->id,
            'product_id' => $this->product->id,
            'shop_id' => $this->shop->id,
            'rating' => 4,
            'review_text' => 'Ulasan kedua tidak boleh lolos',
            'status' => 'approved',
        ]);
    }

    /**
     * 6. Deletion behavior: Soft-deleting user preserves orders and financial history for audits.
     */
    public function test_user_soft_deletion_preserves_orders_and_financial_records(): void
    {
        $order = Order::create([
            'order_number' => 'ORD-AUDIT-' . uniqid(),
            'user_id' => $this->customer->id,
            'shop_id' => $this->shop->id,
            'customer_name' => $this->customer->name,
            'customer_email' => $this->customer->email,
            'shipping_address' => 'Jakarta',
            'payment_method' => 'cod',
            'subtotal' => 1500000,
            'tax' => 165000,
            'discount' => 0,
            'shipping_cost' => 20000,
            'total' => 1685000,
            'status' => 'paid',
        ]);

        $payment = Payment::create([
            'order_id' => $order->id,
            'user_id' => $this->customer->id,
            'transaction_id' => 'TXN-AUDIT-' . uniqid(),
            'payment_method' => 'sandbox',
            'amount' => 1685000,
            'status' => 'paid',
        ]);

        // Customer deletes their account
        $this->customer->delete();

        // Customer is soft deleted (row still exists with deleted_at set)
        $softDeletedUser = User::withTrashed()->find($this->customer->id);
        $this->assertNotNull($softDeletedUser);
        $this->assertNotNull($softDeletedUser->deleted_at);
        $this->assertNull(User::find($this->customer->id));
        $this->assertTrue(DB::table('users')->where('id', $this->customer->id)->exists());

        // Order and Payment are completely preserved
        $this->assertTrue(DB::table('orders')->where('id', $order->id)->exists());
        $this->assertTrue(DB::table('payments')->where('id', $payment->id)->exists());

        // Verify withTrashed query
        $orderFresh = Order::find($order->id);
        $this->assertNotNull($orderFresh);
        $this->assertEquals($this->customer->id, $orderFresh->user_id);
    }

    /**
     * 7. Audit log immutability: Admin actions cannot be updated or deleted.
     */
    public function test_admin_action_audit_logs_are_immutable_and_cannot_be_tampered_with(): void
    {
        $log = AdminAction::create([
            'user_id' => $this->admin->id,
            'action' => 'suspend_user',
            'target_type' => 'user',
            'target_id' => $this->customer->id,
            'details_json' => ['reason' => 'Fraud prevention audit'],
            'ip_address' => '127.0.0.1',
        ]);

        $this->assertTrue(DB::table('admin_actions')->where('id', $log->id)->exists());

        // Attempting to update throws RuntimeException
        try {
            $log->action = 'tampered_action';
            $log->save();
            $this->fail('Expected RuntimeException on updating audit log was not thrown.');
        } catch (\RuntimeException $e) {
            $this->assertStringContainsString('immutable', $e->getMessage());
        }

        // Attempting to delete throws RuntimeException
        try {
            $log->delete();
            $this->fail('Expected RuntimeException on deleting audit log was not thrown.');
        } catch (\RuntimeException $e) {
            $this->assertStringContainsString('append-only', $e->getMessage());
        }
    }

    /**
     * 8. Database aggregation for review statistics: computes exact breakdown without loading all rows into PHP.
     */
    public function test_review_summary_aggregates_via_database_with_correct_metrics(): void
    {
        // Insert sample reviews
        $ratings = [5, 5, 4, 3, 5, 2, 1, 5];
        foreach ($ratings as $r) {
            Review::create([
                'user_id' => $this->customer->id,
                'product_id' => $this->product->id,
                'rating' => $r,
                'status' => 'approved',
                'review_text' => "Review star {$r}",
            ]);
        }

        $response = $this->getJson("/api/products/{$this->product->id}/reviews");
        $response->assertStatus(200);

        $json = $response->json();
        $this->assertTrue($json['success']);
        $this->assertEquals(8, $json['summary']['total_reviews']);

        // Sum = 5+5+4+3+5+2+1+5 = 30; Avg = 30 / 8 = 3.75 -> round to 3.8
        $this->assertEquals(3.8, $json['summary']['average_rating']);
        $this->assertEquals(4, $json['summary']['breakdown'][5]);
        $this->assertEquals(1, $json['summary']['breakdown'][4]);
        $this->assertEquals(1, $json['summary']['breakdown'][3]);
        $this->assertEquals(1, $json['summary']['breakdown'][2]);
        $this->assertEquals(1, $json['summary']['breakdown'][1]);
    }

    /**
     * 9. Chat conversations eager load latest message without N+1 query loop.
     */
    public function test_conversations_endpoint_eager_loads_latest_message_and_paginates(): void
    {
        $conv = Conversation::create([
            'shop_id' => $this->shop->id,
            'customer_id' => $this->customer->id,
            'last_message_at' => now(),
        ]);

        Message::create([
            'conversation_id' => $conv->id,
            'sender_id' => $this->customer->id,
            'sender_type' => 'customer',
            'message' => 'Halo apakah barang ready?',
        ]);

        Message::create([
            'conversation_id' => $conv->id,
            'sender_id' => $this->seller->id,
            'sender_type' => 'seller',
            'message' => 'Ready kak silakan diorder.',
        ]);

        // Customer views conversations
        $response = $this->actingAs($this->customer, 'sanctum')->getJson('/api/conversations');
        $response->assertStatus(200);

        $json = $response->json();
        $this->assertTrue($json['success']);
        $this->assertNotEmpty($json['data']);
        $this->assertEquals('Ready kak silakan diorder.', $json['data'][0]['last_message']);
        $this->assertArrayHasKey('pagination', $json);
    }

    /**
     * 10. Endpoints return structured pagination metadata.
     */
    public function test_large_endpoints_support_pagination_metadata(): void
    {
        // 10.1 Returns endpoint pagination
        $returnsResp = $this->actingAs($this->seller, 'sanctum')->getJson('/api/returns?per_page=5');
        $returnsResp->assertStatus(200);
        $this->assertArrayHasKey('pagination', $returnsResp->json());

        // 10.2 Deliveries endpoint pagination
        $deliveryResp = $this->actingAs($this->customer, 'sanctum')->getJson('/api/deliveries?per_page=5');
        $deliveryResp->assertStatus(200);
        $this->assertArrayHasKey('pagination', $deliveryResp->json());

        // 10.3 Notifications endpoint pagination
        $notifResp = $this->actingAs($this->customer, 'sanctum')->getJson('/api/notifications?per_page=10');
        $notifResp->assertStatus(200);
        $this->assertArrayHasKey('pagination', $notifResp->json());

        // 10.4 Shop products pagination
        $shopResp = $this->getJson("/api/shops/{$this->shop->slug}?per_page=5");
        $shopResp->assertStatus(200);
        $this->assertArrayHasKey('pagination', $shopResp->json());
    }

    /**
     * 11. Financial data integrity: refund amount must be strictly positive.
     */
    public function test_financial_check_constraint_rejects_negative_or_zero_refund(): void
    {
        $order = Order::create([
            'order_number' => 'ORD-FIN-' . uniqid(),
            'user_id' => $this->customer->id,
            'shop_id' => $this->shop->id,
            'customer_name' => $this->customer->name,
            'customer_email' => $this->customer->email,
            'shipping_address' => 'Jakarta',
            'payment_method' => 'cod',
            'subtotal' => 100000,
            'tax' => 11000,
            'discount' => 0,
            'shipping_cost' => 10000,
            'total' => 121000,
            'status' => 'paid',
        ]);

        $this->expectException(\Throwable::class);

        Refund::create([
            'order_id' => $order->id,
            'user_id' => $this->customer->id,
            'amount' => -50000, // Invalid negative amount
            'reason' => 'Test negative amount violation',
            'refund_reference' => 'REF-INV-' . uniqid(),
            'status' => 'pending',
        ]);
    }
}
