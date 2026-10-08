import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Globe,
  Bell,
  Shield,
  KeyRound,
  Check,
  AlertCircle,
  Lock,
  ArrowLeft
} from 'lucide-react';
import { User } from '../types';
import { Language, translations } from '../i18n/translations';
import { api } from '../services/api';

interface SettingsViewProps {
  user: User | null;
  currentLang: Language;
  onLanguageChange: (lang: Language) => void;
  onNavigateHome: () => void;
  onClearCache: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  user,
  currentLang,
  onLanguageChange,
  onNavigateHome,
}) => {
  const t = translations[currentLang];
  const [activeTab, setActiveTab] = useState<'security' | 'notifications' | 'privacy'>('security');

  // Security Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // Notification state
  const [emailNotif, setEmailNotif] = useState(true);
  const [smsNotif, setSmsNotif] = useState(true);
  const [promoNotif, setPromoNotif] = useState(false);
  const [notifSaved, setNotifSaved] = useState(false);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    if (newPassword.length < 8) {
      setPasswordError('Kata sandi baru minimal 8 karakter');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Konfirmasi kata sandi tidak cocok');
      return;
    }

    setPasswordSaving(true);
    try {
      await api.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
        new_password_confirmation: confirmPassword,
      });

      setPasswordSaved(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSaved(false), 3000);
    } catch (err: any) {
      setPasswordError(err.message || 'Gagal mengubah kata sandi. Pastikan kata sandi saat ini benar.');
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleSaveNotifications = (e: React.FormEvent) => {
    e.preventDefault();
    setNotifSaved(true);
    setTimeout(() => setNotifSaved(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 py-8 text-left space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs uppercase tracking-wider mb-1">
            <SettingsIcon className="w-4 h-4 text-emerald-700" />
            <span>Pengaturan Akun</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Keamanan & Preferensi
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Kelola kata sandi, preferensi notifikasi, dan keamanan login akun PASARIA.
          </p>
        </div>
        <button
          onClick={onNavigateHome}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#003d29] hover:underline cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Beranda</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-100 pb-3 text-xs">
        {[
          { id: 'security', label: 'Keamanan & Kata Sandi', icon: Shield },
          { id: 'notifications', label: 'Notifikasi', icon: Bell },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#003d29] text-white shadow-xs'
                  : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Security Tab: Real Password Change */}
      {activeTab === 'security' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-2xs space-y-6">
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-[#003d29]" />
              Ubah Kata Sandi Akun
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Gunakan kata sandi yang kuat dengan minimal 8 karakter untuk menjaga keamanan akun Anda.
            </p>
          </div>

          {passwordError && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{passwordError}</span>
            </div>
          )}

          {passwordSaved && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Kata sandi Anda berhasil diperbarui di database!</span>
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Kata Sandi Saat Ini
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#003d29]"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Kata Sandi Baru
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#003d29]"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Konfirmasi Kata Sandi Baru
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#003d29]"
                required
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={passwordSaving}
                className="px-6 py-2.5 rounded-full font-bold text-xs text-white bg-[#003d29] hover:bg-[#064e3b] transition-all cursor-pointer flex items-center gap-2 shadow-2xs disabled:opacity-40"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>{passwordSaving ? 'Memproses...' : 'Perbarui Kata Sandi'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-2xs space-y-6">
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#003d29]" />
              Preferensi Pemberitahuan
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Atur bagaimana PASARIA mengabari Anda mengenai pesanan, promosi, dan pesan baru.
            </p>
          </div>

          <form onSubmit={handleSaveNotifications} className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <div>
                <div className="font-bold text-slate-900">Pembaruan Pesanan & Pengiriman</div>
                <div className="text-[11px] text-slate-500">Notifikasi status resi, transit kurir, dan konfirmasi barang tiba.</div>
              </div>
              <input
                type="checkbox"
                checked={emailNotif}
                onChange={(e) => setEmailNotif(e.target.checked)}
                className="w-4 h-4 text-[#003d29] rounded"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <div>
                <div className="font-bold text-slate-900">Pesan Chat Penjual</div>
                <div className="text-[11px] text-slate-500">Notifikasi saat penjual membalas pertanyaan atau ulasan produk.</div>
              </div>
              <input
                type="checkbox"
                checked={smsNotif}
                onChange={(e) => setSmsNotif(e.target.checked)}
                className="w-4 h-4 text-[#003d29] rounded"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <div>
                <div className="font-bold text-slate-900">Promo & Voucher Spesial</div>
                <div className="text-[11px] text-slate-500">Kabar diskon kilat flash sale mingguan dan voucher diskon.</div>
              </div>
              <input
                type="checkbox"
                checked={promoNotif}
                onChange={(e) => setPromoNotif(e.target.checked)}
                className="w-4 h-4 text-[#003d29] rounded"
              />
            </div>

            <div className="pt-2 flex items-center justify-between">
              {notifSaved && (
                <span className="text-xs text-emerald-700 font-bold">Preferensi berhasil disimpan!</span>
              )}
              <button
                type="submit"
                className="ml-auto px-6 py-2.5 rounded-full font-bold text-xs text-white bg-[#003d29] hover:bg-[#064e3b] transition-all cursor-pointer shadow-2xs"
              >
                Simpan Preferensi
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
