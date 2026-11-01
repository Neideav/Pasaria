<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Shop;
use Illuminate\Http\Request;

class ShopWebController extends Controller
{
    public function show(string $slugOrId)
    {
        $shop = is_numeric($slugOrId)
            ? Shop::find((int) $slugOrId)
            : Shop::where('slug', $slugOrId)->first();

        return view('pages.shop-profile', [
            'page' => 'shop_profile',
            'shopName' => $shop ? $shop->name : 'Profil Toko',
            'pageProps' => [
                'shopIdOrSlug' => $slugOrId,
                'initialShop' => $shop,
            ],
        ]);
    }
}

