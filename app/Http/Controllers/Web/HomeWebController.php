<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class HomeWebController extends Controller
{
    public function index(Request $request)
    {
        return view('pages.home', [
            'page' => 'home',
            'pageProps' => [
                'initialQuery' => $request->input('q', ''),
                'initialCategory' => $request->input('category', 'all'),
            ],
        ]);
    }
}

