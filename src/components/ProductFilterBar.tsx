import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, SlidersHorizontal, Check, X } from 'lucide-react';

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
    filters.minPrice > 0 ||
    filters.maxPrice < 999999 ||
    filters.minRating > 0 ||
    filters.category !== 'all';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-2 relative" ref={containerRef}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        {/* Left: Pill Filters */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          {/* Headphone Type Filter */}
          <div className="relative">
            <button
              onClick={() => toggleDropdown('type')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer border ${
                filters.category !== 'all'
                  ? 'bg-emerald-50 text-[#003d29] border-emerald-200'
                  : 'bg-slate-100/90 text-slate-700 border-slate-200/60 hover:bg-slate-200/80'
              }`}
            >
              <span>Headphone Type</span>
              <ChevronDown className="w-3.5 h-3.5 opacity-60" />
            </button>
            {activeDropdown === 'type' && (
              <div className="absolute left-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-30 animate-in fade-in">
                {['All', 'Headphone', 'Speakers', 'Laptop', 'Accessories'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      onChangeFilters({ category: cat.toLowerCase() === 'all' ? 'all' : cat });
                      setActiveDropdown(null);
                    }}
                    className="w-full flex items-center justify-between px-3.5 py-2 text-xs text-left hover:bg-slate-50 transition-colors"
                  >
                    <span className={filters.category.toLowerCase() === cat.toLowerCase() ? 'font-bold text-[#003d29]' : 'text-slate-700'}>
                      {cat}
                    </span>
                    {filters.category.toLowerCase() === cat.toLowerCase() && (
                      <Check className="w-3.5 h-3.5 text-[#003d29]" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Price Filter */}
          <div className="relative">
            <button
              onClick={() => toggleDropdown('price')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer border ${
                filters.minPrice > 0 || filters.maxPrice < 999999
                  ? 'bg-emerald-50 text-[#003d29] border-emerald-200'
                  : 'bg-slate-100/90 text-slate-700 border-slate-200/60 hover:bg-slate-200/80'
              }`}
            >
              <span>Price</span>
              <ChevronDown className="w-3.5 h-3.5 opacity-60" />
            </button>
            {activeDropdown === 'price' && (
              <div className="absolute left-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-30 animate-in fade-in">
                {[
                  { label: 'All Prices', min: 0, max: 999999 },
                  { label: 'Under $50', min: 0, max: 50 },
                  { label: '$50 to $100', min: 50, max: 100 },
                  { label: '$100 to $300', min: 100, max: 300 },
                  { label: 'Over $300', min: 300, max: 999999 },
                ].map((tier) => {
                  const isActive = filters.minPrice === tier.min && filters.maxPrice === tier.max;
                  return (
                    <button
                      key={tier.label}
                      onClick={() => {
                        onChangeFilters({ minPrice: tier.min, maxPrice: tier.max });
                        setActiveDropdown(null);
                      }}
                      className="w-full flex items-center justify-between px-3.5 py-2 text-xs text-left hover:bg-slate-50 transition-colors"
                    >
                      <span className={isActive ? 'font-bold text-[#003d29]' : 'text-slate-700'}>
                        {tier.label}
                      </span>
                      {isActive && <Check className="w-3.5 h-3.5 text-[#003d29]" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Review Rating Filter */}
          <div className="relative">
            <button
              onClick={() => toggleDropdown('review')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer border ${
                filters.minRating > 0
                  ? 'bg-emerald-50 text-[#003d29] border-emerald-200'
                  : 'bg-slate-100/90 text-slate-700 border-slate-200/60 hover:bg-slate-200/80'
              }`}
            >
              <span>Review</span>
              <ChevronDown className="w-3.5 h-3.5 opacity-60" />
            </button>
            {activeDropdown === 'review' && (
              <div className="absolute left-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-30 animate-in fade-in">
                {[
                  { label: 'All Reviews', rating: 0 },
                  { label: '4.5 Stars & Above', rating: 4.5 },
                  { label: '4.8 Stars & Above', rating: 4.8 },
                  { label: '5.0 Stars Perfect', rating: 5.0 },
                ].map((r) => {
                  const isActive = filters.minRating === r.rating;
                  return (
                    <button
                      key={r.label}
                      onClick={() => {
                        onChangeFilters({ minRating: r.rating });
                        setActiveDropdown(null);
                      }}
                      className="w-full flex items-center justify-between px-3.5 py-2 text-xs text-left hover:bg-slate-50 transition-colors"
                    >
                      <span className={isActive ? 'font-bold text-[#003d29]' : 'text-slate-700'}>
                        {r.label}
                      </span>
                      {isActive && <Check className="w-3.5 h-3.5 text-[#003d29]" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Color pill */}
          <button
            onClick={() => toggleDropdown('color')}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium bg-slate-100/90 text-slate-700 border border-slate-200/60 hover:bg-slate-200/80 transition-colors cursor-pointer"
          >
            <span>Color</span>
            <ChevronDown className="w-3.5 h-3.5 opacity-60" />
          </button>

          {/* Material pill */}
          <button
            onClick={() => toggleDropdown('material')}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium bg-slate-100/90 text-slate-700 border border-slate-200/60 hover:bg-slate-200/80 transition-colors cursor-pointer"
          >
            <span>Material</span>
            <ChevronDown className="w-3.5 h-3.5 opacity-60" />
          </button>

          {/* Offer pill */}
          <button
            onClick={() => onChangeFilters({ minPrice: 0, maxPrice: 150 })}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium bg-slate-100/90 text-slate-700 border border-slate-200/60 hover:bg-slate-200/80 transition-colors cursor-pointer"
          >
            <span>Offer</span>
            <ChevronDown className="w-3.5 h-3.5 opacity-60" />
          </button>

          {/* All Filters / Reset Button */}
          {hasActiveFilters ? (
            <button
              onClick={onResetFilters}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          ) : (
            <button
              onClick={() => toggleDropdown('price')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium bg-slate-100/90 text-slate-700 border border-slate-200/60 hover:bg-slate-200/80 transition-colors cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 opacity-60" />
              <span>All Filters</span>
            </button>
          )}
        </div>

        {/* Right: Sort By Dropdown */}
        <div className="relative">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium hidden sm:inline">Sort by:</span>
            <button
              onClick={() => toggleDropdown('sort')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium bg-white text-slate-800 border border-slate-200 hover:border-slate-300 shadow-2xs transition-colors cursor-pointer"
            >
              <span>
                {filters.sort === 'price-asc'
                  ? 'Price: Low to High'
                  : filters.sort === 'price-desc'
                  ? 'Price: High to Low'
                  : filters.sort === 'rating'
                  ? 'Highest Rating'
                  : filters.sort === 'newest'
                  ? 'Newest'
                  : 'Popular'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 opacity-60" />
            </button>
          </div>

          {activeDropdown === 'sort' && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-30 animate-in fade-in">
              {[
                { label: 'Popular', value: 'popular' },
                { label: 'Price: Low to High', value: 'price-asc' },
                { label: 'Price: High to Low', value: 'price-desc' },
                { label: 'Highest Rating', value: 'rating' },
                { label: 'Newest Items', value: 'newest' },
              ].map((s) => (
                <button
                  key={s.value}
                  onClick={() => {
                    onChangeFilters({ sort: s.value });
                    setActiveDropdown(null);
                  }}
                  className="w-full flex items-center justify-between px-3.5 py-2 text-xs text-left hover:bg-slate-50 transition-colors"
                >
                  <span className={filters.sort === s.value ? 'font-bold text-[#003d29]' : 'text-slate-700'}>
                    {s.label}
                  </span>
                  {filters.sort === s.value && <Check className="w-3.5 h-3.5 text-[#003d29]" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
