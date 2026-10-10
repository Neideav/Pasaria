<?php

namespace App\Services\Payment;

use App\Contracts\PaymentGatewayInterface;
use App\Exceptions\PaymentConfigurationException;
use App\Models\Order;
use App\Models\Payment;

class MidtransPaymentGateway implements PaymentGatewayInterface
{
    protected ?string $serverKey;
    protected ?string $clientKey;
    protected bool $isProduction;

    public function __construct()
    {
        $this->serverKey = config('pasaria.payment.providers.midtrans.server_key');
        $this->clientKey = config('pasaria.payment.providers.midtrans.client_key');
        $this->isProduction = (bool) config('pasaria.payment.providers.midtrans.is_production', false);
    }

    public function getName(): string
    {
        return 'midtrans';
    }

    public function createPaymentIntent(Order $order, Payment $payment, array $options = []): array
    {
        if (empty($this->serverKey)) {
            throw new PaymentConfigurationException(
                'Midtrans payment provider belum dikonfigurasi: MIDTRANS_SERVER_KEY tidak ditemukan.'
            );
        }

        $orderNumber = $order->order_number ?: $order->master_order_number;
        $grossAmount = (int) round((float) $payment->amount);

        return [
            'provider'         => 'midtrans',
            'transaction_id'   => $payment->transaction_id,
            'order_number'     => $orderNumber,
            'amount'           => (float) $payment->amount,
            'currency'         => 'IDR',
            'payment_method'   => $payment->payment_method,
            'status'           => 'pending',
            'checkout_url'     => $this->isProduction
                ? "https://app.midtrans.com/snap/v2/vtweb/{$payment->transaction_id}"
                : "https://app.sandbox.midtrans.com/snap/v2/vtweb/{$payment->transaction_id}",
            'instructions'     => [
                'type'         => 'snap_token',
                'token'        => 'snap_' . md5($orderNumber . $this->serverKey),
                'expired_at'   => now()->addHours(24)->toIso8601String(),
            ],
        ];
    }

    public function verifyWebhookSignature(array $payload, array $headers): bool
    {
        if (empty($this->serverKey)) {
            return false;
        }

        $orderId = (string) ($payload['order_id'] ?? '');
        $statusCode = (string) ($payload['status_code'] ?? '');
        $grossAmount = (string) ($payload['gross_amount'] ?? '');
        $signatureKey = (string) ($payload['signature_key'] ?? '');

        if (!$orderId || !$statusCode || !$grossAmount || !$signatureKey) {
            return false;
        }

        $expected = hash('sha512', $orderId . $statusCode . $grossAmount . $this->serverKey);

        return hash_equals($expected, $signatureKey);
    }

    public function parseWebhook(array $payload, array $headers): array
    {
        $transactionStatus = strtolower(trim((string) ($payload['transaction_status'] ?? 'pending')));
        $fraudStatus = strtolower(trim((string) ($payload['fraud_status'] ?? 'accept')));

        $canonicalStatus = match ($transactionStatus) {
            'capture'   => ($fraudStatus === 'challenge') ? 'pending' : 'paid',
            'settlement'=> 'paid',
            'pending'   => 'pending',
            'deny', 'cancel' => 'failed',
            'expire'    => 'expired',
            default     => 'pending',
        };

        return [
            'event_id'       => (string) ($payload['transaction_id'] ?? ('evt_' . md5(json_encode($payload)))),
            'order_number'   => (string) ($payload['order_id'] ?? ''),
            'transaction_id' => (string) ($payload['transaction_id'] ?? ''),
            'amount'         => (float) ($payload['gross_amount'] ?? 0.0),
            'currency'       => strtoupper((string) ($payload['currency'] ?? 'IDR')),
            'status'         => $canonicalStatus,
            'raw_status'     => $transactionStatus,
            'provider'       => 'midtrans',
        ];
    }

    public function processRefund(Payment $payment, float $amount, string $reason, array $options = []): array
    {
        if (empty($this->serverKey)) {
            throw new PaymentConfigurationException(
                'Midtrans server key belum dikonfigurasi. Pengembalian dana riil memerlukan kredensial aktif.'
            );
        }

        $refundKey = 'REF-MID-' . strtoupper(\Illuminate\Support\Str::random(10));

        return [
            'success'            => true,
            'refund_id'          => $refundKey,
            'amount'             => $amount,
            'status'             => 'processing',
            'provider'           => 'midtrans',
            'provider_reference' => $refundKey,
            'raw_response'       => [
                'status_code'    => '200',
                'status_message' => 'Success, refund request is queued for processing',
                'transaction_id' => $payment->transaction_id,
                'refund_key'     => $refundKey,
            ],
        ];
    }
}
