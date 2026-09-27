@extends('layouts.app')

@section('title', 'My Profile - Shopcart')

@section('content')
<div class="max-w-4xl mx-auto px-4 sm:px-8 py-8 text-left">
    <div class="flex justify-between items-center mb-8 pb-4 border-b border-slate-100">
        <div>
            <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">My Profile</h1>
            <p class="text-xs text-slate-500 mt-1">Manage your account information and preferences.</p>
        </div>
        <a href="{{ route('home') }}" class="text-xs font-semibold text-[#003d29] hover:underline">Return to Store</a>
    </div>

    <div class="bg-white rounded-3xl p-8 border border-slate-100 shadow-2xs">
        @if(session('success'))
            <div class="p-3 mb-4 rounded-xl bg-emerald-50 text-emerald-800 text-xs">
                {{ session('success') }}
            </div>
        @endif

        <form action="{{ route('profile.update') }}" method="POST" class="space-y-6 text-xs">
            @csrf
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label class="block font-semibold text-slate-700 mb-1">Full Name</label>
                    <input type="text" name="name" value="{{ old('name', $user->name ?? 'Wade Warren') }}" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200">
                </div>
                <div>
                    <label class="block font-semibold text-slate-700 mb-1">Email</label>
                    <input type="email" value="{{ $user->email ?? 'customer@shopcart.com' }}" disabled class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-500">
                </div>
                <div>
                    <label class="block font-semibold text-slate-700 mb-1">Phone</label>
                    <input type="text" name="phone" value="{{ old('phone', $user->phone ?? '+001234567890') }}" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200">
                </div>
                <div>
                    <label class="block font-semibold text-slate-700 mb-1">Address</label>
                    <input type="text" name="address" value="{{ old('address', $user->address ?? '4140 Parker Rd.') }}" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200">
                </div>
                <div>
                    <label class="block font-semibold text-slate-700 mb-1">City</label>
                    <input type="text" name="city" value="{{ old('city', $user->city ?? 'Allentown') }}" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200">
                </div>
                <div>
                    <label class="block font-semibold text-slate-700 mb-1">Zip Code</label>
                    <input type="text" name="zip" value="{{ old('zip', $user->zip ?? '31134') }}" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200">
                </div>
            </div>

            <button type="submit" class="px-6 py-2.5 rounded-full font-bold text-xs text-white bg-[#003d29] hover:bg-[#064e3b]">
                Save Changes
            </button>
        </form>
    </div>
</div>
@endsection
