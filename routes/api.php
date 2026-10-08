<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\CategoryApiController;
use App\Http\Controllers\Api\ProductApiController;
use App\Http\Controllers\Api\AuthApiController;
use App\Http\Controllers\Api\AddressApiController;
use App\Http\Controllers\Api\OrderApiController;
use App\Http\Controllers\Api\CartApiController;
use App\Http\Controllers\Api\DeliveryApiController;
use App\Http\Controllers\Api\ReviewApiController;
use App\Http\Controllers\Api\QuestionApiController;
use App\Http\Controllers\Api\WishlistApiController;
use App\Http\Controllers\Api\ShopApiController;
use App\Http\Controllers\Api\VoucherApiController;
use App\Http\Controllers\Api\ChatApiController;
use App\Http\Controllers\Api\SellerApiController;
use App\Http\Controllers\Api\AdminApiController;
use App\Http\Controllers\Api\ReturnApiController;
use App\Http\Controllers\Api\NotificationApiController;
use App\Http\Controllers\Api\ConfigApiController;

/*
|--------------------------------------------------------------------------
| PASARIA Marketplace API Routes
|--------------------------------------------------------------------------
|
| Single Source of Truth for PASARIA Multi-Vendor E-Commerce Platform.
| Supports Sanctum cookie/token authentication, authorization policies,
| and server-controlled business transactions.
|
*/

// ==========================================
// 1. PUBLIC CATALOG & DISCOVERY
// ==========================================
Route::get('/categories', [CategoryApiController::class, 'index']);
Route::get('/products', [ProductApiController::class, 'index']);
Route::get('/products/{slug}', [ProductApiController::class, 'show']);
Route::get('/products/{productId}/reviews', [ReviewApiController::class, 'index']);
Route::get('/products/{productId}/questions', [QuestionApiController::class, 'index']);
Route::get('/shops/following', [ShopApiController::class, 'following']);
Route::get('/shops/{slugOrId}', [ShopApiController::class, 'show']);
Route::get('/vouchers', [VoucherApiController::class, 'index']);
Route::post('/vouchers/validate', [VoucherApiController::class, 'validateCode']);

// Deliveries Tracking
Route::get('/deliveries', [DeliveryApiController::class, 'index']);
Route::get('/deliveries/{code}', [DeliveryApiController::class, 'show']);
Route::post('/deliveries', [DeliveryApiController::class, 'store']);

// ==========================================
// 2. AUTHENTICATION (SANCTUM)
// ==========================================
Route::post('/auth/login', [AuthApiController::class, 'login']);
Route::post('/auth/register', [AuthApiController::class, 'register']);
Route::post('/auth/logout', [AuthApiController::class, 'logout']);
Route::get('/auth/me', [AuthApiController::class, 'me']);
Route::get('/user', [AuthApiController::class, 'me']);
Route::put('/user/profile', [AuthApiController::class, 'updateProfile']);
Route::put('/user/password', [AuthApiController::class, 'changePassword']);

// ==========================================
// 3. USER ADDRESSES
// ==========================================
Route::get('/user/addresses', [AddressApiController::class, 'index']);
Route::post('/user/addresses', [AddressApiController::class, 'store']);
Route::put('/user/addresses/{id}', [AddressApiController::class, 'update']);
Route::delete('/user/addresses/{id}', [AddressApiController::class, 'destroy']);
Route::post('/user/addresses/{id}/default', [AddressApiController::class, 'setDefault']);

// ==========================================
// 4. CART & SERVER-PRICED CHECKOUT
// ==========================================
Route::get('/cart', [CartApiController::class, 'getCart']);
Route::post('/cart', [CartApiController::class, 'syncCart']);
Route::post('/cart/item', [CartApiController::class, 'addItem']);
Route::delete('/cart', [CartApiController::class, 'clearCart']);

Route::post('/orders/calculate', [OrderApiController::class, 'calculate']);
Route::post('/orders', [OrderApiController::class, 'store']);
Route::get('/orders', [OrderApiController::class, 'index']);
Route::get('/orders/{orderNumber}', [OrderApiController::class, 'show']);
Route::match(['put', 'patch'], '/orders/{id}/status', [OrderApiController::class, 'updateStatus']);
Route::post('/orders/{id}/cancel', [OrderApiController::class, 'cancel']);

