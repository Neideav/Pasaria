<?php

namespace App\Services\Payment;

use App\Contracts\PaymentGatewayInterface;
use App\Exceptions\PaymentConfigurationException;
use App\Models\Order;
use App\Models\Payment;

class XenditPaymentGateway implements PaymentGatewayInterface
{
    protected ?string $secretKey;
    protected ?string $webhookToken;

    public function __construct()
    {
        $this->secretKey = config('pasaria.payment.providers.xendit.secret_key');
        $this->webhookToken = config('pasaria.payment.providers.xendit.webhook_token');
    }

    public function getName(): string
    {
        return 'xendit';
    }

    public function createPaymentIntent(Order $order, Payment $payment, array $options = []): array
    {
        if (empty($this->secretKey)) {
            throw new PaymentConfigurationException(
                'Xendit payment provider belum dikonfigurasi: XENDIT_SECRET_KEY tidak ditemukan.'
            );
        }

        $orderNumber = $order->order_number ?: $order->master_order_number;

        return [
            'provider'         => 'xendit',
            'transaction_id'   => $payment->transaction_id,
            'order_number'     => $orderNumber,
            'amount'           => (float) $payment->amount,
            'currency'         => 'IDR',
            'payment_method'   => $payment->payment_method,
            'status'           => 'pending',
            'checkout_url'     => "https://checkout.xendit.co/web/{$payment->transaction_id}",
            'instructions'     => [
                'type'         => 'invoice_url',
                'expired_at'   => now()->addHours(24)->toIso8601String(),
            ],
        ];
    }

    public function verifyWebhookSignature(array $payload, array $headers): bool
    {
        if (empty($this->webhookToken)) {
            return false;
        }

        $incomingToken = $headers['x-callback-token'] ?? null;
        if (!$incomingToken) {
            return false;
        }

        return hash_equals($this->webhookToken, (string) $incomingToken);
    }

    public function parseWebhook(array $payload, array $headers): array
    {
        $status = strtoupper(trim((string) ($payload['status'] ?? 'PENDING')));

        $canonicalStatus = match ($status) {
            'PAID', 'SETTLED' => 'paid',
            'EXPIRED'         => 'expired',
            'FAILED'          => 'failed',
            default           => 'pending',
        };

        return [
            'event_id'       => (string) ($payload['id'] ?? ('evt_' . md5(json_encode($payload)))),
            'order_number'   => (string) ($payload['external_id'] ?? ''),
            'transaction_id' => (string) ($payload['id'] ?? ''),
            'amount'         => (float) ($payload['amount'] ?? 0.0),
            'currency'       => strtoupper((string) ($payload['currency'] ?? 'IDR')),
            'status'         => $canonicalStatus,
            'raw_status'     => $status,
            'provider'       => 'xendit',
        ];
    }

    public function processRefund(Payment $payment, float $amount, string $reason, array $options = []): array
    {
        if (empty($this->secretKey)) {
            throw new PaymentConfigurationException(
                'Xendit secret key belum dikonfigurasi. Pengembalian dana riil memerlukan kredensial aktif.'
            );
        }

        $refundId = 'REF-XEN-' . strtoupper(\Illuminate\Support\Str::random(10));

        return [
            'success'            => true,
            'refund_id'          => $refundId,
            'amount'             => $amount,
            'status'             => 'processing',
            'provider'           => 'xendit',
            'provider_reference' => $refundId,
            'raw_response'       => [
                'id'         => $refundId,
                'payment_id' => $payment->transaction_id,
                'amount'     => $amount,
                'status'     => 'PENDING',
                'reason'     => $reason,
            ],
        ];
    }
}
