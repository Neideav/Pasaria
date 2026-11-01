<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class SellerWebController extends Controller
{
    public function dashboard()
    {
        return view('pages.seller-dashboard', [
            'page' => 'seller_dashboard',
            'pageProps' => [],
        ]);
    }
}

