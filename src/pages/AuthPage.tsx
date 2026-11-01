import React from 'react';
import { AuthPage as AuthPageComponent } from '../components/AuthPage';
import { useAppContext } from '../layouts/MainLayout';
import { User } from '../types';

interface AuthPageProps {
  initialTab?: 'login' | 'register';
  message?: string;
  redirect?: string;
}

export function AuthPage({ initialTab = 'login', message = '', redirect = '/' }: AuthPageProps) {
  const { lang, setUser } = useAppContext();

  const handleLoginSuccess = (loggedUser: User) => {
    setUser(loggedUser);
    localStorage.setItem('pasaria_user', JSON.stringify(loggedUser));
    window.location.href = redirect || '/';
  };

  return (
    <AuthPageComponent
      initialTab={initialTab}
      message={message}
      lang={lang}
      onNavigateHome={() => {
        window.location.href = '/';
      }}
      onLoginSuccess={handleLoginSuccess}
    />
  );
}

