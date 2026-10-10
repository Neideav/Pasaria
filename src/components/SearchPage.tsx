import React from 'react';
import { ChevronRight, SearchX, ArrowLeft } from 'lucide-react';
import { Product } from '../types';
import { ProductCard } from './ProductCard';
import { ProductFilterBar } from './ProductFilterBar';

interface SearchPageProps {
  query: string;
  category?: string;
  products: Product[];
  onSelectProduct: (product: Product) => void;
  onAddToCart: (product: Product, e: React.MouseEvent) => boolean | void;
  onBackToHome: () => void;
  filters: any;
  onChangeFilters: (filters: any) => void;
  onResetFilters: () => void;
}

export const SearchPage: React.FC<SearchPageProps> = ({
  query,
  category,
  products,
  onSelectProduct,
  onAddToCart,
  onBackToHome,
  filters,
  onChangeFilters,
  onResetFilters,
}) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4 text-left">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-slate-400 py-3 mb-2">
        <button onClick={onBackToHome} className="hover:text-slate-800 transition-colors">
          Home
        </button>
        <ChevronRight className="w-3 h-3 text-slate-300" />
        <span className="text-slate-800 font-semibold">
          {query ? `Search: "${query}"` : category ? `Category: ${category}` : 'All Products'}
        </span>
      </nav>

      {/* Header Title & Count */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {query ? `Search Results for "${query}"` : category ? `${category} Collection` : 'All Products'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Showing <span className="font-semibold text-slate-800">{products.length}</span> items
          </p>
        </div>

        <button
          onClick={onBackToHome}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#003d29] hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Catalog</span>
        </button>
      </div>

      {/* Filter and Sort bar */}
      <div className="mb-6">
        <ProductFilterBar
          filters={filters}
          onChangeFilters={onChangeFilters}
          onResetFilters={onResetFilters}
        />
      </div>

      {/* Results Grid */}
      {products.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-3 md:gap-3.5">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onSelect={onSelectProduct}
              onAddToCart={onAddToCart}
            />
          ))}
        </div>
      ) : (
        <div className="py-20 text-center bg-white rounded-3xl border border-slate-100 p-8 my-8">
          <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4">
            <SearchX className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">
            No products matched your search
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mb-6">
            We couldn't find any items matching "{query}". Try checking your spelling or using more generic keywords like "earbuds", "headphones", or "bose".
          </p>
          <button
            onClick={onBackToHome}
            className="px-6 py-2.5 rounded-full text-xs font-bold text-white bg-[#003d29] hover:bg-[#064e3b] transition-all cursor-pointer"
          >
            Explore All Products
          </button>
        </div>
      )}
    </div>
  );
};
