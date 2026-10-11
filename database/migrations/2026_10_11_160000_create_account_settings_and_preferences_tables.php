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
        // 1. User Notification Preferences
        if (!Schema::hasTable('user_notification_preferences')) {
            Schema::create('user_notification_preferences', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
                $table->boolean('order_updates_email')->default(true);
                $table->boolean('order_updates_in_app')->default(true);
                $table->boolean('chat_messages_email')->default(true);
                $table->boolean('chat_messages_in_app')->default(true);
                $table->boolean('promotions_email')->default(false);
                $table->boolean('promotions_in_app')->default(false);
                $table->boolean('wishlist_alerts_email')->default(true);
                $table->boolean('wishlist_alerts_in_app')->default(true);
                $table->boolean('security_alerts_email')->default(true);
                $table->boolean('security_alerts_in_app')->default(true);
                $table->timestamps();

                $table->unique('user_id');
            });
        }

        // 2. User Privacy Preferences
        if (!Schema::hasTable('user_privacy_preferences')) {
            Schema::create('user_privacy_preferences', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
                $table->boolean('personalization_enabled')->default(true);
                $table->boolean('marketing_communication')->default(false);
                $table->boolean('activity_logging')->default(true);
                $table->timestamps();

                $table->unique('user_id');
            });
        }

        // 3. User Two-Factor Authentication
        if (!Schema::hasTable('user_two_factor_auth')) {
            Schema::create('user_two_factor_auth', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
                $table->boolean('enabled')->default(false);
                $table->string('secret')->nullable();
                $table->text('recovery_codes_json')->nullable();
                $table->timestamp('confirmed_at')->nullable();
                $table->timestamps();

                $table->unique('user_id');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_two_factor_auth');
        Schema::dropIfExists('user_privacy_preferences');
        Schema::dropIfExists('user_notification_preferences');
    }
};
