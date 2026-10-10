<?php

namespace Tests\Feature;

use App\Models\Conversation;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class RateLimitingTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();
    }

    public function test_throttle_exception_renders_structured_429_json_envelope(): void
    {
        for ($i = 0; $i < 7; $i++) {
            $response = $this->postJson('/api/auth/resend-verification', [
                'email' => 'throttletest@pasaria.id',
            ]);
        }

        $response->assertStatus(429);
        $response->assertJsonStructure([
            'success',
            'message',
            'retry_after',
        ]);
        $this->assertFalse($response->json('success'));
        $this->assertSame('Terlalu banyak permintaan. Silakan tunggu beberapa saat lagi.', $response->json('message'));
        $this->assertIsInt($response->json('retry_after'));
        $this->assertTrue($response->headers->has('Retry-After'));
    }

    public function test_login_rate_limiter_combines_credentials_and_ip(): void
    {
        // 5 failed login attempts with a specific email and password
        for ($i = 0; $i < 5; $i++) {
            $res = $this->postJson('/api/auth/login', [
                'email' => 'victim@pasaria.id',
                'password' => 'wrongpass',
            ]);
            $this->assertSame(401, $res->status());
        }

        // 6th attempt should be throttled with 429
        $throttled = $this->postJson('/api/auth/login', [
            'email' => 'victim@pasaria.id',
            'password' => 'wrongpass',
        ]);
        $throttled->assertStatus(429);

        // Different email from same IP is NOT throttled
        $differentEmailRes = $this->postJson('/api/auth/login', [
            'email' => 'other@pasaria.id',
            'password' => 'wrongpass',
        ]);
        $this->assertSame(401, $differentEmailRes->status());

        // Same email from different IP is NOT throttled
        $differentIpRes = $this->withServerVariables(['REMOTE_ADDR' => '192.168.1.100'])
            ->postJson('/api/auth/login', [
                'email' => 'victim@pasaria.id',
                'password' => 'wrongpass',
            ]);
        $this->assertSame(401, $differentIpRes->status());
    }

    public function test_registration_rate_limiter_restricts_ip(): void
    {
        // 5 registration attempts from same IP
        for ($i = 0; $i < 5; $i++) {
            $res = $this->postJson('/api/auth/register', []);
            $this->assertSame(422, $res->status());
        }

        // 6th attempt from same IP triggers 429
        $throttled = $this->postJson('/api/auth/register', []);
        $throttled->assertStatus(429);

        // Registration attempt from different IP is NOT throttled
        $differentIpRes = $this->withServerVariables(['REMOTE_ADDR' => '192.168.1.101'])
            ->postJson('/api/auth/register', []);
        $this->assertSame(422, $differentIpRes->status());
    }

    public function test_resend_verification_rate_limiter(): void
    {
        // 3 resend attempts
        for ($i = 0; $i < 3; $i++) {
            $res = $this->postJson('/api/auth/resend-verification', [
                'email' => 'resendtest@pasaria.id',
            ]);
            $this->assertNotEquals(429, $res->status());
        }

        // 4th attempt triggers 429
        $throttled = $this->postJson('/api/auth/resend-verification', [
            'email' => 'resendtest@pasaria.id',
        ]);
        $throttled->assertStatus(429);
    }

    public function test_voucher_validation_endpoint_rate_limited(): void
    {
        for ($i = 0; $i < 10; $i++) {
            $res = $this->postJson('/api/vouchers/validate', [
                'code' => 'TESTVOUCHER',
            ]);
            $this->assertNotEquals(429, $res->status());
        }

        $throttled = $this->postJson('/api/vouchers/validate', [
            'code' => 'TESTVOUCHER',
        ]);
        $throttled->assertStatus(429);
    }

    public function test_order_creation_endpoint_rate_limited(): void
    {
        $user = User::create([
            'name' => 'Order Tester',
            'username' => 'ordertester',
            'email' => 'ordertester@pasaria.id',
            'password' => bcrypt('password'),
            'role' => 'customer',
            'status' => 'active',
            'email_verified_at' => now(),
        ]);

        for ($i = 0; $i < 10; $i++) {
            $res = $this->actingAs($user, 'sanctum')->postJson('/api/orders', []);
            $this->assertNotEquals(429, $res->status());
        }

        $throttled = $this->actingAs($user, 'sanctum')->postJson('/api/orders', []);
        $throttled->assertStatus(429);
    }

    public function test_upload_endpoint_rate_limited(): void
    {
        $user = User::create([
            'name' => 'Upload Tester',
            'username' => 'uploadtester',
            'email' => 'uploadtester@pasaria.id',
            'password' => bcrypt('password'),
            'role' => 'customer',
            'status' => 'active',
            'email_verified_at' => now(),
        ]);

        for ($i = 0; $i < 10; $i++) {
            $res = $this->actingAs($user, 'sanctum')->postJson('/api/upload', []);
            $this->assertNotEquals(429, $res->status());
        }

        $throttled = $this->actingAs($user, 'sanctum')->postJson('/api/upload', []);
        $throttled->assertStatus(429);
    }

    public function test_chat_messaging_endpoint_rate_limited(): void
    {
        $seller = User::create([
            'name' => 'Seller Chat',
            'username' => 'sellerchat',
            'email' => 'sellerchat@pasaria.id',
            'password' => bcrypt('password'),
            'role' => 'seller',
            'status' => 'active',
            'email_verified_at' => now(),
        ]);

        $shop = Shop::create([
            'user_id' => $seller->id,
            'name' => 'Chat Shop',
            'slug' => 'chat-shop',
            'status' => 'active',
        ]);

        $customer = User::create([
            'name' => 'Customer Chat',
            'username' => 'customerchat',
            'email' => 'customerchat@pasaria.id',
            'password' => bcrypt('password'),
            'role' => 'customer',
            'status' => 'active',
            'email_verified_at' => now(),
        ]);

        $conversation = Conversation::create([
            'customer_id' => $customer->id,
            'shop_id' => $shop->id,
        ]);

        for ($i = 0; $i < 30; $i++) {
            $res = $this->actingAs($customer, 'sanctum')->postJson('/api/conversations/messages', [
                'conversation_id' => $conversation->id,
                'message' => 'Halo pesan ke-' . $i,
            ]);
            $this->assertNotEquals(429, $res->status());
        }

        $throttled = $this->actingAs($customer, 'sanctum')->postJson('/api/conversations/messages', [
            'conversation_id' => $conversation->id,
            'message' => 'Pesan kena throttle',
        ]);
        $throttled->assertStatus(429);
    }

    public function test_global_api_limiter_restricts_guest_requests(): void
    {
        for ($i = 0; $i < 60; $i++) {
            $res = $this->getJson('/api/categories');
            $this->assertNotEquals(429, $res->status());
        }

        $throttled = $this->getJson('/api/categories');
        $throttled->assertStatus(429);
    }
}
