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
  ArrowRight,
} from 'lucide-react';
import { User, Product } from '../types';
import { ProductVisual } from './ProductVisual';
import { NotificationDropdown } from './NotificationDropdown';
import { formatRupiah } from '../utils/formatters';
import { Language, translations } from '../i18n/translations';
import categoryCardImg from '../assets/images/hero_card_yellow_knit.jpg';

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
  onOpenAuth: (tab?: 'login' | 'register') => void;
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
  const isId = currentLang === 'id';
  const [searchQuery, setSearchQuery] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [showCategoriesMenu, setShowCategoriesMenu] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const placeholderSuggestions = isId
    ? [
        'Cari "Jersey & Apparel"...',
        'Cari "AirPods Max"...',
        'Cari "Sneakers Urban"...',
        'Cari "MacBook Pro M3"...',
        'Cari "Kursi Ergonomis"...',
        'Cari "Mechanical Keyboard"...',
        'Cari "Bose QuietComfort"...',
        'Cari "Buku Atomic Habits"...',
      ]
    : [
        'Search "Jersey & Apparel"...',
        'Search "AirPods Max"...',
        'Search "Urban Sneakers"...',
        'Search "MacBook Pro M3"...',
        'Search "Ergonomic Chair"...',
        'Search "Mechanical Keyboard"...',
        'Search "Bose QuietComfort"...',
        'Search "Atomic Habits"...',
      ];

  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholderSuggestions.length);
    }, 2800);
    return () => clearInterval(interval);
  }, [placeholderSuggestions.length]);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const categoriesRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
    { name: isId ? 'Audio & Headphone' : 'Headphones', slug: 'headphones' },
    { name: isId ? 'Laptop & Komputer' : 'Laptops & Computers', slug: 'laptops' },
    { name: isId ? 'Furniture & Rumah' : 'Furniture & Living', slug: 'furniture' },
    { name: isId ? 'Sepatu & Fashion' : 'Shoes & Fashion', slug: 'shoes' },
    { name: isId ? 'Tas & Aksesoris' : 'Bags & Accessories', slug: 'bags' },
    { name: isId ? 'Buku & Edukasi' : 'Books & Learning', slug: 'books' },
  ];

  const popularLinks = isId
    ? [
        { title: 'Promo & Diskon Kilat', target: 'Deals' },
        { title: 'Produk Terlaris Minggu Ini', target: 'popular' },
        { title: 'Official Store Terverifikasi', target: 'official' },
        { title: 'Produk Baru Rilis', target: "What's New" },
        { title: 'Lacak Kiriman Pesanan', target: 'Delivery' },
        { title: 'Garansi Original PASARIA', target: 'all' },
      ]
    : [
        { title: 'Flash Deals & Discounts', target: 'Deals' },
        { title: 'Weekly Best Sellers', target: 'popular' },
        { title: 'Verified Official Stores', target: 'official' },
        { title: 'New Arrivals', target: "What's New" },
        { title: 'Track Order Delivery', target: 'Delivery' },
        { title: 'PASARIA Authenticity', target: 'all' },
      ];

  return (
    <nav
      className={`sticky top-0 z-40 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/85 backdrop-blur-xl border-b border-slate-200/80 shadow-none'
          : 'bg-[#fcfcfc] border-b border-slate-100 shadow-none'
      }`}
    >
      <div
        className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3 sm:gap-6 transition-all duration-300 ${
          isScrolled ? 'h-16 sm:h-17' : 'h-18 sm:h-20'
        }`}
      >
        {/* Left Section: Brand Logo & Categories */}
        <div className="flex items-center gap-4 lg:gap-6 justify-start shrink-0">
          {/* Brand Logo (Left) */}
          <button
            onClick={onNavigateHome}
            className="flex items-center gap-2 group cursor-pointer focus:outline-none shrink-0"
            aria-label="PASARIA Home"
          >
            <div className="relative flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#003d29] text-white shadow-none transition-transform group-hover:scale-105">
              <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 text-white" strokeWidth={2.2} />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-amber-400 rounded-full border border-white" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-base sm:text-lg lg:text-xl font-black tracking-tight text-[#003d29]">
                PASARIA
              </span>
            </div>
          </button>

          {/* Categories Mega Dropdown (Left next to logo) */}
          <div className="relative hidden md:flex items-center" ref={categoriesRef}>
            <button
              type="button"
              onClick={() => setShowCategoriesMenu(!showCategoriesMenu)}
              className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-700 hover:text-[#003d29] transition-colors cursor-pointer py-1.5 px-3 rounded-full hover:bg-slate-100"
            >
              <span>{isId ? 'Kategori' : 'Categories'}</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  showCategoriesMenu ? 'rotate-180 text-[#003d29]' : 'text-slate-400'
                }`}
              />
            </button>

            {showCategoriesMenu && (
              <div className="absolute left-0 top-full mt-6 sm:mt-7 w-[720px] lg:w-[820px] xl:w-[860px] max-w-[calc(100vw-2rem)] bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 z-50 animate-in fade-in slide-in-from-top-2 duration-150 shadow-none text-left flex gap-7 lg:gap-9">
                {/* Left: Featured Image Card */}
                <div
                  onClick={() => {
                    setShowCategoriesMenu(false);
                    onNavigateCategory('all');
                  }}
                  className="w-48 sm:w-56 h-60 sm:h-68 rounded-xl overflow-hidden relative shrink-0 group/card cursor-pointer bg-slate-900"
                >
                  <img
                    src={categoryCardImg}
                    alt="Featured Collections"
                    className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-500 opacity-90"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent flex items-end justify-between p-4">
                    <span className="text-white font-extrabold text-sm sm:text-base tracking-tight leading-snug">
                      {isId ? 'Koleksi Pilihan' : 'Featured Catalog'}
                    </span>
                    <div className="w-7 h-7 rounded-full bg-white text-slate-900 flex items-center justify-center shrink-0 shadow-xs group-hover/card:translate-x-1 transition-transform">
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>

                {/* Right: 2 Columns of Links */}
                <div className="flex-1 grid grid-cols-2 gap-x-8 sm:gap-x-12 gap-y-3 py-1">
                  <div>
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">
                      {isId ? 'Kategori Utama' : 'Main Categories'}
                    </div>
                    <div className="space-y-2.5">
                      {categoryList.map((cat) => (
                        <button
                          key={cat.slug}
                          type="button"
                          onClick={() => {
                            setShowCategoriesMenu(false);
                            onNavigateCategory(cat.slug);
                          }}
                          className="text-sm font-medium text-slate-700 hover:text-slate-950 hover:underline transition-all block text-left cursor-pointer whitespace-nowrap w-full"
                        >
                          {cat.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">
                      {isId ? 'Paling Populer' : 'Popular Highlights'}
                    </div>
                    <div className="space-y-2.5">
                      {popularLinks.map((link) => (
                        <button
                          key={link.title}
                          type="button"
                          onClick={() => {
                            setShowCategoriesMenu(false);
                            onNavigateCategory(link.target);
                          }}
                          className="text-sm font-medium text-slate-700 hover:text-slate-950 hover:underline transition-all block text-left cursor-pointer whitespace-nowrap w-full"
                        >
                          {link.title}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Center Section: Centered Search Bar */}
        <div className="flex-1 max-w-md md:max-w-xl mx-2 sm:mx-4 relative" ref={searchContainerRef}>
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <div className="relative flex items-center w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none stroke-[2]" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSearchSuggestions(true);
                }}
                onFocus={() => setShowSearchSuggestions(true)}
                placeholder={placeholderSuggestions[placeholderIndex]}
                className="w-full pl-10 pr-9 py-2 text-xs sm:text-sm bg-[#f4f4f5] hover:bg-[#ececee] focus:bg-white text-slate-900 rounded-full border border-transparent focus:border-slate-300 focus:outline-none transition-all placeholder:text-slate-400 placeholder:transition-opacity placeholder:duration-300"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setShowSearchSuggestions(false);
                  }}
                  className="absolute right-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </form>

          {/* Search Suggestions Dropdown */}
          {showSearchSuggestions && searchQuery.trim().length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-4 sm:mt-5 bg-white rounded-2xl border border-slate-200 py-2 z-50 overflow-hidden shadow-none text-left">
              {searchSuggestions.length > 0 ? (
                <div>
                  <div className="px-3.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {isId ? 'Saran Produk PASARIA' : 'Suggested Products'}
                  </div>
                  {searchSuggestions.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelectSuggestion(item.name)}
                      className="w-full flex items-center justify-between px-3.5 py-2 hover:bg-slate-50 transition-colors text-left group cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                          <ProductVisual imageKey={item.image} name={item.name} size="sm" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-slate-800 group-hover:text-slate-950 truncate">
                            {item.name}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate">
                            {formatRupiah(item.price)}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="px-4 py-3 text-center text-xs text-slate-500">
                  {isId
                    ? `Tekan Enter untuk mencari "${searchQuery}"`
                    : `Press Enter to search "${searchQuery}"`}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Section: Log in / Masuk & Daftar (Pill) or User Account Menu, Cart, Language */}
        <div className="flex items-center gap-2.5 sm:gap-3.5 justify-end shrink-0">
          {!user ? (
            /* Unauthenticated state: "Log in" / "Masuk" (text link) + "Daftar" (black pill button) */
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => onOpenAuth('login')}
                className="text-xs sm:text-sm font-semibold text-slate-800 hover:text-slate-950 transition-colors cursor-pointer py-1 px-1.5 whitespace-nowrap"
              >
                {isId ? 'Log in' : 'Log in'}
              </button>

              <button
                type="button"
                onClick={() => onOpenAuth('register')}
                className="px-4 sm:px-5 py-2 rounded-full bg-slate-950 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold transition-all cursor-pointer active:scale-95 whitespace-nowrap shadow-none"
              >
                {isId ? 'Daftar' : 'Sign up'}
              </button>

              {/* Cart Button */}
              <button
                type="button"
                onClick={onNavigateCart}
                className="group flex items-center justify-center w-9 h-9 rounded-full border border-slate-200 hover:border-slate-300 bg-transparent text-slate-800 transition-all cursor-pointer whitespace-nowrap relative"
                title={isId ? 'Keranjang Belanja' : 'Cart'}
              >
                <ShoppingCart className="w-4 h-4" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4.5 h-4.5 rounded-full bg-[#003d29] text-white text-[10px] font-bold flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
          ) : (
            /* Authenticated state: Wishlist, Chat, Notifications, Account Menu, Cart Pill */
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Wishlist Button */}
              {onNavigateWishlist && (
                <button
                  type="button"
                  onClick={onNavigateWishlist}
                  className="w-8 h-8 rounded-full border border-slate-200 hover:border-slate-300 bg-transparent flex items-center justify-center text-slate-600 hover:text-rose-500 transition-colors cursor-pointer"
                  title={isId ? 'Wishlist Saya' : 'My Wishlist'}
                >
                  <Heart className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Chat Button */}
              {onOpenChat && (
                <button
                  type="button"
                  onClick={onOpenChat}
                  className="w-8 h-8 rounded-full border border-slate-200 hover:border-slate-300 bg-transparent flex items-center justify-center text-slate-600 hover:text-[#003d29] transition-colors cursor-pointer"
                  title={isId ? 'Pesan / Chat' : 'Messages'}
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Notification Bell Dropdown */}
              <NotificationDropdown />

              {/* Account Dropdown */}
              <div className="relative" ref={accountRef}>
                <button
                  type="button"
                  onClick={() => setShowAccountMenu(!showAccountMenu)}
                  className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-700 hover:text-slate-950 transition-colors cursor-pointer whitespace-nowrap py-1 px-2.5 rounded-full border border-slate-200 hover:border-slate-300"
                >
                  <UserIcon className="w-3.5 h-3.5 text-slate-600" />
                  <span>{user.name.split(' ')[0]}</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {showAccountMenu && (
                  <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl border border-slate-200 py-2 z-50 shadow-none text-left">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <div className="text-xs font-bold text-slate-900 truncate">{user.name}</div>
                      <div className="text-[11px] text-slate-400 truncate">{user.email}</div>
                      <span className="mt-1 inline-block text-[9px] font-bold uppercase tracking-wider text-[#003d29] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                        {user.role}
                      </span>
                    </div>
                    <div className="py-1 text-xs font-medium">
                      <button
                        type="button"
                        onClick={() => {
                          setShowAccountMenu(false);
                          onNavigateProfile();
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-slate-50 hover:text-slate-950 transition-colors cursor-pointer"
                      >
                        <UserIcon className="w-3.5 h-3.5" />
                        <span>{isId ? 'Profil Saya' : 'My Profile'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowAccountMenu(false);
                          onNavigateOrders();
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-slate-50 hover:text-slate-950 transition-colors cursor-pointer"
                      >
                        <Package className="w-3.5 h-3.5" />
                        <span>{isId ? 'Pesanan Saya' : 'My Orders'}</span>
                      </button>

                      {onNavigateWishlist && (
                        <button
                          type="button"
                          onClick={() => {
                            setShowAccountMenu(false);
                            onNavigateWishlist();
                          }}
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-slate-50 hover:text-rose-600 transition-colors cursor-pointer"
                        >
                          <Heart className="w-3.5 h-3.5" />
                          <span>Wishlist</span>
                        </button>
                      )}

                      {onNavigateFollowing && (
                        <button
                          type="button"
                          onClick={() => {
                            setShowAccountMenu(false);
                            onNavigateFollowing();
                          }}
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-slate-50 hover:text-[#003d29] transition-colors cursor-pointer"
                        >
                          <Store className="w-3.5 h-3.5" />
                          <span>{isId ? 'Toko yang Diikuti' : 'Following Shops'}</span>
                        </button>
                      )}

                      {/* Seller Center Navigation */}
                      {onNavigateShop && (
                        <button
                          type="button"
                          onClick={() => {
                            setShowAccountMenu(false);
                            onNavigateShop();
                          }}
                          className="w-full flex items-center gap-2.5 px-4 py-2 font-bold text-[#003d29] hover:bg-emerald-50/50 transition-colors cursor-pointer"
                        >
                          <Store className="w-3.5 h-3.5 text-[#003d29]" />
                          <span>{user?.shop ? 'Seller Center' : (isId ? 'Buka Toko Gratis' : 'Open Store')}</span>
                        </button>
                      )}

                      {/* Admin Panel Navigation */}
                      {(user?.role === 'admin' || user?.role === 'support') && onNavigateAdmin && (
                        <button
                          type="button"
                          onClick={() => {
                            setShowAccountMenu(false);
                            onNavigateAdmin();
                          }}
                          className="w-full flex items-center gap-2.5 px-4 py-2 font-bold text-amber-800 hover:bg-amber-50/50 transition-colors cursor-pointer"
                        >
                          <ShieldAlert className="w-3.5 h-3.5 text-amber-700" />
                          <span>Admin Panel PASARIA</span>
                        </button>
                      )}

                      {onNavigateSettings && (
                        <button
                          type="button"
                          onClick={() => {
                            setShowAccountMenu(false);
                            onNavigateSettings();
                          }}
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-slate-50 hover:text-slate-950 transition-colors cursor-pointer"
                        >
                          <SettingsIcon className="w-3.5 h-3.5 text-slate-500" />
                          <span>{isId ? 'Pengaturan' : 'Settings'}</span>
                        </button>
                      )}
                    </div>

                    <div className="border-t border-slate-100 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setShowAccountMenu(false);
                          onLogout();
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>{isId ? 'Keluar Akun' : 'Log out'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Cart Pill Button */}
              <button
                type="button"
                onClick={onNavigateCart}
                className="group flex items-center gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-all cursor-pointer active:scale-95 whitespace-nowrap shadow-none"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{isId ? 'Keranjang' : 'Cart'}</span>
                {cartCount > 0 && (
                  <span className="w-4.5 h-4.5 rounded-full bg-white text-slate-900 text-[10px] font-extrabold flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
          )}

          {/* Language Selector (EN / ID) */}
          <div className="relative hidden sm:block" ref={langRef}>
            <button
              type="button"
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="text-xs font-semibold text-slate-700 hover:text-slate-950 transition-colors cursor-pointer uppercase py-1 px-1.5"
            >
              {currentLang === 'id' ? 'ID' : 'EN'}
            </button>

            {showLangMenu && (
              <div className="absolute right-0 mt-2 w-28 bg-white rounded-xl border border-slate-200 py-1 z-50 text-left shadow-none">
                <button
                  type="button"
                  onClick={() => {
                    onLanguageChange('id');
                    setShowLangMenu(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                    currentLang === 'id' ? 'bg-slate-100 text-slate-950' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  🇮🇩 ID (Bahasa)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onLanguageChange('en');
                    setShowLangMenu(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                    currentLang === 'en' ? 'bg-slate-100 text-slate-950' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  🇺🇸 EN-US
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 text-slate-700 hover:text-slate-950 cursor-pointer"
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-2.5 text-left animate-in fade-in duration-150">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            {isId ? 'Menu Navigasi' : 'Navigation'}
          </div>

          {/* Mobile Categories list */}
          <div className="space-y-1 pl-1">
            <div className="text-xs font-bold text-slate-800 py-1">
              {isId ? 'Kategori Produk' : 'Product Categories'}
            </div>
            <div className="grid grid-cols-2 gap-1.5 pb-2">
              {categoryList.map((cat) => (
                <button
                  key={cat.slug}
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onNavigateCategory(cat.slug);
                  }}
                  className="text-left text-xs text-slate-600 hover:text-[#003d29] py-1 truncate"
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => {
              setMobileMenuOpen(false);
              onNavigateCategory('Deals');
            }}
            className="block w-full py-1.5 text-xs font-semibold text-slate-800 hover:text-[#003d29]"
          >
            {isId ? 'Promo & Diskon' : 'Deals'}
          </button>
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              onNavigateCategory("What's New");
            }}
            className="block w-full py-1.5 text-xs font-semibold text-slate-800 hover:text-[#003d29]"
          >
            {isId ? 'Produk Baru' : "What's New"}
          </button>
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              onNavigateCategory('Delivery');
            }}
            className="block w-full py-1.5 text-xs font-semibold text-slate-800 hover:text-[#003d29]"
          >
            {isId ? 'Lacak Kiriman' : 'Delivery Tracking'}
          </button>
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              if (onNavigateShop) onNavigateShop();
            }}
            className="block w-full py-1.5 text-xs font-semibold text-slate-800 hover:text-[#003d29]"
          >
            {isId ? 'Buka Toko / Seller Center' : 'Open Store / Seller Center'}
          </button>

          <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Bahasa / Language</span>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  onLanguageChange('id');
                  setMobileMenuOpen(false);
                }}
                className={`text-xs px-2.5 py-1 rounded-md font-bold ${
                  currentLang === 'id' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                ID
              </button>
              <button
                onClick={() => {
                  onLanguageChange('en');
                  setMobileMenuOpen(false);
                }}
                className={`text-xs px-2.5 py-1 rounded-md font-bold ${
                  currentLang === 'en' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                EN
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};
