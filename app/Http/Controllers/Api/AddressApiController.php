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
        $user = $request->user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        $addresses = UserAddress::where('user_id', $user->id)
            ->orderBy('is_default', 'desc')
            ->orderBy('id', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data'    => $addresses,
        ]);
    }

    /**
     * Store a new address for authenticated user.
     */
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        if ($request->has('user_id') && (int) $request->input('user_id') !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak diizinkan mengubah kepemilikan alamat.',
            ], 403);
        }

        $request->validate([
            'recipient_name' => 'required|string|max:100',
            'phone'          => 'required|string|max:30',
            'address_line'   => 'required|string|max:500',
            'city'           => 'required|string|max:100',
            'province'       => 'nullable|string|max:100',
            'postal_code'    => 'required|string|max:20',
            'is_default'     => 'nullable|boolean',
        ]);

        $isDefault = $request->boolean('is_default', false);
        if ($isDefault || UserAddress::where('user_id', $user->id)->count() === 0) {
            UserAddress::where('user_id', $user->id)->update(['is_default' => false]);
            $isDefault = true;
        }

        $address = UserAddress::create([
            'user_id'        => $user->id,
            'recipient_name' => trim($request->input('recipient_name')),
            'phone'          => trim($request->input('phone')),
            'address_line'   => trim($request->input('address_line')),
            'city'           => trim($request->input('city')),
            'province'       => trim($request->input('province', 'DKI Jakarta')),
            'postal_code'    => trim($request->input('postal_code')),
            'is_default'     => $isDefault,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Alamat pengiriman berhasil ditambahkan.',
            'data'    => $address,
        ], 201);
    }

    /**
     * Update an existing address with strict IDOR ownership protection.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        $address = UserAddress::find($id);
        if (!$address) {
            return response()->json([
                'success' => false,
                'message' => 'Alamat tidak ditemukan.',
            ], 404);
        }

        if ($address->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki hak akses ke alamat ini.',
            ], 403);
        }

        if ($request->has('user_id') && (int) $request->input('user_id') !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak diizinkan mengubah kepemilikan alamat.',
            ], 403);
        }

        $request->validate([
            'recipient_name' => 'nullable|string|max:100',
            'phone'          => 'nullable|string|max:30',
            'address_line'   => 'nullable|string|max:500',
            'city'           => 'nullable|string|max:100',
            'province'       => 'nullable|string|max:100',
            'postal_code'    => 'nullable|string|max:20',
            'is_default'     => 'nullable|boolean',
        ]);

        $address->update($request->only([
            'recipient_name', 'phone', 'address_line', 'city', 'province', 'postal_code',
        ]));

        if ($request->has('is_default') && $request->boolean('is_default')) {
            UserAddress::where('user_id', $user->id)->where('id', '!=', $id)->update(['is_default' => false]);
            $address->is_default = true;
            $address->save();
        }

        return response()->json([
            'success' => true,
            'message' => 'Alamat berhasil diperbarui.',
            'data'    => $address,
        ]);
    }

    /**
     * Delete an address with strict IDOR protection.
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        $address = UserAddress::find($id);
        if (!$address) {
            return response()->json([
                'success' => false,
                'message' => 'Alamat tidak ditemukan.',
            ], 404);
        }

        if ($address->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki hak akses ke alamat ini.',
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
        $user = $request->user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        $address = UserAddress::find($id);
        if (!$address) {
            return response()->json([
                'success' => false,
                'message' => 'Alamat tidak ditemukan.',
            ], 404);
        }

        if ($address->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki hak akses ke alamat ini.',
            ], 403);
        }

        UserAddress::where('user_id', $user->id)->update(['is_default' => false]);
        $address->is_default = true;
        $address->save();

        return response()->json([
            'success' => true,
            'message' => 'Alamat utama berhasil diatur.',
            'data'    => $address,
        ]);
    }
}
