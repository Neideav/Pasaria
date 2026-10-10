# Complete Routing Matrix

Routing matrix for PASARIA Multi-Vendor Marketplace.

## Web routes

| Method | Path | Handler | Description |
|---|---|---|---|
| GET | / | HomeController@index | Serves React SPA if built, otherwise Blade fallback |
| GET | /products/{slug} | ProductController@show | Product detail page |
| GET | /category/{slug} | HomeController@category | Category catalog view |
| GET | /search | SearchController@index | Product search view |
| GET | /login | AuthController@showLoginForm | Login form |
| POST | /login | AuthController@login | Authenticate user session |
| GET | /register | AuthController@showRegisterForm | Registration form |
| POST | /register | AuthController@register | Register new customer |
| POST | /logout | AuthController@logout | Invalidate user session |
| GET | /cart | CartController@index | Cart page view |
| POST | /cart/add | CartController@add | Add item to cart |
| POST | /cart/update | CartController@update | Update item quantity |
| POST | /cart/remove | CartController@remove | Remove item from cart |
| GET | /checkout | OrderController@checkout | Checkout page view |
| POST | /checkout | OrderController@store | Submit order from web |
| GET | /orders | OrderController@index | Buyer orders list |
| GET | /profile | ProfileController@index | Profile settings view |
| POST | /profile | ProfileController@update | Update profile details |
| GET | /sanctum/csrf-cookie | Sanctum CSRF | Issue CSRF cookie |
| GET | /{fallbackPlaceholder} | Fallback SPA | Catch-all route serving React SPA |

## API routes

All API routes are wrapped in global `throttle:api` (60 req/min for guest, 120 req/min for authenticated). Sensitive mutation routes apply specialized named rate limiters.

