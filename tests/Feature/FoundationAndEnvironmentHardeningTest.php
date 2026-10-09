<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Log;
use App\Logging\SanitizeSensitiveLogDataProcessor;
use Monolog\LogRecord;
use Monolog\Level;

class FoundationAndEnvironmentHardeningTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test health check endpoint is operational.
     */
    public function test_health_check_endpoint_returns_ok(): void
    {
        $response = $this->get('/up');
        $response->assertStatus(200);
    }

    /**
     * Test that production environment strictly disables demonstration SQLi mode.
     */
    public function test_demo_mode_is_strictly_disabled_in_production(): void
    {
        $this->app->detectEnvironment(fn () => 'production');
        Config::set('app.env', 'production');
        Config::set('shopcart.demo_sqli_mode', false);
        Config::set('pasaria.demo_sqli_mode', false);

        // Verification of config values
        $this->assertFalse(config('shopcart.demo_sqli_mode'));
        $this->assertFalse(config('pasaria.demo_sqli_mode'));

        // Toggle demo mode endpoint must strictly reject in non-local environments
        $response = $this->postJson('/api/config/demo-mode', ['enabled' => true]);
        $response->assertStatus(403);
        $this->assertFalse($response->json('success'));
        $this->assertFalse($response->json('demo_sqli_mode'));

        \Illuminate\Support\Facades\Cache::forget('demo_sqli_mode');
    }

    /**
     * Test that sensitive details (SQL, trace) are masked in production mode.
     */
    public function test_exception_handler_masks_internal_details_in_production(): void
    {
        Config::set('app.debug', false);

        // Request a deliberate 404 or missing route via JSON
        $response = $this->getJson('/api/non-existent-endpoint-for-testing');
        $response->assertStatus(404);
        $this->assertStringNotContainsString('stack trace', strtolower($response->getContent()));
        $this->assertStringNotContainsString('vendor/', $response->getContent());
    }

    /**
     * Test log processor redacts sensitive keys from context and extra.
     */
    public function test_log_processor_redacts_sensitive_keys(): void
    {
        $processor = new SanitizeSensitiveLogDataProcessor();

        $sensitiveData = [
            'username' => 'budisantoso',
            'password' => 'secret123456',
            'token' => '1|abcdef1234567890',
            'bearer_token' => 'secret_bearer',
            'nested' => [
                'api_key' => 'live_secret_key_999',
                'card_number' => '4111111111111111',
                'safe_field' => 'hello world',
            ],
        ];

        $sanitized = $processor->sanitize($sensitiveData);

        $this->assertEquals('budisantoso', $sanitized['username']);
        $this->assertEquals('[REDACTED]', $sanitized['password']);
        $this->assertEquals('[REDACTED]', $sanitized['token']);
        $this->assertEquals('[REDACTED]', $sanitized['bearer_token']);
        $this->assertEquals('[REDACTED]', $sanitized['nested']['api_key']);
        $this->assertEquals('[REDACTED]', $sanitized['nested']['card_number']);
        $this->assertEquals('hello world', $sanitized['nested']['safe_field']);
    }

    /**
     * Test CORS configuration exposes expected security headers.
     */
    public function test_cors_configuration_exposes_idempotency_headers(): void
    {
        $exposedHeaders = config('cors.exposed_headers');
        $this->assertIsArray($exposedHeaders);
        $this->assertContains('X-Idempotency-Key', $exposedHeaders);
    }
}
