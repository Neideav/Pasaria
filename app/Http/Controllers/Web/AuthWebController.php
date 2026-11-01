<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class AuthWebController extends Controller
{
    public function index(Request $request)
    {
        $tab = $request->input('tab', 'login');
        if (!in_array($tab, ['login', 'register'], true)) {
            $tab = 'login';
        }

        return view('pages.auth', [
            'page' => 'auth',
            'pageProps' => [
                'initialTab' => $tab,
                'message' => $request->input('message', ''),
                'redirect' => $request->input('redirect', '/'),
            ],
        ]);
    }

    public function login(Request $request)
    {
        return view('pages.auth', [
            'page' => 'auth',
            'pageProps' => [
                'initialTab' => 'login',
                'message' => $request->input('message', ''),
                'redirect' => $request->input('redirect', '/'),
            ],
        ]);
    }

    public function register(Request $request)
    {
        return view('pages.auth', [
            'page' => 'auth',
            'pageProps' => [
                'initialTab' => 'register',
                'message' => $request->input('message', ''),
                'redirect' => $request->input('redirect', '/'),
            ],
        ]);
    }
}

