<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Shop;
use App\Models\User;
use App\Models\UserAddress;
use App\Models\UserNotificationPreference;
use App\Models\UserPrivacyPreference;
use App\Models\UserTwoFactorAuth;
use App\Services\TotpService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AccountSettingsAndPreferencesTest extends TestCase
{
    use RefreshDatabase;

    protected User $userA;
    protected User $userB;
    protected string $tokenA;
    protected string $tokenB;

    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();

        $this->userA = User::create([
            'name'              => 'Budi Pratama',
            'username'          => 'budipratama',
            'email'             => 'budi@pasaria.id',
            'password'          => Hash::make('SecretPass123!'),
            'role'              => 'customer',
            'status'            => 'active',
            'phone'             => '081234567890',
            'city'              => 'Jakarta Pusat',
            'address'           => 'Jl. Thamrin No. 1',
            'zip'               => '10350',
            'email_verified_at' => now(),
        ]);
        $this->tokenA = $this->userA->createToken('session_device_a')->plainTextToken;

        $this->userB = User::create([
            'name'              => 'Siti Rahma',
            'username'          => 'sitirahma',
            'email'             => 'siti@pasaria.id',
            'password'          => Hash::make('SecretPass123!'),
            'role'              => 'customer',
            'status'            => 'active',
            'phone'             => '081987654321',
            'city'              => 'Surabaya',
            'address'           => 'Jl. Pemuda No. 10',
            'zip'               => '60271',
            'email_verified_at' => now(),
        ]);
        $this->tokenB = $this->userB->createToken('session_device_b')->plainTextToken;
    }

    /**
     * 1. Reading notification preferences creates default record when none exists.
     */
    public function test_get_notification_preferences_returns_defaults_for_new_user(): void
    {
        $response = $this->withHeader('Authorization', "Bearer {$this->tokenA}")
            ->getJson('/api/user/notification-preferences');

        $response->assertStatus(200);
        $this->assertTrue($response->json('success'));
        $data = $response->json('data');

        $this->assertTrue($data['order_updates_email']);
        $this->assertTrue($data['order_updates_in_app']);
        $this->assertTrue($data['chat_messages_email']);
        $this->assertFalse($data['promotions_email']);
        $this->assertFalse($data['promotions_in_app']);
        $this->assertTrue($data['security_alerts_email']);
        $this->assertTrue($data['security_alerts_in_app']);
    }

    /**
     * 2. Updating notification preferences persists in database and retains security alerts.
     */
    public function test_update_notification_preferences_persists_and_preserves_security_alerts(): void
    {
        $payload = [
            'order_updates_email'   => false,
            'order_updates_in_app'  => true,
            'promotions_email'      => true,
            'promotions_in_app'     => true,
            'security_alerts_email' => false, // Attempting to turn off security alerts
            'security_alerts_in_app'=> false, // Attempting to turn off security alerts
        ];

        $response = $this->withHeader('Authorization', "Bearer {$this->tokenA}")
            ->putJson('/api/user/notification-preferences', $payload);

        $response->assertStatus(200);
        $this->assertTrue($response->json('success'));

        $pref = UserNotificationPreference::where('user_id', $this->userA->id)->first();
        $this->assertNotNull($pref);
        $this->assertFalse($pref->order_updates_email);
        $this->assertTrue($pref->order_updates_in_app);
        $this->assertTrue($pref->promotions_email);
        $this->assertTrue($pref->promotions_in_app);
        $this->assertTrue($pref->security_alerts_email);
        $this->assertTrue($pref->security_alerts_in_app);
    }

    /**
     * 3. Isolation between users: User B cannot access or mutate User A's preferences.
     */
    public function test_user_preference_isolation_between_accounts(): void
    {
        // User A sets promotions true
        $this->withHeader('Authorization', "Bearer {$this->tokenA}")
            ->putJson('/api/user/notification-preferences', [
                'promotions_email' => true,
            ])
            ->assertStatus(200);

        // User B reads preferences; must see User B's own defaults (false)
        auth()->forgetGuards();
        $respB = $this->withHeader('Authorization', "Bearer {$this->tokenB}")
            ->getJson('/api/user/notification-preferences');

        $respB->assertStatus(200);
        $this->assertFalse($respB->json('data.promotions_email'));
    }

    /**
     * 4. Unauthenticated operations are rejected with 401.
     */
    public function test_unauthenticated_requests_are_rejected(): void
    {
        $this->getJson('/api/user/notification-preferences')->assertStatus(401);
        $this->putJson('/api/user/notification-preferences', ['promotions_email' => true])->assertStatus(401);
        $this->getJson('/api/user/sessions')->assertStatus(401);
        $this->getJson('/api/user/data-export')->assertStatus(401);
        $this->postJson('/api/user/delete-account', ['password' => 'secret'])->assertStatus(401);
    }

    /**
     * 5. Privacy preferences can be read and updated.
     */
    public function test_privacy_preferences_lifecycle(): void
    {
        $getResp = $this->withHeader('Authorization', "Bearer {$this->tokenA}")
            ->getJson('/api/user/privacy-preferences');
        $getResp->assertStatus(200);
        $this->assertTrue($getResp->json('data.personalization_enabled'));

        $putResp = $this->withHeader('Authorization', "Bearer {$this->tokenA}")
            ->putJson('/api/user/privacy-preferences', [
                'personalization_enabled' => false,
                'marketing_communication' => true,
                'activity_logging'        => false,
            ]);

        $putResp->assertStatus(200);
        $privacy = UserPrivacyPreference::where('user_id', $this->userA->id)->first();
        $this->assertNotNull($privacy);
        $this->assertFalse($privacy->personalization_enabled);
        $this->assertTrue($privacy->marketing_communication);
        $this->assertFalse($privacy->activity_logging);
    }

    /**
     * 6. Active sessions list shows current session and tokens.
     */
    public function test_active_sessions_listing_identifies_current_session(): void
    {
        // Create an additional token for user A
        $extraToken = $this->userA->createToken('secondary_laptop')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$this->tokenA}")
            ->getJson('/api/user/sessions');

        $response->assertStatus(200);
        $sessions = $response->json('data');
        $this->assertCount(2, $sessions);

        $currentSession = collect($sessions)->firstWhere('is_current', true);
        $this->assertNotNull($currentSession);
        $this->assertEquals('session_device_a', $currentSession['name']);
    }

    /**
     * 7. Revoke selected session and revoke other sessions.
     */
    public function test_session_revocation(): void
    {
        $extraTokenObj = $this->userA->createToken('tablet_session');
        $extraToken = $extraTokenObj->plainTextToken;

        $this->assertEquals(2, $this->userA->tokens()->count());

        // Revoke the extra token
        $revokeResp = $this->withHeader('Authorization', "Bearer {$this->tokenA}")
            ->deleteJson("/api/user/sessions/{$extraTokenObj->accessToken->id}");

        $revokeResp->assertStatus(200);
        $this->assertEquals(1, $this->userA->tokens()->count());

        // Revoked token cannot be used anymore
        auth()->forgetGuards();
        $this->withHeader('Authorization', "Bearer {$extraToken}")
            ->getJson('/api/auth/me')
            ->assertStatus(401);
    }

    /**
     * 8. Verified email change flow: validation, challenge generation, and confirmation.
     */
    public function test_verified_email_change_flow(): void
    {
        // 1. Request email change to existing email fails
        $sameEmailResp = $this->withHeader('Authorization', "Bearer {$this->tokenA}")
            ->postJson('/api/user/email/request-change', [
                'new_email' => 'budi@pasaria.id',
            ]);
        $sameEmailResp->assertStatus(422);

        // 2. Request email change to User B's email fails (unique rule)
        $takenEmailResp = $this->withHeader('Authorization', "Bearer {$this->tokenA}")
            ->postJson('/api/user/email/request-change', [
                'new_email' => 'siti@pasaria.id',
            ]);
        $takenEmailResp->assertStatus(422);

        // 3. Valid email change request
        $reqResp = $this->withHeader('Authorization', "Bearer {$this->tokenA}")
            ->postJson('/api/user/email/request-change', [
                'new_email' => 'budi.new@pasaria.id',
            ]);
        $reqResp->assertStatus(200);
        $code = $reqResp->json('verification_code');
        $this->assertNotEmpty($code);

        // 4. Verify with invalid code fails
        $badCodeResp = $this->withHeader('Authorization', "Bearer {$this->tokenA}")
            ->postJson('/api/user/email/verify-change', [
                'code' => '999999',
            ]);
        $badCodeResp->assertStatus(422);

        // 5. Verify with correct code succeeds
        $verifyResp = $this->withHeader('Authorization', "Bearer {$this->tokenA}")
            ->postJson('/api/user/email/verify-change', [
                'code' => $code,
            ]);
        $verifyResp->assertStatus(200);
        $this->assertEquals('budi.new@pasaria.id', $verifyResp->json('user.email'));

        $this->userA->refresh();
        $this->assertEquals('budi.new@pasaria.id', $this->userA->email);
        $this->assertNotNull($this->userA->email_verified_at);

        // 6. Code is single-use: replay attack fails
        $replayResp = $this->withHeader('Authorization', "Bearer {$this->tokenA}")
            ->postJson('/api/user/email/verify-change', [
                'code' => $code,
            ]);
        $replayResp->assertStatus(422);
    }

    /**
     * 9. Two-step verification (2FA) setup, confirm, and disable.
     */
    public function test_two_factor_authentication_lifecycle(): void
    {
        // 1. Initial status is disabled
        $statusResp = $this->withHeader('Authorization', "Bearer {$this->tokenA}")
            ->getJson('/api/user/two-factor');
        $statusResp->assertStatus(200);
        $this->assertFalse($statusResp->json('enabled'));

        // 2. Setup 2FA
        $setupResp = $this->withHeader('Authorization', "Bearer {$this->tokenA}")
            ->postJson('/api/user/two-factor/setup');
        $setupResp->assertStatus(200);
        $secret = $setupResp->json('secret');
        $this->assertNotEmpty($secret);
        $this->assertNotEmpty($setupResp->json('qr_uri'));
        $this->assertCount(8, $setupResp->json('recovery_codes'));

        // 3. Confirm with wrong code fails
        $badConfirm = $this->withHeader('Authorization', "Bearer {$this->tokenA}")
            ->postJson('/api/user/two-factor/confirm', [
                'code' => '000000',
            ]);
        $badConfirm->assertStatus(422);

        // 4. Confirm with valid RFC 6238 code succeeds
        $totp = new TotpService();
        $validCode = $totp->calculateCode($secret, (int) floor(time() / 30));

        $confirmResp = $this->withHeader('Authorization', "Bearer {$this->tokenA}")
            ->postJson('/api/user/two-factor/confirm', [
                'code' => $validCode,
            ]);
        $confirmResp->assertStatus(200);

        $this->userA->refresh();
        $this->assertTrue($this->userA->hasTwoFactorEnabled());

        // 5. Disable 2FA requires correct password
        $wrongPassResp = $this->withHeader('Authorization', "Bearer {$this->tokenA}")
            ->postJson('/api/user/two-factor/disable', [
                'password' => 'WrongPass',
            ]);
        $wrongPassResp->assertStatus(422);

        $disableResp = $this->withHeader('Authorization', "Bearer {$this->tokenA}")
            ->postJson('/api/user/two-factor/disable', [
                'password' => 'SecretPass123!',
            ]);
        $disableResp->assertStatus(200);

        $this->userA->refresh();
        $this->assertFalse($this->userA->hasTwoFactorEnabled());
    }

    /**
     * 10. Password change enforces min:8, confirmation matching, and Sanctum token rotation.
     */
    public function test_password_change_enforces_policy_and_rotates_token(): void
    {
        // Too short (< 8 chars)
        $shortResp = $this->withHeader('Authorization', "Bearer {$this->tokenA}")
            ->putJson('/api/user/password', [
                'current_password'          => 'SecretPass123!',
                'new_password'              => 'short',
                'new_password_confirmation' => 'short',
            ]);
        $shortResp->assertStatus(422);

        // Confirmation mismatch
        $mismatchResp = $this->withHeader('Authorization', "Bearer {$this->tokenA}")
            ->putJson('/api/user/password', [
                'current_password'          => 'SecretPass123!',
                'new_password'              => 'NewValidPassword123!',
                'new_password_confirmation' => 'DifferentPassword123!',
            ]);
        $mismatchResp->assertStatus(422);

        // Wrong current password
        $wrongCurrentResp = $this->withHeader('Authorization', "Bearer {$this->tokenA}")
            ->putJson('/api/user/password', [
                'current_password'          => 'IncorrectCurrentPassword!',
                'new_password'              => 'NewValidPassword123!',
                'new_password_confirmation' => 'NewValidPassword123!',
            ]);
        $wrongCurrentResp->assertStatus(422);

        // Valid password change
        $successResp = $this->withHeader('Authorization', "Bearer {$this->tokenA}")
            ->putJson('/api/user/password', [
                'current_password'          => 'SecretPass123!',
                'new_password'              => 'BrandNewPassword123!',
                'new_password_confirmation' => 'BrandNewPassword123!',
            ]);
        $successResp->assertStatus(200);
        $this->assertTrue($successResp->json('success'));
        $replacementToken = $successResp->json('token');
        $this->assertNotEmpty($replacementToken);

        // Old token was revoked!
        auth()->forgetGuards();
        $this->withHeader('Authorization', "Bearer {$this->tokenA}")
            ->getJson('/api/auth/me')
            ->assertStatus(401);

        // New token works immediately!
        auth()->forgetGuards();
        $this->withHeader('Authorization', "Bearer {$replacementToken}")
            ->getJson('/api/auth/me')
            ->assertStatus(200);
    }

    /**
     * 11. Profile update does NOT allow changing email or role directly.
     */
    public function test_profile_update_rejects_email_and_role_mutation(): void
    {
        $respEmail = $this->withHeader('Authorization', "Bearer {$this->tokenA}")
            ->putJson('/api/user/profile', [
                'name'  => 'Budi Updated',
                'email' => 'hacked@pasaria.id',
            ]);
        $respEmail->assertStatus(422);

        $respRole = $this->withHeader('Authorization', "Bearer {$this->tokenA}")
            ->putJson('/api/user/profile', [
                'role' => 'admin',
            ]);
        $respRole->assertStatus(422);

        // Valid profile update without email works smoothly
        $validResp = $this->withHeader('Authorization', "Bearer {$this->tokenA}")
            ->putJson('/api/user/profile', [
                'name'    => 'Budi Pratama S.T.',
                'phone'   => '081233334444',
                'address' => 'Jl. Sudirman Kav 5',
                'city'    => 'Jakarta Selatan',
            ]);
        $validResp->assertStatus(200);
        $this->assertEquals('Budi Pratama S.T.', $validResp->json('user.name'));
    }

    /**
     * 12. User data export generates sanitized dataset without secrets.
     */
    public function test_data_export_generates_sanitized_user_archive(): void
    {
        $exportResp = $this->withHeader('Authorization', "Bearer {$this->tokenA}")
            ->getJson('/api/user/data-export');

        $exportResp->assertStatus(200);
        $data = $exportResp->json('data');

        $this->assertEquals($this->userA->email, $data['user']['email']);
        $this->assertArrayNotHasKey('password', $data['user']);
        $this->assertArrayNotHasKey('remember_token', $data['user']);
        $this->assertArrayHasKey('addresses', $data);
        $this->assertArrayHasKey('orders', $data);
        $this->assertArrayHasKey('reviews', $data);
    }

    /**
     * 13. Account deletion: protected by password, guards against active orders, and soft deletes.
     */
    public function test_account_deletion_flow_with_order_guards(): void
    {
        // Attempt deletion with wrong password -> 422
        $badPassResp = $this->withHeader('Authorization', "Bearer {$this->tokenA}")
            ->postJson('/api/user/delete-account', [
                'password' => 'WrongPassword!',
            ]);
        $badPassResp->assertStatus(422);

        // Create an active in-transit order for User A
        $order = Order::create([
            'order_number'     => 'PAS-ACTIVE-999',
            'user_id'          => $this->userA->id,
            'customer_name'    => $this->userA->name,
            'customer_email'   => $this->userA->email,
            'shipping_address' => 'Alamat Pengiriman',
            'payment_method'   => 'bank_transfer',
            'subtotal'         => 100000,
            'tax'              => 11000,
            'discount'         => 0,
            'shipping_cost'    => 10000,
            'total'            => 121000,
            'status'           => 'in_transit', // Active order!
        ]);

        // Attempt deletion while order is active -> 422
        $blockedResp = $this->withHeader('Authorization', "Bearer {$this->tokenA}")
            ->postJson('/api/user/delete-account', [
                'password' => 'SecretPass123!',
            ]);
        $blockedResp->assertStatus(422);

        // Mark order as delivered / completed
        $order->status = 'delivered';
        $order->save();

        // Successful account deletion
        $deleteResp = $this->withHeader('Authorization', "Bearer {$this->tokenA}")
            ->postJson('/api/user/delete-account', [
                'password' => 'SecretPass123!',
            ]);
        $deleteResp->assertStatus(200);

        // User is soft deleted
        $deletedUser = User::withTrashed()->find($this->userA->id);
        $this->assertNotNull($deletedUser);
        $this->assertNotNull($deletedUser->deleted_at);

        // Tokens revoked
        $this->assertEquals(0, $this->userA->tokens()->count());

        // Subsequent requests are unauthenticated
        auth()->forgetGuards();
        $this->withHeader('Authorization', "Bearer {$this->tokenA}")
            ->getJson('/api/auth/me')
            ->assertStatus(401);
    }
}
