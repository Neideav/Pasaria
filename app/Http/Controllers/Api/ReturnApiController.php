<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderReturn;
use App\Models\Dispute;
use App\Models\AdminAction;
use App\Models\Notification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReturnApiController extends Controller
{
    /**
     * List returns with strict authorization and filtering.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        $query = OrderReturn::with(['order', 'shop', 'user', 'dispute'])->orderBy('id', 'desc');

        if ($user->isAdmin() || $user->isSupport()) {
            // Admin/support sees all returns
        } elseif ($user->isSeller() && $user->shop) {
            $query->where('shop_id', $user->shop->id);
        } else {
            $query->where('user_id', $user->id);
        }

        return response()->json([
            'success' => true,
            'data' => $query->get(),
        ]);
    }

    /**
     * Customer submits return / refund request.
     */
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        $request->validate([
            'order_id' => 'required|integer',
            'reason' => 'required|string|in:wrong_item,damaged,defective,missing_item,not_as_described,other',
            'description' => 'required|string|min:10|max:2000',
            'evidence_urls' => 'nullable|array',
            'evidence_urls.*' => 'string|url',
        ]);

        $orderId = (int) $request->input('order_id');
        $order = Order::find($orderId);

        if (!$order) {
            return response()->json(['success' => false, 'message' => 'Pesanan tidak ditemukan.'], 404);
        }

        // Must strictly belong to authenticated user
        if ($order->user_id !== $user->id && !$user->isAdmin()) {
            return response()->json(['success' => false, 'message' => 'Akses ditolak.'], 403);
        }

        // Return only eligible on delivered or completed orders
        if (!in_array(strtolower($order->status), ['delivered', 'completed'], true)) {
            return response()->json([
                'success' => false,
                'message' => 'Pengajuan pengembalian hanya dapat dilakukan setelah pesanan berhasil diterima (status delivered/completed).',
            ], 422);
        }

        $existing = OrderReturn::where('order_id', $orderId)->first();
        if ($existing) {
            return response()->json([
                'success' => false,
                'message' => 'Pengajuan komplain/retur untuk pesanan ini sudah ada.',
            ], 422);
        }

        // Server-calculated max refund amount (capped strictly to order total)
        $maxEligibleAmount = (float) $order->total;
        $requestedAmount = $maxEligibleAmount;
        if ($request->has('requested_amount')) {
            $requestedAmount = min($maxEligibleAmount, max(1.0, (float) $request->input('requested_amount')));
        }

        $return = OrderReturn::create([
            'order_id' => $orderId,
            'user_id' => $user->id,
            'shop_id' => $order->shop_id ?: 1,
            'status' => 'requested',
            'reason' => $request->input('reason'),
            'description' => trim($request->input('description')),
            'evidence_urls_json' => $request->input('evidence_urls', []),
            'requested_amount' => $requestedAmount,
            'refund_amount' => 0.00,
        ]);

        $order->status = 'return_requested';
        $order->save();

        return response()->json([
            'success' => true,
            'message' => 'Pengajuan pengembalian barang/dana berhasil dikirim.',
            'data' => $return,
        ], 201);
    }

    /**
     * Seller responds to return (approve / reject).
     */
    public function sellerRespond(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        $return = OrderReturn::with('order')->find($id);
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
            'note' => 'nullable|string|max:1000',
        ]);

        $decision = $request->input('decision');
        $return->seller_note = trim($request->input('note', ''));

        if ($decision === 'approved') {
            // Stage 1: Approved by seller, pending processing / refund disbursement
            $return->status = 'approved';
            $return->refund_amount = $return->requested_amount;
            if ($return->order) {
                $return->order->status = 'refund_processing';
                $return->order->save();
            }
        } else {
            $return->status = 'rejected';
        }
        $return->save();

        return response()->json([
            'success' => true,
            'message' => "Respon penjual ({$decision}) berhasil disimpan.",
            'data' => $return,
        ]);
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

        // User must be buyer, or seller of the shop, or admin
        $isBuyer = ($return->user_id === $user->id);
        $isSeller = ($user->shop && $return->shop_id === $user->shop->id);
        if (!$isBuyer && !$isSeller && !$user->isAdmin()) {
            return response()->json(['success' => false, 'message' => 'Akses ditolak.'], 403);
        }

        $dispute = Dispute::firstOrCreate(
            ['return_id' => $returnId],
            [
                'order_id' => $return->order_id,
                'user_id' => $return->user_id,
                'shop_id' => $return->shop_id,
                'status' => 'open',
            ]
        );

        $return->status = 'disputed';
        $return->save();

        return response()->json([
            'success' => true,
            'message' => 'Pusat Resolusi PASARIA telah dibuka. Tim moderator akan meninjau bukti.',
            'data' => $dispute,
        ], 201);
    }

    /**
     * Admin resolves dispute. Strictly authorized to Admin or Support.
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
            'resolution' => 'required|string|in:refund_buyer,reject_claim,partial_refund',
            'resolution_note' => 'nullable|string|max:1000',
        ]);

        $dispute = Dispute::with(['return.order'])->find($disputeId);
        if (!$dispute) {
            return response()->json(['success' => false, 'message' => 'Dispute tidak ditemukan.'], 404);
        }

        $resolution = $request->input('resolution');
        $note = trim($request->input('resolution_note', 'Diputuskan oleh Administrator PASARIA'));

        $dispute->status = 'resolved';
        $dispute->resolution = $resolution;
        $dispute->resolution_note = $note;
        $dispute->resolved_by = $user->id;
        $dispute->save();

        if ($dispute->return) {
            $isRefund = in_array($resolution, ['refund_buyer', 'partial_refund'], true);
            $dispute->return->status = $isRefund ? 'refunded' : 'rejected';
            $dispute->return->admin_note = $note;
            $dispute->return->save();

            if ($dispute->return->order) {
                $dispute->return->order->status = $isRefund ? 'refunded' : 'completed';
                $dispute->return->order->save();
            }
        }

        AdminAction::create([
            'user_id' => $user->id,
            'action' => 'resolve_dispute',
            'target_type' => 'dispute',
            'target_id' => $disputeId,
            'details_json' => ['resolution' => $resolution, 'note' => $note],
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Sengketa berhasil diselesaikan oleh Tim PASARIA.',
            'data' => $dispute,
        ]);
    }
}
