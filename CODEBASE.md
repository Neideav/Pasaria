# Codebase Reference (PASARIA Marketplace)

Deep factual reference for AI agents and developers. **Last verified: 2026-10-08.**
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
| Bundler and tooling | Vite 8.3.4 | Tailwind CSS v4.3.3, Lucide React icons, Motion animations |
| Test suite | PHPUnit 11.0.0 | Unit and Feature tests with in-memory SQLite |
| Container runtime | Docker | Multi-stage build (Node 22 builder into PHP 8.2 Apache) |
<!-- END AUTO GENERATED: STACK_MATRIX -->

## Architecture data flow

```text
HTTP Request (React 19 SPA / Client)
  │
  ▼
routes/api.php (Route dispatcher and middleware assignment)
  │
  ▼
Sanctum Middleware (Bearer token resolution via personal_access_tokens)
  │
  ▼
app/Http/Controllers/Api/ (Thin HTTP controllers)
  │
  ├── FormRequest validation (Payload structure and permission checks)
  │
  ├── app/Services/ (Core domain services)
  │     ├── PricingService (Server-side calculations for tax, shipping, vouchers)
  │     └── CheckoutService (Atomic multi-vendor order and shipment creation)
  │
  ├── app/Models/ (Eloquent ORM entities)
  │     └── MariaDB / SQLite Database
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
├── Models/                        # Eloquent models (User, Shop, Product, Order, Shipment, etc.)
└── Services/                      # Pure business logic (CheckoutService, PricingService)
database/
├── migrations/                    # Database schema definitions and historical tables
└── seeders/                       # Database seeders for initial data
public/                            # Static assets and compiled SPA entrypoint (index.html)
resources/
└── views/                         # Blade templates used for server-rendered web fallback
src/
├── components/                    # Reusable React components (Navbar, Modals, ProductCards)
├── services/                      # Frontend API client and communication adapters
├── types/                         # TypeScript interfaces and domain type declarations
└── App.tsx                        # Root React application component and view switching
tests/
├── Feature/                       # End-to-end and integration feature tests
└── Unit/                          # Isolated service and calculation tests
```

## Compact schema notation

<!-- BEGIN AUTO GENERATED: DATABASE_SCHEMA -->
users (id PK, name, email unique, password, role enum[customer|seller|admin], avatar nullable, remember_token)
user_addresses (id PK, user_id FK -> users.id, label, recipient_name, phone, address_line, city, postal_code, is_default bool)
shops (id PK, user_id FK -> users.id, name, slug unique, description text, city, rating decimal, is_verified bool)
categories (id PK, name, slug unique, item_count int, icon nullable)
products (id PK, shop_id FK -> shops.id nullable, category_id FK -> categories.id nullable, name, slug unique, price decimal, stock int, is_active bool)
product_variants (id PK, product_id FK -> products.id, name, sku unique, price decimal, stock int, is_active bool, attributes json)
carts (id PK, user_id FK -> users.id nullable, session_id nullable, status string)
cart_items (id PK, cart_id FK -> carts.id, product_id FK -> products.id, variant_id FK nullable, quantity int, unit_price decimal)
orders (id PK, order_number unique, user_id FK -> users.id nullable, parent_id FK nullable, shop_id FK nullable, total_amount decimal, status string)
order_items (id PK, order_id FK -> orders.id, product_id FK -> products.id, quantity int, unit_price decimal, subtotal decimal)
shipments (id PK, order_id FK -> orders.id, tracking_number unique, courier, shipping_cost decimal, status string)
reviews (id PK, user_id FK -> users.id, product_id FK -> products.id, order_id FK nullable, order_item_id unique FK nullable, rating int, comment text)
idempotency_keys (id PK, key string, user_id FK -> users.id, action string, request_hash string nullable, status string, response_json longtext, status_code int, unique[user_id, action, key])
sessions (id PK string, user_id FK -> users.id nullable index, ip_address string nullable, user_agent text nullable, payload longtext, last_activity int index)
wallets (id PK, user_id FK -> users.id, shop_id FK -> shops.id, balance decimal, reserved_balance decimal, pending_balance decimal, total_withdrawn decimal)
wallet_transactions (id PK, wallet_id FK -> wallets.id, type enum[credit|debit], amount decimal, balance_after decimal, reference_type string, reference_id string, description text)
seller_payouts (id PK, shop_id FK -> shops.id, amount decimal, bank_name string, account_number string, account_holder string, status enum[pending|processing|completed|rejected], reference_id string, processed_by FK nullable, processed_at datetime nullable, failure_reason text nullable)
payment_events (id PK, payment_id FK nullable, event_id string nullable, provider string, event_type string, payload_json json, status enum[processed|rejected], created_at datetime)
<!-- END AUTO GENERATED: DATABASE_SCHEMA -->

