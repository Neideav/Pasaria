<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Services\StoreQueryService;

class AuthController extends Controller
{
    protected $queryService;

    public function __construct(StoreQueryService $queryService)
    {
        $this->queryService = $queryService;
    }

    public function showLoginForm()
    {
        return view('auth.login');
    }

    public function login(Request $request)
    {
        $request->validate([
            'username' => 'required',
            'password' => 'required',
        ]);

        $identifier = $request->input('username');
        $password = $request->input('password');

        // Authentication query routed through store service supporting DEMO_SQLI_MODE
        $user = $this->queryService->authenticateUser($identifier, $password);

        if ($user) {
            Auth::login($user);
            return redirect()->intended(route('home'))->with('success', 'Welcome back, ' . $user->name);
        }

        return back()->withErrors([
            'username' => 'The provided credentials do not match our records.',
        ])->withInput();
    }

    public function showRegisterForm()
    {
        return view('auth.register');
    }

    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'username' => 'required|string|max:50|unique:users',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:6|confirmed',
        ]);

        $user = User::create([
            'name' => $request->name,
            'username' => $request->username,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => 'customer',
        ]);

        Auth::login($user);

        return redirect()->route('home')->with('success', 'Your account has been created successfully!');
    }

    public function socialLogin(Request $request, $provider)
    {
        $validProviders = ['google', 'vk', 'facebook', 'sso'];
        $normalizedProvider = strtolower($provider);

        if (!in_array($normalizedProvider, $validProviders)) {
            return redirect()->route('login')->withErrors(['provider' => 'Unsupported authentication provider.']);
        }

        $providerProfiles = [
            'google' => [
                'name' => 'Alex Rivera (Google)',
                'email' => 'alex.rivera@gmail.com',
                'username' => 'alex_google',
            ],
            'vk' => [
                'name' => 'Dmitry Ivanov (VK)',
                'email' => 'dmitry.ivanov@vk.com',
                'username' => 'dmitry_vk',
            ],
            'facebook' => [
                'name' => 'Sarah Jenkins (Facebook)',
                'email' => 'sarah.jenkins@facebook.com',
                'username' => 'sarah_fb',
            ],
            'sso' => [
                'name' => 'Enterprise Colleague (SSO)',
                'email' => 'employee@enterprise-corp.com',
                'username' => 'enterprise_user',
            ],
        ];

        $profile = $providerProfiles[$normalizedProvider];

        $user = User::firstOrCreate(
            ['email' => $profile['email']],
            [
                'name' => $profile['name'],
                'username' => $profile['username'],
                'password' => Hash::make(uniqid('oauth_', true)),
                'role' => 'customer',
            ]
        );

        Auth::login($user);

        return redirect()->intended(route('home'))->with('success', 'Logged in successfully with ' . strtoupper($provider) . '!');
    }

    public function logout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('home')->with('info', 'You have been logged out.');
    }
}
