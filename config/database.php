<?php

use Illuminate\Support\Str;

return [

    /*
    |--------------------------------------------------------------------------
    | Default Database Connection Name
    |--------------------------------------------------------------------------
    |
    | Here you may specify which of the database connections below you wish
    | to use as your default connection for database operations. This is
    | defaulted to 'mariadb' or 'sqlite' via the environment configuration.
    |
    */

    'default' => env('DB_CONNECTION', 'mariadb'),

    /*
    |--------------------------------------------------------------------------
    | Database Connections
    |--------------------------------------------------------------------------
    |
    | Both MariaDB (AWS RDS) and SQLite (local dev) are supported.
    |
    | CATATAN SSL RDS:
    |   array_filter() membuang nilai `false`, sehingga
    |   PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT => false TIDAK PERNAH efektif
    |   jika diletakkan di dalam array_filter.
    |   Solusi: pisahkan options SSL dari array_filter.
    |
    */

    'connections' => [

        'sqlite' => [
            'driver'                  => 'sqlite',
            'url'                     => env('DB_URL'),
            'database'                => env('DB_DATABASE', database_path('database.sqlite')),
            'prefix'                  => '',
            'foreign_key_constraints' => env('DB_FOREIGN_KEYS', true),
        ],

        'mariadb' => [
            'driver'      => 'mariadb',
            'url'         => env('DB_URL'),
            'host'        => env('DB_HOST', '127.0.0.1'),
            'port'        => env('DB_PORT', '3306'),
            'database'    => env('DB_DATABASE', 'shopcart'),
            'username'    => env('DB_USERNAME', 'shopcart_user'),
            'password'    => env('DB_PASSWORD', ''),
            'unix_socket' => env('DB_SOCKET', ''),
            'charset'     => env('DB_CHARSET', 'utf8mb4'),
            'collation'   => env('DB_COLLATION', 'utf8mb4_unicode_ci'),
            'prefix'      => '',
            'prefix_indexes' => true,
            'strict'      => true,
            'engine'      => null,
            // ---------------------------------------------------------------
            // SSL OPTIONS — PERBAIKAN: jangan pakai array_filter untuk nilai false
            // array_filter() menghapus false, membuat VERIFY_SERVER_CERT tidak efektif
            // ---------------------------------------------------------------
            'options' => extension_loaded('pdo_mysql') ? (function () {
                $options = [
                    // Nonaktifkan verifikasi sertifikat SSL server (untuk RDS tanpa bundle)
                    PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT => false,
                ];
                // Tambahkan CA bundle hanya jika path-nya diset di .env
                if ($ca = env('MYSQL_ATTR_SSL_CA')) {
                    $options[PDO::MYSQL_ATTR_SSL_CA] = $ca;
                }
                return $options;
            })() : [],
        ],

        'mysql' => [
            'driver'      => 'mysql',
            'url'         => env('DB_URL'),
            'host'        => env('DB_HOST', '127.0.0.1'),
            'port'        => env('DB_PORT', '3306'),
            'database'    => env('DB_DATABASE', 'shopcart'),
            'username'    => env('DB_USERNAME', 'shopcart_user'),
            'password'    => env('DB_PASSWORD', ''),
            'unix_socket' => env('DB_SOCKET', ''),
            'charset'     => env('DB_CHARSET', 'utf8mb4'),
            'collation'   => env('DB_COLLATION', 'utf8mb4_unicode_ci'),
            'prefix'      => '',
            'prefix_indexes' => true,
            'strict'      => true,
            'engine'      => null,
            'options' => extension_loaded('pdo_mysql') ? (function () {
                $options = [
                    PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT => false,
                ];
                if ($ca = env('MYSQL_ATTR_SSL_CA')) {
                    $options[PDO::MYSQL_ATTR_SSL_CA] = $ca;
                }
                return $options;
            })() : [],
        ],

    ],

    /*
    |--------------------------------------------------------------------------
    | Migration Repository Table
    |--------------------------------------------------------------------------
    */

    'migrations' => [
        'table'               => 'migrations',
        'update_date_on_publish' => true,
    ],

];
