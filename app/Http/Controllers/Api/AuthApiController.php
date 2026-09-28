<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class AuthApiController extends Controller
{
    /**
     * Handle user login with SQLi demo mode support.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function login(Request $request): JsonResponse
    {
        try {
            $username = $request->input('username', '');
            $password = $request->input('password', '');

            if (empty($username)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Please enter your username or email',
                ], 400);
            }

            $demoSqliMode = Cache::get('demo_sqli_mode', config('shopcart.demo_sqli_mode', env('DEMO_SQLI_MODE', true)));
            $user = null;

            if ($demoSqliMode) {
                // =====================================================================
                // INTENTIONALLY VULNERABLE FOR LOCAL EDUCATIONAL DEMONSTRATION
                // Directly concatenating $username and $password into raw SQL
                // =====================================================================
                $rawSql = "SELECT * FROM users WHERE (email = '{$username}' OR username = '{$username}') AND password = '{$password}' LIMIT 1";

                try {
                    $results = DB::select($rawSql);
                    if (!empty($results)) {
                        $user = (array) $results[0];
                    }
                } catch (\Throwable $sqlErr) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Invalid credentials or database query syntax error',
                        'sqli_mode' => true,
                        'sql_error' => $sqlErr->getMessage(),
                    ]);
                }
            } else {
                // =====================================================================
                // SECURE IMPLEMENTATION USING PARAMETERIZED QUERY
                // =====================================================================
                $candidate = User::where('email', $username)
                    ->orWhere('username', $username)
                    ->first();

                if ($candidate && ($candidate->password === $password || password_verify($password, $candidate->password))) {
                    $user = $candidate->toArray();
                }
            }

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid username, email, or password',
                ], 401);
            }

            // Remove sensitive fields
            unset($user['password'], $user['remember_token']);

            return response()->json([
                'success' => true,
                'message' => 'Sign in successful',
                'user' => $user,
                'sqli_mode' => (bool) $demoSqliMode,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Handle user registration.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function register(Request $request): JsonResponse
    {
        try {
            $name = trim($request->input('name', ''));
            $username = trim($request->input('username', ''));
            $email = trim($request->input('email', ''));
            $password = $request->input('password', '');

            if (empty($name) || empty($username) || empty($email) || empty($password)) {
                return response()->json([
                    'success' => false,
                    'message' => 'All fields are required.',
                ], 400);
            }

            // Check existing user
            $exists = User::where('email', $email)
                ->orWhere('username', $username)
                ->exists();

            if ($exists) {
                return response()->json([
                    'success' => false,
                    'message' => 'An account with that email or username already exists.',
                ], 400);
            }

            $newUser = User::create([
                'name' => $name,
                'username' => $username,
                'email' => $email,
                'password' => $password,
                'address' => '',
                'city' => '',
                'zip' => '',
                'phone' => '',
                'role' => 'customer',
            ]);

            $userData = $newUser->toArray();
            unset($userData['password'], $userData['remember_token']);

            return response()->json([
                'success' => true,
                'message' => 'Account registered successfully',
                'user' => $userData,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