// ==========================================
// 5. REVIEWS, RATINGS & QUESTIONS
// ==========================================
Route::post('/reviews', [ReviewApiController::class, 'store']);
Route::post('/reviews/{reviewId}/reply', [ReviewApiController::class, 'reply']);
Route::post('/questions', [QuestionApiController::class, 'store']);
Route::post('/questions/{questionId}/answer', [QuestionApiController::class, 'answer']);

// ==========================================
// 6. WISHLIST & SHOP FOLLOWING
// ==========================================
Route::get('/wishlist', [WishlistApiController::class, 'index']);
Route::post('/wishlist', [WishlistApiController::class, 'store']);
Route::delete('/wishlist/{productId}', [WishlistApiController::class, 'destroy']);

Route::post('/shops', [ShopApiController::class, 'store']);
Route::put('/shops/{id}', [ShopApiController::class, 'update']);
Route::post('/shops/{id}/follow', [ShopApiController::class, 'follow']);
Route::delete('/shops/{id}/follow', [ShopApiController::class, 'unfollow']);

// ==========================================
// 7. CHAT (BUYER-SELLER MESSAGING)
// ==========================================
Route::get('/conversations', [ChatApiController::class, 'getConversations']);
Route::get('/conversations/{id}/messages', [ChatApiController::class, 'getMessages']);
Route::post('/conversations/messages', [ChatApiController::class, 'sendMessage']);
Route::post('/conversations/start', [ChatApiController::class, 'startConversation']);

// ==========================================
// 8. RETURNS, REFUNDS & DISPUTES
// ==========================================
Route::get('/returns', [ReturnApiController::class, 'index']);
Route::post('/returns', [ReturnApiController::class, 'store']);
Route::post('/returns/{id}/respond', [ReturnApiController::class, 'sellerRespond']);
Route::post('/returns/{id}/dispute', [ReturnApiController::class, 'openDispute']);
Route::post('/disputes/{id}/resolve', [ReturnApiController::class, 'resolveDispute']);

// ==========================================
// 9. IN-APP NOTIFICATIONS
// ==========================================
Route::get('/notifications', [NotificationApiController::class, 'index']);
Route::post('/notifications/{id}/read', [NotificationApiController::class, 'markAsRead']);
Route::post('/notifications/read-all', [NotificationApiController::class, 'markAllAsRead']);

// ==========================================
// 10. SELLER CENTER ENDPOINTS
// ==========================================
Route::get('/seller/dashboard', [SellerApiController::class, 'dashboard']);
Route::get('/seller/products', [SellerApiController::class, 'products']);
Route::get('/seller/inventory', [SellerApiController::class, 'inventory']);
Route::get('/seller/orders', [SellerApiController::class, 'orders']);
Route::put('/seller/products/{id}/stock', [SellerApiController::class, 'updateStock']);
Route::get('/seller/finances', [SellerApiController::class, 'finances']);
Route::post('/seller/payout', [SellerApiController::class, 'requestPayout']);
Route::post('/products', [ProductApiController::class, 'store']);
Route::delete('/products/{id}', [ProductApiController::class, 'destroy']);

// ==========================================
// 11. ADMIN PANEL & MODERATION
// ==========================================
Route::get('/admin/dashboard', [AdminApiController::class, 'dashboard']);
Route::get('/admin/users', [AdminApiController::class, 'users']);
Route::put('/admin/users/{id}/status', [AdminApiController::class, 'updateUserStatus']);
Route::get('/admin/sellers', [AdminApiController::class, 'sellers']);
Route::put('/admin/sellers/{id}/status', [AdminApiController::class, 'updateSellerStatus']);
Route::put('/admin/reviews/{id}/moderate', [AdminApiController::class, 'moderateReview']);
Route::get('/admin/audit-logs', [AdminApiController::class, 'auditLogs']);
Route::get('/admin/reports', [AdminApiController::class, 'reports']);

// ==========================================
// 12. CONFIG & LOCAL EDUCATIONAL DEMO
// ==========================================
Route::get('/config/demo-mode', [ConfigApiController::class, 'getDemoMode']);
Route::post('/config/demo-mode', [ConfigApiController::class, 'toggleDemoMode']);
