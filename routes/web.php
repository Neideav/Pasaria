<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CartController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\Web\HomeWebController;
use App\Http\Controllers\Web\ProductWebController;
use App\Http\Controllers\Web\CategoryWebController;
use App\Http\Controllers\Web\SearchWebController;
use App\Http\Controllers\Web\CartWebController;
use App\Http\Controllers\Web\CheckoutWebController;
use App\Http\Controllers\Web\OrderWebController;
use App\Http\Controllers\Web\DeliveryWebController;
use App\Http\Controllers\Web\ProfileWebController;
use App\Http\Controllers\Web\SettingsWebController;
use App\Http\Controllers\Web\WishlistWebController;
use App\Http\Controllers\Web\FollowingWebController;
use App\Http\Controllers\Web\SellerWebController;
use App\Http\Controllers\Web\ShopWebController;
use App\Http\Controllers\Web\AdminWebController;
use App\Http\Controllers\Web\AuthWebController;

/*
|--------------------------------------------------------------------------
| PASARIA Marketplace Web (MPA) Routes
|--------------------------------------------------------------------------
|
| Multi-Page Application (MPA) routes:
| Laravel serves dedicated Blade shells with React mounting per page.
| Every main navigation initiates a real document request.
|
*/

// Catalog & Discovery
Route::get('/', [HomeWebController::class, 'index'])->name('home');
Route::get('/products/{slug}', [ProductWebController::class, 'show'])->name('products.show');
Route::get('/category/{slug}', [CategoryWebController::class, 'show'])->name('category.show');
Route::get('/deals', [CategoryWebController::class, 'deals'])->name('deals');
Route::get('/whats-new', [CategoryWebController::class, 'whatsNew'])->name('whats-new');
Route::get('/search', [SearchWebController::class, 'index'])->name('search');

// Cart & Checkout
Route::get('/cart', [CartWebController::class, 'index'])->name('cart.index');
Route::get('/checkout', [CheckoutWebController::class, 'index'])->name('checkout');

// Orders & Delivery Tracking
Route::get('/orders', [OrderWebController::class, 'index'])->name('orders.index');
Route::get('/delivery/{code?}', [DeliveryWebController::class, 'index'])->name('delivery.index');

// Customer Profile, Settings, Wishlist & Following
Route::get('/profile', [ProfileWebController::class, 'index'])->name('profile.index');
Route::get('/settings', [SettingsWebController::class, 'index'])->name('settings.index');
Route::get('/wishlist', [WishlistWebController::class, 'index'])->name('wishlist.index');
Route::get('/following', [FollowingWebController::class, 'index'])->name('following.index');

// Public Shops & Seller Center
Route::get('/shops/{slugOrId}', [ShopWebController::class, 'show'])->name('shops.show');
Route::get('/shop/{slugOrId}', [ShopWebController::class, 'show'])->name('shop.show');
Route::get('/seller/dashboard', [SellerWebController::class, 'dashboard'])->name('seller.dashboard');
Route::get('/seller', [SellerWebController::class, 'dashboard'])->name('seller.index');

// Administration
Route::get('/admin/dashboard', [AdminWebController::class, 'dashboard'])->name('admin.dashboard');
Route::get('/admin', [AdminWebController::class, 'dashboard'])->name('admin.index');

// Authentication Pages
Route::get('/login', [AuthWebController::class, 'login'])->name('login');
Route::get('/register', [AuthWebController::class, 'register'])->name('register');
Route::get('/auth', [AuthWebController::class, 'index'])->name('auth.index');

// Legacy Session / Form Support
Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);
Route::post('/logout', [AuthController::class, 'logout'])->name('logout');
Route::post('/cart/add', [CartController::class, 'add'])->name('cart.add');
Route::post('/cart/update', [CartController::class, 'update'])->name('cart.update');
Route::post('/cart/remove', [CartController::class, 'remove'])->name('cart.remove');
Route::post('/checkout', [OrderController::class, 'store'])->name('checkout.store');
Route::post('/profile', [ProfileController::class, 'update'])->name('profile.update');

// 404 Fallback
Route::fallback(function () {
    if (request()->is('api/*')) {
        return response()->json([
            'success' => false,
            'message' => 'API endpoint not found.',
        ], 404);
    }
    abort(404);
});
