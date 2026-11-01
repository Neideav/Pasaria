import React from 'react';
import { SettingsView } from '../components/SettingsView';
import { useAppContext } from '../layouts/MainLayout';

interface SettingsPageProps {
  tab?: string;
}

export function SettingsPage({ tab: _initialTab }: SettingsPageProps) {
  const { user, setUser, lang, setLang, handleLogout } = useAppContext();

  return (
    <SettingsView
      user={user}
      currentLang={lang}
      onLanguageChange={setLang}
      onNavigateHome={() => {
        window.location.href = '/';
      }}
      onClearCache={() => {
        window.location.reload();
      }}
      onUpdateUser={(updated) => {
        setUser(updated);
        localStorage.setItem('pasaria_user', JSON.stringify(updated));
      }}
      onOpenShopDashboard={() => {
        window.location.href = '/seller/dashboard';
      }}
      onNavigateProduct={(slug) => {
        window.location.href = '/products/' + slug;
      }}
      onNavigateShop={(shopIdOrSlug) => {
        window.location.href = '/shops/' + shopIdOrSlug;
      }}
      onSearchQuery={(q) => {
        window.location.href = '/search?q=' + encodeURIComponent(q);
      }}
      onLogout={handleLogout}
    />
  );
}

