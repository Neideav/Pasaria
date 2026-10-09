<?php

namespace Tests\Feature;

use App\Models\AdminAction;
use App\Models\Category;
use App\Models\Order;
use App\Models\Product;
use App\Models\Shop;
use App\Models\User;
use App\Models\UserAddress;
use App\Models\Wallet;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthenticationAndAccountLifecycleTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();

        Category::create([
            'name' => 'Elektronik',
            'slug' => 'elektronik',
            'item_count' => 10,
            'icon' => 'laptop',
        ]);
    }

    /**
     * 1. Registration creates an unverified account (email_verified_at = null)
     * and issues a verification code without claiming actual email delivery.
     */
    public function test_registration_creates_unverified_account(): void
    {
        $payload = [
            'name'     => 'Andi Wijaya',
            'username' => 'andiwijaya',
            'email'    => 'andi@pasaria.id',
            'password' => 'secret123',
        ];

        $response = $this->postJson('/api/auth/register', $payload);

        $response->assertStatus(201);
        $this->assertTrue($response->json('success'));
        $this->assertNotEmpty($response->json('token'));

        $user = User::where('email', 'andi@pasaria.id')->first();
        $this->assertNotNull($user);
        $this->assertNull($user->email_verified_at, 'User must be unverified upon registration');
        $this->assertEquals('customer', $user->role);
        $this->assertEquals('active', $user->status);

        // Verification code was generated and cached
        $cachedCode = Cache::get("email_verify_code_{$user->id}");
        $this->assertNotEmpty($cachedCode);
        $this->assertEquals(6, strlen($cachedCode));
        $this->assertEquals($cachedCode, $response->json('verification_code'));
    }

    /**
     * 2. Login with valid credentials succeeds; invalid credentials fail with non-enumerating error.
     */
    public function test_login_with_valid_and_invalid_credentials(): void
    {
        $user = User::create([
            'name'              => 'Budi Santoso',
            'username'          => 'budisantoso',
            'email'             => 'budi@pasaria.id',
            'password'          => Hash::make('password123'),
            'role'              => 'customer',
            'status'            => 'active',
            'email_verified_at' => now(),
        ]);

        // Valid login via email
        $validResp = $this->postJson('/api/auth/login', [
            'email'    => 'budi@pasaria.id',
            'password' => 'password123',
        ]);
        $validResp->assertStatus(200);
        $this->assertTrue($validResp->json('success'));
        $this->assertNotEmpty($validResp->json('token'));

        // Valid login via username
        auth()->forgetGuards();
        $validUserResp = $this->postJson('/api/auth/login', [
            'username' => 'budisantoso',
            'password' => 'password123',
        ]);
        $validUserResp->assertStatus(200);
        $this->assertTrue($validUserResp->json('success'));

        // Invalid password
        auth()->forgetGuards();
        $invalidPassResp = $this->postJson('/api/auth/login', [
            'email'    => 'budi@pasaria.id',
            'password' => 'wrongpassword',
        ]);
        $invalidPassResp->assertStatus(401);
        $this->assertFalse($invalidPassResp->json('success'));
        $this->assertEquals('Email/username atau kata sandi tidak cocok.', $invalidPassResp->json('message'));

        // Non-existent user (same non-enumerating error)
        auth()->forgetGuards();
        $nonExistentResp = $this->postJson('/api/auth/login', [
            'email'    => 'unknown@pasaria.id',
            'password' => 'password123',
        ]);
        $nonExistentResp->assertStatus(401);
        $this->assertFalse($nonExistentResp->json('success'));
        $this->assertEquals('Email/username atau kata sandi tidak cocok.', $nonExistentResp->json('message'));
    }

    /**
     * 3. Email verification succeeds and code cannot be reused (one-time use).
     */
    public function test_email_verification_success_and_one_time_use(): void
    {
        $regResp = $this->postJson('/api/auth/register', [
            'name'     => 'Cynthia Dewi',
            'username' => 'cynthiadewi',
            'email'    => 'cynthia@pasaria.id',
            'password' => 'password123',
        ]);

        $regResp->assertStatus(201);
        $code = $regResp->json('verification_code');
        $token = $regResp->json('token');

        // First verification attempt: valid
        auth()->forgetGuards();
        $verifyResp = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/auth/verify-email', [
                'code' => $code,
            ]);

        $verifyResp->assertStatus(200);
        $this->assertTrue($verifyResp->json('success'));

        $user = User::where('email', 'cynthia@pasaria.id')->first();
        $this->assertNotNull($user->email_verified_at, 'User email must be marked as verified');

        // Reset verified at to test code reuse prevention
        $user->email_verified_at = null;
        $user->save();

        auth()->forgetGuards();
        $reuseResp = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/auth/verify-email', [
                'code' => $code,
            ]);

        $reuseResp->assertStatus(422);
        $this->assertFalse($reuseResp->json('success'));
        $this->assertEquals('Kode verifikasi tidak valid atau telah kedaluwarsa.', $reuseResp->json('message'));
    }

    /**
     * 4. Verification fails with expired or wrong code.
     */
    public function test_email_verification_fails_when_expired_or_invalid(): void
    {
        $user = User::create([
            'name'              => 'Dedi Kusuma',
            'username'          => 'dedikusuma',
            'email'             => 'dedi@pasaria.id',
            'password'          => Hash::make('password123'),
            'role'              => 'customer',
            'status'            => 'active',
            'email_verified_at' => null,
        ]);
        $token = $user->createToken('test_token')->plainTextToken;

        // Try with wrong code
        auth()->forgetGuards();
        $wrongResp = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/auth/verify-email', [
                'code' => '999999',
            ]);
        $wrongResp->assertStatus(422);
        $this->assertFalse($wrongResp->json('success'));

        // Cache expired / missing code
        Cache::forget("email_verify_code_{$user->id}");
        auth()->forgetGuards();
        $expiredResp = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/auth/verify-email', [
                'code' => '123456',
            ]);
        $expiredResp->assertStatus(422);
    }

    /**
     * 5. Resend verification generates new code and blocks already verified users.
     */
    public function test_resend_verification_generates_new_code_and_blocks_already_verified(): void
    {
        $user = User::create([
            'name'              => 'Eka Pratama',
            'username'          => 'ekapratama',
            'email'             => 'eka@pasaria.id',
            'password'          => Hash::make('password123'),
            'role'              => 'customer',
            'status'            => 'active',
            'email_verified_at' => null,
        ]);

        auth()->forgetGuards();
        $resendResp = $this->postJson('/api/auth/resend-verification', [
            'email' => 'eka@pasaria.id',
        ]);
        $resendResp->assertStatus(200);
        $this->assertTrue($resendResp->json('success'));
        $newCode = $resendResp->json('verification_code');
        $this->assertNotEmpty($newCode);

        // Verify user
        $user->email_verified_at = now();
        $user->save();

        // Resend to already verified user must return 400
        auth()->forgetGuards();
        $alreadyVerifiedResp = $this->postJson('/api/auth/resend-verification', [
            'email' => 'eka@pasaria.id',
        ]);
        $alreadyVerifiedResp->assertStatus(400);
        $this->assertFalse($alreadyVerifiedResp->json('success'));
    }

    /**
     * 6. Logout revokes token so subsequent requests fail with 401.
     */
    public function test_logout_revokes_token(): void
    {
        $user = User::create([
            'name'              => 'Fajar Hidayat',
            'username'          => 'fajarhidayat',
            'email'             => 'fajar@pasaria.id',
            'password'          => Hash::make('password123'),
            'role'              => 'customer',
            'status'            => 'active',
            'email_verified_at' => now(),
        ]);
        $token = $user->createToken('test_token')->plainTextToken;

        // Before logout: access succeeds
        $meResp = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/auth/me');
        $meResp->assertStatus(200);

        // Logout
        auth()->forgetGuards();
        $logoutResp = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/auth/logout');
        $logoutResp->assertStatus(200);
        $this->assertTrue($logoutResp->json('success'));

        // After logout: access rejected with 401
        auth()->forgetGuards();
        $subsequentResp = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/auth/me');
        $subsequentResp->assertStatus(401);
    }

    /**
     * 7. Suspended account cannot login and cannot access private routes (403 + tokens deleted).
     */
    public function test_suspended_account_is_blocked_from_login_and_private_routes(): void
    {
        $user = User::create([
            'name'              => 'Gilang Ramadhan',
            'username'          => 'gilangramadhan',
            'email'             => 'gilang@pasaria.id',
            'password'          => Hash::make('password123'),
            'role'              => 'customer',
            'status'            => 'active',
            'email_verified_at' => now(),
        ]);
        $token = $user->createToken('test_token')->plainTextToken;

        // User is active: can access private route
        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/auth/me')
            ->assertStatus(200);

        // Suspend user
        $user->status = 'suspended';
        $user->save();

        // Access private route: blocked by EnsureAccountActive middleware (403)
        auth()->forgetGuards();
        $blockedResp = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/auth/me');
        $blockedResp->assertStatus(403);
        $this->assertFalse($blockedResp->json('success'));

        // Ensure token was revoked
        $this->assertEquals(0, $user->tokens()->count(), 'Suspended user tokens must be deleted');

        // Login attempt as suspended user must fail with 403
        auth()->forgetGuards();
        $loginResp = $this->postJson('/api/auth/login', [
            'email'    => 'gilang@pasaria.id',
            'password' => 'password123',
        ]);
        $loginResp->assertStatus(403);
        $this->assertFalse($loginResp->json('success'));
    }

    /**
     * 8. Seller onboarding requires verified email; starts as pending without automatic role promotion.
     */
    public function test_seller_onboarding_requires_verified_email_and_starts_as_pending(): void
    {
        // Unverified user tries to register shop -> 403
        $unverifiedUser = User::create([
            'name'              => 'Hadi Gunawan',
            'username'          => 'hadigunawan',
            'email'             => 'hadi@pasaria.id',
            'password'          => Hash::make('password123'),
            'role'              => 'customer',
            'status'            => 'active',
            'email_verified_at' => null,
        ]);
        $unverifiedToken = $unverifiedUser->createToken('test_token')->plainTextToken;

        $unverifiedResp = $this->withHeader('Authorization', "Bearer {$unverifiedToken}")
            ->postJson('/api/shops', ['name' => 'Toko Hadi']);
        $unverifiedResp->assertStatus(403);
        $this->assertFalse($unverifiedResp->json('success'));

        // Verify email
        $unverifiedUser->email_verified_at = now();
        $unverifiedUser->save();

        // Verified user registers shop
        auth()->forgetGuards();
        $registerShopResp = $this->withHeader('Authorization', "Bearer {$unverifiedToken}")
            ->postJson('/api/shops', [
                'name'   => 'Toko Hadi Resmi',
                'slogan' => 'Pusat Barang Bagus',
            ]);

        $registerShopResp->assertStatus(201);
        $this->assertTrue($registerShopResp->json('success'));

        $shop = Shop::where('user_id', $unverifiedUser->id)->first();
        $this->assertNotNull($shop);
        $this->assertEquals('pending', $shop->status, 'New shop must be pending');
        $this->assertFalse((bool) $shop->verified, 'New shop must not be verified');

        $unverifiedUser->refresh();
        $this->assertEquals('customer', $unverifiedUser->role, 'Role must remain customer until admin approval');
    }

    /**
     * 9. Pending seller is blocked from active operations (adding products, updating stock, payout).
     */
    public function test_pending_seller_is_blocked_from_active_operations(): void
    {
        $sellerUser = User::create([
            'name'              => 'Indra Penjual',
            'username'          => 'indrapenjual',
            'email'             => 'indra@pasaria.id',
            'password'          => Hash::make('password123'),
            'role'              => 'customer', // Pending shop owner is still customer
            'status'            => 'active',
            'email_verified_at' => now(),
        ]);
        $token = $sellerUser->createToken('test_token')->plainTextToken;

        $shop = Shop::create([
            'user_id'  => $sellerUser->id,
            'name'     => 'Toko Indra Pending',
            'slug'     => 'toko-indra-pending',
            'status'   => 'pending',
            'verified' => false,
        ]);

        // 1. Cannot add products as customer role -> 403
        $addProductResp = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/products', [
                'name'     => 'Produk Uji Coba',
                'category' => 'Elektronik',
                'price'    => 100000,
                'stock'    => 10,
            ]);
        $addProductResp->assertStatus(403);

        // 2. Even if role is changed to seller but shop is still pending -> blocked with approved shop requirement
        $sellerUser->role = 'seller';
        $sellerUser->save();

        auth()->forgetGuards();
        $addProductResp2 = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/products', [
                'name'     => 'Produk Uji Coba 2',
                'category' => 'Elektronik',
                'price'    => 100000,
                'stock'    => 10,
            ]);
        $addProductResp2->assertStatus(403);
        $this->assertEquals('Toko Anda belum disetujui untuk menjual produk di PASARIA.', $addProductResp2->json('message'));

        // 3. Cannot request payout -> 403
        auth()->forgetGuards();
        $payoutResp = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/seller/payout', [
                'amount'         => 50000,
                'bank_name'      => 'BCA',
                'account_number' => '1234567890',
                'account_holder' => 'Indra Penjual',
            ]);
        $payoutResp->assertStatus(403);
    }

    /**
     * 10. Customer attempting seller or admin routes receives 403.
     */
    public function test_customer_attempting_seller_or_admin_routes_is_forbidden(): void
    {
        $customer = User::create([
            'name'              => 'Joko Pembeli',
            'username'          => 'jokopembeli',
            'email'             => 'joko@pasaria.id',
            'password'          => Hash::make('password123'),
            'role'              => 'customer',
            'status'            => 'active',
            'email_verified_at' => now(),
        ]);
        $token = $customer->createToken('test_token')->plainTextToken;

        // Seller route attempt -> 403
        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/seller/dashboard')
            ->assertStatus(403);

        // Admin route attempt -> 403
        auth()->forgetGuards();
        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/admin/users')
            ->assertStatus(403);
    }

    /**
     * 11. Admin can approve seller, which elevates user role and enables product publishing.
     */
    public function test_admin_approves_seller_and_elevates_role(): void
    {
        $admin = User::create([
            'name'              => 'Super Admin',
            'username'          => 'admin',
            'email'             => 'admin@pasaria.id',
            'password'          => Hash::make('admin123'),
            'role'              => 'admin',
            'status'            => 'active',
            'email_verified_at' => now(),
        ]);
        $adminToken = $admin->createToken('admin_token')->plainTextToken;

        $applicant = User::create([
            'name'              => 'Kartika Penjual',
            'username'          => 'kartikapenjual',
            'email'             => 'kartika@pasaria.id',
            'password'          => Hash::make('password123'),
            'role'              => 'customer',
            'status'            => 'active',
            'email_verified_at' => now(),
        ]);
        $applicantToken = $applicant->createToken('seller_token')->plainTextToken;

        $shop = Shop::create([
            'user_id'  => $applicant->id,
            'name'     => 'Toko Kartika',
            'slug'     => 'toko-kartika',
            'status'   => 'pending',
            'verified' => false,
        ]);

        // Admin approves shop
        auth()->forgetGuards();
        $approveResp = $this->withHeader('Authorization', "Bearer {$adminToken}")
            ->putJson("/api/admin/sellers/{$shop->id}/status", [
                'status' => 'approved',
            ]);
        $approveResp->assertStatus(200);
        $this->assertTrue($approveResp->json('success'));

        $shop->refresh();
        $this->assertEquals('approved', $shop->status);
        $this->assertTrue((bool) $shop->verified);

        $applicant->refresh();
        $this->assertEquals('seller', $applicant->role, 'Applicant role must be elevated to seller');

        // Audit log was created
        $action = AdminAction::where('target_id', $shop->id)->where('action', 'update_seller_status')->first();
        $this->assertNotNull($action);

        // Now approved seller can add products
        auth()->forgetGuards();
        $productResp = $this->withHeader('Authorization', "Bearer {$applicantToken}")
            ->postJson('/api/products', [
                'name'     => 'Kamera DSLR Pro',
                'category' => 'Elektronik',
                'price'    => 5000000,
                'stock'    => 5,
            ]);
        $productResp->assertStatus(201);
        $this->assertTrue($productResp->json('success'));
    }

    /**
     * 12. Admin suspends user and all active tokens are immediately revoked.
     */
    public function test_admin_suspends_user_and_revokes_tokens(): void
    {
        $admin = User::create([
            'name'              => 'Admin User',
            'username'          => 'admin2',
            'email'             => 'admin2@pasaria.id',
            'password'          => Hash::make('admin123'),
            'role'              => 'admin',
            'status'            => 'active',
            'email_verified_at' => now(),
        ]);
        $adminToken = $admin->createToken('admin_token')->plainTextToken;

        $targetUser = User::create([
            'name'              => 'Lukas Pelanggan',
            'username'          => 'lukaspelanggan',
            'email'             => 'lukas@pasaria.id',
            'password'          => Hash::make('password123'),
            'role'              => 'customer',
            'status'            => 'active',
            'email_verified_at' => now(),
        ]);
        $targetToken = $targetUser->createToken('lukas_token')->plainTextToken;

        // Admin suspends target user
        auth()->forgetGuards();
        $suspendResp = $this->withHeader('Authorization', "Bearer {$adminToken}")
            ->putJson("/api/admin/users/{$targetUser->id}/status", [
                'status' => 'suspended',
            ]);
        $suspendResp->assertStatus(200);

        $targetUser->refresh();
        $this->assertEquals('suspended', $targetUser->status);
        $this->assertEquals(0, $targetUser->tokens()->count(), 'Target user tokens must be deleted upon suspension');

        // Former token is rejected
        auth()->forgetGuards();
        $this->withHeader('Authorization', "Bearer {$targetToken}")
            ->getJson('/api/auth/me')
            ->assertStatus(401);
    }

    /**
     * 13. Seller cannot modify or access another seller's products (IDOR prevention).
     */
    public function test_seller_cannot_modify_another_sellers_product_idor(): void
    {
        $sellerA = User::create([
            'name'              => 'Seller A',
            'username'          => 'sellera',
            'email'             => 'sellera@pasaria.id',
            'password'          => Hash::make('password123'),
            'role'              => 'seller',
            'status'            => 'active',
            'email_verified_at' => now(),
        ]);
        $shopA = Shop::create([
            'user_id'  => $sellerA->id,
            'name'     => 'Shop A',
            'slug'     => 'shop-a',
            'status'   => 'approved',
            'verified' => true,
        ]);
        $tokenA = $sellerA->createToken('token_a')->plainTextToken;

        $sellerB = User::create([
            'name'              => 'Seller B',
            'username'          => 'sellerb',
            'email'             => 'sellerb@pasaria.id',
            'password'          => Hash::make('password123'),
            'role'              => 'seller',
            'status'            => 'active',
            'email_verified_at' => now(),
        ]);
        $shopB = Shop::create([
            'user_id'  => $sellerB->id,
            'name'     => 'Shop B',
            'slug'     => 'shop-b',
            'status'   => 'approved',
            'verified' => true,
        ]);

        $productB = Product::create([
            'shop_id'   => $shopB->id,
            'name'      => 'Produk Milik Toko B',
            'slug'      => 'produk-milik-toko-b',
            'category'  => 'Elektronik',
            'price'     => 250000,
            'stock'     => 15,
            'image'     => 'sample-product.png',
            'shop_name' => $shopB->name,
        ]);

        // Seller A tries to update stock of Seller B's product -> 403 Forbidden
        auth()->forgetGuards();
        $stockResp = $this->withHeader('Authorization', "Bearer {$tokenA}")
            ->putJson("/api/seller/products/{$productB->id}/stock", [
                'stock' => 999,
            ]);
        $stockResp->assertStatus(403);
        $this->assertFalse($stockResp->json('success'));

        // Seller A tries to delete Seller B's product -> 403 Forbidden
        auth()->forgetGuards();
        $deleteResp = $this->withHeader('Authorization', "Bearer {$tokenA}")
            ->deleteJson("/api/products/{$productB->id}");
        $deleteResp->assertStatus(403);
        $this->assertFalse($deleteResp->json('success'));
        $this->assertEquals('Anda tidak memiliki hak untuk menghapus produk toko lain.', $deleteResp->json('message'));
    }

    /**
     * 14. Customer cannot access another customer's addresses (IDOR prevention).
     */
    public function test_customer_cannot_modify_another_customers_address_idor(): void
    {
        $customerA = User::create([
            'name'              => 'Customer A',
            'username'          => 'customera',
            'email'             => 'customera@pasaria.id',
            'password'          => Hash::make('password123'),
            'role'              => 'customer',
            'status'            => 'active',
            'email_verified_at' => now(),
        ]);
        $tokenA = $customerA->createToken('token_a')->plainTextToken;

        $customerB = User::create([
            'name'              => 'Customer B',
            'username'          => 'customerb',
            'email'             => 'customerb@pasaria.id',
            'password'          => Hash::make('password123'),
            'role'              => 'customer',
            'status'            => 'active',
            'email_verified_at' => now(),
        ]);

        $addressB = UserAddress::create([
            'user_id'        => $customerB->id,
            'recipient_name' => 'Alamat Rahasia B',
            'phone'          => '081234567890',
            'address_line'   => 'Jl. Rahasia No. 10',
            'city'           => 'Surabaya',
            'postal_code'    => '60111',
            'is_default'     => true,
        ]);

        // Customer A attempts to update Customer B's address
        auth()->forgetGuards();
        $updateResp = $this->withHeader('Authorization', "Bearer {$tokenA}")
            ->putJson("/api/user/addresses/{$addressB->id}", [
                'recipient_name' => 'Diubah oleh Pembeli A',
            ]);
        $updateResp->assertStatus(403);
        $this->assertFalse($updateResp->json('success'));

        // Customer A attempts to delete Customer B's address
        auth()->forgetGuards();
        $deleteResp = $this->withHeader('Authorization', "Bearer {$tokenA}")
            ->deleteJson("/api/user/addresses/{$addressB->id}");
        $deleteResp->assertStatus(403);
        $this->assertFalse($deleteResp->json('success'));
    }
}
