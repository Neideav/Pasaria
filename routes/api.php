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
use App\Http\Controllers\Api\PaymentWebhookController;

/*
|--------------------------------------------------------------------------
| PASARIA Marketplace API Routes
|--------------------------------------------------------------------------
|
| Strict role-based endpoint grouping:
| 1. Public (Catalog, Discovery, Public Tracking, Guest Preview)
| 2. Rate-limited Auth (Login, Register)
| 3. Authenticated Customer (Sanctum Token)
| 4. Seller Center (Sanctum Token + role:seller,admin)
| 5. Support & Moderation (Sanctum Token + role:support,admin)
| 6. Admin Panel (Sanctum Token + role:admin)
|
*/

// =========================================================================
// 1. PUBLIC DISCOVERY & CATALOG (No Authentication Required)
// =========================================================================
Route::get('/categories', [CategoryApiController::class, 'index']);
Route::get('/products', [ProductApiController::class, 'index']);
Route::get('/products/{slug}', [ProductApiController::class, 'show']);
Route::get('/products/{productId}/reviews', [ReviewApiController::class, 'index']);
Route::get('/products/{productId}/questions', [QuestionApiController::class, 'index']);
Route::get('/shops/following', [ShopApiController::class, 'following'])->middleware('auth:sanctum');
Route::get('/shops/{slugOrId}', [ShopApiController::class, 'show']);
Route::get('/vouchers', [VoucherApiController::class, 'index']);
Route::post('/vouchers/validate', [VoucherApiController::class, 'validateCode']);
Route::get('/deliveries/{code}', [DeliveryApiController::class, 'show']); // Public tracking lookup by tracking number

// Local/Demo Configuration
Route::get('/config', [ConfigApiController::class, 'getDemoMode']);
Route::get('/config/demo-mode', [ConfigApiController::class, 'getDemoMode']);
Route::post('/config/demo-mode', [ConfigApiController::class, 'toggleDemoMode']);

// Guest Order Preview Calculation (does not create orders or deduct stock)
Route::post('/orders/calculate', [OrderApiController::class, 'calculate']);

// Payment Webhooks / Notifications (Authenticated via gateway signature/secret)
Route::post('/payments/webhook/{provider?}', [PaymentWebhookController::class, 'handle']);

// =========================================================================
// 2. AUTHENTICATION & ACCOUNT ACTIVATION (Rate-limited Endpoints)
// =========================================================================
Route::middleware(['throttle:30,1'])->group(function () {
    Route::post('/auth/login', [AuthApiController::class, 'login']);
    Route::post('/auth/register', [AuthApiController::class, 'register']);
    Route::post('/auth/verify-email', [AuthApiController::class, 'verifyEmail']);
    Route::post('/auth/resend-verification', [AuthApiController::class, 'resendVerification'])->middleware('throttle:6,1');
});

// =========================================================================
// 3. AUTHENTICATED CUSTOMER ENDPOINTS (Requires Sanctum Bearer Token & Active Account)
// =========================================================================
Route::middleware(['auth:sanctum', 'account.active'])->group(function () {

    // Identity, Session & Profile
    Route::get('/auth/me', [AuthApiController::class, 'me']);
    Route::get('/user', [AuthApiController::class, 'me']);
    Route::post('/auth/logout', [AuthApiController::class, 'logout']);
    Route::put('/user/profile', [AuthApiController::class, 'updateProfile']);
    Route::put('/user/password', [AuthApiController::class, 'changePassword']);

    // User Addresses (IDOR protected strictly to user_id)
    Route::get('/user/addresses', [AddressApiController::class, 'index']);
    Route::post('/user/addresses', [AddressApiController::class, 'store']);
    Route::put('/user/addresses/{id}', [AddressApiController::class, 'update']);
    Route::delete('/user/addresses/{id}', [AddressApiController::class, 'destroy']);
    Route::post('/user/addresses/{id}/default', [AddressApiController::class, 'setDefault']);

    // Relational Cart
    Route::get('/cart', [CartApiController::class, 'getCart']);
    Route::post('/cart', [CartApiController::class, 'syncCart']);
    Route::post('/cart/item', [CartApiController::class, 'addItem']);
    Route::delete('/cart', [CartApiController::class, 'clearCart']);

    // Server-Controlled Atomic Checkout & Customer Orders
    Route::post('/orders', [OrderApiController::class, 'store']);
    Route::get('/orders', [OrderApiController::class, 'index']);
    Route::get('/orders/{orderNumber}', [OrderApiController::class, 'show']);
    Route::post('/orders/{id}/cancel', [OrderApiController::class, 'cancel']);

    // Customer Deliveries
    Route::get('/deliveries', [DeliveryApiController::class, 'index']);

    // Reviews & Q&A by Customer
    Route::post('/reviews', [ReviewApiController::class, 'store']);
    Route::post('/questions', [QuestionApiController::class, 'store']);

    // Wishlist
    Route::get('/wishlist', [WishlistApiController::class, 'index']);
    Route::post('/wishlist', [WishlistApiController::class, 'store']);
    Route::delete('/wishlist/{productId}', [WishlistApiController::class, 'destroy']);

    // Shop Registration & Following
    Route::post('/shops', [ShopApiController::class, 'store']);
    Route::get('/shops/following', [ShopApiController::class, 'following']);
    Route::post('/shops/{id}/follow', [ShopApiController::class, 'follow']);
    Route::delete('/shops/{id}/follow', [ShopApiController::class, 'unfollow']);

    // Buyer-Seller Messaging (Chat)
    Route::get('/conversations', [ChatApiController::class, 'getConversations']);
    Route::get('/conversations/{id}/messages', [ChatApiController::class, 'getMessages']);
    Route::post('/conversations/messages', [ChatApiController::class, 'sendMessage']);
    Route::post('/conversations/start', [ChatApiController::class, 'startConversation']);

    // Returns & Dispute Escalation
    Route::get('/returns', [ReturnApiController::class, 'index']);
    Route::post('/returns', [ReturnApiController::class, 'store']);
    Route::post('/returns/{id}/dispute', [ReturnApiController::class, 'openDispute']);

    // In-App Notifications
    Route::get('/notifications', [NotificationApiController::class, 'index']);
    Route::post('/notifications/{id}/read', [NotificationApiController::class, 'markAsRead']);
    Route::post('/notifications/read-all', [NotificationApiController::class, 'markAllAsRead']);
});

