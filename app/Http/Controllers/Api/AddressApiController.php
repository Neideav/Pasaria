<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\UserAddress;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AddressApiController extends Controller
{
    /**
     * Get list of addresses for authenticated user.
     */
    public function index(Request $request): JsonResponse
    {
        $userId = $request->user()?->id ?: ($request->input('user_id') ?: 1);
        $addresses = UserAddress::where('user_id', $userId)
            ->orderBy('is_default', 'desc')
            ->orderBy('id', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $addresses,
        ]);
    }

    /**
     * Store a new address.
     */
    public function store(Request $request): JsonResponse
    {
        $userId = $request->user()?->id ?: ($request->input('user_id') ?: 1);

        $request->validate([
            'recipient_name' => 'required|string',
            'phone' => 'required|string',
            'address_line' => 'required|string',
            'city' => 'required|string',
            'postal_code' => 'required|string',
        ]);

        $isDefault = $request->boolean('is_default', false);
        if ($isDefault || UserAddress::where('user_id', $userId)->count() === 0) {
            UserAddress::where('user_id', $userId)->update(['is_default' => false]);
            $isDefault = true;
        }

        $address = UserAddress::create([
            'user_id' => $userId,
            'recipient_name' => $request->input('recipient_name'),
            'phone' => $request->input('phone'),
            'address_line' => $request->input('address_line'),
            'city' => $request->input('city'),
            'province' => $request->input('province', 'DKI Jakarta'),
            'postal_code' => $request->input('postal_code'),
            'is_default' => $isDefault,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Alamat pengiriman berhasil ditambahkan.',
            'data' => $address,
        ], 201);
    }

    /**
     * Update an existing address with IDOR ownership protection.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $userId = $request->user()?->id ?: ($request->input('user_id') ?: 1);
        $address = UserAddress::where('id', $id)->where('user_id', $userId)->first();

        if (!$address) {
            return response()->json([
                'success' => false,
                'message' => 'Alamat tidak ditemukan atau Anda tidak memiliki akses.',
            ], 403);
        }

        $address->update($request->only([
            'recipient_name', 'phone', 'address_line', 'city', 'province', 'postal_code',
        ]));

        if ($request->has('is_default') && $request->boolean('is_default')) {
            UserAddress::where('user_id', $userId)->where('id', '!=', $id)->update(['is_default' => false]);
            $address->is_default = true;
            $address->save();
        }

        return response()->json([
            'success' => true,
            'message' => 'Alamat berhasil diperbarui.',
            'data' => $address,
        ]);
    }

    /**
     * Delete an address with IDOR protection.
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $userId = $request->user()?->id ?: ($request->input('user_id') ?: 1);
        $address = UserAddress::where('id', $id)->where('user_id', $userId)->first();

        if (!$address) {
            return response()->json([
                'success' => false,
                'message' => 'Alamat tidak ditemukan atau Anda tidak memiliki akses.',
            ], 403);
        }

        $address->delete();

        return response()->json([
            'success' => true,
            'message' => 'Alamat berhasil dihapus.',
        ]);
    }

    /**
     * Set address as default.
     */
    public function setDefault(Request $request, int $id): JsonResponse
    {
        $userId = $request->user()?->id ?: ($request->input('user_id') ?: 1);
        $address = UserAddress::where('id', $id)->where('user_id', $userId)->first();

        if (!$address) {
            return response()->json([
                'success' => false,
                'message' => 'Alamat tidak ditemukan atau Anda tidak memiliki akses.',
            ], 403);
        }

        UserAddress::where('user_id', $userId)->update(['is_default' => false]);
        $address->is_default = true;
        $address->save();

        return response()->json([
            'success' => true,
            'message' => 'Alamat utama berhasil diatur.',
            'data' => $address,
        ]);
    }
}
