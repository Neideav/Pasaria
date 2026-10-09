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
use App\Models\OrderReturn;
use App\Models\Dispute;
use App\Models\Refund;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use App\Models\AdminAction;
use App\Services\OrderStateMachine;
use App\Services\LedgerService;
use App\Services\RefundService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;

class OrderStateMachineAndRefundTest extends TestCase
{
    use RefreshDatabase;

    protected User $customer;
    protected User $otherCustomer;
    protected User $seller;
    protected User $otherSeller;
    protected User $admin;
    protected User $support;
    protected Shop $shop;
    protected Shop $otherShop;
    protected Product $product;
    protected OrderStateMachine $stateMachine;
    protected LedgerService $ledgerService;
    protected RefundService $refundService;

    protected function setUp(): void
    {
        parent::setUp();

        $this->stateMachine = app(OrderStateMachine::class);
        $this->ledgerService = app(LedgerService::class);
        $this->refundService = app(RefundService::class);

        $this->customer = User::create([
            'name'              => 'Budi Customer',
            'username'          => 'budicustomer',
            'email'             => 'customer@pasaria.id',
            'password'          => Hash::make('password123'),
            'role'              => 'customer',
            'status'            => 'active',
            'email_verified_at' => now(),
        ]);

        $this->otherCustomer = User::create([
            'name'              => 'Siti Customer',
            'username'          => 'siticustomer',
            'email'             => 'siti@pasaria.id',
            'password'          => Hash::make('password123'),
            'role'              => 'customer',
            'status'            => 'active',
            'email_verified_at' => now(),
        ]);

        $this->seller = User::create([
            'name'              => 'Hendro Seller',
            'username'          => 'hendroseller',
            'email'             => 'seller@pasaria.id',
            'password'          => Hash::make('password123'),
            'role'              => 'seller',
            'status'            => 'active',
            'email_verified_at' => now(),
        ]);

        $this->otherSeller = User::create([
            'name'              => 'Rudi Other Seller',
            'username'          => 'rudiseller',
            'email'             => 'rudi@pasaria.id',
            'password'          => Hash::make('password123'),
            'role'              => 'seller',
            'status'            => 'active',
            'email_verified_at' => now(),
        ]);

        $this->admin = User::create([
            'name'              => 'Admin Pasaria',
            'username'          => 'adminpasaria',
            'email'             => 'admin@pasaria.id',
            'password'          => Hash::make('password123'),
            'role'              => 'admin',
            'status'            => 'active',
            'email_verified_at' => now(),
        ]);

        $this->support = User::create([
            'name'              => 'Support Pasaria',
            'username'          => 'supportpasaria',
            'email'             => 'support@pasaria.id',
            'password'          => Hash::make('password123'),
            'role'              => 'support',
            'status'            => 'active',
            'email_verified_at' => now(),
        ]);

        $this->shop = Shop::create([
            'user_id'     => $this->seller->id,
            'name'        => 'Toko Hendro',
            'slug'        => 'toko-hendro',
            'description' => 'Toko resmi Hendro',
            'city'        => 'Jakarta Barat',
            'status'      => 'approved',
            'verified'    => true,
        ]);

        $this->otherShop = Shop::create([
            'user_id'     => $this->otherSeller->id,
            'name'        => 'Toko Rudi',
            'slug'        => 'toko-rudi',
            'description' => 'Toko resmi Rudi',
            'city'        => 'Bandung',
            'status'      => 'approved',
            'verified'    => true,
        ]);

        $this->product = Product::create([
            'shop_id'     => $this->shop->id,
            'name'        => 'Sepatu Lari Ultralight',
            'slug'        => 'sepatu-lari-ultralight',
            'category'    => 'Sports',
            'category_id' => 1,
            'price'       => 200000.00,
            'stock'       => 10,
            'image'       => 'sepatu-lari',
            'shop_name'   => $this->shop->name,
            'shop_city'   => $this->shop->city,
            'is_active'   => true,
        ]);
    }

