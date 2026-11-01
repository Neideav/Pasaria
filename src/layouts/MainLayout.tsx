import React, { useState, useEffect, createContext, useContext } from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { ChatModal } from '../components/ChatModal';
import { ReviewModal } from '../components/ReviewModal';
import { ReturnModal } from '../components/ReturnModal';
import { ToastProvider, useToast } from '../context/ToastContext';
import { User, CartItem, DeliveryShipment, Product, Order } from '../types';
import { api } from '../services/api';
import { Language, translations } from '../i18n/translations';

interface AppContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  lang: Language;
  setLang: (lang: Language) => void;
  t: typeof translations['id'];
  cartItems: CartItem[];
  setCartItems: React.Dispatch<React.SetStateAction<CartItem[]>>;
  cartCount: number;
  cartSubtotal: number;
  activeShipment: DeliveryShipment | null;
  setActiveShipment: React.Dispatch<React.SetStateAction<DeliveryShipment | null>>;
  handleAddToCart: (product: Product, quantity?: number, color?: string, variantId?: number) => boolean;
  handleBuyNow: (product: Product, quantity?: number, color?: string, variantId?: number) => void;
  handleUpdateCartQuantity: (productId: number, qty: number) => void;
  handleRemoveCartItem: (productId: number) => void;
  handleLogout: () => Promise<void>;
  openChat: (shopId?: number) => void;
  openReview: (target: { productId: number; productName: string; orderId?: number; orderItemId?: number }) => void;
  openReturn: (order: Order) => void;
  syncCartToDatabase: (items: CartItem[], currentUid?: number) => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within a MainLayout');
  }
  return context;
};

interface MainLayoutProps {
  page: string;
  children: React.ReactNode;
  products?: Product[];
}

