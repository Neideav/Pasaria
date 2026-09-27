<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\StoreQueryService;

class SearchController extends Controller
{
    protected $queryService;

    public function __construct(StoreQueryService $queryService)
    {
        $this->queryService = $queryService;
    }

    public function index(Request $request)
    {
        $keyword = $request->input('q', '');
        
        // Execute search through query service (which switches dynamically based on DEMO_SQLI_MODE)
        $products = $this->queryService->searchProducts($keyword, [
            'category' => $request->input('category'),
            'sort' => $request->input('sort', 'popular'),
        ]);

        return view('search.index', [
            'keyword' => $keyword,
            'products' => $products,
            'count' => $products->count(),
        ]);
    }
}