    protected function createOrder(array $attributes = []): Order
    {
        return Order::create(array_merge([
            'order_number'        => 'ORD-' . strtoupper(\Illuminate\Support\Str::random(10)),
            'master_order_number' => 'ORD-' . strtoupper(\Illuminate\Support\Str::random(10)),
            'user_id'             => $this->customer->id,
            'shop_id'             => $this->shop->id,
            'customer_name'       => 'Budi Customer',
            'customer_email'      => 'customer@pasaria.id',
            'customer_phone'      => '081234567890',
            'shipping_address'    => 'Jl. Kebon Jeruk No. 12, Jakarta',
            'payment_method'      => 'qris',
            'subtotal'            => 200000.00,
            'tax'                 => 22000.00,
            'shipping_cost'       => 15000.00,
            'total'               => 237000.00,
            'status'              => 'paid',
        ], $attributes));
    }

    /**
     * 1. Transisi status yang sah dan tidak sah.
     */
    public function test_valid_and_invalid_order_status_transitions(): void
    {
        $order = $this->createOrder([
            'order_number'        => 'ORD-STATE-001',
            'master_order_number' => 'ORD-STATE-001',
            'user_id'             => $this->customer->id,
            'shop_id'             => $this->shop->id,
            'customer_name'       => 'Budi Customer',
            'customer_email'      => 'customer@pasaria.id',
            'payment_method'      => 'qris',
            'subtotal'            => 200000.00,
            'tax'                 => 22000.00,
            'shipping_cost'       => 15000.00,
            'total'               => 237000.00,
            'status'              => 'paid',
        ]);

        // A. Valid transition: seller moves paid -> processing
        $resp1 = $this->actingAs($this->seller, 'sanctum')->putJson("/api/orders/{$order->id}/status", [
            'status' => 'processing',
        ]);
        $resp1->assertStatus(200);

        // B. Valid transition: seller moves processing -> shipped
        $resp2 = $this->actingAs($this->seller, 'sanctum')->putJson("/api/orders/{$order->id}/status", [
            'status'          => 'shipped',
            'tracking_number' => 'PAS-TRK-9988',
        ]);
        $resp2->assertStatus(200);

        // C. Invalid transition: cannot jump from shipped back to pending_payment or processing
        $respInvalid = $this->actingAs($this->seller, 'sanctum')->putJson("/api/orders/{$order->id}/status", [
            'status' => 'processing',
        ]);
        $respInvalid->assertStatus(422);

        // D. Advance to completed
        $this->actingAs($this->seller, 'sanctum')->putJson("/api/orders/{$order->id}/status", ['status' => 'delivered']);
        $this->actingAs($this->seller, 'sanctum')->putJson("/api/orders/{$order->id}/status", ['status' => 'completed']);

        $order->refresh();
        $this->assertEquals('completed', $order->status);

        // E. Completed order cannot be transitioned back to paid or processing
        $respRevive = $this->actingAs($this->admin, 'sanctum')->putJson("/api/orders/{$order->id}/status", [
            'status' => 'paid',
        ]);
        $respRevive->assertStatus(422);
    }

    /**
     * 2. Pembatalan order yang sudah tidak memenuhi syarat (shipped/delivered) ditolak.
     */
    public function test_cancellation_of_ineligible_order_is_rejected(): void
    {
        $order = $this->createOrder([
            'order_number'        => 'ORD-NOCANCEL-001',
            'master_order_number' => 'ORD-NOCANCEL-001',
            'user_id'             => $this->customer->id,
            'shop_id'             => $this->shop->id,
            'customer_name'       => 'Budi Customer',
            'customer_email'      => 'customer@pasaria.id',
            'payment_method'      => 'qris',
            'subtotal'            => 200000.00,
            'tax'                 => 22000.00,
            'shipping_cost'       => 15000.00,
            'total'               => 237000.00,
            'status'              => 'shipped', // Already shipped
        ]);

        $response = $this->actingAs($this->customer, 'sanctum')->postJson("/api/orders/{$order->id}/cancel", [
            'reason' => 'Ingin ganti alamat',
        ]);

        $response->assertStatus(422);

        $order->refresh();
        $this->assertEquals('shipped', $order->status);
    }

