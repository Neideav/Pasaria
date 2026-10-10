# Codebase Reference (PASARIA Marketplace)

Deep factual reference for AI agents and developers. **Last verified: 2026-10-10.**
If you modify code that alters architecture, models, routes, or services documented here, update this file in the same change.
Consult [`AGENTS.md`](./AGENTS.md) for working instructions and operational boundaries.

> If this file is older than 4 weeks, verify schema and routes against `database/migrations/` and `routes/api.php` before trusting it.

## Technology stack matrix

<!-- BEGIN AUTO GENERATED: STACK_MATRIX -->
| Layer | Technology | Details |
|---|---|---|
| Backend framework | Laravel 11.57.0 | PHP 8.2+ runtime, strict PSR-4 autoloading |
| Database | MariaDB / MySQL | Relational engine with foreign key constraints, SQLite for tests |
| API authentication | Laravel Sanctum 4.0 | Bearer token authorization via personal_access_tokens |
| Frontend framework | React 19.3.0 | TypeScript 7.0.2, Single Page Application |
| Bundler and tooling | Vite 8.3.4 | Tailwind CSS v4.3.3, Lucide React icons, UI Motion physics tokens |
| Test suite | PHPUnit 11.0.0 | Unit and Feature tests with in-memory SQLite |
| Container runtime | Docker | Multi-stage build (Node 22 builder into PHP 8.2 Apache) |
<!-- END AUTO GENERATED: STACK_MATRIX -->

## Architecture data flow

```text
HTTP Request (React 19 SPA / Client)
  │
  ▼
routes/api.php (Route dispatcher and middleware assignment, wrapped in throttle:api)
  │
  ▼
Sanctum Middleware (Bearer token resolution via personal_access_tokens)
  │
  ▼
app/Http/Controllers/Api/ (Thin HTTP controllers)
  │
  ├─- FormRequest validation (Payload structure and permission checks)
  │
  ├─- app/Services/ (Core domain services)
  │     ├─- PricingService (Server-side calculations for tax, shipping, vouchers)
  │     ├─- CheckoutService (Atomic multi-vendor order and shipment creation)
  │     ├─- OrderStateMachine (Order status lifecycle and transition guards)
  │     ├─- RefundService (Refund processing and gateway integration)
  │     └─- LedgerService (Financial ledger and wallet reconciliation)
  │
  ├─- app/Models/ (Eloquent ORM entities)
  │     └─- MariaDB / SQLite Database
  │
  ▼
HTTP JSON Response to Client { success, message, data }
```

## Annotated directory layout

```text
app/
├── Http/
│   ├── Controllers/Api/           # API endpoints (Auth, Products, Cart, Orders, Seller, Admin)
│   ├── Middleware/                # Request processing and authentication checks
│   └── Resources/                 # Allowlist API Resources (PublicUser, PublicReview, PublicQuestion, PublicTracking, ShipmentDetail)
├── Models/                        # Eloquent models (User, Shop, Product, Order, Payment, Refund, OrderReturn, etc.)
├── Providers/                     # Service providers (AppServiceProvider defining RateLimiter policies)
└── Services/                      # Pure business logic (CheckoutService, PricingService, OrderStateMachine, RefundService, LedgerService)
database/
├── migrations/                    # Database schema definitions and historical tables
└── seeders/                       # Database seeders for initial data
public/                            # Static assets and compiled SPA entrypoint (index.html)
resources/
└── views/                         # Blade templates used for server-rendered web fallback
src/
├── components/                    # Reusable React components (Navbar, Modals, ProductCards)
├── context/                       # React context providers (ToastContext)
├── services/                      # Frontend API client and communication adapters
├── types/                         # TypeScript interfaces and domain type declarations
└── App.tsx                        # Root React application component and view switching
tests/
├── Feature/                       # End-to-end and integration feature tests
└── Unit/                          # Isolated service and calculation tests
```

## Rate limiting architecture

Configured via `app/Providers/AppServiceProvider.php` using Laravel 11 `RateLimiter::for()` and registered in `bootstrap/app.php`.

### Named limiters

| Limiter | Target | Quota | Key segmentation |
|---|---|---|---|
| `api` | All `/api/*` routes | 60 req/min (guest), 120 req/min (auth) | IP address (guest) or User ID (auth) |
| `auth-login` | `POST /api/auth/login` | 5 req/min | Composite `identifier (email/username) + IP`, with 10 req/min per IP fallback |
| `auth-register` | `POST /api/auth/register` | 5 req/min | IP address |
| `auth-resend` | `POST /api/auth/resend-verification` | 3 req/min | Composite `email + IP`, or IP fallback |
| `vouchers-validate` | `POST /api/vouchers/validate` | 10 req/min | User ID or IP address |
| `orders-create` | `POST /api/orders` | 10 req/min | User ID or IP address |
| `uploads` | `POST /api/upload` | 10 req/min | User ID or IP address |
| `messages-send` | `POST /api/conversations/messages` | 30 req/min | User ID or IP address |

