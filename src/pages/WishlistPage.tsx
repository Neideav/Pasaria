import React from 'react';
import { WishlistView } from '../components/WishlistView';
import { useAppContext } from '../layouts/MainLayout';

export function WishlistPage() {
  const { handleAddToCart } = useAppContext();

  return (
    <WishlistView
      onNavigateHome={() => {
        window.location.href = '/';
      }}
      onSelectProduct={(p) => {
        window.location.href = '/products/' + p.slug;
      }}
      onAddToCart={(p) => {
        handleAddToCart(p, 1);
      }}
    />
  );
}

