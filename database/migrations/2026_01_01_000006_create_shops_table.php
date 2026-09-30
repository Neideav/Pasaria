<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('shops', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('slogan')->nullable();
            $table->string('city')->default('Jakarta');
            $table->string('phone')->nullable();
            $table->text('description')->nullable();
            $table->longText('logo')->nullable();
            $table->longText('banner')->nullable();
            $table->decimal('rating', 3, 2)->default(5.0);
            $table->integer('review_count')->default(0);
            $table->boolean('verified')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('shops');
    }
};
