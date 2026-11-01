<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class DeliveryWebController extends Controller
{
    public function index(Request $request, ?string $code = null)
    {
        return view('pages.delivery', [
            'page' => 'delivery',
            'pageProps' => [
                'code' => $code ?? $request->input('code', ''),
            ],
        ]);
    }
}

