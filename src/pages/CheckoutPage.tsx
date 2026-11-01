import React from 'react';
import { CheckoutPage as CheckoutPageComponent } from '../components/CheckoutPage';
import { useAppContext } from '../layouts/MainLayout';
import { api } from '../services/api';

export function CheckoutPage() {
  const { user, cartItems, cartSubtotal, setCartItems, setActiveShipment } = useAppContext();

  return (
    <CheckoutPageComponent
      items={cartItems}
      user={user}
      subtotal={cartSubtotal}
      onBack={() => {
        window.location.href = cartItems.length > 0 ? '/cart' : '/';
      }}
      onOrderSuccess={async (_orderNum, shipment, openDeliveryView) => {
        setCartItems([]);
        localStorage.removeItem('pasaria_cart');
        if (user) {
          try {
            await api.clearCart(user.id);
          } catch (_) {}
        }
        if (shipment) {
          setActiveShipment(shipment);
          localStorage.setItem('pasaria_active_shipment', JSON.stringify(shipment));
        }
        if (openDeliveryView !== false) {
          window.location.href = '/delivery';
        } else {
          window.location.href = '/orders';
        }
      }}
      onNavigateHome={() => {
        window.location.href = '/';
      }}
    />
  );
}

