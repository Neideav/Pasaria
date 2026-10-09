<?php

namespace App\Services;

use App\Models\AdminAction;
use App\Models\Order;
use App\Models\SellerPayout;
use App\Models\Shop;
use App\Models\User;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use InvalidArgumentException;
use RuntimeException;

class LedgerService
{
    /**
     * Credit seller wallet from a completed order atomically with idempotency.
     *
     * @param Order $order
     * @return WalletTransaction|null
     */
    public function creditSale(Order $order): ?WalletTransaction
    {
        $shopId = $order->shop_id;
        if (!$shopId) {
            return null;
        }

        $shop = Shop::find($shopId);
        if (!$shop) {
            return null;
        }

        return DB::transaction(function () use ($order, $shop) {
            $wallet = Wallet::firstOrCreate(
                ['shop_id' => $shop->id],
                [
                    'user_id'          => $shop->user_id,
                    'balance'          => 0.00,
                    'reserved_balance' => 0.00,
                    'pending_balance'  => 0.00,
                    'total_withdrawn'  => 0.00,
                ]
            );

            // Row-level pessimistic locking
            $wallet = Wallet::where('id', $wallet->id)->lockForUpdate()->first();

            // 1. Idempotency Check: Prevent duplicate crediting of the same order
            $orderNumber = $order->order_number ?: $order->master_order_number;
            $alreadyCredited = WalletTransaction::where('wallet_id', $wallet->id)
                ->where('reference_type', 'order')
                ->where('reference_id', $orderNumber)
                ->where('type', 'credit')
                ->exists();

            if ($alreadyCredited) {
                return null;
            }

            // 2. Platform commission calculation (5% standard marketplace platform fee)
            $subtotal = (float) $order->subtotal;
            $platformFee = round($subtotal * 0.05, 2);
            $netEarnings = max(0.0, round($subtotal - $platformFee, 2));

            // 3. Atomically increment available balance
            $wallet->increment('balance', $netEarnings);
            $wallet->refresh();

            // 4. Create immutable audit ledger entry
            $transaction = WalletTransaction::create([
                'wallet_id'      => $wallet->id,
                'type'           => 'credit',
                'amount'         => $netEarnings,
                'balance_after'  => (float) $wallet->balance,
                'reference_type' => 'order',
                'reference_id'   => $orderNumber,
                'description'    => "Penyelesaian dana penjualan pesanan #{$orderNumber} (Subtotal: Rp" . number_format($subtotal, 0, ',', '.') . " - Biaya Layanan 5%: Rp" . number_format($platformFee, 0, ',', '.') . ")",
            ]);

            // 5. Update shop aggregate sales
            $shop->increment('total_sales', $subtotal);

            return $transaction;
        }, 3);
    }

    /**
     * Reserve seller funds for payout request atomically.
     *
     * @param Shop $shop
     * @param float $amount
     * @param array $payoutData
     * @param string|null $idempotencyKey
     * @return SellerPayout
     */
    public function reservePayout(Shop $shop, float $amount, array $payoutData, ?string $idempotencyKey = null): SellerPayout
    {
        if ($amount < 10000) {
            throw new InvalidArgumentException('Jumlah penarikan minimal Rp10.000.');
        }

        return DB::transaction(function () use ($shop, $amount, $payoutData) {
            $wallet = Wallet::firstOrCreate(
                ['shop_id' => $shop->id],
                [
                    'user_id'          => $shop->user_id,
                    'balance'          => 0.00,
                    'reserved_balance' => 0.00,
                    'pending_balance'  => 0.00,
                    'total_withdrawn'  => 0.00,
                ]
            );

            $wallet = Wallet::where('id', $wallet->id)->lockForUpdate()->first();

            // Calculate currently available unreserved balance
            $availableBalance = max(0.0, round((float) $wallet->balance - (float) $wallet->reserved_balance, 2));

            if ($availableBalance < $amount) {
                throw new InvalidArgumentException(
                    "Saldo dompet tidak mencukupi untuk penarikan ini. Saldo tersedia: Rp" . number_format($availableBalance, 0, ',', '.') . "."
                );
            }

            // Reserve funds without irreversibly destroying balance
            $wallet->increment('reserved_balance', $amount);
            $wallet->refresh();

            $referenceId = 'PAYOUT-' . date('Ymd') . '-' . strtoupper(Str::random(6));

            $payout = SellerPayout::create([
                'shop_id'        => $shop->id,
                'amount'         => $amount,
                'bank_name'      => $payoutData['bank_name'],
                'account_number' => $payoutData['account_number'],
                'account_holder' => $payoutData['account_holder'],
                'status'         => 'pending',
                'reference_id'   => $referenceId,
                'note'           => $payoutData['note'] ?? 'Permintaan penarikan dana penjual PASARIA',
            ]);

            // Record reservation ledger transaction
            WalletTransaction::create([
                'wallet_id'      => $wallet->id,
                'type'           => 'debit',
                'amount'         => $amount,
                'balance_after'  => (float) $wallet->available_balance,
                'reference_type' => 'payout',
                'reference_id'   => $referenceId,
                'description'    => "Reservasi dana untuk pengajuan penarikan #{$referenceId} ke {$payoutData['bank_name']}",
            ]);

            return $payout;
        }, 3);
    }

