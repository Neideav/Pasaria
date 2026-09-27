import React, { useState } from 'react';
import { Heart, Check } from 'lucide-react';
import { Product } from '../types';
import { ProductVisual } from './ProductVisual';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
  onAddToCart: (product: Product, e: React.MouseEvent) => void;
  isWishlisted?: boolean;
  onToggleWishlist?: (product: Product, e: React.MouseEvent) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onSelect,
  onAddToCart,
  isWishlisted = false,
  onToggleWishlist,
}) => {
  const [justAdded, setJustAdded] = useState(false);
  const [favorited, setFavorited] = useState(isWishlisted);

  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart(product, e);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1400);
  };

  const handleHeartClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorited(!favorited);
    if (onToggleWishlist) {
      onToggleWishlist(product, e);
    }
  };

  return (
    <div
      onClick={() => onSelect(product)}
      className="group relative flex flex-col justify-between bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 hover:border-slate-200 hover:shadow-lg transition-all duration-200 cursor-pointer text-left"
    >
      {/* Top Section: Wishlist Heart & Image */}
      <div>
        {/* Wishlist Button */}
        <div className="flex justify-end mb-2">
          <button
            onClick={handleHeartClick}
            className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
            aria-label="Add to wishlist"
          >
            <Heart
              className={`w-4 h-4 transition-colors ${
                favorited ? 'fill-red-500 text-red-500' : 'text-slate-400'
              }`}
            />
          </button>
        </div>

        {/* Product Image Stage */}
        <div className="relative w-full h-44 sm:h-48 rounded-xl bg-[#f8f9fa] flex items-center justify-center p-3 mb-4 overflow-hidden group-hover:bg-[#f3f4f6] transition-colors">
          <ProductVisual
            imageKey={product.image}
            name={product.name}
            size="md"
            className="transform transition-transform duration-300 group-hover:scale-105"
          />
        </div>

        {/* Title & Price Row */}
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-[#003d29] transition-colors line-clamp-1">
            {product.name}
          </h3>
          <span className="text-sm sm:text-base font-bold text-slate-900 tabular-nums shrink-0">
            ${product.price.toFixed(2)}
          </span>
        </div>

        {/* Short Subtitle */}
        <p className="text-xs text-slate-500 line-clamp-1 mb-2 font-normal">
          {product.short_desc || product.description}
        </p>

        {/* Green Star Rating */}
        <div className="flex items-center gap-1.5 mb-4">
          <div className="flex text-emerald-600 text-xs tracking-tighter">
            ★★★★★
          </div>
          <span className="text-xs text-slate-400 font-medium">
            ({product.review_count || 121})
          </span>
        </div>
      </div>

      {/* Bottom Action: Add to Cart Button */}
      <div className="pt-2">
        <button
          onClick={handleAddClick}
          className={`w-full py-2.5 px-4 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${
            justAdded
              ? 'bg-[#003d29] text-white'
              : 'bg-white hover:bg-slate-900 hover:text-white text-slate-800 border border-slate-300 hover:border-slate-900 shadow-2xs'
          }`}
        >
          {justAdded ? (
            <>
              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Added to Cart</span>
            </>
          ) : (
            <span>Add to Cart</span>
          )}
        </button>
      </div>
    </div>
  );
};
