<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Add missing columns and scoped index on idempotency_keys
        if (Schema::hasTable('idempotency_keys')) {
            Schema::table('idempotency_keys', function (Blueprint $table) {
                if (!Schema::hasColumn('idempotency_keys', 'request_hash')) {
                    $table->string('request_hash', 64)->nullable()->after('action');
                }
                if (!Schema::hasColumn('idempotency_keys', 'status')) {
                    $table->string('status', 30)->default('completed')->after('request_hash');
                }
                if (!Schema::hasColumn('idempotency_keys', 'status_code')) {
                    $table->integer('status_code')->nullable()->default(201)->after('response_json');
                }
            });

            // Adjust unique constraint to be scoped by (user_id, action, key)
            try {
                Schema::table('idempotency_keys', function (Blueprint $table) {
                    $table->dropUnique('idempotency_keys_key_unique');
                    $table->unique(['user_id', 'action', 'key'], 'idempotency_keys_scoped_unique');
                });
            } catch (\Throwable $e) {
                // If already scoped or dropped
            }
        }

        // 2. Add is_active column on products and product_variants if missing
        if (Schema::hasTable('products') && !Schema::hasColumn('products', 'is_active')) {
            Schema::table('products', function (Blueprint $table) {
                $table->boolean('is_active')->default(true)->after('stock');
            });
        }

        if (Schema::hasTable('product_variants') && !Schema::hasColumn('product_variants', 'is_active')) {
            Schema::table('product_variants', function (Blueprint $table) {
                $table->boolean('is_active')->default(true)->after('stock');
            });
        }

        // 3. Database Constraints for Inventory, Quantity and Pricing
        $driver = DB::getDriverName();

        if (in_array($driver, ['mysql', 'mariadb'])) {
            // MySQL 8.0.16+ / MariaDB 10.2.1+ CHECK constraints
            $statements = [
                'ALTER TABLE products ADD CONSTRAINT chk_products_stock_non_negative CHECK (stock >= 0)',
                'ALTER TABLE product_variants ADD CONSTRAINT chk_product_variants_stock_non_negative CHECK (stock >= 0)',
                'ALTER TABLE cart_items ADD CONSTRAINT chk_cart_items_qty_positive CHECK (quantity >= 1)',
                'ALTER TABLE order_items ADD CONSTRAINT chk_order_items_qty_positive CHECK (quantity >= 1)',
                'ALTER TABLE orders ADD CONSTRAINT chk_orders_total_non_negative CHECK (total >= 0)',
            ];
            foreach ($statements as $sql) {
                try {
                    DB::statement($sql);
                } catch (\Throwable $e) {
                    // Ignore if constraint already exists or not supported by engine
                }
            }
        } elseif ($driver === 'sqlite') {
            // SQLite Triggers for enforcing non-negative stock and positive quantity
            $triggers = [
                'CREATE TRIGGER IF NOT EXISTS trg_products_stock_non_negative_ins BEFORE INSERT ON products FOR EACH ROW WHEN NEW.stock < 0 BEGIN SELECT RAISE(ABORT, "Stock cannot be negative"); END;',
                'CREATE TRIGGER IF NOT EXISTS trg_products_stock_non_negative_upd BEFORE UPDATE ON products FOR EACH ROW WHEN NEW.stock < 0 BEGIN SELECT RAISE(ABORT, "Stock cannot be negative"); END;',
                'CREATE TRIGGER IF NOT EXISTS trg_product_variants_stock_non_negative_ins BEFORE INSERT ON product_variants FOR EACH ROW WHEN NEW.stock < 0 BEGIN SELECT RAISE(ABORT, "Variant stock cannot be negative"); END;',
                'CREATE TRIGGER IF NOT EXISTS trg_product_variants_stock_non_negative_upd BEFORE UPDATE ON product_variants FOR EACH ROW WHEN NEW.stock < 0 BEGIN SELECT RAISE(ABORT, "Variant stock cannot be negative"); END;',
                'CREATE TRIGGER IF NOT EXISTS trg_cart_items_qty_positive_ins BEFORE INSERT ON cart_items FOR EACH ROW WHEN NEW.quantity < 1 BEGIN SELECT RAISE(ABORT, "Cart item quantity must be at least 1"); END;',
                'CREATE TRIGGER IF NOT EXISTS trg_cart_items_qty_positive_upd BEFORE UPDATE ON cart_items FOR EACH ROW WHEN NEW.quantity < 1 BEGIN SELECT RAISE(ABORT, "Cart item quantity must be at least 1"); END;',
                'CREATE TRIGGER IF NOT EXISTS trg_order_items_qty_positive_ins BEFORE INSERT ON order_items FOR EACH ROW WHEN NEW.quantity < 1 BEGIN SELECT RAISE(ABORT, "Order item quantity must be at least 1"); END;',
                'CREATE TRIGGER IF NOT EXISTS trg_order_items_qty_positive_upd BEFORE UPDATE ON order_items FOR EACH ROW WHEN NEW.quantity < 1 BEGIN SELECT RAISE(ABORT, "Order item quantity must be at least 1"); END;',
            ];
            foreach ($triggers as $triggerSql) {
                try {
                    DB::statement($triggerSql);
                } catch (\Throwable $e) {
                    // Ignore trigger error
                }
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $driver = DB::getDriverName();

        if ($driver === 'sqlite') {
            $triggers = [
                'trg_products_stock_non_negative_ins',
                'trg_products_stock_non_negative_upd',
                'trg_product_variants_stock_non_negative_ins',
                'trg_product_variants_stock_non_negative_upd',
                'trg_cart_items_qty_positive_ins',
                'trg_cart_items_qty_positive_upd',
                'trg_order_items_qty_positive_ins',
                'trg_order_items_qty_positive_upd',
            ];
            foreach ($triggers as $trigger) {
                try {
                    DB::statement("DROP TRIGGER IF EXISTS {$trigger}");
                } catch (\Throwable $e) {}
            }
        } elseif (in_array($driver, ['mysql', 'mariadb'])) {
            $constraints = [
                ['products', 'chk_products_stock_non_negative'],
                ['product_variants', 'chk_product_variants_stock_non_negative'],
                ['cart_items', 'chk_cart_items_qty_positive'],
                ['order_items', 'chk_order_items_qty_positive'],
                ['orders', 'chk_orders_total_non_negative'],
            ];
            foreach ($constraints as [$table, $chk]) {
                try {
                    DB::statement("ALTER TABLE {$table} DROP CONSTRAINT {$chk}");
                } catch (\Throwable $e) {}
            }
        }

        if (Schema::hasTable('idempotency_keys')) {
            Schema::table('idempotency_keys', function (Blueprint $table) {
                try {
                    $table->dropUnique('idempotency_keys_scoped_unique');
                    $table->unique('key', 'idempotency_keys_key_unique');
                } catch (\Throwable $e) {}

                $columnsToDrop = [];
                if (Schema::hasColumn('idempotency_keys', 'request_hash')) $columnsToDrop[] = 'request_hash';
                if (Schema::hasColumn('idempotency_keys', 'status')) $columnsToDrop[] = 'status';
                if (Schema::hasColumn('idempotency_keys', 'status_code')) $columnsToDrop[] = 'status_code';
                if (!empty($columnsToDrop)) {
                    $table->dropColumn($columnsToDrop);
                }
            });
        }
    }
};
