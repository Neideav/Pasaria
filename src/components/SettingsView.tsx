import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  User as UserIcon,
  MapPin,
  Shield,
  Bell,
  Lock,
  Globe,
  ArrowLeft,
  Sliders,
  BellRing,
  History,
  Store,
  Eye,
} from 'lucide-react';
import { User } from '../types';
import { Language, translations } from '../i18n/translations';
import { AccountProfileTab } from './settings/AccountProfileTab';
import { AddressesTab } from './settings/AddressesTab';
import { SecurityTab } from './settings/SecurityTab';
import { NotificationsTab } from './settings/NotificationsTab';
import { PrivacyTab } from './settings/PrivacyTab';
import { AppearanceTab } from './settings/AppearanceTab';
import { ShoppingPreferencesTab } from './settings/ShoppingPreferencesTab';
import { ProductAlertsTab } from './settings/ProductAlertsTab';
import { ActivityHistoryTab } from './settings/ActivityHistoryTab';
import { MarketplaceControlsTab } from './settings/MarketplaceControlsTab';
import { SellerPreferencesTab } from './settings/SellerPreferencesTab';

interface SettingsViewProps {
  user: User | null;
  currentLang: Language;
  onLanguageChange: (lang: Language) => void;
  onNavigateHome: () => void;
  onClearCache: () => void;
  onUpdateUser?: (updated: User) => void;
  onOpenShopDashboard?: () => void;
  onNavigateProduct?: (slug: string) => void;
  onNavigateShop?: (shopIdOrSlug: string | number) => void;
  onSearchQuery?: (query: string) => void;
  onLogout?: () => void;
}

export type SettingsTabId =
  | 'profile'
  | 'addresses'
  | 'security'
  | 'notifications'
  | 'shopping'
  | 'alerts'
  | 'activity'
  | 'marketplace'
  | 'privacy'
  | 'appearance'
  | 'seller';

