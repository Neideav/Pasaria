import React, { useState, useEffect } from 'react';
import { OrdersView } from '../components/OrdersView';
import { Order, Product } from '../types';
import { api } from '../services/api';
import { useAppContext } from '../layouts/MainLayout';

export function OrdersPage() {
  const { user, handleAddToCart, openReview, openReturn } = useAppContext();

  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    if (user?.id) {
      loadOrders(user.id);
    }
    loadProducts();
  }, [user?.id]);

  const loadOrders = async (userId: number) => {
    try {
      const data = await api.getOrders(userId);
      setOrders(data || []);
    } catch (err) {
      console.error('Failed to load orders:', err);
    }
  };

  const loadProducts = async () => {
    try {
      const res = await api.getProducts();
      setProducts(res.products || []);
    } catch (_) {}
  };

  return (
    <OrdersView
      orders={orders}
      onNavigateHome={() => {
        window.location.href = '/';
      }}
      onRefreshOrders={() => {
        if (user?.id) loadOrders(user.id);
      }}
      onSelectProductBySlug={(slug) => {
        window.location.href = '/products/' + slug;
      }}
      onTrackDelivery={() => {
        window.location.href = '/delivery';
      }}
      onOpenReviewModal={(item, orderId) => {
        openReview({
          productId: item.product_id || 1,
          productName: item.product_name || item.name || 'Produk',
          orderId: orderId,
          orderItemId: item.id,
        });
      }}
      onOpenReturnModal={(order) => {
        openReturn(order);
      }}
      onBuyAgain={(items) => {
        items.forEach((i) => {
          const p = products.find((prod) => prod.id === i.product_id);
          if (p) handleAddToCart(p, i.quantity, i.color);
        });
        window.location.href = '/cart';
      }}
    />
  );
}
