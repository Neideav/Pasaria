<?php

namespace App\Contracts;

use App\Models\Order;
use App\Models\Payment;

interface PaymentGatewayInterface
{
    /**
     * Get provider identifier name (e.g. 'sandbox', 'midtrans', 'xendit').
     */
    public function getName(): string;

    /**
     * Initialize payment intent or transaction with the provider.
     *
     * @param Order $order
     * @param Payment $payment
     * @param array $options
     * @return array
     */
    public function createPaymentIntent(Order $order, Payment $payment, array $options = []): array;

    /**
     * Verify incoming webhook authenticity, signature, or token.
     *
     * @param array $payload
     * @param array $headers
     * @return bool
     */
    public function verifyWebhookSignature(array $payload, array $headers): bool;

    /**
     * Parse webhook payload into canonical normalized payment structure:
     * [
     *   'event_id'       => string,
     *   'order_number'   => string,
     *   'transaction_id' => string,
     *   'amount'         => float,
     *   'currency'       => string,
     *   'status'         => 'paid'|'failed'|'pending'|'expired',
     *   'raw_status'     => string,
     *   'provider'       => string,
     * ]
     *
    /**
     * Parse webhook payload into canonical normalized payment structure.
     */
    public function parseWebhook(array $payload, array $headers): array;

    /**
     * Process refund with the payment provider.
     *
     * @param Payment $payment
     * @param float $amount
     * @param string $reason
     * @param array $options
     * @return array
     */
    public function processRefund(Payment $payment, float $amount, string $reason, array $options = []): array;
}
