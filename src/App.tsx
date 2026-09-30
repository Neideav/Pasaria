import React, { useState, useEffect } from 'react';
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
import { DeliveryView } from './components/DeliveryView';
import { ShopDashboardView } from './components/ShopDashboardView';
import { ShopProfileView } from './components/ShopProfileView';
import { SettingsView } from './components/SettingsView';
import { Product, CartItem, User, Order, DeliveryShipment, Shop } from './types';
import { api } from './services/api';
import { Language, translations } from './i18n/translations';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function App() {
  const [view, setView] = useState<'home' | 'product' | 'search' | 'category' | 'cart' | 'profile' | 'orders' | 'delivery' | 'shop_dashboard' | 'shop_profile' | 'settings'>('home');
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedShopProfile, setSelectedShopProfile] = useState<Shop | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  const [lang, setLang] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('shopcart_lang');
      return (saved === 'en' || saved === 'id') ? saved : 'id';
    } catch {
      return 'id';
    }
  });

  const t = translations[lang];

  const handleLanguageChange = (newLang: Language) => {
    setLang(newLang);
    try {
      localStorage.setItem('shopcart_lang', newLang);
    } catch {}
  };

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

  const [activeShipment, setActiveShipment] = useState<DeliveryShipment | null>(() => {
    try {
      const saved = localStorage.getItem('shopcart_active_shipment');
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

  // Sync active shipment to localStorage
  useEffect(() => {
    if (activeShipment) {
      try {
        localStorage.setItem('shopcart_active_shipment', JSON.stringify(activeShipment));
      } catch {}
    }
  }, [activeShipment]);

  // Sync cart items to database & localStorage
  const syncCartToDatabase = async (items: CartItem[], currentUid?: number) => {
    const uid = currentUid || user?.id || 1;
    try {
      localStorage.setItem('shopcart_cart', JSON.stringify(items));
      if (user) {
        await api.syncCart(uid, items);
      }
    } catch (e) {
      console.warn('Cart sync note:', e);
    }
  };

  const loadCartFromDatabase = async (uid: number) => {
    try {
      const dbItems = await api.getCart(uid);
      if (dbItems && Array.isArray(dbItems) && dbItems.length > 0) {
        setCartItems(dbItems);
        localStorage.setItem('shopcart_cart', JSON.stringify(dbItems));
      }
    } catch (e) {
      console.warn('Load cart from db note:', e);
    }
  };

  const loadDeliveriesFromDatabase = async (uid: number) => {
    try {
      const shipments = await api.getDeliveries(uid);
      if (shipments && shipments.length > 0 && !activeShipment) {
        setActiveShipment(shipments[0]);
      }
    } catch (e) {
      console.warn('Load deliveries note:', e);
    }
  };

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

  // Load products when filters/search change
  useEffect(() => {
    loadProducts();
  }, [filters, searchQuery, activeCategory]);

  // Load orders and user-specific data on mount/login
  useEffect(() => {
    loadOrders();
    if (user) {
      loadCartFromDatabase(user.id);
      loadDeliveriesFromDatabase(user.id);
    }
  }, [user?.id]);

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
      setView('category');
    } else if (catName === 'What\'s New') {
      setFilters((prev) => ({ ...prev, sort: 'newest' }));
      setActiveCategory('all');
      setView('category');
    } else if (catName === 'Delivery') {
      setView('delivery');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    } else {
      setActiveCategory(catName);
      setView('category');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateShop = () => {
    if (!user) {
      setAuthMessage('Silakan masuk atau buat akun untuk membuka dan mengelola toko Anda.');
      setAuthModalOpen(true);
      return;
    }
    setView('shop_dashboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleViewShopPublic = (shopName: string, shopId?: number) => {
    if (user?.shop && (user.shop.name === shopName || user.shop.id === shopId)) {
      setSelectedShopProfile(user.shop);
    } else {
      setSelectedShopProfile({
        id: shopId || 99,
        user_id: 0,
        name: shopName,
        slug: shopName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        slogan: 'Penyedia Produk Original & Terpercaya',
        city: 'Jakarta Pusat',
        phone: '+62 812-8888-9999',
        description: `Selamat datang di ${shopName}! Kami menyediakan berbagai produk audio, aksesoris, dan gadget original dengan garansi resmi dan pengiriman super cepat.`,
        logo: '',
        banner: '',
        rating: 5.0,
        review_count: 128,
        verified: true
      });
    }
    setView('shop_profile');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCreateShop = async (shopData: Partial<Shop>) => {
    if (!user) return;
    const newShop: Shop = {
      id: Date.now(),
      user_id: user.id,
      name: shopData.name || 'My Store',
      slug: (shopData.name || 'my-store').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      slogan: shopData.slogan || '',
      city: shopData.city || 'Jakarta',
      phone: shopData.phone || user.phone || '',
      description: shopData.description || '',
      logo: shopData.logo || '',
      banner: shopData.banner || '',
      rating: 5.0,
      review_count: 0,
      verified: true,
      created_at: new Date().toISOString()
    };

    try {
      await api.createShop(newShop);
    } catch (err) {
      console.warn('API createShop note:', err);
    }

    const updatedUser: User = {
      ...user,
      shop: newShop
    };
    setUser(updatedUser);
    try {
      localStorage.setItem('shopcart_user', JSON.stringify(updatedUser));
    } catch {}
  };

  const handleAddProduct = async (productData: Partial<Product>) => {
    const rawPrice = Number(productData.price) || 99;
    const discount = productData.discount_percent ? Number(productData.discount_percent) : 0;
    const newProduct: Product = {
      id: Date.now(),
      title: productData.title || productData.name || 'Produk Baru',
      name: productData.name || productData.title || 'Produk Baru',
      slug: ((productData.name || productData.title || 'produk').toLowerCase().replace(/[^a-z0-9]+/g, '-')) + '-' + Date.now(),
      category: productData.category || 'Headphones',
      price: rawPrice,
      original_price: discount > 0 ? Number((rawPrice * (1 + discount / 100)).toFixed(2)) : undefined,
      discount_percent: discount > 0 ? discount : undefined,
      rating: 5.0,
      review_count: 1,
      stock: Number(productData.stock) || 20,
      description: productData.description || 'Produk berkualitas tinggi bergaransi resmi.',
      image: productData.image || 'airpods-max',
      colors: productData.colors && productData.colors.length > 0 ? productData.colors : [{ name: 'Default', hex: '#003d29' }],
      badge: 'NEW ARRIVAL',
      shop_id: user?.shop?.id || 1,
      shop_name: user?.shop?.name || user?.name + ' Store',
      shop_logo: user?.shop?.logo,
      shop_city: user?.shop?.city,
      created_at: new Date().toISOString()
    };

    try {
      await api.addProduct(newProduct);
    } catch (err) {
      console.warn('API addProduct note:', err);
    }

    setProducts((prev) => [newProduct, ...prev]);
  };

  const handleDeleteProduct = async (productId: number) => {
    try {
      await api.deleteProduct(productId);
    } catch (err) {
      console.warn('API deleteProduct error:', err);
    }
    setProducts((prev) => prev.filter((p) => p.id !== productId));
  };

  // Cart operations
  const handleAddToCart = (product: Product, quantity = 1, color?: string): boolean => {
    if (!user) {
      setAuthMessage('Please sign in or create an account to add items to your cart.');
      setPendingCartAction({ type: 'add', product, quantity, color });
      setAuthModalOpen(true);
      return false;
    }

    const existingIdx = cartItems.findIndex(
      (item) => item.product.id === product.id && item.selectedColor === color
    );
    let next: CartItem[] = [];
    if (existingIdx > -1) {
      next = [...cartItems];
      next[existingIdx].quantity += quantity;
    } else {
      next = [...cartItems, { product, quantity, selectedColor: color }];
    }
    setCartItems(next);
    syncCartToDatabase(next, user.id);
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

  const handleLoginSuccess = async (loggedUser: User) => {
    setUser(loggedUser);
    try {
      localStorage.setItem('shopcart_user', JSON.stringify(loggedUser));
    } catch {}

    // Load user cart from database
    try {
      const dbCart = await api.getCart(loggedUser.id);
      if (dbCart && Array.isArray(dbCart) && dbCart.length > 0) {
        setCartItems(dbCart);
      } else if (cartItems.length > 0) {
        await api.syncCart(loggedUser.id, cartItems);
      }
    } catch (_) {}

    // Load user deliveries from database
    try {
      const dbShipments = await api.getDeliveries(loggedUser.id);
      if (dbShipments && dbShipments.length > 0) {
        setActiveShipment(dbShipments[0]);
      }
    } catch (_) {}

    if (pendingCartAction) {
      const { type, product, quantity, color } = pendingCartAction;
      const existingIdx = cartItems.findIndex(
        (item) => item.product.id === product.id && item.selectedColor === color
      );
      let next: CartItem[] = [];
      if (existingIdx > -1) {
        next = [...cartItems];
        next[existingIdx].quantity += quantity;
      } else {
        next = [...cartItems, { product, quantity, selectedColor: color }];
      }
      setCartItems(next);
      syncCartToDatabase(next, loggedUser.id);

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
      localStorage.removeItem('shopcart_cart');
      localStorage.removeItem('shopcart_active_shipment');
    } catch {}
    setCartItems([]);
    setActiveShipment(null);
    handleNavigateHome();
  };

  const handleUpdateCartQuantity = (productId: number, qty: number) => {
    if (qty <= 0) {
      handleRemoveCartItem(productId);
      return;
    }
    const next = cartItems.map((item) =>
      item.product.id === productId ? { ...item, quantity: qty } : item
    );
    setCartItems(next);
    syncCartToDatabase(next);
  };

  const handleRemoveCartItem = (productId: number) => {
    const next = cartItems.filter((item) => item.product.id !== productId);
    setCartItems(next);
    syncCartToDatabase(next);
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
      {/* 1. Main Sticky Navbar */}
      <Navbar
        user={user}
        cartCount={cartCount}
        currentLang={lang}
        onLanguageChange={handleLanguageChange}
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
        onNavigateShop={handleNavigateShop}
        onNavigateSettings={() => {
          setView('settings');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenAuth={() => {
          setAuthMessage('');
          setAuthModalOpen(true);
        }}
        onLogout={handleLogout}
        products={products}
      />

      {/* 2. Dynamic Page View Router */}
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
                  {t.headphonesForYou}
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
                    {t.weeklyPopular}
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
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                } else if (serviceTitle.includes('Delivery')) {
                  setView('delivery');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
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
            onViewShop={handleViewShopPublic}
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

        {view === 'settings' && (
          <SettingsView
            user={user}
            currentLang={lang}
            onLanguageChange={handleLanguageChange}
            onNavigateHome={handleNavigateHome}
            onClearCache={() => {
              if (user) {
                loadCartFromDatabase(user.id);
                loadDeliveriesFromDatabase(user.id);
              }
              loadProducts();
            }}
          />
        )}

        {view === 'shop_dashboard' && (
          <ShopDashboardView
            user={user}
            products={products}
            onUpdateUser={(updated) => {
              setUser(updated);
              try { localStorage.setItem('shopcart_user', JSON.stringify(updated)); } catch {}
              if (updated.shop) {
                api.createShop({ ...updated.shop, user_id: updated.id }).catch(() => {});
              }
            }}
            onAddProduct={handleAddProduct}
            onDeleteProduct={handleDeleteProduct}
            onNavigateHome={handleNavigateHome}
            onSelectProduct={handleSelectProduct}
            onViewShopPublic={(shop) => {
              setSelectedShopProfile(shop);
              setView('shop_profile');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {view === 'shop_profile' && selectedShopProfile && (
          <ShopProfileView
            shop={selectedShopProfile}
            products={products}
            onSelectProduct={handleSelectProduct}
            onAddToCart={(p) => handleAddToCart(p, 1)}
            onBackToHome={handleNavigateHome}
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
            onTrackDelivery={(order) => {
              if (activeShipment && activeShipment.order_number === order.order_number) {
                setView('delivery');
              } else {
                const orderShipment: DeliveryShipment = {
                  id: `shp-${order.order_number}`,
                  order_number: order.order_number,
                  courier_name: order.courier || 'Shopcart Express Priority',
                  courier_service: order.courier_service || 'Fast Local & Ground Tracking',
                  tracking_number: order.tracking_number || `SC-TRK-${order.order_number}`,
                  status: 'in_transit',
                  status_label: 'In Transit — Live GPS Tracking Active',
                  recipient_name: order.customer_name,
                  recipient_phone: user?.phone || '+1 (555) 234-5678',
                  delivery_address: order.shipping_address,
                  origin_address: 'Central Fulfillment Center #4, North Hub',
                  estimated_arrival: order.estimated_delivery || 'Tomorrow by 2:00 PM',
                  driver_name: 'Marcus Vance (Courier Specialist)',
                  driver_phone: '+1 (555) 987-6543',
                  driver_vehicle: 'Eco Delivery Van #EV-428',
                  current_location: 'Regional Distribution Center, Sector 7',
                  items_count: order.items?.reduce((s, i) => s + i.quantity, 0) || 1,
                  items_preview: order.items?.map((i) => ({
                    name: i.name,
                    quantity: i.quantity,
                    image: i.image,
                    color: i.color,
                  })),
                  total_amount: order.total,
                  created_at: order.created_at || new Date().toISOString(),
                  checkpoints: [
                    {
                      id: 'cp-1',
                      title: 'Order Confirmed & Processed',
                      location: 'Shopcart Central Fulfillment Center',
                      timestamp: '10:00 AM',
                      status: 'completed',
                      description: 'Order confirmed and packed with security seal.'
                    },
                    {
                      id: 'cp-2',
                      title: 'Picked Up by Courier Specialist',
                      location: 'Logistics Facility',
                      timestamp: '11:30 AM',
                      status: 'completed',
                      description: 'Airway bill barcode scanned and assigned.'
                    },
                    {
                      id: 'cp-3',
                      title: 'In Transit — En Route to Local Hub',
                      location: 'Regional Logistics Expressway',
                      timestamp: 'Active Now',
                      status: 'current',
                      description: 'Vehicle GPS active. Approaching destination area.'
                    },
                    {
                      id: 'cp-4',
                      title: 'Out for Final Delivery',
                      location: order.shipping_address,
                      timestamp: order.estimated_delivery || 'Tomorrow',
                      status: 'upcoming',
                      description: 'Driver will arrive at front door with contactless delivery.'
                    },
                    {
                      id: 'cp-5',
                      title: 'Package Delivered',
                      location: order.shipping_address,
                      timestamp: order.estimated_delivery || 'Tomorrow',
                      status: 'upcoming',
                      description: 'Signed confirmation and photo delivery proof.'
                    }
                  ]
                };
                setActiveShipment(orderShipment);
                setView('delivery');
              }
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {view === 'delivery' && (
          <DeliveryView
            activeShipment={activeShipment}
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

      {/* 3. Checkout Modal & Order Placement */}
      <CheckoutModal
        items={cartItems}
        user={user}
        isOpen={checkoutModalOpen}
        onClose={() => setCheckoutModalOpen(false)}
        onOrderSuccess={async (orderNum, shipment, openDeliveryView) => {
          loadOrders();
          setCartItems([]);
          if (user) {
            await api.clearCart(user.id);
          }
          if (shipment) {
            try {
              await api.saveDelivery(shipment);
            } catch (e) {
              console.warn('Save delivery db note:', e);
            }
            setActiveShipment(shipment);
          }
          if (openDeliveryView) {
            setView('delivery');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }}
        subtotal={cartSubtotal}
      />

      {/* 4. Authentication Modal */}
      <AuthModal
        isOpen={authModalOpen}
        message={authMessage}
        onClose={() => {
          setAuthModalOpen(false);
          setAuthMessage('');
        }}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* 5. Clean Minimal Footer */}
      <Footer />
    </div>
  );
}
