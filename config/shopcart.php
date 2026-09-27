<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Shopcart SQL Injection Educational Demonstration Mode
    |--------------------------------------------------------------------------
    |
    | When set to true, search and authentication queries run raw SQL queries
    | to demonstrate SQL injection risks on local/AWS testing environments.
    | When false, parameterized prepared statements are enforced.
    |
    */

    'demo_sqli_mode' => filter_var(env('DEMO_SQLI_MODE', true), FILTER_VALIDATE_BOOLEAN),

];
