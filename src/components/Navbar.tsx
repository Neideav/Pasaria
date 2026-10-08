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
  Users
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const categoriesRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);

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
    { name: 'Headphones', count: 'Original Audio Gear', icon: Headphones, slug: 'headphones' },
    { name: 'Electronics', count: 'Gadget & Aksesoris', icon: Laptop, slug: 'electronics' },
    { name: 'Furniture', count: 'Peralatan Rumah', icon: Armchair, slug: 'furniture' },
    { name: 'Shoes', count: 'Sepatu & Fashion', icon: Footprints, slug: 'shoes' },
    { name: 'Bags', count: 'Tas & Koper', icon: ShoppingBag, slug: 'bags' },
    { name: 'Books', count: 'Buku & Literasi', icon: Book, slug: 'books' },
  ];

  return (
    <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
        {/* Left: Brand Logo & Categories */}
        <div className="flex items-center gap-7">
          <button
            onClick={onNavigateHome}
            className="flex items-center gap-2.5 group cursor-pointer focus:outline-none"
          >
            <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-[#003d29] text-white shadow-xs transition-transform group-hover:scale-105">
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
                onClick={() => setShowCategoriesMenu(!showCategoriesMenu)}
                className="flex items-center gap-1.5 hover:text-[#003d29] transition-colors cursor-pointer py-1"
              >
                <span>Kategori</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    showCategoriesMenu ? 'rotate-180 text-[#003d29]' : 'text-slate-400'
                  }`}
                />
              </button>

              {showCategoriesMenu && (
                <div className="absolute left-0 mt-3 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 p-3.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 mb-1">
                    Kategori Pilihan PASARIA
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {categoryList.map((cat) => {
                      const Icon = cat.icon;
                      return (
                        <button
                          key={cat.name}
                          onClick={() => {
                            setShowCategoriesMenu(false);
                            onNavigateCategory(cat.name);
                          }}
                          className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-50 transition-colors text-left group cursor-pointer"
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
              onClick={() => onNavigateCategory('Deals')}
              className="hover:text-[#003d29] transition-colors cursor-pointer"
            >
              Promo & Diskon
            </button>
            <button
              onClick={() => onNavigateCategory("What's New")}
              className="hover:text-[#003d29] transition-colors cursor-pointer"
            >
              Produk Baru
            </button>
            <button
              onClick={() => onNavigateCategory('Delivery')}
              className="hover:text-[#003d29] transition-colors cursor-pointer"
            >
              Lacak Kiriman
            </button>
          </div>
        </div>

        {/* Center: Search Bar with Autocomplete */}
        <div className="flex-1 max-w-md relative" ref={searchContainerRef}>
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
              className="w-full pl-4 pr-10 py-2.5 text-xs sm:text-sm bg-slate-100/80 hover:bg-slate-100 focus:bg-white text-slate-800 rounded-full border border-transparent focus:border-emerald-600/30 focus:outline-none focus:ring-2 focus:ring-[#003d29]/10 transition-all placeholder:text-slate-400"
            />
            <button
              type="submit"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#003d29] transition-colors cursor-pointer p-1"
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
                      onClick={() => handleSelectSuggestion(item.name)}
                      className="w-full flex items-center justify-between px-4 py-2 hover:bg-slate-50 transition-colors text-left group cursor-pointer"
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
        <div className="flex items-center gap-2 sm:gap-3.5">
          {/* Wishlist Button */}
          {user && onNavigateWishlist && (
            <button
              onClick={onNavigateWishlist}
              className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 hover:text-rose-600 transition-colors cursor-pointer"
              title="Wishlist Saya"
            >
              <Heart className="w-4 h-4" />
            </button>
          )}

          {/* Chat Button */}
          {user && onOpenChat && (
            <button
              onClick={onOpenChat}
              className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 hover:text-[#003d29] transition-colors cursor-pointer"
              title="Pesan / Chat"
            >
              <MessageCircle className="w-4 h-4" />
            </button>
          )}

          {/* Real Notification Dropdown */}
          {user && <NotificationDropdown />}

          {/* Cart Icon */}
          <button
            onClick={onNavigateCart}
            className="relative w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 transition-colors cursor-pointer"
            title="Keranjang Belanja"
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
              onClick={() => {
                if (!user) {
                  onOpenAuth();
                } else {
                  setShowAccountMenu(!showAccountMenu);
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-800 transition-colors cursor-pointer"
            >
              <UserIcon className="w-3.5 h-3.5 text-slate-700" />
              <span className="hidden sm:inline">
                {user ? user.name.split(' ')[0] : 'Masuk'}
              </span>
            </button>

            {user && showAccountMenu && (
              <div className="absolute right-0 mt-2.5 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in duration-150 text-left">
                <div className="px-4 py-2 border-b border-slate-100">
                  <div className="text-xs font-bold text-slate-900 truncate">{user.name}</div>
                  <div className="text-[11px] text-slate-400 truncate">{user.email}</div>
                  <span className="mt-1 inline-block text-[10px] font-bold uppercase tracking-wider text-[#003d29] bg-emerald-50 px-2 py-0.5 rounded-full">
                    {user.role}
                  </span>
                </div>
                <div className="py-1 text-xs">
                  <button
                    onClick={() => {
                      setShowAccountMenu(false);
                      onNavigateProfile();
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-slate-50 hover:text-[#003d29] transition-colors cursor-pointer"
                  >
                    <UserIcon className="w-3.5 h-3.5" />
                    <span>Profil Saya</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowAccountMenu(false);
                      onNavigateOrders();
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-slate-50 hover:text-[#003d29] transition-colors cursor-pointer"
                  >
                    <Package className="w-3.5 h-3.5" />
                    <span>Pesanan Saya</span>
                  </button>

                  {onNavigateWishlist && (
                    <button
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
                      onClick={() => {
                        setShowAccountMenu(false);
                        onNavigateFollowing();
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-slate-50 hover:text-[#003d29] transition-colors cursor-pointer"
                    >
                      <Store className="w-3.5 h-3.5" />
                      <span>Toko yang Diikuti</span>
                    </button>
                  )}

                  {/* Seller Center Navigation */}
                  {onNavigateShop && (
                    <button
                      onClick={() => {
                        setShowAccountMenu(false);
                        onNavigateShop();
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 font-bold text-[#003d29] bg-emerald-50/50 hover:bg-emerald-50 transition-colors cursor-pointer"
                    >
                      <Store className="w-3.5 h-3.5 text-[#003d29]" />
                      <span>{user?.shop ? 'Seller Center (Toko Saya)' : 'Buka Toko Gratis'}</span>
                    </button>
                  )}

                  {/* Admin Panel Navigation (Role: admin or support) */}
                  {(user?.role === 'admin' || user?.role === 'support') && onNavigateAdmin && (
                    <button
                      onClick={() => {
                        setShowAccountMenu(false);
                        onNavigateAdmin();
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 font-bold text-amber-800 bg-amber-50/50 hover:bg-amber-50 transition-colors cursor-pointer"
                    >
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-700" />
                      <span>Admin Panel PASARIA</span>
                    </button>
                  )}

                  {onNavigateSettings && (
                    <button
                      onClick={() => {
                        setShowAccountMenu(false);
                        onNavigateSettings();
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-slate-50 hover:text-[#003d29] transition-colors cursor-pointer"
                    >
                      <SettingsIcon className="w-3.5 h-3.5 text-slate-500" />
                      <span>Pengaturan & Keamanan</span>
                    </button>
                  )}
                </div>

                <div className="border-t border-slate-100 pt-1">
                  <button
                    onClick={() => {
                      setShowAccountMenu(false);
                      onLogout();
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Keluar Akun</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
