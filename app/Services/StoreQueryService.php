<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use App\Models\Product;
use App\Models\User;

class StoreQueryService
{
    /**
     * Search products with DEMO_SQLI_MODE support.
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
            // // INTENTIONALLY VULNERABLE FOR LOCAL EDUCATIONAL DEMONSTRATION
            // =========================================================================
            // Direct raw string interpolation without parameterized escaping or bindings
            $rawQuery = "SELECT * FROM products WHERE (name LIKE '%" . $keyword . "%' OR description LIKE '%" . $keyword . "%' OR category LIKE '%" . $keyword . "%') AND stock > 0 ORDER BY id ASC";
            
            try {
                $results = DB::select(DB::raw($rawQuery));
                return collect($results)->map(function ($item) {
                    return (object) $item;
                });
            } catch (\Exception $e) {
                // Return empty collection upon SQL syntax error during demonstration injection
                return collect([]);
            }
        } else {
            // =========================================================================
            // // SECURE IMPLEMENTATION USING PARAMETERIZED QUERY
            // =========================================================================
            // Parameterized query via Eloquent / Query Builder with prepared statement bindings
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
            // // INTENTIONALLY VULNERABLE FOR LOCAL EDUCATIONAL DEMONSTRATION
            // =========================================================================
            // String concatenation allows auth bypass (e.g. admin@shopcart.com' --)
            $rawQuery = "SELECT * FROM users WHERE (email = '" . $identifier . "' OR username = '" . $identifier . "') AND password = '" . $password . "' LIMIT 1";

            try {
                $results = DB::select(DB::raw($rawQuery));
                if (!empty($results)) {
                    return User::hydrate([(array) $results[0]])->first();
                }
            } catch (\Exception $e) {
                return null;
            }
            return null;
        } else {
            // =========================================================================
            // // SECURE IMPLEMENTATION USING PARAMETERIZED QUERY
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
