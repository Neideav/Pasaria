<?php

return [

    /*
    |--------------------------------------------------------------------------
    | PASARIA Marketplace Core System Configuration
    |--------------------------------------------------------------------------
    |
    | Defines production security boundaries and operational flags.
    |
    */

    'demo_sqli_mode' => env('APP_ENV') === 'production'
        ? false
        : filter_var(env('DEMO_SQLI_MODE', false), FILTER_VALIDATE_BOOLEAN),

    'tax_rate' => 0.11, // PPN 11%

    'shipping_rate_per_shop' => 15000.00,

];
