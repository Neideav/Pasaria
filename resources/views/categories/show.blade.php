@extends('layouts.app')

@section('title', ($category->name ?? 'Category') . ' - Shopcart')

@section('content')
<div class="max-w-7xl mx-auto px-4 sm:px-8 py-6 text-left">
    <!-- Breadcrumb -->
    <div class="flex items-center gap-2 text-xs text-slate-400 mb-6">
        <a href="{{ route('home') }}" class="hover:text-emerald-700">Home</a>
        <span>/</span>
        <a href="{{ route('home') }}" class="hover:text-emerald-700">Categories</a>
        <span>/</span>
        <span class="text-slate-800 font-bold">{{ $category->name ?? 'All Categories' }}</span>
    </div>

    <!-- Category Header -->
    <div class="mb-8">
        <h1 class="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            {{ $category->name ?? 'Category Collection' }}
        </h1>
        <p class="text-xs sm:text-sm text-slate-500 mt-2">
            Explore premium gear curated for authentic audio fidelity and everyday comfort.
        </p>
    </div>

    <!-- Filter Buttons & Sort -->
    <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-8">
        <div class="flex flex-wrap items-center gap-2">
            <button class="px-3.5 py-1.5 rounded-full text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition">Type</button>
            <button class="px-3.5 py-1.5 rounded-full text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition">Price</button>
            <button class="px-3.5 py-1.5 rounded-full text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition">Rating</button>
            <button class="px-3.5 py-1.5 rounded-full text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition">Color</button>
            <button class="px-3.5 py-1.5 rounded-full text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition">Material</button>
            <button class="px-3.5 py-1.5 rounded-full text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition">Offer</button>
            <button class="px-3.5 py-1.5 rounded-full text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition">All Filters</button>
        </div>
        <div class="text-xs text-slate-500 font-medium">
            Sort by: <span class="font-bold text-slate-800">Popular</span>
        </div>
    </div>

    <!-- Product Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        @forelse($products as $product)
            <div class="bg-white rounded-2xl p-5 border border-slate-100 shadow-2xs hover:shadow-lg transition-all flex flex-col justify-between group">
                <div>
                    <div class="w-full h-44 rounded-xl bg-[#f8f9fa] flex items-center justify-center p-3 mb-4 group-hover:scale-105 transition-transform">
                        <span class="text-3xl">
                            @if(str_contains(strtolower($product->category), 'headphone') || str_contains(strtolower($product->category), 'earbud'))
                                🎧
                            @elseif(str_contains(strtolower($product->category), 'speaker'))
                                🔊
                            @elseif(str_contains(strtolower($product->category), 'laptop'))
                                💻
                            @else
                                📦
                            @endif
                        </span>
                    </div>
                    <div class="flex justify-between items-start mb-1">
                        <h3 class="font-bold text-slate-900 line-clamp-1">{{ $product->name }}</h3>
                        <span class="font-bold text-slate-900 tabular-nums">${{ number_format($product->price, 2) }}</span>
                    </div>
                    <p class="text-xs text-slate-500 line-clamp-1 mb-2">{{ $product->short_desc }}</p>
                    <div class="text-xs text-emerald-600 font-semibold mb-4">
                        ★★★★★ <span class="text-slate-400 font-normal">({{ $product->review_count ?? 120 }})</span>
                    </div>
                </div>
                <div class="space-y-2">
                    <a href="{{ route('products.show', $product->slug) }}" class="block text-center w-full py-2.5 px-4 rounded-full text-xs font-semibold bg-white hover:bg-slate-900 hover:text-white text-slate-800 border border-slate-300 transition-all">
                        View Product
                    </a>
                    <form action="{{ route('cart.add') }}" method="POST">
                        @csrf
                        <input type="hidden" name="product_id" value="{{ $product->id }}">
                        <button type="submit" class="w-full py-2.5 px-4 rounded-full text-xs font-semibold bg-[#003d29] hover:bg-[#064e3b] text-white transition-all shadow-xs">
                            Add to Cart
                        </button>
                    </form>
                </div>
            </div>
        @empty
            <div class="col-span-full py-16 text-center bg-white rounded-3xl border border-slate-100 p-8">
                <h3 class="text-lg font-bold text-slate-800 mb-1">No products found in this category</h3>
                <p class="text-xs text-slate-500 mb-6">Check back later or browse other departments.</p>
                <a href="{{ route('home') }}" class="px-6 py-2.5 rounded-full text-xs font-bold text-white bg-[#003d29] hover:bg-[#064e3b]">
                    Back to Store
                </a>
            </div>
        @endforelse
    </div>

    @if(method_exists($products, 'links'))
        <div class="mt-8 flex justify-center">
            {{ $products->links() }}
        </div>
    @endif
</div>
@endsection
