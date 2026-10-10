<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Drop the demo_records table used previously for educational CTF demonstrations.
     */
    public function up(): void
    {
        Schema::dropIfExists('demo_records');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (!Schema::hasTable('demo_records')) {
            Schema::create('demo_records', function (Blueprint $table) {
                $table->id();
                $table->string('record_name');
                $table->text('record_value');
                $table->timestamps();
            });
        }
    }
};
