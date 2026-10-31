<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderReturn;
use App\Models\Dispute;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserPrivacyApiController extends Controller
{
    /**
     * Export personal data for the authenticated user.
     * Sanitizes credentials, tokens, hashes, and foreign entity secrets.
     */
    public function exportUserData(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        // 1. Core Profile Data (sanitized)
        $profile = [
            'id'                => $user->id,
            'name'              => $user->name,
            'username'          => $user->username,
            'email'             => $user->email,
            'phone'             => $user->phone,
            'city'              => $user->city,
            'address'           => $user->address,
            'zip'               => $user->zip,
            'role'              => $user->role,
            'email_verified_at' => $user->email_verified_at?->toIso8601String(),
            'created_at'        => $user->created_at?->toIso8601String(),
        ];

        // 2. Saved Delivery Addresses
        $addresses = $user->addresses()
            ->get(['id', 'recipient_name', 'phone', 'address_line', 'city', 'province', 'postal_code', 'is_default', 'created_at']);

        // 3. Purchase & Order History
        $orders = $user->orders()
            ->with(['items'])
            ->get()
            ->map(function ($order) {
                return [
                    'order_number'    => $order->order_number,
                    'customer_name'   => $order->customer_name,
                    'total'           => (float) $order->total,
                    'status'          => $order->status,
                    'created_at'      => $order->created_at?->toIso8601String(),
                    'items'           => $order->items->map(function ($item) {
                        return [
                            'product_name' => $item->product_name ?? $item->name,
                            'quantity'     => $item->quantity,
                            'price'        => (float) $item->price,
                            'subtotal'     => (float) ($item->subtotal ?? ($item->price * $item->quantity)),
                        ];
                    }),
                ];
            });

        // 4. Submitted Reviews
        $reviews = $user->reviews()
            ->get(['id', 'product_id', 'rating', 'review_text', 'is_anonymous', 'created_at']);

        // 5. In-App Notifications
        $notifications = $user->notifications()
            ->get(['id', 'title', 'message', 'type', 'is_read', 'created_at']);

        $exportPayload = [
            'generated_at'  => now()->toIso8601String(),
            'platform'      => 'PASARIA Marketplace',
            'user'          => $profile,
            'addresses'     => $addresses,
            'orders'        => $orders,
            'reviews'       => $reviews,
            'notifications' => $notifications,
        ];

        return response()->json([
            'success' => true,
            'message' => 'Ekspor data pribadi berhasil diproses.',
            'data'    => $exportPayload,
        ]);
    }

    /**
     * Account deletion request with password confirmation, active transaction guards,
     * token revocation, anonymization, and soft deletion.
     */
    public function deleteAccount(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        $request->validate([
            'password' => 'required|string',
            'reason'   => 'nullable|string|max:500',
        ]);

        if (!Hash::check($request->input('password'), $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Kata sandi saat ini tidak cocok.',
            ], 422);
        }

        // Guard 1: Active unresolved customer orders
        $hasActiveOrders = Order::where('user_id', $user->id)
            ->whereIn('status', ['pending', 'processing', 'in_transit', 'out_for_delivery'])
            ->exists();

        if ($hasActiveOrders) {
            return response()->json([
                'success' => false,
                'message' => 'Akun tidak dapat dihapus karena Anda memiliki transaksi pesanan yang masih aktif atau dalam pengiriman.',
            ], 422);
        }

        // Guard 2: Active dispute or return process
        $hasActiveReturns = OrderReturn::where('user_id', $user->id)
            ->whereIn('status', ['requested', 'approved', 'in_transit'])
            ->exists();

        if ($hasActiveReturns) {
            return response()->json([
                'success' => false,
                'message' => 'Akun tidak dapat dihapus karena terdapat pengajuan komplain atau retur barang yang masih diproses.',
            ], 422);
        }

        // Revoke all authentication tokens
        $user->tokens()->delete();

        // Anonymize sensitive identifying attributes for GDPR / UU PDP compliance while preserving ledger integrity
        $user->name = 'Pengguna Dihapus (Nonaktif)';
        $user->phone = null;
        $user->avatar = null;
        $user->address = null;
        $user->city = null;
        $user->zip = null;
        $user->status = 'suspended';
        $user->save();

        // Soft delete user record
        $user->delete();

        return response()->json([
            'success' => true,
            'message' => 'Akun Anda berhasil dihapus dan seluruh sesi login telah dicabut.',
        ]);
    }
}
