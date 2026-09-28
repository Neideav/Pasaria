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
     *
     * @return JsonResponse
     */
    public function getDemoMode(): JsonResponse
    {
        $demoSqliMode = (bool) Cache::get('demo_sqli_mode', config('shopcart.demo_sqli_mode', env('DEMO_SQLI_MODE', true)));

        return response()->json([
            'demo_sqli_mode' => $demoSqliMode,
            'description' => $demoSqliMode
                ? 'MODE A: Intentionally vulnerable raw queries for local education demonstration'
                : 'MODE B: Secure parameterized implementation',
        ]);
    }

    /**
     * Toggle demo mode setting dynamically.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function toggleDemoMode(Request $request): JsonResponse
    {
        $enabled = filter_var($request->input('enabled'), FILTER_VALIDATE_BOOLEAN);
        Cache::put('demo_sqli_mode', $enabled, now()->addDays(30));

        return response()->json([
            'success' => true,
            'demo_sqli_mode' => $enabled,
            'description' => $enabled
                ? 'Switched to MODE A: Intentionally vulnerable raw SQL queries'
                : 'Switched to MODE B: Secure parameterized queries',
        ]);
    }
}
