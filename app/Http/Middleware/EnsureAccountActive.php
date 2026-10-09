<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureAccountActive
{
    /**
     * Handle an incoming request.
     * Enforces that the authenticated user is not suspended, banned, or disabled.
     * If the account is deactivated, any active token is immediately revoked.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user()?->fresh() ?? $request->user();

        if ($user) {
            $status = strtolower($user->status ?? 'active');

            if (in_array($status, ['suspended', 'banned', 'disabled'], true)) {
                // Immediately revoke all tokens for this deactivated account
                $user->tokens()->delete();

                return response()->json([
                    'success' => false,
                    'message' => 'Akun Anda sedang ditangguhkan atau dinonaktifkan. Silakan hubungi dukungan PASARIA.',
                ], 403);
            }
        }

        return $next($request);
    }
}