    /**
     * 3. Restock tepat satu kali saat pembatalan order.
     */
    public function test_inventory_is_restocked_strictly_once_on_cancellation(): void
    {
        $initialStock = $this->product->stock; // 10

        // Create pending_payment order for 3 items
        $order = $this->createOrder([
            'order_number'        => 'ORD-RESTOCK-001',
            'master_order_number' => 'ORD-RESTOCK-001',
            'user_id'             => $this->customer->id,
            'shop_id'             => $this->shop->id,
            'customer_name'       => 'Budi Customer',
            'customer_email'      => 'customer@pasaria.id',
            'payment_method'      => 'qris',
            'subtotal'            => 600000.00,
            'tax'                 => 66000.00,
            'shipping_cost'       => 15000.00,
            'total'               => 681000.00,
            'status'              => 'pending_payment',
        ]);

        OrderItem::create([
            'order_id'     => $order->id,
            'shop_id'      => $this->shop->id,
            'product_id'   => $this->product->id,
            'product_name' => $this->product->name,
            'product_slug' => $this->product->slug,
            'price'        => 200000.00,
            'quantity'     => 3,
            'subtotal'     => 600000.00,
        ]);

        // Simulate checkout stock reduction
        $this->product->decrement('stock', 3);
        $this->assertEquals(7, $this->product->fresh()->stock);

        // Cancel order: stock must be restored by 3
        $resp1 = $this->actingAs($this->customer, 'sanctum')->postJson("/api/orders/{$order->id}/cancel");
        $resp1->assertStatus(200);

        $this->product->refresh();
        $this->assertEquals(10, $this->product->stock);

        // Cancel again (idempotent replay): stock MUST NOT increase to 13
        $resp2 = $this->actingAs($this->customer, 'sanctum')->postJson("/api/orders/{$order->id}/cancel");
        $resp2->assertStatus(200);
        $this->assertTrue((bool) $resp2->json('idempotent'));

        $this->product->refresh();
        $this->assertEquals(10, $this->product->stock);
    }

    /**
     * 4. Pembatalan order yang sudah dibayar memicu refund otomatis.
     */
    public function test_cancellation_of_paid_order_initiates_refund(): void
    {
        $order = $this->createOrder([
            'order_number'        => 'ORD-PAID-CANCEL-001',
            'master_order_number' => 'ORD-PAID-CANCEL-001',
            'user_id'             => $this->customer->id,
            'shop_id'             => $this->shop->id,
            'customer_name'       => 'Budi Customer',
            'customer_email'      => 'customer@pasaria.id',
            'payment_method'      => 'qris',
            'subtotal'            => 200000.00,
            'tax'                 => 22000.00,
            'shipping_cost'       => 15000.00,
            'total'               => 237000.00,
            'status'              => 'paid',
        ]);

        Payment::create([
            'order_id'       => $order->id,
            'user_id'        => $this->customer->id,
            'transaction_id' => 'TXN-PAID-CANCEL-001',
            'payment_method' => 'qris',
            'amount'         => 237000.00,
            'currency'       => 'IDR',
            'provider'       => 'sandbox',
            'status'         => 'paid',
            'paid_at'        => now(),
        ]);

        $response = $this->actingAs($this->customer, 'sanctum')->postJson("/api/orders/{$order->id}/cancel", [
            'reason' => 'Ingin mengganti warna produk',
        ]);

        $response->assertStatus(200);

        $order->refresh();
        $this->assertEquals('cancelled', $order->status);
        $this->assertEquals('completed', $order->refund_status);
        $this->assertEquals(237000.00, (float) $order->refund_amount);

        // Refund record exists
        $refund = Refund::where('order_id', $order->id)->first();
        $this->assertNotNull($refund);
        $this->assertEquals('completed', $refund->status);
        $this->assertEquals(237000.00, (float) $refund->amount);
    }