function MainLayoutContent({ page, children, products = [] }: MainLayoutProps) {
  const { showToast } = useToast();

  const [lang, setLang] = useState<Language>(() => {
    try {
      const saved =
        localStorage.getItem('pasaria_lang') ||
        localStorage.getItem('shopcart_lang');
      return saved === 'en' || saved === 'id' ? saved : 'id';
    } catch {
      return 'id';
    }
  });

  const t = translations[lang];

  const handleLanguageChange = (newLang: Language) => {
    setLang(newLang);
    try {
      localStorage.setItem('pasaria_lang', newLang);
    } catch {}
  };

  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved =
        localStorage.getItem('pasaria_user') ||
        localStorage.getItem('shopcart_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const saved =
        localStorage.getItem('pasaria_cart') ||
        localStorage.getItem('shopcart_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [activeShipment, setActiveShipment] = useState<DeliveryShipment | null>(() => {
    try {
      const saved =
        localStorage.getItem('pasaria_active_shipment') ||
        localStorage.getItem('shopcart_active_shipment');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Modals state
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [chatShopId, setChatShopId] = useState<number | undefined>(undefined);

  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<{
    productId: number;
    productName: string;
    orderId?: number;
    orderItemId?: number;
  } | null>(null);

  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [returnOrder, setReturnOrder] = useState<Order | null>(null);

  // Apply appearance preferences to root element
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('pasaria_theme') || 'light';
      const root = document.documentElement;
      if (savedTheme === 'dark') {
        root.classList.add('dark');
      } else if (savedTheme === 'light') {
        root.classList.remove('dark');
      } else {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
      }

      const savedFontSize = localStorage.getItem('pasaria_font_size');
      root.classList.toggle('text-scale-large', savedFontSize === 'large');

      const savedReducedMotion = localStorage.getItem('pasaria_reduced_motion');
      root.classList.toggle('reduced-motion', savedReducedMotion === 'true');

      const savedHighContrast = localStorage.getItem('pasaria_high_contrast');
      root.classList.toggle('high-contrast', savedHighContrast === 'true');
    } catch {}

    const unsub = api.onUnauthorized(() => {
      setUser(null);
      localStorage.removeItem('pasaria_user');
      setCartItems([]);
      window.location.href = '/login?message=' + encodeURIComponent('Sesi login Anda telah berakhir. Silakan masuk kembali.');
    });

    bootstrapSession();

    return () => {
      unsub();
    };
  }, []);

  const bootstrapSession = async () => {
    try {
      if (api.isAuthenticated()) {
        const me = await api.getMe();
        if (me && me.id) {
          setUser(me);
          localStorage.setItem('pasaria_user', JSON.stringify(me));
          // Load cart from DB if available
          try {
            const dbCart = await api.getCart(me.id);
            if (dbCart && Array.isArray(dbCart) && dbCart.length > 0) {
              setCartItems(dbCart);
              localStorage.setItem('pasaria_cart', JSON.stringify(dbCart));
            }
          } catch (_) {}
        }
      }
    } catch (e) {
      console.warn('Session bootstrap note:', e);
    }
  };

  const syncCartToDatabase = async (items: CartItem[], currentUid?: number) => {
    const uid = currentUid || user?.id || 1;
    try {
      localStorage.setItem('pasaria_cart', JSON.stringify(items));
      if (user) {
        await api.syncCart(uid, items);
      }
    } catch (e) {
      console.warn('Cart sync note:', e);
    }
  };

  const handleAddToCart = (
    product: Product,
    quantity = 1,
    color?: string,
    variantId?: number,
  ): boolean => {
    if (!user) {
      window.location.href = '/login?message=' + encodeURIComponent('Silakan masuk ke akun PASARIA Anda untuk memasukkan produk ke keranjang belanja.');
      return false;
    }

    const existingIdx = cartItems.findIndex(
      (item) =>
        item.product.id === product.id &&
        item.selectedColor === color &&
        item.variant_id === variantId,
    );
    let next: CartItem[] = [];
    if (existingIdx > -1) {
      next = [...cartItems];
      next[existingIdx].quantity += quantity;
    } else {
      next = [
        ...cartItems,
        { product, quantity, selectedColor: color, variant_id: variantId },
      ];
    }
    setCartItems(next);
    syncCartToDatabase(next, user.id);
    showToast(`${quantity}x "${product.name}" berhasil dimasukkan ke keranjang.`, 'success');
    return true;
  };

  const handleBuyNow = (
    product: Product,
    quantity = 1,
    color?: string,
    variantId?: number,
  ) => {
    if (!user) {
      window.location.href = '/login?message=' + encodeURIComponent('Silakan masuk ke akun PASARIA Anda untuk langsung melanjutkan pembelian.');
      return;
    }
    handleAddToCart(product, quantity, color, variantId);
    window.location.href = '/checkout';
  };

  const handleUpdateCartQuantity = (productId: number, qty: number) => {
    if (qty <= 0) {
      handleRemoveCartItem(productId);
      return;
    }
    const next = cartItems.map((item) =>
      item.product.id === productId ? { ...item, quantity: qty } : item,
    );
    setCartItems(next);
    syncCartToDatabase(next);
  };

  const handleRemoveCartItem = (productId: number) => {
    const removedItem = cartItems.find((item) => item.product.id === productId);
    const next = cartItems.filter((item) => item.product.id !== productId);
    setCartItems(next);
    syncCartToDatabase(next);
    if (removedItem) {
      showToast(`"${removedItem.product.name}" dihapus dari keranjang.`, 'info', {
        duration: 5000,
        action: {
          label: 'Batalkan',
          onClick: () => {
            setCartItems((prev) => {
              const restored = [...prev, removedItem];
              syncCartToDatabase(restored);
              return restored;
            });
            showToast(`"${removedItem.product.name}" dipulihkan ke keranjang.`, 'success');
          },
        },
      });
    }
  };

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch (_) {}
    setUser(null);
    localStorage.removeItem('pasaria_user');
    localStorage.removeItem('pasaria_cart');
    localStorage.removeItem('pasaria_active_shipment');
    setCartItems([]);
    setActiveShipment(null);
    window.location.href = '/';
  };

  const openChat = (shopId?: number) => {
    setChatShopId(shopId);
    setChatModalOpen(true);
  };

  const openReview = (target: { productId: number; productName: string; orderId?: number; orderItemId?: number }) => {
    setReviewTarget(target);
    setReviewModalOpen(true);
  };

  const openReturn = (order: Order) => {
    setReturnOrder(order);
    setReturnModalOpen(true);
  };

  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const cartSubtotal = cartItems.reduce(
    (acc, item) => acc + item.product.price * item.quantity,
    0,
  );

  const isAuthPage = page === 'auth';
  const isCheckoutPage = page === 'checkout';

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        lang,
        setLang: handleLanguageChange,
        t,
        cartItems,
        setCartItems,
        cartCount,
        cartSubtotal,
        activeShipment,
        setActiveShipment,
        handleAddToCart,
        handleBuyNow,
        handleUpdateCartQuantity,
        handleRemoveCartItem,
        handleLogout,
        openChat,
        openReview,
        openReturn,
        syncCartToDatabase,
      }}
    >
      <div className="min-h-screen flex flex-col bg-[#fcfcfc] text-[#1c2a23]">
        {!isAuthPage && (
          <Navbar
            user={user}
            cartCount={cartCount}
            currentLang={lang}
            onLanguageChange={handleLanguageChange}
            onNavigateHome={() => { window.location.href = '/'; }}
            onNavigateCategory={(cat) => {
              if (cat === 'Deals') {
                window.location.href = '/deals';
              } else if (cat === "What's New") {
                window.location.href = '/whats-new';
              } else if (cat === 'Delivery') {
                window.location.href = '/delivery';
              } else {
                window.location.href = '/category/' + encodeURIComponent(cat);
              }
            }}
            onNavigateSearch={(q) => {
              window.location.href = '/search?q=' + encodeURIComponent(q);
            }}
            onNavigateCart={() => { window.location.href = '/cart'; }}
            onNavigateProfile={() => {
              if (!user) {
                window.location.href = '/login?message=' + encodeURIComponent('Silakan masuk untuk melihat profil akun Anda.');
              } else {
                window.location.href = '/profile';
              }
            }}
            onNavigateOrders={() => {
              if (!user) {
                window.location.href = '/login?message=' + encodeURIComponent('Silakan masuk untuk melihat riwayat pesanan Anda.');
              } else {
                window.location.href = '/orders';
              }
            }}
            onNavigateWishlist={() => {
              if (!user) {
                window.location.href = '/login?message=' + encodeURIComponent('Silakan masuk untuk melihat daftar produk favorit Anda.');
              } else {
                window.location.href = '/wishlist';
              }
            }}
            onNavigateFollowing={() => {
              if (!user) {
                window.location.href = '/login?message=' + encodeURIComponent('Silakan masuk untuk melihat toko yang Anda ikuti.');
              } else {
                window.location.href = '/following';
              }
            }}
            onNavigateShop={() => {
              if (!user) {
                window.location.href = '/login?message=' + encodeURIComponent('Silakan masuk atau buat akun untuk membuka dan mengelola toko Anda di PASARIA.');
              } else {
                window.location.href = '/seller/dashboard';
              }
            }}
            onNavigateAdmin={() => { window.location.href = '/admin'; }}
            onNavigateSettings={() => { window.location.href = '/settings'; }}
            onOpenChat={() => { openChat(undefined); }}
            onOpenAuth={(tab) => {
              window.location.href = tab === 'register' ? '/register' : '/login';
            }}
            onLogout={handleLogout}
            products={products}
          />
        )}

        <main className="flex-1">
          {children}
        </main>

        <ChatModal
          isOpen={chatModalOpen}
          onClose={() => setChatModalOpen(false)}
          currentUser={user}
          initialShopId={chatShopId}
        />

        {reviewTarget && (
          <ReviewModal
            isOpen={reviewModalOpen}
            onClose={() => {
              setReviewModalOpen(false);
              setReviewTarget(null);
            }}
            productId={reviewTarget.productId}
            orderId={reviewTarget.orderId}
            orderItemId={reviewTarget.orderItemId}
            productName={reviewTarget.productName}
            onReviewSubmitted={() => {
              window.location.reload();
            }}
          />
        )}

        {returnOrder && (
          <ReturnModal
            isOpen={returnModalOpen}
            onClose={() => {
              setReturnModalOpen(false);
              setReturnOrder(null);
            }}
            order={returnOrder}
            onReturnSubmitted={() => {
              window.location.reload();
            }}
          />
        )}

        {!isAuthPage && !isCheckoutPage && <Footer />}
      </div>
    </AppContext.Provider>
  );
}

export function MainLayout(props: MainLayoutProps) {
  return (
    <ToastProvider>
      <MainLayoutContent {...props} />
    </ToastProvider>
  );
}

