@extends('layouts.app')

@section('title', 'Shopping Cart - Shopcart')

@section('content')
<div class="max-w-7xl mx-auto px-4 sm:px-8 py-8 text-left">
    <div class="flex justify-between items-center mb-8">
        <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Shopping Cart</h1>
        <a href="{{ route('home') }}" class="text-xs font-semibold text-[#003d29] hover:underline">← Continue Shopping</a>
    </div>

    @if(count($cart) > 0)
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div class="lg:col-span-8 space-y-4">
                @foreach($cart as $key => $item)
                    <div class="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 shadow-2xs">
                        <div class="flex items-center gap-4">
                            <div class="w-16 h-16 rounded-xl bg-[#f8f9fa] flex items-center justify-center text-2xl">
                                🎧
                            </div>
                            <div>
                                <h3 class="font-bold text-slate-900">{{ $item['name'] }}</h3>
                                <div class="text-xs text-slate-400">Qty: {{ $item['quantity'] }}</div>
                                <div class="text-sm font-bold text-slate-900 mt-1">${{ number_format($item['price'], 2) }}</div>
                            </div>
                        </div>

                        <form action="{{ route('cart.remove') }}" method="POST">
                            @csrf
                            <input type="hidden" name="key" value="{{ $key }}">
                            <button type="submit" class="text-xs text-red-500 hover:underline">Remove</button>
                        </form>
                    </div>
                @endforeach
            </div>

            <div class="lg:col-span-4 bg-white rounded-3xl p-6 border border-slate-100 shadow-2xs space-y-4">
                <h3 class="font-bold text-slate-900 pb-3 border-b border-slate-100">Order Summary</h3>
                <div class="space-y-2 text-xs">
                    <div class="flex justify-between text-slate-600">
                        <span>Subtotal</span>
                        <span class="font-semibold text-slate-900">${{ number_format($subtotal, 2) }}</span>
                    </div>
                    <div class="flex justify-between text-slate-600">
                        <span>Tax (10%)</span>
                        <span class="font-semibold text-slate-900">${{ number_format($tax, 2) }}</span>
                    </div>
                    <div class="flex justify-between text-slate-600">
                        <span>Shipping</span>
                        <span class="font-semibold text-emerald-600">Free</span>
                    </div>
                    <div class="border-t border-slate-100 pt-3 flex justify-between font-bold text-sm text-slate-900">
                        <span>Total</span>
                        <span class="text-xl font-extrabold text-[#003d29]">${{ number_format($total, 2) }}</span>
                    </div>
                </div>

                <a href="{{ route('checkout') }}" class="block text-center w-full py-3.5 rounded-full font-bold text-sm text-white bg-[#003d29] hover:bg-[#064e3b] shadow-md">
                    Proceed to Checkout
                </a>
            </div>
        </div>
    @else
        <div class="py-20 text-center bg-white rounded-3xl border border-slate-100 p-8">
            <h3 class="text-lg font-bold text-slate-800 mb-1">Your cart is empty</h3>
            <p class="text-xs text-slate-500 mb-6">Looks like you haven't added anything to your cart yet.</p>
            <a href="{{ route('home') }}" class="px-6 py-2.5 rounded-full text-xs font-bold text-white bg-[#003d29] hover:bg-[#064e3b]">
                Start Shopping
            </a>
        </div>
    @endif
</div>
@endsection