    /**
     * 5. Retur item dengan kuantitas valid vs tidak valid.
     */
    public function test_item_level_return_validates_quantity_strictly(): void
    {
        $order = $this->createOrder([
            'order_number'        => 'ORD-RETURN-QTY-001',
            'master_order_number' => 'ORD-RETURN-QTY-001',
            'user_id'             => $this->customer->id,
            'shop_id'             => $this->shop->id,
            'customer_name'       => 'Budi Customer',
            'customer_email'      => 'customer@pasaria.id',
            'payment_method'      => 'qris',
            'subtotal'            => 400000.00,
            'tax'                 => 44000.00,
            'shipping_cost'       => 15000.00,
            'total'               => 459000.00,
            'status'              => 'delivered',
        ]);

        $item = OrderItem::create([
            'order_id'     => $order->id,
            'shop_id'      => $this->shop->id,
            'product_id'   => $this->product->id,
            'product_name' => $this->product->name,
            'product_slug' => $this->product->slug,
            'price'        => 200000.00,
            'quantity'     => 2, // Purchased 2 units
            'subtotal'     => 400000.00,
        ]);

        // A. Invalid quantity: 0 or negative
        $respZero = $this->actingAs($this->customer, 'sanctum')->postJson('/api/returns', [
            'order_id'      => $order->id,
            'order_item_id' => $item->id,
            'quantity'      => 0,
            'reason'        => 'damaged',
            'description'   => 'Barang rusak saat diterima di tempat',
        ]);
        $respZero->assertStatus(422);

        // B. Invalid quantity: exceeds purchased (requested 3 when only purchased 2)
        $respExcess = $this->actingAs($this->customer, 'sanctum')->postJson('/api/returns', [
            'order_id'      => $order->id,
            'order_item_id' => $item->id,
            'quantity'      => 3,
            'reason'        => 'damaged',
            'description'   => 'Barang rusak saat diterima di tempat',
        ]);
        $respExcess->assertStatus(422);

        // C. Valid partial return: 1 unit out of 2
        $respValid = $this->actingAs($this->customer, 'sanctum')->postJson('/api/returns', [
            'order_id'      => $order->id,
            'order_item_id' => $item->id,
            'quantity'      => 1,
            'reason'        => 'damaged',
            'description'   => 'Salah satu sepatu robek pada bagian sol',
        ]);
        $respValid->assertStatus(201);

        $return = OrderReturn::where('order_id', $order->id)->first();
        $this->assertNotNull($return);
        $this->assertEquals(1, $return->quantity);
        $this->assertEquals(200000.00, (float) $return->requested_amount);
    }

    /**
     * 6. Retur dari order yang tidak dimiliki pengguna ditolak (HTTP 403 BOLA).
     */
    public function test_return_from_unauthorized_user_is_forbidden(): void
    {
        $order = $this->createOrder([
            'order_number'        => 'ORD-IDOR-RET-001',
            'master_order_number' => 'ORD-IDOR-RET-001',
            'user_id'             => $this->customer->id, // Owned by Budi
            'shop_id'             => $this->shop->id,
            'customer_name'       => 'Budi Customer',
            'customer_email'      => 'customer@pasaria.id',
            'payment_method'      => 'qris',
            'subtotal'            => 200000.00,
            'tax'                 => 22000.00,
            'shipping_cost'       => 15000.00,
            'total'               => 237000.00,
            'status'              => 'delivered',
        ]);

        // Siti attempts to submit return for Budi's order
        $response = $this->actingAs($this->otherCustomer, 'sanctum')->postJson('/api/returns', [
            'order_id'    => $order->id,
            'reason'      => 'wrong_item',
            'description' => 'Mencoba mengajukan retur atas pesanan orang lain',
        ]);

        $response->assertStatus(403);
    }

