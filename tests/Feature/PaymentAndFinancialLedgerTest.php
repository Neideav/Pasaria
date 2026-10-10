<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Shop;
use App\Models\Product;
use App\Models\Order;
use App\Models\Payment;
use App\Models\PaymentEvent;
use App\Models\SellerPayout;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use App\Services\Payment\SandboxPaymentGateway;
use App\Services\LedgerService;
use App\Exceptions\PaymentConfigurationException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class PaymentAndFinancialLedgerTest extends TestCase
{
    use RefreshDatabase;

    protected User $customer;
    protected User $seller;
    protected User $admin;
    protected Shop $shop;
    protected Product $product;
    protected SandboxPaymentGateway $sandboxGateway;
    protected LedgerService $ledgerService;

    protected function setUp(): void
    {
        parent::setUp();

        $this->sandboxGateway = new SandboxPaymentGateway();
        $this->ledgerService = new LedgerService();

        $this->customer = User::create([
            'name'              => 'Budi Customer',
            'username'          => 'budicustomer',
            'email'             => 'customer@pasaria.id',
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

        $this->admin = User::create([
            'name'              => 'Admin Pasaria',
            'username'          => 'adminpasaria',
            'email'             => 'admin@pasaria.id',
            'password'          => Hash::make('password123'),
            'role'              => 'admin',
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

        $this->product = Product::create([
            'shop_id'     => $this->shop->id,
            'name'        => 'Kemeja Katun Premium',
            'slug'        => 'kemeja-katun-premium',
            'category'    => 'Fashion',
            'category_id' => 1,
            'price'       => 100000.00,
            'stock'       => 20,
            'image'       => 'kemeja-katun-premium',
            'shop_name'   => $this->shop->name,
            'shop_city'   => $this->shop->city,
            'is_active'   => true,
        ]);
    }

    /**
     * 1. Checkout baru berstatus belum dibayar (pending_payment, payment pending, paid_at null).
     */
    public function test_new_checkout_order_has_unpaid_status_and_pending_payment(): void
    {
        $response = $this->actingAs($this->customer, 'sanctum')->postJson('/api/orders', [
            'customer_name'    => 'Budi Customer',
            'customer_email'   => 'customer@pasaria.id',
            'customer_phone'   => '081234567890',
            'shipping_address' => 'Jl. Sudirman No. 1, Jakarta Pusat',
            'payment_method'   => 'qris',
            'items'            => [
                [
                    'product_id' => $this->product->id,
                    'quantity'   => 1,
                ],
            ],
        ]);

        $response->assertStatus(201);
        $orderNumber = $response->json('order_number');
        $this->assertNotNull($orderNumber);

        $order = Order::where('order_number', $orderNumber)->first();
        $this->assertNotNull($order);
        $this->assertEquals('pending_payment', $order->status);

        $payment = Payment::where('order_id', $order->id)->first();
        $this->assertNotNull($payment);
        $this->assertEquals('pending', $payment->status);
        $this->assertNull($payment->paid_at);
        $this->assertEquals('IDR', $payment->currency);
        $this->assertEquals((float) $order->total, (float) $payment->amount);
    }

    /**
     * 2. Callback invalid (pesanan tidak ditemukan) tidak mengubah status pesanan yang ada.
     */
    public function test_invalid_webhook_callback_does_not_change_order_status(): void
    {
        $order = Order::create([
            'order_number'        => 'PAS-TEST-001',
            'master_order_number' => 'PAS-TEST-001',
            'user_id'             => $this->customer->id,
            'shop_id'             => $this->shop->id,
            'customer_name'       => 'Budi Customer',
            'customer_email'      => 'customer@pasaria.id',
            'customer_phone'      => '081234567890',
            'shipping_address'    => 'Jl. Sudirman No. 1',
            'payment_method'      => 'qris',
            'subtotal'            => 100000.00,
            'tax'                 => 11000.00,
            'shipping_cost'       => 15000.00,
            'total'               => 126000.00,
            'status'              => 'pending_payment',
        ]);

        Payment::create([
            'order_id'       => $order->id,
            'user_id'        => $this->customer->id,
            'transaction_id' => 'TXN-TEST-001',
            'payment_method' => 'qris',
            'amount'         => 126000.00,
            'currency'       => 'IDR',
            'provider'       => 'sandbox',
            'status'         => 'pending',
        ]);

        // Callback with nonexistent order number
        $nonexistentOrderNumber = 'PAS-NONEXISTENT-999';
        $signature = $this->sandboxGateway->generateSignature($nonexistentOrderNumber, 126000.00, 'paid');

        $response = $this->postJson('/api/payments/webhook/sandbox', [
            'event_id'       => 'evt_test_001',
            'order_number'   => $nonexistentOrderNumber,
            'transaction_id' => 'TXN-MOCK-999',
            'amount'         => 126000.00,
            'currency'       => 'IDR',
            'status'         => 'paid',
            'signature'      => $signature,
        ]);

        $response->assertStatus(404);

        // Original order remains pending_payment
        $order->refresh();
        $this->assertEquals('pending_payment', $order->status);
    }

    /**
     * 3. Signature salah ditolak (HTTP 401) dan tidak mengubah status order.
     */
    public function test_invalid_signature_is_rejected(): void
    {
        $order = Order::create([
            'order_number'        => 'PAS-TEST-002',
            'master_order_number' => 'PAS-TEST-002',
            'user_id'             => $this->customer->id,
            'shop_id'             => $this->shop->id,
            'customer_name'       => 'Budi Customer',
            'customer_email'      => 'customer@pasaria.id',
            'customer_phone'      => '081234567890',
            'shipping_address'    => 'Jl. Sudirman No. 1',
            'payment_method'      => 'qris',
            'subtotal'            => 100000.00,
            'tax'                 => 11000.00,
            'shipping_cost'       => 15000.00,
            'total'               => 126000.00,
            'status'              => 'pending_payment',
        ]);

        Payment::create([
            'order_id'       => $order->id,
            'user_id'        => $this->customer->id,
            'transaction_id' => 'TXN-TEST-002',
            'payment_method' => 'qris',
            'amount'         => 126000.00,
            'currency'       => 'IDR',
            'provider'       => 'sandbox',
            'status'         => 'pending',
        ]);

        $response = $this->postJson('/api/payments/webhook/sandbox', [
            'event_id'       => 'evt_tampered_002',
            'order_number'   => 'PAS-TEST-002',
            'transaction_id' => 'TXN-TEST-002',
            'amount'         => 126000.00,
            'currency'       => 'IDR',
            'status'         => 'paid',
            'signature'      => 'invalid_tampered_signature_hex_value',
        ]);

        $response->assertStatus(401);

        $order->refresh();
        $this->assertEquals('pending_payment', $order->status);

        $event = PaymentEvent::where('event_type', 'unauthorized_signature')->first();
        $this->assertNotNull($event);
        $this->assertEquals('rejected', $event->status);
    }

    /**
     * 4. Payment sukses yang terverifikasi diproses satu kali dan mengubah status menjadi paid.
     */
    public function test_verified_successful_payment_callback_processed_once(): void
    {
        $order = Order::create([
            'order_number'        => 'PAS-TEST-003',
            'master_order_number' => 'PAS-TEST-003',
            'user_id'             => $this->customer->id,
            'shop_id'             => $this->shop->id,
            'customer_name'       => 'Budi Customer',
            'customer_email'      => 'customer@pasaria.id',
            'customer_phone'      => '081234567890',
            'shipping_address'    => 'Jl. Sudirman No. 1',
            'payment_method'      => 'qris',
            'subtotal'            => 100000.00,
            'tax'                 => 11000.00,
            'shipping_cost'       => 15000.00,
            'total'               => 126000.00,
            'status'              => 'pending_payment',
        ]);

        $payment = Payment::create([
            'order_id'       => $order->id,
            'user_id'        => $this->customer->id,
            'transaction_id' => 'TXN-TEST-003',
            'payment_method' => 'qris',
            'amount'         => 126000.00,
            'currency'       => 'IDR',
            'provider'       => 'sandbox',
            'status'         => 'pending',
        ]);

        $signature = $this->sandboxGateway->generateSignature('PAS-TEST-003', 126000.00, 'paid');

        $response = $this->postJson('/api/payments/webhook/sandbox', [
            'event_id'       => 'evt_success_003',
            'order_number'   => 'PAS-TEST-003',
            'transaction_id' => 'GW-MOCK-TXN-003',
            'amount'         => 126000.00,
            'currency'       => 'IDR',
            'status'         => 'paid',
            'signature'      => $signature,
        ]);

        $response->assertStatus(200);

        $order->refresh();
        $payment->refresh();

        $this->assertEquals('paid', $order->status);
        $this->assertEquals('paid', $payment->status);
        $this->assertNotNull($payment->paid_at);
        $this->assertEquals('GW-MOCK-TXN-003', $payment->provider_reference);
    }

    /**
     * 5. Callback duplikat (idempotent replay) mengembalikan HTTP 200 tanpa pemrosesan ganda.
     */
    public function test_duplicate_callback_is_idempotent_and_does_not_reprocess(): void
    {
        $order = Order::create([
            'order_number'        => 'PAS-TEST-004',
            'master_order_number' => 'PAS-TEST-004',
            'user_id'             => $this->customer->id,
            'shop_id'             => $this->shop->id,
            'customer_name'       => 'Budi Customer',
            'customer_email'      => 'customer@pasaria.id',
            'customer_phone'      => '081234567890',
            'shipping_address'    => 'Jl. Sudirman No. 1',
            'payment_method'      => 'qris',
            'subtotal'            => 100000.00,
            'tax'                 => 11000.00,
            'shipping_cost'       => 15000.00,
            'total'               => 126000.00,
            'status'              => 'pending_payment',
        ]);

        Payment::create([
            'order_id'       => $order->id,
            'user_id'        => $this->customer->id,
            'transaction_id' => 'TXN-TEST-004',
            'payment_method' => 'qris',
            'amount'         => 126000.00,
            'currency'       => 'IDR',
            'provider'       => 'sandbox',
            'status'         => 'pending',
        ]);

        $signature = $this->sandboxGateway->generateSignature('PAS-TEST-004', 126000.00, 'paid');
        $payload = [
            'event_id'       => 'evt_duplicate_004',
            'order_number'   => 'PAS-TEST-004',
            'transaction_id' => 'GW-MOCK-TXN-004',
            'amount'         => 126000.00,
            'currency'       => 'IDR',
            'status'         => 'paid',
            'signature'      => $signature,
        ];

        // First call: successfully processed
        $resp1 = $this->postJson('/api/payments/webhook/sandbox', $payload);
        $resp1->assertStatus(200);

        // Second call: exact same payload and event_id
        $resp2 = $this->postJson('/api/payments/webhook/sandbox', $payload);
        $resp2->assertStatus(200);
        $this->assertTrue((bool) $resp2->json('idempotent'));

        // Processed event recorded only once in audit log
        $processedCount = PaymentEvent::where('event_id', 'evt_duplicate_004')->where('status', 'processed')->count();
        $this->assertEquals(1, $processedCount);
    }

    /**
     * 6. Jumlah atau currency yang tidak cocok ditolak (HTTP 422).
     */
    public function test_mismatched_amount_or_currency_rejected(): void
    {
        $order = Order::create([
            'order_number'        => 'PAS-TEST-005',
            'master_order_number' => 'PAS-TEST-005',
            'user_id'             => $this->customer->id,
            'shop_id'             => $this->shop->id,
            'customer_name'       => 'Budi Customer',
            'customer_email'      => 'customer@pasaria.id',
            'customer_phone'      => '081234567890',
            'shipping_address'    => 'Jl. Sudirman No. 1',
            'payment_method'      => 'qris',
            'subtotal'            => 100000.00,
            'tax'                 => 11000.00,
            'shipping_cost'       => 15000.00,
            'total'               => 126000.00,
            'status'              => 'pending_payment',
        ]);

        Payment::create([
            'order_id'       => $order->id,
            'user_id'        => $this->customer->id,
            'transaction_id' => 'TXN-TEST-005',
            'payment_method' => 'qris',
            'amount'         => 126000.00,
            'currency'       => 'IDR',
            'provider'       => 'sandbox',
            'status'         => 'pending',
        ]);

        // A. Amount mismatch: actual 126000 vs received 99000
        $sigWrongAmount = $this->sandboxGateway->generateSignature('PAS-TEST-005', 99000.00, 'paid');
        $respAmountMismatch = $this->postJson('/api/payments/webhook/sandbox', [
            'event_id'       => 'evt_mismatch_amount_005',
            'order_number'   => 'PAS-TEST-005',
            'transaction_id' => 'GW-MOCK-TXN-005',
            'amount'         => 99000.00,
            'currency'       => 'IDR',
            'status'         => 'paid',
            'signature'      => $sigWrongAmount,
        ]);
        $respAmountMismatch->assertStatus(422);

        // B. Currency mismatch: USD instead of IDR
        $sigWrongCurrency = $this->sandboxGateway->generateSignature('PAS-TEST-005', 126000.00, 'paid');
        $respCurrencyMismatch = $this->postJson('/api/payments/webhook/sandbox', [
            'event_id'       => 'evt_mismatch_curr_005',
            'order_number'   => 'PAS-TEST-005',
            'transaction_id' => 'GW-MOCK-TXN-005',
            'amount'         => 126000.00,
            'currency'       => 'USD',
            'status'         => 'paid',
            'signature'      => $sigWrongCurrency,
        ]);
        $respCurrencyMismatch->assertStatus(422);

        // Order remains pending_payment
        $order->refresh();
        $this->assertEquals('pending_payment', $order->status);
    }

    /**
     * 7. Saldo seller dikreditkan tepat satu kali saat pesanan selesai (5% komisi dipotong).
     */
    public function test_seller_balance_credited_exactly_once_on_order_completed(): void
    {
        $order = Order::create([
            'order_number'        => 'PAS-TEST-006',
            'master_order_number' => 'PAS-TEST-006',
            'user_id'             => $this->customer->id,
            'shop_id'             => $this->shop->id,
            'customer_name'       => 'Budi Customer',
            'customer_email'      => 'customer@pasaria.id',
            'customer_phone'      => '081234567890',
            'shipping_address'    => 'Jl. Sudirman No. 1',
            'payment_method'      => 'qris',
            'subtotal'            => 100000.00,
            'tax'                 => 11000.00,
            'shipping_cost'       => 15000.00,
            'total'               => 126000.00,
            'status'              => 'delivered',
        ]);

        // Seller moves order to completed via updateStatus
        $response = $this->actingAs($this->seller, 'sanctum')->putJson("/api/orders/{$order->id}/status", [
            'status' => 'completed',
        ]);
        $response->assertStatus(200);

        $wallet = Wallet::where('shop_id', $this->shop->id)->first();
        $this->assertNotNull($wallet);

        // Subtotal = 100,000. Platform fee (5%) = 5,000. Net earnings = 95,000.
        $this->assertEquals(95000.00, (float) $wallet->balance);
        $this->assertEquals(95000.00, (float) $wallet->available_balance);

        // Attempt second credit directly via LedgerService to verify idempotency guard
        $duplicateTxn = $this->ledgerService->creditSale($order);
        $this->assertNull($duplicateTxn);

        $wallet->refresh();
        $this->assertEquals(95000.00, (float) $wallet->balance);

        // Exactly one credit transaction exists in ledger
        $creditCount = WalletTransaction::where('wallet_id', $wallet->id)
            ->where('reference_type', 'order')
            ->where('reference_id', 'PAS-TEST-006')
            ->count();
        $this->assertEquals(1, $creditCount);
    }

    /**
     * 8. Payout melebihi saldo tersedia ditolak (HTTP 422).
     */
    public function test_payout_exceeding_available_balance_rejected(): void
    {
        $wallet = Wallet::create([
            'user_id'          => $this->seller->id,
            'shop_id'          => $this->shop->id,
            'balance'          => 50000.00,
            'reserved_balance' => 0.00,
        ]);

        // Attempting to withdraw Rp 70,000 when only Rp 50,000 is available
        $response = $this->actingAs($this->seller, 'sanctum')->postJson('/api/seller/payout', [
            'amount'         => 70000.00,
            'bank_name'      => 'BCA',
            'account_number' => '1234567890',
            'account_holder' => 'Hendro Wijaya',
        ]);

        $response->assertStatus(422);

        $wallet->refresh();
        $this->assertEquals(50000.00, (float) $wallet->balance);
        $this->assertEquals(0.00, (float) $wallet->reserved_balance);
        $this->assertEquals(50000.00, (float) $wallet->available_balance);

        $this->assertEquals(0, SellerPayout::where('shop_id', $this->shop->id)->count());
    }

    /**
     * 9. Dana payout pending direservasi tanpa menghancurkan saldo dasar.
     */
    public function test_pending_payout_reserves_funds_without_destroying_base_balance(): void
    {
        $wallet = Wallet::create([
            'user_id'          => $this->seller->id,
            'shop_id'          => $this->shop->id,
            'balance'          => 100000.00,
            'reserved_balance' => 0.00,
        ]);

        $response = $this->actingAs($this->seller, 'sanctum')->postJson('/api/seller/payout', [
            'amount'         => 40000.00,
            'bank_name'      => 'BCA',
            'account_number' => '1234567890',
            'account_holder' => 'Hendro Wijaya',
        ]);

        $response->assertStatus(201);

        $wallet->refresh();
        $this->assertEquals(100000.00, (float) $wallet->balance);
        $this->assertEquals(40000.00, (float) $wallet->reserved_balance);
        $this->assertEquals(60000.00, (float) $wallet->available_balance);

        $payout = SellerPayout::where('shop_id', $this->shop->id)->first();
        $this->assertNotNull($payout);
        $this->assertEquals('pending', $payout->status);
        $this->assertEquals(40000.00, (float) $payout->amount);
    }

    /**
     * 10. Payout ditolak/gagal melepaskan reservasi; payout disetujui memfinalisasi debit.
     */
    public function test_rejected_payout_releases_reservation_and_approved_payout_finalizes_debit(): void
    {
        $wallet = Wallet::create([
            'user_id'          => $this->seller->id,
            'shop_id'          => $this->shop->id,
            'balance'          => 100000.00,
            'reserved_balance' => 0.00,
        ]);

        WalletTransaction::create([
            'wallet_id'      => $wallet->id,
            'type'           => 'credit',
            'amount'         => 100000.00,
            'balance_after'  => 100000.00,
            'reference_type' => 'deposit',
            'reference_id'   => 'INIT-100K',
            'description'    => 'Modal awal toko',
        ]);

        // A. Seller requests payout of 30,000
        $this->actingAs($this->seller, 'sanctum')->postJson('/api/seller/payout', [
            'amount'         => 30000.00,
            'bank_name'      => 'BCA',
            'account_number' => '1234567890',
            'account_holder' => 'Hendro Wijaya',
        ]);

        $payout1 = SellerPayout::where('shop_id', $this->shop->id)->first();
        $this->assertNotNull($payout1);

        // Admin rejects payout1
        $rejectResp = $this->actingAs($this->admin, 'sanctum')->postJson("/api/admin/payouts/{$payout1->id}/reject", [
            'reason' => 'Nomor rekening tidak sesuai dengan nama pemilik toko',
        ]);
        $rejectResp->assertStatus(200);

        $payout1->refresh();
        $wallet->refresh();

        $this->assertEquals('rejected', $payout1->status);
        $this->assertEquals('Nomor rekening tidak sesuai dengan nama pemilik toko', $payout1->failure_reason);
        // Reservation is fully released back to available balance
        $this->assertEquals(0.00, (float) $wallet->reserved_balance);
        $this->assertEquals(100000.00, (float) $wallet->balance);
        $this->assertEquals(100000.00, (float) $wallet->available_balance);

        // B. Seller requests new payout of 50,000 and Admin approves
        $this->actingAs($this->seller, 'sanctum')->postJson('/api/seller/payout', [
            'amount'         => 50000.00,
            'bank_name'      => 'Mandiri',
            'account_number' => '9876543210',
            'account_holder' => 'Hendro Wijaya',
        ]);

        $payout2 = SellerPayout::where('shop_id', $this->shop->id)->where('status', 'pending')->first();
        $this->assertNotNull($payout2);

        $approveResp = $this->actingAs($this->admin, 'sanctum')->postJson("/api/admin/payouts/{$payout2->id}/approve");
        $approveResp->assertStatus(200);

        $payout2->refresh();
        $wallet->refresh();

        $this->assertEquals('completed', $payout2->status);
        $this->assertEquals($this->admin->id, $payout2->processed_by);
        // Finalized: balance decremented to 50,000, reserved is 0, total_withdrawn is 50,000
        $this->assertEquals(50000.00, (float) $wallet->balance);
        $this->assertEquals(0.00, (float) $wallet->reserved_balance);
        $this->assertEquals(50000.00, (float) $wallet->available_balance);
        $this->assertEquals(50000.00, (float) $wallet->total_withdrawn);

        // Reconcile ledger matches
        $reconcile = $this->ledgerService->reconcile($wallet);
        $this->assertTrue($reconcile['is_consistent']);
    }

    /**
     * 11. Seller tidak dapat mengubah saldo sendiri atau menyetujui payout sendiri.
     */
    public function test_seller_cannot_tamper_balance_or_approve_own_payout(): void
    {
        $wallet = Wallet::create([
            'user_id'          => $this->seller->id,
            'shop_id'          => $this->shop->id,
            'balance'          => 50000.00,
            'reserved_balance' => 0.00,
        ]);

        // Attempt to tamper with request payout fields
        $tamperResp = $this->actingAs($this->seller, 'sanctum')->postJson('/api/seller/payout', [
            'amount'         => 20000.00,
            'bank_name'      => 'BCA',
            'account_number' => '1234567890',
            'account_holder' => 'Hendro Wijaya',
            'balance'        => 99999999.00, // Injected forbidden field
        ]);
        $tamperResp->assertStatus(422);

        // Seller requests legitimate payout
        $legitResp = $this->actingAs($this->seller, 'sanctum')->postJson('/api/seller/payout', [
            'amount'         => 20000.00,
            'bank_name'      => 'BCA',
            'account_number' => '1234567890',
            'account_holder' => 'Hendro Wijaya',
        ]);
        $legitResp->assertStatus(201);

        $payout = SellerPayout::where('shop_id', $this->shop->id)->first();
        $this->assertNotNull($payout);

        // Seller attempts to call admin approve payout
        $sellerApproveResp = $this->actingAs($this->seller, 'sanctum')->postJson("/api/admin/payouts/{$payout->id}/approve");
        $sellerApproveResp->assertStatus(403);

        // Customer attempts to call admin approve payout
        $customerApproveResp = $this->actingAs($this->customer, 'sanctum')->postJson("/api/admin/payouts/{$payout->id}/approve");
        $customerApproveResp->assertStatus(403);

        // Payout remains pending
        $payout->refresh();
        $this->assertEquals('pending', $payout->status);
    }

    /**
     * 12. Sandbox gateway gagal dengan aman di lingkungan production.
     */
    public function test_sandbox_gateway_fails_safely_in_production_environment(): void
    {
        $order = Order::create([
            'order_number'        => 'PAS-PROD-TEST',
            'master_order_number' => 'PAS-PROD-TEST',
            'user_id'             => $this->customer->id,
            'shop_id'             => $this->shop->id,
            'customer_name'       => 'Budi Customer',
            'customer_email'      => 'customer@pasaria.id',
            'customer_phone'      => '081234567890',
            'shipping_address'    => 'Jl. Sudirman No. 1',
            'payment_method'      => 'qris',
            'subtotal'            => 100000.00,
            'tax'                 => 11000.00,
            'shipping_cost'       => 15000.00,
            'total'               => 126000.00,
            'status'              => 'pending_payment',
        ]);

        $payment = Payment::create([
            'order_id'       => $order->id,
            'user_id'        => $this->customer->id,
            'transaction_id' => 'TXN-PROD-TEST',
            'payment_method' => 'qris',
            'amount'         => 126000.00,
            'currency'       => 'IDR',
            'provider'       => 'sandbox',
            'status'         => 'pending',
        ]);

        // Mock app environment as production
        $originalEnv = app()->environment();
        app()->detectEnvironment(fn() => 'production');

        $this->expectException(PaymentConfigurationException::class);
        try {
            $this->sandboxGateway->createPaymentIntent($order, $payment);
        } finally {
            // Restore original environment
            app()->detectEnvironment(fn() => $originalEnv);
        }
    }
}
