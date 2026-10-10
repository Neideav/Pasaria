<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withProviders([
        \App\Providers\AppServiceProvider::class,
    ])
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // Enforce trusted proxies for container / load balancer setups
        $middleware->trustProxies(at: env('TRUSTED_PROXIES', '*'));

        // Exempt stateless API endpoints from CSRF verification (Sanctum uses Bearer tokens)
        $middleware->validateCsrfTokens(except: [
            'api/*',
        ]);

        // Enable stateful Sanctum frontend SPA integration
        $middleware->statefulApi();

        // Enforce hardened HTTP security headers and CSP
        $middleware->append(\App\Http\Middleware\SecurityHeaders::class);

        $middleware->alias([
            'role' => \App\Http\Middleware\EnsureUserRole::class,
            'account.active' => \App\Http\Middleware\EnsureAccountActive::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        $exceptions->render(function (\Throwable $e, \Illuminate\Http\Request $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                if ($e instanceof \Illuminate\Auth\AuthenticationException) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Unauthenticated.',
                    ], 401);
                }
                if ($e instanceof \Illuminate\Auth\Access\AuthorizationException) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Unauthorized action.',
                    ], 403);
                }
                if ($e instanceof \Illuminate\Validation\ValidationException) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Validasi gagal.',
                        'errors' => $e->errors(),
                    ], 422);
                }
                if ($e instanceof \Illuminate\Http\Exceptions\ThrottleRequestsException) {
                    $headers = $e->getHeaders();
                    $retryAfter = (int) ($headers['Retry-After'] ?? 60);

                    return response()->json([
                        'success' => false,
                        'message' => 'Terlalu banyak permintaan. Silakan tunggu beberapa saat lagi.',
                        'retry_after' => $retryAfter,
                    ], 429, $headers);
                }
                if ($e instanceof \Symfony\Component\HttpKernel\Exception\NotFoundHttpException || $e instanceof \Illuminate\Database\Eloquent\ModelNotFoundException) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Resource tidak ditemukan.',
                    ], 404);
                }
                if (!config('app.debug')) {
                    $status = method_exists($e, 'getStatusCode') ? $e->getStatusCode() : 500;
                    return response()->json([
                        'success' => false,
                        'message' => 'Terjadi kesalahan pada server. Silakan hubungi dukungan PASARIA.',
                    ], ($status >= 400 && $status < 600) ? $status : 500);
                }
            }
        });
    })
    ->booted(function (Application $app) {
        // Production Hardening: Fail safely if critical configuration is missing
        if ($app->environment('production')) {
            $key = config('app.key');
            if (empty($key) || str_starts_with($key, 'base64:yourGenerated')) {
                throw new \RuntimeException('CRITICAL SECURITY: APP_KEY is missing or ungenerated in production environment.');
            }

            // Force strict disabling of debug in production
            if (config('app.debug')) {
                config(['app.debug' => false]);
            }
        }
    })
    ->create();
