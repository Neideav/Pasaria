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
        // 1. Order table additions: cancellation metadata, refund state
        if (Schema::hasTable('orders')) {
            Schema::table('orders', function (Blueprint $table) {
                if (!Schema::hasColumn('orders', 'cancelled_at')) {
                    $table->timestamp('cancelled_at')->nullable()->after('status');
                }
                if (!Schema::hasColumn('orders', 'cancelled_by')) {
                    $table->unsignedBigInteger('cancelled_by')->nullable()->after('cancelled_at');
                }
                if (!Schema::hasColumn('orders', 'cancellation_reason')) {
                    $table->text('cancellation_reason')->nullable()->after('cancelled_by');
                }
                if (!Schema::hasColumn('orders', 'refund_status')) {
                    $table->string('refund_status')->default('none')->after('cancellation_reason'); // none, pending, processing, completed, failed
                }
                if (!Schema::hasColumn('orders', 'refund_amount')) {
                    $table->decimal('refund_amount', 14, 2)->default(0.00)->after('refund_status');
                }
            });
        }

        // 2. Order returns additions: item-level quantity, processed metadata
        if (Schema::hasTable('order_returns')) {
            Schema::table('order_returns', function (Blueprint $table) {
                if (!Schema::hasColumn('order_returns', 'quantity')) {
                    $table->integer('quantity')->default(1)->after('order_item_id');
                }
                if (!Schema::hasColumn('order_returns', 'items_json')) {
                    $table->json('items_json')->nullable()->after('quantity');
                }
                if (!Schema::hasColumn('order_returns', 'processed_by')) {
                    $table->unsignedBigInteger('processed_by')->nullable()->after('admin_note');
                }
                if (!Schema::hasColumn('order_returns', 'processed_at')) {
                    $table->timestamp('processed_at')->nullable()->after('processed_by');
                }
            });
        }

        // 3. Payments table additions: refunded amount, refund status & reference
        if (Schema::hasTable('payments')) {
            Schema::table('payments', function (Blueprint $table) {
                if (!Schema::hasColumn('payments', 'refunded_amount')) {
                    $table->decimal('refunded_amount', 14, 2)->default(0.00)->after('amount');
                }
                if (!Schema::hasColumn('payments', 'refund_status')) {
                    $table->string('refund_status')->default('none')->after('refunded_amount'); // none, partial, full
                }
                if (!Schema::hasColumn('payments', 'refund_reference')) {
                    $table->string('refund_reference')->nullable()->after('refund_status');
                }
            });
        }

        // 4. Refunds table: dedicated financial audit ledger for customer refunds
        if (!Schema::hasTable('refunds')) {
            Schema::create('refunds', function (Blueprint $table) {
                $table->id();
                $table->foreignId('order_id')->constrained()->cascadeOnDelete();
                $table->unsignedBigInteger('payment_id')->nullable();
                $table->unsignedBigInteger('return_id')->nullable();
                $table->unsignedBigInteger('shop_id')->nullable();
                $table->unsignedBigInteger('user_id'); // recipient customer
                $table->string('type')->default('full'); // full, partial
                $table->decimal('amount', 14, 2);
                $table->string('currency', 10)->default('IDR');
                $table->string('reason');
                $table->string('status')->default('pending'); // pending, processing, completed, failed, rejected
                $table->string('provider')->default('manual'); // sandbox, midtrans, xendit, manual
                $table->string('provider_reference')->nullable();
                $table->string('refund_reference')->unique();
                $table->unsignedBigInteger('processed_by')->nullable();
                $table->timestamp('processed_at')->nullable();
                $table->text('failure_reason')->nullable();
                $table->text('notes')->nullable();
                $table->timestamps();

                $table->index('order_id');
                $table->index('user_id');
                $table->index('shop_id');
                $table->index('status');
                $table->index('refund_reference');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('refunds');

        if (Schema::hasTable('payments')) {
            Schema::table('payments', function (Blueprint $table) {
                $table->dropColumn(['refunded_amount', 'refund_status', 'refund_reference']);
            });
        }

        if (Schema::hasTable('order_returns')) {
            Schema::table('order_returns', function (Blueprint $table) {
                $table->dropColumn(['quantity', 'items_json', 'processed_by', 'processed_at']);
            });
        }

        if (Schema::hasTable('orders')) {
            Schema::table('orders', function (Blueprint $table) {
                $table->dropColumn(['cancelled_at', 'cancelled_by', 'cancellation_reason', 'refund_status', 'refund_amount']);
            });
        }
    }
};
