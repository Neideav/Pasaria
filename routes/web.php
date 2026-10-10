<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\SearchController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CartController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\OrderController;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Shopcart Modern E-Commerce Routes
|
*/

// Home & Catalog (serves React SPA if built, otherwise fallback to Blade)
Route::get('/', function () {
    $spaPath = public_path('index.html');
    if (file_exists($spaPath)) {
        return response()->file($spaPath);
    }
    return app(HomeController::class)->index(request());
})->name('home');
Route::get('/products/{slug}', [ProductController::class, 'show'])->name('products.show');
Route::get('/category/{slug}', [HomeController::class, 'category'])->name('category.show');

// Search Route
Route::get('/search', [SearchController::class, 'index'])->name('search');

// Authentication Routes
Route::get('/login', [AuthController::class, 'showLoginForm'])->name('login');
Route::post('/login', [AuthController::class, 'login']);
Route::get('/register', [AuthController::class, 'showRegisterForm'])->name('register');
Route::post('/register', [AuthController::class, 'register']);
Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

// Cart Routes
Route::get('/cart', [CartController::class, 'index'])->name('cart.index');
Route::post('/cart/add', [CartController::class, 'add'])->name('cart.add');
Route::post('/cart/update', [CartController::class, 'update'])->name('cart.update');
Route::post('/cart/remove', [CartController::class, 'remove'])->name('cart.remove');

// Checkout & Orders
Route::get('/checkout', [OrderController::class, 'checkout'])->name('checkout');
Route::post('/checkout', [OrderController::class, 'store'])->name('checkout.store');
Route::get('/orders', [OrderController::class, 'index'])->name('orders.index');

// User Profile
Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'index'])->name('profile.index');
    Route::post('/profile', [ProfileController::class, 'update'])->name('profile.update');
});

// React SPA Fallback Route (serves React frontend when built)
Route::fallback(function () {
    if (request()->is('api/*')) {
        return response()->json(['message' => 'API endpoint not found.'], 404);
    }
    $spaPath = public_path('index.html');
    if (file_exists($spaPath)) {
        return response()->file($spaPath);
    }
    $distPath = base_path('dist/index.html');
    if (file_exists($distPath)) {
        return response()->file($distPath);
    }
    return response()->view('home');
});

