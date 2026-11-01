<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;

class ProductWebController extends Controller
{
    public function show(string $slug)
    {
        $product = Product::where('slug', $slug)->first();

        return view('pages.product', [
            'page' => 'product',
            'productName' => $product ? $product->name : 'Detail Produk',
            'pageProps' => [
                'slug' => $slug,
                'initialProduct' => $product,
            ],
        ]);
    }
}

