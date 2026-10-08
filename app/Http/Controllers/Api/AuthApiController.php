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
     * Handle user login.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function login(Request $request): JsonResponse
    {
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
            // Educational demo raw query (strictly isolated from production)
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
            // SECURE PRODUCTION IMPLEMENTATION: Parameterized query & Hash::check
            $candidate = User::where('email', $usernameOrEmail)
                ->orWhere('username', $usernameOrEmail)
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

        if ($user->status === 'suspended') {
            return response()->json([
                'success' => false,
                'message' => 'Akun Anda sedang ditangguhkan. Silakan hubungi dukungan PASARIA.',
            ], 403);
        }

        // Generate Sanctum plain text token
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
     * Handle user registration.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function register(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'username' => 'required|string|min:3|max:50|unique:users,username',
            'email' => 'required|email|max:255|unique:users,email',
            'password' => 'required|string|min:6',
        ]);

        $user = User::create([
            'name' => trim($request->input('name')),
            'username' => strtolower(trim($request->input('username'))),
            'email' => strtolower(trim($request->input('email'))),
            'password' => Hash::make($request->input('password')),
            'role' => 'customer',
            'status' => 'active',
            'address' => $request->input('address', ''),
            'city' => $request->input('city', 'Jakarta'),
            'zip' => $request->input('zip', ''),
            'phone' => $request->input('phone', ''),
        ]);

        // Create empty Cart & Wallet for user
        Cart::firstOrCreate(['user_id' => $user->id], ['items_json' => '[]']);
        Wallet::firstOrCreate(['user_id' => $user->id], ['balance' => 0]);

        $token = $user->createToken('pasaria_auth_token')->plainTextToken;

        $userData = $user->toArray();
        unset($userData['password'], $userData['remember_token']);

        return response()->json([
            'success' => true,
            'message' => 'Pendaftaran berhasil. Selamat bergabung di PASARIA!',
            'token' => $token,
            'user' => $userData,
        ], 201);
    }

    /**
     * Get authenticated user.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            // Local dev fallback if user_id query is passed in development mode
            if (app()->environment('local', 'testing') && $request->has('user_id')) {
                $user = User::find($request->input('user_id'));
            }
        }

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated',
            ], 401);
        }

        $userData = $user->load(['shop', 'addresses'])->toArray();
        unset($userData['password'], $userData['remember_token']);

        return response()->json([
            'success' => true,
            'user' => $userData,
        ]);
    }

    /**
     * Handle user logout.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function logout(Request $request): JsonResponse
    {
        if ($request->user()) {
            $request->user()->currentAccessToken()?->delete();
        }

        return response()->json([
            'success' => true,
            'message' => 'Berhasil keluar dari PASARIA.',
        ]);
    }

    /**
     * Update authenticated user profile.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            if (app()->environment('local', 'testing')) {
                $uid = $request->input('user_id') ?: $request->input('id', 1);
                $user = User::find($uid);
            }
        }

        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated'], 401);
        }

        $fillableFields = ['name', 'phone', 'address', 'city', 'zip', 'avatar'];
        foreach ($fillableFields as $field) {
            if ($request->has($field)) {
                $user->{$field} = $request->input($field);
            }
        }

        $user->save();

        $userData = $user->load(['shop', 'addresses'])->toArray();
        unset($userData['password'], $userData['remember_token']);

        return response()->json([
            'success' => true,
            'message' => 'Profil berhasil diperbarui.',
            'user' => $userData,
        ]);
    }

    /**
     * Change user password.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function changePassword(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated'], 401);
        }

        $request->validate([
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:6',
        ]);

        if (!Hash::check($request->input('current_password'), $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Kata sandi lama Anda salah.',
            ], 422);
        }

        $user->password = Hash::make($request->input('new_password'));
        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Kata sandi berhasil diperbarui.',
        ]);
    }
}
