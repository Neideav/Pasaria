@extends('layouts.app')

@section('title', 'Sign In - Shopcart')

@section('content')
<div class="max-w-md mx-auto px-4 py-16 text-left">
    <div class="bg-white rounded-3xl p-8 border border-slate-100 shadow-xl">
        <div class="flex items-center gap-2 mb-1.5">
            <span class="w-2.5 h-2.5 rounded-full bg-[#003d29] animate-pulse"></span>
            <span class="text-[11px] font-bold uppercase tracking-wider text-[#003d29]">Shopcart Security</span>
        </div>
        <h2 class="text-2xl font-extrabold text-slate-900 tracking-tight mb-1">Sign in to Shopcart</h2>
        <p class="text-xs text-slate-500 mb-6">Access your orders and personalized recommendations.</p>

        @if($errors->any())
            <div class="p-3 mb-4 rounded-xl bg-red-50 text-red-700 text-xs border border-red-200">
                {{ $errors->first() }}
            </div>
        @endif

        <!-- Social & SSO Sign In Buttons -->
        <div class="mb-5">
            <div class="grid grid-cols-4 gap-2">
                <!-- Google -->
                <a href="{{ route('social.login', ['provider' => 'google']) }}" class="group flex flex-col items-center justify-center py-2.5 px-2 rounded-2xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/80 transition-all duration-200 active:scale-95 shadow-xs hover:shadow-sm" title="Sign in with Google">
                    <svg class="w-5 h-5 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    <span class="text-[10px] font-semibold text-slate-600 mt-1">Google</span>
                </a>

                <!-- VK -->
                <a href="{{ route('social.login', ['provider' => 'vk']) }}" class="group flex flex-col items-center justify-center py-2.5 px-2 rounded-2xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/80 transition-all duration-200 active:scale-95 shadow-xs hover:shadow-sm" title="Sign in with VK">
                    <svg class="w-5 h-5 rounded-md transition-transform group-hover:scale-110" viewBox="0 0 24 24" fill="none">
                        <rect width="24" height="24" rx="5" fill="#0077FF"/>
                        <path d="M12.98 16.5c-4.8 0-7.54-3.29-7.66-8.77h2.41c.08 4.02 1.86 5.73 3.26 6.08v-6.08h2.27v3.47c1.39-.15 2.85-1.72 3.34-3.47h2.27c-.38 2.16-1.97 3.73-3.08 4.38 1.11.52 2.92 1.89 3.6 4.39h-2.5c-.53-1.66-1.85-2.94-3.62-3.12v3.12h-.29z" fill="white"/>
                    </svg>
                    <span class="text-[10px] font-semibold text-slate-600 mt-1">VK</span>
                </a>

                <!-- Facebook -->
                <a href="{{ route('social.login', ['provider' => 'facebook']) }}" class="group flex flex-col items-center justify-center py-2.5 px-2 rounded-2xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/80 transition-all duration-200 active:scale-95 shadow-xs hover:shadow-sm" title="Sign in with Facebook">
                    <svg class="w-5 h-5 transition-transform group-hover:scale-110" viewBox="0 0 24 24" fill="#1877F2">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    <span class="text-[10px] font-semibold text-slate-600 mt-1">Facebook</span>
                </a>

                <!-- SSO -->
                <a href="{{ route('social.login', ['provider' => 'sso']) }}" class="group flex flex-col items-center justify-center py-2.5 px-2 rounded-2xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/80 transition-all duration-200 active:scale-95 shadow-xs hover:shadow-sm" title="Enterprise Single Sign-On">
                    <div class="w-5 h-5 rounded-md bg-indigo-600 text-white flex items-center justify-center font-black text-[9px] tracking-tight shadow-xs transition-transform group-hover:scale-110">
                        SSO
                    </div>
                    <span class="text-[10px] font-semibold text-slate-600 mt-1">SSO</span>
                </a>
            </div>

            <!-- Divider -->
            <div class="relative my-5">
                <div class="absolute inset-0 flex items-center">
                    <div class="w-full border-t border-slate-200"></div>
                </div>
                <div class="relative flex justify-center text-xs">
                    <span class="bg-white px-3 text-[11px] font-medium text-slate-400">or continue with email</span>
                </div>
            </div>
        </div>

        <form action="{{ route('login') }}" method="POST" class="space-y-4 text-xs">
            @csrf
            <div>
                <label class="block font-semibold text-slate-700 mb-1">Email / Username</label>
                <input type="text" name="username" value="{{ old('username', 'customer@shopcart.com') }}" required class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#003d29]">
            </div>

            <div>
                <div class="flex justify-between items-center mb-1">
                    <label class="font-semibold text-slate-700">Password</label>
                    <a href="#" class="text-[#003d29] hover:underline">Forgot Password?</a>
                </div>
                <input type="password" name="password" value="password123" required class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#003d29]">
            </div>

            <button type="submit" class="w-full py-3 rounded-full font-bold text-sm text-white bg-[#003d29] hover:bg-[#064e3b] shadow-md shadow-emerald-950/10 mt-2 transition-all cursor-pointer">
                Sign In
            </button>
        </form>

        <div class="text-center mt-6 text-xs text-slate-500">
            Don't have an account?
            <a href="{{ route('register') }}" class="font-bold text-[#003d29] hover:underline">Create Account</a>
        </div>
    </div>
</div>
@endsection