    /**
     * 7. Refund melebihi jumlah pembayaran ditolak (HTTP 422).
     */
    public function test_refund_exceeding_paid_amount_is_rejected(): void
    {
        $order = $this->createOrder([
            'order_number'        => 'ORD-REF-LIMIT-001',
            'master_order_number' => 'ORD-REF-LIMIT-001',
            'user_id'             => $this->customer->id,
            'shop_id'             => $this->shop->id,
            'customer_name'       => 'Budi Customer',
            'customer_email'      => 'customer@pasaria.id',
            'payment_method'      => 'qris',
            'subtotal'            => 100000.00,
            'tax'                 => 11000.00,
            'shipping_cost'       => 15000.00,
            'total'               => 126000.00,
            'status'              => 'delivered',
        ]);

        Payment::create([
            'order_id'       => $order->id,
            'user_id'        => $this->customer->id,
            'transaction_id' => 'TXN-REF-LIMIT-001',
            'payment_method' => 'qris',
            'amount'         => 126000.00,
            'currency'       => 'IDR',
            'provider'       => 'sandbox',
            'status'         => 'paid',
            'paid_at'        => now(),
        ]);

        $this->expectException(\InvalidArgumentException::class);
        $this->refundService->processRefund(
            $order,
            500000.00, // Exceeds paid amount 126,000
            'Kelebihan nominal refund'
        );
    }

    /**
     * 8. Refund berulang pada pengajuan retur yang sama adalah idempoten.
     */
    public function test_duplicate_refund_is_idempotent(): void
    {
        $order = $this->createOrder([
            'order_number'        => 'ORD-DUP-REF-001',
            'master_order_number' => 'ORD-DUP-REF-001',
            'user_id'             => $this->customer->id,
            'shop_id'             => $this->shop->id,
            'customer_name'       => 'Budi Customer',
            'customer_email'      => 'customer@pasaria.id',
            'payment_method'      => 'qris',
            'subtotal'            => 100000.00,
            'tax'                 => 11000.00,
            'shipping_cost'       => 15000.00,
            'total'               => 126000.00,
            'status'              => 'return_requested',
        ]);

        Payment::create([
            'order_id'       => $order->id,
            'user_id'        => $this->customer->id,
            'transaction_id' => 'TXN-DUP-REF-001',
            'payment_method' => 'qris',
            'amount'         => 126000.00,
            'currency'       => 'IDR',
            'provider'       => 'sandbox',
            'status'         => 'paid',
            'paid_at'        => now(),
        ]);

        $return = OrderReturn::create([
            'order_id'         => $order->id,
            'user_id'          => $this->customer->id,
            'shop_id'          => $this->shop->id,
            'status'           => 'requested',
            'reason'           => 'damaged',
            'description'      => 'Barang cacat pabrik',
            'requested_amount' => 126000.00,
            'refund_amount'    => 0.00,
        ]);

        // First refund call: processes successfully
        $refund1 = $this->refundService->processRefund($order, 126000.00, 'Retur disetujui', $return, $this->admin);
        $this->assertEquals('completed', $refund1->status);

        // Second refund call on same return: returns existing completed refund without duplicating
        $refund2 = $this->refundService->processRefund($order, 126000.00, 'Retur disetujui', $return, $this->admin);
        $this->assertEquals($refund1->id, $refund2->id);

        $totalCompletedRefunds = Refund::where('order_id', $order->id)->where('status', 'completed')->count();
        $this->assertEquals(1, $totalCompletedRefunds);
    }

