import React, { useState } from 'react';
import { Heart, Check, Store, Star } from 'lucide-react';
import { Product } from '../types';
import { ProductVisual } from './ProductVisual';
import { formatRupiah } from '../utils/formatters';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
  onAddToCart: (product: Product, e: React.MouseEvent) => boolean | void;
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
    const result = onAddToCart(product, e);
    if (result !== false) {
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 1400);
    }
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
      className="group relative flex flex-col justify-between bg-white rounded-2xl p-3 sm:p-3.5 border border-slate-200 hover:border-slate-300 transition-all duration-200 cursor-pointer text-left shadow-none"
    >
      {/* Top Section: Image with Overlay Badge & Like Button */}
      <div>
        {/* Product Image Stage */}
        <div className="relative w-full h-38 sm:h-44 md:h-48 rounded-xl bg-[#f8f9fa] flex items-center justify-center p-2.5 mb-2.5 overflow-hidden group-hover:bg-[#f3f4f6] transition-colors">
          {/* Badge Overlay (Top Left) */}
          {product.badge && (
            <span className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-wider bg-white/90 backdrop-blur-xs text-[#003d29] border border-emerald-200/80 shadow-none pointer-events-none">
              {product.badge}
            </span>
          )}

          {/* Wishlist Heart Overlay (Top Right inside image) */}
          <button
            onClick={handleHeartClick}
            className="absolute top-2 right-2 z-10 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/85 hover:bg-white backdrop-blur-xs flex items-center justify-center text-slate-400 hover:text-rose-500 transition-all border border-slate-200/70 shadow-none cursor-pointer active:scale-95"
            aria-label="Wishlist"
          >
            <Heart
              className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-colors ${
                favorited || product.is_wishlisted
                  ? 'fill-rose-500 text-rose-500'
                  : 'text-slate-400'
              }`}
            />
          </button>

          {/* Product Visual Asset */}
          <ProductVisual
            imageKey={product.image}
            name={product.name}
            size="md"
            className="transform transition-transform duration-300 group-hover:scale-105"
          />
        </div>

        {/* Shop Info (Multi-vendor badge) */}
        {product.shop_name && (
          <div className="flex items-center gap-1 text-[11px] text-slate-400 mb-1 min-w-0">
            <Store className="w-3 h-3 text-[#003d29] shrink-0" />
            <span className="truncate font-medium">{product.shop_name}</span>
            {product.shop_city && <span className="shrink-0 text-slate-300">·</span>}
            {product.shop_city && <span className="truncate text-slate-400">{product.shop_city}</span>}
          </div>
        )}

        {/* Product Title (2-Line Full Display) */}
        <h3 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-[#003d29] transition-colors line-clamp-2 leading-snug min-h-[2rem] sm:min-h-[2.4rem] mb-1.5">
          {product.name}
        </h3>

        {/* Price Row (Prominent, Full Width) */}
        <div className="flex items-baseline gap-1.5 mb-1.5 flex-wrap">
          <span className="text-sm sm:text-base font-extrabold text-[#003d29] tracking-tight tabular-nums">
            {formatRupiah(product.price)}
          </span>
          {product.original_price && product.original_price > product.price && (
            <span className="text-[10px] sm:text-[11px] text-slate-400 line-through tabular-nums">
              {formatRupiah(product.original_price)}
            </span>
          )}
        </div>

        {/* Rating & Sold Row */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-3 flex-wrap">
          <div className="flex items-center text-emerald-600 text-xs font-bold gap-0.5">
            <Star className="w-3.5 h-3.5 fill-emerald-600 text-emerald-600" />
            <span>{Number(product.rating || 5).toFixed(1)}</span>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">
            ({product.review_count || 0})
          </span>
          <span className="text-slate-300">·</span>
          <span className="text-[11px] text-slate-500 font-medium truncate">
            Stok: {product.stock}
          </span>
        </div>
      </div>

      {/* Bottom Action: Add to Cart Button */}
      <div className="pt-1">
        <button
          onClick={handleAddClick}
          className={`w-full py-2 sm:py-2.5 px-3 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${
            justAdded
              ? 'bg-[#003d29] text-white shadow-none'
              : 'bg-white hover:bg-slate-900 hover:text-white text-slate-800 border border-slate-300 hover:border-slate-900 shadow-none'
          }`}
        >
          {justAdded ? (
            <>
              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Masuk Keranjang</span>
            </>
          ) : (
            <span>+ Keranjang</span>
          )}
        </button>
      </div>
    </div>
  );
};
