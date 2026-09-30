import React, { useState, useEffect } from 'react';
import { TopBar } from './components/TopBar';
import { Navbar } from './components/Navbar';
import { HeroBanner } from './components/HeroBanner';
import { ProductFilterBar } from './components/ProductFilterBar';
import { ProductCard } from './components/ProductCard';
import { ProductDetailPage } from './components/ProductDetailPage';
import { ServicesSection } from './components/ServicesSection';
import { Footer } from './components/Footer';
import { CheckoutModal } from './components/CheckoutModal';
import { CartPage } from './components/CartPage';
import { SearchPage } from './components/SearchPage';
import { AuthModal } from './components/AuthModal';
import { ProfileView } from './components/ProfileView';
import { OrdersView } from './components/OrdersView';
import { Product, CartItem, User, Order } from './types';
import { api } from './services/api';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function App() {
  const [view, setView] = useState<'home' | 'product' | 'search' | 'category' | 'cart' | 'profile' | 'orders'>('home');
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('shopcart_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('shopcart_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [authMessage, setAuthMessage] = useState<string>('');
  const [pendingCartAction, setPendingCartAction] = useState<{
    type: 'add' | 'buy';
    product: Product;
    quantity: number;
    color?: string;
  } | null>(null);

  const [orders, setOrders] = useState<Order[]>([]);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);

  // Sync cart items to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('shopcart_cart', JSON.stringify(cartItems));
    } catch {}
  }, [cartItems]);

  // Filter & pagination state
  const [filters, setFilters] = useState({
    category: 'all',
    minPrice: 0,
    maxPrice: 999999,
    minRating: 0,
    sort: 'popular',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 8;

  // Load products on mount
  useEffect(() => {
    loadProducts();
    loadOrders();
  }, [filters, searchQuery, activeCategory]);

  const loadProducts = async () => {
    try {
      const res = await api.getProducts({
        q: searchQuery,
        category: activeCategory !== 'all' ? activeCategory : undefined,
        sort: filters.sort,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
        minRating: filters.minRating,
      });
      setProducts(res.products);
    } catch (err) {
      console.error('Failed to load products:', err);
    }
  };

  const loadOrders = async () => {
    try {
      const data = await api.getOrders();
      setOrders(data);
    } catch (err) {
      console.error('Failed to load orders:', err);
    }
  };

  // Navigation handlers
  const handleNavigateHome = () => {
    setSearchQuery('');
    setActiveCategory('all');
    setView('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectProduct = async (product: Product) => {
    try {
      const data = await api.getProductBySlug(product.slug);
      setSelectedProduct(data.product);
      setRelatedProducts(data.related);
      setView('product');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {
      setSelectedProduct(product);
      setView('product');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNavigateSearch = (q: string) => {
    setSearchQuery(q);
    setView('search');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateCategory = (catName: string) => {
    if (catName === 'Deals') {
      setFilters((prev) => ({ ...prev, minPrice: 0, maxPrice: 150 }));
      setActiveCategory('all');
    } else if (catName === 'What\'s New') {
      setFilters((prev) => ({ ...prev, sort: 'newest' }));
      setActiveCategory('all');
    } else if (catName === 'Delivery') {
      window.scrollTo({ top: 600, behavior: 'smooth' });
      return;
    } else {
      setActiveCategory(catName);
    }
    setView('category');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Cart operations
  const handleAddToCart = (product: Product, quantity = 1, color?: string): boolean => {
    if (!user) {
      setAuthMessage('Please sign in or create an account to add items to your cart.');
      setPendingCartAction({ type: 'add', product, quantity, color });
      setAuthModalOpen(true);
      return false;
    }

    setCartItems((prev) => {
      const existingIdx = prev.findIndex(
        (item) => item.product.id === product.id && item.selectedColor === color
      );
      if (existingIdx > -1) {
        const next = [...prev];
        next[existingIdx].quantity += quantity;
        return next;
      }
      return [...prev, { product, quantity, selectedColor: color }];
    });
    return true;
  };

  const handleBuyNow = (product: Product, quantity = 1, color?: string) => {
    if (!user) {
      setAuthMessage('Please sign in or create an account to proceed with purchase.');
      setPendingCartAction({ type: 'buy', product, quantity, color });
      setAuthModalOpen(true);
      return;
    }
    handleAddToCart(product, quantity, color);
    setCheckoutModalOpen(true);
  };

  const handleLoginSuccess = (loggedUser: User) => {
    setUser(loggedUser);
    try {
      localStorage.setItem('shopcart_user', JSON.stringify(loggedUser));
    } catch {}

    if (pendingCartAction) {
      const { type, product, quantity, color } = pendingCartAction;
      setCartItems((prev) => {
        const existingIdx = prev.findIndex(
          (item) => item.product.id === product.id && item.selectedColor === color
        );
        if (existingIdx > -1) {
          const next = [...prev];
          next[existingIdx].quantity += quantity;
          return next;
        }
        return [...prev, { product, quantity, selectedColor: color }];
      });

      if (type === 'buy') {
        setCheckoutModalOpen(true);
      }
      setPendingCartAction(null);
    }
  };

  const handleLogout = () => {
    setUser(null);
    try {
      localStorage.removeItem('shopcart_user');
    } catch {}
    handleNavigateHome();
  };

  const handleUpdateCartQuantity = (productId: number, qty: number) => {
    if (qty <= 0) {
      handleRemoveCartItem(productId);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity: qty } : item
      )
    );
  };

  const handleRemoveCartItem = (productId: number) => {
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const cartSubtotal = cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);

  // Pagination slicing for Home page
  const totalPages = Math.ceil(products.length / productsPerPage) || 1;
  const currentProducts = products.slice(
    (currentPage - 1) * productsPerPage,
    currentPage * productsPerPage
  );

  // Weekly popular slice (items 12 to 16)
  const weeklyProducts = products.slice(12, 16);

  return (
    <div className="min-h-screen flex flex-col bg-[#fcfcfc] text-[#1c2a23]">
      {/* 1. Promotional Top Bar */}
      <TopBar
        onShopNow={() => {
          setView('home');
          window.scrollTo({ top: 400, behavior: 'smooth' });
        }}
      />

      {/* 2. Main Sticky Navbar */}
      <Navbar
        user={user}
        cartCount={cartCount}
        onNavigateHome={handleNavigateHome}
        onNavigateCategory={handleNavigateCategory}
        onNavigateSearch={handleNavigateSearch}
        onNavigateCart={() => {
          setView('cart');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onNavigateProfile={() => {
          if (!user) {
            setAuthMessage('Please sign in to view your profile.');
            setAuthModalOpen(true);
          } else {
            setView('profile');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }}
        onNavigateOrders={() => {
          if (!user) {
            setAuthMessage('Please sign in to view your order history.');
            setAuthModalOpen(true);
          } else {
            setView('orders');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }}
        onOpenAuth={() => {
          setAuthMessage('');
          setAuthModalOpen(true);
        }}
        onLogout={handleLogout}
        products={products}
      />

      {/* 3. Dynamic Page View Router */}
      <main className="flex-1">
        {view === 'home' && (
          <div>
            {/* Hero Promotional Banner */}
            <HeroBanner
              onBuyNow={() => {
                if (products.length > 0) {
                  handleSelectProduct(products[0]);
                }
              }}
            />

            {/* Pill Filters Bar */}
            <ProductFilterBar
              filters={filters}
              onChangeFilters={(f) => setFilters((prev) => ({ ...prev, ...f }))}
              onResetFilters={() =>
                setFilters({
                  category: 'all',
                  minPrice: 0,
                  maxPrice: 999999,
                  minRating: 0,
                  sort: 'popular',
                })
              }
            />

            {/* Main Product Grid: "Headphones For You!" */}
            <section className="max-w-7xl mx-auto px-4 sm:px-8 py-8 text-left">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                  Headphones For You!
                </h2>
              </div>

              {currentProducts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {currentProducts.map((p) => (
                    <ProductCard
                      key={p.id}
                      product={p}
                      onSelect={handleSelectProduct}
                      onAddToCart={(prod, e) => handleAddToCart(prod, 1)}
                    />
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-slate-500 text-sm">
                  No products match the selected filters.
                </div>
              )}

              {/* Numbered Pagination (1, 2, 3 > as shown in video) */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-10">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 disabled:opacity-30 cursor-pointer text-xs"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {Array.from({ length: totalPages }).map((_, idx) => {
                    const pageNum = idx + 1;
                    const isActive = currentPage === pageNum;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-9 h-9 rounded-full text-xs font-bold transition-all cursor-pointer ${
                          isActive
                            ? 'bg-[#003d29] text-white shadow-xs'
                            : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 disabled:opacity-30 cursor-pointer text-xs"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </section>

            {/* Weekly Popular Products Section (matching image 2 & video 0:08) */}
            {weeklyProducts.length > 0 && (
              <section className="max-w-7xl mx-auto px-4 sm:px-8 py-8 text-left border-t border-slate-100">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                    Weekly Popular Products
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {weeklyProducts.map((p) => (
                    <ProductCard
                      key={`weekly-${p.id}`}
                      product={p}
                      onSelect={handleSelectProduct}
                      onAddToCart={(prod, e) => handleAddToCart(prod, 1)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Services Section ("Services To Help You Shop") */}
            <ServicesSection
              onLearnMore={(serviceTitle) => {
                if (serviceTitle.includes('Payment')) {
                  setView('cart');
                } else {
                  window.scrollTo({ top: 400, behavior: 'smooth' });
                }
              }}
            />
          </div>
        )}

        {view === 'product' && selectedProduct && (
          <ProductDetailPage
            product={selectedProduct}
            relatedProducts={relatedProducts}
            onAddToCart={handleAddToCart}
            onBuyNow={handleBuyNow}
            onSelectProduct={handleSelectProduct}
            onBackToHome={handleNavigateHome}
          />
        )}

        {(view === 'search' || view === 'category') && (
          <SearchPage
            query={searchQuery}
            category={activeCategory !== 'all' ? activeCategory : undefined}
            products={products}
            onSelectProduct={handleSelectProduct}
            onAddToCart={(p) => handleAddToCart(p, 1)}
            onBackToHome={handleNavigateHome}
            filters={filters}
            onChangeFilters={(f) => setFilters((prev) => ({ ...prev, ...f }))}
            onResetFilters={() =>
              setFilters({
                category: 'all',
                minPrice: 0,
                maxPrice: 999999,
                minRating: 0,
                sort: 'popular',
              })
            }
          />
        )}

        {view === 'cart' && (
          <CartPage
            items={cartItems}
            onUpdateQuantity={handleUpdateCartQuantity}
            onRemoveItem={handleRemoveCartItem}
            onProceedToCheckout={() => {
              if (!user) {
                setAuthMessage('Please sign in or create an account to proceed to checkout.');
                setAuthModalOpen(true);
              } else {
                setCheckoutModalOpen(true);
              }
            }}
            onContinueShopping={handleNavigateHome}
          />
        )}

        {view === 'profile' && (
          <ProfileView
            user={user}
            onUpdateUser={(updated) => {
              setUser(updated);
              try {
                localStorage.setItem('shopcart_user', JSON.stringify(updated));
              } catch {}
            }}
            onNavigateHome={handleNavigateHome}
          />
        )}

        {view === 'orders' && (
          <OrdersView
            orders={orders}
            onNavigateHome={handleNavigateHome}
            onSelectProductBySlug={async (slug) => {
              try {
                const data = await api.getProductBySlug(slug);
                setSelectedProduct(data.product);
                setRelatedProducts(data.related);
                setView('product');
              } catch (_) {}
            }}
          />
        )}
      </main>

      {/* 4. Checkout Modal & Order Placement */}
      <CheckoutModal
        items={cartItems}
        user={user}
        isOpen={checkoutModalOpen}
        onClose={() => setCheckoutModalOpen(false)}
        onOrderSuccess={(orderNum) => {
          loadOrders();
          setCartItems([]);
        }}
        subtotal={cartSubtotal}
      />

      {/* 5. Authentication Modal */}
      <AuthModal
        isOpen={authModalOpen}
        message={authMessage}
        onClose={() => {
          setAuthModalOpen(false);
          setAuthMessage('');
        }}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* 6. Clean Minimal Footer */}
      <Footer />
    </div>
  );
}
