<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class OrderWebController extends Controller
{
    public function index()
    {
        return view('pages.orders', [
            'page' => 'orders',
            'pageProps' => [],
        ]);
    }
}

