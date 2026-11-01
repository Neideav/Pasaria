<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class ProfileWebController extends Controller
{
    public function index()
    {
        return view('pages.profile', [
            'page' => 'profile',
            'pageProps' => [],
        ]);
    }
}