export const SettingsView: React.FC<SettingsViewProps> = ({
  user,
  currentLang,
  onLanguageChange,
  onNavigateHome,
  onClearCache,
  onUpdateUser,
  onOpenShopDashboard,
  onNavigateProduct,
  onNavigateShop,
  onSearchQuery,
  onLogout,
}) => {
  const t = translations[currentLang];
  const [activeTab, setActiveTab] = useState<SettingsTabId>('profile');

  const isSellerOrAdmin = user?.role === 'seller' || user?.role === 'admin';

  const navigationTabs: Array<{
    id: SettingsTabId;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    description: string;
  }> = [
    {
      id: 'profile',
      label: t.accountProfileTab || 'Akun & Profil',
      icon: UserIcon,
      description: 'Data diri, avatar, dan verifikasi email',
    },
    {
      id: 'addresses',
      label: t.addressesTab || 'Buku Alamat',
      icon: MapPin,
      description: 'Daftar alamat pengiriman checkout',
    },
    {
      id: 'security',
      label: t.securityTab || 'Keamanan & Login',
      icon: Shield,
      description: 'Kata sandi, sesi login, dan 2FA',
    },
    {
      id: 'notifications',
      label: t.notificationsTab || 'Notifikasi & Jam Tenang',
      icon: Bell,
      description: 'Preferensi inbox, email, dan jam istirahat',
    },
    {
      id: 'shopping',
      label: t.shoppingPreferencesTab || 'Preferensi Belanja',
      icon: Sliders,
      description: 'Kategori favorit, brand, dan filter katalog',
    },
    {
      id: 'alerts',
      label: t.productAlertsTab || 'Pantau Produk & Harga',
      icon: BellRing,
      description: 'Notifikasi harga turun dan ketersediaan stok',
    },
    {
      id: 'activity',
      label: t.activityHistoryTab || 'Riwayat Aktivitas',
      icon: History,
      description: 'Pencarian terakhir dan produk yang dilihat',
    },
    {
      id: 'marketplace',
      label: t.marketplaceControlsTab || 'Interaksi Toko',
      icon: Store,
      description: 'Toko yang diikuti dan ulasan anonim',
    },
    {
      id: 'privacy',
      label: t.privacyTab || 'Privasi & Data',
      icon: Lock,
      description: 'Personalisasi, unduh data, dan hapus akun',
    },
    {
      id: 'appearance',
      label: t.appearanceTab || 'Tampilan & Aksesibilitas',
      icon: Globe,
      description: 'Tema gelap/terang, ukuran teks, dan bahasa',
    },
    ...(isSellerOrAdmin
      ? [
          {
            id: 'seller' as SettingsTabId,
            label: t.sellerPreferencesTab || 'Preferensi Penjual',
            icon: Store,
            description: 'Batas stok menipis dan mode libur toko',
          },
        ]
      : []),
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-left space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs uppercase tracking-wider mb-1">
            <SettingsIcon className="w-4 h-4 text-emerald-700" />
            <span>{t.settingsTitle || 'Pengaturan Akun'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Akun & Preferensi Marketplace
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            {t.settingsSub || 'Kelola profil, keamanan, alamat pengiriman, dan preferensi akun PASARIA Anda.'}
          </p>
        </div>

        <button
          type="button"
          onClick={onNavigateHome}
          className="inline-flex items-center gap-1.5 min-h-[44px] px-3.5 py-2 text-xs font-bold text-[#003d29] hover:bg-emerald-50 rounded-xl transition-colors cursor-pointer motion-press active:scale-[0.96] self-start sm:self-center"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Beranda</span>
        </button>
      </div>

      {/* Main Settings Layout: Responsive Sidebar Tabs on Desktop, Pill bar on Mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Navigation Column */}
        <aside className="lg:col-span-1" aria-label="Navigasi Pengaturan">
          {/* Mobile Horizontal Pill Scroll */}
          <div className="flex lg:hidden overflow-x-auto pb-2 gap-2 no-scrollbar scroll-smooth" role="tablist">
            {navigationTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`panel-${tab.id}`}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 min-h-[44px] px-4 py-2.5 rounded-full font-bold text-xs whitespace-nowrap transition-all cursor-pointer shrink-0 motion-press active:scale-[0.96] ${
                    isActive
                      ? 'bg-[#003d29] text-white shadow-xs'
                      : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Desktop Vertical Sidebar */}
          <div className="hidden lg:flex flex-col gap-1.5 bg-white p-3 rounded-3xl border border-slate-200/80 shadow-2xs" role="tablist">
            {navigationTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`panel-${tab.id}`}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full text-left p-3.5 rounded-2xl transition-all cursor-pointer flex items-start gap-3 min-h-[48px] motion-press active:scale-[0.98] ${
                    isActive
                      ? 'bg-emerald-50/70 border border-emerald-300/80 text-[#003d29] shadow-2xs'
                      : 'hover:bg-slate-50 text-slate-600 border border-transparent'
                  }`}
                >
                  <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                    isActive ? 'bg-[#003d29] text-white' : 'bg-slate-100 text-slate-500'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className={`text-xs font-extrabold ${isActive ? 'text-[#003d29]' : 'text-slate-900'}`}>
                      {tab.label}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                      {tab.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Panel Content Column */}
        <main className="lg:col-span-3 min-w-0" id={`panel-${activeTab}`} role="tabpanel">
          {activeTab === 'profile' && (
            <AccountProfileTab
              user={user}
              onUpdateUser={onUpdateUser}
              onOpenShopDashboard={onOpenShopDashboard}
            />
          )}

          {activeTab === 'addresses' && (
            <AddressesTab />
          )}

          {activeTab === 'security' && (
            <SecurityTab
              user={user}
              onUpdateUser={onUpdateUser}
              onLogout={onLogout}
            />
          )}

          {activeTab === 'notifications' && (
            <NotificationsTab />
          )}

          {activeTab === 'shopping' && (
            <ShoppingPreferencesTab />
          )}

          {activeTab === 'alerts' && (
            <ProductAlertsTab
              onNavigateProduct={onNavigateProduct}
            />
          )}

          {activeTab === 'activity' && (
            <ActivityHistoryTab
              onSearchQuery={onSearchQuery}
              onNavigateProduct={onNavigateProduct}
            />
          )}

          {activeTab === 'marketplace' && (
            <MarketplaceControlsTab
              onNavigateShop={onNavigateShop}
            />
          )}

          {activeTab === 'privacy' && (
            <PrivacyTab
              onLogoutAndNavigateHome={onNavigateHome}
            />
          )}

          {activeTab === 'appearance' && (
            <AppearanceTab
              currentLang={currentLang}
              onLanguageChange={onLanguageChange}
              onClearCache={onClearCache}
            />
          )}

          {activeTab === 'seller' && isSellerOrAdmin && (
            <SellerPreferencesTab
              onOpenShopDashboard={onOpenShopDashboard}
            />
          )}
        </main>
      </div>
    </div>
  );
};
