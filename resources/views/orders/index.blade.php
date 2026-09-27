@extends('layouts.app')

@section('title', 'My Orders - Shopcart')

@section('content')
<div class="max-w-5xl mx-auto px-4 sm:px-8 py-8 text-left">
    <div class="flex justify-between items-center mb-8 pb-4 border-b border-slate-100">
        <div>
            <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">My Orders</h1>
            <p class="text-xs text-slate-500 mt-1">Track and view your recent purchases.</p>
        </div>
        <a href="{{ route('home') }}" class="text-xs font-semibold text-[#003d29] hover:underline">Return to Store</a>
    </div>

    @if($orders->count() > 0)
        <div class="space-y-4">
            @foreach($orders as $order)
                <div class="bg-white rounded-2xl p-5 border border-slate-100 shadow-2xs space-y-3">
                    <div class="flex justify-between items-center pb-3 border-b border-slate-100 text-xs">
                        <div>
                            <span class="text-slate-400">Order ID: </span>
                            <span class="font-bold text-slate-900">#{{ $order->order_number }}</span>
                        </div>
                        <div class="text-slate-400">
                            {{ $order->created_at->format('M d, Y') }}
                        </div>
                        <span class="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800">
                            {{ $order->status }}
                        </span>
                    </div>

                    <div class="text-xs text-slate-600">
                        Shipping to: {{ $order->shipping_address }}
                    </div>

                    <div class="flex justify-between items-center pt-3 border-t border-slate-100 text-xs">
                        <span class="text-slate-500">Payment: {{ $order->payment_method }}</span>
                        <span class="text-sm font-bold text-slate-900">Total: <span class="text-[#003d29]">${{ number_format($order->total, 2) }}</span></span>
                    </div>
                </div>
            @endforeach
        </div>
    @else
        <div class="py-16 text-center bg-white rounded-3xl border border-slate-100 p-8">
            <h3 class="text-base font-bold text-slate-800 mb-1">No orders found</h3>
            <p class="text-xs text-slate-500 mb-6">You haven't placed any orders yet.</p>
            <a href="{{ route('home') }}" class="px-6 py-2.5 rounded-full text-xs font-bold text-white bg-[#003d29] hover:bg-[#064e3b]">
                Browse Products
            </a>
        </div>
    @endif
</div>
@endsection
