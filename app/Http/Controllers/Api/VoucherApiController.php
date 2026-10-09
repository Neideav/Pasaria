<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Voucher;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class VoucherApiController extends Controller
{
    /**
     * Get active platform and shop vouchers.
     */
    public function index(Request $request): JsonResponse
    {
        $vouchers = Voucher::where('is_active', true)
            ->where(function ($q) {
                $q->whereNull('end_at')->orWhere('end_at', '>=', now());
            })
            ->orderBy('discount_value', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $vouchers,
        ]);
    }

    /**
     * Validate voucher code and compute discount for given subtotal.
     */
    public function validateCode(Request $request): JsonResponse
    {
        $code = strtoupper(trim($request->input('code', '')));
        $subtotal = (float) $request->input('subtotal', 0);
        $shipping = (float) $request->input('shipping_cost', 15000);

        if (empty($code)) {
            return response()->json(['success' => false, 'message' => 'Silakan masukkan kode voucher.'], 422);
        }

        $voucher = Voucher::where('code', $code)->where('is_active', true)->first();

        if (!$voucher) {
            return response()->json(['success' => false, 'message' => 'Kode voucher tidak valid atau sudah kadaluarsa.'], 404);
        }

        if ($voucher->usage_count >= $voucher->usage_limit) {
            return response()->json(['success' => false, 'message' => 'Kuota pemakaian voucher ini sudah habis.'], 422);
        }

        if ($voucher->start_at && now()->lt($voucher->start_at)) {
            return response()->json(['success' => false, 'message' => 'Voucher belum dapat digunakan.'], 422);
        }

        if ($voucher->end_at && now()->gt($voucher->end_at)) {
            return response()->json(['success' => false, 'message' => 'Voucher telah kadaluarsa.'], 422);
        }

        if ($subtotal < $voucher->min_purchase) {
            return response()->json([
                'success' => false,
                'message' => "Minimal belanja untuk voucher ini adalah Rp" . number_format($voucher->min_purchase, 0, ',', '.') . ".",
            ], 422);
        }

        $user = $request->user('sanctum') ?: $request->user();
        if ($user && !empty($voucher->usage_per_user) && $voucher->usage_per_user > 0) {
            $userUsage = \App\Models\VoucherRedemption::where('voucher_id', $voucher->id)
                ->where('user_id', $user->id)
                ->where('status', '!=', 'rolled_back')
                ->count();
            if ($userUsage >= $voucher->usage_per_user) {
                return response()->json([
                    'success' => false,
                    'message' => "Anda telah mencapai batas penggunaan maksimal ({$voucher->usage_per_user}x) untuk voucher ini.",
                ], 422);
            }
        }

        if ($voucher->shop_id !== null && $request->has('shop_id')) {
            if ((int) $request->input('shop_id') !== (int) $voucher->shop_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Voucher ini hanya berlaku untuk toko tertentu.',
                ], 422);
            }
        }

        $discount = $voucher->calculateDiscount($subtotal, $shipping, $user?->id, $voucher->shop_id);

        return response()->json([
            'success' => true,
            'message' => "Voucher {$voucher->name} berhasil diterapkan!",
            'data' => [
                'code' => $voucher->code,
                'name' => $voucher->name,
                'type' => $voucher->type,
                'discount_amount' => $discount,
            ],
        ]);
    }
}
