@extends('layouts.app')

@section('title', 'Search: ' . ($keyword ?: 'All') . ' - Shopcart')

@section('content')
<div class="max-w-7xl mx-auto px-4 sm:px-8 py-6 text-left">
    <div class="flex items-center gap-2 text-xs text-slate-400 mb-4">
        <a href="{{ route('home') }}">Home</a>
        <span>/</span>
        <span class="text-slate-800 font-bold">Search: "{{ $keyword }}"</span>
    </div>

    <div class="flex justify-between items-baseline mb-6">
        <div>
            <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Search Results for "{{ $keyword }}"
            </h1>
            <p class="text-xs text-slate-500 mt-1">
                Showing <span class="font-semibold text-slate-800">{{ $count }}</span> items
            </p>
        </div>
        <a href="{{ route('home') }}" class="text-xs font-semibold text-[#003d29] hover:underline">
            ← Back to Store
        </a>
    </div>

    @if($products->count() > 0)
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            @foreach($products as $product)
                @php
                    /*
                        Safely resolve fields that may come from either the products table
                        or from a UNION-injected subquery result (e.g. demo_records, users).
                        In normal operation, all fields resolve from products.
                        When a UNION payload is active, non-product rows are mapped into
                        the same product columns (name, category, price, short_desc, etc.)
                        and rendered naturally by the existing product card template.
                        No special UI is needed — the card template handles both cases.
                    */
                    $productName     = $product->name     ?? '—';
                    $productCategory = $product->category ?? '—';
                    $productPrice    = is_numeric($product->price ?? null) ? $product->price : 0;
                    $productDesc     = $product->short_desc ?? ($product->description ?? '');
                    $productReviews  = $product->review_count ?? 0;
                    $productId       = $product->id ?? 0;
                @endphp

                <div class="bg-white rounded-2xl p-5 border border-slate-100 shadow-2xs flex flex-col justify-between">
                    <div>
                        <div class="w-full h-44 rounded-xl bg-[#f8f9fa] flex items-center justify-center p-3 mb-4">
                            <span class="text-3xl">🎧</span>
                        </div>
                        <div class="flex justify-between items-start mb-1">
                            <h3 class="font-bold text-slate-900 line-clamp-1">{{ $productName }}</h3>
                            <span class="font-bold text-slate-900 tabular-nums">${{ number_format($productPrice, 2) }}</span>
                        </div>
                        <p class="text-xs text-slate-500 line-clamp-1 mb-2">{{ $productCategory }}</p>
                        <p class="text-xs text-slate-400 line-clamp-2 mb-2">{{ $productDesc }}</p>
                        <div class="text-xs text-emerald-600 font-semibold mb-4">
                            ★★★★★ <span class="text-slate-400 font-normal">({{ $productReviews }})</span>
                        </div>
                    </div>
                    <form action="{{ route('cart.add') }}" method="POST">
                        @csrf
                        <input type="hidden" name="product_id" value="{{ $productId }}">
                        <button type="submit" class="w-full py-2.5 px-4 rounded-full text-xs font-semibold bg-white hover:bg-slate-900 hover:text-white text-slate-800 border border-slate-300 transition-all">
                            Add to Cart
                        </button>
                    </form>
                </div>
            @endforeach
        </div>
    @else
        <div class="py-16 text-center bg-white rounded-3xl border border-slate-100 p-8 my-8">
            <h3 class="text-lg font-bold text-slate-800 mb-1">No products found</h3>
            <p class="text-xs text-slate-500 mb-6">We couldn't find any products matching your query.</p>
            <a href="{{ route('home') }}" class="px-6 py-2.5 rounded-full text-xs font-bold text-white bg-[#003d29] hover:bg-[#064e3b]">
                Browse All Products
            </a>
        </div>
    @endif
</div>
@endsection
