<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserRole
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @param  string  ...$roles
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user()?->fresh() ?? $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated.',
            ], 401);
        }

        if ($user->status === 'suspended') {
            return response()->json([
                'success' => false,
                'message' => 'Akun Anda sedang ditangguhkan. Silakan hubungi dukungan PASARIA.',
            ], 403);
        }

        // If no specific roles requested, just ensure user is authenticated
        if (empty($roles)) {
            return $next($request);
        }

        // Check if user has any of the accepted roles
        $userRole = strtolower($user->role ?? 'customer');
        $allowedRoles = array_map('strtolower', $roles);

        // Flatten any comma-separated values (e.g. "seller,admin")
        $flattenedRoles = [];
        foreach ($allowedRoles as $r) {
            foreach (explode(',', $r) as $subRole) {
                $flattenedRoles[] = trim($subRole);
            }
        }

        if (!in_array($userRole, $flattenedRoles, true)) {
            return response()->json([
                'success' => false,
                'message' => 'Akses ditolak. Peran Anda tidak memiliki izin untuk mengakses resource ini.',
            ], 403);
        }

        return $next($request);
    }
}
