import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MainLayout } from './layouts/MainLayout';
import { HomePage } from './pages/HomePage';
import { ProductPage } from './pages/ProductPage';
import { CategoryPage } from './pages/CategoryPage';
import { SearchPage } from './pages/SearchPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrdersPage } from './pages/OrdersPage';
import { DeliveryPage } from './pages/DeliveryPage';
import { ProfilePage } from './pages/ProfilePage';
import { SettingsPage } from './pages/SettingsPage';
import { WishlistPage } from './pages/WishlistPage';
import { FollowingPage } from './pages/FollowingPage';
import { SellerDashboardPage } from './pages/SellerDashboardPage';
import { ShopProfilePage } from './pages/ShopProfilePage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { AuthPage } from './pages/AuthPage';
import './index.css';

function resolvePageFromPathname(): { page: string; props: Record<string, any> } {
  const path = window.location.pathname;
  const searchParams = new URLSearchParams(window.location.search);

  if (path === '/cart') {
    return { page: 'cart', props: {} };
  }
  if (path === '/checkout') {
    return { page: 'checkout', props: {} };
  }
  if (path === '/orders') {
    return { page: 'orders', props: {} };
  }
  if (path.startsWith('/delivery')) {
    const parts = path.split('/delivery/');
    const code = parts[1] || searchParams.get('code') || '';
    return { page: 'delivery', props: { code } };
  }
  if (path === '/profile') {
    return { page: 'profile', props: {} };
  }
  if (path === '/settings') {
    return { page: 'settings', props: { tab: searchParams.get('tab') || 'profile' } };
  }
  if (path === '/wishlist') {
    return { page: 'wishlist', props: {} };
  }
  if (path === '/following') {
    return { page: 'following', props: {} };
  }
  if (path.startsWith('/seller')) {
    return { page: 'seller_dashboard', props: {} };
  }
  if (path.startsWith('/admin')) {
    return { page: 'admin_dashboard', props: {} };
  }
  if (path.startsWith('/products/')) {
    const slug = path.replace('/products/', '');
    return { page: 'product', props: { slug } };
  }
  if (path.startsWith('/category/')) {
    const slug = path.replace('/category/', '');
    return { page: 'category', props: { slug } };
  }
  if (path === '/deals') {
    return { page: 'category', props: { slug: 'deals', preset: 'deals', categoryName: 'Promo & Deals' } };
  }
  if (path === '/whats-new') {
    return { page: 'category', props: { slug: 'whats-new', preset: 'newest', categoryName: 'Produk Terbaru' } };
  }
  if (path === '/search') {
    return { page: 'search', props: { q: searchParams.get('q') || '', category: searchParams.get('category') || '' } };
  }
  if (path.startsWith('/shops/') || path.startsWith('/shop/')) {
    const slugOrId = path.replace(/^\/(shops|shop)\//, '');
    return { page: 'shop_profile', props: { shopIdOrSlug: slugOrId } };
  }
  if (path === '/login') {
    return {
      page: 'auth',
      props: {
        initialTab: 'login',
        message: searchParams.get('message') || '',
        redirect: searchParams.get('redirect') || '/',
      },
    };
  }
  if (path === '/register') {
    return {
      page: 'auth',
      props: {
        initialTab: 'register',
        message: searchParams.get('message') || '',
        redirect: searchParams.get('redirect') || '/',
      },
    };
  }
  if (path === '/auth') {
    return {
      page: 'auth',
      props: {
        initialTab: (searchParams.get('tab') as 'login' | 'register') || 'login',
        message: searchParams.get('message') || '',
        redirect: searchParams.get('redirect') || '/',
      },
    };
  }

  return {
    page: 'home',
    props: {
      initialQuery: searchParams.get('q') || '',
      initialCategory: searchParams.get('category') || 'all',
    },
  };
}

function renderPageComponent(page: string, props: Record<string, any>) {
  switch (page) {
    case 'home':
      return <HomePage {...props} />;
    case 'product':
      return <ProductPage slug={props.slug} initialProduct={props.initialProduct} />;
    case 'category':
      return <CategoryPage slug={props.slug} categoryName={props.categoryName} preset={props.preset} />;
    case 'search':
      return <SearchPage q={props.q} category={props.category} />;
    case 'cart':
      return <CartPage />;
    case 'checkout':
      return <CheckoutPage />;
    case 'orders':
      return <OrdersPage />;
    case 'delivery':
      return <DeliveryPage code={props.code} />;
    case 'profile':
      return <ProfilePage />;
    case 'settings':
      return <SettingsPage tab={props.tab} />;
    case 'wishlist':
      return <WishlistPage />;
    case 'following':
      return <FollowingPage />;
    case 'seller_dashboard':
      return <SellerDashboardPage />;
    case 'shop_profile':
      return <ShopProfilePage shopIdOrSlug={props.shopIdOrSlug} initialShop={props.initialShop} />;
    case 'admin_dashboard':
      return <AdminDashboardPage />;
    case 'auth':
      return <AuthPage initialTab={props.initialTab} message={props.message} redirect={props.redirect} />;
    default:
      return <HomePage {...props} />;
  }
}

function initPasariaMPA() {
  const rootElement = document.getElementById('pasaria-root') || document.getElementById('root');
  if (!rootElement) {
    return;
  }

  let pageName = rootElement.dataset.page;
  let pageProps: Record<string, any> = {};

  if (rootElement.dataset.props) {
    try {
      pageProps = JSON.parse(rootElement.dataset.props);
    } catch (e) {
      console.warn('Failed to parse pageProps from dataset:', e);
    }
  }

  if (!pageName) {
    const resolved = resolvePageFromPathname();
    pageName = resolved.page;
    pageProps = { ...resolved.props, ...pageProps };
  }

  createRoot(rootElement).render(
    <StrictMode>
      <MainLayout page={pageName}>
        {renderPageComponent(pageName, pageProps)}
      </MainLayout>
    </StrictMode>,
  );
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPasariaMPA);
} else {
  initPasariaMPA();
}
