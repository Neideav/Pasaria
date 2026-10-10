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
use App\Models\Shipment;
use App\Models\ShipmentEvent;
use App\Models\UserAddress;
use App\Models\Notification;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\OrderReturn;
use App\Models\Wallet;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class ApiPrivacyAndResourceAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    protected User $customerA;
    protected User $customerB;
    protected User $sellerA;
    protected User $sellerB;
    protected User $admin;
    protected Shop $shopA;
    protected Shop $shopB;
    protected Product $productA;
    protected Product $productB;

    protected function setUp(): void
    {
        parent::setUp();

        $this->customerA = User::create([
            'name' => 'Alice Customer',
            'username' => 'alice',
            'email' => 'alice@example.com',
            'password' => Hash::make('password123'),
            'role' => 'customer',
            'status' => 'active',
            'phone' => '081234567890',
            'address' => 'Jl. Mawar No. 12, Menteng',
            'city' => 'Jakarta Pusat',
            'zip' => '10310',
            'email_verified_at' => now(),
        ]);

        $this->customerB = User::create([
            'name' => 'Bob Customer',
            'username' => 'bob',
            'email' => 'bob@example.com',
            'password' => Hash::make('password123'),
            'role' => 'customer',
            'status' => 'active',
            'phone' => '081298765432',
            'address' => 'Jl. Melati No. 88, Kebayoran',
            'city' => 'Jakarta Selatan',
            'zip' => '12120',
            'email_verified_at' => now(),
        ]);

        $this->sellerA = User::create([
            'name' => 'Seller One',
            'username' => 'seller1',
            'email' => 'seller1@pasaria.id',
            'password' => Hash::make('password123'),
            'role' => 'seller',
            'status' => 'active',
            'phone' => '081100000001',
            'email_verified_at' => now(),
        ]);

        $this->shopA = Shop::create([
            'user_id' => $this->sellerA->id,
            'name' => 'Toko Gadget A',
            'slug' => 'toko-gadget-a',
            'slogan' => 'Official Tech Store',
            'city' => 'Jakarta',
            'status' => 'approved',
            'verified' => true,
        ]);

        $this->sellerB = User::create([
            'name' => 'Seller Two',
            'username' => 'seller2',
            'email' => 'seller2@pasaria.id',
            'password' => Hash::make('password123'),
            'role' => 'seller',
            'status' => 'active',
            'phone' => '081100000002',
            'email_verified_at' => now(),
        ]);

        $this->shopB = Shop::create([
            'user_id' => $this->sellerB->id,
            'name' => 'Toko Fashion B',
            'slug' => 'toko-fashion-b',
            'slogan' => 'Fashion Trends',
            'city' => 'Bandung',
            'status' => 'approved',
            'verified' => true,
        ]);

        $this->admin = User::create([
            'name' => 'Admin Pasaria',
            'username' => 'adminpasaria',
            'email' => 'admin@pasaria.id',
            'password' => Hash::make('admin123456'),
            'role' => 'admin',
            'status' => 'active',
            'email_verified_at' => now(),
        ]);

        $this->productA = Product::create([
            'name' => 'Smartphone Flagship X',
            'slug' => 'smartphone-flagship-x',
            'category' => 'Electronics',
            'image' => 'smartphone-x.jpg',
            'price' => 10000000.00,
            'stock' => 20,
            'rating' => 5.0,
            'review_count' => 0,
            'shop_id' => $this->shopA->id,
            'shop_name' => $this->shopA->name,
            'shop_city' => $this->shopA->city,
        ]);

        $this->productB = Product::create([
            'name' => 'Kemeja Katun Modern',
            'slug' => 'kemeja-katun-modern',
            'category' => 'Fashion',
            'image' => 'kemeja.jpg',
            'price' => 250000.00,
            'stock' => 50,
            'rating' => 5.0,
            'review_count' => 0,
            'shop_id' => $this->shopB->id,
            'shop_name' => $this->shopB->name,
            'shop_city' => $this->shopB->city,
        ]);
    }

    /**
     * A1. Public reviews endpoint does NOT leak reviewer email, phone, address, role, status.
     */
    public function test_reviews_public_endpoint_does_not_leak_user_pii(): void
    {
        $review = Review::create([
            'user_id' => $this->customerA->id,
            'product_id' => $this->productA->id,
            'shop_id' => $this->shopA->id,
            'rating' => 5,
            'review_text' => 'Kualitas produk sangat bagus!',
            'is_anonymous' => false,
            'is_verified_purchase' => true,
            'status' => 'approved',
        ]);

        $response = $this->getJson("/api/products/{$this->productA->id}/reviews");
        $response->assertStatus(200);

        $firstReview = $response->json('data.0');
        $this->assertNotNull($firstReview);
        $this->assertEquals($this->customerA->id, $firstReview['user']['id']);
        $this->assertEquals($this->customerA->name, $firstReview['user']['name']);

        // Explicitly assert private fields are absent from user object
        $this->assertArrayNotHasKey('email', $firstReview['user']);
        $this->assertArrayNotHasKey('phone', $firstReview['user']);
        $this->assertArrayNotHasKey('address', $firstReview['user']);
        $this->assertArrayNotHasKey('city', $firstReview['user']);
        $this->assertArrayNotHasKey('zip', $firstReview['user']);
        $this->assertArrayNotHasKey('role', $firstReview['user']);
        $this->assertArrayNotHasKey('status', $firstReview['user']);
    }

    /**
     * A2. Anonymous review masks name and zeroes user_id.
     */
    public function test_anonymous_review_masks_name_and_zeroes_user_id(): void
    {
        Review::create([
            'user_id' => $this->customerA->id,
            'product_id' => $this->productA->id,
            'shop_id' => $this->shopA->id,
            'rating' => 4,
            'review_text' => 'Pengiriman rapi dan aman.',
            'is_anonymous' => true,
            'is_verified_purchase' => true,
            'status' => 'approved',
        ]);

        $response = $this->getJson("/api/products/{$this->productA->id}/reviews");
        $response->assertStatus(200);

        $firstReview = $response->json('data.0');
        $this->assertEquals(0, $firstReview['user_id']);
        $this->assertEquals(0, $firstReview['user']['id']);
        $this->assertEquals('Pengguna PASARIA', $firstReview['user']['name']);
        $this->assertNull($firstReview['user']['avatar']);
    }

    /**
     * A3. Product questions endpoint does NOT leak inquirer PII.
     */
    public function test_product_questions_endpoint_does_not_leak_inquirer_pii(): void
    {
        ProductQuestion::create([
            'user_id' => $this->customerA->id,
            'product_id' => $this->productA->id,
            'question' => 'Apakah produk ini bergaransi resmi?',
            'is_public' => true,
            'status' => 'approved',
        ]);

        $response = $this->getJson("/api/products/{$this->productA->id}/questions");
        $response->assertStatus(200);

        $firstQuestion = $response->json('data.0');
        $this->assertNotNull($firstQuestion);
        $this->assertEquals($this->customerA->id, $firstQuestion['user']['id']);
        $this->assertEquals($this->customerA->name, $firstQuestion['user']['name']);

        // Assert no PII leakage
        $this->assertArrayNotHasKey('email', $firstQuestion['user']);
        $this->assertArrayNotHasKey('phone', $firstQuestion['user']);
        $this->assertArrayNotHasKey('address', $firstQuestion['user']);
        $this->assertArrayNotHasKey('role', $firstQuestion['user']);
    }

    /**
     * A4. Product detail endpoint scrubs nested reviews and questions.
     */
    public function test_product_detail_endpoint_scrubs_nested_reviews_and_questions(): void
    {
        Review::create([
            'user_id' => $this->customerA->id,
            'product_id' => $this->productA->id,
            'shop_id' => $this->shopA->id,
            'rating' => 5,
            'review_text' => 'Mantap!',
            'is_anonymous' => false,
            'is_verified_purchase' => true,
            'status' => 'approved',
        ]);

        ProductQuestion::create([
            'user_id' => $this->customerA->id,
            'product_id' => $this->productA->id,
            'question' => 'Ready warna hitam?',
            'is_public' => true,
            'status' => 'approved',
        ]);

        $response = $this->getJson("/api/products/{$this->productA->slug}");
        $response->assertStatus(200);

        $productData = $response->json('data');
        $this->assertNotEmpty($productData['reviews']);
        $this->assertArrayNotHasKey('email', $productData['reviews'][0]['user']);
        $this->assertArrayNotHasKey('phone', $productData['reviews'][0]['user']);

        $this->assertNotEmpty($productData['questions']);
        $this->assertArrayNotHasKey('email', $productData['questions'][0]['user']);
        $this->assertArrayNotHasKey('phone', $productData['questions'][0]['user']);
    }

    /**
     * B1. Public tracking endpoint hides recipient phone, full street address, and order total.
     */
    public function test_public_tracking_hides_private_recipient_details_and_monetary_total(): void
    {
        $order = Order::create([
            'order_number' => 'ORD-TEST-001',
            'user_id' => $this->customerA->id,
            'shop_id' => $this->shopA->id,
            'status' => 'shipped',
            'payment_method' => 'cod',
            'customer_name' => $this->customerA->name,
            'customer_email' => $this->customerA->email,
            'customer_phone' => $this->customerA->phone,
            'shipping_address' => 'Jl. Mawar No. 12, Menteng, Jakarta Pusat, DKI Jakarta, 10310',
            'subtotal' => 10000000.00,
            'shipping_cost' => 15000.00,
            'tax' => 1100000.00,
            'total' => 11115000.00,
            'tracking_number' => 'JNE-SECRET-999',
        ]);

        $shipment = Shipment::create([
            'shipment_id' => 'SHP-SECRET-999',
            'order_number' => $order->order_number,
            'user_id' => $this->customerA->id,
            'courier_name' => 'jne',
            'courier_service' => 'REG',
            'tracking_number' => 'JNE-SECRET-999',
            'status' => 'in_transit',
            'status_label' => 'Dalam Perjalanan',
            'recipient_name' => $this->customerA->name,
            'recipient_phone' => $this->customerA->phone,
            'delivery_address' => 'Jl. Mawar No. 12, Menteng, Jakarta Pusat, DKI Jakarta, 10310',
            'origin_address' => 'Jakarta Barat',
            'current_location' => 'Jakarta Sorting Center',
            'items_count' => 1,
            'total_amount' => 11115000.00,
        ]);

        ShipmentEvent::create([
            'shipment_id' => $shipment->shipment_id,
            'title' => 'Paket Disortir',
            'status' => 'in_transit',
            'location' => 'Jakarta Sorting Center',
            'description' => 'Paket sedang disortir di hub Jakarta',
            'event_time' => now(),
        ]);

        // 1. Unauthenticated public query with known tracking number
        $response = $this->getJson("/api/deliveries/{$shipment->tracking_number}");
        $response->assertStatus(200);
        $this->assertFalse($response->json('authorized'));

        $data = $response->json('data');
        $this->assertEquals('JNE-SECRET-999', $data['tracking_number']);
        $this->assertEquals('in_transit', $data['status']);

        // Assert strictly protected PII is NOT revealed in public tracking
        $this->assertArrayNotHasKey('recipient_phone', $data);
        $this->assertArrayNotHasKey('delivery_address', $data);
        $this->assertArrayNotHasKey('total_amount', $data);
        $this->assertArrayNotHasKey('items_preview_json', $data);
        $this->assertArrayNotHasKey('recipient_name', $data);

        // 2. Unrelated customer B querying tracking number also only gets public tracking
        auth()->forgetGuards();
        $responseB = $this->actingAs($this->customerB, 'sanctum')->getJson("/api/deliveries/{$shipment->tracking_number}");
        $responseB->assertStatus(200);
        $this->assertFalse($responseB->json('authorized'));
        $this->assertArrayNotHasKey('recipient_phone', $responseB->json('data'));
    }

    /**
     * B2. Authorized buyer and seller receive full ShipmentDetailResource.
     */
    public function test_authorized_buyer_and_seller_receive_full_shipment_details(): void
    {
        $order = Order::create([
            'order_number' => 'ORD-TEST-002',
            'user_id' => $this->customerA->id,
            'shop_id' => $this->shopA->id,
            'status' => 'shipped',
            'payment_method' => 'cod',
            'customer_name' => $this->customerA->name,
            'customer_email' => $this->customerA->email,
            'customer_phone' => $this->customerA->phone,
            'shipping_address' => 'Jl. Mawar No. 12, Menteng, Jakarta Pusat',
            'subtotal' => 10000000.00,
            'shipping_cost' => 15000.00,
            'tax' => 1100000.00,
            'total' => 11115000.00,
            'tracking_number' => 'JNE-AUTH-777',
        ]);

        $shipment = Shipment::create([
            'shipment_id' => 'SHP-AUTH-777',
            'order_number' => $order->order_number,
            'user_id' => $this->customerA->id,
            'courier_name' => 'jne',
            'courier_service' => 'REG',
            'tracking_number' => 'JNE-AUTH-777',
            'status' => 'in_transit',
            'status_label' => 'Dalam Perjalanan',
            'recipient_name' => $this->customerA->name,
            'recipient_phone' => $this->customerA->phone,
            'delivery_address' => 'Jl. Mawar No. 12, Menteng, Jakarta Pusat',
            'origin_address' => 'Jakarta Barat',
            'current_location' => 'Jakarta Sorting Center',
            'items_count' => 1,
            'total_amount' => 11115000.00,
        ]);

        // Buyer query
        auth()->forgetGuards();
        $buyerResponse = $this->actingAs($this->customerA, 'sanctum')->getJson("/api/deliveries/{$shipment->tracking_number}");
        $buyerResponse->assertStatus(200);
        $this->assertEquals($this->customerA->phone, $buyerResponse->json('data.recipient_phone'));
        $this->assertEquals('Jl. Mawar No. 12, Menteng, Jakarta Pusat', $buyerResponse->json('data.delivery_address'));

        // Seller query
        auth()->forgetGuards();
        $sellerResponse = $this->actingAs($this->sellerA, 'sanctum')->getJson("/api/deliveries/{$shipment->tracking_number}");
        $sellerResponse->assertStatus(200);
        $this->assertEquals($this->customerA->phone, $sellerResponse->json('data.recipient_phone'));
    }

    /**
     * B3. Cross-shop delivery creation is rejected with 403.
     */
    public function test_cross_shop_delivery_creation_is_rejected_with_403(): void
    {
        $orderA = Order::create([
            'order_number' => 'ORD-SHOP-A',
            'user_id' => $this->customerA->id,
            'shop_id' => $this->shopA->id,
            'status' => 'processing',
            'payment_method' => 'cod',
            'customer_name' => $this->customerA->name,
            'customer_email' => $this->customerA->email,
            'customer_phone' => $this->customerA->phone,
            'shipping_address' => 'Jl. Mawar No. 12, Menteng',
            'subtotal' => 1000000.00,
            'shipping_cost' => 10000.00,
            'tax' => 110000.00,
            'total' => 1120000.00,
        ]);

        // Seller B attempts to dispatch delivery for Seller A's order
        auth()->forgetGuards();
        $response = $this->actingAs($this->sellerB, 'sanctum')->postJson('/api/deliveries', [
            'order_number' => $orderA->order_number,
            'status' => 'processing',
            'courier_name' => 'jne',
        ]);

        $response->assertStatus(403);
    }

    /**
     * D1. Order IDOR: Customer cannot access other customers' orders.
     */
    public function test_customer_order_idor_is_rejected_with_403(): void
    {
        $orderA = Order::create([
            'order_number' => 'ORD-ALICE-123',
            'user_id' => $this->customerA->id,
            'shop_id' => $this->shopA->id,
            'status' => 'pending_payment',
            'payment_method' => 'cod',
            'customer_name' => $this->customerA->name,
            'customer_email' => $this->customerA->email,
            'customer_phone' => $this->customerA->phone,
            'shipping_address' => 'Jl. Mawar No. 12, Menteng',
            'subtotal' => 500000.00,
            'shipping_cost' => 10000.00,
            'tax' => 55000.00,
            'total' => 565000.00,
        ]);

        // Customer B attempts to inspect Alice's order
        auth()->forgetGuards();
        $response = $this->actingAs($this->customerB, 'sanctum')->getJson("/api/orders/{$orderA->order_number}");
        $response->assertStatus(403);

        // Customer B attempts to cancel Alice's order
        auth()->forgetGuards();
        $cancelResponse = $this->actingAs($this->customerB, 'sanctum')->postJson("/api/orders/{$orderA->id}/cancel");
        $cancelResponse->assertStatus(403);
    }

    /**
     * D2. Address IDOR and user_id spoofing are rejected.
     */
    public function test_address_idor_and_user_id_spoofing_are_rejected(): void
    {
        $addressA = UserAddress::create([
            'user_id' => $this->customerA->id,
            'recipient_name' => 'Alice Home',
            'phone' => '081234567890',
            'address_line' => 'Jl. Mawar No. 12',
            'city' => 'Jakarta Pusat',
            'postal_code' => '10310',
            'is_default' => true,
        ]);

        // Bob attempts to update Alice's address
        auth()->forgetGuards();
        $updateResponse = $this->actingAs($this->customerB, 'sanctum')->putJson("/api/user/addresses/{$addressA->id}", [
            'recipient_name' => 'Hacked Name',
        ]);
        $updateResponse->assertStatus(403);

        // Bob attempts to delete Alice's address
        auth()->forgetGuards();
        $deleteResponse = $this->actingAs($this->customerB, 'sanctum')->deleteJson("/api/user/addresses/{$addressA->id}");
        $deleteResponse->assertStatus(403);

        // Bob attempts to set Alice's address as default
        auth()->forgetGuards();
        $defaultResponse = $this->actingAs($this->customerB, 'sanctum')->postJson("/api/user/addresses/{$addressA->id}/default");
        $defaultResponse->assertStatus(403);

        // Bob attempts to create an address spoofing user_id => Alice
        auth()->forgetGuards();
        $spoofResponse = $this->actingAs($this->customerB, 'sanctum')->postJson("/api/user/addresses", [
            'user_id' => $this->customerA->id,
            'recipient_name' => 'Spoofed',
            'phone' => '08999999999',
            'address_line' => 'Jl. Palsu',
            'city' => 'Bandung',
            'postal_code' => '40111',
        ]);
        $spoofResponse->assertStatus(403);
    }

    /**
     * D3. Notification mark-as-read IDOR returns 403.
     */
    public function test_notification_mark_as_read_idor_returns_403(): void
    {
        $notificationA = Notification::create([
            'user_id' => $this->customerA->id,
            'title' => 'Promo Diskon',
            'message' => 'Diskon 50% untuk Anda',
            'type' => 'promo',
            'is_read' => false,
        ]);

        // Bob attempts to mark Alice's notification as read
        auth()->forgetGuards();
        $response = $this->actingAs($this->customerB, 'sanctum')->postJson("/api/notifications/{$notificationA->id}/read");
        $response->assertStatus(403);
    }

    /**
     * D4. Chat IDOR and customer PII sanitization.
     */
    public function test_chat_idor_and_customer_pii_sanitization(): void
    {
        $conversation = Conversation::create([
            'customer_id' => $this->customerA->id,
            'shop_id' => $this->shopA->id,
            'last_message_at' => now(),
        ]);

        // Bob attempts to view Alice's conversation messages
        auth()->forgetGuards();
        $response = $this->actingAs($this->customerB, 'sanctum')->getJson("/api/conversations/{$conversation->id}/messages");
        $response->assertStatus(403);

        // Seller A lists conversations: customer relation has id, name, avatar but no phone, address, email
        auth()->forgetGuards();
        $sellerConvResponse = $this->actingAs($this->sellerA, 'sanctum')->getJson('/api/conversations');
        $sellerConvResponse->assertStatus(200);

        $convData = $sellerConvResponse->json('data.0');
        $this->assertNotNull($convData);
        $this->assertEquals($this->customerA->id, $convData['customer']['id']);
        $this->assertEquals($this->customerA->name, $convData['customer']['name']);
        $this->assertArrayNotHasKey('email', $convData['customer']);
        $this->assertArrayNotHasKey('phone', $convData['customer']);
        $this->assertArrayNotHasKey('address', $convData['customer']);
    }

    /**
     * D5. Cross-shop manipulation by seller is rejected with 403.
     */
    public function test_cross_shop_manipulation_by_seller_is_rejected(): void
    {
        // 1. Seller A attempts to delete Seller B's product
        auth()->forgetGuards();
        $delResponse = $this->actingAs($this->sellerA, 'sanctum')->deleteJson("/api/products/{$this->productB->id}");
        $delResponse->assertStatus(403);

        // 2. Seller A attempts to update Seller B's product stock
        auth()->forgetGuards();
        $stockResponse = $this->actingAs($this->sellerA, 'sanctum')->putJson("/api/seller/products/{$this->productB->id}/stock", [
            'stock' => 999,
        ]);
        $stockResponse->assertStatus(403);

        // 3. Seller A attempts to update Seller B's order status
        $orderB = Order::create([
            'order_number' => 'ORD-SHOP-B-1',
            'user_id' => $this->customerB->id,
            'shop_id' => $this->shopB->id,
            'status' => 'paid',
            'payment_method' => 'cod',
            'customer_name' => $this->customerB->name,
            'customer_email' => $this->customerB->email,
            'customer_phone' => $this->customerB->phone,
            'shipping_address' => 'Jl. Melati No. 88, Kebayoran',
            'subtotal' => 250000.00,
            'shipping_cost' => 10000.00,
            'tax' => 27500.00,
            'total' => 287500.00,
        ]);

        auth()->forgetGuards();
        $statusResponse = $this->actingAs($this->sellerA, 'sanctum')->putJson("/api/orders/{$orderB->id}/status", [
            'status' => 'processing',
        ]);
        $statusResponse->assertStatus(403);

        // 4. Seller A attempts to reply to review of Seller B's product
        $reviewB = Review::create([
            'user_id' => $this->customerB->id,
            'product_id' => $this->productB->id,
            'shop_id' => $this->shopB->id,
            'rating' => 4,
            'review_text' => 'Bahan bagus',
            'status' => 'approved',
        ]);

        auth()->forgetGuards();
        $replyResponse = $this->actingAs($this->sellerA, 'sanctum')->postJson("/api/reviews/{$reviewB->id}/reply", [
            'reply' => 'Terima kasih dari toko lain!',
        ]);
        $replyResponse->assertStatus(403);

        // 5. Seller A attempts to respond to return of Seller B's order
        $returnB = OrderReturn::create([
            'order_id' => $orderB->id,
            'user_id' => $this->customerB->id,
            'shop_id' => $this->shopB->id,
            'reason' => 'damaged',
            'description' => 'Ada robekan pada kain kemeja',
            'requested_amount' => 287500.00,
            'refund_amount' => 0.00,
            'status' => 'requested',
        ]);

        auth()->forgetGuards();
        $returnResponse = $this->actingAs($this->sellerA, 'sanctum')->postJson("/api/returns/{$returnB->id}/respond", [
            'action' => 'approve',
            'note' => 'Disetujui ilegal',
        ]);
        $returnResponse->assertStatus(403);
    }

    /**
     * C1. Mass assignment and privilege escalation attempts are rejected with 422 or 403.
     */
    public function test_mass_assignment_and_privilege_escalation_are_rejected(): void
    {
        // 1. Profile update: customer attempts role escalation or balance tampering
        auth()->forgetGuards();
        $roleEscalateResponse = $this->actingAs($this->customerA, 'sanctum')->putJson('/api/user/profile', [
            'name' => 'Alice VIP',
            'role' => 'admin',
        ]);
        $roleEscalateResponse->assertStatus(422);

        $statusEscalateResponse = $this->actingAs($this->customerA, 'sanctum')->putJson('/api/user/profile', [
            'status' => 'suspended',
        ]);
        $statusEscalateResponse->assertStatus(422);

        $balanceTamperResponse = $this->actingAs($this->customerA, 'sanctum')->putJson('/api/user/profile', [
            'balance' => 999999999,
        ]);
        $balanceTamperResponse->assertStatus(422);

        // 2. Shop update: seller attempts verified / status escalation
        auth()->forgetGuards();
        $shopEscalateResponse = $this->actingAs($this->sellerA, 'sanctum')->putJson("/api/shops/{$this->shopA->id}", [
            'verified' => true,
            'status' => 'approved',
        ]);
        $shopEscalateResponse->assertStatus(422);

        // 3. Product create: seller attempts rating / review_count injection
        auth()->forgetGuards();
        $ratingTamperResponse = $this->actingAs($this->sellerA, 'sanctum')->postJson('/api/products', [
            'name' => 'Produk Baru',
            'category' => 'Electronics',
            'price' => 500000,
            'stock' => 10,
            'rating' => 5.0,
        ]);
        $ratingTamperResponse->assertStatus(422);

        // 4. Product create: seller attempts cross-shop shop_id spoofing
        auth()->forgetGuards();
        $crossShopProductResponse = $this->actingAs($this->sellerA, 'sanctum')->postJson('/api/products', [
            'name' => 'Produk Toko B Palsu',
            'category' => 'Fashion',
            'price' => 500000,
            'stock' => 10,
            'shop_id' => $this->shopB->id,
        ]);
        $crossShopProductResponse->assertStatus(403);

        // 5. Order create: customer attempts status or paid_at tampering
        auth()->forgetGuards();
        $orderTamperResponse = $this->actingAs($this->customerA, 'sanctum')->postJson('/api/orders', [
            'items' => [
                ['product_id' => $this->productA->id, 'quantity' => 1]
            ],
            'status' => 'paid',
        ]);
        $orderTamperResponse->assertStatus(422);

        $paidAtTamperResponse = $this->actingAs($this->customerA, 'sanctum')->postJson('/api/orders', [
            'items' => [
                ['product_id' => $this->productA->id, 'quantity' => 1]
            ],
            'paid_at' => now()->toIso8601String(),
        ]);
        $paidAtTamperResponse->assertStatus(422);

        // 6. Payout request: seller attempts status or reference_id injection
        Wallet::create(['shop_id' => $this->shopA->id, 'user_id' => $this->sellerA->id, 'balance' => 1000000.00]);
        auth()->forgetGuards();
        $payoutTamperResponse = $this->actingAs($this->sellerA, 'sanctum')->postJson('/api/seller/payout', [
            'amount' => 500000,
            'bank_name' => 'BCA',
            'account_number' => '1234567890',
            'account_holder' => 'Seller One',
            'status' => 'completed',
        ]);
        $payoutTamperResponse->assertStatus(422);

        // 7. Return request: customer attempts status or refund_amount injection
        $orderA = Order::create([
            'order_number' => 'ORD-RETURN-TEST',
            'user_id' => $this->customerA->id,
            'shop_id' => $this->shopA->id,
            'status' => 'delivered',
            'payment_method' => 'cod',
            'customer_name' => $this->customerA->name,
            'customer_email' => $this->customerA->email,
            'customer_phone' => $this->customerA->phone,
            'shipping_address' => 'Jl. Mawar No. 12, Menteng',
            'subtotal' => 1000000.00,
            'shipping_cost' => 10000.00,
            'tax' => 110000.00,
            'total' => 1120000.00,
        ]);

        auth()->forgetGuards();
        $returnTamperResponse = $this->actingAs($this->customerA, 'sanctum')->postJson('/api/returns', [
            'order_id' => $orderA->id,
            'reason' => 'damaged',
            'description' => 'Barang rusak saat diterima pembeli',
            'status' => 'approved',
        ]);
        $returnTamperResponse->assertStatus(422);
    }

    /**
     * E1. Unauthorized endpoints fail safely with 401 or 403.
     */
    public function test_unauthorized_endpoints_fail_safely(): void
    {
        // Unauthenticated access
        $this->getJson('/api/orders')->assertStatus(401);
        $this->getJson('/api/user/addresses')->assertStatus(401);
        $this->getJson('/api/notifications')->assertStatus(401);
        $this->getJson('/api/conversations')->assertStatus(401);

        // Non-admin accessing admin audit logs
        auth()->forgetGuards();
        $this->actingAs($this->customerA, 'sanctum')->getJson('/api/admin/audit-logs')->assertStatus(403);

        auth()->forgetGuards();
        $this->actingAs($this->sellerA, 'sanctum')->getJson('/api/admin/audit-logs')->assertStatus(403);

        auth()->forgetGuards();
        $this->actingAs($this->customerA, 'sanctum')->getJson('/api/admin/users')->assertStatus(403);

        // Admin can access audit logs safely
        auth()->forgetGuards();
        $adminResponse = $this->actingAs($this->admin, 'sanctum')->getJson('/api/admin/audit-logs');
        $adminResponse->assertStatus(200);
    }
}
