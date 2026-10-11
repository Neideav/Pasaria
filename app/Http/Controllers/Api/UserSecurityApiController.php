<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\UserTwoFactorAuth;
use App\Services\TotpService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

class UserSecurityApiController extends Controller
{
    /**
     * List active sessions (Sanctum tokens) for the authenticated user.
     */
    public function getSessions(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        $currentTokenId = $user->currentAccessToken()?->id;

        $tokens = $user->tokens()
            ->orderBy('last_used_at', 'desc')
            ->orderBy('id', 'desc')
            ->get()
            ->map(function ($token) use ($currentTokenId) {
                return [
                    'id'           => $token->id,
                    'name'         => $token->name,
                    'is_current'   => $token->id === $currentTokenId,
                    'last_used_at' => $token->last_used_at,
                    'created_at'   => $token->created_at,
                ];
            });

        return response()->json([
            'success' => true,
            'data'    => $tokens,
        ]);
    }

    /**
     * Revoke a specific session token belonging to authenticated user.
     */
    public function revokeSession(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        $token = $user->tokens()->where('id', $id)->first();
        if (!$token) {
            return response()->json([
                'success' => false,
                'message' => 'Sesi tidak ditemukan atau sudah tidak aktif.',
            ], 404);
        }

        $isCurrent = ($token->id === $user->currentAccessToken()?->id);
        $token->delete();

        return response()->json([
            'success'    => true,
            'message'    => 'Sesi berhasil dicabut.',
            'is_current' => $isCurrent,
        ]);
    }

    /**
     * Revoke all other active session tokens except the current one.
     */
    public function revokeOtherSessions(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        $currentTokenId = $user->currentAccessToken()?->id;

        $user->tokens()
            ->where('id', '!=', $currentTokenId)
            ->delete();

        return response()->json([
            'success' => true,
            'message' => 'Semua sesi lain berhasil dicabut.',
        ]);
    }

    /**
     * Request a verified email change.
     * Enforces format, uniqueness, single-use OTP, and TTL.
     */
    public function requestEmailChange(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        $request->validate([
            'new_email' => 'required|email|max:255|unique:users,email',
        ]);

        $newEmail = strtolower(trim((string) $request->input('new_email')));

        if ($newEmail === strtolower($user->email)) {
            return response()->json([
                'success' => false,
                'message' => 'Alamat email baru harus berbeda dari email saat ini.',
            ], 422);
        }

        $code = sprintf('%06d', random_int(100000, 999999));

        Cache::put("email_change_{$user->id}", [
            'new_email' => $newEmail,
            'code'      => $code,
        ], now()->addMinutes(15));

        try {
            Log::info("PASARIA: Email change verification code for user #{$user->id} to {$newEmail}: {$code}");
        } catch (\Throwable $e) {}

        $responsePayload = [
            'success'   => true,
            'message'   => 'Kode verifikasi telah dikirim ke alamat email baru Anda.',
            'new_email' => $newEmail,
        ];

        if (app()->environment('testing', 'local')) {
            $responsePayload['verification_code'] = $code;
        }

        return response()->json($responsePayload, 200);
    }

    /**
     * Verify single-use code and commit the email change.
     */
    public function verifyEmailChange(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        $request->validate([
            'code' => 'required|string',
        ]);

        $code = trim((string) $request->input('code'));
        $cached = Cache::get("email_change_{$user->id}");

        if (!$cached || ($cached['code'] ?? null) !== $code) {
            return response()->json([
                'success' => false,
                'message' => 'Kode verifikasi tidak valid atau telah kedaluwarsa.',
            ], 422);
        }

        // Check if proposed email was taken in the interim
        $exists = User::where('email', $cached['new_email'])
            ->where('id', '!=', $user->id)
            ->exists();

        if ($exists) {
            Cache::forget("email_change_{$user->id}");
            return response()->json([
                'success' => false,
                'message' => 'Alamat email tersebut sudah digunakan oleh akun lain.',
            ], 422);
        }

        $user->email = $cached['new_email'];
        $user->email_verified_at = now();
        $user->save();

        Cache::forget("email_change_{$user->id}");

        $userData = $user->load(['shop', 'addresses'])->toArray();
        unset($userData['password'], $userData['remember_token']);

        return response()->json([
            'success' => true,
            'message' => 'Alamat email berhasil diubah dan diverifikasi.',
            'user'    => $userData,
        ]);
    }

    /**
     * Get two-factor authentication status for authenticated user.
     */
    public function getTwoFactorStatus(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        $twoFactor = UserTwoFactorAuth::where('user_id', $user->id)->first();

        return response()->json([
            'success'      => true,
            'enabled'      => (bool) ($twoFactor?->enabled),
            'confirmed_at' => $twoFactor?->confirmed_at,
        ]);
    }

    /**
     * Initialize two-step verification setup (generate secret and recovery codes).
     */
    public function setupTwoFactor(Request $request, TotpService $totp): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        $secret = $totp->generateSecret(16);
        $recoveryCodes = $totp->generateRecoveryCodes(8);
        $qrUri = $totp->getQrCodeUri($user->email, $secret);

        UserTwoFactorAuth::updateOrCreate(
            ['user_id' => $user->id],
            [
                'enabled'             => false,
                'secret'              => $secret,
                'recovery_codes_json' => $recoveryCodes,
                'confirmed_at'        => null,
            ]
        );

        return response()->json([
            'success'        => true,
            'secret'         => $secret,
            'qr_uri'         => $qrUri,
            'recovery_codes' => $recoveryCodes,
        ]);
    }

    /**
     * Confirm and activate two-step verification using 6-digit TOTP code.
     */
    public function confirmTwoFactor(Request $request, TotpService $totp): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        $request->validate([
            'code' => 'required|string',
        ]);

        $record = UserTwoFactorAuth::where('user_id', $user->id)->first();
        if (!$record || empty($record->secret)) {
            return response()->json([
                'success' => false,
                'message' => 'Silakan mulai pengaturan 2FA terlebih dahulu.',
            ], 400);
        }

        $code = trim((string) $request->input('code'));
        if (!$totp->verify($record->secret, $code)) {
            return response()->json([
                'success' => false,
                'message' => 'Kode verifikasi 2FA tidak valid.',
            ], 422);
        }

        $record->enabled = true;
        $record->confirmed_at = now();
        $record->save();

        return response()->json([
            'success' => true,
            'message' => 'Autentikasi dua langkah (2FA) berhasil diaktifkan.',
        ]);
    }

    /**
     * Disable two-step verification with password verification.
     */
    public function disableTwoFactor(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        $request->validate([
            'password' => 'required|string',
        ]);

        if (!Hash::check($request->input('password'), $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Kata sandi saat ini salah.',
            ], 422);
        }

        UserTwoFactorAuth::where('user_id', $user->id)->delete();

        return response()->json([
            'success' => true,
            'message' => 'Autentikasi dua langkah telah dinonaktifkan.',
        ]);
    }
}
