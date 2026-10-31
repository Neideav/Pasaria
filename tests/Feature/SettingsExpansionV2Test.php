<?php

namespace Tests\Feature;

use App\Models\Brand;
use App\Models\Category;
use App\Models\Notification;
use App\Models\Product;
use App\Models\ProductAlert;
use App\Models\SellerPreference;
use App\Models\Shop;
use App\Models\User;
use App\Models\UserNotificationPreference;
use App\Models\UserPrivacyPreference;
use App\Models\UserShoppingPreference;
use App\Models\UserTwoFactorAuth;
use App\Services\TotpService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class SettingsExpansionV2Test extends TestCase
{
    use RefreshDatabase;

    protected User $customer;
    protected User $sellerUser;
    protected Shop $sellerShop;
    protected Product $product;
    protected string $customerToken;
    protected string $sellerToken;

    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();

        // Create Customer
        $this->customer = User::create([
            'name'              => 'Ahmad Customer',
            'username'          => 'ahmadcustomer',
            'email'             => 'ahmad@pasaria.id',
            'password'          => Hash::make('Password123!'),
            'role'              => 'customer',
            'status'            => 'active',
            'phone'             => '081234567890',
            'city'              => 'Jakarta',
            'address'           => 'Jl. Sudirman No. 12',
            'email_verified_at' => now(),
        ]);
        $this->customerToken = $this->customer->createToken('customer_token')->plainTextToken;

        // Create Seller
        $this->sellerUser = User::create([
            'name'              => 'Bambang Seller',
            'username'          => 'bambangseller',
            'email'             => 'bambang@pasaria.id',
            'password'          => Hash::make('Password123!'),
            'role'              => 'seller',
            'status'            => 'active',
            'phone'             => '081987654321',
            'city'              => 'Bandung',
            'address'           => 'Jl. Asia Afrika No. 5',
            'email_verified_at' => now(),
        ]);
        $this->sellerToken = $this->sellerUser->createToken('seller_token')->plainTextToken;

        $this->sellerShop = Shop::create([
            'user_id'     => $this->sellerUser->id,
            'name'        => 'Toko Audio Official',
            'slug'        => 'toko-audio-official',
            'slogan'      => 'Pusat Audio Terbaik',
            'city'        => 'Bandung',
            'status'      => 'approved',
            'verified'    => true,
            'rating'      => 4.9,
            'total_sales' => 0,
        ]);

        $category = Category::create([
            'name' => 'Elektronik',
            'slug' => 'elektronik',
        ]);

        $this->product = Product::create([
            'shop_id'     => $this->sellerShop->id,
            'shop_name'   => $this->sellerShop->name,
            'name'        => 'Headphone Wireless Pro',
            'slug'        => 'headphone-wireless-pro',
            'category'    => $category->name,
            'price'       => 500000.00,
            'stock'       => 20,
            'image'       => 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e',
            'is_active'   => true,
            'description' => 'Headphone suara jernih dengan noise cancelling.',
        ]);
    }

    /**
     * 1. Login with 2FA enabled requires second factor and DOES NOT issue a Sanctum token.
     */
    public function test_login_with_2fa_enabled_requires_challenge_without_token(): void
    {
        $totp = new TotpService();
        $secret = $totp->generateSecret();
        $plainRecoveryCodes = ['ABCD-1234', 'EFGH-5678'];
        $hashedCodes = array_map(fn($c) => Hash::make($c), $plainRecoveryCodes);

        UserTwoFactorAuth::create([
            'user_id'             => $this->customer->id,
            'enabled'             => true,
            'secret'              => $secret,
            'recovery_codes_json' => $hashedCodes,
            'confirmed_at'        => now(),
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email'    => 'ahmad@pasaria.id',
            'password' => 'Password123!',
        ]);

        $response->assertStatus(200);
        $this->assertTrue($response->json('two_factor_required'));
        $this->assertNotEmpty($response->json('challenge_token'));
        $this->assertNull($response->json('token')); // Strict: No Sanctum token!
    }

    /**
     * 2. 2FA challenge verification with valid TOTP code issues full token.
     */
    public function test_2fa_challenge_verification_with_totp_succeeds(): void
    {
        $totp = new TotpService();
        $secret = $totp->generateSecret();

        UserTwoFactorAuth::create([
            'user_id'             => $this->customer->id,
            'enabled'             => true,
            'secret'              => $secret,
            'recovery_codes_json' => [],
            'confirmed_at'        => now(),
        ]);

        // Login to get challenge token
        $loginResp = $this->postJson('/api/auth/login', [
            'email'    => 'ahmad@pasaria.id',
            'password' => 'Password123!',
        ]);
        $challengeToken = $loginResp->json('challenge_token');

        // Invalid code fails
        $badCodeResp = $this->postJson('/api/auth/two-factor-challenge', [
            'challenge_token' => $challengeToken,
            'code'            => '000000',
        ]);
        $badCodeResp->assertStatus(422);

        // Valid code succeeds
        $validCode = $totp->calculateCode($secret, (int) floor(time() / 30));
        $goodCodeResp = $this->postJson('/api/auth/two-factor-challenge', [
            'challenge_token' => $challengeToken,
            'code'            => $validCode,
        ]);

        $goodCodeResp->assertStatus(200);
        $this->assertTrue($goodCodeResp->json('success'));
        $this->assertNotEmpty($goodCodeResp->json('token'));
        $this->assertEquals($this->customer->email, $goodCodeResp->json('user.email'));

        // Replay attack on used challenge token fails
        $replayResp = $this->postJson('/api/auth/two-factor-challenge', [
            'challenge_token' => $challengeToken,
            'code'            => $validCode,
        ]);
        $replayResp->assertStatus(422);
    }

    /**
     * 3. 2FA challenge verification with recovery code burns the used recovery code.
     */
    public function test_2fa_challenge_with_recovery_code_burns_code(): void
    {
        $totp = new TotpService();
        $secret = $totp->generateSecret();
        $plainCodes = ['CODE-AAA1', 'CODE-BBB2'];
        $hashedCodes = array_map(fn($c) => Hash::make($c), $plainCodes);

        $twoFactor = UserTwoFactorAuth::create([
            'user_id'             => $this->customer->id,
            'enabled'             => true,
            'secret'              => $secret,
            'recovery_codes_json' => $hashedCodes,
            'confirmed_at'        => now(),
        ]);

        $loginResp = $this->postJson('/api/auth/login', [
            'email'    => 'ahmad@pasaria.id',
            'password' => 'Password123!',
        ]);
        $challengeToken = $loginResp->json('challenge_token');

        // Verify with first recovery code
        $resp = $this->postJson('/api/auth/two-factor-challenge', [
            'challenge_token' => $challengeToken,
            'recovery_code'   => 'CODE-AAA1',
        ]);
        $resp->assertStatus(200);
        $this->assertNotEmpty($resp->json('token'));

        // Check recovery codes count decremented
        $twoFactor->refresh();
        $this->assertCount(1, $twoFactor->recovery_codes_json);

        // Attempting to reuse the same recovery code on a new login fails
        $loginResp2 = $this->postJson('/api/auth/login', [
            'email'    => 'ahmad@pasaria.id',
            'password' => 'Password123!',
        ]);
        $challengeToken2 = $loginResp2->json('challenge_token');

        $reuseResp = $this->postJson('/api/auth/two-factor-challenge', [
            'challenge_token' => $challengeToken2,
            'recovery_code'   => 'CODE-AAA1',
        ]);
        $reuseResp->assertStatus(422);
    }

    /**
     * 4. Shopping preferences CRUD and min/max price validation.
     */
    public function test_shopping_preferences_crud_and_validation(): void
    {
        // Get initial preferences (defaults)
        $getResp = $this->withHeader('Authorization', "Bearer {$this->customerToken}")
            ->getJson('/api/user/shopping-preferences');
        $getResp->assertStatus(200);
        $this->assertTrue($getResp->json('success'));
        $this->assertEquals('popular', $getResp->json('data.default_sort'));
        $this->assertIsArray($getResp->json('available_categories'));

        // Invalid: min_price > max_price -> 422
        $badPriceResp = $this->withHeader('Authorization', "Bearer {$this->customerToken}")
            ->putJson('/api/user/shopping-preferences', [
                'min_price' => 500000,
                'max_price' => 100000,
            ]);
        $badPriceResp->assertStatus(422);

        // Valid update
        $updateResp = $this->withHeader('Authorization', "Bearer {$this->customerToken}")
            ->putJson('/api/user/shopping-preferences', [
                'favorite_categories'        => ['elektronik'],
                'favorite_brands'            => ['Sony', 'Bose'],
                'min_price'                  => 100000,
                'max_price'                  => 2000000,
                'hide_out_of_stock'          => true,
                'prioritize_official_stores' => true,
                'default_sort'               => 'price_asc',
                'preferred_density'          => 'compact',
                'theme'                      => 'dark',
                'font_size'                  => 'large',
                'reduced_motion'             => true,
                'high_contrast'              => true,
            ]);

        $updateResp->assertStatus(200);
        $this->assertTrue($updateResp->json('success'));

        $pref = UserShoppingPreference::where('user_id', $this->customer->id)->first();
        $this->assertNotNull($pref);
        $this->assertEquals(['elektronik'], $pref->favorite_categories);
        $this->assertTrue($pref->hide_out_of_stock);
        $this->assertTrue($pref->prioritize_official_stores);
        $this->assertEquals('price_asc', $pref->default_sort);
        $this->assertEquals('compact', $pref->preferred_density);
        $this->assertEquals('dark', $pref->theme);
        $this->assertEquals('large', $pref->font_size);
        $this->assertTrue($pref->reduced_motion);
        $this->assertTrue($pref->high_contrast);
    }

    /**
     * 5. Product alert lifecycle (create, list, pause/resume, delete).
     */
    public function test_product_alerts_lifecycle(): void
    {
        // Create price drop alert
        $createResp = $this->withHeader('Authorization', "Bearer {$this->customerToken}")
            ->postJson('/api/user/product-alerts', [
                'product_id'   => $this->product->id,
                'alert_type'   => 'price_drop',
                'target_price' => 450000,
            ]);
        $createResp->assertStatus(201);
        $alertId = $createResp->json('data.id');

        // List alerts
        $listResp = $this->withHeader('Authorization', "Bearer {$this->customerToken}")
            ->getJson('/api/user/product-alerts');
        $listResp->assertStatus(200);
        $this->assertCount(1, $listResp->json('data'));
        $this->assertEquals('Headphone Wireless Pro', $listResp->json('data.0.product.name'));

        // Pause alert
        $pauseResp = $this->withHeader('Authorization', "Bearer {$this->customerToken}")
            ->putJson("/api/user/product-alerts/{$alertId}", [
                'is_active' => false,
            ]);
        $pauseResp->assertStatus(200);
        $this->assertFalse($pauseResp->json('data.is_active'));

        // Delete alert
        $delResp = $this->withHeader('Authorization', "Bearer {$this->customerToken}")
            ->deleteJson("/api/user/product-alerts/{$alertId}");
        $delResp->assertStatus(200);
        $this->assertEquals(0, ProductAlert::where('user_id', $this->customer->id)->count());
    }

    /**
     * 6. Product price change triggers eligible price-drop alerts into notification inbox.
     */
    public function test_product_price_drop_triggers_in_app_notification(): void
    {
        // Customer creates alert on product
        ProductAlert::create([
            'user_id'             => $this->customer->id,
            'product_id'          => $this->product->id,
            'alert_type'          => 'price_drop',
            'is_active'           => true,
            'last_observed_price' => 500000,
        ]);

        $this->assertEquals(0, Notification::where('user_id', $this->customer->id)->count());

        // Seller drops product price from 500.000 to 450.000
        $updateResp = $this->withHeader('Authorization', "Bearer {$this->sellerToken}")
            ->putJson("/api/products/{$this->product->id}", [
                'price' => 450000,
            ]);
        $updateResp->assertStatus(200);

        // Verify notification dispatched
        $notifs = Notification::where('user_id', $this->customer->id)->get();
        $this->assertCount(1, $notifs);
        $this->assertEquals('price_alert', $notifs->first()->type);
        $this->assertStringContainsString('450.000', $notifs->first()->message);
    }

    /**
     * 7. Product stock transition from 0 to >0 triggers back-in-stock alerts.
     */
    public function test_product_stock_replenishment_triggers_back_in_stock_notification(): void
    {
        $this->product->stock = 0;
        $this->product->save();

        ProductAlert::create([
            'user_id'             => $this->customer->id,
            'product_id'          => $this->product->id,
            'alert_type'          => 'back_in_stock',
            'is_active'           => true,
            'last_observed_price' => $this->product->price,
        ]);

        // Seller updates stock to 15
        $stockResp = $this->withHeader('Authorization', "Bearer {$this->sellerToken}")
            ->putJson("/api/seller/products/{$this->product->id}/stock", [
                'stock' => 15,
            ]);
        $stockResp->assertStatus(200);

        $notifs = Notification::where('user_id', $this->customer->id)->get();
        $this->assertCount(1, $notifs);
        $this->assertEquals('stock_alert', $notifs->first()->type);
        $this->assertStringContainsString('15 unit', $notifs->first()->message);
    }

    /**
     * 8. Quiet hours suppresses non-essential notifications.
     */
    public function test_quiet_hours_suppresses_non_essential_notifications(): void
    {
        // Configure customer quiet hours to be currently active
        $nowTime = Carbon::now('Asia/Jakarta');
        $startStr = $nowTime->copy()->subHour()->format('H:i');
        $endStr = $nowTime->copy()->addHour()->format('H:i');

        $pref = UserNotificationPreference::getOrCreateForUser($this->customer->id);
        $pref->quiet_hours_enabled = true;
        $pref->quiet_hours_start = $startStr;
        $pref->quiet_hours_end = $endStr;
        $pref->timezone = 'Asia/Jakarta';
        $pref->save();

        // Optional promo notification must be suppressed
        $promoNotif = \App\Services\NotificationDispatcher::dispatch(
            $this->customer->id,
            'Promo Weekend',
            'Diskon 50% untuk Anda',
            'promo'
        );
        $this->assertNull($promoNotif);

        // Essential security notification must NEVER be suppressed
        $secNotif = \App\Services\NotificationDispatcher::dispatch(
            $this->customer->id,
            'Keamanan Akun',
            'Sesi baru terdeteksi',
            'security'
        );
        $this->assertNotNull($secNotif);
    }

    /**
     * 9. Activity history: search tracking, viewed products, and privacy suppression.
     */
    public function test_activity_history_and_privacy_controls(): void
    {
        // 1. Record search
        $searchResp = $this->withHeader('Authorization', "Bearer {$this->customerToken}")
            ->postJson('/api/user/activity/recent-searches', [
                'query' => 'headphone bluetooth',
            ]);
        $searchResp->assertStatus(200);
        $this->assertTrue($searchResp->json('tracked'));

        // List searches
        $getSearchResp = $this->withHeader('Authorization', "Bearer {$this->customerToken}")
            ->getJson('/api/user/activity/recent-searches');
        $getSearchResp->assertStatus(200);
        $this->assertCount(1, $getSearchResp->json('data'));

        // 2. Record viewed product
        $viewResp = $this->withHeader('Authorization', "Bearer {$this->customerToken}")
            ->postJson('/api/user/activity/recently-viewed', [
                'product_id' => $this->product->id,
            ]);
        $viewResp->assertStatus(200);
        $this->assertTrue($viewResp->json('tracked'));

        $getViewResp = $this->withHeader('Authorization', "Bearer {$this->customerToken}")
            ->getJson('/api/user/activity/recently-viewed');
        $getViewResp->assertStatus(200);
        $this->assertCount(1, $getViewResp->json('data'));
        $this->assertEquals($this->product->name, $getViewResp->json('data.0.product.name'));

        // 3. Disable activity logging in privacy preferences
        $this->withHeader('Authorization', "Bearer {$this->customerToken}")
            ->putJson('/api/user/privacy-preferences', [
                'activity_logging' => false,
            ]);

        // Further tracking is blocked
        $blockedSearch = $this->withHeader('Authorization', "Bearer {$this->customerToken}")
            ->postJson('/api/user/activity/recent-searches', [
                'query' => 'mechanical keyboard',
            ]);
        $this->assertFalse($blockedSearch->json('tracked'));

        // 4. Clear search history does not delete viewed products or other data
        $clearResp = $this->withHeader('Authorization', "Bearer {$this->customerToken}")
            ->deleteJson('/api/user/activity/recent-searches');
        $clearResp->assertStatus(200);

        $this->assertEquals(0, \App\Models\UserSearchHistory::where('user_id', $this->customer->id)->count());
        $this->assertEquals(1, \App\Models\UserViewedProduct::where('user_id', $this->customer->id)->count());
    }

    /**
     * 10. Seller preferences: vacation mode blocks checkout in backend.
     */
    public function test_seller_vacation_mode_blocks_checkout(): void
    {
        // Seller enables vacation mode
        $prefResp = $this->withHeader('Authorization', "Bearer {$this->sellerToken}")
            ->putJson('/api/seller/preferences', [
                'vacation_mode'    => true,
                'vacation_message' => 'Toko sedang tutup libur Idul Fitri hingga minggu depan.',
            ]);
        $prefResp->assertStatus(200);
        $this->assertTrue($prefResp->json('data.vacation_mode'));

        // Customer attempts to checkout product from vacation shop
        $orderPayload = [
            'items' => [
                [
                    'product_id' => $this->product->id,
                    'quantity'   => 1,
                ]
            ],
            'shipping_address' => 'Jl. Merdeka No. 10 Jakarta',
            'payment_method'   => 'bank_transfer',
        ];

        $checkoutResp = $this->withHeader('Authorization', "Bearer {$this->customerToken}")
            ->postJson('/api/orders', $orderPayload);

        // Must be rejected with friendly explanation!
        $checkoutResp->assertStatus(422);
        $this->assertStringContainsString('mode libur', $checkoutResp->json('message'));
    }

    /**
     * 11. Seller low-stock alert triggers when stock <= threshold.
     */
    public function test_seller_low_stock_alert_triggers_notification(): void
    {
        // Seller configures low stock threshold = 3
        SellerPreference::updateOrCreate(
            ['shop_id' => $this->sellerShop->id],
            [
                'user_id'             => $this->sellerUser->id,
                'low_stock_threshold' => 3,
                'notify_low_stock'    => true,
            ]
        );

        $this->product->stock = 3;
        $this->product->save();

        \App\Services\SellerAlertService::handleLowStock($this->product);

        $sellerNotifs = Notification::where('user_id', $this->sellerUser->id)->get();
        $this->assertCount(1, $sellerNotifs);
        $this->assertStringContainsString('Peringatan Stok Menipis', $sellerNotifs->first()->title);
    }

    /**
     * 12. Followed shop preference: toggle new product notification per shop.
     */
    public function test_followed_shop_notification_toggle(): void
    {
        // Follow shop
        $this->withHeader('Authorization', "Bearer {$this->customerToken}")
            ->postJson("/api/shops/{$this->sellerShop->id}/follow")
            ->assertStatus(200);

        // Update follow preference to disable alerts
        $toggleResp = $this->withHeader('Authorization', "Bearer {$this->customerToken}")
            ->putJson("/api/shops/{$this->sellerShop->id}/follow-preferences", [
                'notify_new_products' => false,
            ]);

        $toggleResp->assertStatus(200);
        $this->assertFalse($toggleResp->json('notify_new_products'));

        $record = DB::table('shop_followers')
            ->where('user_id', $this->customer->id)
            ->where('shop_id', $this->sellerShop->id)
            ->first();

        $this->assertEquals(0, $record->notify_new_products);
    }
}
