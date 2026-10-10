# Database Schema Catalog

Complete relational schema inventory for PASARIA Multi-Vendor Marketplace.

## Entity overview

```text
users ──┬── shops ──┬── products ──┬── product_variants
        │           │              ├── product_images
        │           │              ├── reviews ── review_media
        │           │              ├── product_questions ── product_answers
        │           │              └── wishlists
        │           ├── seller_payouts
        │           └── shop_followers
        ├── user_addresses
        ├── carts ── cart_items
        ├── orders ──┬── order_items
        │            ├── shipments ── shipment_events
        │            ├── payments
        │            ├── voucher_redemptions
        │            └── order_returns ── disputes
        ├── wallets ── wallet_transactions
        ├── conversations ── messages
        ├── notifications
        └── reports
```

## Relational tables

users (id PK, name, email unique, password, role enum[customer|seller|admin], avatar nullable, remember_token)
user_addresses (id PK, user_id FK -> users.id, label, recipient_name, phone, address_line, city, postal_code, is_default bool)
personal_access_tokens (id PK, tokenable_type, tokenable_id, name, token unique, abilities text nullable, last_used_at timestamp nullable, expires_at timestamp nullable)
shops (id PK, user_id FK -> users.id, name, slug unique, description text, logo nullable, banner nullable, city, rating decimal, is_verified bool)
shop_followers (id PK, user_id FK -> users.id, shop_id FK -> shops.id)
categories (id PK, name, slug unique, item_count int, icon nullable)
brands (id PK, name, slug unique, logo nullable, is_featured bool)
products (id PK, shop_id FK -> shops.id nullable, category_id FK -> categories.id nullable, name, slug unique, category, price decimal, original_price decimal, monthly_price decimal, short_desc text, description text, image string, rating decimal, review_count int, stock int, colors json, specs json)
product_variants (id PK, product_id FK -> products.id, name, sku unique, price decimal, stock int, attributes json)
product_images (id PK, product_id FK -> products.id, image_url, sort_order int)
wishlists (id PK, user_id FK -> users.id, product_id FK -> products.id)
carts (id PK, user_id FK -> users.id nullable, session_id nullable, status string)
cart_items (id PK, cart_id FK -> carts.id, product_id FK -> products.id, variant_id FK -> product_variants.id nullable, quantity int, unit_price decimal)
vouchers (id PK, code unique, discount_type enum[percentage|fixed], discount_value decimal, min_spend decimal, max_discount decimal nullable, quota int, starts_at timestamp nullable, expires_at timestamp nullable, is_active bool)
voucher_redemptions (id PK, voucher_id FK -> vouchers.id, user_id FK -> users.id, order_id FK -> orders.id, discount_applied decimal)
orders (id PK, order_number unique, user_id FK -> users.id nullable, parent_id FK -> orders.id nullable, shop_id FK -> shops.id nullable, customer_name, customer_email, customer_phone, shipping_address text, total_amount decimal, status string, payment_method, notes text nullable)
order_items (id PK, order_id FK -> orders.id, product_id FK -> products.id, product_name, price decimal, quantity int, subtotal decimal)
shipments (id PK, order_id FK -> orders.id, tracking_number unique, courier, service, shipping_cost decimal, estimated_days, status string, current_location nullable)
shipment_events (id PK, shipment_id FK -> shipments.id, status, description, location nullable, event_time timestamp)
payments (id PK, order_id FK -> orders.id, amount decimal, payment_gateway, gateway_reference nullable, status enum[pending|paid|failed|refunded])
order_returns (id PK, order_id FK -> orders.id, user_id FK -> users.id, reason, status enum[requested|approved|rejected|completed], refund_amount decimal, resolution_notes text nullable)
disputes (id PK, return_id FK -> order_returns.id, mediator_id FK -> users.id nullable, status enum[open|in_review|resolved], verdict text nullable)
reviews (id PK, user_id FK -> users.id, product_id FK -> products.id, order_id FK -> orders.id nullable, rating int, comment text, seller_reply text nullable, is_approved bool)
review_media (id PK, review_id FK -> reviews.id, media_url, media_type string)
product_questions (id PK, user_id FK -> users.id, product_id FK -> products.id, question text)
product_answers (id PK, question_id FK -> product_questions.id, user_id FK -> users.id, answer text, is_official bool)
conversations (id PK, buyer_id FK -> users.id, seller_id FK -> users.id, shop_id FK -> shops.id)
messages (id PK, conversation_id FK -> conversations.id, sender_id FK -> users.id, message text, is_read bool)
flash_sales (id PK, title, starts_at timestamp, ends_at timestamp, is_active bool)
flash_sale_items (id PK, flash_sale_id FK -> flash_sales.id, product_id FK -> products.id, promotional_price decimal, quota int, sold int)
wallets (id PK, user_id FK -> users.id unique, balance decimal)
wallet_transactions (id PK, wallet_id FK -> wallets.id, amount decimal, type enum[credit|debit], reference, description text)
seller_payouts (id PK, shop_id FK -> shops.id, amount decimal, bank_account, status enum[pending|processed|rejected])
notifications (id PK, user_id FK -> users.id, title, message text, type string, is_read bool)
reports (id PK, reporter_id FK -> users.id, target_type string, target_id bigint, reason text, status enum[pending|reviewed|dismissed])
admin_actions (id PK, admin_id FK -> users.id, action string, target_type string, target_id bigint, details text nullable)
sessions (id PK string, user_id FK -> users.id nullable index, ip_address string nullable, user_agent text nullable, payload longtext, last_activity int index)
demo_records (id PK, title, payload text, flag_revealed bool)
