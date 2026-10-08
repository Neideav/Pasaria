<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. User Addresses
        if (!Schema::hasTable('user_addresses')) {
            Schema::create('user_addresses', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained()->cascadeOnDelete();
                $table->string('recipient_name');
                $table->string('phone');
                $table->text('address_line');
                $table->string('city');
                $table->string('province')->default('DKI Jakarta');
                $table->string('postal_code');
                $table->boolean('is_default')->default(false);
                $table->timestamps();

                $table->index('user_id');
            });
        }

        // 2. Brands
        if (!Schema::hasTable('brands')) {
            Schema::create('brands', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('slug')->unique();
                $table->string('logo')->nullable();
                $table->text('description')->nullable();
                $table->timestamps();
            });
        }

        // 3. Shop Followers
        if (!Schema::hasTable('shop_followers')) {
            Schema::create('shop_followers', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained()->cascadeOnDelete();
                $table->foreignId('shop_id')->constrained()->cascadeOnDelete();
                $table->timestamps();

                $table->unique(['user_id', 'shop_id']);
                $table->index('user_id');
                $table->index('shop_id');
            });
        }

        // 4. Product Variants
        if (!Schema::hasTable('product_variants')) {
            Schema::create('product_variants', function (Blueprint $table) {
                $table->id();
                $table->foreignId('product_id')->constrained()->cascadeOnDelete();
                $table->string('sku')->unique()->nullable();
                $table->string('name');
                $table->text('attributes_json')->nullable();
                $table->decimal('price', 12, 2);
                $table->integer('stock')->default(0);
                $table->integer('weight_grams')->default(200);
                $table->string('image')->nullable();
                $table->timestamps();

                $table->index('product_id');
            });
        }

        // 5. Product Images
        if (!Schema::hasTable('product_images')) {
            Schema::create('product_images', function (Blueprint $table) {
                $table->id();
                $table->foreignId('product_id')->constrained()->cascadeOnDelete();
                $table->string('image_url');
                $table->integer('sort_order')->default(0);
                $table->boolean('is_primary')->default(false);
                $table->timestamps();

                $table->index('product_id');
            });
        }

        // 6. Wishlists
        if (!Schema::hasTable('wishlists')) {
            Schema::create('wishlists', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained()->cascadeOnDelete();
                $table->foreignId('product_id')->constrained()->cascadeOnDelete();
                $table->timestamps();

                $table->unique(['user_id', 'product_id']);
                $table->index('user_id');
            });
        }

        // 7. Cart Items (Relational cart)
        if (!Schema::hasTable('cart_items')) {
            Schema::create('cart_items', function (Blueprint $table) {
                $table->id();
                $table->foreignId('cart_id')->constrained()->cascadeOnDelete();
                $table->foreignId('product_id')->constrained()->cascadeOnDelete();
                $table->unsignedBigInteger('variant_id')->nullable();
                $table->integer('quantity')->default(1);
                $table->string('selected_color')->nullable();
                $table->timestamps();

                $table->index(['cart_id', 'product_id']);
            });
        }

        // 8. Vouchers
        if (!Schema::hasTable('vouchers')) {
            Schema::create('vouchers', function (Blueprint $table) {
                $table->id();
                $table->string('code')->unique();
                $table->string('name');
                $table->string('type')->default('percentage'); // percentage, fixed_amount, free_shipping
                $table->decimal('discount_value', 12, 2);
                $table->decimal('min_purchase', 12, 2)->default(0);
                $table->decimal('max_discount', 12, 2)->nullable();
                $table->integer('usage_limit')->default(100);
                $table->integer('usage_count')->default(0);
                $table->timestamp('start_at')->nullable();
                $table->timestamp('end_at')->nullable();
                $table->unsignedBigInteger('shop_id')->nullable(); // null for platform voucher
                $table->boolean('is_active')->default(true);
                $table->timestamps();

                $table->index('code');
            });
        }

        // 9. Voucher Redemptions
        if (!Schema::hasTable('voucher_redemptions')) {
            Schema::create('voucher_redemptions', function (Blueprint $table) {
                $table->id();
                $table->foreignId('voucher_id')->constrained()->cascadeOnDelete();
                $table->foreignId('user_id')->constrained()->cascadeOnDelete();
                $table->unsignedBigInteger('order_id')->nullable();
                $table->decimal('discount_amount', 12, 2)->default(0);
                $table->timestamps();

                $table->index(['voucher_id', 'user_id']);
            });
        }

        // 10. Shipment Events
        if (!Schema::hasTable('shipment_events')) {
            Schema::create('shipment_events', function (Blueprint $table) {
                $table->id();
                $table->string('shipment_id');
                $table->string('title');
                $table->string('location')->nullable();
                $table->text('description')->nullable();
                $table->string('status')->default('completed'); // completed, current, upcoming
                $table->timestamp('event_time')->useCurrent();
                $table->timestamps();

                $table->index('shipment_id');
            });
        }

        // 11. Reviews
        if (!Schema::hasTable('reviews')) {
            Schema::create('reviews', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained()->cascadeOnDelete();
                $table->unsignedBigInteger('order_id')->nullable();
                $table->unsignedBigInteger('order_item_id')->nullable();
                $table->foreignId('product_id')->constrained()->cascadeOnDelete();
                $table->unsignedBigInteger('shop_id')->nullable();
                $table->integer('rating')->default(5);
                $table->text('review_text')->nullable();
                $table->boolean('is_anonymous')->default(false);
                $table->boolean('is_verified_purchase')->default(true);
                $table->string('status')->default('approved'); // approved, hidden, flagged
                $table->text('seller_reply')->nullable();
                $table->timestamp('replied_at')->nullable();
                $table->timestamps();

                $table->index('product_id');
                $table->index('shop_id');
                $table->index('user_id');
            });
        }

        // 12. Review Media
        if (!Schema::hasTable('review_media')) {
            Schema::create('review_media', function (Blueprint $table) {
                $table->id();
                $table->foreignId('review_id')->constrained()->cascadeOnDelete();
                $table->string('media_url');
                $table->string('media_type')->default('image'); // image, video
                $table->timestamps();

                $table->index('review_id');
            });
        }

        // 13. Product Questions & Answers
        if (!Schema::hasTable('product_questions')) {
            Schema::create('product_questions', function (Blueprint $table) {
                $table->id();
                $table->foreignId('product_id')->constrained()->cascadeOnDelete();
                $table->foreignId('user_id')->constrained()->cascadeOnDelete();
                $table->text('question');
                $table->boolean('is_public')->default(true);
                $table->string('status')->default('approved'); // approved, hidden
                $table->timestamps();

                $table->index('product_id');
            });
        }

        if (!Schema::hasTable('product_answers')) {
            Schema::create('product_answers', function (Blueprint $table) {
                $table->id();
                $table->foreignId('question_id')->references('id')->on('product_questions')->cascadeOnDelete();
                $table->foreignId('user_id')->constrained()->cascadeOnDelete();
                $table->unsignedBigInteger('shop_id')->nullable();
                $table->text('answer');
                $table->string('status')->default('approved');
                $table->timestamps();

                $table->index('question_id');
            });
        }

        // 14. Conversations & Messages (Chat)
        if (!Schema::hasTable('conversations')) {
            Schema::create('conversations', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('shop_id');
                $table->foreignId('customer_id')->references('id')->on('users')->cascadeOnDelete();
                $table->timestamp('last_message_at')->nullable();
                $table->timestamps();

                $table->index('shop_id');
                $table->index('customer_id');
            });
        }

        if (!Schema::hasTable('messages')) {
            Schema::create('messages', function (Blueprint $table) {
                $table->id();
                $table->foreignId('conversation_id')->constrained()->cascadeOnDelete();
                $table->foreignId('sender_id')->references('id')->on('users')->cascadeOnDelete();
                $table->string('sender_type')->default('customer'); // customer, seller
                $table->text('message');
                $table->string('attachment_url')->nullable();
                $table->boolean('is_read')->default(false);
                $table->timestamps();

                $table->index('conversation_id');
            });
        }

        // 15. Flash Sales & Flash Sale Items
        if (!Schema::hasTable('flash_sales')) {
            Schema::create('flash_sales', function (Blueprint $table) {
                $table->id();
                $table->string('title');
                $table->timestamp('start_at')->nullable();
                $table->timestamp('end_at')->nullable();
                $table->boolean('is_active')->default(true);
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('flash_sale_items')) {
            Schema::create('flash_sale_items', function (Blueprint $table) {
                $table->id();
                $table->foreignId('flash_sale_id')->constrained()->cascadeOnDelete();
                $table->foreignId('product_id')->constrained()->cascadeOnDelete();
                $table->decimal('discount_price', 12, 2);
                $table->integer('stock_allocation')->default(10);
                $table->integer('sold_count')->default(0);
                $table->timestamps();

                $table->index('flash_sale_id');
            });
        }

        // 16. Returns & Disputes
        if (!Schema::hasTable('order_returns')) {
            Schema::create('order_returns', function (Blueprint $table) {
                $table->id();
                $table->foreignId('order_id')->constrained()->cascadeOnDelete();
                $table->foreignId('user_id')->constrained()->cascadeOnDelete();
                $table->unsignedBigInteger('shop_id')->nullable();
                $table->string('status')->default('requested'); // requested, approved, rejected, in_transit, received, refunded, disputed
                $table->string('reason'); // wrong_item, damaged, defective, missing_item, not_as_described, other
                $table->text('description')->nullable();
                $table->text('evidence_urls_json')->nullable();
                $table->decimal('requested_amount', 12, 2);
                $table->decimal('refund_amount', 12, 2)->default(0);
                $table->text('seller_note')->nullable();
                $table->text('admin_note')->nullable();
                $table->timestamps();

                $table->index('order_id');
                $table->index('user_id');
                $table->index('shop_id');
            });
        }

        if (!Schema::hasTable('disputes')) {
            Schema::create('disputes', function (Blueprint $table) {
                $table->id();
                $table->foreignId('return_id')->references('id')->on('order_returns')->cascadeOnDelete();
                $table->foreignId('order_id')->constrained()->cascadeOnDelete();
                $table->foreignId('user_id')->constrained()->cascadeOnDelete();
                $table->unsignedBigInteger('shop_id')->nullable();
                $table->string('status')->default('open'); // open, under_review, resolved, closed
                $table->string('resolution')->nullable(); // refund_buyer, reject_claim, partial_refund
                $table->text('resolution_note')->nullable();
                $table->unsignedBigInteger('resolved_by')->nullable();
                $table->timestamps();

                $table->index('return_id');
            });
        }

        // 17. Notifications
        if (!Schema::hasTable('notifications')) {
            Schema::create('notifications', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained()->cascadeOnDelete();
                $table->string('title');
                $table->text('message');
                $table->string('type')->default('order'); // order, promo, security, chat, review, return
                $table->string('action_url')->nullable();
                $table->boolean('is_read')->default(false);
                $table->timestamps();

                $table->index('user_id');
            });
        }

        // 18. Wallets, Wallet Transactions & Seller Payouts
        if (!Schema::hasTable('wallets')) {
            Schema::create('wallets', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained()->cascadeOnDelete();
                $table->unsignedBigInteger('shop_id')->nullable();
                $table->decimal('balance', 14, 2)->default(0);
                $table->timestamps();

                $table->index('user_id');
                $table->index('shop_id');
            });
        }

        if (!Schema::hasTable('wallet_transactions')) {
            Schema::create('wallet_transactions', function (Blueprint $table) {
                $table->id();
                $table->foreignId('wallet_id')->constrained()->cascadeOnDelete();
                $table->string('type')->default('credit'); // credit, debit
                $table->decimal('amount', 14, 2);
                $table->decimal('balance_after', 14, 2);
                $table->string('reference_type')->nullable(); // order, payout, refund
                $table->string('reference_id')->nullable();
                $table->text('description')->nullable();
                $table->timestamps();

                $table->index('wallet_id');
            });
        }

        if (!Schema::hasTable('seller_payouts')) {
            Schema::create('seller_payouts', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('shop_id');
                $table->decimal('amount', 14, 2);
                $table->string('bank_name');
                $table->string('account_number');
                $table->string('account_holder');
                $table->string('status')->default('pending'); // pending, processing, completed, failed
                $table->string('reference_id')->unique();
                $table->text('note')->nullable();
                $table->timestamps();

                $table->index('shop_id');
            });
        }

        // 19. Reports & Admin Audit Logs
        if (!Schema::hasTable('reports')) {
            Schema::create('reports', function (Blueprint $table) {
                $table->id();
                $table->foreignId('reporter_id')->references('id')->on('users')->cascadeOnDelete();
                $table->string('reportable_type'); // product, review, shop, message
                $table->unsignedBigInteger('reportable_id');
                $table->string('reason'); // spam, fraud, scam, abuse, copyright, illegal, other
                $table->text('description')->nullable();
                $table->string('status')->default('pending'); // pending, reviewed, action_taken, dismissed
                $table->timestamps();

                $table->index(['reportable_type', 'reportable_id']);
            });
        }

        if (!Schema::hasTable('admin_actions')) {
            Schema::create('admin_actions', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained()->cascadeOnDelete();
                $table->string('action'); // e.g. suspend_user, approve_seller, moderate_review
                $table->string('target_type')->nullable();
                $table->unsignedBigInteger('target_id')->nullable();
                $table->text('details_json')->nullable();
                $table->string('ip_address')->nullable();
                $table->text('user_agent')->nullable();
                $table->timestamps();

                $table->index('user_id');
            });
        }

        // 20. Payments table
        if (!Schema::hasTable('payments')) {
            Schema::create('payments', function (Blueprint $table) {
                $table->id();
                $table->foreignId('order_id')->constrained()->cascadeOnDelete();
                $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
                $table->string('transaction_id')->unique();
                $table->string('payment_method');
                $table->decimal('amount', 12, 2);
                $table->string('status')->default('paid'); // pending, processing, paid, failed, expired, refunded
                $table->timestamp('paid_at')->nullable();
                $table->text('payload_json')->nullable();
                $table->timestamps();

                $table->index('order_id');
                $table->index('user_id');
            });
        }

        // 21. Add extra columns to existing tables if needed
        if (Schema::hasTable('users')) {
            Schema::table('users', function (Blueprint $table) {
                if (!Schema::hasColumn('users', 'status')) {
                    $table->string('status')->default('active')->after('role');
                }
                if (!Schema::hasColumn('users', 'email_verified_at')) {
                    $table->timestamp('email_verified_at')->nullable()->after('email');
                }
            });
        }

        if (Schema::hasTable('orders')) {
            Schema::table('orders', function (Blueprint $table) {
                if (!Schema::hasColumn('orders', 'shop_id')) {
                    $table->unsignedBigInteger('shop_id')->nullable()->after('user_id');
                }
                if (!Schema::hasColumn('orders', 'master_order_number')) {
                    $table->string('master_order_number')->nullable()->after('order_number');
                }
                if (!Schema::hasColumn('orders', 'customer_phone')) {
                    $table->string('customer_phone')->nullable()->after('customer_email');
                }
                if (!Schema::hasColumn('orders', 'courier')) {
                    $table->string('courier')->nullable()->after('status');
                }
                if (!Schema::hasColumn('orders', 'courier_service')) {
                    $table->string('courier_service')->nullable()->after('courier');
                }
                if (!Schema::hasColumn('orders', 'tracking_number')) {
                    $table->string('tracking_number')->nullable()->after('courier_service');
                }
                if (!Schema::hasColumn('orders', 'voucher_code')) {
                    $table->string('voucher_code')->nullable()->after('tracking_number');
                }
                if (!Schema::hasColumn('orders', 'voucher_discount')) {
                    $table->decimal('voucher_discount', 12, 2)->default(0)->after('voucher_code');
                }
                if (!Schema::hasColumn('orders', 'idempotency_key')) {
                    $table->string('idempotency_key')->nullable()->after('voucher_discount');
                }
            });
        }

        if (Schema::hasTable('order_items')) {
            Schema::table('order_items', function (Blueprint $table) {
                if (!Schema::hasColumn('order_items', 'shop_id')) {
                    $table->unsignedBigInteger('shop_id')->nullable()->after('order_id');
                }
                if (!Schema::hasColumn('order_items', 'variant_id')) {
                    $table->unsignedBigInteger('variant_id')->nullable()->after('product_id');
                }
                if (!Schema::hasColumn('order_items', 'product_slug')) {
                    $table->string('product_slug')->nullable()->after('product_name');
                }
                if (!Schema::hasColumn('order_items', 'subtotal')) {
                    $table->decimal('subtotal', 12, 2)->default(0)->after('price');
                }
            });
        }

        if (Schema::hasTable('shops')) {
            Schema::table('shops', function (Blueprint $table) {
                if (!Schema::hasColumn('shops', 'status')) {
                    $table->string('status')->default('approved')->after('verified'); // pending, approved, rejected, suspended
                }
                if (!Schema::hasColumn('shops', 'total_sales')) {
                    $table->decimal('total_sales', 14, 2)->default(0)->after('status');
                }
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('admin_actions');
        Schema::dropIfExists('reports');
        Schema::dropIfExists('seller_payouts');
        Schema::dropIfExists('wallet_transactions');
        Schema::dropIfExists('wallets');
        Schema::dropIfExists('notifications');
        Schema::dropIfExists('disputes');
        Schema::dropIfExists('order_returns');
        Schema::dropIfExists('flash_sale_items');
        Schema::dropIfExists('flash_sales');
        Schema::dropIfExists('messages');
        Schema::dropIfExists('conversations');
        Schema::dropIfExists('product_answers');
        Schema::dropIfExists('product_questions');
        Schema::dropIfExists('review_media');
        Schema::dropIfExists('reviews');
        Schema::dropIfExists('shipment_events');
        Schema::dropIfExists('voucher_redemptions');
        Schema::dropIfExists('vouchers');
        Schema::dropIfExists('cart_items');
        Schema::dropIfExists('wishlists');
        Schema::dropIfExists('product_images');
        Schema::dropIfExists('product_variants');
        Schema::dropIfExists('shop_followers');
        Schema::dropIfExists('brands');
        Schema::dropIfExists('user_addresses');
        Schema::dropIfExists('payments');
    }
};
