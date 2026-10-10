<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Shop;
use App\Models\Conversation;
use App\Models\Message;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;

class FrontendAndSecurityHardeningTest extends TestCase
{
    use RefreshDatabase;

    protected User $customer;
    protected User $otherCustomer;
    protected User $seller;
    protected Shop $shop;

    protected function setUp(): void
    {
        parent::setUp();

        $this->customer = User::create([
            'name'              => 'Budi Customer',
            'username'          => 'budicustomer',
            'email'             => 'budi@pasaria.id',
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

        $this->shop = Shop::create([
            'user_id'     => $this->seller->id,
            'name'        => 'Toko Hendro',
            'slug'        => 'toko-hendro',
            'description' => 'Toko resmi Hendro',
            'city'        => 'Jakarta Barat',
            'status'      => 'approved',
            'verified'    => true,
        ]);
    }

    /**
     * 1. Response must include hardened HTTP security headers and Content-Security-Policy.
     */
    public function test_security_headers_and_csp_are_present_on_responses(): void
    {
        $response = $this->getJson('/api/categories');
        $response->assertStatus(200);

        $headers = $response->headers;
        $this->assertEquals('SAMEORIGIN', $headers->get('X-Frame-Options'));
        $this->assertEquals('nosniff', $headers->get('X-Content-Type-Options'));
        $this->assertEquals('1; mode=block', $headers->get('X-XSS-Protection'));
        $this->assertEquals('strict-origin-when-cross-origin', $headers->get('Referrer-Policy'));

        $csp = $headers->get('Content-Security-Policy');
        $this->assertNotNull($csp);
        $this->assertStringContainsString("default-src 'self'", $csp);
        $this->assertStringContainsString("frame-ancestors 'self'", $csp);
    }

    /**
     * 2. Unauthenticated requests return explicit 401 with standard JSON envelope.
     */
    public function test_unauthenticated_requests_return_401_json_envelope(): void
    {
        $response = $this->getJson('/api/auth/me');
        $response->assertStatus(401);
        $this->assertFalse((bool) $response->json('success'));
        $this->assertStringContainsString('Unauthenticated', $response->json('message'));
    }

    /**
     * 3. Forbidden requests return explicit 403 with standard JSON envelope.
     */
    public function test_forbidden_requests_return_403_json_envelope(): void
    {
        $response = $this->actingAs($this->customer, 'sanctum')->getJson('/api/admin/dashboard');
        $response->assertStatus(403);
        $this->assertFalse((bool) $response->json('success'));
    }

    /**
     * 4. Validation errors return 422 with structured field error mappings.
     */
    public function test_validation_errors_return_422_with_structured_errors_map(): void
    {
        $response = $this->actingAs($this->customer, 'sanctum')->postJson('/api/orders/calculate', [
            'items' => [], // Empty items must trigger validation failure
        ]);

        $response->assertStatus(422);
        $this->assertFalse((bool) $response->json('success'));
        $this->assertIsArray($response->json('errors'));
    }

    /**
     * 5. Chat participant authorization ensures messages cannot be read or sent across conversations.
     */
    public function test_chat_endpoints_isolate_conversations_and_messages_by_participant(): void
    {
        // Conversation between Budi (customer) and Hendro (shop)
        $conversation = Conversation::create([
            'customer_id' => $this->customer->id,
            'shop_id'     => $this->shop->id,
        ]);

        Message::create([
            'conversation_id' => $conversation->id,
            'sender_id'       => $this->customer->id,
            'sender_type'     => 'customer',
            'message'         => 'Halo, apakah produk ready stock?',
            'is_read'         => false,
        ]);

        // A. Siti (otherCustomer) attempts to read Budi's conversation messages -> 403 Forbidden
        $response1 = $this->actingAs($this->otherCustomer, 'sanctum')
            ->getJson("/api/conversations/{$conversation->id}/messages");
        $response1->assertStatus(403);

        // B. Siti attempts to send a message into Budi's conversation -> 403 Forbidden
        $response2 = $this->actingAs($this->otherCustomer, 'sanctum')
            ->postJson('/api/conversations/messages', [
                'conversation_id' => $conversation->id,
                'message'         => 'Penyusup mengirim pesan',
            ]);
        $response2->assertStatus(403);

        // C. Budi (legitimate customer) can read and send messages -> 200 / 201
        $response3 = $this->actingAs($this->customer, 'sanctum')
            ->getJson("/api/conversations/{$conversation->id}/messages");
        $response3->assertStatus(200);
        $this->assertCount(1, $response3->json('data'));
    }

    /**
     * 6. Logout successfully revokes the Sanctum bearer token in database.
     */
    public function test_auth_logout_revokes_token_successfully(): void
    {
        $token = $this->customer->createToken('test_device_token');
        $plainToken = $token->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $plainToken)
            ->postJson('/api/auth/logout');

        $response->assertStatus(200);
        $this->assertTrue((bool) $response->json('success'));

        // Token must be deleted from personal_access_tokens
        $revokedToken = \Laravel\Sanctum\PersonalAccessToken::find($token->accessToken->id);
        $this->assertNull($revokedToken);
    }
}
