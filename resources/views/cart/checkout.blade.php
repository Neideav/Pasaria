@extends('layouts.app')

@section('title', 'Checkout - Shopcart')

@section('content')
<div class="max-w-7xl mx-auto px-4 sm:px-8 py-8 text-left">
    <!-- Breadcrumb -->
    <div class="flex items-center gap-2 text-xs text-slate-400 mb-6">
        <a href="{{ route('home') }}" class="hover:text-emerald-700">Home</a>
        <span>/</span>
        <a href="{{ route('cart.index') }}" class="hover:text-emerald-700">Cart</a>
        <span>/</span>
        <span class="text-slate-800 font-bold">Checkout</span>
    </div>

    <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-8">Review & Checkout</h1>

    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <!-- Checkout Form -->
        <div class="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm">
            <h2 class="text-lg font-bold text-slate-900 mb-4">Shipping Information</h2>

            <form action="{{ route('checkout.store') }}" method="POST" class="space-y-4">
                @csrf
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-xs font-semibold text-slate-700 mb-1">First Name</label>
                        <input type="text" name="first_name" required value="{{ auth()->check() ? explode(' ', auth()->user()->name)[0] : 'Wade' }}" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#003d29]">
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-slate-700 mb-1">Last Name</label>
                        <input type="text" name="last_name" required value="{{ auth()->check() && count(explode(' ', auth()->user()->name)) > 1 ? explode(' ', auth()->user()->name)[1] : 'Warren' }}" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#003d29]">
                    </div>
                </div>

                <div>
                    <label class="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                    <input type="email" name="email" required value="{{ auth()->user()->email ?? 'customer@shopcart.com' }}" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#003d29]">
                </div>

                <div>
                    <label class="block text-xs font-semibold text-slate-700 mb-1">Street Address</label>
                    <input type="text" name="address" required value="{{ auth()->user()->address ?? '4140 Parker Rd.' }}" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#003d29]">
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-xs font-semibold text-slate-700 mb-1">City</label>
                        <input type="text" name="city" required value="{{ auth()->user()->city ?? 'Allentown' }}" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#003d29]">
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-slate-700 mb-1">ZIP / Postal Code</label>
                        <input type="text" name="zip" required value="{{ auth()->user()->zip ?? '31134' }}" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#003d29]">
                    </div>
                </div>

                <div class="pt-4 border-t border-slate-100">
                    <h3 class="text-sm font-bold text-slate-900 mb-3">Payment Method</h3>
                    <div class="space-y-2">
                        <label class="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50/50 cursor-pointer">
                            <input type="radio" name="payment_method" value="Credit or Debit Card" checked class="text-[#003d29] focus:ring-[#003d29]">
                            <span class="text-xs font-semibold text-slate-800">Credit / Debit Card (Demo Simulated)</span>
                        </label>
                        <label class="flex items-center gap-3 p-3 rounded-xl border border-slate-200 cursor-pointer">
                            <input type="radio" name="payment_method" value="Cash on Delivery" class="text-[#003d29] focus:ring-[#003d29]">
                            <span class="text-xs font-semibold text-slate-800">Cash on Delivery</span>
                        </label>
                    </div>
                </div>

                <button type="submit" class="w-full py-3.5 rounded-full font-bold text-sm text-white bg-[#003d29] hover:bg-[#064e3b] shadow-md transition mt-6">
                    Place Order (${{ number_format($total, 2) }})
                </button>
            </form>
        </div>

        <!-- Order Summary -->
        <div class="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-6">
            <h2 class="text-lg font-bold text-slate-900">Order Summary</h2>

            <div class="divide-y divide-slate-100 max-h-72 overflow-y-auto pr-1">
                @foreach($cart as $item)
                    <div class="py-3 flex items-center justify-between gap-3 text-xs">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-lg">🎧</div>
                            <div>
                                <div class="font-semibold text-slate-800 line-clamp-1">{{ $item['name'] }}</div>
                                <div class="text-slate-400">Qty: {{ $item['quantity'] }}</div>
                            </div>
                        </div>
                        <span class="font-bold text-slate-900 tabular-nums">${{ number_format($item['price'] * $item['quantity'], 2) }}</span>
                    </div>
                @endforeach
            </div>

            <div class="space-y-2 border-t border-slate-100 pt-4 text-xs text-slate-600">
                <div class="flex justify-between">
                    <span>Subtotal</span>
                    <span class="font-semibold text-slate-900">${{ number_format($subtotal, 2) }}</span>
                </div>
                <div class="flex justify-between">
                    <span>Tax (10%)</span>
                    <span class="font-semibold text-slate-900">${{ number_format($tax, 2) }}</span>
                </div>
                @if(isset($discount) && $discount > 0)
                    <div class="flex justify-between text-emerald-600">
                        <span>Promotional Discount</span>
                        <span class="font-semibold">-${{ number_format($discount, 2) }}</span>
                    </div>
                @endif
                <div class="flex justify-between">
                    <span>Delivery</span>
                    <span class="text-emerald-600 font-semibold">Free</span>
                </div>
                <div class="flex justify-between border-t border-slate-100 pt-3 text-sm font-extrabold text-slate-900">
                    <span>Total</span>
                    <span class="text-[#003d29]">${{ number_format($total, 2) }}</span>
                </div>
            </div>
        </div>
    </div>
</div>
@endsection