### Standardized 429 response envelope

Handled in `bootstrap/app.php` via `ThrottleRequestsException`:
- HTTP status: `429 Too Many Requests`
- Headers: `Retry-After`, `X-RateLimit-Limit`, `X-RateLimit-Remaining`
- Payload: `{"success": false, "message": "Terlalu banyak permintaan. Silakan tunggu beberapa saat lagi.", "retry_after": <seconds>}`

## Compact schema notation

<!-- BEGIN AUTO GENERATED: DATABASE_SCHEMA -->
users (id PK, name, email unique, password, role enum[customer|seller|admin], avatar nullable, status string, email_verified_at, deleted_at nullable, remember_token)
user_addresses (id PK, user_id FK -> users.id, label, recipient_name, phone, address_line, city, postal_code, is_default bool)
shops (id PK, user_id FK -> users.id, name, slug unique, description text, city, rating decimal, is_verified bool, status string, deleted_at nullable)
categories (id PK, name, slug unique, item_count int, icon nullable)
products (id PK, shop_id FK -> shops.id, category_id FK -> categories.id nullable, name, slug unique, price decimal, stock int, is_active bool, deleted_at nullable, index[shop_id, is_active], index[category, price])
product_variants (id PK, product_id FK -> products.id, name, sku unique, price decimal, stock int, is_active bool, attributes json, deleted_at nullable)
carts (id PK, user_id FK -> users.id unique, session_id nullable, items_json longtext)
cart_items (id PK, cart_id FK -> carts.id, product_id FK -> products.id, variant_id FK -> product_variants.id nullable, quantity int, unique[cart_id, product_id, variant_id])
orders (id PK, order_number unique, master_order_number nullable index, user_id FK -> users.id nullable, shop_id FK -> shops.id nullable, total decimal, status string, deleted_at nullable, index[shop_id, status], index[user_id, status])
order_items (id PK, order_id FK -> orders.id, shop_id FK -> shops.id nullable, product_id FK -> products.id nullable, variant_id FK -> product_variants.id nullable, quantity int, price decimal, subtotal decimal, index[order_id, shop_id])
shipments (id PK, shipment_id unique, order_number index, user_id FK -> users.id nullable, tracking_number unique, courier_name string, status string, index[user_id, status])
reviews (id PK, user_id FK -> users.id, product_id FK -> products.id, order_id FK -> orders.id nullable, order_item_id unique FK -> order_items.id nullable, shop_id FK -> shops.id nullable, rating int, comment text, status string, index[product_id, status], index[shop_id, status])
conversations (id PK, shop_id FK -> shops.id, customer_id FK -> users.id, last_message_at datetime index, unique[shop_id, customer_id])
messages (id PK, conversation_id FK -> conversations.id, sender_id FK -> users.id, message text, is_read bool, index[conversation_id, created_at], index[conversation_id, is_read, sender_id])
idempotency_keys (id PK, key string, user_id FK -> users.id, action string, request_hash string nullable, status string, response_json longtext, status_code int, unique[user_id, action, key])
sessions (id PK string, user_id FK -> users.id nullable index, ip_address string nullable, user_agent text nullable, payload longtext, last_activity int index)
wallets (id PK, user_id FK -> users.id, shop_id FK -> shops.id unique, balance decimal, reserved_balance decimal, pending_balance decimal, total_withdrawn decimal)
wallet_transactions (id PK, wallet_id FK -> wallets.id, type enum[credit|debit], amount decimal, balance_after decimal, reference_type string, reference_id string, description text, unique[wallet_id, reference_type, reference_id, type], index[wallet_id, created_at])
seller_payouts (id PK, shop_id FK -> shops.id, amount decimal, bank_name string, account_number string, account_holder string, status enum[pending|processing|completed|rejected], reference_id string unique, processed_by FK -> users.id nullable, processed_at datetime nullable, failure_reason text nullable, index[shop_id, status])
payment_events (id PK, payment_id FK -> payments.id nullable, event_id string unique, provider string, event_type string, payload_json json, status enum[processed|rejected], unique[provider, event_id])
refunds (id PK, order_id FK -> orders.id, payment_id FK -> payments.id nullable, return_id FK -> order_returns.id nullable, shop_id FK -> shops.id nullable, user_id FK -> users.id, type enum[full|partial], amount decimal, currency string, reason text, status enum[pending|processing|completed|failed], provider string, refund_reference string unique, processed_by FK -> users.id nullable, processed_at datetime nullable, index[order_id, status])
admin_actions (id PK, user_id FK -> users.id, action string, target_type string nullable, target_id int nullable, details_json json nullable, ip_address string nullable, user_agent text nullable, append_only bool)
<!-- END AUTO GENERATED: DATABASE_SCHEMA -->

