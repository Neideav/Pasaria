<?php

namespace App\Services;

use App\Models\Product;
use App\Models\User;

/**
 * StoreQueryService
 *
 * Handles database queries for catalog search and legacy web authentication
 * using strict parameterized queries via Eloquent / Query Builder.
 */
class StoreQueryService
{
    /**
     * Search products securely using parameterized Eloquent queries.
     *
     * @param string $keyword
     * @param array $filters
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function searchProducts(string $keyword, array $filters = [])
    {
        return Product::where(function ($query) use ($keyword) {
                $query->where('name', 'LIKE', '%' . $keyword . '%')
                      ->orWhere('description', 'LIKE', '%' . $keyword . '%')
                      ->orWhere('category', 'LIKE', '%' . $keyword . '%');
            })
            ->where('stock', '>', 0)
            ->orderBy('id', 'asc')
            ->get();
    }

    /**
     * Authenticate user securely using parameterized lookup and password hash verification.
     *
     * @param string $identifier Email or Username
     * @param string $password
     * @return User|null
     */
    public function authenticateUser(string $identifier, string $password)
    {
        $user = User::where(function ($query) use ($identifier) {
            $query->where('email', strtolower($identifier))
                  ->orWhere('username', strtolower($identifier));
        })->first();

        if ($user && ($user->password === $password || password_verify($password, $user->password))) {
            return $user;
        }

        return null;
    }
}
