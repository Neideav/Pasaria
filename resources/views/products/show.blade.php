@extends('layouts.app')

@section('title', $product->name . ' - Shopcart')

@section('content')
<div class="max-w-7xl mx-auto px-4 sm:px-8 py-6 text-left">
    <!-- Breadcrumb -->
    <div class="flex items-center gap-2 text-xs text-slate-400 mb-6">
        <a href="{{ route('home') }}">Electronics</a>
        <span>/</span>
        <span>Audio</span>
        <span>/</span>
        <span>{{ $product->category }}</span>
        <span>/</span>
        <span class="text-slate-800 font-bold">{{ $product->slug }}</span>
    </div>

    <!-- Product Detail Two Columns -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        <div class="lg:col-span-6 rounded-3xl bg-[#f8f9fa] p-12 flex items-center justify-center min-h-[420px]">
            <span class="text-8xl">🎧</span>
        </div>

        <div class="lg:col-span-6 space-y-6">
            <div>
                <h1 class="text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">{{ $product->name }}</h1>
                <p class="text-xs sm:text-sm text-stone-600 mt-2">{{ $product->short_desc }}</p>
                <div class="flex items-center gap-2 mt-3 text-emerald-600 text-sm">
                    ★★★★★ <span class="text-slate-500 font-semibold text-xs">({{ $product->review_count }})</span>
                </div>
            </div>

            <div class="border-t border-slate-100 pt-5">
                <div class="text-3xl font-extrabold text-slate-900 tabular-nums">
                    ${{ number_format($product->price, 2) }}
                    @if($product->monthly_price)
                        <span class="text-sm font-semibold text-slate-500">or ${{ number_format($product->monthly_price, 2) }}/month</span>
                    @endif
                </div>
                <p class="text-xs text-slate-400 mt-1">Suggested payments with 6 months special financing</p>
            </div>

            <div class="border-t border-slate-100 pt-5 space-y-3">
                <div class="text-xs font-semibold text-slate-800">Choose a Color</div>
                <div class="flex gap-2">
                    <span class="w-7 h-7 rounded-full bg-red-400 ring-2 ring-offset-2 ring-[#003d29] cursor-pointer"></span>
                    <span class="w-7 h-7 rounded-full bg-slate-700 cursor-pointer"></span>
                    <span class="w-7 h-7 rounded-full bg-emerald-200 cursor-pointer"></span>
                    <span class="w-7 h-7 rounded-full bg-slate-200 cursor-pointer"></span>
                </div>
            </div>

            <form action="{{ route('cart.add') }}" method="POST" class="space-y-4 pt-2">
                @csrf
                <input type="hidden" name="product_id" value="{{ $product->id }}">
                <div class="flex gap-3">
                    <button type="submit" class="flex-1 py-3.5 px-6 rounded-full font-semibold text-white bg-[#003d29] hover:bg-[#064e3b] text-sm">
                        Buy Now
                    </button>
                    <button type="submit" class="flex-1 py-3.5 px-6 rounded-full font-semibold text-slate-800 bg-white border border-slate-300 hover:border-slate-800 text-sm">
                        Add to Cart
                    </button>
                </div>
            </form>

            <div class="space-y-3 pt-4 border-t border-slate-100">
                <div class="p-3.5 rounded-2xl bg-amber-50/50 border border-amber-100 text-xs">
                    <div class="font-bold text-slate-900">Free Delivery</div>
                    <div class="text-slate-500">Enter your Postal code for Delivery Availability</div>
                </div>
                <div class="p-3.5 rounded-2xl bg-amber-50/50 border border-amber-100 text-xs">
                    <div class="font-bold text-slate-900">Return Delivery</div>
                    <div class="text-slate-500">Free 30days Delivery Returns. Details</div>
                </div>
            </div>
        </div>
    </div>
</div>
@endsection
