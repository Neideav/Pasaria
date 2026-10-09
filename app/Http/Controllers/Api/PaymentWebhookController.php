<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Payment;
use App\Models\PaymentEvent;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Services\Payment\PaymentManager;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PaymentWebhookController extends Controller
{
    protected PaymentManager $paymentManager;

    public function __construct(PaymentManager $paymentManager)
    {
        $this->paymentManager = $paymentManager;
    }

    /**
     * Handle incoming payment gateway callback/webhook.
     */
    public function handle(Request $request, ?string $provider = null): JsonResponse
    {
        $provider = $provider ?: $request->query('provider', config('pasaria.payment.default', 'sandbox'));
        $payload = $request->all();
        $headers = array_change_key_case($request->headers->all(), CASE_LOWER);
        // Normalize headers to single values
        $normalizedHeaders = [];
        foreach ($headers as $k => $v) {
            $normalizedHeaders[$k] = is_array($v) ? ($v[0] ?? '') : (string) $v;
        }

        try {
            $gateway = $this->paymentManager->gateway($provider);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => "Payment provider '{$provider}' tidak valid atau belum didukung.",
            ], 400);
        }

        // 1. Authenticate webhook signature / token
        if (!$gateway->verifyWebhookSignature($payload, $normalizedHeaders)) {
            Log::warning("Payment webhook signature mismatch for provider [{$provider}]", [
                'ip' => $request->ip(),
            ]);

            PaymentEvent::create([
                'payment_id'   => null,
                'event_id'     => $payload['event_id'] ?? null,
                'provider'     => $provider,
                'event_type'   => 'unauthorized_signature',
                'payload_json' => $payload,
                'status'       => 'rejected',
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Tanda tangan webhook (signature) tidak valid.',
            ], 401);
        }

        // 2. Parse canonical event structure
        $eventData = $gateway->parseWebhook($payload, $normalizedHeaders);
        $eventId = $eventData['event_id'];

        // 3. Idempotency Check: Reject duplicate event from re-processing
        $existingEvent = PaymentEvent::where('provider', $provider)
            ->where('event_id', $eventId)
            ->where('status', 'processed')
            ->first();

        if ($existingEvent) {
            return response()->json([
                'success'    => true,
                'message'    => 'Event pembayaran sudah diproses sebelumnya (Idempotent replay).',
                'idempotent' => true,
            ], 200);
        }

        // 4. Atomic database transaction with row locks
        return DB::transaction(function () use ($eventData, $payload, $provider, $eventId) {
            $orderNumber = $eventData['order_number'];

            $order = Order::where(function ($q) use ($orderNumber) {
                $q->where('order_number', $orderNumber)
                  ->orWhere('master_order_number', $orderNumber);
            })->lockForUpdate()->first();

            if (!$order) {
                PaymentEvent::create([
                    'payment_id'   => null,
                    'event_id'     => $eventId,
                    'provider'     => $provider,
                    'event_type'   => 'order_not_found',
                    'payload_json' => $payload,
                    'status'       => 'rejected',
                ]);

                return response()->json([
                    'success' => false,
                    'message' => "Pesanan '{$orderNumber}' tidak ditemukan.",
                ], 404);
            }

            $isMaster = ($order->master_order_number === $orderNumber && $order->order_number !== $orderNumber);
            $targetOrders = $isMaster
                ? Order::where('master_order_number', $orderNumber)->lockForUpdate()->get()
                : collect([$order]);

            $payments = Payment::whereIn('order_id', $targetOrders->pluck('id'))->lockForUpdate()->get();
            if ($payments->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => "Data transaksi pembayaran untuk pesanan '{$orderNumber}' tidak ditemukan.",
                ], 422);
            }

            $primaryPayment = $payments->first();
            $expectedAmount = (float) $targetOrders->sum('total');

            // 5. Strict verification of amount and currency
            if (abs($expectedAmount - (float) $eventData['amount']) > 0.01) {
                PaymentEvent::create([
                    'payment_id'   => $primaryPayment->id,
                    'event_id'     => $eventId,
                    'provider'     => $provider,
                    'event_type'   => 'amount_mismatch',
                    'payload_json' => $payload,
                    'status'       => 'rejected',
                ]);

                return response()->json([
                    'success' => false,
                    'message' => "Jumlah pembayaran (Rp" . number_format($eventData['amount'], 2) . ") tidak sesuai dengan tagihan pesanan (Rp" . number_format($expectedAmount, 2) . ").",
                ], 422);
            }

            if ($eventData['currency'] !== 'IDR') {
                PaymentEvent::create([
                    'payment_id'   => $primaryPayment->id,
                    'event_id'     => $eventId,
                    'provider'     => $provider,
                    'event_type'   => 'currency_mismatch',
                    'payload_json' => $payload,
                    'status'       => 'rejected',
                ]);

                return response()->json([
                    'success' => false,
                    'message' => "Mata uang pembayaran '{$eventData['currency']}' tidak sesuai. Harus IDR.",
                ], 422);
            }

            // 6. Idempotent check on payment status
            $allPaid = $payments->every(fn($p) => $p->status === 'paid');
            if ($allPaid && $eventData['status'] === 'paid') {
                return response()->json([
                    'success'    => true,
                    'message'    => 'Pembayaran pesanan sudah diverifikasi sebelumnya.',
                    'idempotent' => true,
                ], 200);
            }

            // 7. Process lifecycle transitions
            if ($eventData['status'] === 'paid') {
                foreach ($payments as $pmt) {
                    $pmt->update([
                        'status'             => 'paid',
                        'paid_at'            => now(),
                        'provider'           => $provider,
                        'provider_reference' => $eventData['transaction_id'] ?: $pmt->transaction_id,
                    ]);
                }

                foreach ($targetOrders as $ord) {
                    $ord->update(['status' => 'paid']);
                    if ($ord->shipment) {
                        $ord->shipment->update([
                            'status'       => 'processing',
                            'status_label' => 'Pembayaran Terverifikasi & Diproses Penjual',
                        ]);
                    }
                }
            } elseif (in_array($eventData['status'], ['failed', 'expired'], true)) {
                if (!$allPaid) {
                    foreach ($payments as $pmt) {
                        $pmt->update(['status' => $eventData['status']]);
                    }
                    foreach ($targetOrders as $ord) {
                        $ord->update(['status' => 'cancelled']);
                        foreach ($ord->items as $item) {
                            if ($item->product_id) {
                                Product::where('id', $item->product_id)->increment('stock', $item->quantity);
                            }
                            if ($item->variant_id) {
                                ProductVariant::where('id', $item->variant_id)->increment('stock', $item->quantity);
                            }
                        }
                    }
                }
            }

            // 8. Record audit log
            PaymentEvent::create([
                'payment_id'   => $primaryPayment->id,
                'event_id'     => $eventId,
                'provider'     => $provider,
                'event_type'   => $eventData['status'],
                'payload_json' => $payload,
                'status'       => 'processed',
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Webhook pembayaran berhasil diproses.',
                'status'  => $primaryPayment->fresh()->status,
            ], 200);
        }, 3);
    }
}
