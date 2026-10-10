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
            // SSL OPTIONS — Automatic SSL/TLS for AWS RDS with --require_secure_transport=ON
            // ---------------------------------------------------------------
            'options' => extension_loaded('pdo_mysql') ? (function () {
                $options = [
                    PDO::ATTR_TIMEOUT => (int) env('DB_TIMEOUT', 5),
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                ];

                $ca = env('MYSQL_ATTR_SSL_CA');
                if (!$ca) {
                    if (file_exists('/etc/ssl/certs/rds-combined-ca-bundle.pem')) {
                        $ca = '/etc/ssl/certs/rds-combined-ca-bundle.pem';
                    } elseif (file_exists('/etc/ssl/certs/ca-certificates.crt')) {
                        $ca = '/etc/ssl/certs/ca-certificates.crt';
                    }
                }

                if ($ca) {
                    $options[PDO::MYSQL_ATTR_SSL_CA] = $ca;
                    if (env('DB_SSL_VERIFY_CERT', true)) {
                        $options[PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT] = true;
                    }
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
                    PDO::ATTR_TIMEOUT => (int) env('DB_TIMEOUT', 5),
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                ];

                $ca = env('MYSQL_ATTR_SSL_CA');
                if (!$ca) {
                    if (file_exists('/etc/ssl/certs/rds-combined-ca-bundle.pem')) {
                        $ca = '/etc/ssl/certs/rds-combined-ca-bundle.pem';
                    } elseif (file_exists('/etc/ssl/certs/ca-certificates.crt')) {
                        $ca = '/etc/ssl/certs/ca-certificates.crt';
                    }
                }

                if ($ca) {
                    $options[PDO::MYSQL_ATTR_SSL_CA] = $ca;
                    if (env('DB_SSL_VERIFY_CERT', true)) {
                        $options[PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT] = true;
                    }
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
