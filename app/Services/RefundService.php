<?php

namespace App\Services;

use App\Models\AdminAction;
use App\Models\Notification;
use App\Models\Order;
use App\Models\OrderReturn;
use App\Models\Payment;
use App\Models\Refund;
use App\Models\User;
use App\Services\Payment\PaymentManager;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use InvalidArgumentException;
use RuntimeException;

class RefundService
{
    protected PaymentManager $paymentManager;
    protected LedgerService $ledgerService;
    protected OrderStateMachine $stateMachine;

    public function __construct(
        PaymentManager $paymentManager,
        LedgerService $ledgerService,
        OrderStateMachine $stateMachine
    ) {
        $this->paymentManager = $paymentManager;
        $this->ledgerService = $ledgerService;
        $this->stateMachine = $stateMachine;
    }

    /**
     * Process refund for an order or return atomically with idempotency and ledger reconciliation.
     *
     * @param Order $order
     * @param float $amount
     * @param string $reason
     * @param OrderReturn|null $return
     * @param User|null $actor
     * @param array $options
     * @return Refund
     */
    public function processRefund(
        Order $order,
        float $amount,
        string $reason,
        ?OrderReturn $return = null,
        ?User $actor = null,
        array $options = []
    ): Refund {
        if ($amount <= 0) {
            throw new InvalidArgumentException('Nominal refund harus lebih besar dari 0.');
        }

        return DB::transaction(function () use ($order, $amount, $reason, $return, $actor, $options) {
            // Pessimistic locking on Order and Payment
            $order = Order::where('id', $order->id)->lockForUpdate()->first();
            $payment = Payment::where('order_id', $order->id)->lockForUpdate()->first();

            if (!$payment || $payment->status !== 'paid') {
                throw new InvalidArgumentException('Refund hanya dapat diproses untuk pesanan yang telah lunas dibayar.');
            }

            // 1. Idempotency Check: Return already refunded
            if ($return) {
                $existingCompleted = Refund::where('return_id', $return->id)
                    ->where('status', 'completed')
                    ->first();
                if ($existingCompleted) {
                    return $existingCompleted;
                }
            }

            // 2. Strict Limit Check: Total refund cannot exceed actual paid amount
            $alreadyRefunded = (float) Refund::where('order_id', $order->id)
                ->where('status', 'completed')
                ->sum('amount');

            $maxEligible = round((float) $payment->amount - $alreadyRefunded, 2);
            if ($amount > $maxEligible + 0.01) {
                throw new InvalidArgumentException(
                    "Jumlah refund (Rp" . number_format($amount, 0, ',', '.') . ") melebihi sisa dana yang dapat dikembalikan (Rp" . number_format(max(0.0, $maxEligible), 0, ',', '.') . ")."
                );
            }

            $refundType = (abs($amount - (float) $order->total) < 0.01 && $alreadyRefunded == 0) ? 'full' : 'partial';
            $refundReference = 'REF-' . date('Ymd') . '-' . strtoupper(Str::random(6));

            $refund = Refund::create([
                'order_id'         => $order->id,
                'payment_id'       => $payment->id,
                'return_id'        => $return?->id,
                'shop_id'          => $order->shop_id,
                'user_id'          => $order->user_id,
                'type'             => $refundType,
                'amount'           => $amount,
                'currency'         => 'IDR',
                'reason'           => $reason,
                'status'           => 'processing',
                'provider'         => $payment->provider ?: 'manual',
                'refund_reference' => $refundReference,
                'processed_by'     => $actor?->id,
            ]);

            // 3. Process via payment provider gateway
            $provider = $payment->provider ?: config('pasaria.payment.default', 'sandbox');
            try {
                $gateway = $this->paymentManager->gateway($provider);
                $gatewayResult = $gateway->processRefund($payment, $amount, $reason, $options);
            } catch (\Throwable $e) {
                $refund->update([
                    'status'         => 'failed',
                    'failure_reason' => $e->getMessage(),
                ]);
                throw new RuntimeException("Gagal memproses refund melalui provider {$provider}: " . $e->getMessage());
            }

            if (!($gatewayResult['success'] ?? false)) {
                $failureMsg = $gatewayResult['failure_reason'] ?? 'Penolakan refund dari payment provider.';
                $refund->update([
                    'status'         => 'failed',
                    'failure_reason' => $failureMsg,
                ]);
                throw new RuntimeException("Gateway refund ditolak: {$failureMsg}");
            }

            // 4. Update Refund Record
            $refund->update([
                'status'             => 'completed',
                'provider_reference' => $gatewayResult['refund_id'] ?? $refundReference,
                'processed_at'       => now(),
                'processed_by'       => $actor?->id,
            ]);

            // 5. Update Payment Record
            $newRefundedAmount = round((float) $payment->refunded_amount + $amount, 2);
            $payment->update([
                'refunded_amount'  => $newRefundedAmount,
                'refund_status'    => ($newRefundedAmount >= (float) $payment->amount - 0.01) ? 'full' : 'partial',
                'refund_reference' => $refundReference,
            ]);

            // 6. Update Order Status & Financial Fields
            $newOrderRefundAmount = round((float) $order->refund_amount + $amount, 2);
            $isFullyRefunded = ($newOrderRefundAmount >= (float) $order->total - 0.01);
            $nextOrderStatus = $isFullyRefunded ? OrderStateMachine::STATUS_REFUNDED : OrderStateMachine::STATUS_REFUND_PROCESSING;

            $wasCompleted = in_array(strtolower((string) $order->status), [OrderStateMachine::STATUS_COMPLETED, 'completed'], true);

            $order->update([
                'refund_amount' => $newOrderRefundAmount,
                'refund_status' => $isFullyRefunded ? 'completed' : 'processing',
                'status'        => $nextOrderStatus,
            ]);

            // 7. Reconcile Seller Ledger if order was already completed and escrow was released
            if ($order->shop && $wasCompleted) {
                $this->ledgerService->debitRefund($order->shop, $amount, $order, $refundReference);
            }

            // 8. Update Return and Dispute Records if associated
            if ($return) {
                $return->update([
                    'status'        => 'refunded',
                    'refund_amount' => $amount,
                    'processed_by'  => $actor?->id,
                    'processed_at'  => now(),
                ]);

                if ($return->dispute && $return->dispute->status === 'open') {
                    $return->dispute->update([
                        'status'          => 'resolved',
                        'resolution'      => ($refundType === 'full') ? 'refund_buyer' : 'partial_refund',
                        'resolution_note' => "Pengembalian dana Rp" . number_format($amount, 0, ',', '.') . " disetujui",
                        'resolved_by'     => $actor?->id,
                    ]);
                }
            }

            // 9. Safe Audit Trail
            if ($actor) {
                try {
                    AdminAction::create([
                        'user_id'      => $actor->id,
                        'action'       => 'process_refund',
                        'target_type'  => 'order',
                        'target_id'    => $order->id,
                        'details_json' => [
                            'refund_reference' => $refundReference,
                            'amount'           => $amount,
                            'type'             => $refundType,
                            'order_number'     => $order->order_number,
                            'reason'           => $reason,
                        ],
                    ]);
                } catch (\Throwable $e) {}
            }

            // 10. Safe In-App Notification (wrapped so failure does not break the transaction)
            try {
                Notification::create([
                    'user_id'    => $order->user_id,
                    'title'      => 'Pengembalian Dana Berhasil!',
                    'message'    => "Dana sebesar Rp" . number_format($amount, 0, ',', '.') . " untuk pesanan #{$order->order_number} telah berhasil dikembalikan.",
                    'type'       => 'refund',
                    'action_url' => "/orders/{$order->order_number}",
                ]);
            } catch (\Throwable $e) {
                Log::warning("Notification failure on refund {$refundReference}: " . $e->getMessage());
            }

            return $refund;
        }, 3);
    }
}
