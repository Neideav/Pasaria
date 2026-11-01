import React from 'react';
import { CartPage as CartPageComponent } from '../components/CartPage';
import { useAppContext } from '../layouts/MainLayout';

export function CartPage() {
  const { user, cartItems, handleUpdateCartQuantity, handleRemoveCartItem } = useAppContext();

  return (
    <CartPageComponent
      items={cartItems}
      onUpdateQuantity={handleUpdateCartQuantity}
      onRemoveItem={handleRemoveCartItem}
      onProceedToCheckout={() => {
        if (!user) {
          window.location.href = '/login?message=' + encodeURIComponent('Silakan masuk ke akun Anda untuk menyelesaikan proses pembayaran.');
        } else {
          window.location.href = '/checkout';
        }
      }}
      onContinueShopping={() => {
        window.location.href = '/';
      }}
    />
  );
}