| Method | Endpoint | Handler | Access |
|---|---|---|---|
| GET | /api/categories | Api\CategoryApiController@index | Public |
| GET | /api/products | Api\ProductApiController@index | Public |
| POST | /api/products | Api\ProductApiController@store | Seller, Admin |
| GET | /api/products/{slug} | Api\ProductApiController@show | Public |
| PUT | /api/products/{id} | Api\ProductApiController@update | Seller, Admin |
| DELETE | /api/products/{id} | Api\ProductApiController@destroy | Seller, Admin |
| PATCH | /api/products/{id}/status | Api\ProductApiController@toggleStatus | Seller, Admin |
| GET | /api/products/{id}/reviews | Api\ReviewApiController@index | Public |
| GET | /api/products/{id}/questions | Api\QuestionApiController@index | Public |
| POST | /api/upload | Api\UploadApiController@upload | Authenticated (throttle:uploads) |
| DELETE | /api/upload | Api\\UploadApiController@delete | Authenticated |
| GET | /api/shops/following | Api\ShopApiController@following | Authenticated |
| GET | /api/shops/{slugOrId} | Api\ShopApiController@show | Public |
| POST | /api/shops | Api\ShopApiController@store | Authenticated |
| PUT | /api/shops/{id} | Api\ShopApiController@update | Seller, Admin |
| POST | /api/shops/{id}/follow | Api\ShopApiController@follow | Authenticated |
| DELETE | /api/shops/{id}/follow | Api\ShopApiController@unfollow | Authenticated |
| GET | /api/vouchers | Api\VoucherApiController@index | Public |
| POST | /api/vouchers/validate | Api\VoucherApiController@validateCode | Public / Authenticated (throttle:vouchers-validate) |
| GET | /api/deliveries | Api\DeliveryApiController@index | Public |
| POST | /api/deliveries | Api\DeliveryApiController@store | Public |
| GET | /api/deliveries/{code} | Api\DeliveryApiController@show | Public |
| POST | /api/auth/login | Api\AuthApiController@login | Public (throttle:auth-login) |
| POST | /api/auth/register | Api\AuthApiController@register | Public (throttle:auth-register) |
| POST | /api/auth/logout | Api\AuthApiController@logout | Authenticated |
| POST | /api/auth/verify-email | Api\AuthApiController@verifyEmail | Public / Authenticated |
| POST | /api/auth/resend-verification | Api\AuthApiController@resendVerification | Public / Authenticated (throttle:auth-resend) |
| GET | /api/auth/me | Api\AuthApiController@me | Authenticated |
| GET | /api/user | Api\AuthApiController@me | Authenticated |
| PUT | /api/user/profile | Api\AuthApiController@updateProfile | Authenticated |
| PUT | /api/user/password | Api\AuthApiController@changePassword | Authenticated |
| GET | /api/user/addresses | Api\AddressApiController@index | Authenticated |
| POST | /api/user/addresses | Api\AddressApiController@store | Authenticated |
| PUT | /api/user/addresses/{id} | Api\AddressApiController@update | Authenticated |
| DELETE | /api/user/addresses/{id} | Api\AddressApiController@destroy | Authenticated |
| POST | /api/user/addresses/{id}/default | Api\AddressApiController@setDefault | Authenticated |
| GET | /api/cart | Api\CartApiController@getCart | Public or Authenticated |
| POST | /api/cart | Api\CartApiController@syncCart | Public or Authenticated |
| POST | /api/cart/item | Api\CartApiController@addItem | Public or Authenticated |
| DELETE | /api/cart | Api\CartApiController@clearCart | Public or Authenticated |
| POST | /api/orders/calculate | Api\OrderApiController@calculate | Authenticated |
| POST | /api/orders | Api\OrderApiController@store | Authenticated (throttle:orders-create) |
| GET | /api/orders | Api\OrderApiController@index | Authenticated |
| GET | /api/orders/{orderNumber} | Api\OrderApiController@show | Authenticated |
| PUT,PATCH | /api/orders/{id}/status | Api\OrderApiController@updateStatus | Authenticated |
| POST | /api/orders/{id}/cancel | Api\OrderApiController@cancel | Authenticated |
| POST | /api/payments/webhook/{provider?} | Api\PaymentWebhookController@handle | Public (Gateway Signature Auth) |
| POST | /api/reviews | Api\ReviewApiController@store | Authenticated |
| POST | /api/reviews/{id}/reply | Api\ReviewApiController@reply | Seller |
| POST | /api/questions | Api\QuestionApiController@store | Authenticated |
| POST | /api/questions/{id}/answer | Api\QuestionApiController@answer | Seller |
| GET | /api/wishlist | Api\WishlistApiController@index | Authenticated |
| POST | /api/wishlist | Api\WishlistApiController@store | Authenticated |
| DELETE | /api/wishlist/{productId} | Api\WishlistApiController@destroy | Authenticated |
| GET | /api/conversations | Api\ChatApiController@getConversations | Authenticated |
| POST | /api/conversations/start | Api\ChatApiController@startConversation | Authenticated |
| GET | /api/conversations/{id}/messages | Api\ChatApiController@getMessages | Authenticated |
| POST | /api/conversations/messages | Api\ChatApiController@sendMessage | Authenticated (throttle:messages-send) |
| GET | /api/returns | Api\ReturnApiController@index | Authenticated |
| POST | /api/returns | Api\ReturnApiController@store | Authenticated |
| POST | /api/returns/{id}/respond | Api\ReturnApiController@sellerRespond | Seller |
| POST | /api/returns/{id}/dispute | Api\ReturnApiController@openDispute | Authenticated |
| POST | /api/disputes/{id}/resolve | Api\ReturnApiController@resolveDispute | Admin |
| GET | /api/notifications | Api\NotificationApiController@index | Authenticated |
| POST | /api/notifications/{id}/read | Api\NotificationApiController@markAsRead | Authenticated |
| POST | /api/notifications/read-all | Api\NotificationApiController@markAllAsRead | Authenticated |
| GET | /api/seller/dashboard | Api\SellerApiController@dashboard | Seller |
| GET | /api/seller/products | Api\SellerApiController@products | Seller |
| GET | /api/seller/inventory | Api\SellerApiController@inventory | Seller |
| GET | /api/seller/orders | Api\SellerApiController@orders | Seller |
| PUT | /api/seller/inventory/{id}/stock | Api\SellerApiController@updateStock | Seller |
| PUT | /api/seller/products/{id}/stock | Api\\SellerApiController@updateStock | Seller |
| GET | /api/seller/finances | Api\SellerApiController@finances | Seller |
| POST | /api/seller/payout | Api\SellerApiController@requestPayout | Seller |
| GET | /api/admin/dashboard | Api\AdminApiController@dashboard | Admin |
| GET | /api/admin/users | Api\AdminApiController@users | Admin |
| PUT | /api/admin/users/{id}/status | Api\AdminApiController@updateUserStatus | Admin |
| GET | /api/admin/sellers | Api\AdminApiController@sellers | Admin |
| PUT | /api/admin/sellers/{id}/status | Api\AdminApiController@updateSellerStatus | Admin |
| PUT | /api/admin/reviews/{id}/moderate | Api\AdminApiController@moderateReview | Admin |
| GET | /api/admin/audit-logs | Api\AdminApiController@auditLogs | Admin |
| GET | /api/admin/reports | Api\AdminApiController@reports | Admin |
| GET | /api/admin/payouts | Api\AdminApiController@payouts | Admin |
| POST | /api/admin/payouts/{id}/approve | Api\AdminApiController@approvePayout | Admin |
| POST | /api/admin/payouts/{id}/reject | Api\AdminApiController@rejectPayout | Admin |
| GET | /api/admin/refunds | Api\AdminApiController@refunds | Admin |
| GET | /api/config | Api\ConfigApiController@getDemoMode | Public |
| GET | /api/config/demo-mode | Api\ConfigApiController@getDemoMode | Public |
| POST | /api/config/demo-mode | Api\ConfigApiController@toggleDemoMode | Public |
