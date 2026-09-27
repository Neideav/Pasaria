<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use App\Models\Product;
use App\Models\User;

/**
 * StoreQueryService
 *
 * Handles all database queries for the Shopcart application.
 * Supports two modes controlled by the DEMO_SQLI_MODE environment variable:
 *
 *   DEMO_SQLI_MODE=true  → Raw SQL string concatenation (intentionally vulnerable)
 *   DEMO_SQLI_MODE=false → Parameterized queries via Eloquent/Query Builder (secure)
 *
 * The frontend is identical in both modes.
 * This service exists for LOCAL EDUCATIONAL DEMONSTRATION ONLY.
 */
class StoreQueryService
{
    /**
     * Search products with DEMO_SQLI_MODE support.
     *
     * products table column count used in the vulnerable query (for UNION compatibility):
     *   id, name, slug, category, price, original_price, monthly_price,
     *   short_desc, description, image, rating, review_count, stock,
     *   colors, specs, created_at, updated_at
     *   → Total: 17 columns
     *
     * UNION payloads must match exactly 17 columns.
     *
     * Example UNION payload for demo_records extraction:
     *   headphone') UNION SELECT id, record_name, record_name, 'Demo Data', 0, 0, 0, record_value, record_value, 'headphone', 5, 0, 1, '[]', '{}', created_at, updated_at FROM demo_records -- 
     *
     * Example UNION payload for users extraction:
     *   headphone') UNION SELECT id, name, username, 'User Account', 0, 0, 0, email, role, 'headphone', 5, 0, 1, '[]', '{}', created_at, updated_at FROM users -- 
     *
     * @param string $keyword
     * @param array $filters
     * @return \Illuminate\Support\Collection
     */
    public function searchProducts(string $keyword, array $filters = [])
    {
        $isVulnerable = config('shopcart.demo_sqli_mode', env('DEMO_SQLI_MODE', true));

        if ($isVulnerable) {
            // =========================================================================
            // INTENTIONALLY VULNERABLE FOR LOCAL EDUCATIONAL DEMONSTRATION
            // =========================================================================
            // Direct raw string interpolation — user input flows directly into the SQL query
            // without sanitization, escaping, or parameter binding.
            //
            // This allows UNION-based data extraction. The SELECT list targets all 17
            // columns of the products table so that a UNION subquery can append rows
            // from any other table in the demo database (demo_records, users, categories,
            // orders) as long as the injected SELECT also returns 17 columns.
            //
            // The LIKE wildcards are intentionally kept open (%keyword%) so that an
            // attacker can close the string early with a quote and inject a UNION clause.
            // =========================================================================
            $rawQuery = "SELECT id, name, slug, category, price, original_price, monthly_price, "
                      . "short_desc, description, image, rating, review_count, stock, "
                      . "colors, specs, created_at, updated_at "
                      . "FROM products "
                      . "WHERE (name LIKE '%" . $keyword . "%' "
                      . "OR description LIKE '%" . $keyword . "%' "
                      . "OR category LIKE '%" . $keyword . "%') "
                      . "AND stock > 0 "
                      . "ORDER BY id ASC";

            try {
                $results = DB::select($rawQuery);
                return collect($results)->map(function ($item) {
                    return (object) (array) $item;
                });
            } catch (\Throwable $e) {
                // Return empty collection upon SQL syntax error during demonstration
                return collect([]);
            }
        } else {
            // =========================================================================
            // SECURE IMPLEMENTATION USING PARAMETERIZED QUERY
            // =========================================================================
            // Eloquent/Query Builder uses PDO prepared statements.
            // The keyword is bound as a data literal — it cannot alter the query structure.
            // UNION injection attempts are treated as literal search strings, not SQL.
            // =========================================================================
            return Product::where(function ($query) use ($keyword) {
                    $query->where('name', 'LIKE', '%' . $keyword . '%')
                          ->orWhere('description', 'LIKE', '%' . $keyword . '%')
                          ->orWhere('category', 'LIKE', '%' . $keyword . '%');
                })
                ->where('stock', '>', 0)
                ->orderBy('id', 'asc')
                ->get();
        }
    }

    /**
     * Authenticate user with DEMO_SQLI_MODE support.
     *
     * @param string $identifier Email or Username
     * @param string $password
     * @return User|null
     */
    public function authenticateUser(string $identifier, string $password)
    {
        $isVulnerable = config('shopcart.demo_sqli_mode', env('DEMO_SQLI_MODE', true));

        if ($isVulnerable) {
            // =========================================================================
            // INTENTIONALLY VULNERABLE FOR LOCAL EDUCATIONAL DEMONSTRATION
            // =========================================================================
            // String concatenation allows auth bypass (e.g. admin@shopcart.com' --)
            $rawQuery = "SELECT * FROM users WHERE (email = '" . $identifier . "' OR username = '" . $identifier . "') AND password = '" . $password . "' LIMIT 1";

            try {
                $results = DB::select($rawQuery);
                if (!empty($results)) {
                    return User::hydrate([(array) $results[0]])->first();
                }
            } catch (\Throwable $e) {
                return null;
            }
            return null;
        } else {
            // =========================================================================
            // SECURE IMPLEMENTATION USING PARAMETERIZED QUERY
            // =========================================================================
            $user = User::where(function ($query) use ($identifier) {
                $query->where('email', $identifier)
                      ->orWhere('username', $identifier);
            })->first();

            if ($user && ($user->password === $password || password_verify($password, $user->password))) {
                return $user;
            }
            return null;
        }
    }
}
