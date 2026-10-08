# Marketplace Architecture and Domain Workflows

Domain logic reference for PASARIA Multi-Vendor Marketplace.

## Multi-vendor checkout and order splitting

When a buyer checks out a cart containing items from multiple distinct sellers, the backend isolates vendor orders through an atomic database transaction.

```text
Incoming Checkout Payload
  │
  ▼
OrderApiController@store
  │
  ▼
CheckoutService::processCheckout
  │
  ├── Validate inventory lock for all items
  ├── Group cart items by shop_id
  ├── Run PricingService (server-calculated subtotal, tax, courier shipping)
  ├── Insert parent master order
  ├── Loop shops:
  │     ├── Insert child sub-order linked to parent order
  │     ├── Insert sub-order items with locked unit prices
  │     ├── Deduct product and variant stock
  │     └── Generate shipment record with courier tracking code
  ├── Record payment record in pending state
  └── Return consolidated checkout summary
```

## Pricing calculation mechanics

Client price submissions are ignored. PricingService computes all costs using database figures.

1. Product price resolution. Reads base product price or variant price from database records.
2. Courier shipping rates. Computes shipping fee per shop based on destination city and courier selection (PASARIA Express, SiCepat, GoSend).
3. Voucher application. Validates minimum spend, active status, expiration date, and remaining quota. Applies either percentage discount with maximum cap or flat reduction.
4. Value-added tax. Computes standard 11 percent tax on post-discount subtotal.

## Escrow and payout workflow

1. Payment confirmation. Customer completes payment, transitioning master order and child sub-orders to processing status.
2. Seller shipment. Seller submits package dispatch via Seller Center, registering courier event records.
3. Order completion. Customer marks order delivered or automated confirmation triggers after delivery window.
4. Wallet settlement. Escrow releases net sales amount minus marketplace platform fee to seller wallet.
5. Payout request. Seller initiates withdrawal request through `POST /api/seller/payout`, pending admin approval.

## Local educational demo mode

The repository includes a toggle for SQL demonstration queries.

- Key `DEMO_SQLI_MODE` in `.env` and `config/app.php` controls query behavior.
- Configuration `phpunit.xml` explicitly sets `DEMO_SQLI_MODE=false` during automated testing.
- Safe execution mode runs all database operations through Eloquent ORM or parameterized query bindings.
