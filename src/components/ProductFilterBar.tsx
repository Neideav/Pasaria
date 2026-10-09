import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, SlidersHorizontal, Check, X, RotateCcw } from 'lucide-react';

export interface FilterState {
  category: string;
  minPrice: number;
  maxPrice: number;
  minRating: number;
  color?: string;
  material?: string;
  offer?: string;
  sort: string;
}

interface ProductFilterBarProps {
  filters: FilterState;
  onChangeFilters: (newFilters: Partial<FilterState>) => void;
  onResetFilters: () => void;
}

const CATEGORY_OPTIONS = [
  { label: 'Semua Kategori', value: 'all' },
  { label: 'Audio & Headphone', value: 'headphones' },
  { label: 'Sepatu & Fashion', value: 'shoes' },
  { label: 'Furniture & Rumah', value: 'furniture' },
  { label: 'Tas & Aksesoris', value: 'bags' },
  { label: 'Laptop & Komputer', value: 'laptops' },
  { label: 'Buku & Edukasi', value: 'books' },
  { label: 'Kecantikan & Beauty', value: 'beauty' },
  { label: 'Olahraga & Sports', value: 'sports' },
];

const PRICE_TIERS = [
  { label: 'Semua Harga', min: 0, max: 999999999 },
  { label: 'Di bawah Rp 100.000', min: 0, max: 100000 },
  { label: 'Rp 100.000 - Rp 500.000', min: 100000, max: 500000 },
  { label: 'Rp 500.000 - Rp 1.500.000', min: 500000, max: 1500000 },
  { label: 'Di atas Rp 1.500.000', min: 1500000, max: 999999999 },
];

const RATING_OPTIONS = [
  { label: 'Semua Rating', rating: 0 },
  { label: '★ 4.5 Bintang ke Atas', rating: 4.5 },
  { label: '★ 4.8 Bintang ke Atas', rating: 4.8 },
  { label: '★ 5.0 Bintang Sempurna', rating: 5.0 },
];

const COLOR_OPTIONS = [
  { label: 'Semua Warna', value: 'all', dot: '' },
  { label: 'Hitam (Black)', value: 'black', dot: '#111827' },
  { label: 'Putih (White)', value: 'white', dot: '#ffffff' },
  { label: 'Abu-abu (Grey)', value: 'grey', dot: '#6b7280' },
  { label: 'Biru (Navy)', value: 'blue', dot: '#2563eb' },
  { label: 'Hijau (Green)', value: 'green', dot: '#059669' },
  { label: 'Cokelat (Brown)', value: 'brown', dot: '#78350f' },
  { label: 'Merah (Red)', value: 'red', dot: '#dc2626' },
  { label: 'Kuning (Yellow)', value: 'yellow', dot: '#eab308' },
];

const MATERIAL_OPTIONS = [
  { label: 'Semua Material', value: 'all' },
  { label: 'Kulit Asli (Leather)', value: 'leather' },
  { label: 'Kayu Alami (Wood)', value: 'wood' },
  { label: 'Katun & Kanvas (Cotton)', value: 'cotton' },
  { label: 'Logam & Aluminium (Metal)', value: 'metal' },
  { label: 'Polimer & Plastik ABS', value: 'plastic' },
  { label: 'Keramik & Kaca', value: 'ceramic' },
];

const OFFER_OPTIONS = [
  { label: 'Semua Penawaran', value: 'all' },
  { label: 'Diskon Spesial (% OFF)', value: 'discount' },
  { label: 'Official Store Terverifikasi', value: 'official' },
  { label: 'Stok Tersedia (Siap Kirim)', value: 'instock' },
  { label: 'Produk Terpopuler (Rating 5★)', value: 'popular' },
];

const SORT_OPTIONS = [
  { label: 'Paling Populer', shortLabel: 'Populer', value: 'popular' },
  { label: 'Harga: Termurah ke Termahal', shortLabel: 'Harga: Terendah', value: 'price-asc' },
  { label: 'Harga: Termahal ke Termurah', shortLabel: 'Harga: Tertinggi', value: 'price-desc' },
  { label: 'Rating Tertinggi', shortLabel: 'Rating Tertinggi', value: 'rating' },
  { label: 'Produk Terbaru', shortLabel: 'Terbaru', value: 'newest' },
];

