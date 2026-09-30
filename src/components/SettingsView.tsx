import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Globe,
  Bell,
  Shield,
  KeyRound,
  Smartphone,
  Database,
  Check,
  AlertCircle,
  ChevronRight,
  User as UserIcon,
  Lock,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { User } from '../types';
import { Language, translations } from '../i18n/translations';

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
  onClearCache,
}) => {
  const t = translations[currentLang];
  const [activeTab, setActiveTab] = useState<'general' | 'security' | 'notifications' | 'privacy'>('general');

  // Security Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // 2FA state
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  // Notification state
  const [emailNotif, setEmailNotif] = useState(true);
  const [smsNotif, setSmsNotif] = useState(true);
  const [promoNotif, setPromoNotif] = useState(false);
  const [notifSaved, setNotifSaved] = useState(false);

  // Cache cleared message
  const [cacheCleared, setCacheCleared] = useState(false);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    if (newPassword.length < 6) {
      setPasswordError(currentLang === 'id' ? 'Kata sandi minimal 6 karakter' : 'Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError(currentLang === 'id' ? 'Konfirmasi kata sandi tidak cocok' : 'Passwords do not match');
      return;
    }

    setPasswordSaved(true);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setPasswordSaved(false), 2500);
  };

  const handleSaveNotifications = (e: React.FormEvent) => {
    e.preventDefault();
    setNotifSaved(true);
    setTimeout(() => setNotifSaved(false), 2000);
  };

  const handleTriggerClearCache = () => {
    onClearCache();
    setCacheCleared(true);
    setTimeout(() => setCacheCleared(false), 2500);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-8 py-8 text-left">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">
            <SettingsIcon className="w-4 h-4 text-emerald-700" />
            <span>{t.settingsTitle}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {t.settingsTitle}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {t.settingsSub}
          </p>
        </div>
        <button
          onClick={onNavigateHome}
          className="text-xs font-semibold text-[#003d29] hover:underline cursor-pointer"
        >
          {t.returnToStore}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Sidebar Nav */}
        <div className="md:col-span-4 bg-white rounded-3xl p-4 border border-slate-100 shadow-2xs space-y-1">
          <button
            onClick={() => setActiveTab('general')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'general'
                ? 'bg-[#003d29] text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <Globe className="w-4 h-4" />
              <span>{t.generalTab}</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 opacity-60" />
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'security'
                ? 'bg-[#003d29] text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <Shield className="w-4 h-4" />
              <span>{t.securityTab}</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 opacity-60" />
          </button>

          <button
            onClick={() => setActiveTab('notifications')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'notifications'
                ? 'bg-[#003d29] text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <Bell className="w-4 h-4" />
              <span>{t.notificationsTab}</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 opacity-60" />
          </button>

          <button
            onClick={() => setActiveTab('privacy')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'privacy'
                ? 'bg-[#003d29] text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <Database className="w-4 h-4" />
              <span>{t.privacyTab}</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 opacity-60" />
          </button>
        </div>

        {/* Content Area */}
        <div className="md:col-span-8 bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-2xs">
          {/* TAB 1: General & Language */}
          {activeTab === 'general' && (
            <div className="space-y-6 text-xs">
              <div>
                <h3 className="text-base font-bold text-slate-900 mb-1">{t.appLanguage}</h3>
                <p className="text-slate-500">{t.selectLanguage}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => onLanguageChange('id')}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                    currentLang === 'id'
                      ? 'border-[#003d29] bg-emerald-50/50 ring-2 ring-[#003d29]/20'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🇮🇩</span>
                    <div>
                      <div className="font-bold text-slate-900 text-sm">Bahasa Indonesia</div>
                      <div className="text-[11px] text-slate-400">Indonesian</div>
                    </div>
                  </div>
                  {currentLang === 'id' && (
                    <div className="w-5 h-5 rounded-full bg-[#003d29] text-white flex items-center justify-center text-[10px]">
                      <Check className="w-3 h-3" />
                    </div>
                  )}
                </button>

                <button
                  onClick={() => onLanguageChange('en')}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                    currentLang === 'en'
                      ? 'border-[#003d29] bg-emerald-50/50 ring-2 ring-[#003d29]/20'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🇺🇸</span>
                    <div>
                      <div className="font-bold text-slate-900 text-sm">English</div>
                      <div className="text-[11px] text-slate-400">United States</div>
                    </div>
                  </div>
                  {currentLang === 'en' && (
                    <div className="w-5 h-5 rounded-full bg-[#003d29] text-white flex items-center justify-center text-[10px]">
                      <Check className="w-3 h-3" />
                    </div>
                  )}
                </button>
              </div>

              <div className="border-t border-slate-100 pt-6">
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">{t.currency}</label>
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs flex items-center justify-between">
                  <span>USD ($) — United States Dollar / Official Global</span>
                  <span className="text-[10px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full font-bold">Auto-Sync</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Security & Password */}
          {activeTab === 'security' && (
            <div className="space-y-6 text-xs">
              <div>
                <h3 className="text-base font-bold text-slate-900 mb-1">{t.changePassword}</h3>
                <p className="text-slate-500">{currentLang === 'id' ? 'Jaga keamanan akun Anda dengan kata sandi yang kuat' : 'Protect your account with a secure password'}</p>
              </div>

              {passwordError && (
                <div className="p-3 bg-red-50 text-red-700 rounded-xl flex items-center gap-2 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}

              {passwordSaved && (
                <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl flex items-center gap-2 text-xs">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>{currentLang === 'id' ? 'Kata sandi berhasil diperbarui!' : 'Password updated successfully!'}</span>
                </div>
              )}

              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">{t.currentPassword}</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#003d29]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">{t.newPassword}</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#003d29]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">{t.confirmNewPassword}</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#003d29]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full font-bold text-xs text-white bg-[#003d29] hover:bg-[#064e3b] transition-all cursor-pointer shadow-xs"
                >
                  {t.updatePasswordBtn}
                </button>
              </form>

              <div className="border-t border-slate-100 pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900">{t.twoFactorAuth}</h4>
                    <p className="text-slate-400 text-[11px] mt-0.5">{t.twoFactorDesc}</p>
                  </div>
                  <button
                    onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                      twoFactorEnabled ? 'bg-[#003d29]' : 'bg-slate-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        twoFactorEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-6">
                <h4 className="font-bold text-slate-900 mb-3">{t.activeSessions}</h4>
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Smartphone className="w-5 h-5 text-slate-500" />
                    <div>
                      <div className="font-bold text-slate-800">{t.currentDevice}</div>
                      <div className="text-[10px] text-slate-400">Chrome / Windows · IP 127.0.0.1 (Jakarta)</div>
                    </div>
                  </div>
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded-full">
                    Active
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Notifications */}
          {activeTab === 'notifications' && (
            <form onSubmit={handleSaveNotifications} className="space-y-6 text-xs">
              <div>
                <h3 className="text-base font-bold text-slate-900 mb-1">{t.notificationsTab}</h3>
                <p className="text-slate-500">{currentLang === 'id' ? 'Atur notifikasi pengiriman dan penawaran diskon' : 'Manage how you receive delivery and promotional alerts'}</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <div>
                    <div className="font-bold text-slate-900">{t.notificationsEmail}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{t.notificationsEmailDesc}</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={emailNotif}
                    onChange={(e) => setEmailNotif(e.target.checked)}
                    className="w-4 h-4 accent-[#003d29] cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <div>
                    <div className="font-bold text-slate-900">{t.notificationsSms}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{t.notificationsSmsDesc}</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={smsNotif}
                    onChange={(e) => setSmsNotif(e.target.checked)}
                    className="w-4 h-4 accent-[#003d29] cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <div>
                    <div className="font-bold text-slate-900">{t.notificationsPromo}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{t.notificationsPromoDesc}</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={promoNotif}
                    onChange={(e) => setPromoNotif(e.target.checked)}
                    className="w-4 h-4 accent-[#003d29] cursor-pointer"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full font-bold text-xs text-white bg-[#003d29] hover:bg-[#064e3b] transition-all cursor-pointer flex items-center gap-2"
                >
                  {notifSaved ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>{t.changesSaved}</span>
                    </>
                  ) : (
                    <span>{t.saveChanges}</span>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* TAB 4: Privacy & Data */}
          {activeTab === 'privacy' && (
            <div className="space-y-6 text-xs">
              <div>
                <h3 className="text-base font-bold text-slate-900 mb-1">{t.privacyTab}</h3>
                <p className="text-slate-500">{currentLang === 'id' ? 'Sinkronisasi dan manajemen data penyimpanan' : 'Manage your cached data and database synchronization'}</p>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80">
                <div className="font-bold text-amber-900 mb-1">{t.clearCartData}</div>
                <div className="text-amber-800/80 text-[11px] mb-3">{t.clearCartDataDesc}</div>
                <button
                  onClick={handleTriggerClearCache}
                  className="py-2 px-4 rounded-xl bg-amber-800 text-white font-bold text-xs hover:bg-amber-900 transition-colors cursor-pointer flex items-center gap-2 shadow-xs"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{t.clearDataBtn}</span>
                </button>

                {cacheCleared && (
                  <div className="mt-3 text-emerald-800 font-bold flex items-center gap-1.5 text-xs">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>{currentLang === 'id' ? 'Data berhasil disinkronkan kembali dari database!' : 'Data successfully re-synchronized from database!'}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
