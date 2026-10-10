import React, { useState, useEffect } from "react";
import { Navbar } from "./components/Navbar";
import { HeroBanner } from "./components/HeroBanner";
import { CategoryRecommendationBar } from "./components/CategoryRecommendationBar";
import { ProductFilterBar } from "./components/ProductFilterBar";
import { ProductCard } from "./components/ProductCard";
import { ProductDetailPage } from "./components/ProductDetailPage";
import { ServicesSection } from "./components/ServicesSection";
import { TestimonialsSection } from "./components/TestimonialsSection";
import { CTASection } from "./components/CTASection";
import { Footer } from "./components/Footer";
import { CheckoutModal } from "./components/CheckoutModal";
import { CartPage } from "./components/CartPage";
import { SearchPage } from "./components/SearchPage";
import { AuthModal } from "./components/AuthModal";
import { AuthPage } from "./components/AuthPage";
import { ProfileView } from "./components/ProfileView";
import { OrdersView } from "./components/OrdersView";
import { DeliveryView } from "./components/DeliveryView";
import { ShopDashboardView } from "./components/ShopDashboardView";
import { ShopProfileView } from "./components/ShopProfileView";
import { SettingsView } from "./components/SettingsView";
import { WishlistView } from "./components/WishlistView";
import { FollowingShopsView } from "./components/FollowingShopsView";
import { ChatModal } from "./components/ChatModal";
import { ReviewModal } from "./components/ReviewModal";
import { ReturnModal } from "./components/ReturnModal";
import { AdminDashboardView } from "./components/AdminDashboardView";
import {
  Product,
  CartItem,
  User,
  Order,
  DeliveryShipment,
  Shop,
  OrderItemType,
} from "./types";
import { api } from "./services/api";
import { Language, translations } from "./i18n/translations";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { ToastProvider, useToast } from "./context/ToastContext";