    /**
     * 9. Kegagalan provider dicatat dan status transaksi tetap aman.
     */
    public function test_provider_refund_failure_marks_status_and_retains_integrity(): void
    {
        $order = $this->createOrder([
            'order_number'        => 'ORD-GW-FAIL-001',
            'master_order_number' => 'ORD-GW-FAIL-001',
            'user_id'             => $this->customer->id,
            'shop_id'             => $this->shop->id,
            'customer_name'       => 'Budi Customer',
            'customer_email'      => 'customer@pasaria.id',
            'payment_method'      => 'qris',
            'subtotal'            => 100000.00,
            'tax'                 => 11000.00,
            'shipping_cost'       => 15000.00,
            'total'               => 126000.00,
            'status'              => 'return_requested',
        ]);

        Payment::create([
            'order_id'       => $order->id,
            'user_id'        => $this->customer->id,
            'transaction_id' => 'TXN-GW-FAIL-001',
            'payment_method' => 'qris',
            'amount'         => 126000.00,
            'currency'       => 'IDR',
            'provider'       => 'sandbox',
            'status'         => 'paid',
            'paid_at'        => now(),
        ]);

        $this->expectException(\RuntimeException::class);

        // Simulate gateway rejection
        $this->refundService->processRefund(
            $order,
            126000.00,
            'Refund ditolak gateway',
            null,
            $this->admin,
            ['simulate_failure' => true]
        );

        $failedRefund = Refund::where('order_id', $order->id)->where('status', 'failed')->first();
        $this->assertNotNull($failedRefund);
    }

    /**
     * 10. Akses seller ke order seller lain ditolak (HTTP 403 Cross-shop isolation).
     */
    public function test_cross_shop_seller_access_is_forbidden(): void
    {
        // Order belongs to Toko Hendro
        $order = $this->createOrder([
            'order_number'        => 'ORD-HENDRO-001',
            'master_order_number' => 'ORD-HENDRO-001',
            'user_id'             => $this->customer->id,
            'shop_id'             => $this->shop->id,
            'customer_name'       => 'Budi Customer',
            'customer_email'      => 'customer@pasaria.id',
            'payment_method'      => 'qris',
            'subtotal'            => 200000.00,
            'tax'                 => 22000.00,
            'shipping_cost'       => 15000.00,
            'total'               => 237000.00,
            'status'              => 'paid',
        ]);

        // Rudi (otherSeller) attempts to update status of Hendro's order
        $statusResp = $this->actingAs($this->otherSeller, 'sanctum')->putJson("/api/orders/{$order->id}/status", [
            'status' => 'processing',
        ]);
        $statusResp->assertStatus(403);

        // Return on Hendro's order
        $return = OrderReturn::create([
            'order_id'         => $order->id,
            'user_id'          => $this->customer->id,
            'shop_id'          => $this->shop->id,
            'status'           => 'requested',
            'reason'           => 'damaged',
            'description'      => 'Barang pecah',
            'requested_amount' => 237000.00,
            'refund_amount'    => 0.00,
        ]);

        // Rudi attempts to respond to Hendro's return
        $respondResp = $this->actingAs($this->otherSeller, 'sanctum')->postJson("/api/returns/{$return->id}/respond", [
            'decision' => 'approved',
        ]);
        $respondResp->assertStatus(403);
    }

