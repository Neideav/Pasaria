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

    'payment' => [
        'default' => env('PAYMENT_PROVIDER', env('APP_ENV') === 'production' ? 'midtrans' : 'sandbox'),
        'currency' => 'IDR',
        'providers' => [
            'sandbox' => [
                'webhook_secret' => env('PAYMENT_SANDBOX_SECRET', 'pasaria-sandbox-webhook-secret-token'),
                'allow_in_production' => false,
            ],
            'midtrans' => [
                'server_key'    => env('MIDTRANS_SERVER_KEY'),
                'client_key'    => env('MIDTRANS_CLIENT_KEY'),
                'merchant_id'   => env('MIDTRANS_MERCHANT_ID'),
                'is_production' => env('MIDTRANS_IS_PRODUCTION', false),
            ],
            'xendit' => [
                'secret_key'    => env('XENDIT_SECRET_KEY'),
                'webhook_token' => env('XENDIT_WEBHOOK_TOKEN'),
            ],
        ],
    ],

];
