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
        // 1. Soft Deletes for products
        if (Schema::hasTable('products') && !Schema::hasColumn('products', 'deleted_at')) {
            Schema::table('products', function (Blueprint $table) {
                $table->softDeletes()->after('updated_at');
            });
        }

        // 2. Soft Deletes for product_variants
        if (Schema::hasTable('product_variants') && !Schema::hasColumn('product_variants', 'deleted_at')) {
            Schema::table('product_variants', function (Blueprint $table) {
                $table->softDeletes()->after('updated_at');
            });
        }

        // 3. usage_per_user on vouchers
        if (Schema::hasTable('vouchers') && !Schema::hasColumn('vouchers', 'usage_per_user')) {
            Schema::table('vouchers', function (Blueprint $table) {
                $table->integer('usage_per_user')->default(1)->after('usage_limit');
            });
        }

        // 4. status column on voucher_redemptions
        if (Schema::hasTable('voucher_redemptions') && !Schema::hasColumn('voucher_redemptions', 'status')) {
            Schema::table('voucher_redemptions', function (Blueprint $table) {
                $table->string('status')->default('applied')->after('discount_amount');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('products') && Schema::hasColumn('products', 'deleted_at')) {
            Schema::table('products', function (Blueprint $table) {
                $table->dropSoftDeletes();
            });
        }

        if (Schema::hasTable('product_variants') && Schema::hasColumn('product_variants', 'deleted_at')) {
            Schema::table('product_variants', function (Blueprint $table) {
                $table->dropSoftDeletes();
            });
        }

        if (Schema::hasTable('vouchers') && Schema::hasColumn('vouchers', 'usage_per_user')) {
            Schema::table('vouchers', function (Blueprint $table) {
                $table->dropColumn('usage_per_user');
            });
        }

        if (Schema::hasTable('voucher_redemptions') && Schema::hasColumn('voucher_redemptions', 'status')) {
            Schema::table('voucher_redemptions', function (Blueprint $table) {
                $table->dropColumn('status');
            });
        }
    }
};
