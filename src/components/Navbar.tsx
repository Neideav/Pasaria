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
  Heart
} from 'lucide-react';
import { User, Product } from '../types';
import { ProductVisual } from './ProductVisual';

interface NavbarProps {
  user: User | null;
  cartCount: number;
  onNavigateHome: () => void;
  onNavigateCategory: (category: string) => void;
  onNavigateSearch: (query: string) => void;
  onNavigateCart: () => void;
  onNavigateProfile: () => void;
  onNavigateOrders: () => void;
  onOpenAuth: () => void;
  onLogout: () => void;
  products: Product[];
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  cartCount,
  onNavigateHome,
  onNavigateCategory,
  onNavigateSearch,
  onNavigateCart,
  onNavigateProfile,
  onNavigateOrders,
  onOpenAuth,
  onLogout,
  products,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [showCategoriesMenu, setShowCategoriesMenu] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const categoriesRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
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
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter products for search autocomplete preview
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
    { name: 'Furniture', count: '240 Item Available', icon: Armchair, slug: 'furniture' },
    { name: 'Headphone', count: '240 Item Available', icon: Headphones, slug: 'headphones' },
    { name: 'Shoe', count: '240 Item Available', icon: Footprints, slug: 'shoes' },
    { name: 'Bag', count: '240 Item Available', icon: ShoppingBag, slug: 'bags' },
    { name: 'Laptop', count: '240 Item Available', icon: Laptop, slug: 'laptops' },
    { name: 'Book', count: '240 Item Available', icon: Book, slug: 'books' },
  ];

  return (
    <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
        {/* Left: Brand Logo */}
        <div className="flex items-center gap-8">
          <button
            onClick={onNavigateHome}
            className="flex items-center gap-2 group cursor-pointer focus:outline-none"
          >
            <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-50 text-[#003d29] transition-transform group-hover:scale-105">
              <ShoppingCart className="w-5 h-5 text-[#003d29]" strokeWidth={2.2} />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full border-2 border-white"></span>
            </div>
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-[#003d29]">
              Shopcart
            </span>
          </button>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center gap-7 text-sm font-medium text-slate-700">
            {/* Categories dropdown */}
            <div className="relative" ref={categoriesRef}>
              <button
                onClick={() => setShowCategoriesMenu(!showCategoriesMenu)}
                className="flex items-center gap-1.5 hover:text-[#003d29] transition-colors cursor-pointer py-1"
              >
                <span>Categories</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    showCategoriesMenu ? 'rotate-180 text-[#003d29]' : 'text-slate-400'
                  }`}
                />
              </button>

              {/* Categories Mega Dropdown */}
              {showCategoriesMenu && (
                <div className="absolute left-0 mt-3 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 p-3.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-2 py-1 mb-1">
                    Popular Categories
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
                          className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors text-left group cursor-pointer"
                        >
                          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 group-hover:bg-emerald-100 group-hover:text-[#003d29] transition-colors shrink-0">
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="truncate">
                            <div className="text-xs font-semibold text-slate-800 group-hover:text-[#003d29] transition-colors truncate">
                              {cat.name}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate">
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
              Deals
            </button>
            <button
              onClick={() => onNavigateCategory('What\'s New')}
              className="hover:text-[#003d29] transition-colors cursor-pointer"
            >
              What's New
            </button>
            <button
              onClick={() => onNavigateCategory('Delivery')}
              className="hover:text-[#003d29] transition-colors cursor-pointer"
            >
              Delivery
            </button>
          </div>
        </div>

        {/* Center / Right: Search Bar with Autocomplete */}
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
              placeholder="Search Product"
              className="w-full pl-4 pr-10 py-2.5 text-xs sm:text-sm bg-slate-100/80 hover:bg-slate-100 focus:bg-white text-slate-800 rounded-full border border-transparent focus:border-emerald-600/30 focus:outline-none focus:ring-2 focus:ring-[#003d29]/10 transition-all placeholder:text-slate-400"
            />
            <button
              type="submit"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#003d29] transition-colors cursor-pointer p-1"
            >
              <Search className="w-4 h-4" />
            </button>
          </form>

          {/* Autocomplete Dropdown */}
          {showSearchSuggestions && searchQuery.trim().length > 0 && (
            <div className="absolute left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 overflow-hidden animate-in fade-in duration-150">
              {searchSuggestions.length > 0 ? (
                <div>
                  <div className="px-4 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Matching Products
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
                          <div className="text-xs font-medium text-slate-800 group-hover:text-[#003d29] transition-colors line-clamp-1">
                            {item.name}
                          </div>
                          <div className="text-[10px] text-emerald-600 font-semibold">
                            ★★★★★ <span className="text-slate-400 font-normal">({item.review_count})</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-xs font-semibold text-slate-900 tabular-nums">
                        ${item.price.toFixed(2)}
                      </div>
                    </button>
                  ))}
                  <div className="border-t border-slate-100 mt-1 pt-1.5 px-3">
                    <button
                      onClick={handleSearchSubmit}
                      className="w-full py-1.5 text-center text-xs font-medium text-[#003d29] hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                    >
                      View all results for "{searchQuery}"
                    </button>
                  </div>
                </div>
              ) : (
                <div className="px-4 py-3 text-center text-xs text-slate-500">
                  Press Enter to search for "{searchQuery}"
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Account & Cart */}
        <div className="flex items-center gap-4 sm:gap-6">
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
              className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-700 hover:text-[#003d29] transition-colors cursor-pointer py-1.5"
            >
              <UserIcon className="w-4 h-4 text-slate-700" />
              <span className="hidden sm:inline">
                {user ? user.name.split(' ')[0] : 'Sign In'}
              </span>
            </button>

            {user && showAccountMenu && (
              <div className="absolute right-0 mt-2.5 w-52 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in duration-150">
                <div className="px-4 py-2 border-b border-slate-100">
                  <div className="text-xs font-bold text-slate-900 truncate">{user.name}</div>
                  <div className="text-[11px] text-slate-400 truncate">{user.email}</div>
                </div>
                <div className="py-1">
                  <button
                    onClick={() => {
                      setShowAccountMenu(false);
                      onNavigateProfile();
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-[#003d29] transition-colors"
                  >
                    <UserIcon className="w-3.5 h-3.5" />
                    <span>My Profile</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowAccountMenu(false);
                      onNavigateOrders();
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-[#003d29] transition-colors"
                  >
                    <Package className="w-3.5 h-3.5" />
                    <span>My Orders</span>
                  </button>
                </div>
                <div className="border-t border-slate-100 pt-1">
                  <button
                    onClick={() => {
                      setShowAccountMenu(false);
                      onLogout();
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Cart Icon */}
          <button
            onClick={onNavigateCart}
            className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-700 hover:text-[#003d29] transition-colors cursor-pointer relative py-1.5"
          >
            <div className="relative">
              <ShoppingCart className="w-4 h-4 text-slate-700" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#003d29] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-in zoom-in-75">
                  {cartCount}
                </span>
              )}
            </div>
            <span className="hidden sm:inline">Cart</span>
          </button>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-1.5 text-slate-700 hover:text-[#003d29] transition-colors"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-100 bg-white px-4 py-4 space-y-3 animate-in slide-in-from-top-2">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Categories
          </div>
          <div className="grid grid-cols-2 gap-2">
            {categoryList.map((cat) => (
              <button
                key={cat.name}
                onClick={() => {
                  setMobileMenuOpen(false);
                  onNavigateCategory(cat.name);
                }}
                className="text-left px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-lg"
              >
                {cat.name}
              </button>
            ))}
          </div>
          <div className="border-t border-slate-100 pt-2 space-y-1">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onNavigateCategory('Deals');
              }}
              className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-lg"
            >
              Deals
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onNavigateCategory("What's New");
              }}
              className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-lg"
            >
              What's New
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onNavigateCategory('Delivery');
              }}
              className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-lg"
            >
              Delivery
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};
