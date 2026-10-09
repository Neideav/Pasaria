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
use App\Models\ProductAnswer;
use App\Models\Voucher;
use App\Models\VoucherRedemption;
use App\Models\Wishlist;
use App\Models\Conversation;
use App\Models\Message;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class MarketplaceBusinessRulesAndCrudTest extends TestCase
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

    protected function setUp(): void
    {
        parent::setUp();

        // Customer 1
        $this->customer = User::create([
            'name' => 'Dewi Lestari',
            'username' => 'dewilestari',
            'email' => 'dewi@pasaria.id',
            'password' => Hash::make('password123'),
            'role' => 'customer',
            'status' => 'active',
            'email_verified_at' => now(),
        ]);

        // Customer 2
        $this->otherCustomer = User::create([
            'name' => 'Bambang Sudirman',
            'username' => 'bambangsudirman',
            'email' => 'bambang@pasaria.id',
            'password' => Hash::make('password123'),
            'role' => 'customer',
            'status' => 'active',
            'email_verified_at' => now(),
        ]);

        // Seller 1
        $this->seller = User::create([
            'name' => 'Hendra Tech',
            'username' => 'hendratech',
            'email' => 'hendra@pasaria.id',
            'password' => Hash::make('password123'),
            'role' => 'seller',
            'status' => 'active',
            'email_verified_at' => now(),
        ]);

        $this->shop = Shop::create([
            'user_id' => $this->seller->id,
            'name' => 'Hendra Tech Store',
            'slug' => 'hendra-tech-store',
            'description' => 'Toko Resmi Gadget & Audio',
            'status' => 'approved',
            'verified' => true,
            'rating' => 5.0,
            'city' => 'Jakarta Selatan',
        ]);

        // Seller 2
        $this->otherSeller = User::create([
            'name' => 'Rina Fashion',
            'username' => 'rinafashion',
            'email' => 'rina@pasaria.id',
            'password' => Hash::make('password123'),
            'role' => 'seller',
            'status' => 'active',
            'email_verified_at' => now(),
        ]);

        $this->otherShop = Shop::create([
            'user_id' => $this->otherSeller->id,
            'name' => 'Rina Fashion Store',
            'slug' => 'rina-fashion-store',
            'description' => 'Pakaian & Sepatu Trendy',
            'status' => 'approved',
            'verified' => true,
            'rating' => 5.0,
            'city' => 'Bandung',
        ]);

        // Admin
        $this->admin = User::create([
            'name' => 'Administrator PASARIA',
            'username' => 'adminpasaria',
            'email' => 'admin@pasaria.id',
            'password' => Hash::make('password123'),
            'role' => 'admin',
            'status' => 'active',
            'email_verified_at' => now(),
        ]);

        // Seed product for shop 1
        $this->product = Product::create([
            'name' => 'Sony WH-1000XM5 Wireless Headphones',
            'slug' => 'sony-wh-1000xm5',
            'category' => 'Headphones',
            'price' => 4500000,
            'stock' => 20,
            'is_active' => true,
            'shop_id' => $this->shop->id,
            'shop_name' => $this->shop->name,
            'image' => 'airpods-max',
            'rating' => 5.0,
            'review_count' => 0,
        ]);

        $this->variant = ProductVariant::create([
            'product_id' => $this->product->id,
            'sku' => 'SNY-XM5-BLK',
            'name' => 'Black Matte Edition',
            'price' => 4500000,
            'stock' => 20,
            'is_active' => true,
        ]);
    }

    // =========================================================================
    // SECTION B: CRUD PRODUK SELLER & OWNERSHIP
    // =========================================================================

    public function test_seller_can_create_product_for_own_shop(): void
    {
        $response = $this->actingAs($this->seller, 'sanctum')->postJson('/api/products', [
            'name' => 'Anker Soundcore Space Q45',
            'category' => 'Headphones',
            'price' => 1800000,
            'stock' => 15,
            'short_desc' => 'ANC Wireless Over-Ear Headphone',
            'description' => 'Headphone bluetooth dengan peredam bising aktif hingga 98%.',
            'image' => 'airpods-max',
        ]);

        $this->assertEquals(201, $response->status());
        $created = Product::where('name', 'Anker Soundcore Space Q45')->first();
        $this->assertNotNull($created);
        $this->assertEquals($this->shop->id, $created->shop_id);
    }

    public function test_seller_cannot_manipulate_rating_or_review_count_on_create(): void
    {
        $response = $this->actingAs($this->seller, 'sanctum')->postJson('/api/products', [
            'name' => 'Fake Rating Product',
            'category' => 'Headphones',
            'price' => 500000,
            'stock' => 10,
            'rating' => 5.0,
            'review_count' => 999,
        ]);

        $this->assertEquals(422, $response->status());
        $p = Product::where('name', 'Fake Rating Product')->first();
        $this->assertNull($p);
    }

    public function test_seller_can_update_own_product(): void
    {
        $response = $this->actingAs($this->seller, 'sanctum')->putJson("/api/products/{$this->product->id}", [
            'name' => 'Sony WH-1000XM5 Updated Black',
            'price' => 4700000,
            'stock' => 35,
            'description' => 'Deskripsi yang telah diperbarui oleh penjual resmi.',
        ]);

        $this->assertEquals(200, $response->status());
        $fresh = $this->product->fresh();
        $this->assertEquals('Sony WH-1000XM5 Updated Black', $fresh->name);
        $this->assertEquals(4700000.0, (float) $fresh->price);
        $this->assertEquals(35, $fresh->stock);
    }

    public function test_seller_cannot_update_product_belonging_to_another_shop(): void
    {
        // otherSeller attempts to edit seller's product
        $response = $this->actingAs($this->otherSeller, 'sanctum')->putJson("/api/products/{$this->product->id}", [
            'name' => 'Hacked Product Name',
            'price' => 1000,
        ]);

        $this->assertEquals(403, $response->status());
        $fresh = $this->product->fresh();
        $this->assertNotEquals('Hacked Product Name', $fresh->name);
    }

    public function test_seller_can_toggle_product_status(): void
    {
        $this->assertTrue((bool) $this->product->is_active);

        $response = $this->actingAs($this->seller, 'sanctum')->patchJson("/api/products/{$this->product->id}/status");
        $this->assertEquals(200, $response->status());

        $fresh = $this->product->fresh();
        $this->assertFalse((bool) $fresh->is_active);

        // Toggle back to active
        $response2 = $this->actingAs($this->seller, 'sanctum')->patchJson("/api/products/{$this->product->id}/status", [
            'is_active' => true,
        ]);
        $this->assertEquals(200, $response2->status());
        $this->assertTrue((bool) $this->product->fresh()->is_active);
    }

    public function test_product_deletion_uses_soft_deletes_and_preserves_historical_orders(): void
    {
        // Create an existing completed order referencing this product
        $order = Order::create([
            'order_number' => 'PAS-HIST-001',
            'user_id' => $this->customer->id,
            'shop_id' => $this->shop->id,
            'customer_name' => 'Dewi Lestari',
            'customer_email' => 'dewi@pasaria.id',
            'customer_phone' => '08123456789',
            'total' => 4500000,
            'subtotal' => 4500000,
            'tax' => 0,
            'status' => 'completed',
            'payment_method' => 'qris',
            'shipping_address' => 'Jl. Sudirman No. 1, Jakarta',
        ]);

        $orderItem = OrderItem::create([
            'order_id' => $order->id,
            'shop_id' => $this->shop->id,
            'product_id' => $this->product->id,
            'product_name' => $this->product->name,
            'price' => 4500000,
            'quantity' => 1,
            'subtotal' => 4500000,
        ]);

        // Seller deletes the product
        $response = $this->actingAs($this->seller, 'sanctum')->deleteJson("/api/products/{$this->product->id}");
        $this->assertEquals(200, $response->status());

        // Product is soft-deleted: not in normal query, but exists in withTrashed()
        $normalFind = Product::find($this->product->id);
        $this->assertNull($normalFind);

        $softDeleted = Product::withTrashed()->find($this->product->id);
        $this->assertNotNull($softDeleted);
        $this->assertNotNull($softDeleted->deleted_at);

        // Historical order item relation remains intact
        $freshOrderItem = OrderItem::find($orderItem->id);
        $this->assertNotNull($freshOrderItem);
        $this->assertEquals($this->product->id, $freshOrderItem->product_id);
    }

    // =========================================================================
    // SECTION C: UPLOAD & MEDIA SECURITY
    // =========================================================================

    public function test_authenticated_user_can_upload_valid_image(): void
    {
        Storage::fake('public');

        $file = UploadedFile::fake()->create('headphone.jpg', 100, 'image/jpeg');

        $response = $this->actingAs($this->seller, 'sanctum')->post('/api/upload', [
            'file' => $file,
        ]);

        $this->assertEquals(201, $response->status());
        $payload = $response->json();
        $this->assertTrue($payload['success']);
        $this->assertNotEmpty($payload['url']);
        $this->assertNotEmpty($payload['path']);

        // Check file exists on fake disk
        Storage::disk('public')->assertExists($payload['path']);
    }

    public function test_upload_rejects_dangerous_non_image_files(): void
    {
        Storage::fake('public');

        $fakePhp = UploadedFile::fake()->create('malicious.php', 100, 'text/x-php');

        $response = $this->actingAs($this->seller, 'sanctum')->postJson('/api/upload', [
            'file' => $fakePhp,
        ]);

        $this->assertEquals(422, $response->status());
    }

    public function test_delete_uploaded_file_prevents_path_traversal(): void
    {
        $response = $this->actingAs($this->seller, 'sanctum')->deleteJson('/api/upload', [
            'path' => '../../../../etc/passwd',
        ]);

        $this->assertEquals(422, $response->status());
    }

    // =========================================================================
    // SECTION D: VOUCHER & PROMOTIONS INTEGRITY
    // =========================================================================

    public function test_voucher_validates_min_purchase_and_expiry(): void
    {
        $voucher = Voucher::create([
            'code' => 'SUPERHEMAT50',
            'name' => 'Diskon 50 Ribu',
            'type' => 'fixed_amount',
            'discount_value' => 50000,
            'min_purchase' => 200000,
            'usage_limit' => 50,
            'usage_per_user' => 1,
            'is_active' => true,
            'start_at' => now()->subDay(),
            'end_at' => now()->addDays(5),
        ]);

        // Fails when subtotal < min_purchase (100000 < 200000)
        $resFail = $this->postJson('/api/vouchers/validate', [
            'code' => 'SUPERHEMAT50',
            'subtotal' => 100000,
        ]);
        $this->assertEquals(422, $resFail->status());

        // Passes when subtotal >= min_purchase
        $resPass = $this->postJson('/api/vouchers/validate', [
            'code' => 'SUPERHEMAT50',
            'subtotal' => 250000,
        ]);
        $this->assertEquals(200, $resPass->status());
        $this->assertEquals(50000.0, (float) $resPass->json('data.discount_amount'));
    }

    public function test_voucher_usage_per_user_limit_enforced(): void
    {
        $voucher = Voucher::create([
            'code' => 'ONETIME10',
            'name' => 'Diskon Sekali Pakai',
            'type' => 'fixed_amount',
            'discount_value' => 25000,
            'min_purchase' => 50000,
            'usage_limit' => 100,
            'usage_per_user' => 1,
            'is_active' => true,
        ]);

        // Customer has already used this voucher
        VoucherRedemption::create([
            'voucher_id' => $voucher->id,
            'user_id' => $this->customer->id,
            'discount_amount' => 25000,
            'status' => 'applied',
        ]);

        // Customer attempts to validate voucher again
        $response = $this->actingAs($this->customer, 'sanctum')->postJson('/api/vouchers/validate', [
            'code' => 'ONETIME10',
            'subtotal' => 100000,
        ]);

        $this->assertEquals(422, $response->status());
        $this->assertStringContainsString('batas penggunaan', $response->json('message'));
    }

    public function test_voucher_quota_is_rolled_back_on_order_cancellation(): void
    {
        $voucher = Voucher::create([
            'code' => 'CANCELDEMO',
            'name' => 'Voucher Kuota Rollback',
            'type' => 'fixed_amount',
            'discount_value' => 20000,
            'min_purchase' => 50000,
            'usage_limit' => 10,
            'usage_count' => 1,
            'usage_per_user' => 1,
            'is_active' => true,
        ]);

        $order = Order::create([
            'order_number' => 'PAS-CANCEL-001',
            'user_id' => $this->customer->id,
            'shop_id' => $this->shop->id,
            'customer_name' => 'Dewi Lestari',
            'customer_email' => 'dewi@pasaria.id',
            'customer_phone' => '08123456789',
            'total' => 80000,
            'subtotal' => 100000,
            'tax' => 0,
            'discount' => 20000,
            'voucher_code' => 'CANCELDEMO',
            'status' => 'pending',
            'payment_method' => 'bank_transfer',
            'shipping_address' => 'Jl. Merdeka No. 10, Jakarta',
        ]);

        $redemption = VoucherRedemption::create([
            'voucher_id' => $voucher->id,
            'user_id' => $this->customer->id,
            'order_id' => $order->id,
            'discount_amount' => 20000,
            'status' => 'applied',
        ]);

        // Customer cancels the order
        $response = $this->actingAs($this->customer, 'sanctum')->postJson("/api/orders/{$order->id}/cancel", [
            'reason' => 'Ingin mengganti metode pembayaran',
        ]);

        $this->assertEquals(200, $response->status());

        // Voucher usage count should decrement back to 0
        $freshVoucher = $voucher->fresh();
        $this->assertEquals(0, $freshVoucher->usage_count);

        // Voucher redemption record marked as rolled_back
        $freshRedemption = $redemption->fresh();
        $this->assertEquals('rolled_back', $freshRedemption->status);
    }

    // =========================================================================
    // SECTION E: REVIEWS & Q&A
    // =========================================================================

    public function test_review_requires_completed_order_item(): void
    {
        // Unverified purchase attempt
        $resFail = $this->actingAs($this->customer, 'sanctum')->postJson('/api/reviews', [
            'product_id' => $this->product->id,
            'rating' => 5,
            'review_text' => 'Bagus sekali padahal belum beli!',
        ]);
        $this->assertEquals(403, $resFail->status());

        // Create verified delivered order item
        $order = Order::create([
            'order_number' => 'PAS-DELIV-001',
            'user_id' => $this->customer->id,
            'shop_id' => $this->shop->id,
            'customer_name' => 'Dewi Lestari',
            'customer_email' => 'dewi@pasaria.id',
            'customer_phone' => '08123456789',
            'total' => 4500000,
            'subtotal' => 4500000,
            'tax' => 0,
            'status' => 'delivered',
            'payment_method' => 'qris',
            'shipping_address' => 'Jl. Menteng No. 5',
        ]);

        OrderItem::create([
            'order_id' => $order->id,
            'shop_id' => $this->shop->id,
            'product_id' => $this->product->id,
            'product_name' => $this->product->name,
            'price' => 4500000,
            'quantity' => 1,
            'subtotal' => 4500000,
        ]);

        // Now review succeeds
        $resPass = $this->actingAs($this->customer, 'sanctum')->postJson('/api/reviews', [
            'product_id' => $this->product->id,
            'rating' => 5,
            'review_text' => 'Suara jernih dan bass mantap, pengiriman cepat!',
        ]);
        $this->assertEquals(201, $resPass->status());

        // Duplicate review attempt for same purchase is rejected
        $resDup = $this->actingAs($this->customer, 'sanctum')->postJson('/api/reviews', [
            'product_id' => $this->product->id,
            'rating' => 5,
            'review_text' => 'Review kedua kali untuk barang yang sama.',
        ]);
        $this->assertEquals(422, $resDup->status());
    }

    public function test_only_shop_owner_can_reply_to_review(): void
    {
        $review = Review::create([
            'user_id' => $this->customer->id,
            'product_id' => $this->product->id,
            'shop_id' => $this->shop->id,
            'rating' => 5,
            'review_text' => 'Mantap!',
            'status' => 'approved',
        ]);

        // otherSeller attempts to reply to shop 1 review
        $resOther = $this->actingAs($this->otherSeller, 'sanctum')->postJson("/api/reviews/{$review->id}/reply", [
            'reply' => 'Terima kasih dari toko lain!',
        ]);
        $this->assertEquals(403, $resOther->status());

        // Legitimate shop owner replies
        $resOwner = $this->actingAs($this->seller, 'sanctum')->postJson("/api/reviews/{$review->id}/reply", [
            'reply' => 'Terima kasih telah berbelanja di Hendra Tech Store!',
        ]);
        $this->assertEquals(200, $resOwner->status());
        $this->assertEquals('Terima kasih telah berbelanja di Hendra Tech Store!', $review->fresh()->seller_reply);
    }

    public function test_qa_prevents_duplicate_spam_questions(): void
    {
        // First question
        $res1 = $this->actingAs($this->customer, 'sanctum')->postJson('/api/questions', [
            'product_id' => $this->product->id,
            'question' => 'Apakah produk ini bergaransi resmi Sony Indonesia?',
        ]);
        $this->assertEquals(201, $res1->status());

        // Duplicate spam attempt within 10 minutes
        $resSpam = $this->actingAs($this->customer, 'sanctum')->postJson('/api/questions', [
            'product_id' => $this->product->id,
            'question' => 'Apakah produk ini bergaransi resmi Sony Indonesia?',
        ]);
        $this->assertEquals(429, $resSpam->status());
    }

    public function test_only_product_shop_owner_can_answer_qa(): void
    {
        $question = ProductQuestion::create([
            'product_id' => $this->product->id,
            'user_id' => $this->customer->id,
            'question' => 'Apakah unit ready stock?',
            'status' => 'approved',
        ]);

        // otherSeller attempts to answer
        $resOther = $this->actingAs($this->otherSeller, 'sanctum')->postJson("/api/questions/{$question->id}/answer", [
            'answer' => 'Saya bukan pemilik toko ini.',
        ]);
        $this->assertEquals(403, $resOther->status());

        // Legitimate shop owner answers
        $resOwner = $this->actingAs($this->seller, 'sanctum')->postJson("/api/questions/{$question->id}/answer", [
            'answer' => 'Ready stock kak, bisa langsung dipesan!',
        ]);
        $this->assertEquals(201, $resOwner->status());
    }

    // =========================================================================
    // SECTION F: WISHLIST & CHAT PARTICIPANT GUARDS
    // =========================================================================

    public function test_wishlist_deduplication_and_inactive_guard(): void
    {
        // Add to wishlist
        $res1 = $this->actingAs($this->customer, 'sanctum')->postJson('/api/wishlist', [
            'product_id' => $this->product->id,
        ]);
        $this->assertEquals(201, $res1->status());

        // Second call is idempotent (does not duplicate record)
        $res2 = $this->actingAs($this->customer, 'sanctum')->postJson('/api/wishlist', [
            'product_id' => $this->product->id,
        ]);
        $this->assertEquals(201, $res2->status());
        $this->assertEquals(1, Wishlist::where('user_id', $this->customer->id)->where('product_id', $this->product->id)->count());

        // Deactivating product causes it to be filtered out from index
        $this->product->update(['is_active' => false]);
        $resIndex = $this->actingAs($this->customer, 'sanctum')->getJson('/api/wishlist');
        $this->assertEquals(200, $resIndex->status());
        $this->assertCount(0, $resIndex->json('data'));
    }

    public function test_chat_messages_are_isolated_to_conversation_participants(): void
    {
        $conversation = Conversation::create([
            'shop_id' => $this->shop->id,
            'customer_id' => $this->customer->id,
        ]);

        // Customer sends message
        $resMsg = $this->actingAs($this->customer, 'sanctum')->postJson('/api/conversations/messages', [
            'conversation_id' => $conversation->id,
            'message' => 'Halo, apakah pesanan saya sudah diproses?',
        ]);
        $this->assertEquals(201, $resMsg->status());

        // Third-party customer cannot view messages of this conversation
        $resUnauthorized = $this->actingAs($this->otherCustomer, 'sanctum')->getJson("/api/conversations/{$conversation->id}/messages");
        $this->assertEquals(403, $resUnauthorized->status());

        // Participating seller can view messages
        $resSeller = $this->actingAs($this->seller, 'sanctum')->getJson("/api/conversations/{$conversation->id}/messages");
        $this->assertEquals(200, $resSeller->status());
    }
}
