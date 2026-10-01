<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('products')) {
            Schema::table('products', function (Blueprint $table) {
                if (!Schema::hasColumn('products', 'shop_id')) {
                    $table->unsignedBigInteger('shop_id')->default(1)->nullable();
                }
                if (!Schema::hasColumn('products', 'shop_name')) {
                    $table->string('shop_name')->default('Shopcart Official Merchant')->nullable();
                }
                if (!Schema::hasColumn('products', 'shop_logo')) {
                    $table->longText('shop_logo')->nullable();
                }
                if (!Schema::hasColumn('products', 'shop_city')) {
                    $table->string('shop_city')->default('Jakarta')->nullable();
                }
            });

            // Modify image, short_desc, description to longText to accommodate Base64 uploads without doctrine/dbal requirement
            try {
                DB::statement('ALTER TABLE products MODIFY image LONGTEXT NULL');
            } catch (\Throwable $e) {}

            try {
                DB::statement('ALTER TABLE products MODIFY short_desc TEXT NULL');
            } catch (\Throwable $e) {}

            try {
                DB::statement('ALTER TABLE products MODIFY description LONGTEXT NULL');
            } catch (\Throwable $e) {}
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('products')) {
            Schema::table('products', function (Blueprint $table) {
                if (Schema::hasColumn('products', 'shop_id')) {
                    $table->dropColumn('shop_id');
                }
                if (Schema::hasColumn('products', 'shop_name')) {
                    $table->dropColumn('shop_name');
                }
                if (Schema::hasColumn('products', 'shop_logo')) {
                    $table->dropColumn('shop_logo');
                }
                if (Schema::hasColumn('products', 'shop_city')) {
                    $table->dropColumn('shop_city');
                }
            });
        }
    }
};