export const ProductFilterBar: React.FC<ProductFilterBarProps> = ({
  filters,
  onChangeFilters,
  onResetFilters,
}) => {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setActiveDropdown(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDropdown = (name: string) => {
    setActiveDropdown(activeDropdown === name ? null : name);
  };

  const hasActiveFilters =
    (filters.minPrice && filters.minPrice > 0) ||
    (filters.maxPrice && filters.maxPrice < 999999999) ||
    (filters.minRating && filters.minRating > 0) ||
    (filters.category && filters.category !== 'all') ||
    (filters.color && filters.color !== 'all') ||
    (filters.material && filters.material !== 'all') ||
    (filters.offer && filters.offer !== 'all');

  // Helpers to get human-readable labels
  const getCategoryTitle = () => {
    if (!filters.category || filters.category === 'all') return 'Headphone Type';
    const found = CATEGORY_OPTIONS.find(
      (c) => c.value.toLowerCase() === filters.category.toLowerCase()
    );
    return found ? found.label.split(' ')[0] : filters.category;
  };

  const getPriceTitle = () => {
    if (!filters.minPrice && (!filters.maxPrice || filters.maxPrice >= 999999999)) return 'Price';
    if (filters.maxPrice <= 100000) return '< Rp 100rb';
    if (filters.minPrice >= 100000 && filters.maxPrice <= 500000) return 'Rp 100rb - 500rb';
    if (filters.minPrice >= 500000 && filters.maxPrice <= 1500000) return 'Rp 500rb - 1.5jt';
    if (filters.minPrice >= 1500000) return '> Rp 1.5jt';
    return 'Price';
  };

  const getColorTitle = () => {
    if (!filters.color || filters.color === 'all') return 'Color';
    const found = COLOR_OPTIONS.find((c) => c.value === filters.color);
    return found ? found.label.split(' ')[0] : 'Color';
  };

  const getMaterialTitle = () => {
    if (!filters.material || filters.material === 'all') return 'Material';
    const found = MATERIAL_OPTIONS.find((m) => m.value === filters.material);
    return found ? found.label.split(' ')[0] : 'Material';
  };

  const getOfferTitle = () => {
    if (!filters.offer || filters.offer === 'all') return 'Offer';
    const found = OFFER_OPTIONS.find((o) => o.value === filters.offer);
    return found ? found.label.split(' ')[0] : 'Offer';
  };

  const getSortTitle = () => {
    const found = SORT_OPTIONS.find((s) => s.value === filters.sort);
    return found ? found.shortLabel : 'Populer';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3 sm:py-4 relative" ref={containerRef}>
      <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4 border-b border-slate-200/80 pb-4 sm:pb-5">
        {/* Left: Pill Filters (Clean wrap, no overflow clipping, fully interactive) */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* 1. Category / Type Filter */}
          <div className="relative">
            <button
              onClick={() => toggleDropdown('type')}
              className={`inline-flex items-center gap-2 px-4 sm:px-4.5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm transition-colors cursor-pointer border shadow-none bg-transparent ${
                filters.category && filters.category !== 'all'
                  ? 'text-[#003d29] border-[#003d29] font-bold'
                  : 'text-slate-700 border-slate-200 hover:border-slate-400 font-medium'
              }`}
            >
              <span>{getCategoryTitle()}</span>
              <ChevronDown className="w-4 h-4 opacity-60 shrink-0" />
            </button>
            {activeDropdown === 'type' && (
              <div className="absolute left-0 mt-2 w-56 sm:w-60 bg-white rounded-2xl border border-slate-200 py-2 z-50 shadow-none animate-in fade-in">
                {CATEGORY_OPTIONS.map((cat) => {
                  const isActive =
                    (filters.category || 'all').toLowerCase() === cat.value.toLowerCase();
                  return (
                    <button
                      key={cat.value}
                      onClick={() => {
                        onChangeFilters({ category: cat.value });
                        setActiveDropdown(null);
                      }}
                      className="w-full flex items-center justify-between px-4 py-2.5 text-xs sm:text-sm text-left hover:bg-slate-50 transition-colors"
                    >
                      <span className={isActive ? 'font-bold text-[#003d29]' : 'text-slate-700'}>
                        {cat.label}
                      </span>
                      {isActive && <Check className="w-4 h-4 text-[#003d29]" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 2. Price Filter */}
          <div className="relative">
            <button
              onClick={() => toggleDropdown('price')}
              className={`inline-flex items-center gap-2 px-4 sm:px-4.5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm transition-colors cursor-pointer border shadow-none bg-transparent ${
                (filters.minPrice && filters.minPrice > 0) ||
                (filters.maxPrice && filters.maxPrice < 999999999)
                  ? 'text-[#003d29] border-[#003d29] font-bold'
                  : 'text-slate-700 border-slate-200 hover:border-slate-400 font-medium'
              }`}
            >
              <span>{getPriceTitle()}</span>
              <ChevronDown className="w-4 h-4 opacity-60 shrink-0" />
            </button>
            {activeDropdown === 'price' && (
              <div className="absolute left-0 mt-2 w-60 sm:w-64 bg-white rounded-2xl border border-slate-200 py-2 z-50 shadow-none animate-in fade-in">
                {PRICE_TIERS.map((tier) => {
                  const isActive =
                    filters.minPrice === tier.min && filters.maxPrice === tier.max;
                  return (
                    <button
                      key={tier.label}
                      onClick={() => {
                        onChangeFilters({ minPrice: tier.min, maxPrice: tier.max });
                        setActiveDropdown(null);
                      }}
                      className="w-full flex items-center justify-between px-4 py-2.5 text-xs sm:text-sm text-left hover:bg-slate-50 transition-colors"
                    >
                      <span className={isActive ? 'font-bold text-[#003d29]' : 'text-slate-700'}>
                        {tier.label}
                      </span>
                      {isActive && <Check className="w-4 h-4 text-[#003d29]" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 3. Review Rating Filter */}
          <div className="relative">
            <button
              onClick={() => toggleDropdown('review')}
              className={`inline-flex items-center gap-2 px-4 sm:px-4.5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm transition-colors cursor-pointer border shadow-none bg-transparent ${
                filters.minRating && filters.minRating > 0
                  ? 'text-[#003d29] border-[#003d29] font-bold'
                  : 'text-slate-700 border-slate-200 hover:border-slate-400 font-medium'
              }`}
            >
              <span>{filters.minRating > 0 ? `★ ${filters.minRating}+` : 'Review'}</span>
              <ChevronDown className="w-4 h-4 opacity-60 shrink-0" />
            </button>
            {activeDropdown === 'review' && (
              <div className="absolute left-0 mt-2 w-56 sm:w-60 bg-white rounded-2xl border border-slate-200 py-2 z-50 shadow-none animate-in fade-in">
                {RATING_OPTIONS.map((r) => {
                  const isActive = (filters.minRating || 0) === r.rating;
                  return (
                    <button
                      key={r.label}
                      onClick={() => {
                        onChangeFilters({ minRating: r.rating });
                        setActiveDropdown(null);
                      }}
                      className="w-full flex items-center justify-between px-4 py-2.5 text-xs sm:text-sm text-left hover:bg-slate-50 transition-colors"
                    >
                      <span className={isActive ? 'font-bold text-[#003d29]' : 'text-slate-700'}>
                        {r.label}
                      </span>
                      {isActive && <Check className="w-4 h-4 text-[#003d29]" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 4. Color Filter */}
          <div className="relative">
            <button
              onClick={() => toggleDropdown('color')}
              className={`inline-flex items-center gap-2 px-4 sm:px-4.5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm transition-colors cursor-pointer border shadow-none bg-transparent ${
                filters.color && filters.color !== 'all'
                  ? 'text-[#003d29] border-[#003d29] font-bold'
                  : 'text-slate-700 border-slate-200 hover:border-slate-400 font-medium'
              }`}
            >
              <span>{getColorTitle()}</span>
              <ChevronDown className="w-4 h-4 opacity-60 shrink-0" />
            </button>
            {activeDropdown === 'color' && (
              <div className="absolute left-0 mt-2 w-52 sm:w-56 bg-white rounded-2xl border border-slate-200 py-2 z-50 shadow-none animate-in fade-in max-h-64 overflow-y-auto">
                {COLOR_OPTIONS.map((c) => {
                  const isActive = (filters.color || 'all') === c.value;
                  return (
                    <button
                      key={c.value}
                      onClick={() => {
                        onChangeFilters({ color: c.value });
                        setActiveDropdown(null);
                      }}
                      className="w-full flex items-center justify-between px-4 py-2.5 text-xs sm:text-sm text-left hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        {c.dot && (
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0"
                            style={{ backgroundColor: c.dot }}
                          />
                        )}
                        <span className={isActive ? 'font-bold text-[#003d29]' : 'text-slate-700'}>
                          {c.label}
                        </span>
                      </div>
                      {isActive && <Check className="w-4 h-4 text-[#003d29]" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 5. Material Filter */}
          <div className="relative">
            <button
              onClick={() => toggleDropdown('material')}
              className={`inline-flex items-center gap-2 px-4 sm:px-4.5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm transition-colors cursor-pointer border shadow-none bg-transparent ${
                filters.material && filters.material !== 'all'
                  ? 'text-[#003d29] border-[#003d29] font-bold'
                  : 'text-slate-700 border-slate-200 hover:border-slate-400 font-medium'
              }`}
            >
              <span>{getMaterialTitle()}</span>
              <ChevronDown className="w-4 h-4 opacity-60 shrink-0" />
            </button>
            {activeDropdown === 'material' && (
              <div className="absolute left-0 mt-2 w-56 sm:w-60 bg-white rounded-2xl border border-slate-200 py-2 z-50 shadow-none animate-in fade-in">
                {MATERIAL_OPTIONS.map((m) => {
                  const isActive = (filters.material || 'all') === m.value;
                  return (
                    <button
                      key={m.value}
                      onClick={() => {
                        onChangeFilters({ material: m.value });
                        setActiveDropdown(null);
                      }}
                      className="w-full flex items-center justify-between px-4 py-2.5 text-xs sm:text-sm text-left hover:bg-slate-50 transition-colors"
                    >
                      <span className={isActive ? 'font-bold text-[#003d29]' : 'text-slate-700'}>
                        {m.label}
                      </span>
                      {isActive && <Check className="w-4 h-4 text-[#003d29]" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 6. Offer Filter */}
          <div className="relative">
            <button
              onClick={() => toggleDropdown('offer')}
              className={`inline-flex items-center gap-2 px-4 sm:px-4.5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm transition-colors cursor-pointer border shadow-none bg-transparent ${
                filters.offer && filters.offer !== 'all'
                  ? 'text-[#003d29] border-[#003d29] font-bold'
                  : 'text-slate-700 border-slate-200 hover:border-slate-400 font-medium'
              }`}
            >
              <span>{getOfferTitle()}</span>
              <ChevronDown className="w-4 h-4 opacity-60 shrink-0" />
            </button>
            {activeDropdown === 'offer' && (
              <div className="absolute left-0 mt-2 w-60 sm:w-64 bg-white rounded-2xl border border-slate-200 py-2 z-50 shadow-none animate-in fade-in">
                {OFFER_OPTIONS.map((o) => {
                  const isActive = (filters.offer || 'all') === o.value;
                  return (
                    <button
                      key={o.value}
                      onClick={() => {
                        onChangeFilters({ offer: o.value });
                        setActiveDropdown(null);
                      }}
                      className="w-full flex items-center justify-between px-4 py-2.5 text-xs sm:text-sm text-left hover:bg-slate-50 transition-colors"
                    >
                      <span className={isActive ? 'font-bold text-[#003d29]' : 'text-slate-700'}>
                        {o.label}
                      </span>
                      {isActive && <Check className="w-4 h-4 text-[#003d29]" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 7. All Filters (Summary & Multi-Select Popover) */}
          <div className="relative">
            {hasActiveFilters ? (
              <button
                onClick={onResetFilters}
                className="inline-flex items-center gap-2 px-4 sm:px-4.5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-bold bg-transparent text-red-600 border border-red-200 hover:border-red-300 hover:bg-red-50/50 transition-colors cursor-pointer shadow-none"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset Filters</span>
              </button>
            ) : (
              <button
                onClick={() => toggleDropdown('all_filters')}
                className="inline-flex items-center gap-2 px-4 sm:px-4.5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-medium bg-transparent text-slate-700 border border-slate-200 hover:border-slate-400 transition-colors cursor-pointer shadow-none"
              >
                <SlidersHorizontal className="w-4 h-4 opacity-60" />
                <span>All Filters</span>
              </button>
            )}

            {activeDropdown === 'all_filters' && (
              <div className="absolute left-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl border border-slate-200 p-5 z-50 shadow-none animate-in fade-in">
                <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
                  <span className="font-bold text-sm text-slate-900">Semua Filter Produk</span>
                  <button
                    onClick={() => setActiveDropdown(null)}
                    className="text-slate-400 hover:text-slate-600 p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Quick selection blocks */}
                <div className="space-y-4 py-4 text-xs sm:text-sm">
                  <div>
                    <span className="font-semibold text-slate-700 mb-2 block">Kategori Cepat</span>
                    <div className="flex flex-wrap gap-2">
                      {CATEGORY_OPTIONS.slice(0, 5).map((c) => (
                        <button
                          key={c.value}
                          onClick={() => onChangeFilters({ category: c.value })}
                          className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
                            (filters.category || 'all') === c.value
                              ? 'border-[#003d29] text-[#003d29] font-bold'
                              : 'border-slate-200 text-slate-600 hover:border-slate-400'
                          }`}
                        >
                          {c.label.split(' ')[0]}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="font-semibold text-slate-700 mb-2 block">Rating Minimal</span>
                    <div className="flex gap-2">
                      {[0, 4.5, 4.8, 5.0].map((rate) => (
                        <button
                          key={rate}
                          onClick={() => onChangeFilters({ minRating: rate })}
                          className={`flex-1 py-1.5 rounded-xl text-center text-xs font-medium border transition-colors ${
                            (filters.minRating || 0) === rate
                              ? 'border-[#003d29] text-[#003d29] font-bold'
                              : 'border-slate-200 text-slate-600 hover:border-slate-400'
                          }`}
                        >
                          {rate === 0 ? 'Semua' : `★ ${rate}+`}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => {
                      onResetFilters();
                      setActiveDropdown(null);
                    }}
                    className="text-xs sm:text-sm text-slate-500 hover:text-red-600 font-semibold"
                  >
                    Reset Semua
                  </button>
                  <button
                    onClick={() => setActiveDropdown(null)}
                    className="px-5 py-2 rounded-full text-xs sm:text-sm font-bold text-white bg-[#003d29] hover:bg-[#00261a] transition-colors"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Sort By Dropdown (Fixed Right, shrink-0, Never Wraps Below) */}
        <div className="relative shrink-0 ml-auto z-20">
          <div className="flex items-center gap-2 sm:gap-2.5">
            <span className="text-xs sm:text-sm text-slate-400 font-medium hidden md:inline">
              Sort by:
            </span>
            <button
              onClick={() => toggleDropdown('sort')}
              className="inline-flex items-center gap-2 px-3.5 sm:px-4.5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-medium bg-transparent text-slate-700 border border-slate-200 hover:border-slate-400 transition-colors cursor-pointer shadow-none whitespace-nowrap"
            >
              <span className="max-w-[130px] sm:max-w-[160px] truncate">{getSortTitle()}</span>
              <ChevronDown className="w-4 h-4 opacity-60 shrink-0" />
            </button>
          </div>

          {activeDropdown === 'sort' && (
            <div className="absolute right-0 mt-2 w-56 sm:w-60 bg-white rounded-2xl border border-slate-200 py-2 z-40 shadow-none animate-in fade-in">
              {SORT_OPTIONS.map((s) => (
                <button
                  key={s.value}
                  onClick={() => {
                    onChangeFilters({ sort: s.value });
                    setActiveDropdown(null);
                  }}
                  className="w-full flex items-center justify-between px-4 py-2.5 text-xs sm:text-sm text-left hover:bg-slate-50 transition-colors"
                >
                  <span
                    className={
                      filters.sort === s.value ? 'font-bold text-[#003d29]' : 'text-slate-700'
                    }
                  >
                    {s.label}
                  </span>
                  {filters.sort === s.value && <Check className="w-4 h-4 text-[#003d29]" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

