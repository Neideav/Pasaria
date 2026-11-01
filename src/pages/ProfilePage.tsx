import React from 'react';
import { ProfileView } from '../components/ProfileView';
import { useAppContext } from '../layouts/MainLayout';

export function ProfilePage() {
  const { user, setUser } = useAppContext();

  return (
    <ProfileView
      user={user}
      onUpdateUser={(updated) => {
        setUser(updated);
        localStorage.setItem('pasaria_user', JSON.stringify(updated));
      }}
      onNavigateHome={() => {
        window.location.href = '/';
      }}
    />
  );
}

