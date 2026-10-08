<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Services\PricingService;

class PricingServiceTest extends TestCase
{
    public function test_pricing_service_initialization()
    {
        $service = new PricingService();
        $this->assertInstanceOf(PricingService::class, $service);
    }
}
