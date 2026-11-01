<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class AdminWebController extends Controller
{
    public function dashboard()
    {
        return view('pages.admin-dashboard', [
            'page' => 'admin_dashboard',
            'pageProps' => [],
        ]);
    }
}

