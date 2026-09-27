<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>@yield('title', 'Shopcart - Modern E-Commerce Store')</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Plus Jakarta Sans', sans-serif; }
    </style>
</head>
<body class="bg-[#fcfcfc] text-[#1c2a23] antialiased">
    <!-- Top Promotional Bar -->
    <div class="bg-[#003d29] text-white text-xs py-2 px-4 sm:px-8 border-b border-emerald-950/20">
        <div class="max-w-7xl mx-auto flex items-center justify-between">
            <div class="flex items-center gap-2 text-emerald-100/90 font-medium">
                <span>+001234567890</span>
            </div>
            <div class="hidden sm:flex items-center gap-2 text-emerald-100">
                <span>Get 50% Off on Selected Items</span>
                <span class="text-emerald-400/60 font-light">|</span>
                <a href="{{ route('home') }}" class="font-semibold text-white hover:text-emerald-300 underline underline-offset-4">Shop Now</a>
            </div>
            <div class="flex items-center gap-5 text-emerald-100/90">
                <span>Eng</span>
                <span>Location</span>
            </div>
        </div>
    </div>

    <!-- Main Navbar -->
    <nav class="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100">
        <div class="max-w-7xl mx-auto px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
            <div class="flex items-center gap-8">
                <a href="{{ route('home') }}" class="flex items-center gap-2 group">
                    <div class="w-8 h-8 rounded-lg bg-emerald-50 text-[#003d29] flex items-center justify-center font-bold">
                        🛒
                    </div>
                    <span class="text-2xl font-bold tracking-tight text-[#003d29]">Shopcart</span>
                </a>

                <div class="hidden lg:flex items-center gap-7 text-sm font-medium text-slate-700">
                    <a href="{{ route('home') }}" class="hover:text-[#003d29] transition-colors">Categories</a>
                    <a href="{{ route('home') }}" class="hover:text-[#003d29] transition-colors">Deals</a>
                    <a href="{{ route('home') }}" class="hover:text-[#003d29] transition-colors">What's New</a>
                    <a href="{{ route('home') }}" class="hover:text-[#003d29] transition-colors">Delivery</a>
                </div>
            </div>

            <!-- Search Bar -->
            <div class="flex-1 max-w-md">
                <form action="{{ route('search') }}" method="GET" class="relative">
                    <input
                        type="text"
                        name="q"
                        value="{{ request('q') }}"
                        placeholder="Search Product"
                        class="w-full pl-4 pr-10 py-2.5 text-xs sm:text-sm bg-slate-100/80 hover:bg-slate-100 focus:bg-white text-slate-800 rounded-full border border-transparent focus:border-emerald-600/30 focus:outline-none focus:ring-2 focus:ring-[#003d29]/10"
                    />
                    <button type="submit" class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#003d29]">
                        🔍
                    </button>
                </form>
            </div>

            <!-- Account & Cart -->
            <div class="flex items-center gap-5">
                @auth
                    <div class="relative group">
                        <button class="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-700 hover:text-[#003d29] py-2">
                            <span>Account</span>
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                        </button>
                        <div class="absolute right-0 mt-1 w-44 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 hidden group-hover:block z-50">
                            <div class="px-4 py-1.5 text-xs text-slate-400 border-b border-slate-50 mb-1">
                                Hello, {{ auth()->user()->name }}
                            </div>
                            <a href="{{ route('profile.index') }}" class="block px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-[#003d29]">
                                My Profile
                            </a>
                            <a href="{{ route('orders.index') }}" class="block px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-[#003d29]">
                                My Orders
                            </a>
                            <a href="#" class="block px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-[#003d29]">
                                Wishlist
                            </a>
                            <form action="{{ route('logout') }}" method="POST" class="border-t border-slate-50 mt-1">
                                @csrf
                                <button type="submit" class="w-full text-left px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-50">
                                    Logout
                                </button>
                            </form>
                        </div>
                    </div>
                @else
                    <a href="{{ route('login') }}" class="text-xs sm:text-sm font-medium text-slate-700 hover:text-[#003d29]">
                        Account
                    </a>
                @endauth
                <a href="{{ route('cart.index') }}" class="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-700 hover:text-[#003d29]">
                    <span>Cart</span>
                    @if(session('cart') && count(session('cart')) > 0)
                        <span class="w-4 h-4 rounded-full bg-[#003d29] text-white text-[10px] flex items-center justify-center font-bold">
                            {{ count(session('cart')) }}
                        </span>
                    @endif
                </a>
            </div>
        </div>
    </nav>

    <!-- Main Content -->
    <main>
        @yield('content')
    </main>

    <!-- Footer -->
    <footer class="bg-white border-t border-slate-100 mt-20 pt-16 pb-12 text-left">
        <div class="max-w-7xl mx-auto px-4 sm:px-8">
            <div class="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
                <div class="col-span-2 space-y-4">
                    <span class="text-xl font-bold tracking-tight text-[#003d29]">Shopcart</span>
                    <p class="text-xs sm:text-sm text-slate-500 max-w-sm">
                        Shopcart is your modern destination for premium audio gear, everyday essentials, and tech accessories.
                    </p>
                </div>
                <div class="space-y-3">
                    <h4 class="text-xs font-bold text-slate-900 uppercase">Shop</h4>
                    <ul class="space-y-2 text-xs text-slate-500">
                        <li><a href="#">Headphones</a></li>
                        <li><a href="#">Speakers</a></li>
                        <li><a href="#">Accessories</a></li>
                    </ul>
                </div>
                <div class="space-y-3">
                    <h4 class="text-xs font-bold text-slate-900 uppercase">Help</h4>
                    <ul class="space-y-2 text-xs text-slate-500">
                        <li><a href="#">Customer Service</a></li>
                        <li><a href="#">Shipping Details</a></li>
                        <li><a href="#">Returns</a></li>
                    </ul>
                </div>
                <div class="space-y-3">
                    <h4 class="text-xs font-bold text-slate-900 uppercase">Company</h4>
                    <ul class="space-y-2 text-xs text-slate-500">
                        <li><a href="#">About</a></li>
                        <li><a href="#">Privacy</a></li>
                        <li><a href="#">Terms</a></li>
                    </ul>
                </div>
            </div>
            <div class="border-t border-slate-100 pt-8 text-xs text-slate-400">
                © 2026 Shopcart. All rights reserved.
            </div>
        </div>
    </footer>
</body>
</html>