// =========================================================================
// 4. SELLER CENTER ENDPOINTS (Requires Sanctum + role:seller,admin)
// =========================================================================
Route::middleware(['auth:sanctum', 'account.active', 'role:seller,admin'])->group(function () {
    Route::get('/seller/dashboard', [SellerApiController::class, 'dashboard']);
    Route::get('/seller/products', [SellerApiController::class, 'products']);
    Route::get('/seller/inventory', [SellerApiController::class, 'inventory']);
    Route::get('/seller/orders', [SellerApiController::class, 'orders']);
    Route::put('/seller/products/{id}/stock', [SellerApiController::class, 'updateStock']);
    Route::put('/seller/inventory/{id}/stock', [SellerApiController::class, 'updateStock']);
    Route::get('/seller/finances', [SellerApiController::class, 'finances']);
    Route::post('/seller/payout', [SellerApiController::class, 'requestPayout']);

    // Seller Catalog Management
    Route::post('/products', [ProductApiController::class, 'store']);
    Route::delete('/products/{id}', [ProductApiController::class, 'destroy']);
    Route::put('/shops/{id}', [ShopApiController::class, 'update']);

    // Seller Actions on Orders, Reviews, and Returns
    Route::match(['put', 'patch'], '/orders/{id}/status', [OrderApiController::class, 'updateStatus']);
    Route::post('/reviews/{reviewId}/reply', [ReviewApiController::class, 'reply']);
    Route::post('/questions/{questionId}/answer', [QuestionApiController::class, 'answer']);
    Route::post('/returns/{id}/respond', [ReturnApiController::class, 'sellerRespond']);
    Route::post('/deliveries', [DeliveryApiController::class, 'store']);
});

// =========================================================================
// 5. SUPPORT & MODERATION ENDPOINTS (Requires Sanctum + role:support,admin)
// =========================================================================
Route::middleware(['auth:sanctum', 'account.active', 'role:support,admin'])->group(function () {
    Route::get('/admin/reports', [AdminApiController::class, 'reports']);
    Route::put('/admin/reviews/{id}/moderate', [AdminApiController::class, 'moderateReview']);
});

// =========================================================================
// 6. ADMIN PANEL ENDPOINTS (Requires Sanctum + role:admin)
// =========================================================================
Route::middleware(['auth:sanctum', 'account.active', 'role:admin'])->group(function () {
    Route::get('/admin/dashboard', [AdminApiController::class, 'dashboard']);
    Route::get('/admin/users', [AdminApiController::class, 'users']);
    Route::put('/admin/users/{id}/status', [AdminApiController::class, 'updateUserStatus']);
    Route::get('/admin/sellers', [AdminApiController::class, 'sellers']);
    Route::put('/admin/sellers/{id}/status', [AdminApiController::class, 'updateSellerStatus']);
    Route::get('/admin/audit-logs', [AdminApiController::class, 'auditLogs']);
    Route::post('/disputes/{id}/resolve', [ReturnApiController::class, 'resolveDispute']);

    // Seller Payout Review & Processing
    Route::get('/admin/payouts', [AdminApiController::class, 'payouts']);
    Route::post('/admin/payouts/{id}/approve', [AdminApiController::class, 'approvePayout']);
    Route::post('/admin/payouts/{id}/reject', [AdminApiController::class, 'rejectPayout']);

    // Customer Refunds Review
    Route::get('/admin/refunds', [AdminApiController::class, 'refunds']);
});
