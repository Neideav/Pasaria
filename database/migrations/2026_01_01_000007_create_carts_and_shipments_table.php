<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('carts', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id')->unique();
            $table->longText('items_json')->nullable();
            $table->timestamps();
        });

        Schema::create('shipments', function (Blueprint $table) {
            $table->id();
            $table->string('shipment_id')->unique();
            $table->string('order_number');
            $table->unsignedBigInteger('user_id')->nullable();
            $table->string('courier_name');
            $table->string('courier_service')->nullable();
            $table->string('tracking_number')->unique();
            $table->string('status')->default('in_transit');
            $table->string('status_label')->nullable();
            $table->string('recipient_name')->nullable();
            $table->string('recipient_phone')->nullable();
            $table->text('delivery_address')->nullable();
            $table->text('origin_address')->nullable();
            $table->string('estimated_arrival')->nullable();
            $table->string('driver_name')->nullable();
            $table->string('driver_phone')->nullable();
            $table->string('driver_vehicle')->nullable();
            $table->string('current_location')->nullable();
            $table->integer('items_count')->default(1);
            $table->longText('items_preview_json')->nullable();
            $table->decimal('total_amount', 10, 2)->default(0);
            $table->longText('checkpoints_json')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('shipments');
        Schema::dropIfExists('carts');
    }
};
