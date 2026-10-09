<?php

namespace App\Services\Payment;

use App\Contracts\PaymentGatewayInterface;
use App\Exceptions\PaymentConfigurationException;
use App\Models\Order;
use App\Models\Payment;
use Illuminate\Support\Str;

class SandboxPaymentGateway implements PaymentGatewayInterface
{
    protected string $secret;

    public function __construct()
    {
        $this->secret = config('pasaria.payment.providers.sandbox.webhook_secret', 'pasaria-sandbox-webhook-secret-token');
    }

    public function getName(): string
    {
        return 'sandbox';
    }

    public function createPaymentIntent(Order $order, Payment $payment, array $options = []): array
    {
        // Enforce security rule: simulation/sandbox is strictly forbidden in production
        if (app()->environment('production')) {
            throw new PaymentConfigurationException(
                'Sandbox payment provider tidak dapat digunakan di lingkungan production. Harap konfigurasikan provider resmi seperti Midtrans atau Xendit.'
            );
        }

        $transactionId = $payment->transaction_id ?: ('TXN-' . strtoupper(Str::random(10)));
        $orderNumber = $order->order_number ?: $order->master_order_number;

        return [
            'provider'         => 'sandbox',
            'transaction_id'   => $transactionId,
            'order_number'     => $orderNumber,
            'amount'           => (float) $payment->amount,
            'currency'         => 'IDR',
            'payment_method'   => $payment->payment_method ?: 'qris',
            'status'           => 'pending',
            'checkout_url'     => url("/api/payments/mock-checkout/{$transactionId}"),
            'instructions'     => [
                'type'         => 'qris',
                'qr_code'      => '00020101021226600016ID.PASARIA.MOCK0118PASARIA99887766555204581253033605802ID' . substr(md5($transactionId), 0, 8),
                'expired_at'   => now()->addHours(24)->toIso8601String(),
                'note'         => 'Selesaikan pembayaran menggunakan aplikasi e-wallet sebelum batas waktu berakhir.',
            ],
        ];
    }

    public function verifyWebhookSignature(array $payload, array $headers): bool
    {
        $signature = $headers['x-callback-signature'] ?? $headers['x-signature'] ?? ($payload['signature'] ?? null);
        if (!$signature) {
            return false;
        }

        $canonicalString = (string) ($payload['order_number'] ?? '') . ':'
            . (string) ($payload['amount'] ?? '') . ':'
            . (string) ($payload['status'] ?? '');

        $expectedSignature = hash_hmac('sha256', $canonicalString, $this->secret);

        return hash_equals($expectedSignature, (string) $signature);
    }

    public function parseWebhook(array $payload, array $headers): array
    {
        $rawStatus = strtolower(trim((string) ($payload['status'] ?? 'pending')));

        $canonicalStatus = match ($rawStatus) {
            'settlement', 'paid', 'success', 'capture' => 'paid',
            'cancel', 'deny', 'failed'                 => 'failed',
            'expire', 'expired'                        => 'expired',
            default                                    => 'pending',
        };

        return [
            'event_id'       => (string) ($payload['event_id'] ?? ('evt_' . md5(json_encode($payload)))),
            'order_number'   => (string) ($payload['order_number'] ?? ''),
            'transaction_id' => (string) ($payload['transaction_id'] ?? ''),
            'amount'         => (float) ($payload['amount'] ?? 0.0),
            'currency'       => strtoupper((string) ($payload['currency'] ?? 'IDR')),
            'status'         => $canonicalStatus,
            'raw_status'     => $rawStatus,
            'provider'       => 'sandbox',
        ];
    }

    /**
     * Helper to generate a valid signature for tests or simulated callbacks.
     */
    public function generateSignature(string $orderNumber, float $amount, string $status): string
    {
        $canonicalString = "{$orderNumber}:{$amount}:{$status}";
        return hash_hmac('sha256', $canonicalString, $this->secret);
    }
}
