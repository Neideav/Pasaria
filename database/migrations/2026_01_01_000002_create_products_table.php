<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('category');
            $table->decimal('price', 10, 2);
            $table->decimal('original_price', 10, 2)->nullable();
            $table->decimal('monthly_price', 10, 2)->nullable();
            $table->string('short_desc')->nullable();
            $table->text('description')->nullable();
            $table->string('image');
            $table->float('rating')->default(5.0);
            $table->integer('review_count')->default(0);
            $table->integer('stock')->default(10);
            $table->json('colors')->nullable();
            $table->json('specs')->nullable();
            $table->unsignedBigInteger('shop_id')->default(1);
            $table->string('shop_name')->default('Shopcart Official Merchant');
            $table->longText('shop_logo')->nullable();
            $table->string('shop_city')->default('Jakarta');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
