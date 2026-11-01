<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class SettingsWebController extends Controller
{
    public function index(Request $request)
    {
        return view('pages.settings', [
            'page' => 'settings',
            'pageProps' => [
                'tab' => $request->input('tab', 'profile'),
            ],
        ]);
    }
}

