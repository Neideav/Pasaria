<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Check if a foreign key exists on a given column of a table.
     */
    protected function hasForeignKey(string $table, string $column): bool
    {
        if (!Schema::hasTable($table)) {
            return false;
        }

        try {
            $fks = Schema::getForeignKeys($table);
            foreach ($fks as $fk) {
                if (in_array($column, $fk['columns'] ?? [], true)) {
                    return true;
                }
            }
        } catch (\Throwable $e) {
            // Fallback for drivers where getForeignKeys might not be fully supported
        }

        return false;
    }

    /**
     * Validate that no orphan records exist before adding a foreign key constraint.
     * Throws an informative RuntimeException with reconciliation instructions if orphans exist.
     */
    protected function assertNoOrphans(string $table, string $column, string $foreignTable, string $foreignColumn = 'id'): void
    {
        if (!Schema::hasTable($table) || !Schema::hasTable($foreignTable)) {
            return;
        }

        $orphans = DB::table($table)
            ->whereNotNull($column)
            ->whereNotIn($column, DB::table($foreignTable)->select($foreignColumn))
            ->count();

        if ($orphans > 0) {
            throw new \RuntimeException(
                "Migration Integrity Error: Found {$orphans} orphan records in '{$table}.{$column}' referencing non-existent '{$foreignTable}.{$foreignColumn}'. " .
                "Reconciliation required: Update or remove invalid '{$column}' references in table '{$table}' before re-running migration."
            );
        }
    }

    /**
     * Validate that no duplicate entries exist before adding a unique index.
     * Throws an informative RuntimeException with reconciliation instructions if duplicates exist.
     */
    protected function assertNoDuplicates(string $table, array $columns, string $label): void
    {
        if (!Schema::hasTable($table)) {
            return;
        }

        $query = DB::table($table)->select($columns);
        foreach ($columns as $col) {
            $query->whereNotNull($col);
        }

        $duplicates = $query->groupBy($columns)
            ->havingRaw('COUNT(*) > 1')
            ->count();

        if ($duplicates > 0) {
            $colsStr = implode(', ', $columns);
            throw new \RuntimeException(
                "Migration Integrity Error: Found duplicate rows in '{$table}' on ({$colsStr}) for constraint '{$label}'. " .
                "Reconciliation required: Consolidate or deduplicate existing rows before adding unique constraint."
            );
        }
    }

    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // =========================================================================
        // 1. SOFT DELETES ON CORE ENTITIES (User, Shop, Order)
        // Ensures historical transactions, financial audits, and ledger records remain intact.
        // =========================================================================
        if (Schema::hasTable('users') && !Schema::hasColumn('users', 'deleted_at')) {
            Schema::table('users', function (Blueprint $table) {
                $table->softDeletes()->after('updated_at');
            });
        }

        if (Schema::hasTable('shops') && !Schema::hasColumn('shops', 'deleted_at')) {
            Schema::table('shops', function (Blueprint $table) {
                $table->softDeletes()->after('updated_at');
            });
        }

        if (Schema::hasTable('orders') && !Schema::hasColumn('orders', 'deleted_at')) {
            Schema::table('orders', function (Blueprint $table) {
                $table->softDeletes()->after('updated_at');
            });
        }

        // =========================================================================
        // 2. PRE-FLIGHT INTEGRITY AUDITS (Fail-Fast with reconciliation message)
        // =========================================================================
        $this->assertNoOrphans('shops', 'user_id', 'users');
        $this->assertNoOrphans('products', 'shop_id', 'shops');
        $this->assertNoOrphans('carts', 'user_id', 'users');
        $this->assertNoOrphans('orders', 'shop_id', 'shops');
        $this->assertNoOrphans('order_items', 'shop_id', 'shops');
        $this->assertNoOrphans('order_items', 'product_id', 'products');
        $this->assertNoOrphans('order_items', 'variant_id', 'product_variants');
        $this->assertNoOrphans('cart_items', 'variant_id', 'product_variants');
        $this->assertNoOrphans('reviews', 'order_id', 'orders');
        $this->assertNoOrphans('reviews', 'order_item_id', 'order_items');
        $this->assertNoOrphans('reviews', 'shop_id', 'shops');
        $this->assertNoOrphans('product_answers', 'shop_id', 'shops');
        $this->assertNoOrphans('conversations', 'shop_id', 'shops');
        $this->assertNoOrphans('order_returns', 'shop_id', 'shops');
        $this->assertNoOrphans('order_returns', 'order_item_id', 'order_items');
        $this->assertNoOrphans('order_returns', 'processed_by', 'users');
        $this->assertNoOrphans('disputes', 'shop_id', 'shops');
        $this->assertNoOrphans('disputes', 'resolved_by', 'users');
        $this->assertNoOrphans('wallets', 'shop_id', 'shops');
        $this->assertNoOrphans('seller_payouts', 'shop_id', 'shops');
        $this->assertNoOrphans('seller_payouts', 'processed_by', 'users');
        $this->assertNoOrphans('refunds', 'payment_id', 'payments');
        $this->assertNoOrphans('refunds', 'return_id', 'order_returns');
        $this->assertNoOrphans('refunds', 'shop_id', 'shops');
        $this->assertNoOrphans('refunds', 'processed_by', 'users');
        $this->assertNoOrphans('payment_events', 'payment_id', 'payments');
        $this->assertNoOrphans('voucher_redemptions', 'order_id', 'orders');
        $this->assertNoOrphans('vouchers', 'shop_id', 'shops');
        $this->assertNoOrphans('shipments', 'user_id', 'users');

        $this->assertNoDuplicates('conversations', ['shop_id', 'customer_id'], 'conversations_shop_customer_unique');
        $this->assertNoDuplicates('wallets', ['shop_id'], 'wallets_shop_id_unique');
        $this->assertNoDuplicates('wallet_transactions', ['wallet_id', 'reference_type', 'reference_id', 'type'], 'wallet_tx_scoped_unique');
        $this->assertNoDuplicates('payment_events', ['provider', 'event_id'], 'payment_events_provider_event_unique');
        $this->assertNoDuplicates('reviews', ['order_item_id'], 'reviews_order_item_id_unique');
        $this->assertNoDuplicates('cart_items', ['cart_id', 'product_id', 'variant_id'], 'cart_items_scoped_unique');

        // =========================================================================
        // 3. HARDEN FOREIGN KEY CONSTRAINTS
        // =========================================================================
        // 3.1 Shops
        if (Schema::hasTable('shops') && !$this->hasForeignKey('shops', 'user_id')) {
            Schema::table('shops', function (Blueprint $table) {
                $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            });
        }

        // 3.2 Products
        if (Schema::hasTable('products') && !$this->hasForeignKey('products', 'shop_id')) {
            Schema::table('products', function (Blueprint $table) {
                $table->foreign('shop_id')->references('id')->on('shops')->cascadeOnDelete();
            });
        }

        // 3.3 Carts
        if (Schema::hasTable('carts') && !$this->hasForeignKey('carts', 'user_id')) {
            Schema::table('carts', function (Blueprint $table) {
                $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            });
        }

        // 3.4 Orders (preserve order if shop is removed)
        if (Schema::hasTable('orders') && !$this->hasForeignKey('orders', 'shop_id')) {
            Schema::table('orders', function (Blueprint $table) {
                $table->foreign('shop_id')->references('id')->on('shops')->nullOnDelete();
            });
        }

        // 3.5 Order Items (preserve line items if product/variant/shop is soft-deleted or removed)
        if (Schema::hasTable('order_items')) {
            Schema::table('order_items', function (Blueprint $table) {
                if (!$this->hasForeignKey('order_items', 'shop_id')) {
                    $table->foreign('shop_id')->references('id')->on('shops')->nullOnDelete();
                }
                if (!$this->hasForeignKey('order_items', 'product_id')) {
                    $table->foreign('product_id')->references('id')->on('products')->nullOnDelete();
                }
                if (!$this->hasForeignKey('order_items', 'variant_id')) {
                    $table->foreign('variant_id')->references('id')->on('product_variants')->nullOnDelete();
                }
            });
        }

        // 3.6 Cart Items
        if (Schema::hasTable('cart_items') && !$this->hasForeignKey('cart_items', 'variant_id')) {
            Schema::table('cart_items', function (Blueprint $table) {
                $table->foreign('variant_id')->references('id')->on('product_variants')->nullOnDelete();
            });
        }

        // 3.7 Reviews
        if (Schema::hasTable('reviews')) {
            Schema::table('reviews', function (Blueprint $table) {
                if (!$this->hasForeignKey('reviews', 'order_id')) {
                    $table->foreign('order_id')->references('id')->on('orders')->nullOnDelete();
                }
                if (!$this->hasForeignKey('reviews', 'order_item_id')) {
                    $table->foreign('order_item_id')->references('id')->on('order_items')->nullOnDelete();
                }
                if (!$this->hasForeignKey('reviews', 'shop_id')) {
                    $table->foreign('shop_id')->references('id')->on('shops')->nullOnDelete();
                }
            });
        }

        // 3.8 Product Answers
        if (Schema::hasTable('product_answers') && !$this->hasForeignKey('product_answers', 'shop_id')) {
            Schema::table('product_answers', function (Blueprint $table) {
                $table->foreign('shop_id')->references('id')->on('shops')->nullOnDelete();
            });
        }

        // 3.9 Conversations
        if (Schema::hasTable('conversations') && !$this->hasForeignKey('conversations', 'shop_id')) {
            Schema::table('conversations', function (Blueprint $table) {
                $table->foreign('shop_id')->references('id')->on('shops')->cascadeOnDelete();
            });
        }

        // 3.10 Order Returns
        if (Schema::hasTable('order_returns')) {
            Schema::table('order_returns', function (Blueprint $table) {
                if (!$this->hasForeignKey('order_returns', 'shop_id')) {
                    $table->foreign('shop_id')->references('id')->on('shops')->nullOnDelete();
                }
                if (!$this->hasForeignKey('order_returns', 'order_item_id')) {
                    $table->foreign('order_item_id')->references('id')->on('order_items')->nullOnDelete();
                }
                if (!$this->hasForeignKey('order_returns', 'processed_by')) {
                    $table->foreign('processed_by')->references('id')->on('users')->nullOnDelete();
                }
            });
        }

        // 3.11 Disputes
        if (Schema::hasTable('disputes')) {
            Schema::table('disputes', function (Blueprint $table) {
                if (!$this->hasForeignKey('disputes', 'shop_id')) {
                    $table->foreign('shop_id')->references('id')->on('shops')->nullOnDelete();
                }
                if (!$this->hasForeignKey('disputes', 'resolved_by')) {
                    $table->foreign('resolved_by')->references('id')->on('users')->nullOnDelete();
                }
            });
        }

        // 3.12 Wallets
        if (Schema::hasTable('wallets') && !$this->hasForeignKey('wallets', 'shop_id')) {
            Schema::table('wallets', function (Blueprint $table) {
                $table->foreign('shop_id')->references('id')->on('shops')->cascadeOnDelete();
            });
        }

        // 3.13 Seller Payouts
        if (Schema::hasTable('seller_payouts')) {
            Schema::table('seller_payouts', function (Blueprint $table) {
                if (!$this->hasForeignKey('seller_payouts', 'shop_id')) {
                    $table->foreign('shop_id')->references('id')->on('shops')->cascadeOnDelete();
                }
                if (!$this->hasForeignKey('seller_payouts', 'processed_by')) {
                    $table->foreign('processed_by')->references('id')->on('users')->nullOnDelete();
                }
            });
        }

        // 3.14 Refunds (Financial audit ledger)
        if (Schema::hasTable('refunds')) {
            Schema::table('refunds', function (Blueprint $table) {
                if (!$this->hasForeignKey('refunds', 'payment_id')) {
                    $table->foreign('payment_id')->references('id')->on('payments')->nullOnDelete();
                }
                if (!$this->hasForeignKey('refunds', 'return_id')) {
                    $table->foreign('return_id')->references('id')->on('order_returns')->nullOnDelete();
                }
                if (!$this->hasForeignKey('refunds', 'shop_id')) {
                    $table->foreign('shop_id')->references('id')->on('shops')->nullOnDelete();
                }
                if (!$this->hasForeignKey('refunds', 'processed_by')) {
                    $table->foreign('processed_by')->references('id')->on('users')->nullOnDelete();
                }
            });
        }

        // 3.15 Payment Events (Webhook audit trail)
        if (Schema::hasTable('payment_events') && !$this->hasForeignKey('payment_events', 'payment_id')) {
            Schema::table('payment_events', function (Blueprint $table) {
                $table->foreign('payment_id')->references('id')->on('payments')->cascadeOnDelete();
            });
        }

        // 3.16 Voucher Redemptions
        if (Schema::hasTable('voucher_redemptions') && !$this->hasForeignKey('voucher_redemptions', 'order_id')) {
            Schema::table('voucher_redemptions', function (Blueprint $table) {
                $table->foreign('order_id')->references('id')->on('orders')->nullOnDelete();
            });
        }

        // 3.17 Vouchers
        if (Schema::hasTable('vouchers') && !$this->hasForeignKey('vouchers', 'shop_id')) {
            Schema::table('vouchers', function (Blueprint $table) {
                $table->foreign('shop_id')->references('id')->on('shops')->cascadeOnDelete();
            });
        }

        // 3.18 Shipments
        if (Schema::hasTable('shipments') && !$this->hasForeignKey('shipments', 'user_id')) {
            Schema::table('shipments', function (Blueprint $table) {
                $table->foreign('user_id')->references('id')->on('users')->nullOnDelete();
            });
        }

        // =========================================================================
        // 4. UNIQUE CONSTRAINTS (Deduplication & Concurrency Protection)
        // =========================================================================
        if (Schema::hasTable('conversations') && !Schema::hasIndex('conversations', 'conversations_shop_customer_unique')) {
            Schema::table('conversations', function (Blueprint $table) {
                $table->unique(['shop_id', 'customer_id'], 'conversations_shop_customer_unique');
            });
        }

        if (Schema::hasTable('wallets') && !Schema::hasIndex('wallets', 'wallets_shop_id_unique')) {
            Schema::table('wallets', function (Blueprint $table) {
                $table->unique('shop_id', 'wallets_shop_id_unique');
            });
        }

        if (Schema::hasTable('wallet_transactions') && !Schema::hasIndex('wallet_transactions', 'wallet_tx_scoped_unique')) {
            Schema::table('wallet_transactions', function (Blueprint $table) {
                $table->unique(['wallet_id', 'reference_type', 'reference_id', 'type'], 'wallet_tx_scoped_unique');
            });
        }

        if (Schema::hasTable('payment_events') && !Schema::hasIndex('payment_events', 'payment_events_provider_event_unique')) {
            Schema::table('payment_events', function (Blueprint $table) {
                $table->unique(['provider', 'event_id'], 'payment_events_provider_event_unique');
            });
        }

        if (Schema::hasTable('reviews') && !Schema::hasIndex('reviews', 'reviews_order_item_id_unique')) {
            Schema::table('reviews', function (Blueprint $table) {
                $table->unique('order_item_id', 'reviews_order_item_id_unique');
            });
        }

        if (Schema::hasTable('cart_items') && !Schema::hasIndex('cart_items', 'cart_items_scoped_unique')) {
            Schema::table('cart_items', function (Blueprint $table) {
                $table->unique(['cart_id', 'product_id', 'variant_id'], 'cart_items_scoped_unique');
            });
        }

        // =========================================================================
        // 5. QUERY PERFORMANCE INDEXES
        // =========================================================================
        if (Schema::hasTable('products')) {
            Schema::table('products', function (Blueprint $table) {
                if (!Schema::hasIndex('products', 'products_shop_active_idx')) {
                    $table->index(['shop_id', 'is_active'], 'products_shop_active_idx');
                }
                if (!Schema::hasIndex('products', 'products_cat_price_idx')) {
                    $table->index(['category', 'price'], 'products_cat_price_idx');
                }
            });
        }

        if (Schema::hasTable('orders')) {
            Schema::table('orders', function (Blueprint $table) {
                if (!Schema::hasIndex('orders', 'orders_shop_status_idx')) {
                    $table->index(['shop_id', 'status'], 'orders_shop_status_idx');
                }
                if (!Schema::hasIndex('orders', 'orders_user_status_idx')) {
                    $table->index(['user_id', 'status'], 'orders_user_status_idx');
                }
                if (!Schema::hasIndex('orders', 'orders_master_num_idx')) {
                    $table->index('master_order_number', 'orders_master_num_idx');
                }
            });
        }

        if (Schema::hasTable('order_items')) {
            Schema::table('order_items', function (Blueprint $table) {
                if (!Schema::hasIndex('order_items', 'order_items_order_shop_idx')) {
                    $table->index(['order_id', 'shop_id'], 'order_items_order_shop_idx');
                }
                if (!Schema::hasIndex('order_items', 'order_items_product_idx')) {
                    $table->index('product_id', 'order_items_product_idx');
                }
                if (!Schema::hasIndex('order_items', 'order_items_variant_idx')) {
                    $table->index('variant_id', 'order_items_variant_idx');
                }
            });
        }

        if (Schema::hasTable('reviews')) {
            Schema::table('reviews', function (Blueprint $table) {
                if (!Schema::hasIndex('reviews', 'reviews_product_status_idx')) {
                    $table->index(['product_id', 'status'], 'reviews_product_status_idx');
                }
                if (!Schema::hasIndex('reviews', 'reviews_shop_status_idx')) {
                    $table->index(['shop_id', 'status'], 'reviews_shop_status_idx');
                }
            });
        }

        if (Schema::hasTable('product_questions')) {
            Schema::table('product_questions', function (Blueprint $table) {
                if (!Schema::hasIndex('product_questions', 'questions_product_status_idx')) {
                    $table->index(['product_id', 'status'], 'questions_product_status_idx');
                }
            });
        }

        if (Schema::hasTable('product_answers')) {
            Schema::table('product_answers', function (Blueprint $table) {
                if (!Schema::hasIndex('product_answers', 'answers_question_status_idx')) {
                    $table->index(['question_id', 'status'], 'answers_question_status_idx');
                }
            });
        }

        if (Schema::hasTable('conversations')) {
            Schema::table('conversations', function (Blueprint $table) {
                if (!Schema::hasIndex('conversations', 'conv_shop_last_msg_idx')) {
                    $table->index(['shop_id', 'last_message_at'], 'conv_shop_last_msg_idx');
                }
            });
        }

        if (Schema::hasTable('messages')) {
            Schema::table('messages', function (Blueprint $table) {
                if (!Schema::hasIndex('messages', 'messages_conv_created_idx')) {
                    $table->index(['conversation_id', 'created_at'], 'messages_conv_created_idx');
                }
                if (!Schema::hasIndex('messages', 'messages_unread_lookup_idx')) {
                    $table->index(['conversation_id', 'is_read', 'sender_id'], 'messages_unread_lookup_idx');
                }
            });
        }

        if (Schema::hasTable('notifications')) {
            Schema::table('notifications', function (Blueprint $table) {
                if (!Schema::hasIndex('notifications', 'notifications_user_read_idx')) {
                    $table->index(['user_id', 'is_read'], 'notifications_user_read_idx');
                }
            });
        }

        if (Schema::hasTable('shipments')) {
            Schema::table('shipments', function (Blueprint $table) {
                if (!Schema::hasIndex('shipments', 'shipments_order_num_idx')) {
                    $table->index('order_number', 'shipments_order_num_idx');
                }
                if (!Schema::hasIndex('shipments', 'shipments_user_status_idx')) {
                    $table->index(['user_id', 'status'], 'shipments_user_status_idx');
                }
            });
        }

        if (Schema::hasTable('seller_payouts')) {
            Schema::table('seller_payouts', function (Blueprint $table) {
                if (!Schema::hasIndex('seller_payouts', 'payouts_shop_status_idx')) {
                    $table->index(['shop_id', 'status'], 'payouts_shop_status_idx');
                }
            });
        }

        if (Schema::hasTable('refunds')) {
            Schema::table('refunds', function (Blueprint $table) {
                if (!Schema::hasIndex('refunds', 'refunds_order_status_idx')) {
                    $table->index(['order_id', 'status'], 'refunds_order_status_idx');
                }
                if (!Schema::hasIndex('refunds', 'refunds_shop_status_idx')) {
                    $table->index(['shop_id', 'status'], 'refunds_shop_status_idx');
                }
            });
        }

        if (Schema::hasTable('wallet_transactions')) {
            Schema::table('wallet_transactions', function (Blueprint $table) {
                if (!Schema::hasIndex('wallet_transactions', 'wallet_tx_wallet_created_idx')) {
                    $table->index(['wallet_id', 'created_at'], 'wallet_tx_wallet_created_idx');
                }
            });
        }

        // =========================================================================
        // 6. FINANCIAL CHECK CONSTRAINTS & TRIGGERS
        // =========================================================================
        $driver = DB::getDriverName();

        if (in_array($driver, ['mysql', 'mariadb'])) {
            $checkStatements = [
                'ALTER TABLE refunds ADD CONSTRAINT chk_refunds_amount_positive CHECK (amount > 0)',
                'ALTER TABLE wallet_transactions ADD CONSTRAINT chk_wallet_tx_amount_positive CHECK (amount > 0)',
                'ALTER TABLE payments ADD CONSTRAINT chk_payments_amount_non_negative CHECK (amount >= 0)',
                'ALTER TABLE payments ADD CONSTRAINT chk_payments_refunded_non_negative CHECK (refunded_amount >= 0)',
            ];
            foreach ($checkStatements as $sql) {
                DB::statement($sql);
            }
        } elseif ($driver === 'sqlite') {
            $sqliteTriggers = [
                'CREATE TRIGGER IF NOT EXISTS trg_refunds_amount_positive_ins BEFORE INSERT ON refunds FOR EACH ROW WHEN NEW.amount <= 0 BEGIN SELECT RAISE(ABORT, "Refund amount must be strictly greater than 0"); END;',
                'CREATE TRIGGER IF NOT EXISTS trg_refunds_amount_positive_upd BEFORE UPDATE ON refunds FOR EACH ROW WHEN NEW.amount <= 0 BEGIN SELECT RAISE(ABORT, "Refund amount must be strictly greater than 0"); END;',
                'CREATE TRIGGER IF NOT EXISTS trg_wallet_tx_amount_positive_ins BEFORE INSERT ON wallet_transactions FOR EACH ROW WHEN NEW.amount <= 0 BEGIN SELECT RAISE(ABORT, "Transaction amount must be strictly greater than 0"); END;',
                'CREATE TRIGGER IF NOT EXISTS trg_payments_amount_non_neg_ins BEFORE INSERT ON payments FOR EACH ROW WHEN NEW.amount < 0 BEGIN SELECT RAISE(ABORT, "Payment amount cannot be negative"); END;',
                'CREATE TRIGGER IF NOT EXISTS trg_payments_amount_non_neg_upd BEFORE UPDATE ON payments FOR EACH ROW WHEN NEW.amount < 0 BEGIN SELECT RAISE(ABORT, "Payment amount cannot be negative"); END;',
            ];
            foreach ($sqliteTriggers as $sql) {
                DB::statement($sql);
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
                'trg_refunds_amount_positive_ins',
                'trg_refunds_amount_positive_upd',
                'trg_wallet_tx_amount_positive_ins',
                'trg_payments_amount_non_neg_ins',
                'trg_payments_amount_non_neg_upd',
            ];
            foreach ($triggers as $trigger) {
                DB::statement("DROP TRIGGER IF EXISTS {$trigger}");
            }
        } elseif (in_array($driver, ['mysql', 'mariadb'])) {
            $checks = [
                ['refunds', 'chk_refunds_amount_positive'],
                ['wallet_transactions', 'chk_wallet_tx_amount_positive'],
                ['payments', 'chk_payments_amount_non_negative'],
                ['payments', 'chk_payments_refunded_non_negative'],
            ];
            foreach ($checks as [$tbl, $chk]) {
                DB::statement("ALTER TABLE {$tbl} DROP CONSTRAINT {$chk}");
            }
        }

        // Drop added indexes
        if (Schema::hasTable('wallet_transactions') && Schema::hasIndex('wallet_transactions', 'wallet_tx_wallet_created_idx')) {
            Schema::table('wallet_transactions', function (Blueprint $table) {
                $table->dropIndex('wallet_tx_wallet_created_idx');
            });
        }

        if (Schema::hasTable('refunds')) {
            Schema::table('refunds', function (Blueprint $table) {
                if (Schema::hasIndex('refunds', 'refunds_order_status_idx')) $table->dropIndex('refunds_order_status_idx');
                if (Schema::hasIndex('refunds', 'refunds_shop_status_idx')) $table->dropIndex('refunds_shop_status_idx');
            });
        }

        if (Schema::hasTable('seller_payouts') && Schema::hasIndex('seller_payouts', 'payouts_shop_status_idx')) {
            Schema::table('seller_payouts', function (Blueprint $table) {
                $table->dropIndex('payouts_shop_status_idx');
            });
        }

        if (Schema::hasTable('shipments')) {
            Schema::table('shipments', function (Blueprint $table) {
                if (Schema::hasIndex('shipments', 'shipments_order_num_idx')) $table->dropIndex('shipments_order_num_idx');
                if (Schema::hasIndex('shipments', 'shipments_user_status_idx')) $table->dropIndex('shipments_user_status_idx');
            });
        }

        if (Schema::hasTable('notifications') && Schema::hasIndex('notifications', 'notifications_user_read_idx')) {
            Schema::table('notifications', function (Blueprint $table) {
                $table->dropIndex('notifications_user_read_idx');
            });
        }

        if (Schema::hasTable('messages')) {
            Schema::table('messages', function (Blueprint $table) {
                if (Schema::hasIndex('messages', 'messages_conv_created_idx')) $table->dropIndex('messages_conv_created_idx');
                if (Schema::hasIndex('messages', 'messages_unread_lookup_idx')) $table->dropIndex('messages_unread_lookup_idx');
            });
        }

        if (Schema::hasTable('conversations') && Schema::hasIndex('conversations', 'conv_shop_last_msg_idx')) {
            Schema::table('conversations', function (Blueprint $table) {
                $table->dropIndex('conv_shop_last_msg_idx');
            });
        }

        if (Schema::hasTable('product_answers') && Schema::hasIndex('product_answers', 'answers_question_status_idx')) {
            Schema::table('product_answers', function (Blueprint $table) {
                $table->dropIndex('answers_question_status_idx');
            });
        }

        if (Schema::hasTable('product_questions') && Schema::hasIndex('product_questions', 'questions_product_status_idx')) {
            Schema::table('product_questions', function (Blueprint $table) {
                $table->dropIndex('questions_product_status_idx');
            });
        }

        if (Schema::hasTable('reviews')) {
            Schema::table('reviews', function (Blueprint $table) {
                if (Schema::hasIndex('reviews', 'reviews_product_status_idx')) $table->dropIndex('reviews_product_status_idx');
                if (Schema::hasIndex('reviews', 'reviews_shop_status_idx')) $table->dropIndex('reviews_shop_status_idx');
            });
        }

        if (Schema::hasTable('order_items')) {
            Schema::table('order_items', function (Blueprint $table) {
                if (Schema::hasIndex('order_items', 'order_items_order_shop_idx')) $table->dropIndex('order_items_order_shop_idx');
                if (Schema::hasIndex('order_items', 'order_items_product_idx')) $table->dropIndex('order_items_product_idx');
                if (Schema::hasIndex('order_items', 'order_items_variant_idx')) $table->dropIndex('order_items_variant_idx');
            });
        }

        if (Schema::hasTable('orders')) {
            Schema::table('orders', function (Blueprint $table) {
                if (Schema::hasIndex('orders', 'orders_shop_status_idx')) $table->dropIndex('orders_shop_status_idx');
                if (Schema::hasIndex('orders', 'orders_user_status_idx')) $table->dropIndex('orders_user_status_idx');
                if (Schema::hasIndex('orders', 'orders_master_num_idx')) $table->dropIndex('orders_master_num_idx');
            });
        }

        if (Schema::hasTable('products')) {
            Schema::table('products', function (Blueprint $table) {
                if (Schema::hasIndex('products', 'products_shop_active_idx')) $table->dropIndex('products_shop_active_idx');
                if (Schema::hasIndex('products', 'products_cat_price_idx')) $table->dropIndex('products_cat_price_idx');
            });
        }

        // Drop unique constraints
        if (Schema::hasTable('cart_items') && Schema::hasIndex('cart_items', 'cart_items_scoped_unique')) {
            Schema::table('cart_items', function (Blueprint $table) {
                $table->dropUnique('cart_items_scoped_unique');
            });
        }

        if (Schema::hasTable('reviews') && Schema::hasIndex('reviews', 'reviews_order_item_id_unique')) {
            Schema::table('reviews', function (Blueprint $table) {
                $table->dropUnique('reviews_order_item_id_unique');
            });
        }

        if (Schema::hasTable('payment_events') && Schema::hasIndex('payment_events', 'payment_events_provider_event_unique')) {
            Schema::table('payment_events', function (Blueprint $table) {
                $table->dropUnique('payment_events_provider_event_unique');
            });
        }

        if (Schema::hasTable('wallet_transactions') && Schema::hasIndex('wallet_transactions', 'wallet_tx_scoped_unique')) {
            Schema::table('wallet_transactions', function (Blueprint $table) {
                $table->dropUnique('wallet_tx_scoped_unique');
            });
        }

        if (Schema::hasTable('wallets') && Schema::hasIndex('wallets', 'wallets_shop_id_unique')) {
            Schema::table('wallets', function (Blueprint $table) {
                $table->dropUnique('wallets_shop_id_unique');
            });
        }

        if (Schema::hasTable('conversations') && Schema::hasIndex('conversations', 'conversations_shop_customer_unique')) {
            Schema::table('conversations', function (Blueprint $table) {
                $table->dropUnique('conversations_shop_customer_unique');
            });
        }

        // Drop foreign keys
        if (Schema::hasTable('shipments') && $this->hasForeignKey('shipments', 'user_id')) {
            Schema::table('shipments', function (Blueprint $table) {
                $table->dropForeign(['user_id']);
            });
        }

        if (Schema::hasTable('vouchers') && $this->hasForeignKey('vouchers', 'shop_id')) {
            Schema::table('vouchers', function (Blueprint $table) {
                $table->dropForeign(['shop_id']);
            });
        }

        if (Schema::hasTable('voucher_redemptions') && $this->hasForeignKey('voucher_redemptions', 'order_id')) {
            Schema::table('voucher_redemptions', function (Blueprint $table) {
                $table->dropForeign(['order_id']);
            });
        }

        if (Schema::hasTable('payment_events') && $this->hasForeignKey('payment_events', 'payment_id')) {
            Schema::table('payment_events', function (Blueprint $table) {
                $table->dropForeign(['payment_id']);
            });
        }

        if (Schema::hasTable('refunds')) {
            Schema::table('refunds', function (Blueprint $table) {
                if ($this->hasForeignKey('refunds', 'processed_by')) $table->dropForeign(['processed_by']);
                if ($this->hasForeignKey('refunds', 'shop_id')) $table->dropForeign(['shop_id']);
                if ($this->hasForeignKey('refunds', 'return_id')) $table->dropForeign(['return_id']);
                if ($this->hasForeignKey('refunds', 'payment_id')) $table->dropForeign(['payment_id']);
            });
        }

        if (Schema::hasTable('seller_payouts')) {
            Schema::table('seller_payouts', function (Blueprint $table) {
                if ($this->hasForeignKey('seller_payouts', 'processed_by')) $table->dropForeign(['processed_by']);
                if ($this->hasForeignKey('seller_payouts', 'shop_id')) $table->dropForeign(['shop_id']);
            });
        }

        if (Schema::hasTable('wallets') && $this->hasForeignKey('wallets', 'shop_id')) {
            Schema::table('wallets', function (Blueprint $table) {
                $table->dropForeign(['shop_id']);
            });
        }

        if (Schema::hasTable('disputes')) {
            Schema::table('disputes', function (Blueprint $table) {
                if ($this->hasForeignKey('disputes', 'resolved_by')) $table->dropForeign(['resolved_by']);
                if ($this->hasForeignKey('disputes', 'shop_id')) $table->dropForeign(['shop_id']);
            });
        }

        if (Schema::hasTable('order_returns')) {
            Schema::table('order_returns', function (Blueprint $table) {
                if ($this->hasForeignKey('order_returns', 'processed_by')) $table->dropForeign(['processed_by']);
                if ($this->hasForeignKey('order_returns', 'order_item_id')) $table->dropForeign(['order_item_id']);
                if ($this->hasForeignKey('order_returns', 'shop_id')) $table->dropForeign(['shop_id']);
            });
        }

        if (Schema::hasTable('conversations') && $this->hasForeignKey('conversations', 'shop_id')) {
            Schema::table('conversations', function (Blueprint $table) {
                $table->dropForeign(['shop_id']);
            });
        }

        if (Schema::hasTable('product_answers') && $this->hasForeignKey('product_answers', 'shop_id')) {
            Schema::table('product_answers', function (Blueprint $table) {
                $table->dropForeign(['shop_id']);
            });
        }

        if (Schema::hasTable('reviews')) {
            Schema::table('reviews', function (Blueprint $table) {
                if ($this->hasForeignKey('reviews', 'shop_id')) $table->dropForeign(['shop_id']);
                if ($this->hasForeignKey('reviews', 'order_item_id')) $table->dropForeign(['order_item_id']);
                if ($this->hasForeignKey('reviews', 'order_id')) $table->dropForeign(['order_id']);
            });
        }

        if (Schema::hasTable('cart_items') && $this->hasForeignKey('cart_items', 'variant_id')) {
            Schema::table('cart_items', function (Blueprint $table) {
                $table->dropForeign(['variant_id']);
            });
        }

        if (Schema::hasTable('order_items')) {
            Schema::table('order_items', function (Blueprint $table) {
                if ($this->hasForeignKey('order_items', 'variant_id')) $table->dropForeign(['variant_id']);
                if ($this->hasForeignKey('order_items', 'product_id')) $table->dropForeign(['product_id']);
                if ($this->hasForeignKey('order_items', 'shop_id')) $table->dropForeign(['shop_id']);
            });
        }

        if (Schema::hasTable('orders') && $this->hasForeignKey('orders', 'shop_id')) {
            Schema::table('orders', function (Blueprint $table) {
                $table->dropForeign(['shop_id']);
            });
        }

        if (Schema::hasTable('carts') && $this->hasForeignKey('carts', 'user_id')) {
            Schema::table('carts', function (Blueprint $table) {
                $table->dropForeign(['user_id']);
            });
        }

        if (Schema::hasTable('products') && $this->hasForeignKey('products', 'shop_id')) {
            Schema::table('products', function (Blueprint $table) {
                $table->dropForeign(['shop_id']);
            });
        }

        if (Schema::hasTable('shops') && $this->hasForeignKey('shops', 'user_id')) {
            Schema::table('shops', function (Blueprint $table) {
                $table->dropForeign(['user_id']);
            });
        }

        // Drop soft deletes
        if (Schema::hasTable('orders') && Schema::hasColumn('orders', 'deleted_at')) {
            Schema::table('orders', function (Blueprint $table) {
                $table->dropSoftDeletes();
            });
        }

        if (Schema::hasTable('shops') && Schema::hasColumn('shops', 'deleted_at')) {
            Schema::table('shops', function (Blueprint $table) {
                $table->dropSoftDeletes();
            });
        }

        if (Schema::hasTable('users') && Schema::hasColumn('users', 'deleted_at')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropSoftDeletes();
            });
        }
    }
};
