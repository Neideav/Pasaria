@extends('layouts.app')

@section('title', 'Sign In - Shopcart')

@section('content')
<div class="max-w-md mx-auto px-4 py-16 text-left">
    <div class="bg-white rounded-3xl p-8 border border-slate-100 shadow-xl">
        <h2 class="text-2xl font-extrabold text-slate-900 tracking-tight mb-1">Sign in to Shopcart</h2>
        <p class="text-xs text-slate-500 mb-6">Access your orders and personalized recommendations.</p>

        @if($errors->any())
            <div class="p-3 mb-4 rounded-xl bg-red-50 text-red-700 text-xs">
                {{ $errors->first() }}
            </div>
        @endif

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

            <button type="submit" class="w-full py-3 rounded-full font-bold text-sm text-white bg-[#003d29] hover:bg-[#064e3b] shadow-md mt-2">
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