    /**
     * 11. Pencatatan audit untuk keputusan admin/support dalam penyelesaian dispute.
     */
    public function test_admin_dispute_resolution_records_audit_trail_and_executes_refund(): void
    {
        $order = $this->createOrder([
            'order_number'        => 'ORD-DISPUTE-001',
            'master_order_number' => 'ORD-DISPUTE-001',
            'user_id'             => $this->customer->id,
            'shop_id'             => $this->shop->id,
            'customer_name'       => 'Budi Customer',
            'customer_email'      => 'customer@pasaria.id',
            'payment_method'      => 'qris',
            'subtotal'            => 200000.00,
            'tax'                 => 22000.00,
            'shipping_cost'       => 15000.00,
            'total'               => 237000.00,
            'status'              => 'return_requested',
        ]);

        Payment::create([
            'order_id'       => $order->id,
            'user_id'        => $this->customer->id,
            'transaction_id' => 'TXN-DISPUTE-001',
            'payment_method' => 'qris',
            'amount'         => 237000.00,
            'currency'       => 'IDR',
            'provider'       => 'sandbox',
            'status'         => 'paid',
            'paid_at'        => now(),
        ]);

        $return = OrderReturn::create([
            'order_id'         => $order->id,
            'user_id'          => $this->customer->id,
            'shop_id'          => $this->shop->id,
            'status'           => 'disputed',
            'reason'           => 'wrong_item',
            'description'      => 'Warna sepatu tidak sesuai deskripsi',
            'requested_amount' => 237000.00,
            'refund_amount'    => 0.00,
        ]);

        $dispute = Dispute::create([
            'return_id' => $return->id,
            'order_id'  => $order->id,
            'user_id'   => $this->customer->id,
            'shop_id'   => $this->shop->id,
            'status'    => 'open',
        ]);

        // Admin resolves dispute with refund_buyer
        $response = $this->actingAs($this->admin, 'sanctum')->postJson("/api/disputes/{$dispute->id}/resolve", [
            'resolution'      => 'refund_buyer',
            'resolution_note' => 'Bukti foto kemasan menunjukkan barang salah kirim.',
        ]);

        $response->assertStatus(200);

        $dispute->refresh();
        $return->refresh();
        $order->refresh();

        $this->assertEquals('resolved', $dispute->status);
        $this->assertEquals('refunded', $return->status);
        $this->assertEquals('refunded', $order->status);

        // Verify AdminAction audit log was recorded
        $action = AdminAction::where('action', 'resolve_dispute')
            ->where('target_id', $dispute->id)
            ->first();

        $this->assertNotNull($action);
        $this->assertEquals($this->admin->id, $action->user_id);
        $this->assertEquals('dispute', $action->target_type);
    }

    /**
     * 12. Refund pesanan yang sudah completed menarik kembali saldo seller (clawback).
     */
    public function test_completed_order_refund_claws_back_seller_ledger_and_sales(): void
    {
        $wallet = Wallet::create([
            'user_id'          => $this->seller->id,
            'shop_id'          => $this->shop->id,
            'balance'          => 0.00,
            'reserved_balance' => 0.00,
        ]);

        $order = $this->createOrder([
            'order_number'        => 'ORD-CLAWBACK-001',
            'master_order_number' => 'ORD-CLAWBACK-001',
            'user_id'             => $this->customer->id,
            'shop_id'             => $this->shop->id,
            'customer_name'       => 'Budi Customer',
            'customer_email'      => 'customer@pasaria.id',
            'payment_method'      => 'qris',
            'subtotal'            => 200000.00,
            'tax'                 => 22000.00,
            'shipping_cost'       => 15000.00,
            'total'               => 237000.00,
            'status'              => 'completed',
        ]);

        Payment::create([
            'order_id'       => $order->id,
            'user_id'        => $this->customer->id,
            'transaction_id' => 'TXN-CLAWBACK-001',
            'payment_method' => 'qris',
            'amount'         => 237000.00,
            'currency'       => 'IDR',
            'provider'       => 'sandbox',
            'status'         => 'paid',
            'paid_at'        => now(),
        ]);

        // Credit sale: 200,000 subtotal - 5% fee (10,000) = 190,000 net
        $this->ledgerService->creditSale($order);
        $wallet->refresh();
        $this->assertEquals(190000.00, (float) $wallet->balance);

        // Full refund is issued: claws back 190,000 net earnings
        $this->refundService->processRefund($order, 237000.00, 'Barang rusak terbukti cacat', null, $this->admin);

        $wallet->refresh();
        $this->assertEquals(0.00, (float) $wallet->balance);

        // Debit transaction recorded in ledger
        $debitTxn = WalletTransaction::where('wallet_id', $wallet->id)
            ->where('reference_type', 'refund')
            ->where('type', 'debit')
            ->first();

        $this->assertNotNull($debitTxn);
        $this->assertEquals(190000.00, (float) $debitTxn->amount);
    }
}
