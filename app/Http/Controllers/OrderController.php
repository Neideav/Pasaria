<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\Order;
use App\Models\OrderItem;

class OrderController extends Controller
{
    public function index()
    {
        $orders = Order::when(Auth::check(), function ($query) {
                return $query->where('user_id', Auth::id());
            })
            ->orderBy('id', 'desc')
            ->get();

        return view('orders.index', compact('orders'));
    }

    public function checkout(Request $request)
    {
        $cart = $request->session()->get('cart', []);
        if (empty($cart)) {
            return redirect()->route('cart.index')->with('error', 'Your cart is empty.');
        }

        $subtotal = 0;
        foreach ($cart as $item) {
            $subtotal += $item['price'] * $item['quantity'];
        }
        $tax = $subtotal * 0.1;
        $discount = $subtotal * 0.1; // 10% demo promotion
        $total = $subtotal + $tax - $discount;

        return view('cart.checkout', compact('cart', 'subtotal', 'tax', 'discount', 'total'));
    }

    public function store(Request $request)
    {
        $cart = $request->session()->get('cart', []);
        if (empty($cart)) {
            return redirect()->route('cart.index');
        }

        $subtotal = 0;
        foreach ($cart as $item) {
            $subtotal += $item['price'] * $item['quantity'];
        }
        $tax = $subtotal * 0.1;
        $discount = $subtotal * 0.1;
        $total = $subtotal + $tax - $discount;

        $orderNumber = (string) rand(1000000000, 9999999999);

        $order = Order::create([
            'order_number' => $orderNumber,
            'user_id' => Auth::id(),
            'customer_name' => $request->input('first_name') . ' ' . $request->input('last_name'),
            'customer_email' => $request->input('email'),
            'shipping_address' => $request->input('address') . ', ' . $request->input('city') . ' ' . $request->input('zip'),
            'payment_method' => $request->input('payment_method', 'Credit or Debit Card'),
            'subtotal' => $subtotal,
            'tax' => $tax,
            'discount' => $discount,
            'shipping_cost' => 0,
            'total' => $total,
            'status' => 'Processing',
            'items_json' => $cart,
        ]);

        foreach ($cart as $item) {
            OrderItem::create([
                'order_id' => $order->id,
                'product_id' => $item['id'],
                'product_name' => $item['name'],
                'price' => $item['price'],
                'quantity' => $item['quantity'],
                'color' => $item['color'] ?? 'Standard',
                'image' => $item['image'] ?? '',
            ]);
        }

        $request->session()->forget('cart');

        return redirect()->route('orders.index')->with('success', 'Order #' . $orderNumber . ' placed successfully!');
    }
}
