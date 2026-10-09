import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, SlidersHorizontal, Check, X, Sparkles } from 'lucide-react';
import { formatRupiah } from '../utils/formatters';

interface FilterState {
  category: string;
  minPrice: number;
  maxPrice: number;
  minRating: number;
  sort: string;
}

interface ProductFilterBarProps {
  filters: FilterState;
  onChangeFilters: (newFilters: Partial<FilterState>) => void;
  onResetFilters: () => void;
}

export const ProductFilterBar: React.FC<ProductFilterBarProps> = ({
  filters,
  onChangeFilters,
  onResetFilters,
}) => {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [dropdownCoords, setDropdownCoords] = useState<{ top: number; left: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click or Escape key
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setActiveDropdown(null);
        setDropdownCoords(null);
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setActiveDropdown(null);
        setDropdownCoords(null);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Close dropdown when scrolling horizontally or resizing
  useEffect(() => {
    const handleScrollOrResize = () => {
      if (activeDropdown) {
        setActiveDropdown(null);
        setDropdownCoords(null);
      }
    };

    window.addEventListener('resize', handleScrollOrResize);
    const scrollEl = scrollContainerRef.current;
    if (scrollEl) {
      scrollEl.addEventListener('scroll', handleScrollOrResize, { passive: true });
    }
    return () => {
      window.removeEventListener('resize', handleScrollOrResize);
      if (scrollEl) {
        scrollEl.removeEventListener('scroll', handleScrollOrResize);
      }
    };
  }, [activeDropdown]);

  const toggleDropdown = (name: string, e?: React.MouseEvent<HTMLButtonElement>) => {
    if (activeDropdown === name) {
      setActiveDropdown(null);
      setDropdownCoords(null);
    } else {
      if (e && containerRef.current) {
        const btnRect = e.currentTarget.getBoundingClientRect();
        const contRect = containerRef.current.getBoundingClientRect();
        const rawLeft = btnRect.left - contRect.left;
        const maxLeft = contRect.width - 250;
        setDropdownCoords({
          top: btnRect.bottom - contRect.top + 6,
          left: Math.max(8, Math.min(rawLeft, Math.max(8, maxLeft))),
        });
      }
      setActiveDropdown(name);
    }
  };

  const hasActiveFilters =
    filters.minPrice > 0 ||
    (filters.maxPrice > 0 && filters.maxPrice < 999999999) ||
    filters.minRating > 0 ||
    (filters.category !== 'all' && filters.category !== '');

  const categories = [
    { label: 'Semua Kategori', value: 'all' },
    { label: 'Audio & Headphone', value: 'Audio & Headphone' },
    { label: 'Laptop & Komputer', value: 'Laptop & Komputer' },
    { label: 'Furniture & Rumah', value: 'Furniture & Rumah' },
    { label: 'Sepatu & Fashion', value: 'Sepatu & Fashion' },
    { label: 'Tas & Aksesoris', value: 'Tas & Aksesoris' },
    { label: 'Buku & Edukasi', value: 'Buku & Edukasi' },
    { label: 'Headphones', value: 'Headphones' },
    { label: 'Earbuds', value: 'Earbuds' },
    { label: 'Speakers', value: 'Speakers' },
    { label: 'Accessories', value: 'Accessories' },
  ];

  const priceTiers = [
    { label: 'Semua Harga', min: 0, max: 999999999 },
    { label: 'Di bawah Rp 500 rb', min: 0, max: 500000 },
    { label: 'Rp 500 rb - Rp 1,5 jt', min: 500000, max: 1500000 },
    { label: 'Rp 1,5 jt - Rp 5 jt', min: 1500000, max: 5000000 },
    { label: 'Di atas Rp 5 jt', min: 5000000, max: 999999999 },
  ];

  const ratingTiers = [
    { label: 'Semua Rating', rating: 0 },
    { label: '★ 4.5 ke Atas', rating: 4.5 },
    { label: '★ 4.8 ke Atas', rating: 4.8 },
    { label: '★ 5.0 Sempurna', rating: 5.0 },
  ];

  const sortOptions = [
    { label: 'Paling Populer', value: 'popular' },
    { label: 'Harga: Rendah ke Tinggi', value: 'price-asc' },
    { label: 'Harga: Tinggi ke Rendah', value: 'price-desc' },
    { label: 'Rating Tertinggi', value: 'rating' },
    { label: 'Terbaru', value: 'newest' },
  ];

  // Active Category Label
  const activeCatObj = categories.find(
    (c) => c.value.toLowerCase() === filters.category.toLowerCase()
  );
  const isCategoryActive = filters.category !== 'all' && filters.category !== '';
  const categoryBtnLabel = isCategoryActive
    ? activeCatObj?.label || filters.category
    : 'Kategori Produk';

  // Active Price Label
  const isPriceActive =
    filters.minPrice > 0 || (filters.maxPrice > 0 && filters.maxPrice < 999999999);
  const activePriceTier = priceTiers.find(
    (tier) => filters.minPrice === tier.min && filters.maxPrice === tier.max
  );
  const priceBtnLabel = isPriceActive
    ? activePriceTier?.label ||
      (filters.minPrice > 0 && filters.maxPrice < 999999999
        ? `${formatRupiah(filters.minPrice)} - ${formatRupiah(filters.maxPrice)}`
        : filters.minPrice > 0
        ? `≥ ${formatRupiah(filters.minPrice)}`
        : `≤ ${formatRupiah(filters.maxPrice)}`)
    : 'Rentang Harga';

  // Active Rating Label
  const isRatingActive = filters.minRating > 0;
  const ratingBtnLabel = isRatingActive
    ? `★ ${filters.minRating}+`
    : 'Rating Ulasan';

  // Current Sort Label
  const currentSortLabel =
    sortOptions.find((s) => s.value === filters.sort)?.label || 'Paling Populer';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-2 relative" ref={containerRef}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        {/* Left: Horizontal Filter Scroll Container */}
        <div
          ref={scrollContainerRef}
          role="region"
          aria-label="Filter Produk"
          className="flex items-center gap-2 sm:gap-2.5 overflow-x-auto scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden scroll-smooth snap-x snap-mandatory py-1 px-1 -mx-1 sm:px-0 sm:mx-0 max-w-full"
        >
          {/* Category Chip */}
          <button
            type="button"
            onClick={(e) => toggleDropdown('category', e)}
            aria-haspopup="true"
            aria-expanded={activeDropdown === 'category'}
            aria-label={`Filter Kategori: ${categoryBtnLabel}`}
            className={`min-h-[44px] px-4 py-2.5 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer border shrink-0 snap-start focus:outline-none focus-visible:ring-2 focus-visible:ring-[#003d29] focus-visible:ring-offset-2 ${
              isCategoryActive
                ? 'bg-[#003d29] text-white border-[#003d29]'
                : 'bg-slate-100/90 text-slate-700 border-slate-200/60 hover:bg-slate-200/80'
            }`}
          >
            <span>{categoryBtnLabel}</span>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                isCategoryActive ? 'text-white' : 'opacity-60'
              } ${activeDropdown === 'category' ? 'rotate-180' : ''}`}
            />
          </button>

          {/* Price Chip */}
          <button
            type="button"
            onClick={(e) => toggleDropdown('price', e)}
            aria-haspopup="true"
            aria-expanded={activeDropdown === 'price'}
            aria-label={`Filter Rentang Harga: ${priceBtnLabel}`}
            className={`min-h-[44px] px-4 py-2.5 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer border shrink-0 snap-start focus:outline-none focus-visible:ring-2 focus-visible:ring-[#003d29] focus-visible:ring-offset-2 ${
              isPriceActive
                ? 'bg-[#003d29] text-white border-[#003d29]'
                : 'bg-slate-100/90 text-slate-700 border-slate-200/60 hover:bg-slate-200/80'
            }`}
          >
            <span>{priceBtnLabel}</span>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                isPriceActive ? 'text-white' : 'opacity-60'
              } ${activeDropdown === 'price' ? 'rotate-180' : ''}`}
            />
          </button>

          {/* Rating Chip */}
          <button
            type="button"
            onClick={(e) => toggleDropdown('rating', e)}
            aria-haspopup="true"
            aria-expanded={activeDropdown === 'rating'}
            aria-label={`Filter Rating: ${ratingBtnLabel}`}
            className={`min-h-[44px] px-4 py-2.5 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer border shrink-0 snap-start focus:outline-none focus-visible:ring-2 focus-visible:ring-[#003d29] focus-visible:ring-offset-2 ${
              isRatingActive
                ? 'bg-[#003d29] text-white border-[#003d29]'
                : 'bg-slate-100/90 text-slate-700 border-slate-200/60 hover:bg-slate-200/80'
            }`}
          >
            <span>{ratingBtnLabel}</span>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                isRatingActive ? 'text-white' : 'opacity-60'
              } ${activeDropdown === 'rating' ? 'rotate-180' : ''}`}
            />
          </button>

          {/* Special Offer Quick Filter */}
          <button
            type="button"
            onClick={() => {
              if (filters.minPrice === 0 && filters.maxPrice === 1500000) {
                onChangeFilters({ minPrice: 0, maxPrice: 999999999 });
              } else {
                onChangeFilters({ minPrice: 0, maxPrice: 1500000 });
              }
            }}
            aria-pressed={filters.minPrice === 0 && filters.maxPrice === 1500000}
            aria-label="Filter Promo Spesial"
            className={`min-h-[44px] px-4 py-2.5 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer border shrink-0 snap-start focus:outline-none focus-visible:ring-2 focus-visible:ring-[#003d29] focus-visible:ring-offset-2 ${
              filters.minPrice === 0 && filters.maxPrice === 1500000
                ? 'bg-[#003d29] text-white border-[#003d29]'
                : 'bg-slate-100/90 text-slate-700 border-slate-200/60 hover:bg-slate-200/80'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Promo Spesial</span>
          </button>

          {/* Reset Filters / All Filters */}
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={onResetFilters}
              aria-label="Reset semua filter"
              className="min-h-[44px] px-4 py-2.5 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 cursor-pointer shrink-0 snap-start"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset Filter</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={(e) => toggleDropdown('category', e)}
              aria-label="Buka pilihan filter"
              className="min-h-[44px] px-4 py-2.5 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 bg-slate-100/90 text-slate-700 border border-slate-200/60 hover:bg-slate-200/80 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#003d29] focus-visible:ring-offset-2 cursor-pointer shrink-0 snap-start"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 opacity-60" />
              <span>Semua Filter</span>
            </button>
          )}
        </div>

        {/* Right: Sort By Dropdown */}
        <div className="relative shrink-0 flex items-center gap-2 self-start sm:self-auto">
          <span className="text-xs text-slate-400 font-medium hidden sm:inline">Urutkan:</span>
          <button
            type="button"
            onClick={() => toggleDropdown('sort')}
            aria-haspopup="true"
            aria-expanded={activeDropdown === 'sort'}
            aria-label={`Urutkan produk: ${currentSortLabel}`}
            className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-semibold bg-white text-slate-800 border border-slate-200 hover:border-slate-300 shadow-2xs transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#003d29] focus-visible:ring-offset-2 cursor-pointer shrink-0"
          >
            <span>{currentSortLabel}</span>
            <ChevronDown
              className={`w-3.5 h-3.5 opacity-60 transition-transform duration-200 ${
                activeDropdown === 'sort' ? 'rotate-180' : ''
              }`}
            />
          </button>

          {activeDropdown === 'sort' && (
            <div
              role="menu"
              aria-label="Pilihan Urutan"
              className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-100 py-1.5 z-50 animate-in fade-in"
            >
              {sortOptions.map((s) => {
                const isSortActive = filters.sort === s.value;
                return (
                  <button
                    key={s.value}
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      onChangeFilters({ sort: s.value });
                      setActiveDropdown(null);
                    }}
                    className="w-full min-h-[40px] flex items-center justify-between px-3.5 py-2 text-xs text-left hover:bg-slate-50 transition-colors focus:outline-none focus-visible:bg-slate-50 cursor-pointer"
                  >
                    <span
                      className={
                        isSortActive ? 'font-bold text-[#003d29]' : 'text-slate-700'
                      }
                    >
                      {s.label}
                    </span>
                    {isSortActive && <Check className="w-3.5 h-3.5 text-[#003d29]" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Popovers for Category, Price, and Rating (Rendered in containerRef to prevent overflow clipping) */}
      {activeDropdown === 'category' && (
        <div
          role="menu"
          aria-label="Pilih Kategori Produk"
          style={dropdownCoords ? { top: dropdownCoords.top, left: dropdownCoords.left } : undefined}
          className="absolute mt-2 w-60 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in"
        >
          <div className="px-3.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Pilih Kategori
          </div>
          <div className="max-h-64 overflow-y-auto">
            {categories.map((cat) => {
              const isCatActive =
                (cat.value === 'all' && (filters.category === 'all' || !filters.category)) ||
                filters.category.toLowerCase() === cat.value.toLowerCase();
              return (
                <button
                  key={cat.value}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    onChangeFilters({ category: cat.value });
                    setActiveDropdown(null);
                  }}
                  className="w-full min-h-[40px] flex items-center justify-between px-3.5 py-2 text-xs text-left hover:bg-slate-50 transition-colors focus:outline-none focus-visible:bg-slate-50 cursor-pointer"
                >
                  <span className={isCatActive ? 'font-bold text-[#003d29]' : 'text-slate-700'}>
                    {cat.label}
                  </span>
                  {isCatActive && <Check className="w-3.5 h-3.5 text-[#003d29]" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {activeDropdown === 'price' && (
        <div
          role="menu"
          aria-label="Pilih Rentang Harga"
          style={dropdownCoords ? { top: dropdownCoords.top, left: dropdownCoords.left } : undefined}
          className="absolute mt-2 w-60 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in"
        >
          <div className="px-3.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Rentang Harga
          </div>
          {priceTiers.map((tier) => {
            const isTierActive =
              filters.minPrice === tier.min && filters.maxPrice === tier.max;
            return (
              <button
                key={tier.label}
                type="button"
                role="menuitem"
                onClick={() => {
                  onChangeFilters({ minPrice: tier.min, maxPrice: tier.max });
                  setActiveDropdown(null);
                }}
                className="w-full min-h-[40px] flex items-center justify-between px-3.5 py-2 text-xs text-left hover:bg-slate-50 transition-colors focus:outline-none focus-visible:bg-slate-50 cursor-pointer"
              >
                <span className={isTierActive ? 'font-bold text-[#003d29]' : 'text-slate-700'}>
                  {tier.label}
                </span>
                {isTierActive && <Check className="w-3.5 h-3.5 text-[#003d29]" />}
              </button>
            );
          })}
        </div>
      )}

      {activeDropdown === 'rating' && (
        <div
          role="menu"
          aria-label="Pilih Rating Ulasan"
          style={dropdownCoords ? { top: dropdownCoords.top, left: dropdownCoords.left } : undefined}
          className="absolute mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in"
        >
          <div className="px-3.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Minimal Rating
          </div>
          {ratingTiers.map((r) => {
            const isTierActive =
              r.rating === 0 ? filters.minRating === 0 : filters.minRating === r.rating;
            return (
              <button
                key={r.label}
                type="button"
                role="menuitem"
                onClick={() => {
                  onChangeFilters({ minRating: r.rating });
                  setActiveDropdown(null);
                }}
                className="w-full min-h-[40px] flex items-center justify-between px-3.5 py-2 text-xs text-left hover:bg-slate-50 transition-colors focus:outline-none focus-visible:bg-slate-50 cursor-pointer"
              >
                <span className={isTierActive ? 'font-bold text-[#003d29]' : 'text-slate-700'}>
                  {r.label}
                </span>
                {isTierActive && <Check className="w-3.5 h-3.5 text-[#003d29]" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
