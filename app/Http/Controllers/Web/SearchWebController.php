<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class SearchWebController extends Controller
{
    public function index(Request $request)
    {
        $query = $request->input('q', '');
        $category = $request->input('category', '');

        return view('pages.search', [
            'page' => 'search',
            'query' => $query,
            'pageProps' => [
                'q' => $query,
                'category' => $category,
            ],
        ]);
    }
}

