@extends('layouts.app')

@section('title', 'Shopcart - Grab Up to 50% Off On Selected Headphone')

@section('content')
    <!-- Hero Banner -->
    <section class="max-w-7xl mx-auto px-4 sm:px-8 pt-4 pb-8">
        <div class="relative overflow-hidden rounded-3xl bg-[#fcf0e4] min-h-[380px] flex items-center p-8 sm:p-14">
            <div class="max-w-lg space-y-6">
                <h1 class="text-3xl sm:text-5xl font-extrabold text-[#003d29] tracking-tight leading-tight">
                    Grab Up to 50% Off On Selected Headphone
                </h1>
                <p class="text-sm text-stone-600">
                    Immerse yourself in world-class acoustic engineering with industry-leading noise cancellation.
                </p>
                <div>
                    <a href="{{ route('products.show', 'airpods-max') }}" class="inline-block px-8 py-3.5 text-sm font-semibold text-white bg-[#003d29] hover:bg-[#064e3b] rounded-full shadow-md">
                        Buy Now
                    </a>
                </div>
            </div>
        </div>
    </section>

    <!-- Filter Buttons -->
    <section class="max-w-7xl mx-auto px-4 sm:px-8 py-2">
        <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div class="flex flex-wrap items-center gap-2">
                <button class="px-3.5 py-1.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">Headphone Type</button>
                <button class="px-3.5 py-1.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">Price</button>
                <button class="px-3.5 py-1.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">Review</button>
                <button class="px-3.5 py-1.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">Color</button>
                <button class="px-3.5 py-1.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">Material</button>
                <button class="px-3.5 py-1.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">Offer</button>
                <button class="px-3.5 py-1.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">All Filters</button>
            </div>
            <div class="text-xs text-slate-500 font-medium">
                Sort by: <span class="font-bold text-slate-800">Popular</span>
            </div>
        </div>
    </section>

    <!-- Product Grid: Headphones For You! -->
    <section class="max-w-7xl mx-auto px-4 sm:px-8 py-8">
        <h2 class="text-2xl font-extrabold text-slate-900 mb-6">Headphones For You!</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            @foreach($products as $product)
                <div class="bg-white rounded-2xl p-5 border border-slate-100 shadow-2xs hover:shadow-lg transition-all flex flex-col justify-between">
                    <div>
                        <div class="w-full h-44 rounded-xl bg-[#f8f9fa] flex items-center justify-center p-3 mb-4">
                            <span class="text-3xl">🎧</span>
                        </div>
                        <div class="flex justify-between items-start mb-1">
                            <h3 class="font-bold text-slate-900 line-clamp-1">{{ $product->name }}</h3>
                            <span class="font-bold text-slate-900 tabular-nums">${{ number_format($product->price, 2) }}</span>
                        </div>
                        <p class="text-xs text-slate-500 line-clamp-1 mb-2">{{ $product->short_desc }}</p>
                        <div class="text-xs text-emerald-600 font-semibold mb-4">
                            ★★★★★ <span class="text-slate-400 font-normal">({{ $product->review_count }})</span>
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

        <div class="mt-8 flex justify-center">
            {{ $products->links() }}
        </div>
    </section>

    <!-- Weekly Popular Products -->
    <section class="max-w-7xl mx-auto px-4 sm:px-8 py-8 border-t border-slate-100">
        <h2 class="text-2xl font-extrabold text-slate-900 mb-6">Weekly Popular Products</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            @foreach($weeklyProducts as $product)
                <div class="bg-white rounded-2xl p-5 border border-slate-100 shadow-2xs flex flex-col justify-between">
                    <div>
                        <div class="w-full h-44 rounded-xl bg-[#f8f9fa] flex items-center justify-center p-3 mb-4">
                            <span class="text-3xl">📦</span>
                        </div>
                        <div class="flex justify-between items-start mb-1">
                            <h3 class="font-bold text-slate-900 line-clamp-1">{{ $product->name }}</h3>
                            <span class="font-bold text-slate-900 tabular-nums">${{ number_format($product->price, 2) }}</span>
                        </div>
                        <p class="text-xs text-slate-500 line-clamp-1 mb-2">{{ $product->short_desc }}</p>
                        <div class="text-xs text-emerald-600 font-semibold mb-4">
                            ★★★★★ <span class="text-slate-400 font-normal">({{ $product->review_count }})</span>
                        </div>
                    </div>
                    <a href="{{ route('products.show', $product->slug) }}" class="text-center w-full py-2.5 px-4 rounded-full text-xs font-semibold bg-white hover:bg-slate-900 hover:text-white text-slate-800 border border-slate-300 transition-all">
                        View Product
                    </a>
                </div>
            @endforeach
        </div>
    </section>

    <!-- Services To Help You Shop -->
    <section class="max-w-7xl mx-auto px-4 sm:px-8 py-12">
        <h2 class="text-2xl font-extrabold text-slate-900 mb-8">Services To Help You Shop</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="rounded-3xl bg-[#f4efe8] p-6 space-y-2">
                <h3 class="text-lg font-bold text-slate-900">Frequently Asked Questions</h3>
                <p class="text-xs text-stone-600">Updates on safe Shopping in our Stores</p>
            </div>
            <div class="rounded-3xl bg-[#e9f2ee] p-6 space-y-2">
                <h3 class="text-lg font-bold text-slate-900">Online Payment Process</h3>
                <p class="text-xs text-stone-600">Updates on safe Shopping in our Stores</p>
            </div>
            <div class="rounded-3xl bg-[#f8ede3] p-6 space-y-2">
                <h3 class="text-lg font-bold text-slate-900">Home Delivery Options</h3>
                <p class="text-xs text-stone-600">Updates on safe Shopping in our Stores</p>
            </div>
        </div>
    </section>
@endsection