Full catalog for all 30+ tables is recorded in `.agents/references/database-schema.md`.

## Compact routing matrix

<!-- BEGIN AUTO GENERATED: ROUTING_MATRIX -->
| Method | Endpoint | Handler | Access |
|---|---|---|---|
| POST | /api/auth/login | Api\AuthApiController@login | Public (throttle:auth-login) |
| POST | /api/auth/register | Api\AuthApiController@register | Public (throttle:auth-register) |
| POST | /api/auth/verify-email | Api\AuthApiController@verifyEmail | Public / Authenticated |
| POST | /api/auth/resend-verification | Api\AuthApiController@resendVerification | Public / Authenticated (throttle:auth-resend) |
| GET | /api/auth/me | Api\AuthApiController@me | Authenticated |
| GET | /api/products | Api\ProductApiController@index | Public |
| POST,PUT,DELETE | /api/products | Api\ProductApiController | Seller / Admin |
| PATCH | /api/products/{id}/status | Api\ProductApiController@toggleStatus | Seller / Admin |
| GET | /api/products/{slug} | Api\ProductApiController@show | Public |
| POST,DELETE | /api/upload | Api\UploadApiController | Authenticated (throttle:uploads) |
| GET,POST | /api/cart | Api\CartApiController | Public or Authenticated |
| POST | /api/orders/calculate | Api\OrderApiController@calculate | Authenticated |
| GET,POST | /api/orders | Api\OrderApiController | Authenticated (POST throttle:orders-create) |
| PUT | /api/orders/{id}/status | Api\OrderApiController@updateStatus | Seller / Admin |
| POST | /api/orders/{id}/cancel | Api\OrderApiController@cancel | Customer / Seller / Admin |
| POST | /api/payments/webhook/{provider?} | Api\PaymentWebhookController@handle | Public (Gateway Signature Auth) |
| GET | /api/deliveries/{code} | Api\DeliveryApiController@show | Public |
| GET,POST | /api/reviews | Api\ReviewApiController | Public, Authenticated |
| GET,POST | /api/conversations | Api\ChatApiController | Authenticated |
| POST | /api/conversations/messages | Api\ChatApiController@sendMessage | Authenticated (throttle:messages-send) |
| GET,POST | /api/returns | Api\ReturnApiController | Authenticated |
| POST | /api/returns/{id}/respond | Api\ReturnApiController@sellerRespond | Seller |
| POST | /api/disputes/{id}/resolve | Api\ReturnApiController@resolveDispute | Admin / Support |
| GET | /api/seller/dashboard | Api\SellerApiController@dashboard | Seller |
| GET,PUT | /api/seller/products | Api\SellerApiController | Seller |
| GET | /api/seller/finances | Api\SellerApiController@finances | Seller |
| POST | /api/seller/payout | Api\SellerApiController@requestPayout | Seller |
| GET | /api/admin/dashboard | Api\AdminApiController@dashboard | Admin |
| GET,PUT | /api/admin/users | Api\AdminApiController | Admin |
| GET | /api/admin/payouts | Api\AdminApiController@payouts | Admin |
| POST | /api/admin/payouts/{id}/approve | Api\AdminApiController@approvePayout | Admin |
| POST | /api/admin/payouts/{id}/reject | Api\AdminApiController@rejectPayout | Admin |
| GET | /api/admin/refunds | Api\AdminApiController@refunds | Admin |
<!-- END AUTO GENERATED: ROUTING_MATRIX -->

Complete routing matrix for all 89 endpoints is recorded in `.agents/references/routes.md`.

## Subsystems and deep references
- [`database-schema.md`](./.agents/references/database-schema.md) covers full relational schema catalog.
- [`routes.md`](./.agents/references/routes.md) covers complete route registry across web and API.
- [`marketplace-architecture.md`](./.agents/references/marketplace-architecture.md) covers multi-vendor order splitting, escrow, and pricing mechanics.
