<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Product;
use App\Models\Category;

class HomeController extends Controller
{
    public function index(Request $request)
    {
        $categories = Category::all();
        $products = Product::where('stock', '>', 0)
            ->orderBy('id', 'asc')
            ->paginate(8);

        $weeklyProducts = Product::where('stock', '>', 0)
            ->skip(12)
            ->take(4)
            ->get();

        return view('home', compact('categories', 'products', 'weeklyProducts'));
    }

    public function category($slug)
    {
        $category = Category::where('slug', $slug)->first();
        $categoryName = $category ? $category->name : ucfirst($slug);

        $products = Product::where('category', 'LIKE', '%' . $categoryName . '%')
            ->where('stock', '>', 0)
            ->paginate(8);

        return view('categories.show', [
            'category' => (object) ['name' => $categoryName, 'slug' => $slug],
            'products' => $products
        ]);
    }
}
