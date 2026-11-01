import React, { useState, useEffect } from 'react';
import { ShopDashboardView } from '../components/ShopDashboardView';
import { Product } from '../types';
import { api } from '../services/api';
import { useAppContext } from '../layouts/MainLayout';

export function SellerDashboardPage() {
  const { user, setUser } = useAppContext();

  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const res = await api.getProducts();
      setProducts(res.products || []);
    } catch (err) {
      console.warn('Failed to load seller products:', err);
    }
  };

  const handleAddProduct = async (newProduct: Product) => {
    setProducts((prev) => [newProduct, ...prev]);
  };

  const handleUpdateProduct = async (updatedProduct: Product) => {
    setProducts((prev) => prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p)));
  };

  const handleDeleteProduct = async (productId: number) => {
    try {
      await api.deleteProduct(productId);
    } catch (err) {
      console.warn('API deleteProduct error:', err);
    }
    setProducts((prev) => prev.filter((p) => String(p.id) !== String(productId)));
  };

  return (
    <ShopDashboardView
      user={user}
      products={products}
      onUpdateUser={(updated) => {
        setUser(updated);
        localStorage.setItem('pasaria_user', JSON.stringify(updated));
      }}
      onAddProduct={handleAddProduct}
      onUpdateProduct={handleUpdateProduct}
      onDeleteProduct={handleDeleteProduct}
      onNavigateHome={() => {
        window.location.href = '/';
      }}
      onSelectProduct={(p) => {
        window.location.href = '/products/' + p.slug;
      }}
      onViewShopPublic={(shop) => {
        window.location.href = '/shops/' + (shop.slug || shop.id);
      }}
    />
  );
}
