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
        // 1. User Shopping Preferences
        if (!Schema::hasTable('user_shopping_preferences')) {
            Schema::create('user_shopping_preferences', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
                $table->json('favorite_categories')->nullable();
                $table->json('favorite_brands')->nullable();
                $table->decimal('min_price', 12, 2)->nullable();
                $table->decimal('max_price', 12, 2)->nullable();
                $table->boolean('hide_out_of_stock')->default(false);
                $table->boolean('prioritize_official_stores')->default(false);
                $table->string('default_sort')->default('popular');
                $table->string('preferred_density')->default('comfortable');
                $table->boolean('recommendation_personalization')->default(true);
                $table->string('theme')->default('light');
                $table->string('font_size')->default('normal');
                $table->boolean('reduced_motion')->default(false);
                $table->boolean('high_contrast')->default(false);
                $table->timestamps();

                $table->unique('user_id');
            });
        }

        // 2. Product Alerts & Price Watch
        if (!Schema::hasTable('product_alerts')) {
            Schema::create('product_alerts', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
                $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
                $table->string('alert_type'); // 'price_drop', 'back_in_stock', 'target_price', 'shop_new_product'
                $table->decimal('target_price', 12, 2)->nullable();
                $table->decimal('last_observed_price', 12, 2)->nullable();
                $table->boolean('is_active')->default(true);
                $table->timestamp('last_notified_at')->nullable();
                $table->timestamps();

                $table->unique(['user_id', 'product_id', 'alert_type']);
                $table->index(['product_id', 'alert_type', 'is_active']);
            });
        }

        // 3. User Search History
        if (!Schema::hasTable('user_search_histories')) {
            Schema::create('user_search_histories', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
                $table->string('query', 255);
                $table->timestamps();

                $table->unique(['user_id', 'query']);
                $table->index(['user_id', 'updated_at']);
            });
        }

        // 4. User Viewed Products History
        if (!Schema::hasTable('user_viewed_products')) {
            Schema::create('user_viewed_products', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
                $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
                $table->timestamps();

                $table->unique(['user_id', 'product_id']);
                $table->index(['user_id', 'updated_at']);
            });
        }

        // 5. Seller Preferences (Low stock threshold, vacation mode, seller notifications)
        if (!Schema::hasTable('seller_preferences')) {
            Schema::create('seller_preferences', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
                $table->foreignId('shop_id')->constrained('shops')->cascadeOnDelete();
                $table->boolean('notify_new_orders')->default(true);
                $table->boolean('notify_customer_chat')->default(true);
                $table->boolean('notify_low_stock')->default(true);
                $table->boolean('notify_reviews')->default(true);
                $table->boolean('notify_returns')->default(true);
                $table->unsignedInteger('low_stock_threshold')->default(5);
                $table->boolean('vacation_mode')->default(false);
                $table->text('vacation_message')->nullable();
                $table->timestamp('vacation_start')->nullable();
                $table->timestamp('vacation_end')->nullable();
                $table->timestamps();

                $table->unique('user_id');
                $table->unique('shop_id');
            });
        }

        // 6. Shop Followers notification preferences
        if (Schema::hasTable('shop_followers') && !Schema::hasColumn('shop_followers', 'notify_new_products')) {
            Schema::table('shop_followers', function (Blueprint $table) {
                $table->boolean('notify_new_products')->default(true);
            });
        }

        // 7. Expand User Notification Preferences
        if (Schema::hasTable('user_notification_preferences')) {
            Schema::table('user_notification_preferences', function (Blueprint $table) {
                if (!Schema::hasColumn('user_notification_preferences', 'shipping_updates_email')) {
                    $table->boolean('shipping_updates_email')->default(true);
                    $table->boolean('shipping_updates_in_app')->default(true);
                }
                if (!Schema::hasColumn('user_notification_preferences', 'product_qa_email')) {
                    $table->boolean('product_qa_email')->default(true);
                    $table->boolean('product_qa_in_app')->default(true);
                }
                if (!Schema::hasColumn('user_notification_preferences', 'review_activity_email')) {
                    $table->boolean('review_activity_email')->default(true);
                    $table->boolean('review_activity_in_app')->default(true);
                }
                if (!Schema::hasColumn('user_notification_preferences', 'shop_updates_email')) {
                    $table->boolean('shop_updates_email')->default(true);
                    $table->boolean('shop_updates_in_app')->default(true);
                }
                if (!Schema::hasColumn('user_notification_preferences', 'price_alerts_email')) {
                    $table->boolean('price_alerts_email')->default(true);
                    $table->boolean('price_alerts_in_app')->default(true);
                }
                if (!Schema::hasColumn('user_notification_preferences', 'stock_alerts_email')) {
                    $table->boolean('stock_alerts_email')->default(true);
                    $table->boolean('stock_alerts_in_app')->default(true);
                }
                if (!Schema::hasColumn('user_notification_preferences', 'quiet_hours_enabled')) {
                    $table->boolean('quiet_hours_enabled')->default(false);
                    $table->string('quiet_hours_start')->default('22:00');
                    $table->string('quiet_hours_end')->default('07:00');
                    $table->string('timezone')->default('Asia/Jakarta');
                    $table->string('email_digest_frequency')->default('instant');
                }
            });
        }

        // 8. Expand User Privacy Preferences
        if (Schema::hasTable('user_privacy_preferences')) {
            Schema::table('user_privacy_preferences', function (Blueprint $table) {
                if (!Schema::hasColumn('user_privacy_preferences', 'default_anonymous_reviews')) {
                    $table->boolean('default_anonymous_reviews')->default(false);
                }
                if (!Schema::hasColumn('user_privacy_preferences', 'show_profile_publicly')) {
                    $table->boolean('show_profile_publicly')->default(true);
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('user_privacy_preferences')) {
            Schema::table('user_privacy_preferences', function (Blueprint $table) {
                if (Schema::hasColumn('user_privacy_preferences', 'default_anonymous_reviews')) {
                    $table->dropColumn(['default_anonymous_reviews', 'show_profile_publicly']);
                }
            });
        }

        if (Schema::hasTable('user_notification_preferences')) {
            Schema::table('user_notification_preferences', function (Blueprint $table) {
                $columns = [
                    'shipping_updates_email', 'shipping_updates_in_app',
                    'product_qa_email', 'product_qa_in_app',
                    'review_activity_email', 'review_activity_in_app',
                    'shop_updates_email', 'shop_updates_in_app',
                    'price_alerts_email', 'price_alerts_in_app',
                    'stock_alerts_email', 'stock_alerts_in_app',
                    'quiet_hours_enabled', 'quiet_hours_start', 'quiet_hours_end',
                    'timezone', 'email_digest_frequency',
                ];
                $toDrop = array_filter($columns, fn($col) => Schema::hasColumn('user_notification_preferences', $col));
                if (!empty($toDrop)) {
                    $table->dropColumn($toDrop);
                }
            });
        }

        if (Schema::hasTable('shop_followers') && Schema::hasColumn('shop_followers', 'notify_new_products')) {
            Schema::table('shop_followers', function (Blueprint $table) {
                $table->dropColumn('notify_new_products');
            });
        }

        Schema::dropIfExists('seller_preferences');
        Schema::dropIfExists('user_viewed_products');
        Schema::dropIfExists('user_search_histories');
        Schema::dropIfExists('product_alerts');
        Schema::dropIfExists('user_shopping_preferences');
    }
};
