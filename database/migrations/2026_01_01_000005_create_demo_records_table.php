<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Create demo_records table.
     *
     * This table exists specifically for SQL Injection UNION-based data extraction
     * demonstrations in a controlled, local educational environment.
     * All data is fictional dummy records — no real or sensitive data is stored here.
     */
    public function up(): void
    {
        Schema::create('demo_records', function (Blueprint $table) {
            $table->id();
            $table->string('record_name');
            $table->string('record_value');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('demo_records');
    }
};