function AppContent() {
  const { showToast } = useToast();
  const [view, setView] = useState<
    | "home"
    | "product"
    | "search"
    | "category"
    | "cart"
    | "profile"
    | "orders"
    | "delivery"
    | "shop_dashboard"
    | "shop_profile"
    | "settings"
    | "wishlist"
    | "following"
    | "admin"
    | "auth"
  >("home");

  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedShopProfile, setSelectedShopProfile] = useState<Shop | null>(
    null,
  );
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  const [lang, setLang] = useState<Language>(() => {
    try {
      const saved =
        localStorage.getItem("pasaria_lang") ||
        localStorage.getItem("shopcart_lang");
      return saved === "en" || saved === "id" ? saved : "id";
    } catch {
      return "id";
    }
  });

  const t = translations[lang];

  const handleLanguageChange = (newLang: Language) => {
    setLang(newLang);
    try {
      localStorage.setItem("pasaria_lang", newLang);
    } catch {}
  };

  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const saved =
        localStorage.getItem("pasaria_cart") ||
        localStorage.getItem("shopcart_cart");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved =
        localStorage.getItem("pasaria_user") ||
        localStorage.getItem("shopcart_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [activeShipment, setActiveShipment] = useState<DeliveryShipment | null>(
    () => {
      try {
        const saved =
          localStorage.getItem("pasaria_active_shipment") ||
          localStorage.getItem("shopcart_active_shipment");
        return saved ? JSON.parse(saved) : null;
      } catch {
        return null;
      }
    },
  );

  const [authMessage, setAuthMessage] = useState<string>("");
  const [pendingCartAction, setPendingCartAction] = useState<{
    type: "add" | "buy";
    product: Product;
    quantity: number;
    color?: string;
    variantId?: number;
  } | null>(null);

  const [orders, setOrders] = useState<Order[]>([]);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authInitialTab, setAuthInitialTab] = useState<'login' | 'register'>('login');
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);

  // New Modals
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

  // Filter & pagination state
  const [filters, setFilters] = useState<{
    category: string;
    minPrice: number;
    maxPrice: number;
    minRating: number;
    color?: string;
    material?: string;
    offer?: string;
    sort: string;
  }>({
    category: "all",
    minPrice: 0,
    maxPrice: 999999999,
    minRating: 0,
    color: "all",
    material: "all",
    offer: "all",
    sort: "popular",
  });
  const INITIAL_VISIBLE_COUNT = 15; // 3 rows maximum on 5-col desktop
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT);

  // On mount: authenticate with Sanctum session & load data
  useEffect(() => {
    const unsub = api.onUnauthorized(() => {
      setUser(null);
      localStorage.removeItem('pasaria_user');
      setCartItems([]);
      setOrders([]);
      setView((currView) =>
        ['profile', 'orders', 'delivery', 'shop_dashboard', 'admin'].includes(currView) ? 'home' : currView
      );
      setAuthMessage('Sesi login Anda telah berakhir. Silakan masuk kembali.');
      setAuthModalOpen(true);
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
          localStorage.setItem("pasaria_user", JSON.stringify(me));
          await loadUserData(me.id);
        }
      }
    } catch (e) {
      console.warn("Session bootstrap note:", e);
    }
  };

  // Sync active shipment to localStorage
  useEffect(() => {
    if (activeShipment) {
      try {
        localStorage.setItem(
          "pasaria_active_shipment",
          JSON.stringify(activeShipment),
        );
      } catch {}
    }
  }, [activeShipment]);

  // Sync cart items to database & localStorage
  const syncCartToDatabase = async (items: CartItem[], currentUid?: number) => {
    const uid = currentUid || user?.id || 1;
    try {
      localStorage.setItem("pasaria_cart", JSON.stringify(items));
      if (user) {
        await api.syncCart(uid, items);
      }
    } catch (e) {
      console.warn("Cart sync note:", e);
    }
  };

  const loadCartFromDatabase = async (uid: number) => {
    try {
      const dbItems = await api.getCart(uid);
      if (dbItems && Array.isArray(dbItems)) {
        setCartItems(dbItems);
        localStorage.setItem("pasaria_cart", JSON.stringify(dbItems));
      } else {
        setCartItems([]);
        localStorage.removeItem("pasaria_cart");
      }
    } catch (e) {
      console.warn("Load cart from db note:", e);
    }
  };

  const loadDeliveriesFromDatabase = async (uid: number) => {
    try {
      const shipments = await api.getDeliveries(uid);
      if (shipments && Array.isArray(shipments) && shipments.length > 0) {
        setActiveShipment(shipments[0]);
        localStorage.setItem(
          "pasaria_active_shipment",
          JSON.stringify(shipments[0]),
        );
      } else {
        setActiveShipment(null);
        localStorage.removeItem("pasaria_active_shipment");
      }
    } catch (e) {
      console.warn("Load deliveries note:", e);
    }
  };

  const loadUserData = async (uid: number) => {
    const results = await Promise.allSettled([
      api.getOrders(uid),
      api.getCart(uid),
      api.getDeliveries(uid),
    ]);

    const [ordersResult, cartResult, deliveriesResult] = results;

    if (ordersResult.status === "fulfilled") {
      setOrders(ordersResult.value || []);
    } else {
      console.error("Failed to load orders:", ordersResult.reason);
    }

    if (cartResult.status === "fulfilled") {
      const dbCart = cartResult.value;
      if (dbCart && Array.isArray(dbCart)) {
        setCartItems(dbCart);
        localStorage.setItem("pasaria_cart", JSON.stringify(dbCart));
      } else {
        setCartItems([]);
        localStorage.removeItem("pasaria_cart");
      }
    } else {
      console.warn("Load cart note:", cartResult.reason);
    }

    if (deliveriesResult.status === "fulfilled") {
      const shipments = deliveriesResult.value;
      if (shipments && Array.isArray(shipments) && shipments.length > 0) {
        setActiveShipment(shipments[0]);
        localStorage.setItem(
          "pasaria_active_shipment",
          JSON.stringify(shipments[0]),
        );
      } else {
        setActiveShipment(null);
        localStorage.removeItem("pasaria_active_shipment");
      }
    } else {
      console.warn("Load deliveries note:", deliveriesResult.reason);
    }
  };

  // Load products when filters/search change
  useEffect(() => {
    loadProducts();
  }, [filters, searchQuery, activeCategory]);

  // Load orders and user-specific data on mount/login
  useEffect(() => {
    if (user?.id) {
      loadUserData(user.id);
    } else {
      setOrders([]);
    }
  }, [user?.id]);

  const loadProducts = async () => {
    setProductsLoading(true);
    setProductsError(null);
    try {
      const selectedCat =
        filters.category && filters.category !== 'all'
          ? filters.category
          : activeCategory !== 'all'
          ? activeCategory
          : undefined;

      const res = await api.getProducts({
        q: searchQuery,
        category: selectedCat,
        sort: filters.sort,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
        minRating: filters.minRating,
      });

      let list = res.products || [];

      // Frontend UI filter adjustments for color, material, and offer
      if (filters.color && filters.color !== 'all') {
        const cLower = filters.color.toLowerCase();
        list = list.filter((p) => {
          const nameMatch = p.name?.toLowerCase().includes(cLower);
          const descMatch = p.description?.toLowerCase().includes(cLower);
          const colorsMatch = Array.isArray(p.colors)
            ? p.colors.some((col: any) =>
                typeof col === 'string'
                  ? col.toLowerCase().includes(cLower)
                  : col?.name?.toLowerCase().includes(cLower)
              )
            : false;
          return nameMatch || descMatch || colorsMatch;
        });
      }

      if (filters.material && filters.material !== 'all') {
        const mLower = filters.material.toLowerCase();
        list = list.filter((p) => {
          const nameMatch = p.name?.toLowerCase().includes(mLower);
          const descMatch = p.description?.toLowerCase().includes(mLower);
          const specsMatch = JSON.stringify(p.specs || {}).toLowerCase().includes(mLower);
          return nameMatch || descMatch || specsMatch;
        });
      }

      if (filters.offer && filters.offer !== 'all') {
        if (filters.offer === 'discount') {
          list = list.filter((p) => p.original_price && p.original_price > p.price);
        } else if (filters.offer === 'official') {
          list = list.filter((p) => p.shop_name?.toLowerCase().includes('official'));
        } else if (filters.offer === 'instock') {
          list = list.filter((p) => p.stock > 0);
        } else if (filters.offer === 'popular') {
          list = list.filter((p) => (p.review_count || 0) >= 5 || p.rating >= 4.5);
        }
      }

      setProducts(list);
      setVisibleCount(INITIAL_VISIBLE_COUNT);
    } catch (err: any) {
      console.error('Failed to load products:', err);
      setProductsError(err.message || 'Gagal memuat katalog produk.');
    } finally {
      setProductsLoading(false);

    }
  };

  const loadOrders = async (userId?: number) => {
    try {
      const data = await api.getOrders(userId);
      setOrders(data);
    } catch (err) {
      console.error("Failed to load orders:", err);
    }
  };

  // Navigation handlers
  const handleNavigateHome = () => {
    setSearchQuery("");
    setActiveCategory("all");
    setView("home");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSelectProduct = async (product: Product) => {
    try {
      const data = await api.getProductBySlug(product.slug);
      setSelectedProduct(data.product);
      setRelatedProducts(data.related || []);
      setView("product");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setSelectedProduct(product);
      setView("product");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleNavigateSearch = (q: string) => {
    setSearchQuery(q);
    setView("search");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleNavigateCategory = (catName: string) => {
    if (catName === "Deals") {
      setFilters((prev) => ({ ...prev, minPrice: 0, maxPrice: 1500000 }));
      setActiveCategory("all");
      setView("category");
    } else if (catName === "What's New") {
      setFilters((prev) => ({ ...prev, sort: "newest" }));
      setActiveCategory("all");
      setView("category");
    } else if (catName === "Delivery") {
      setView("delivery");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    } else {
      setActiveCategory(catName);
      setView("category");
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleNavigateShop = () => {
    if (!user) {
      setAuthMessage(
        "Silakan masuk atau buat akun untuk membuka dan mengelola toko Anda di PASARIA.",
      );
      setAuthModalOpen(true);
      return;
    }
    setView("shop_dashboard");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleViewShopPublic = async (shopName: string, shopId?: number) => {
    if (
      user?.shop &&
      (user.shop.name === shopName || user.shop.id === shopId)
    ) {
      setSelectedShopProfile(user.shop);
    } else {
      try {
        if (shopId) {
          const s = await api.getShop(shopId);
          setSelectedShopProfile(s);
        } else {
          setSelectedShopProfile({
            id: shopId || 1,
            user_id: 1,
            name: shopName,
            slug: shopName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
            slogan: "Penyedia Produk Original & Terpercaya",
            city: "Jakarta Pusat",
            phone: "+62 812-8888-9999",
            description: `Selamat datang di toko ${shopName}! Kami menyediakan berbagai produk original dengan garansi resmi dan pengiriman cepat di PASARIA.`,
            rating: 5.0,
            review_count: 85,
            is_verified: true,
          });
        }
      } catch {
        setSelectedShopProfile({
          id: shopId || 1,
          user_id: 1,
          name: shopName,
          slug: shopName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
          city: "Jakarta",
          rating: 5.0,
          is_verified: true,
        });
      }
    }
    setView("shop_profile");
    window.scrollTo({ top: 0, behavior: "smooth" });
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
      console.warn("API deleteProduct error:", err);
    }
    setProducts((prev) =>
      prev.filter((p) => String(p.id) !== String(productId)),
    );
  };

  const handleOpenAuth = (tab: 'login' | 'register' = 'login', message = '') => {
    setAuthInitialTab(tab);
    setAuthMessage(message);
    setView('auth');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Cart operations
  const handleAddToCart = (
    product: Product,
    quantity = 1,
    color?: string,
    variantId?: number,
  ): boolean => {
    if (!user) {
      setPendingCartAction({ type: "add", product, quantity, color, variantId });
      handleOpenAuth("login", "Silakan masuk ke akun PASARIA Anda untuk memasukkan produk ke keranjang belanja.");
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
    showToast(`${quantity}x "${product.name}" berhasil dimasukkan ke keranjang.`, "success");
    return true;
  };

  const handleBuyNow = (
    product: Product,
    quantity = 1,
    color?: string,
    variantId?: number,
  ) => {
    if (!user) {
      setPendingCartAction({ type: "buy", product, quantity, color, variantId });
      handleOpenAuth("login", "Silakan masuk ke akun PASARIA Anda untuk langsung melanjutkan pembelian.");
      return;
    }
    handleAddToCart(product, quantity, color, variantId);
    setCheckoutModalOpen(true);
  };

  const handleLoginSuccess = async (loggedUser: User) => {
    setUser(loggedUser);
    localStorage.setItem("pasaria_user", JSON.stringify(loggedUser));

    // Parallelize independent user data fetching via Promise.allSettled
    await loadUserData(loggedUser.id);

    if (pendingCartAction) {
      const { type, product, quantity, color, variantId } = pendingCartAction;
      handleAddToCart(product, quantity, color, variantId);
      if (type === "buy") {
        setCheckoutModalOpen(true);
      }
      setPendingCartAction(null);
    }
  };

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch (_) {}
    setUser(null);
    localStorage.removeItem("pasaria_user");
    localStorage.removeItem("pasaria_cart");
    localStorage.removeItem("pasaria_active_shipment");
    setCartItems([]);
    setActiveShipment(null);
    setOrders([]);
    handleNavigateHome();
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
      showToast(`"${removedItem.product.name}" dihapus dari keranjang.`, "info", {
        duration: 5000,
        action: {
          label: "Batalkan",
          onClick: () => {
            setCartItems((prev) => {
              const restored = [...prev, removedItem];
              syncCartToDatabase(restored);
              return restored;
            });
            showToast(`"${removedItem.product.name}" dipulihkan ke keranjang.`, "success");
          },
        },
      });
    }
  };

  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const cartSubtotal = cartItems.reduce(
    (acc, item) => acc + item.product.price * item.quantity,
    0,
  );

  const currentProducts = products.slice(0, visibleCount);
  const hasMoreProducts = visibleCount < products.length;

  const weeklyProducts = products.slice(0, 5);

  return (
    <div className="min-h-screen flex flex-col bg-[#fcfcfc] text-[#1c2a23]">
      {/* 1. Main Sticky Navbar */}
      {view !== "auth" && (
        <Navbar
          user={user}
          cartCount={cartCount}
          currentLang={lang}
          onLanguageChange={handleLanguageChange}
          onNavigateHome={handleNavigateHome}
          onNavigateCategory={handleNavigateCategory}
          onNavigateSearch={handleNavigateSearch}
          onNavigateCart={() => {
            setView("cart");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          onNavigateProfile={() => {
            if (!user) {
              handleOpenAuth("login", "Silakan masuk untuk melihat profil akun Anda.");
            } else {
              setView("profile");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }
          }}
          onNavigateOrders={() => {
            if (!user) {
              handleOpenAuth("login", "Silakan masuk untuk melihat riwayat pesanan Anda.");
            } else {
              setView("orders");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }
          }}
          onNavigateWishlist={() => {
            if (!user) {
              handleOpenAuth("login", "Silakan masuk untuk melihat daftar produk favorit Anda.");
            } else {
              setView("wishlist");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }
          }}
          onNavigateFollowing={() => {
            if (!user) {
              handleOpenAuth("login", "Silakan masuk untuk melihat toko yang Anda ikuti.");
            } else {
              setView("following");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }
          }}
          onNavigateShop={handleNavigateShop}
          onNavigateAdmin={() => {
            setView("admin");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          onNavigateSettings={() => {
            setView("settings");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          onOpenChat={() => {
            setChatShopId(undefined);
            setChatModalOpen(true);
          }}
          onOpenAuth={(tab?: "login" | "register") => handleOpenAuth(tab || "login")}
          onLogout={handleLogout}
          products={products}
        />
      )}

      {/* 2. Dynamic Page View Router */}
      <main className="flex-1">
        {view === "home" && (
          <div>
            <HeroBanner
              lang={lang}
              onBuyNow={(category?: string) => {
                if (category) {
                  setFilters((prev) => ({ ...prev, category }));
                } else if (products.length > 0) {
                  handleSelectProduct(products[0]);
                }
              }}
              onContactUs={() => {
                setChatShopId(undefined);
                setChatModalOpen(true);
              }}
            />

            <CategoryRecommendationBar
              user={user}
              lang={lang}
              selectedCategory={filters.category}
              onSelectCategory={(slug) => {
                setFilters((prev) => ({ ...prev, category: slug }));
                const section = document.getElementById('products-section');
                if (section) {
                  section.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              onViewOrders={() => {
                if (!user) {
                  handleOpenAuth('login', 'Silakan masuk untuk melihat riwayat pesanan Anda.');
                } else {
                  setView('orders');
                }
              }}
            />

            <ProductFilterBar
              filters={filters}
              onChangeFilters={(f) => setFilters((prev) => ({ ...prev, ...f }))}
              onResetFilters={() =>
                setFilters({
                  category: "all",
                  minPrice: 0,
                  maxPrice: 999999999,
                  minRating: 0,
                  color: "all",
                  material: "all",
                  offer: "all",
                  sort: "popular",
                })
              }
            />

            {/* Main Product Grid */}
            <section id="products-section" className="max-w-7xl mx-auto px-4 sm:px-8 py-8 text-left">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                    Rekomendasi Pilihan untuk Anda
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Produk original berkualitas dari official store dan seller
                    terverifikasi PASARIA.
                  </p>
                </div>
              </div>

              {productsLoading ? (
                <div className="py-20 text-center flex flex-col items-center justify-center space-y-3">
                  <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs text-slate-500 font-medium">Memuat rekomendasi produk PASARIA...</span>
                </div>
              ) : productsError ? (
                <div className="py-12 px-6 rounded-2xl bg-rose-50 border border-rose-200 text-center space-y-3 max-w-md mx-auto">
                  <p className="text-xs font-semibold text-rose-700">{productsError}</p>
                  <button
                    onClick={() => loadProducts()}
                    className="px-4 py-2 rounded-full bg-[#003d29] hover:bg-[#064e3b] text-white text-xs font-bold transition-all cursor-pointer"
                  >
                    Coba Lagi
                  </button>
                </div>
              ) : currentProducts.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-3 md:gap-3.5">
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
                  Tidak ada produk yang cocok dengan filter yang dipilih.
                </div>
              )}

              {/* Muat Lebih Banyak Button (Maks 3 baris per tampilan) */}
              {hasMoreProducts ? (
                <div className="flex flex-col items-center justify-center mt-10">
                  <button
                    onClick={() => setVisibleCount((prev) => prev + 15)}
                    className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-full text-xs sm:text-sm font-bold text-slate-800 bg-white hover:bg-slate-50 border border-slate-300 hover:border-slate-800 transition-all cursor-pointer shadow-none active:scale-[0.98]"
                  >
                    <span>Muat Lebih Banyak</span>
                    <ChevronDown className="w-4 h-4 text-slate-500" />
                  </button>
                  <span className="text-[11px] text-slate-400 mt-2 font-medium">
                    Menampilkan {Math.min(visibleCount, products.length)} dari {products.length} produk
                  </span>
                </div>
              ) : products.length > 15 ? (
                <div className="text-center mt-10">
                  <p className="text-xs text-slate-400 font-medium">
                    Semua produk telah ditampilkan ({products.length} produk)
                  </p>
                </div>
              ) : null}
            </section>

            {/* Weekly Popular Products */}
            {weeklyProducts.length > 0 && (
              <section className="max-w-7xl mx-auto px-4 sm:px-8 py-8 text-left border-t border-slate-100">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                    Produk Terlaris Minggu Ini
                  </h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-3 md:gap-3.5">
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

            {/* Services Section (Layanan untuk Membantu Belanja Anda) */}
            <ServicesSection
              lang={lang}
              onLearnMore={(serviceTitle) => {
                if (
                  serviceTitle.includes("Payment") ||
                  serviceTitle.includes("Bayar") ||
                  serviceTitle.includes("Pembayaran")
                ) {
                  setView("cart");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                } else if (
                  serviceTitle.includes("Delivery") ||
                  serviceTitle.includes("Kirim") ||
                  serviceTitle.includes("Pengiriman")
                ) {
                  setView("delivery");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                } else {
                  setChatShopId(undefined);
                  setChatModalOpen(true);
                }
              }}
            />

            {/* Immersive Parallax App Download CTA Section */}
            <CTASection lang={lang} />

            {/* Testimonials Section */}
            <TestimonialsSection lang={lang} />
          </div>
        )}

        {view === "product" && selectedProduct && (
          <ProductDetailPage
            product={selectedProduct}
            relatedProducts={relatedProducts}
            onAddToCart={handleAddToCart}
            onBuyNow={handleBuyNow}
            onSelectProduct={handleSelectProduct}
            onBackToHome={handleNavigateHome}
            onViewShop={handleViewShopPublic}
            onOpenChatWithShop={(sId) => {
              setChatShopId(sId);
              setChatModalOpen(true);
            }}
            onOpenReviewModal={(prod) => {
              setReviewTarget({
                productId: prod.id,
                productName: prod.name,
              });
              setReviewModalOpen(true);
            }}
          />
        )}

        {(view === "search" || view === "category") && (
          <SearchPage
            query={searchQuery}
            category={activeCategory !== "all" ? activeCategory : undefined}
            products={products}
            onSelectProduct={handleSelectProduct}
            onAddToCart={(p) => handleAddToCart(p, 1)}
            onBackToHome={handleNavigateHome}
            filters={filters}
            onChangeFilters={(f) => setFilters((prev) => ({ ...prev, ...f }))}
            onResetFilters={() =>
              setFilters({
                category: "all",
                minPrice: 0,
                maxPrice: 999999999,
                minRating: 0,
                  color: "all",
                  material: "all",
                  offer: "all",
                  sort: "popular",
              })
            }
          />
        )}

        {view === "cart" && (
          <CartPage
            items={cartItems}
            onUpdateQuantity={handleUpdateCartQuantity}
            onRemoveItem={handleRemoveCartItem}
            onProceedToCheckout={() => {
              if (!user) {
                setAuthMessage(
                  "Silakan masuk ke akun Anda untuk menyelesaikan proses pembayaran.",
                );
                setAuthModalOpen(true);
              } else {
                setCheckoutModalOpen(true);
              }
            }}
            onContinueShopping={handleNavigateHome}
          />
        )}

        {view === "wishlist" && (
          <WishlistView
            onNavigateHome={handleNavigateHome}
            onSelectProduct={handleSelectProduct}
            onAddToCart={(p) => handleAddToCart(p, 1)}
          />
        )}

        {view === "following" && (
          <FollowingShopsView
            onNavigateHome={handleNavigateHome}
            onViewShop={handleViewShopPublic}
          />
        )}

        {view === "profile" && (
          <ProfileView
            user={user}
            onUpdateUser={(updated) => {
              setUser(updated);
              localStorage.setItem("pasaria_user", JSON.stringify(updated));
            }}
            onNavigateHome={handleNavigateHome}
          />
        )}

        {view === "settings" && (
          <SettingsView
            user={user}
            currentLang={lang}
            onLanguageChange={handleLanguageChange}
            onNavigateHome={handleNavigateHome}
            onClearCache={() => {
              if (user) {
                loadUserData(user.id);
              }
              loadProducts();
            }}
          />
        )}

        {view === "shop_dashboard" && (
          <ShopDashboardView
            user={user}
            products={products}
            onUpdateUser={(updated) => {
              setUser(updated);
              localStorage.setItem("pasaria_user", JSON.stringify(updated));
            }}
            onAddProduct={handleAddProduct}
            onUpdateProduct={handleUpdateProduct}
            onDeleteProduct={handleDeleteProduct}
            onNavigateHome={handleNavigateHome}
            onSelectProduct={handleSelectProduct}
            onViewShopPublic={(shop) => {
              setSelectedShopProfile(shop);
              setView("shop_profile");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        )}

        {view === "shop_profile" && selectedShopProfile && (
          <ShopProfileView
            shop={selectedShopProfile}
            products={products}
            onSelectProduct={handleSelectProduct}
            onAddToCart={(p) => handleAddToCart(p, 1)}
            onBackToHome={handleNavigateHome}
            onOpenChatWithShop={(sId) => {
              setChatShopId(sId);
              setChatModalOpen(true);
            }}
          />
        )}

        {view === "orders" && (
          <OrdersView
            orders={orders}
            onNavigateHome={handleNavigateHome}
            onRefreshOrders={() => user && loadOrders(user.id)}
            onSelectProductBySlug={async (slug) => {
              try {
                const data = await api.getProductBySlug(slug);
                setSelectedProduct(data.product);
                setRelatedProducts(data.related || []);
                setView("product");
              } catch (_) {}
            }}
            onTrackDelivery={(order) => {
              setView("delivery");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            onOpenReviewModal={(item, orderId) => {
              setReviewTarget({
                productId: item.product_id || 1,
                productName: item.product_name || item.name || "Produk",
                orderId: orderId,
                orderItemId: item.id,
              });
              setReviewModalOpen(true);
            }}
            onOpenReturnModal={(order) => {
              setReturnOrder(order);
              setReturnModalOpen(true);
            }}
            onBuyAgain={(items) => {
              items.forEach((i) => {
                const p = products.find((prod) => prod.id === i.product_id);
                if (p) handleAddToCart(p, i.quantity, i.color);
              });
              setView("cart");
            }}
          />
        )}

        {view === "delivery" && (
          <DeliveryView
            activeShipment={activeShipment}
            orders={orders}
            onNavigateHome={handleNavigateHome}
            onSelectProductBySlug={async (slug) => {
              try {
                const data = await api.getProductBySlug(slug);
                setSelectedProduct(data.product);
                setRelatedProducts(data.related || []);
                setView("product");
              } catch (_) {}
            }}
          />
        )}

        {view === "admin" && (
          <AdminDashboardView onNavigateHome={handleNavigateHome} />
        )}

        {view === 'auth' && (
          <AuthPage
            initialTab={authInitialTab}
            message={authMessage}
            lang={lang}
            onNavigateHome={handleNavigateHome}
            onLoginSuccess={(loggedInUser) => {
              handleLoginSuccess(loggedInUser);
              handleNavigateHome();
            }}
          />
        )}
      </main>

      {/* 3. Checkout Modal */}
      <CheckoutModal
        items={cartItems}
        user={user}
        isOpen={checkoutModalOpen}
        onClose={() => setCheckoutModalOpen(false)}
        onOrderSuccess={async (orderNum, shipment, openDeliveryView) => {
          setCartItems([]);
          localStorage.removeItem("pasaria_cart");
          setCheckoutModalOpen(false);

          if (user) {
            try {
              await api.clearCart(user.id);
            } catch (_) {}
            try {
              loadOrders(user.id);
            } catch (_) {}
          } else {
            try {
              loadOrders();
            } catch (_) {}
          }

          if (shipment) {
            setActiveShipment(shipment);
            localStorage.setItem(
              "pasaria_active_shipment",
              JSON.stringify(shipment),
            );
          }

          if (openDeliveryView !== false) {
            setView("delivery");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }
        }}
        subtotal={cartSubtotal}
      />

      {/* 4. Auth Modal & Chat */}
      <ChatModal
        isOpen={chatModalOpen}
        onClose={() => setChatModalOpen(false)}
        currentUser={user}
        initialShopId={chatShopId}
      />

      {/* 5. Review Modal */}
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
            if (user) loadOrders(user.id);
            loadProducts();
          }}
        />
      )}

      {/* 6. Return Modal */}
      {returnOrder && (
        <ReturnModal
          isOpen={returnModalOpen}
          onClose={() => {
            setReturnModalOpen(false);
            setReturnOrder(null);
          }}
          order={returnOrder}
          onReturnSubmitted={() => {
            if (user) loadOrders(user.id);
          }}
        />
      )}

      {/* 7. Footer */}
      {view !== 'auth' && <Footer />}
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}