    /**
     * Finalize payout after admin approval or gateway confirmation.
     *
     * @param SellerPayout $payout
     * @param User $admin
     * @return void
     */
    public function finalizePayout(SellerPayout $payout, User $admin): void
    {
        DB::transaction(function () use ($payout, $admin) {
            $payout = SellerPayout::where('id', $payout->id)->lockForUpdate()->first();

            if (!in_array($payout->status, ['pending', 'processing'], true)) {
                throw new RuntimeException("Payout #{$payout->reference_id} sudah pernah diproses ({$payout->status}).");
            }

            $wallet = Wallet::where('shop_id', $payout->shop_id)->lockForUpdate()->first();
            if (!$wallet) {
                throw new RuntimeException("Dompet toko #{$payout->shop_id} tidak ditemukan.");
            }

            $amount = (float) $payout->amount;

            // Release reservation and finalize debit from base balance
            $wallet->decrement('reserved_balance', min((float) $wallet->reserved_balance, $amount));
            $wallet->decrement('balance', min((float) $wallet->balance, $amount));
            $wallet->increment('total_withdrawn', $amount);
            $wallet->refresh();

            $payout->update([
                'status'       => 'completed',
                'processed_by' => $admin->id,
                'processed_at' => now(),
            ]);

            AdminAction::create([
                'user_id'      => $admin->id,
                'action'       => 'approve_payout',
                'target_type'  => 'seller_payout',
                'target_id'    => $payout->id,
                'details_json' => [
                    'reference_id' => $payout->reference_id,
                    'amount'       => $amount,
                    'shop_id'      => $payout->shop_id,
                ],
            ]);
        }, 3);
    }

    /**
     * Reject payout and safely restore reserved funds back to available balance.
     *
     * @param SellerPayout $payout
     * @param User $admin
     * @param string $reason
     * @return void
     */
    public function rejectPayout(SellerPayout $payout, User $admin, string $reason): void
    {
        DB::transaction(function () use ($payout, $admin, $reason) {
            $payout = SellerPayout::where('id', $payout->id)->lockForUpdate()->first();

            if (!in_array($payout->status, ['pending', 'processing'], true)) {
                throw new RuntimeException("Payout #{$payout->reference_id} sudah pernah diproses ({$payout->status}).");
            }

            $wallet = Wallet::where('shop_id', $payout->shop_id)->lockForUpdate()->first();
            if (!$wallet) {
                throw new RuntimeException("Dompet toko #{$payout->shop_id} tidak ditemukan.");
            }

            $amount = (float) $payout->amount;

            // Release reservation so funds return to available balance
            $wallet->decrement('reserved_balance', min((float) $wallet->reserved_balance, $amount));
            $wallet->refresh();

            $payout->update([
                'status'         => 'rejected',
                'processed_by'   => $admin->id,
                'processed_at'   => now(),
                'failure_reason' => $reason,
            ]);

            WalletTransaction::create([
                'wallet_id'      => $wallet->id,
                'type'           => 'credit',
                'amount'         => $amount,
                'balance_after'  => (float) $wallet->available_balance,
                'reference_type' => 'payout',
                'reference_id'   => $payout->reference_id,
                'description'    => "Pelepasan reservasi penarikan #{$payout->reference_id} karena ditolak: {$reason}",
            ]);

            AdminAction::create([
                'user_id'      => $admin->id,
                'action'       => 'reject_payout',
                'target_type'  => 'seller_payout',
                'target_id'    => $payout->id,
                'details_json' => [
                    'reference_id' => $payout->reference_id,
                    'amount'       => $amount,
                    'reason'       => $reason,
                ],
            ]);
        }, 3);
    }

    /**
     * Reconcile wallet ledger as source of truth against recorded balance.
     *
     * @param Wallet $wallet
     * @return array
     */
    public function reconcile(Wallet $wallet): array
    {
        $credits = (float) $wallet->transactions()->where('type', 'credit')->sum('amount');
        $debits = (float) $wallet->transactions()->where('type', 'debit')->sum('amount');
        $expectedBalance = round($credits - $debits, 2);
        $actualBalance = (float) $wallet->balance;
        $discrepancy = round($actualBalance - $expectedBalance, 2);

        return [
            'wallet_id'         => $wallet->id,
            'actual_balance'    => $actualBalance,
            'expected_balance'  => $expectedBalance,
            'reserved_balance'  => (float) $wallet->reserved_balance,
            'available_balance' => (float) $wallet->available_balance,
            'total_withdrawn'   => (float) $wallet->total_withdrawn,
            'is_consistent'     => abs($discrepancy) < 0.01,
            'discrepancy'       => $discrepancy,
        ];
    }
}
