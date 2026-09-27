<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Product;

class CartController extends Controller
{
    public function index(Request $request)
    {
        $cart = $request->session()->get('cart', []);
        $subtotal = 0;
        foreach ($cart as $item) {
            $subtotal += $item['price'] * $item['quantity'];
        }
        $tax = $subtotal * 0.1;
        $total = $subtotal + $tax;

        return view('cart.index', compact('cart', 'subtotal', 'tax', 'total'));
    }

    public function add(Request $request)
    {
        $productId = $request->input('product_id');
        $quantity = (int) $request->input('quantity', 1);
        $color = $request->input('color', 'Standard');

        $product = Product::findOrFail($productId);
        $cart = $request->session()->get('cart', []);

        $cartKey = $productId . '_' . $color;

        if (isset($cart[$cartKey])) {
            $cart[$cartKey]['quantity'] += $quantity;
        } else {
            $cart[$cartKey] = [
                'id' => $product->id,
                'name' => $product->name,
                'slug' => $product->slug,
                'price' => $product->price,
                'image' => $product->image,
                'quantity' => $quantity,
                'color' => $color,
            ];
        }

        $request->session()->put('cart', $cart);

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'cartCount' => count($cart),
                'message' => 'Product added to cart',
            ]);
        }

        return redirect()->back()->with('success', 'Added to cart successfully.');
    }

    public function update(Request $request)
    {
        $cartKey = $request->input('key');
        $quantity = (int) $request->input('quantity');

        $cart = $request->session()->get('cart', []);

        if (isset($cart[$cartKey])) {
            if ($quantity <= 0) {
                unset($cart[$cartKey]);
            } else {
                $cart[$cartKey]['quantity'] = $quantity;
            }
            $request->session()->put('cart', $cart);
        }

        return redirect()->route('cart.index');
    }

    public function remove(Request $request)
    {
        $cartKey = $request->input('key');
        $cart = $request->session()->get('cart', []);

        if (isset($cart[$cartKey])) {
            unset($cart[$cartKey]);
            $request->session()->put('cart', $cart);
        }

        return redirect()->route('cart.index');
    }
}
