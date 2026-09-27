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
                <div class="bg-white rounded-2xl p-5 border border-slate-100 shadow-2xs flex flex-col justify-between">
                    <div>
                        <div class="w-full h-44 rounded-xl bg-[#f8f9fa] flex items-center justify-center p-3 mb-4">
                            <span class="text-3xl">🎧</span>
                        </div>
                        <div class="flex justify-between items-start mb-1">
                            <h3 class="font-bold text-slate-900 line-clamp-1">{{ $product->name }}</h3>
                            <span class="font-bold text-slate-900 tabular-nums">${{ number_format($product->price, 2) }}</span>
                        </div>
                        <p class="text-xs text-slate-500 line-clamp-1 mb-2">{{ $product->short_desc ?? '' }}</p>
                        <div class="text-xs text-emerald-600 font-semibold mb-4">
                            ★★★★★ <span class="text-slate-400 font-normal">({{ $product->review_count ?? 121 }})</span>
                        </div>
                    </div>
                    <form action="{{ route('cart.add') }}" method="POST">
                        @csrf
                        <input type="hidden" name="product_id" value="{{ $product->id }}">
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
