<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Idempotency Keys table for reliable, persistent order and payout deduplication
        if (!Schema::hasTable('idempotency_keys')) {
            Schema::create('idempotency_keys', function (Blueprint $table) {
                $table->id();
                $table->string('key')->unique();
                $table->foreignId('user_id')->constrained()->cascadeOnDelete();
                $table->string('action')->default('checkout'); // checkout, payout, refund
                $table->string('resource_id')->nullable(); // e.g. order_number or payout_ref
                $table->longText('response_json')->nullable();
                $table->timestamps();

                $table->index(['user_id', 'action']);
            });
        }

        // 2. Add order_item_id and indexes to order_returns if missing
        if (Schema::hasTable('order_returns')) {
            Schema::table('order_returns', function (Blueprint $table) {
                if (!Schema::hasColumn('order_returns', 'order_item_id')) {
                    $table->unsignedBigInteger('order_item_id')->nullable()->after('order_id');
                }
            });
        }

        // 3. Unique index on reviews to prevent duplicate review for the same order_item
        if (Schema::hasTable('reviews')) {
            Schema::table('reviews', function (Blueprint $table) {
                // Ensure order_item_id has index / constraint if not already present
                try {
                    $table->unique('order_item_id', 'reviews_order_item_id_unique');
                } catch (\Throwable $e) {
                    // Ignore if unique index exists
                }
            });
        }

        // 4. Cart items indexing for fast variant matching
        if (Schema::hasTable('cart_items')) {
            Schema::table('cart_items', function (Blueprint $table) {
                try {
                    $table->index(['cart_id', 'product_id', 'variant_id'], 'cart_items_lookup_index');
                } catch (\Throwable $e) {
                    // Ignore if already indexed
                }
            });
        }

        // 5. Orders idempotency index
        if (Schema::hasTable('orders')) {
            Schema::table('orders', function (Blueprint $table) {
                try {
                    $table->index('idempotency_key', 'orders_idempotency_key_index');
                } catch (\Throwable $e) {
                    // Ignore if index exists
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('idempotency_keys');

        if (Schema::hasTable('reviews')) {
            Schema::table('reviews', function (Blueprint $table) {
                try {
                    $table->dropUnique('reviews_order_item_id_unique');
                } catch (\Throwable $e) {}
            });
        }

        if (Schema::hasTable('order_returns')) {
            Schema::table('order_returns', function (Blueprint $table) {
                if (Schema::hasColumn('order_returns', 'order_item_id')) {
                    $table->dropColumn('order_item_id');
                }
            });
        }
    }
};
