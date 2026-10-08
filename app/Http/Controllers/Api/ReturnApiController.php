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
     * List returns for customer or seller.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $userId = $user ? $user->id : (int) ($request->input('user_id') ?: 1);

        $query = OrderReturn::with(['order', 'shop', 'user', 'dispute'])->orderBy('id', 'desc');

        if ($user) {
            if ($user->isAdmin()) {
                // all returns
            } elseif ($user->isSeller() && $user->shop) {
                $query->where('shop_id', $user->shop->id);
            } else {
                $query->where('user_id', $userId);
            }
        } else {
            $query->where('user_id', $userId);
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
        $userId = $user ? $user->id : (int) ($request->input('user_id') ?: 1);

        $request->validate([
            'order_id' => 'required|integer',
            'reason' => 'required|string',
            'description' => 'required|string|min:10',
        ]);

        $orderId = (int) $request->input('order_id');
        $order = Order::find($orderId);

        if (!$order) {
            return response()->json(['success' => false, 'message' => 'Pesanan tidak ditemukan.'], 404);
        }

        // Must belong to user
        if ($order->user_id !== $userId && (!$user || !$user->isAdmin())) {
            return response()->json(['success' => false, 'message' => 'Anda tidak memiliki hak akses.'], 403);
        }

        $existing = OrderReturn::where('order_id', $orderId)->first();
        if ($existing) {
            return response()->json(['success' => false, 'message' => 'Pengajuan komplain/retur untuk pesanan ini sudah ada.'], 422);
        }

        $return = OrderReturn::create([
            'order_id' => $orderId,
            'user_id' => $userId,
            'shop_id' => $order->shop_id ?: 1,
            'status' => 'requested',
            'reason' => $request->input('reason'),
            'description' => $request->input('description'),
            'evidence_urls_json' => $request->input('evidence_urls', []),
            'requested_amount' => (float) ($request->input('requested_amount') ?: $order->total),
            'refund_amount' => 0,
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
        $return = OrderReturn::with('order')->find($id);

        if (!$return) {
            return response()->json(['success' => false, 'message' => 'Pengajuan retur tidak ditemukan.'], 404);
        }

        if ($user && !$user->isAdmin()) {
            if (!$user->shop || $user->shop->id !== $return->shop_id) {
                return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
            }
        }

        $decision = $request->input('decision'); // 'approved' or 'rejected'
        if (!in_array($decision, ['approved', 'rejected'])) {
            return response()->json(['success' => false, 'message' => 'Keputusan tidak valid.'], 422);
        }

        $return->status = $decision;
        $return->seller_note = $request->input('note', '');
        if ($decision === 'approved') {
            $return->refund_amount = $return->requested_amount;
            $return->order->status = 'refunded';
            $return->order->save();
        }
        $return->save();

        return response()->json([
            'success' => true,
            'message' => 'Respon penjual berhasil disimpan.',
            'data' => $return,
        ]);
    }

    /**
     * Open or escalate to Dispute (Resolution Center).
     */
    public function openDispute(Request $request, int $returnId): JsonResponse
    {
        $user = $request->user();
        $userId = $user ? $user->id : (int) ($request->input('user_id') ?: 1);

        $return = OrderReturn::find($returnId);
        if (!$return) {
            return response()->json(['success' => false, 'message' => 'Pengajuan retur tidak ditemukan.'], 404);
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
     * Admin resolves dispute.
     */
    public function resolveDispute(Request $request, int $disputeId): JsonResponse
    {
        $dispute = Dispute::with(['return.order'])->find($disputeId);
        if (!$dispute) {
            return response()->json(['success' => false, 'message' => 'Dispute tidak ditemukan.'], 404);
        }

        $resolution = $request->input('resolution', 'refund_buyer'); // refund_buyer, reject_claim
        $note = $request->input('resolution_note', 'Diputuskan oleh Administrator PASARIA');

        $dispute->status = 'resolved';
        $dispute->resolution = $resolution;
        $dispute->resolution_note = $note;
        $dispute->resolved_by = $request->user()?->id ?: 1;
        $dispute->save();

        if ($dispute->return) {
            $dispute->return->status = ($resolution === 'refund_buyer') ? 'refunded' : 'rejected';
            $dispute->return->admin_note = $note;
            $dispute->return->save();

            if ($dispute->return->order) {
                $dispute->return->order->status = ($resolution === 'refund_buyer') ? 'refunded' : 'completed';
                $dispute->return->order->save();
            }
        }

        AdminAction::create([
            'user_id' => $request->user()?->id ?: 1,
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
