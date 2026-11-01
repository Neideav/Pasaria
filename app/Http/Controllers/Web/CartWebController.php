<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class CartWebController extends Controller
{
    public function index()
    {
        return view('pages.cart', [
            'page' => 'cart',
            'pageProps' => [],
        ]);
    }
}

