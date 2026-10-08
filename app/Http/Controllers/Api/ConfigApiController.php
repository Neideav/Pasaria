<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class ConfigApiController extends Controller
{
    /**
     * Get current demo mode setting.
     * Guarded: Disabled in production.
     *
     * @return JsonResponse
     */
    public function getDemoMode(): JsonResponse
    {
        $isLocal = app()->environment('local', 'testing');
        $demoSqliMode = $isLocal && (bool) Cache::get('demo_sqli_mode', config('pasaria.demo_sqli_mode', env('DEMO_SQLI_MODE', false)));

        return response()->json([
            'demo_sqli_mode' => $demoSqliMode,
            'is_production' => !$isLocal,
            'description' => $demoSqliMode
                ? 'MODE A: Local Educational Demo Active (Vulnerable Query Sandbox)'
                : 'MODE B: Secure Parameterized Production Mode',
        ]);
    }

    /**
     * Toggle demo mode setting dynamically.
     * Guarded: Strictly rejected in production.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function toggleDemoMode(Request $request): JsonResponse
    {
        // Enforce production security guard: cannot toggle in non-local environments
        if (!app()->environment('local', 'testing')) {
            return response()->json([
                'success' => false,
                'demo_sqli_mode' => false,
                'message' => 'Demo SQLi toggle is disabled in production environment for security.',
            ], 403);
        }

        $enabled = filter_var($request->input('enabled'), FILTER_VALIDATE_BOOLEAN);
        Cache::put('demo_sqli_mode', $enabled, now()->addDays(30));

        return response()->json([
            'success' => true,
            'demo_sqli_mode' => $enabled,
            'description' => $enabled
                ? 'Beralih ke MODE A: Demo Edukasi Query Rentan (Hanya Lingkungan Lokal)'
                : 'Beralih ke MODE B: Mode Aman Terparameterisasi (Standar PASARIA)',
        ]);
    }
}
