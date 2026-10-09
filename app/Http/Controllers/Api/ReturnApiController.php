<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OrderReturn;
use App\Models\Dispute;
use App\Models\AdminAction;
use App\Models\Notification;
use App\Services\OrderStateMachine;
use App\Services\RefundService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReturnApiController extends Controller
{
    protected OrderStateMachine $stateMachine;
    protected RefundService $refundService;

    public function __construct(OrderStateMachine $stateMachine, RefundService $refundService)
    {
        $this->stateMachine = $stateMachine;
        $this->refundService = $refundService;
    }

    /**
     * List returns with strict authorization and filtering.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        $query = OrderReturn::with(['order', 'shop', 'user', 'dispute', 'item'])->orderBy('id', 'desc');

        if ($user->isAdmin() || $user->isSupport()) {
            // Admin/support sees all returns
        } elseif ($user->isSeller() && $user->shop) {
            $query->where('shop_id', $user->shop->id);
        } else {
            $query->where('user_id', $user->id);
        }

        return response()->json([
            'success' => true,
            'data'    => $query->get(),
        ]);
    }

    /**
     * Customer submits return / refund request with item-level validation & 7-day policy limit.
     */
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        $forbiddenReturnFields = ['status', 'refund_amount', 'user_id', 'shop_id'];
        foreach ($forbiddenReturnFields as $ff) {
            if ($request->has($ff)) {
                return response()->json([
                    'success' => false,
                    'message' => "Field '{$ff}' dikontrol oleh server dan tidak boleh ditentukan dalam request.",
                ], 422);
            }
        }

        $request->validate([
            'order_id'          => 'required|integer',
            'order_item_id'     => 'nullable|integer',
            'quantity'          => 'nullable|integer',
            'reason'            => 'required|string|in:wrong_item,damaged,defective,missing_item,not_as_described,other',
            'description'       => 'required|string|min:10|max:2000',
            'evidence_urls'     => 'nullable|array',
            'evidence_urls.*'   => 'string|url',
            'requested_amount'  => 'nullable|numeric|min:1',
        ]);

        $orderId = (int) $request->input('order_id');
        $order = Order::with('items')->find($orderId);

        if (!$order) {
            return response()->json(['success' => false, 'message' => 'Pesanan tidak ditemukan.'], 404);
        }

        // BOLA / Ownership validation: must belong strictly to authenticated buyer
        if ($order->user_id !== $user->id && !$user->isAdmin()) {
            return response()->json(['success' => false, 'message' => 'Akses ditolak.'], 403);
        }

        // Eligibility validation using OrderStateMachine
        $eligibility = $this->stateMachine->isReturnable($order, $user);
        if (!$eligibility['eligible']) {
            return response()->json([
                'success' => false,
                'message' => $eligibility['message'],
            ], 422);
        }

        $orderItemId = $request->input('order_item_id');
        $quantity = (int) $request->input('quantity', 1);

        if ($request->has('quantity') && $quantity <= 0) {
            return response()->json([
                'success' => false,
                'message' => 'Kuantitas barang yang diretur harus lebih besar dari 0.',
            ], 422);
        }

        $maxEligibleAmount = (float) $order->total;
        $targetItem = null;

        if ($orderItemId) {
            $targetItem = $order->items->firstWhere('id', (int) $orderItemId);
            if (!$targetItem) {
                return response()->json([
                    'success' => false,
                    'message' => 'Item produk tidak ditemukan pada pesanan ini.',
                ], 422);
            }

            if ($quantity > $targetItem->quantity) {
                return response()->json([
                    'success' => false,
                    'message' => "Kuantitas retur ({$quantity}) melebihi kuantitas pembelian ({$targetItem->quantity}).",
                ], 422);
            }

            $alreadyReturnedQty = (int) OrderReturn::where('order_id', $order->id)
                ->where('order_item_id', $targetItem->id)
                ->whereIn('status', ['requested', 'approved', 'refunded'])
                ->sum('quantity');

            if ($alreadyReturnedQty + $quantity > $targetItem->quantity) {
                return response()->json([
                    'success' => false,
                    'message' => 'Kuantitas pengembalian melebihi sisa barang yang dapat diretur.',
                ], 422);
            }

            $itemSubtotal = round((float) $targetItem->price * $quantity, 2);
            $maxEligibleAmount = min($itemSubtotal, (float) $order->total);
        } else {
            $alreadyReturnedOrder = OrderReturn::where('order_id', $order->id)
                ->whereNull('order_item_id')
                ->whereIn('status', ['requested', 'approved', 'refunded'])
                ->exists();

            if ($alreadyReturnedOrder) {
                return response()->json([
                    'success' => false,
                    'message' => 'Pengajuan komplain/retur untuk seluruh pesanan ini sudah ada.',
                ], 422);
            }
        }

        $requestedAmount = $maxEligibleAmount;
        if ($request->has('requested_amount')) {
            $clientRequested = (float) $request->input('requested_amount');
            if ($clientRequested > $maxEligibleAmount + 0.01) {
                return response()->json([
                    'success' => false,
                    'message' => "Nominal pengembalian yang diajukan (Rp" . number_format($clientRequested, 0, ',', '.') . ") melebihi nilai maksimal yang memenuhi syarat (Rp" . number_format($maxEligibleAmount, 0, ',', '.') . ").",
                ], 422);
            }
            $requestedAmount = min($maxEligibleAmount, max(1.0, $clientRequested));
        }

        return DB::transaction(function () use ($order, $user, $request, $orderItemId, $quantity, $requestedAmount, $targetItem) {
            $return = OrderReturn::create([
                'order_id'           => $order->id,
                'order_item_id'      => $orderItemId,
                'quantity'           => $quantity,
                'user_id'            => $user->id,
                'shop_id'            => $order->shop_id ?: 1,
                'status'             => 'requested',
                'reason'             => $request->input('reason'),
                'description'        => trim($request->input('description')),
                'evidence_urls_json' => $request->input('evidence_urls', []),
                'items_json'         => $targetItem ? [$targetItem->toArray()] : [],
                'requested_amount'   => $requestedAmount,
                'refund_amount'      => 0.00,
            ]);

            $order->update(['status' => OrderStateMachine::STATUS_RETURN_REQUESTED]);

            try {
                if ($order->shop && $order->shop->user_id) {
                    Notification::create([
                        'user_id'    => $order->shop->user_id,
                        'title'      => 'Pengajuan Retur Baru',
                        'message'    => "Pembeli mengajukan retur untuk pesanan #{$order->order_number}.",
                        'type'       => 'order_return',
                        'action_url' => "/seller/orders",
                    ]);
                }
            } catch (\Throwable $e) {}

            return response()->json([
                'success' => true,
                'message' => 'Pengajuan pengembalian barang/dana berhasil dikirim.',
                'data'    => $return,
            ], 201);
        }, 3);
    }

    /**
     * Seller responds to return (approve / reject) with concurrency guard.
     */
    public function sellerRespond(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        $return = OrderReturn::with(['order', 'shop'])->find($id);
        if (!$return) {
            return response()->json(['success' => false, 'message' => 'Pengajuan retur tidak ditemukan.'], 404);
        }

        // Cross-shop ownership enforcement
        if (!$user->isAdmin()) {
            if (!$user->shop || $user->shop->id !== $return->shop_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Akses ditolak. Anda tidak berhak merespon retur toko lain.',
                ], 403);
            }
        }

        $request->validate([
            'decision' => 'required|string|in:approved,rejected',
            'note'     => 'nullable|string|max:1000',
        ]);

        return DB::transaction(function () use ($return, $request, $user) {
            $lockedReturn = OrderReturn::where('id', $return->id)->lockForUpdate()->first();

            // Status guard: cannot process twice
            if ($lockedReturn->status !== 'requested') {
                return response()->json([
                    'success' => false,
                    'message' => "Pengajuan retur sudah pernah diproses ({$lockedReturn->status}).",
                ], 422);
            }

            $decision = $request->input('decision');
            $note = trim($request->input('note', ''));
            $lockedReturn->seller_note = $note;
            $lockedReturn->processed_by = $user->id;
            $lockedReturn->processed_at = now();

            if ($decision === 'approved') {
                $lockedReturn->status = 'approved';
                $lockedReturn->refund_amount = $lockedReturn->requested_amount;
                $lockedReturn->save();

                if ($lockedReturn->order) {
                    $lockedReturn->order->update(['status' => OrderStateMachine::STATUS_RETURN_APPROVED]);
                }
            } else {
                $lockedReturn->status = 'rejected';
                $lockedReturn->save();

                if ($lockedReturn->order) {
                    $lockedReturn->order->update(['status' => OrderStateMachine::STATUS_COMPLETED]);
                }
            }

            try {
                Notification::create([
                    'user_id'    => $lockedReturn->user_id,
                    'title'      => 'Tanggapan Penjual Terhadap Retur',
                    'message'    => "Penjual telah {$decision} pengajuan komplain untuk pesanan #{$lockedReturn->order?->order_number}.",
                    'type'       => 'order_return',
                    'action_url' => "/orders/{$lockedReturn->order?->order_number}",
                ]);
            } catch (\Throwable $e) {}

            return response()->json([
                'success' => true,
                'message' => "Respon penjual ({$decision}) berhasil disimpan.",
                'data'    => $lockedReturn->fresh(['order', 'shop']),
            ]);
        }, 3);
    }

    /**
     * Open or escalate to Dispute (Resolution Center).
     */
    public function openDispute(Request $request, int $returnId): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        $return = OrderReturn::find($returnId);
        if (!$return) {
            return response()->json(['success' => false, 'message' => 'Pengajuan retur tidak ditemukan.'], 404);
        }

        $isBuyer = ($return->user_id === $user->id);
        $isSeller = ($user->shop && $return->shop_id === $user->shop->id);
        if (!$isBuyer && !$isSeller && !$user->isAdmin()) {
            return response()->json(['success' => false, 'message' => 'Akses ditolak.'], 403);
        }

        return DB::transaction(function () use ($returnId, $return) {
            $dispute = Dispute::firstOrCreate(
                ['return_id' => $returnId],
                [
                    'order_id' => $return->order_id,
                    'user_id'  => $return->user_id,
                    'shop_id'  => $return->shop_id,
                    'status'   => 'open',
                ]
            );

            $return->update(['status' => OrderStateMachine::STATUS_DISPUTED]);

            if ($return->order) {
                $return->order->update(['status' => OrderStateMachine::STATUS_DISPUTED]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Pusat Resolusi PASARIA telah dibuka. Tim moderator akan meninjau bukti.',
                'data'    => $dispute,
            ], 201);
        });
    }

    /**
     * Admin resolves dispute. Strictly authorized to Admin or Support with full ledger/refund reconciliation.
     */
    public function resolveDispute(Request $request, int $disputeId): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        if (!$user->isAdmin() && !$user->isSupport()) {
            return response()->json([
                'success' => false,
                'message' => 'Hanya Administrator atau Tim Support yang dapat menyelesaikan sengketa.',
            ], 403);
        }

        $request->validate([
            'resolution'      => 'required|string|in:refund_buyer,reject_claim,partial_refund',
            'resolution_note' => 'nullable|string|max:1000',
            'refund_amount'   => 'nullable|numeric|min:1',
        ]);

        return DB::transaction(function () use ($disputeId, $request, $user) {
            $dispute = Dispute::with(['return.order.payment'])->where('id', $disputeId)->lockForUpdate()->first();
            if (!$dispute) {
                return response()->json(['success' => false, 'message' => 'Dispute tidak ditemukan.'], 404);
            }

            if ($dispute->status !== 'open') {
                return response()->json([
                    'success' => false,
                    'message' => "Sengketa ini sudah pernah diselesaikan sebelumnya ({$dispute->status}).",
                ], 422);
            }

            $resolution = $request->input('resolution');
            $note = trim($request->input('resolution_note', 'Diputuskan oleh Administrator PASARIA'));

            $dispute->status = 'resolved';
            $dispute->resolution = $resolution;
            $dispute->resolution_note = $note;
            $dispute->resolved_by = $user->id;
            $dispute->save();

            $order = $dispute->order ?: $dispute->return?->order;

            if (in_array($resolution, ['refund_buyer', 'partial_refund'], true) && $order) {
                $maxPossible = (float) $order->total;
                if ($dispute->return && $dispute->return->requested_amount > 0) {
                    $maxPossible = (float) $dispute->return->requested_amount;
                }

                $amountToRefund = ($resolution === 'partial_refund')
                    ? min($maxPossible, max(1.0, (float) $request->input('refund_amount', $maxPossible)))
                    : $maxPossible;

                $this->refundService->processRefund(
                    $order,
                    $amountToRefund,
                    "Penyelesaian sengketa #{$dispute->id}: {$note}",
                    $dispute->return,
                    $user,
                    ['type' => ($resolution === 'partial_refund') ? 'partial' : 'full']
                );
            } elseif ($resolution === 'reject_claim') {
                if ($dispute->return) {
                    $dispute->return->update([
                        'status'       => 'rejected',
                        'admin_note'   => $note,
                        'processed_by' => $user->id,
                        'processed_at' => now(),
                    ]);
                }
                if ($order) {
                    $order->update(['status' => OrderStateMachine::STATUS_COMPLETED]);
                }
            }

            AdminAction::create([
                'user_id'      => $user->id,
                'action'       => 'resolve_dispute',
                'target_type'  => 'dispute',
                'target_id'    => $disputeId,
                'details_json' => ['resolution' => $resolution, 'note' => $note],
                'ip_address'   => $request->ip(),
                'user_agent'   => $request->userAgent(),
            ]);

            try {
                Notification::create([
                    'user_id'    => $dispute->user_id,
                    'title'      => 'Keputusan Sengketa Resolusi',
                    'message'    => "Sengketa untuk pesanan #{$order?->order_number} telah diputuskan: {$resolution}.",
                    'type'       => 'dispute',
                    'action_url' => "/orders/{$order?->order_number}",
                ]);
            } catch (\Throwable $e) {}

            return response()->json([
                'success' => true,
                'message' => 'Sengketa berhasil diselesaikan oleh Tim PASARIA.',
                'data'    => $dispute->fresh(['return.order']),
            ]);
        }, 3);
    }
}
