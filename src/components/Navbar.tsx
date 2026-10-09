import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  User as UserIcon,
  ShoppingCart,
  ChevronDown,
  Menu,
  X,
  Headphones,
  Armchair,
  Footprints,
  ShoppingBag,
  Laptop,
  Book,
  Sparkles,
  LogOut,
  Package,
  Heart,
  Store,
  Settings as SettingsIcon,
  Globe,
  MessageCircle,
  ShieldAlert,
} from 'lucide-react';
import { User, Product } from '../types';
import { ProductVisual } from './ProductVisual';
import { NotificationDropdown } from './NotificationDropdown';
import { formatRupiah } from '../utils/formatters';
import { Language, translations } from '../i18n/translations';

interface NavbarProps {
  user: User | null;
  cartCount: number;
  currentLang: Language;
  onLanguageChange: (lang: Language) => void;
  onNavigateHome: () => void;
  onNavigateCategory: (category: string) => void;
  onNavigateSearch: (query: string) => void;
  onNavigateCart: () => void;
  onNavigateProfile: () => void;
  onNavigateOrders: () => void;
  onNavigateWishlist?: () => void;
  onNavigateFollowing?: () => void;
  onNavigateShop?: () => void;
  onNavigateAdmin?: () => void;
  onNavigateSettings?: () => void;
  onOpenChat?: () => void;
  onOpenAuth: () => void;
  onLogout: () => void;
  products: Product[];
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  cartCount,
  currentLang,
  onLanguageChange,
  onNavigateHome,
  onNavigateCategory,
  onNavigateSearch,
  onNavigateCart,
  onNavigateProfile,
  onNavigateOrders,
  onNavigateWishlist,
  onNavigateFollowing,
  onNavigateShop,
  onNavigateAdmin,
  onNavigateSettings,
  onOpenChat,
  onOpenAuth,
  onLogout,
  products,
}) => {
  const t = translations[currentLang];
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [showCategoriesMenu, setShowCategoriesMenu] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const categoriesRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);
  const drawerCloseBtnRef = useRef<HTMLButtonElement>(null);

  // Close menus on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSearchSuggestions(false);
      }
      if (categoriesRef.current && !categoriesRef.current.contains(event.target as Node)) {
        setShowCategoriesMenu(false);
      }
      if (accountRef.current && !accountRef.current.contains(event.target as Node)) {
        setShowAccountMenu(false);
      }
      if (langRef.current && !langRef.current.contains(event.target as Node)) {
        setShowLangMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard Escape listener to close drawer & popovers
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (isMobileMenuOpen) setIsMobileMenuOpen(false);
        if (showCategoriesMenu) setShowCategoriesMenu(false);
        if (showAccountMenu) setShowAccountMenu(false);
        if (showSearchSuggestions) setShowSearchSuggestions(false);
        if (showLangMenu) setShowLangMenu(false);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isMobileMenuOpen, showCategoriesMenu, showAccountMenu, showSearchSuggestions, showLangMenu]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      setTimeout(() => {
        drawerCloseBtnRef.current?.focus();
      }, 50);
      return () => {
        document.body.style.overflow = originalOverflow || 'unset';
      };
    }
  }, [isMobileMenuOpen]);

  const searchSuggestions = searchQuery.trim()
    ? products
        .filter(
          (p) =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (p.short_desc && p.short_desc.toLowerCase().includes(searchQuery.toLowerCase()))
        )
        .slice(0, 5)
    : [];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowSearchSuggestions(false);
      onNavigateSearch(searchQuery.trim());
    }
  };

  const handleSelectSuggestion = (productName: string) => {
    setSearchQuery(productName);
    setShowSearchSuggestions(false);
    onNavigateSearch(productName);
  };

  const categoryList = [
    { name: 'Headphones', count: 'Original Audio Gear', icon: Headphones, slug: 'headphones' },
    { name: 'Electronics', count: 'Gadget & Aksesoris', icon: Laptop, slug: 'electronics' },
    { name: 'Furniture', count: 'Peralatan Rumah', icon: Armchair, slug: 'furniture' },
    { name: 'Shoes', count: 'Sepatu & Fashion', icon: Footprints, slug: 'shoes' },
    { name: 'Bags', count: 'Tas & Koper', icon: ShoppingBag, slug: 'bags' },
    { name: 'Books', count: 'Buku & Literasi', icon: Book, slug: 'books' },
  ];

  return (
    <>
      <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3 flex items-center justify-between gap-3 sm:gap-4">
          {/* Left: Mobile Menu Toggle, Brand Logo & Desktop Categories */}
          <div className="flex items-center gap-2.5 sm:gap-7">
            {/* Mobile Hamburger Menu Button */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label={isMobileMenuOpen ? "Tutup navigasi utama" : "Buka navigasi utama"}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-navigation-drawer"
              className="lg:hidden w-11 h-11 flex items-center justify-center rounded-xl text-slate-700 hover:text-[#003d29] hover:bg-slate-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#003d29] focus-visible:ring-offset-2 cursor-pointer shrink-0"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5 text-slate-800" />
              ) : (
                <Menu className="w-5 h-5 text-slate-800" />
              )}
            </button>

            {/* Brand Logo */}
            <button
              onClick={onNavigateHome}
              className="flex items-center gap-2.5 group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#003d29] focus-visible:ring-offset-2 rounded-xl p-1"
            >
              <div className="relative flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#003d29] text-white shadow-xs transition-transform group-hover:scale-105">
                <ShoppingCart className="w-5 h-5 text-white" strokeWidth={2.2} />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full border-2 border-white" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xl sm:text-2xl font-black tracking-tight text-[#003d29]">
                  PASARIA
                </span>
                <span className="text-[9px] uppercase tracking-wider font-extrabold text-emerald-700 -mt-1 hidden sm:inline">
                  Marketplace Indonesia
                </span>
              </div>
            </button>

            {/* Desktop Categories Dropdown */}
            <div className="hidden lg:flex items-center gap-6 text-xs font-semibold text-slate-700">
              <div className="relative" ref={categoriesRef}>
                <button
                  type="button"
                  onClick={() => setShowCategoriesMenu(!showCategoriesMenu)}
                  aria-haspopup="true"
                  aria-expanded={showCategoriesMenu}
                  aria-controls="desktop-categories-popover"
                  className="flex items-center gap-1.5 hover:text-[#003d29] transition-colors cursor-pointer py-1.5 px-2 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#003d29] focus-visible:ring-offset-2"
                >
                  <span>Kategori</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      showCategoriesMenu ? 'rotate-180 text-[#003d29]' : 'text-slate-400'
                    }`}
                  />
                </button>

                {showCategoriesMenu && (
                  <div
                    id="desktop-categories-popover"
                    role="menu"
                    className="absolute left-0 mt-3 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 p-3.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                  >
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 mb-1">
                      Kategori Pilihan PASARIA
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {categoryList.map((cat) => {
                        const Icon = cat.icon;
                        return (
                          <button
                            key={cat.name}
                            type="button"
                            role="menuitem"
                            onClick={() => {
                              setShowCategoriesMenu(false);
                              onNavigateCategory(cat.name);
                            }}
                            className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-50 transition-colors text-left group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#003d29]"
                          >
                            <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-[#003d29] shrink-0">
                              <Icon className="w-3.5 h-3.5" />
                            </div>
                            <div className="truncate">
                              <div className="text-xs font-bold text-slate-800 group-hover:text-[#003d29] truncate">
                                {cat.name}
                              </div>
                              <div className="text-[9px] text-slate-400 truncate">
                                {cat.count}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => onNavigateCategory('Deals')}
                className="hover:text-[#003d29] transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#003d29] rounded-lg px-2 py-1"
              >
                Promo & Diskon
              </button>
              <button
                type="button"
                onClick={() => onNavigateCategory("What's New")}
                className="hover:text-[#003d29] transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#003d29] rounded-lg px-2 py-1"
              >
                Produk Baru
              </button>
              <button
                type="button"
                onClick={() => onNavigateCategory('Delivery')}
                className="hover:text-[#003d29] transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#003d29] rounded-lg px-2 py-1"
              >
                Lacak Kiriman
              </button>
            </div>
          </div>

          {/* Center: Search Bar with Autocomplete */}
          <div className="flex-1 max-w-md relative hidden md:block" ref={searchContainerRef}>
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSearchSuggestions(true);
                }}
                onFocus={() => setShowSearchSuggestions(true)}
                placeholder="Cari produk original, headphone, gadget, toko..."
                className="w-full min-h-[44px] pl-4 pr-11 py-2.5 text-xs sm:text-sm bg-slate-100/80 hover:bg-slate-100 focus:bg-white text-slate-800 rounded-full border border-transparent focus:border-emerald-600/30 focus:outline-none focus:ring-2 focus:ring-[#003d29]/15 transition-all placeholder:text-slate-400"
              />
              <button
                type="submit"
                aria-label="Cari"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center text-slate-400 hover:text-[#003d29] transition-colors cursor-pointer rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[#003d29]"
              >
                <Search className="w-4 h-4" />
              </button>
            </form>

            {showSearchSuggestions && searchQuery.trim().length > 0 && (
              <div className="absolute left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 overflow-hidden animate-in fade-in duration-150 text-left">
                {searchSuggestions.length > 0 ? (
                  <div>
                    <div className="px-4 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Saran Produk PASARIA
                    </div>
                    {searchSuggestions.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelectSuggestion(item.name)}
                        className="w-full min-h-[44px] flex items-center justify-between px-4 py-2 hover:bg-slate-50 transition-colors text-left group cursor-pointer focus:outline-none focus-visible:bg-slate-50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                            <ProductVisual imageKey={item.image} name={item.name} size="sm" />
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-slate-800 group-hover:text-[#003d29] transition-colors line-clamp-1">
                              {item.name}
                            </div>
                            <div className="text-[10px] text-emerald-700 font-semibold">
                              ★ {Number(item.rating || 5).toFixed(1)}{' '}
                              <span className="text-slate-400 font-normal">({item.review_count || 0})</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-xs font-bold text-[#003d29] tabular-nums">
                          {formatRupiah(item.price)}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="px-4 py-3 text-center text-xs text-slate-500">
                    Tekan Enter untuk mencari "{searchQuery}"
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: Actions (Wishlist, Chat, Notification, Cart, Account) */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {/* Wishlist Button */}
            {user && onNavigateWishlist && (
              <button
                type="button"
                onClick={onNavigateWishlist}
                aria-label="Wishlist Saya"
                title="Wishlist Saya"
                className="w-11 h-11 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 hover:text-rose-600 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#003d29] focus-visible:ring-offset-2 shrink-0"
              >
                <Heart className="w-4 h-4" />
              </button>
            )}

            {/* Chat Button */}
            {user && onOpenChat && (
              <button
                type="button"
                onClick={onOpenChat}
                aria-label="Pesan dan Chat"
                title="Pesan / Chat"
                className="w-11 h-11 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 hover:text-[#003d29] transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#003d29] focus-visible:ring-offset-2 shrink-0"
              >
                <MessageCircle className="w-4 h-4" />
              </button>
            )}

            {/* Real Notification Dropdown */}
            {user && <NotificationDropdown />}

            {/* Cart Icon */}
            <button
              type="button"
              onClick={onNavigateCart}
              aria-label={`Keranjang Belanja, ${cartCount} barang`}
              title="Keranjang Belanja"
              className="relative w-11 h-11 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#003d29] focus-visible:ring-offset-2 shrink-0"
            >
              <ShoppingCart className="w-4 h-4" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#003d29] text-white text-[10px] font-bold flex items-center justify-center border-2 border-white">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Account Dropdown */}
            <div className="relative" ref={accountRef}>
              <button
                type="button"
                onClick={() => {
                  if (!user) {
                    onOpenAuth();
                  } else {
                    setShowAccountMenu(!showAccountMenu);
                  }
                }}
                aria-haspopup={user ? "true" : undefined}
                aria-expanded={user ? showAccountMenu : undefined}
                aria-controls={user ? "desktop-account-menu" : undefined}
                aria-label={user ? `Menu Akun: ${user.name}` : "Masuk ke Akun"}
                className="min-h-[44px] flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-800 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#003d29] focus-visible:ring-offset-2"
              >
                <UserIcon className="w-4 h-4 text-slate-700" />
                <span className="hidden sm:inline">
                  {user ? user.name.split(' ')[0] : 'Masuk'}
                </span>
              </button>

              {user && showAccountMenu && (
                <div
                  id="desktop-account-menu"
                  role="menu"
                  className="absolute right-0 mt-2.5 w-60 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in duration-150 text-left"
                >
                  <div className="px-4 py-2 border-b border-slate-100">
                    <div className="text-xs font-bold text-slate-900 truncate">{user.name}</div>
                    <div className="text-[11px] text-slate-400 truncate">{user.email}</div>
                    <span className="mt-1 inline-block text-[10px] font-bold uppercase tracking-wider text-[#003d29] bg-emerald-50 px-2 py-0.5 rounded-full">
                      {user.role}
                    </span>
                  </div>
                  <div className="py-1 text-xs">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setShowAccountMenu(false);
                        onNavigateProfile();
                      }}
                      className="w-full min-h-[40px] flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-slate-50 hover:text-[#003d29] transition-colors cursor-pointer focus:outline-none focus-visible:bg-slate-50"
                    >
                      <UserIcon className="w-4 h-4 text-slate-500" />
                      <span>Profil Saya</span>
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setShowAccountMenu(false);
                        onNavigateOrders();
                      }}
                      className="w-full min-h-[40px] flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-slate-50 hover:text-[#003d29] transition-colors cursor-pointer focus:outline-none focus-visible:bg-slate-50"
                    >
                      <Package className="w-4 h-4 text-slate-500" />
                      <span>Pesanan Saya</span>
                    </button>

                    {onNavigateWishlist && (
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setShowAccountMenu(false);
                          onNavigateWishlist();
                        }}
                        className="w-full min-h-[40px] flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-slate-50 hover:text-rose-600 transition-colors cursor-pointer focus:outline-none focus-visible:bg-slate-50"
                      >
                        <Heart className="w-4 h-4 text-rose-500" />
                        <span>Wishlist</span>
                      </button>
                    )}

                    {onNavigateFollowing && (
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setShowAccountMenu(false);
                          onNavigateFollowing();
                        }}
                        className="w-full min-h-[40px] flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-slate-50 hover:text-[#003d29] transition-colors cursor-pointer focus:outline-none focus-visible:bg-slate-50"
                      >
                        <Store className="w-4 h-4 text-slate-500" />
                        <span>Toko yang Diikuti</span>
                      </button>
                    )}

                    {/* Seller Center Navigation */}
                    {onNavigateShop && (
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setShowAccountMenu(false);
                          onNavigateShop();
                        }}
                        className="w-full min-h-[40px] flex items-center gap-2.5 px-4 py-2 font-bold text-[#003d29] bg-emerald-50/50 hover:bg-emerald-50 transition-colors cursor-pointer focus:outline-none focus-visible:bg-emerald-50"
                      >
                        <Store className="w-4 h-4 text-[#003d29]" />
                        <span>{user?.shop ? 'Seller Center (Toko Saya)' : 'Buka Toko Gratis'}</span>
                      </button>
                    )}

                    {/* Admin Panel Navigation (Role: admin or support) */}
                    {(user?.role === 'admin' || user?.role === 'support') && onNavigateAdmin && (
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setShowAccountMenu(false);
                          onNavigateAdmin();
                        }}
                        className="w-full min-h-[40px] flex items-center gap-2.5 px-4 py-2 font-bold text-amber-800 bg-amber-50/50 hover:bg-amber-50 transition-colors cursor-pointer focus:outline-none focus-visible:bg-amber-50"
                      >
                        <ShieldAlert className="w-4 h-4 text-amber-700" />
                        <span>Admin Panel PASARIA</span>
                      </button>
                    )}

                    {onNavigateSettings && (
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setShowAccountMenu(false);
                          onNavigateSettings();
                        }}
                        className="w-full min-h-[40px] flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-slate-50 hover:text-[#003d29] transition-colors cursor-pointer focus:outline-none focus-visible:bg-slate-50"
                      >
                        <SettingsIcon className="w-4 h-4 text-slate-500" />
                        <span>Pengaturan & Keamanan</span>
                      </button>
                    )}
                  </div>

                  <div className="border-t border-slate-100 pt-1">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setShowAccountMenu(false);
                        onLogout();
                      }}
                      className="w-full min-h-[40px] flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer focus:outline-none focus-visible:bg-rose-50"
                    >
                      <LogOut className="w-4 h-4 text-rose-500" />
                      <span>Keluar Akun</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Search Row (visible on small mobile screens below md) */}
        <div className="px-4 pb-3 md:hidden" ref={searchContainerRef}>
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchSuggestions(true);
              }}
              onFocus={() => setShowSearchSuggestions(true)}
              placeholder="Cari produk original di PASARIA..."
              className="w-full min-h-[44px] pl-4 pr-11 py-2.5 text-xs bg-slate-100/90 focus:bg-white text-slate-800 rounded-full border border-transparent focus:border-emerald-600/30 focus:outline-none focus:ring-2 focus:ring-[#003d29]/15 transition-all placeholder:text-slate-400"
            />
            <button
              type="submit"
              aria-label="Cari"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center text-slate-400 hover:text-[#003d29] transition-colors cursor-pointer rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[#003d29]"
            >
              <Search className="w-4 h-4" />
            </button>
          </form>

          {showSearchSuggestions && searchQuery.trim().length > 0 && (
            <div className="absolute left-4 right-4 mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 overflow-hidden animate-in fade-in duration-150 text-left">
              {searchSuggestions.length > 0 ? (
                <div>
                  <div className="px-4 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Saran Produk PASARIA
                  </div>
                  {searchSuggestions.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelectSuggestion(item.name)}
                      className="w-full min-h-[44px] flex items-center justify-between px-4 py-2 hover:bg-slate-50 transition-colors text-left group cursor-pointer focus:outline-none focus-visible:bg-slate-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                          <ProductVisual imageKey={item.image} name={item.name} size="sm" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-slate-800 group-hover:text-[#003d29] transition-colors line-clamp-1">
                            {item.name}
                          </div>
                          <div className="text-[10px] text-emerald-700 font-semibold">
                            ★ {Number(item.rating || 5).toFixed(1)}{' '}
                            <span className="text-slate-400 font-normal">({item.review_count || 0})</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-xs font-bold text-[#003d29] tabular-nums">
                        {formatRupiah(item.price)}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="px-4 py-3 text-center text-xs text-slate-500">
                  Tekan Enter untuk mencari "{searchQuery}"
                </div>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* Mobile Navigation Drawer Modal & Backdrop */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Dark transparent backdrop with pointer-events-auto */}
          <div
            className="fixed inset-0 bg-black/50 transition-opacity pointer-events-auto"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Mobile Drawer Panel */}
          <div
            id="mobile-navigation-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Navigasi Utama Mobile"
            className="relative w-full max-w-xs sm:max-w-sm bg-white h-full shadow-2xl z-10 flex flex-col justify-between overflow-y-auto pointer-events-auto animate-in slide-in-from-left duration-250"
          >
            <div>
              {/* Drawer Header */}
              <div className="flex items-center justify-between p-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-[#003d29] text-white shadow-xs">
                    <ShoppingCart className="w-5 h-5 text-white" strokeWidth={2.2} />
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full border-2 border-white" />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-lg font-black tracking-tight text-[#003d29]">PASARIA</span>
                    <span className="text-[9px] uppercase tracking-wider font-extrabold text-emerald-700 -mt-0.5">
                      Marketplace Indonesia
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  ref={drawerCloseBtnRef}
                  onClick={() => setIsMobileMenuOpen(false)}
                  aria-label="Tutup navigasi utama"
                  className="w-11 h-11 flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#003d29] focus-visible:ring-offset-2 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* User Profile Card or Auth Prompt */}
              <div className="p-4 border-b border-slate-100 bg-slate-50/70">
                {user ? (
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-emerald-100 text-[#003d29] flex items-center justify-center font-bold text-base shrink-0">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1 text-left">
                      <div className="text-sm font-bold text-slate-900 truncate">{user.name}</div>
                      <div className="text-xs text-slate-500 truncate">{user.email}</div>
                      <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wider text-[#003d29] bg-emerald-100/80 px-2 py-0.5 rounded-full">
                        {user.role}
                      </span>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onOpenAuth();
                    }}
                    className="w-full min-h-[44px] py-3 px-4 rounded-xl bg-[#003d29] text-white text-xs font-bold flex items-center justify-center gap-2 hover:bg-[#064e3b] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#003d29] focus-visible:ring-offset-2 cursor-pointer shadow-xs"
                  >
                    <UserIcon className="w-4 h-4" />
                    <span>Masuk / Daftar Akun</span>
                  </button>
                )}
              </div>

              {/* Navigation Items List */}
              <nav className="p-3 space-y-1 text-left" aria-label="Menu navigasi mobile">
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onNavigateHome();
                  }}
                  className="w-full min-h-[44px] py-3 px-4 rounded-xl flex items-center gap-3 text-xs font-bold text-slate-800 hover:bg-slate-100 hover:text-[#003d29] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#003d29] focus-visible:ring-offset-2 cursor-pointer"
                >
                  <ShoppingCart className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>Beranda</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onNavigateCategory('Deals');
                  }}
                  className="w-full min-h-[44px] py-3 px-4 rounded-xl flex items-center gap-3 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-[#003d29] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#003d29] focus-visible:ring-offset-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>Promo & Diskon</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onNavigateCategory("What's New");
                  }}
                  className="w-full min-h-[44px] py-3 px-4 rounded-xl flex items-center gap-3 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-[#003d29] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#003d29] focus-visible:ring-offset-2 cursor-pointer"
                >
                  <Package className="w-4 h-4 text-blue-500 shrink-0" />
                  <span>Produk Baru</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onNavigateCategory('Delivery');
                  }}
                  className="w-full min-h-[44px] py-3 px-4 rounded-xl flex items-center gap-3 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-[#003d29] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#003d29] focus-visible:ring-offset-2 cursor-pointer"
                >
                  <Globe className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span>Lacak Kiriman</span>
                </button>

                {/* Categories Grid */}
                <div className="pt-2 pb-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-4 py-1">
                    Kategori Pilihan
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 px-1 pt-1">
                    {categoryList.map((cat) => {
                      const Icon = cat.icon;
                      return (
                        <button
                          key={cat.name}
                          type="button"
                          onClick={() => {
                            setIsMobileMenuOpen(false);
                            onNavigateCategory(cat.name);
                          }}
                          className="min-h-[44px] py-2.5 px-3 rounded-xl flex items-center gap-2 text-left bg-slate-50 hover:bg-emerald-50 hover:text-[#003d29] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#003d29] focus-visible:ring-offset-2 cursor-pointer"
                        >
                          <Icon className="w-4 h-4 text-[#003d29] shrink-0" />
                          <span className="text-xs font-medium text-slate-800 truncate">{cat.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Authenticated user menu */}
                {user && (
                  <div className="pt-2 pb-1 space-y-1">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-4 py-1">
                      Akun Saya
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        onNavigateProfile();
                      }}
                      className="w-full min-h-[44px] py-3 px-4 rounded-xl flex items-center gap-3 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-[#003d29] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#003d29] focus-visible:ring-offset-2 cursor-pointer"
                    >
                      <UserIcon className="w-4 h-4 text-slate-600 shrink-0" />
                      <span>Profil Saya</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        onNavigateOrders();
                      }}
                      className="w-full min-h-[44px] py-3 px-4 rounded-xl flex items-center gap-3 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-[#003d29] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#003d29] focus-visible:ring-offset-2 cursor-pointer"
                    >
                      <Package className="w-4 h-4 text-slate-600 shrink-0" />
                      <span>Pesanan Saya</span>
                    </button>

                    {onNavigateWishlist && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          onNavigateWishlist();
                        }}
                        className="w-full min-h-[44px] py-3 px-4 rounded-xl flex items-center gap-3 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-rose-600 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#003d29] focus-visible:ring-offset-2 cursor-pointer"
                      >
                        <Heart className="w-4 h-4 text-rose-500 shrink-0" />
                        <span>Wishlist</span>
                      </button>
                    )}

                    {onNavigateFollowing && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          onNavigateFollowing();
                        }}
                        className="w-full min-h-[44px] py-3 px-4 rounded-xl flex items-center gap-3 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-[#003d29] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#003d29] focus-visible:ring-offset-2 cursor-pointer"
                      >
                        <Store className="w-4 h-4 text-slate-600 shrink-0" />
                        <span>Toko yang Diikuti</span>
                      </button>
                    )}

                    {onNavigateShop && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          onNavigateShop();
                        }}
                        className="w-full min-h-[44px] py-3 px-4 rounded-xl flex items-center gap-3 text-xs font-bold text-[#003d29] bg-emerald-50/70 hover:bg-emerald-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#003d29] focus-visible:ring-offset-2 cursor-pointer"
                      >
                        <Store className="w-4 h-4 text-[#003d29] shrink-0" />
                        <span>{user?.shop ? 'Seller Center (Toko Saya)' : 'Buka Toko Gratis'}</span>
                      </button>
                    )}

                    {(user?.role === 'admin' || user?.role === 'support') && onNavigateAdmin && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          onNavigateAdmin();
                        }}
                        className="w-full min-h-[44px] py-3 px-4 rounded-xl flex items-center gap-3 text-xs font-bold text-amber-800 bg-amber-50/70 hover:bg-amber-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 focus-visible:ring-offset-2 cursor-pointer"
                      >
                        <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
                        <span>Admin Panel PASARIA</span>
                      </button>
                    )}

                    {onNavigateSettings && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          onNavigateSettings();
                        }}
                        className="w-full min-h-[44px] py-3 px-4 rounded-xl flex items-center gap-3 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-[#003d29] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#003d29] focus-visible:ring-offset-2 cursor-pointer"
                      >
                        <SettingsIcon className="w-4 h-4 text-slate-500 shrink-0" />
                        <span>Pengaturan & Keamanan</span>
                      </button>
                    )}
                  </div>
                )}
              </nav>
            </div>

            {/* Bottom Actions (Language Switcher & Logout) */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/60 space-y-2">
              <div className="flex items-center justify-between px-2 py-1 text-xs">
                <span className="text-slate-500 font-medium flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-slate-400" />
                  Bahasa
                </span>
                <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200">
                  <button
                    type="button"
                    onClick={() => onLanguageChange('id')}
                    className={`min-h-[36px] min-w-[36px] px-3 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer flex items-center justify-center ${
                      currentLang === 'id'
                        ? 'bg-[#003d29] text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    ID
                  </button>
                  <button
                    type="button"
                    onClick={() => onLanguageChange('en')}
                    className={`min-h-[36px] min-w-[36px] px-3 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer flex items-center justify-center ${
                      currentLang === 'en'
                        ? 'bg-[#003d29] text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    EN
                  </button>
                </div>
              </div>

              {user && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onLogout();
                  }}
                  className="w-full min-h-[44px] py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>Keluar Akun</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
