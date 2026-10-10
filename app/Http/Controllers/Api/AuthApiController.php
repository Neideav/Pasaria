<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Cart;
use App\Models\Wallet;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class AuthApiController extends Controller
{
    /**
     * Handle user login with Sanctum Bearer Token.
     */
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'username' => 'nullable|string',
            'email'    => 'nullable|string',
            'password' => 'required|string',
        ]);

        $usernameOrEmail = trim($request->input('username') ?: $request->input('email', ''));
        $password = (string) $request->input('password', '');

        if (empty($usernameOrEmail) || empty($password)) {
            return response()->json([
                'success' => false,
                'message' => 'Silakan masukkan username/email dan kata sandi Anda.',
            ], 422);
        }

        // Isolated Educational Demo Mode (Only active in local dev when explicitly enabled)
        $isLocal = app()->environment('local', 'testing');
        $demoSqliMode = $isLocal && (bool) Cache::get('demo_sqli_mode', config('pasaria.demo_sqli_mode', env('DEMO_SQLI_MODE', false)));

        $user = null;

        if ($demoSqliMode) {
            $rawSql = "SELECT * FROM users WHERE (email = '{$usernameOrEmail}' OR username = '{$usernameOrEmail}') AND password = '{$password}' LIMIT 1";
            try {
                $results = DB::select($rawSql);
                if (!empty($results)) {
                    $found = (array) $results[0];
                    $user = User::find($found['id']);
                }
            } catch (\Throwable $sqlErr) {
                return response()->json([
                    'success' => false,
                    'message' => 'Kesalahan sintaks query database demo.',
                    'sqli_mode' => true,
                    'sql_error' => $sqlErr->getMessage(),
                ], 400);
            }
        } else {
            // SECURE PRODUCTION IMPLEMENTATION: Parameterized lookup & bcrypt check
            $candidate = User::where('email', strtolower($usernameOrEmail))
                ->orWhere('username', strtolower($usernameOrEmail))
                ->first();

            if ($candidate && Hash::check($password, $candidate->password)) {
                $user = $candidate;
            }
        }

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Email/username atau kata sandi tidak cocok.',
            ], 401);
        }

        if ($user->isSuspended()) {
            $user->tokens()->delete();
            return response()->json([
                'success' => false,
                'message' => 'Akun Anda sedang ditangguhkan atau dinonaktifkan. Silakan hubungi dukungan PASARIA.',
            ], 403);
        }

        // Generate Sanctum plain text bearer token
        $token = $user->createToken('pasaria_auth_token')->plainTextToken;

        $userData = $user->load(['shop', 'addresses'])->toArray();
        unset($userData['password'], $userData['remember_token']);

        return response()->json([
            'success' => true,
            'message' => 'Selamat datang di PASARIA!',
            'token' => $token,
            'user' => $userData,
            'sqli_mode' => (bool) $demoSqliMode,
        ]);
    }

    /**
     * Handle user registration with unverified state and verification code generation.
     */
    public function register(Request $request): JsonResponse
    {
        $request->validate([
            'name'     => 'required|string|max:255',
            'username' => 'required|string|min:3|max:50|unique:users,username',
            'email'    => 'required|email|max:255|unique:users,email',
            'password' => 'required|string|min:6',
        ]);

        $name = trim(strip_tags((string) $request->input('name')));
        $username = strtolower(trim((string) $request->input('username')));
        $email = strtolower(trim((string) $request->input('email')));

        $user = User::create([
            'name'              => $name,
            'username'          => $username,
            'email'             => $email,
            'password'          => Hash::make((string) $request->input('password')),
            'role'              => 'customer',
            'status'            => 'active',
            'address'           => trim((string) $request->input('address', '')),
            'city'              => trim((string) $request->input('city', 'Jakarta')),
            'zip'               => trim((string) $request->input('zip', '')),
            'phone'             => trim((string) $request->input('phone', '')),
            'email_verified_at' => null, // Explicitly unverified on registration
        ]);

        // Create empty Cart & Wallet for user
        Cart::firstOrCreate(['user_id' => $user->id], ['items_json' => []]);
        Wallet::firstOrCreate(['user_id' => $user->id], ['balance' => 0.00]);

        // Generate 6-digit numeric verification code with 60-minute expiration
        $verificationCode = sprintf('%06d', random_int(100000, 999999));
        Cache::put("email_verify_code_{$user->id}", $verificationCode, now()->addMinutes(60));
        Cache::put("email_verify_email_{$user->email}", ['code' => $verificationCode, 'user_id' => $user->id], now()->addMinutes(60));

        // Safe notification logging: email service absence will NOT fail registration or auto-verify account
        try {
            \Illuminate\Support\Facades\Log::info("PASARIA: Verification code generated for {$user->email}: {$verificationCode}");
        } catch (\Throwable $logErr) {}

        $token = $user->createToken('pasaria_auth_token')->plainTextToken;

        $userData = $user->toArray();
        unset($userData['password'], $userData['remember_token']);

        $responsePayload = [
            'success' => true,
            'message' => 'Pendaftaran berhasil. Silakan verifikasi alamat email Anda untuk mengakses seluruh fitur.',
            'token'   => $token,
            'user'    => $userData,
        ];

        // In testing or local environment, expose code to enable automated verification without mock mailer
        if (app()->environment('testing', 'local')) {
            $responsePayload['verification_code'] = $verificationCode;
        }

        return response()->json($responsePayload, 201);
    }

    /**
     * Verify email using 6-digit verification code.
     * Enforces one-time usage and TTL validation.
     */
    public function verifyEmail(Request $request): JsonResponse
    {
        $request->validate([
            'code'  => 'required|string',
            'email' => 'nullable|email',
        ]);

        $code = trim((string) $request->input('code'));
        $user = $request->user() ?: auth('sanctum')->user();

        if (!$user && $request->has('email')) {
            $lookupEmail = strtolower(trim((string) $request->input('email')));
            $user = User::where('email', $lookupEmail)->first();
        }

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Pengguna tidak ditemukan atau belum terautentikasi.',
            ], 404);
        }

        if ($user->hasVerifiedEmail()) {
            return response()->json([
                'success' => true,
                'message' => 'Alamat email sudah diverifikasi sebelumnya.',
                'user'    => $user,
            ]);
        }

        $cachedCode = Cache::get("email_verify_code_{$user->id}");

        if (!$cachedCode || $cachedCode !== $code) {
            return response()->json([
                'success' => false,
                'message' => 'Kode verifikasi tidak valid atau telah kedaluwarsa.',
            ], 422);
        }

        // Successfully verified
        $user->email_verified_at = now();
        $user->save();

        // Invalidate cached code immediately to prevent reuse (one-time use)
        Cache::forget("email_verify_code_{$user->id}");
        Cache::forget("email_verify_email_{$user->email}");

        $userData = $user->load(['shop', 'addresses'])->toArray();
        unset($userData['password'], $userData['remember_token']);

        return response()->json([
            'success' => true,
            'message' => 'Alamat email berhasil diverifikasi.',
            'user'    => $userData,
        ]);
    }

    /**
     * Resend verification code (rate-limited via route throttle).
     */
    public function resendVerification(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'nullable|email',
        ]);

        $user = $request->user() ?: auth('sanctum')->user();
        if (!$user && $request->has('email')) {
            $lookupEmail = strtolower(trim((string) $request->input('email')));
            $user = User::where('email', $lookupEmail)->first();
        }

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Pengguna dengan email tersebut tidak ditemukan.',
            ], 404);
        }

        if ($user->hasVerifiedEmail()) {
            return response()->json([
                'success' => false,
                'message' => 'Alamat email sudah diverifikasi.',
            ], 400);
        }

        $verificationCode = sprintf('%06d', random_int(100000, 999999));
        Cache::put("email_verify_code_{$user->id}", $verificationCode, now()->addMinutes(60));
        Cache::put("email_verify_email_{$user->email}", ['code' => $verificationCode, 'user_id' => $user->id], now()->addMinutes(60));

        try {
            \Illuminate\Support\Facades\Log::info("PASARIA: Resent verification code for {$user->email}: {$verificationCode}");
        } catch (\Throwable $logErr) {}

        $responsePayload = [
            'success' => true,
            'message' => 'Kode verifikasi baru telah dikirimkan ke email Anda.',
        ];

        if (app()->environment('testing', 'local')) {
            $responsePayload['verification_code'] = $verificationCode;
        }

        return response()->json($responsePayload, 200);
    }

    /**
     * Get authenticated user profile via Sanctum token.
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated.',
            ], 401);
        }

        $userData = $user->load(['shop', 'addresses'])->toArray();
        unset($userData['password'], $userData['remember_token']);

        return response()->json([
            'success' => true,
            'user'    => $userData,
        ]);
    }

    /**
     * Handle user logout (revoke current Sanctum token).
     */
    public function logout(Request $request): JsonResponse
    {
        $user = $request->user();
        if ($user) {
            $user->currentAccessToken()?->delete();
        }

        return response()->json([
            'success' => true,
            'message' => 'Berhasil keluar dari PASARIA.',
        ]);
    }

    /**
     * Update authenticated user profile.
     */
    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        $forbiddenFields = ['role', 'status', 'balance', 'is_admin', 'email_verified_at', 'id', 'email'];
        foreach ($forbiddenFields as $ff) {
            if ($request->has($ff)) {
                return response()->json([
                    'success' => false,
                    'message' => "Field '{$ff}' tidak dapat diubah melalui endpoint profil.",
                ], 422);
            }
        }

        $request->validate([
            'name'    => 'nullable|string|max:255',
            'phone'   => 'nullable|string|max:50',
            'address' => 'nullable|string|max:500',
            'city'    => 'nullable|string|max:100',
            'zip'     => 'nullable|string|max:20',
            'avatar'  => 'nullable|string|max:500',
        ]);

        $fillableFields = ['name', 'phone', 'address', 'city', 'zip', 'avatar'];
        foreach ($fillableFields as $field) {
            if ($request->has($field)) {
                $user->{$field} = trim($request->input($field));
            }
        }

        $user->save();

        $userData = $user->load(['shop', 'addresses'])->toArray();
        unset($userData['password'], $userData['remember_token']);

        return response()->json([
            'success' => true,
            'message' => 'Profil berhasil diperbarui.',
            'user'    => $userData,
        ]);
    }

    /**
     * Change user password with old password validation and token revocation.
     */
    public function changePassword(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        $request->validate([
            'current_password' => 'required|string',
            'new_password'     => 'required|string|min:6',
        ]);

        if (!Hash::check($request->input('current_password'), $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Kata sandi lama Anda salah.',
            ], 422);
        }

        $user->password = Hash::make($request->input('new_password'));
        $user->save();

        // Security hardening: Revoke existing tokens and issue a fresh one
        $user->tokens()->delete();
        $newToken = $user->createToken('pasaria_auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Kata sandi berhasil diperbarui. Sesi lama telah dicabut.',
            'token'   => $newToken,
        ]);
    }
}
