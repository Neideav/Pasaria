<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ProfileController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        return view('profile.index', compact('user'));
    }

    public function update(Request $request)
    {
        $user = Auth::user();

        $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:30',
            'address' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:100',
            'zip' => 'nullable|string|max:20',
        ]);

        $user->update($request->only(['name', 'phone', 'address', 'city', 'zip']));

        return redirect()->route('profile.index')->with('success', 'Profile updated successfully.');
    }
}
