# Agent Instructions (PASARIA Marketplace)

## Project context
Multi-vendor e-commerce marketplace platform connecting customers, sellers, and administrators.
Laravel 11 API backend, PHP 8.2+, MariaDB, Laravel Sanctum token authentication, React 19 SPA frontend with Tailwind CSS and Vite. System operates in UTC timezone.

## Documentation map
- [`CODEBASE.md`](./CODEBASE.md), technical architecture, stack matrix, schema, and routing overview.
- [`.agents/references/database-schema.md`](./.agents/references/database-schema.md), full relational database schema catalog.
- [`.agents/references/routes.md`](./.agents/references/routes.md), routing matrix across web and API endpoints.
- [`.agents/references/marketplace-architecture.md`](./.agents/references/marketplace-architecture.md), multi-vendor checkout, escrow, and pricing logic.

## Commands cheatsheet
```bash
# Dependencies
composer install                           # Install PHP dependencies
bun install                                # Install frontend dependencies (or npm install)

# Development servers
php artisan serve                          # Start Laravel backend server
bun run dev                                # Start Vite frontend server

# Verification and testing
./vendor/bin/phpunit                       # Run automated PHP test suite (in-memory SQLite)
bun run lint                               # Run TypeScript type check (tsc --noEmit)
bun run build                              # Compile production frontend bundle

# Database operations
php artisan migrate                        # Run pending database migrations
php artisan route:list                     # Inspect registered route list
```

## Critical rules (READ FIRST)
1. NEVER modify `.env` directly; add new variables to `.env.example` with placeholder defaults instead.
2. NEVER edit existing migration files; generate new migration files for schema changes.
3. NEVER run `php artisan test`; execute `./vendor/bin/phpunit` to run test suites under the configured in-memory environment.
4. NEVER edit files inside dependency or build directories (`vendor/`, `node_modules/`, `dist/`); manage dependencies through package manifests.
5. NEVER stage files with `git add .` or `git add -A`; stage individual files explicitly with `git add <file>`.
6. NEVER commit code without explicit user instruction.
7. ALWAYS run `./vendor/bin/phpunit` and `bun run lint` before claiming task completion.

## Non-default conventions (Things You'd Get Wrong)
- Single source of truth is the Laravel 11 API using Laravel Sanctum for bearer token authentication.
- Keep controllers thin as HTTP dispatchers; delegate order placement and pricing logic to `app/Services/PricingService.php` and `app/Services/CheckoutService.php`.
- Multi-vendor checkouts must run inside database transactions to atomically generate parent orders, vendor sub-orders, stock deductions, and shipments.
- Discard client-submitted prices; calculate totals, shipping rates, voucher discounts, and 11 percent tax strictly server-side.
- Return structured API responses containing explicit HTTP status codes and standard JSON envelopes.
- Frontend API calls route through centralized helpers in `src/services/api.ts`.

## Git workflow
- Active working branch is `production`.
- Format commits following Conventional Commits (`feat`, `fix`, `refactor`, `test`, `docs`, `chore`).
- Stage only relevant files explicitly; avoid broad directory staging.

## Definition of done
A task is complete when:
1. Feature logic is isolated in dedicated service or controller layers.
2. Form requests or schemas validate all incoming parameters.
3. Automated test suite passes with `./vendor/bin/phpunit`.
4. Frontend type checks pass with `bun run lint`.
5. `CODEBASE.md` is updated if new entities, tables, or routes were added.
