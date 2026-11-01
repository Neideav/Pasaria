<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Shop;
use App\Models\Product;
use App\Models\Category;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;

class MpaArchitectureTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected Shop $shop;
    protected Product $product;
    protected Category $category;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::create([
            'name' => 'Test User',
            'username' => 'testuser',
            'email' => 'test@pasaria.id',
            'password' => Hash::make('password123'),
            'role' => 'customer',
            'status' => 'active',
            'email_verified_at' => now(),
        ]);

        $this->shop = Shop::create([
            'user_id' => $this->user->id,
            'name' => 'Official Store Pasaria',
            'slug' => 'official-store',
            'city' => 'Jakarta Selatan',
            'status' => 'approved',
            'verified' => true,
        ]);

        $this->category = Category::create([
            'name' => 'Audio',
            'slug' => 'audio',
            'icon' => 'headphones',
        ]);

        $this->product = Product::create([
            'shop_id' => $this->shop->id,
            'category_id' => $this->category->id,
            'category' => 'Audio',
            'name' => 'AirPods Max High Fidelity',
            'slug' => 'airpods-max-high-fidelity',
            'image' => 'images/airpods.jpg',
            'price' => 8499000,
            'stock' => 15,
            'description' => 'Headphone premium Apple dengan Active Noise Cancellation.',
            'status' => 'active',
        ]);
    }

    /**
     * 1. Homepage returns 200 and renders MPA document shell with home page data.
     */
    public function test_homepage_returns_200_and_renders_mpa_shell(): void
    {
        $response = $this->get('/');
        $response->assertStatus(200);
        $response->assertSee('id="pasaria-root"', false);
        $response->assertSee('data-page="home"', false);
        $response->assertSee('PASARIA — Modern Multi-Vendor Marketplace', false);
    }

    /**
     * 2. Product detail returns 200 with product slug and metadata.
     */
    public function test_product_detail_page_returns_200_with_product_props(): void
    {
        $response = $this->get("/products/{$this->product->slug}");
        $response->assertStatus(200);
        $response->assertSee('id="pasaria-root"', false);
        $response->assertSee('data-page="product"', false);
        $response->assertSee($this->product->slug, false);
    }

    /**
     * 3. Category page returns 200 with category props.
     */
    public function test_category_page_returns_200_with_category_props(): void
    {
        $response = $this->get("/category/{$this->category->slug}");
        $response->assertStatus(200);
        $response->assertSee('id="pasaria-root"', false);
        $response->assertSee('data-page="category"', false);
        $response->assertSee($this->category->slug, false);
    }

    /**
     * 4. Deals and What's New pages return 200.
     */
    public function test_deals_and_whats_new_pages_return_200(): void
    {
        $resDeals = $this->get('/deals');
        $resDeals->assertStatus(200);
        $resDeals->assertSee('data-page="category"', false);

        $resNew = $this->get('/whats-new');
        $resNew->assertStatus(200);
        $resNew->assertSee('data-page="category"', false);
    }

    /**
     * 5. Search page returns 200 with query parameters.
     */
    public function test_search_page_returns_200_with_search_props(): void
    {
        $response = $this->get('/search?q=headphone');
        $response->assertStatus(200);
        $response->assertSee('id="pasaria-root"', false);
        $response->assertSee('data-page="search"', false);
        $response->assertSee('headphone', false);
    }

    /**
     * 6. Cart and Checkout pages return 200.
     */
    public function test_cart_and_checkout_pages_return_200(): void
    {
        $resCart = $this->get('/cart');
        $resCart->assertStatus(200);
        $resCart->assertSee('data-page="cart"', false);

        $resCheckout = $this->get('/checkout');
        $resCheckout->assertStatus(200);
        $resCheckout->assertSee('data-page="checkout"', false);
    }

    /**
     * 7. Customer account pages (orders, profile, settings, wishlist, following).
     */
    public function test_customer_account_pages_return_200(): void
    {
        $resOrders = $this->get('/orders');
        $resOrders->assertStatus(200);
        $resOrders->assertSee('data-page="orders"', false);

        $resProfile = $this->get('/profile');
        $resProfile->assertStatus(200);
        $resProfile->assertSee('data-page="profile"', false);

        $resSettings = $this->get('/settings');
        $resSettings->assertStatus(200);
        $resSettings->assertSee('data-page="settings"', false);

        $resWishlist = $this->get('/wishlist');
        $resWishlist->assertStatus(200);
        $resWishlist->assertSee('data-page="wishlist"', false);

        $resFollowing = $this->get('/following');
        $resFollowing->assertStatus(200);
        $resFollowing->assertSee('data-page="following"', false);
    }

    /**
     * 8. Delivery tracking page returns 200.
     */
    public function test_delivery_page_returns_200(): void
    {
        $response = $this->get('/delivery');
        $response->assertStatus(200);
        $response->assertSee('data-page="delivery"', false);
    }

    /**
     * 9. Shop public profile and seller center dashboard return 200.
     */
    public function test_shop_and_seller_pages_return_200(): void
    {
        $resShop = $this->get("/shops/{$this->shop->slug}");
        $resShop->assertStatus(200);
        $resShop->assertSee('data-page="shop_profile"', false);

        $resSeller = $this->get('/seller/dashboard');
        $resSeller->assertStatus(200);
        $resSeller->assertSee('data-page="seller_dashboard"', false);
    }

    /**
     * 10. Admin dashboard page returns 200.
     */
    public function test_admin_dashboard_page_returns_200(): void
    {
        $response = $this->get('/admin');
        $response->assertStatus(200);
        $response->assertSee('data-page="admin_dashboard"', false);
    }

    /**
     * 11. Authentication pages (login, register, auth) return 200.
     */
    public function test_auth_pages_return_200(): void
    {
        $resLogin = $this->get('/login');
        $resLogin->assertStatus(200);
        $resLogin->assertSee('data-page="auth"', false);
        $resLogin->assertSee('initialTab":"login"', false);

        $resRegister = $this->get('/register');
        $resRegister->assertStatus(200);
        $resRegister->assertSee('data-page="auth"', false);
        $resRegister->assertSee('initialTab":"register"', false);
    }

    /**
     * 12. Non-existent routes return 404 instead of SPA fallback.
     */
    public function test_non_existent_route_returns_404(): void
    {
        $response = $this->get('/some-non-existent-page-url-404');
        $response->assertStatus(404);
    }
}
