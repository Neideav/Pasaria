import React from 'react';
import { FollowingShopsView } from '../components/FollowingShopsView';

export function FollowingPage() {
  return (
    <FollowingShopsView
      onNavigateHome={() => {
        window.location.href = '/';
      }}
      onViewShop={(shopName, shopId) => {
        window.location.href = '/shops/' + (shopId || shopName);
      }}
    />
  );
}

