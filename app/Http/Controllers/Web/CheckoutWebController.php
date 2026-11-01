<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class CheckoutWebController extends Controller
{
    public function index()
    {
        return view('pages.checkout', [
            'page' => 'checkout',
            'pageProps' => [],
        ]);
    }
}