Full catalog for all 30+ tables is recorded in `.agents/references/database-schema.md`.

## Compact routing matrix

<!-- BEGIN AUTO GENERATED: ROUTING_MATRIX -->
| Method | Endpoint | Handler | Access |
|---|---|---|---|
| POST | /api/auth/login | Api\AuthApiController@login | Public |
| POST | /api/auth/register | Api\AuthApiController@register | Public |
| POST | /api/auth/verify-email | Api\AuthApiController@verifyEmail | Public / Authenticated |
| POST | /api/auth/resend-verification | Api\AuthApiController@resendVerification | Public / Authenticated |
| GET | /api/auth/me | Api\AuthApiController@me | Authenticated |
| GET | /api/products | Api\ProductApiController@index | Public |
| GET | /api/products/{slug} | Api\ProductApiController@show | Public |
| GET,POST | /api/cart | Api\CartApiController | Public or Authenticated |
| POST | /api/orders/calculate | Api\OrderApiController@calculate | Authenticated |
| GET,POST | /api/orders | Api\OrderApiController | Authenticated |
| POST | /api/payments/webhook/{provider?} | Api\PaymentWebhookController@handle | Public (Gateway Signature Auth) |
| GET | /api/deliveries/{code} | Api\DeliveryApiController@show | Public |
| GET,POST | /api/reviews | Api\ReviewApiController | Public, Authenticated |
| GET,POST | /api/conversations | Api\ChatApiController | Authenticated |
| GET,POST | /api/returns | Api\ReturnApiController | Authenticated |
| GET | /api/seller/dashboard | Api\SellerApiController@dashboard | Seller |
| GET,PUT | /api/seller/products | Api\SellerApiController | Seller |
| GET | /api/seller/finances | Api\SellerApiController@finances | Seller |
| POST | /api/seller/payout | Api\SellerApiController@requestPayout | Seller |
| GET | /api/admin/dashboard | Api\AdminApiController@dashboard | Admin |
| GET,PUT | /api/admin/users | Api\AdminApiController | Admin |
| GET | /api/admin/payouts | Api\AdminApiController@payouts | Admin |
| POST | /api/admin/payouts/{id}/approve | Api\AdminApiController@approvePayout | Admin |
| POST | /api/admin/payouts/{id}/reject | Api\AdminApiController@rejectPayout | Admin |
| GET | /api/config | Api\ConfigApiController@getDemoMode | Public |
<!-- END AUTO GENERATED: ROUTING_MATRIX -->

Complete routing matrix for all 98 endpoints is recorded in `.agents/references/routes.md`.

## Subsystems and deep references
- [`database-schema.md`](./.agents/references/database-schema.md) covers full relational schema catalog.
- [`routes.md`](./.agents/references/routes.md) covers complete route registry across web and API.
- [`marketplace-architecture.md`](./.agents/references/marketplace-architecture.md) covers multi-vendor order splitting, escrow, and pricing mechanics.
