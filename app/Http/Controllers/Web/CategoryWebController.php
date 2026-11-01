<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;

class CategoryWebController extends Controller
{
    public function show(string $slug)
    {
        $category = Category::where('slug', $slug)->first();
        $categoryName = $category ? $category->name : ucfirst(str_replace('-', ' ', $slug));

        return view('pages.category', [
            'page' => 'category',
            'categoryName' => $categoryName,
            'pageProps' => [
                'slug' => $slug,
                'categoryName' => $categoryName,
            ],
        ]);
    }

    public function deals()
    {
        return view('pages.category', [
            'page' => 'category',
            'categoryName' => 'Promo & Penawaran Terbaik',
            'pageProps' => [
                'slug' => 'deals',
                'preset' => 'deals',
                'categoryName' => 'Promo & Penawaran Terbaik',
            ],
        ]);
    }

    public function whatsNew()
    {
        return view('pages.category', [
            'page' => 'category',
            'categoryName' => 'Produk Terbaru',
            'pageProps' => [
                'slug' => 'whats-new',
                'preset' => 'newest',
                'categoryName' => 'Produk Terbaru',
            ],
        ]);
    }
}

