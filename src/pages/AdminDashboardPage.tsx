import React from 'react';
import { AdminDashboardView } from '../components/AdminDashboardView';

export function AdminDashboardPage() {
  return (
    <AdminDashboardView
      onNavigateHome={() => {
        window.location.href = '/';
      }}
    />
  );
}

