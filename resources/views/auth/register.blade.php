@extends('layouts.app')

@section('title', 'Create Account - Shopcart')

@section('content')
<div class="max-w-md mx-auto px-4 py-16 text-left">
    <div class="bg-white rounded-3xl p-8 border border-slate-100 shadow-xl">
        <h2 class="text-2xl font-extrabold text-slate-900 tracking-tight mb-1">Create an Account</h2>
        <p class="text-xs text-slate-500 mb-6">Join thousands of satisfied shoppers today.</p>

        @if($errors->any())
            <div class="p-3 mb-4 rounded-xl bg-red-50 text-red-700 text-xs">
                {{ $errors->first() }}
            </div>
        @endif

        <form action="{{ route('register') }}" method="POST" class="space-y-3 text-xs">
            @csrf
            <div>
                <label class="block font-semibold text-slate-700 mb-1">Full Name</label>
                <input type="text" name="name" value="{{ old('name') }}" required class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200">
            </div>

            <div>
                <label class="block font-semibold text-slate-700 mb-1">Username</label>
                <input type="text" name="username" value="{{ old('username') }}" required class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200">
            </div>

            <div>
                <label class="block font-semibold text-slate-700 mb-1">Email</label>
                <input type="email" name="email" value="{{ old('email') }}" required class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200">
            </div>

            <div class="grid grid-cols-2 gap-2">
                <div>
                    <label class="block font-semibold text-slate-700 mb-1">Password</label>
                    <input type="password" name="password" required class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200">
                </div>
                <div>
                    <label class="block font-semibold text-slate-700 mb-1">Confirm</label>
                    <input type="password" name="password_confirmation" required class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200">
                </div>
            </div>

            <button type="submit" class="w-full py-3 rounded-full font-bold text-sm text-white bg-[#003d29] hover:bg-[#064e3b] shadow-md mt-4">
                Create Account
            </button>
        </form>

        <div class="text-center mt-6 text-xs text-slate-500">
            Already have an account?
            <a href="{{ route('login') }}" class="font-bold text-[#003d29] hover:underline">Sign In</a>
        </div>
    </div>
</div>
@endsection
