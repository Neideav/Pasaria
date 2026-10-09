import React, { useState, useEffect } from "react";
import { Navbar } from "./components/Navbar";
import { HeroBanner } from "./components/HeroBanner";
import { ProductFilterBar } from "./components/ProductFilterBar";
import { ProductCard } from "./components/ProductCard";
import { ProductDetailPage } from "./components/ProductDetailPage";
import { ServicesSection } from "./components/ServicesSection";
import { Footer } from "./components/Footer";
import { CheckoutModal } from "./components/CheckoutModal";
import { CartPage } from "./components/CartPage";
import { SearchPage } from "./components/SearchPage";
import { AuthModal } from "./components/AuthModal";
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
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ToastProvider } from "./context/ToastContext";

function AppContent() {
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
  >("home");

  const [products, setProducts] = useState<Product[]>([]);
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
  const [filters, setFilters] = useState({
    category: "all",
    minPrice: 0,
    maxPrice: 999999999,
    minRating: 0,
    sort: "popular",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 8;

  // On mount: authenticate with Sanctum session & load data
  useEffect(() => {
    bootstrapSession();
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
    try {
      const res = await api.getProducts({
        q: searchQuery,
        category: activeCategory !== "all" ? activeCategory : undefined,
        sort: filters.sort,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
        minRating: filters.minRating,
      });
      setProducts(res.products || []);
    } catch (err) {
      console.error("Failed to load products:", err);
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

  // Cart operations
  const handleAddToCart = (
    product: Product,
    quantity = 1,
    color?: string,
    variantId?: number,
  ): boolean => {
    if (!user) {
      setAuthMessage(
        "Silakan masuk ke akun PASARIA Anda untuk memasukkan produk ke keranjang belanja.",
      );
      setPendingCartAction({
        type: "add",
        product,
        quantity,
        color,
        variantId,
      });
      setAuthModalOpen(true);
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
    return true;
  };

  const handleBuyNow = (
    product: Product,
    quantity = 1,
    color?: string,
    variantId?: number,
  ) => {
    if (!user) {
      setAuthMessage(
        "Silakan masuk ke akun PASARIA Anda untuk langsung melanjutkan pembelian.",
      );
      setPendingCartAction({
        type: "buy",
        product,
        quantity,
        color,
        variantId,
      });
      setAuthModalOpen(true);
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
    const next = cartItems.filter((item) => item.product.id !== productId);
    setCartItems(next);
    syncCartToDatabase(next);
  };

  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const cartSubtotal = cartItems.reduce(
    (acc, item) => acc + item.product.price * item.quantity,
    0,
  );

  // Pagination for Home page
  const totalPages = Math.ceil(products.length / productsPerPage) || 1;
  const currentProducts = products.slice(
    (currentPage - 1) * productsPerPage,
    currentPage * productsPerPage,
  );

  const weeklyProducts = products.slice(0, 4);

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
          setView("cart");
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        onNavigateProfile={() => {
          if (!user) {
            setAuthMessage("Silakan masuk untuk melihat profil akun Anda.");
            setAuthModalOpen(true);
          } else {
            setView("profile");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }
        }}
        onNavigateOrders={() => {
          if (!user) {
            setAuthMessage("Silakan masuk untuk melihat riwayat pesanan Anda.");
            setAuthModalOpen(true);
          } else {
            setView("orders");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }
        }}
        onNavigateWishlist={() => {
          if (!user) {
            setAuthMessage(
              "Silakan masuk untuk melihat daftar produk favorit Anda.",
            );
            setAuthModalOpen(true);
          } else {
            setView("wishlist");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }
        }}
        onNavigateFollowing={() => {
          if (!user) {
            setAuthMessage("Silakan masuk untuk melihat toko yang Anda ikuti.");
            setAuthModalOpen(true);
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
        onOpenAuth={() => {
          setAuthMessage("");
          setAuthModalOpen(true);
        }}
        onLogout={handleLogout}
        products={products}
      />

      {/* 2. Dynamic Page View Router */}
      <main className="flex-1">
        {view === "home" && (
          <div>
            <HeroBanner
              onBuyNow={() => {
                if (products.length > 0) {
                  handleSelectProduct(products[0]);
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
                  sort: "popular",
                })
              }
            />

            {/* Main Product Grid */}
            <section className="max-w-7xl mx-auto px-4 sm:px-8 py-8 text-left">
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
                  Tidak ada produk yang cocok dengan filter yang dipilih.
                </div>
              )}

              {/* Numbered Pagination */}
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
                            ? "bg-[#003d29] text-white shadow-xs"
                            : "bg-white hover:bg-slate-100 text-slate-700 border border-slate-200"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  <button
                    onClick={() =>
                      setCurrentPage(Math.min(totalPages, currentPage + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 disabled:opacity-30 cursor-pointer text-xs"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </section>

            {/* Weekly Popular Products */}
            {weeklyProducts.length > 0 && (
              <section className="max-w-7xl mx-auto px-4 sm:px-8 py-8 text-left border-t border-slate-100">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                    Produk Terlaris Minggu Ini
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

            {/* Services Section */}
            <ServicesSection
              onLearnMore={(serviceTitle) => {
                if (
                  serviceTitle.includes("Payment") ||
                  serviceTitle.includes("Bayar")
                ) {
                  setView("cart");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                } else if (
                  serviceTitle.includes("Delivery") ||
                  serviceTitle.includes("Kirim")
                ) {
                  setView("delivery");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                } else {
                  window.scrollTo({ top: 400, behavior: "smooth" });
                }
              }}
            />
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

      {/* 4. Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        message={authMessage}
        onClose={() => {
          setAuthModalOpen(false);
          setAuthMessage("");
        }}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* 5. Chat Modal */}
      <ChatModal
        isOpen={chatModalOpen}
        onClose={() => setChatModalOpen(false)}
        currentUser={user}
        initialShopId={chatShopId}
      />

      {/* 6. Review Modal */}
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

      {/* 7. Return Modal */}
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

      {/* 8. Footer */}
      <Footer />
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
