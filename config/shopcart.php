<?php

return [

    /*
    |--------------------------------------------------------------------------
    | PASARIA / Shopcart Demonstration Mode
    |--------------------------------------------------------------------------
    |
    | Strictly defaults to false. In production environment, this is hard-disabled
    | and can never be toggled on under any circumstance.
    |
    */

    'demo_sqli_mode' => env('APP_ENV') === 'production'
        ? false
        : filter_var(env('DEMO_SQLI_MODE', false), FILTER_VALIDATE_BOOLEAN),

];

