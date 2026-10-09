<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Wallets ledger enhancements (reserved, pending, withdrawn)
        if (Schema::hasTable('wallets')) {
            Schema::table('wallets', function (Blueprint $table) {
                if (!Schema::hasColumn('wallets', 'reserved_balance')) {
                    $table->decimal('reserved_balance', 14, 2)->default(0)->after('balance');
                }
                if (!Schema::hasColumn('wallets', 'pending_balance')) {
                    $table->decimal('pending_balance', 14, 2)->default(0)->after('reserved_balance');
                }
                if (!Schema::hasColumn('wallets', 'total_withdrawn')) {
                    $table->decimal('total_withdrawn', 14, 2)->default(0)->after('pending_balance');
                }
            });
        }

        // 2. Seller Payouts tracking
        if (Schema::hasTable('seller_payouts')) {
            Schema::table('seller_payouts', function (Blueprint $table) {
                if (!Schema::hasColumn('seller_payouts', 'processed_by')) {
                    $table->unsignedBigInteger('processed_by')->nullable()->after('note');
                }
                if (!Schema::hasColumn('seller_payouts', 'processed_at')) {
                    $table->timestamp('processed_at')->nullable()->after('processed_by');
                }
                if (!Schema::hasColumn('seller_payouts', 'failure_reason')) {
                    $table->text('failure_reason')->nullable()->after('processed_at');
                }
            });
        }

        // 3. Payments table provider tracking
        if (Schema::hasTable('payments')) {
            Schema::table('payments', function (Blueprint $table) {
                if (!Schema::hasColumn('payments', 'provider')) {
                    $table->string('provider', 50)->default('sandbox')->after('payment_method');
                }
                if (!Schema::hasColumn('payments', 'provider_reference')) {
                    $table->string('provider_reference')->nullable()->after('transaction_id');
                }
                if (!Schema::hasColumn('payments', 'currency')) {
                    $table->string('currency', 3)->default('IDR')->after('amount');
                }
            });
        }

        // 4. Payment Events for secure webhook audit trail and replay defense
        if (!Schema::hasTable('payment_events')) {
            Schema::create('payment_events', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('payment_id')->nullable();
                $table->string('event_id')->nullable()->unique();
                $table->string('provider', 50)->default('sandbox');
                $table->string('event_type');
                $table->longText('payload_json')->nullable();
                $table->string('status')->default('processed'); // processed, ignored, rejected
                $table->timestamps();

                $table->index(['provider', 'event_id']);
                $table->index('payment_id');
            });
        }

        // 5. Database Constraints
        $driver = DB::getDriverName();
        if (in_array($driver, ['mysql', 'mariadb'])) {
            $statements = [
                'ALTER TABLE wallets ADD CONSTRAINT chk_wallets_balance_non_negative CHECK (balance >= 0)',
                'ALTER TABLE wallets ADD CONSTRAINT chk_wallets_reserved_non_negative CHECK (reserved_balance >= 0)',
                'ALTER TABLE seller_payouts ADD CONSTRAINT chk_payouts_amount_positive CHECK (amount > 0)',
            ];
            foreach ($statements as $sql) {
                try {
                    DB::statement($sql);
                } catch (\Throwable $e) {}
            }
        } elseif ($driver === 'sqlite') {
            $triggers = [
                'CREATE TRIGGER IF NOT EXISTS trg_wallets_balance_non_neg_upd BEFORE UPDATE ON wallets FOR EACH ROW WHEN NEW.balance < 0 BEGIN SELECT RAISE(ABORT, "Wallet balance cannot be negative"); END;',
                'CREATE TRIGGER IF NOT EXISTS trg_wallets_reserved_non_neg_upd BEFORE UPDATE ON wallets FOR EACH ROW WHEN NEW.reserved_balance < 0 BEGIN SELECT RAISE(ABORT, "Reserved balance cannot be negative"); END;',
            ];
            foreach ($triggers as $triggerSql) {
                try {
                    DB::statement($triggerSql);
                } catch (\Throwable $e) {}
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $driver = DB::getDriverName();
        if ($driver === 'sqlite') {
            try {
                DB::statement('DROP TRIGGER IF EXISTS trg_wallets_balance_non_neg_upd');
                DB::statement('DROP TRIGGER IF EXISTS trg_wallets_reserved_non_neg_upd');
            } catch (\Throwable $e) {}
        } elseif (in_array($driver, ['mysql', 'mariadb'])) {
            try {
                DB::statement('ALTER TABLE wallets DROP CONSTRAINT chk_wallets_balance_non_negative');
                DB::statement('ALTER TABLE wallets DROP CONSTRAINT chk_wallets_reserved_non_negative');
                DB::statement('ALTER TABLE seller_payouts DROP CONSTRAINT chk_payouts_amount_positive');
            } catch (\Throwable $e) {}
        }

        Schema::dropIfExists('payment_events');

        if (Schema::hasTable('payments')) {
            Schema::table('payments', function (Blueprint $table) {
                $cols = [];
                if (Schema::hasColumn('payments', 'currency')) $cols[] = 'currency';
                if (Schema::hasColumn('payments', 'provider_reference')) $cols[] = 'provider_reference';
                if (Schema::hasColumn('payments', 'provider')) $cols[] = 'provider';
                if (!empty($cols)) $table->dropColumn($cols);
            });
        }

        if (Schema::hasTable('seller_payouts')) {
            Schema::table('seller_payouts', function (Blueprint $table) {
                $cols = [];
                if (Schema::hasColumn('seller_payouts', 'failure_reason')) $cols[] = 'failure_reason';
                if (Schema::hasColumn('seller_payouts', 'processed_at')) $cols[] = 'processed_at';
                if (Schema::hasColumn('seller_payouts', 'processed_by')) $cols[] = 'processed_by';
                if (!empty($cols)) $table->dropColumn($cols);
            });
        }

        if (Schema::hasTable('wallets')) {
            Schema::table('wallets', function (Blueprint $table) {
                $cols = [];
                if (Schema::hasColumn('wallets', 'total_withdrawn')) $cols[] = 'total_withdrawn';
                if (Schema::hasColumn('wallets', 'pending_balance')) $cols[] = 'pending_balance';
                if (Schema::hasColumn('wallets', 'reserved_balance')) $cols[] = 'reserved_balance';
                if (!empty($cols)) $table->dropColumn($cols);
            });
        }
    }
};
