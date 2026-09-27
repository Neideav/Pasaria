import React, { useState } from 'react';
import { X, Lock, Mail, User as UserIcon, Building2, ShieldCheck, Loader2 } from 'lucide-react';
import { User } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('customer@shopcart.com');
  const [password, setPassword] = useState('password123');

  // Register fields
  const [regName, setRegName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  // Social & SSO states
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const [showSsoForm, setShowSsoForm] = useState(false);
  const [ssoDomain, setSsoDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();

      if (!data.success) {
        throw new Error(data.message || 'Invalid username or password.');
      }

      onLoginSuccess(data.user);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (regPassword !== regConfirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName,
          username: regUsername,
          email: regEmail,
          password: regPassword
        })
      });
      const data = await res.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to create account.');
      }

      onLoginSuccess(data.user);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialAuth = async (provider: 'google' | 'vk' | 'facebook' | 'sso', domainInput?: string) => {
    setSocialLoading(provider);
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth/social', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          ssoDomain: domainInput || ssoDomain
        })
      });
      const data = await res.json();

      if (!data.success) {
        throw new Error(data.message || `Failed to authenticate with ${provider.toUpperCase()}`);
      }

      onLoginSuccess(data.user);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || `Failed to connect with ${provider.toUpperCase()}`);
    } finally {
      setSocialLoading(null);
    }
  };

  const setCustomerCredentials = () => {
    setUsername('customer@shopcart.com');
    setPassword('password123');
    setErrorMsg('');
  };

  const setAdminCredentials = () => {
    setUsername('admin@shopcart.com');
    setPassword('admin123');
    setErrorMsg('');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8 border border-slate-100 text-left">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Brand header */}
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#003d29] animate-pulse"></span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#003d29]">Shopcart Security</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            {tab === 'login' ? 'Sign in to Shopcart' : 'Create an Account'}
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-normal">
            {tab === 'login'
              ? 'Access your orders, saved items, and personalized recommendations.'
              : 'Join thousands of satisfied shoppers today.'}
          </p>
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="p-3 mb-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
            {errorMsg}
          </div>
        )}

        {/* Social & SSO Authentication Grid */}
        <div className="mb-4">
          <div className="grid grid-cols-4 gap-2">
            {/* Google */}
            <button
              type="button"
              disabled={!!socialLoading}
              onClick={() => handleSocialAuth('google')}
              title={tab === 'login' ? 'Sign in with Google' : 'Register with Google'}
              className="group flex flex-col items-center justify-center py-2.5 px-2 rounded-2xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/80 transition-all duration-200 active:scale-95 cursor-pointer shadow-xs hover:shadow-sm disabled:opacity-50"
            >
              {socialLoading === 'google' ? (
                <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
              ) : (
                <svg className="w-5 h-5 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
              )}
              <span className="text-[10px] font-semibold text-slate-600 mt-1">Google</span>
            </button>

            {/* VK */}
            <button
              type="button"
              disabled={!!socialLoading}
              onClick={() => handleSocialAuth('vk')}
              title={tab === 'login' ? 'Sign in with VK' : 'Register with VK'}
              className="group flex flex-col items-center justify-center py-2.5 px-2 rounded-2xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/80 transition-all duration-200 active:scale-95 cursor-pointer shadow-xs hover:shadow-sm disabled:opacity-50"
            >
              {socialLoading === 'vk' ? (
                <Loader2 className="w-5 h-5 text-[#0077FF] animate-spin" />
              ) : (
                <svg className="w-5 h-5 rounded-md transition-transform group-hover:scale-110" viewBox="0 0 24 24" fill="none">
                  <rect width="24" height="24" rx="5" fill="#0077FF"/>
                  <path d="M12.98 16.5c-4.8 0-7.54-3.29-7.66-8.77h2.41c.08 4.02 1.86 5.73 3.26 6.08v-6.08h2.27v3.47c1.39-.15 2.85-1.72 3.34-3.47h2.27c-.38 2.16-1.97 3.73-3.08 4.38 1.11.52 2.92 1.89 3.6 4.39h-2.5c-.53-1.66-1.85-2.94-3.62-3.12v3.12h-.29z" fill="white"/>
                </svg>
              )}
              <span className="text-[10px] font-semibold text-slate-600 mt-1">VK</span>
            </button>

            {/* Facebook */}
            <button
              type="button"
              disabled={!!socialLoading}
              onClick={() => handleSocialAuth('facebook')}
              title={tab === 'login' ? 'Sign in with Facebook' : 'Register with Facebook'}
              className="group flex flex-col items-center justify-center py-2.5 px-2 rounded-2xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/80 transition-all duration-200 active:scale-95 cursor-pointer shadow-xs hover:shadow-sm disabled:opacity-50"
            >
              {socialLoading === 'facebook' ? (
                <Loader2 className="w-5 h-5 text-[#1877F2] animate-spin" />
              ) : (
                <svg className="w-5 h-5 transition-transform group-hover:scale-110" viewBox="0 0 24 24" fill="#1877F2">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              )}
              <span className="text-[10px] font-semibold text-slate-600 mt-1">Facebook</span>
            </button>

            {/* SSO */}
            <button
              type="button"
              disabled={!!socialLoading}
              onClick={() => setShowSsoForm(!showSsoForm)}
              title="Enterprise Single Sign-On (SAML / OIDC)"
              className={`group flex flex-col items-center justify-center py-2.5 px-2 rounded-2xl border transition-all duration-200 active:scale-95 cursor-pointer shadow-xs hover:shadow-sm disabled:opacity-50 ${
                showSsoForm
                  ? 'border-indigo-500 bg-indigo-50/60 ring-2 ring-indigo-500/20'
                  : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/80'
              }`}
            >
              {socialLoading === 'sso' ? (
                <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
              ) : (
                <div className="w-5 h-5 rounded-md bg-indigo-600 text-white flex items-center justify-center font-black text-[9px] tracking-tight shadow-xs transition-transform group-hover:scale-110">
                  SSO
                </div>
              )}
              <span className="text-[10px] font-semibold text-slate-600 mt-1">SSO</span>
            </button>
          </div>

          {/* Expandable Enterprise SSO Drawer */}
          {showSsoForm && (
            <div className="mt-3 p-3.5 bg-gradient-to-br from-indigo-50/70 via-slate-50 to-white rounded-2xl border border-indigo-100/90 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center gap-1.5 mb-2 text-indigo-950 font-bold text-xs">
                <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                <span>Enterprise Single Sign-On</span>
              </div>
              <p className="text-[11px] text-slate-500 mb-2.5">
                Sign in with your organization's SAML, Okta, Azure AD, or Google Workspace domain.
              </p>
              <div className="flex gap-2 mb-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={ssoDomain}
                    onChange={(e) => setSsoDomain(e.target.value)}
                    placeholder="company.com or work email"
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-indigo-200 bg-white focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                  />
                </div>
                <button
                  type="button"
                  disabled={socialLoading === 'sso'}
                  onClick={() => handleSocialAuth('sso')}
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs hover:shadow transition-colors cursor-pointer disabled:opacity-50"
                >
                  {socialLoading === 'sso' ? 'Connecting...' : 'Connect'}
                </button>
              </div>
              <div className="flex items-center justify-between text-[10px] text-indigo-600">
                <button
                  type="button"
                  onClick={() => handleSocialAuth('sso', 'acme-enterprise.com')}
                  className="hover:underline flex items-center gap-1 font-medium cursor-pointer"
                >
                  <ShieldCheck className="w-3 h-3" /> Quick Demo Enterprise Login
                </button>
                <button
                  type="button"
                  onClick={() => setShowSsoForm(false)}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Separator */}
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200/80"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-white px-3 text-[11px] font-medium text-slate-400">
              {tab === 'login' ? 'or continue with email' : 'or register with email'}
            </span>
          </div>
        </div>

        {/* Login Form */}
        {tab === 'login' ? (
          <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Email / Username
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="name@example.com"
                  required
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#003d29]"
                />
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-slate-700">Password</label>
                <a href="#forgot" className="text-[11px] text-[#003d29] hover:underline">
                  Forgot Password?
                </a>
              </div>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#003d29]"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !!socialLoading}
              className="w-full py-3 px-4 rounded-full font-bold text-xs sm:text-sm text-white bg-[#003d29] hover:bg-[#064e3b] transition-all shadow-md shadow-emerald-950/10 cursor-pointer disabled:opacity-50 mt-2"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>

            {/* Quick Demo Credentials */}
            <div className="pt-3 border-t border-slate-100">
              <div className="text-[11px] text-slate-400 mb-2 font-medium">Quick Fill Demo Accounts:</div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={setCustomerCredentials}
                  className="flex-1 py-1.5 px-2 bg-slate-50 hover:bg-slate-100 rounded-lg text-[11px] font-medium text-slate-700 border border-slate-200 transition-colors cursor-pointer"
                >
                  Wade Warren
                </button>
                <button
                  type="button"
                  onClick={setAdminCredentials}
                  className="flex-1 py-1.5 px-2 bg-slate-50 hover:bg-slate-100 rounded-lg text-[11px] font-medium text-slate-700 border border-slate-200 transition-colors cursor-pointer"
                >
                  Administrator
                </button>
              </div>
            </div>

            <div className="text-center pt-2 text-slate-500">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setTab('register');
                  setShowSsoForm(false);
                  setErrorMsg('');
                }}
                className="font-bold text-[#003d29] hover:underline cursor-pointer"
              >
                Create Account
              </button>
            </div>
          </form>
        ) : (
          /* Register Form */
          <form onSubmit={handleRegisterSubmit} className="space-y-3 text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                placeholder="Jane Doe"
                required
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-[#003d29]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Username</label>
              <input
                type="text"
                value={regUsername}
                onChange={(e) => setRegUsername(e.target.value)}
                placeholder="janedoe"
                required
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-[#003d29]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder="jane@example.com"
                required
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-[#003d29]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Password</label>
                <input
                  type="password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-[#003d29]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Confirm</label>
                <input
                  type="password"
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-[#003d29]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !!socialLoading}
              className="w-full py-3 px-4 rounded-full font-bold text-xs sm:text-sm text-white bg-[#003d29] hover:bg-[#064e3b] transition-all shadow-md shadow-emerald-950/10 cursor-pointer disabled:opacity-50 mt-3"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>

            <div className="text-center pt-2 text-slate-500">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setTab('login');
                  setShowSsoForm(false);
                  setErrorMsg('');
                }}
                className="font-bold text-[#003d29] hover:underline cursor-pointer"
              >
                Sign In
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
