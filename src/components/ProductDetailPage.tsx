import React, { useState } from 'react';
import {
  Truck,
  RotateCcw,
  Minus,
  Plus,
  Heart,
  ChevronRight,
  Check,
  Share2
} from 'lucide-react';
import { Product } from '../types';
import { ProductVisual } from './ProductVisual';
import { ProductCard } from './ProductCard';

interface ProductDetailPageProps {
  product: Product;
  relatedProducts: Product[];
  onAddToCart: (product: Product, quantity: number, color?: string) => boolean | void;
  onBuyNow: (product: Product, quantity: number, color?: string) => void;
  onSelectProduct: (product: Product) => void;
  onBackToHome: () => void;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({
  product,
  relatedProducts,
  onAddToCart,
  onBuyNow,
  onSelectProduct,
  onBackToHome,
}) => {
  const [selectedColor, setSelectedColor] = useState(
    product.colors && product.colors.length > 0 ? product.colors[0].name : ''
  );
  const [selectedHex, setSelectedHex] = useState(
    product.colors && product.colors.length > 0 ? product.colors[0].hex : '#e87373'
  );
  const [quantity, setQuantity] = useState(1);
  const [addedSuccess, setAddedSuccess] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);

  const colors = product.colors || [
    { name: 'Pink', hex: '#e87373' },
    { name: 'Space Gray', hex: '#44474d' },
    { name: 'Green', hex: '#b3cfbe' },
    { name: 'Silver', hex: '#dce0e3' },
    { name: 'Sky Blue', hex: '#7795ad' },
  ];

  const handleColorChange = (name: string, hex: string) => {
    setSelectedColor(name);
    setSelectedHex(hex);
  };

  const handleAdd = () => {
    const result = onAddToCart(product, quantity, selectedColor);
    if (result !== false) {
      setAddedSuccess(true);
      setTimeout(() => setAddedSuccess(false), 1600);
    }
  };

  const handleBuy = () => {
    onBuyNow(product, quantity, selectedColor);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4 text-left">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-slate-400 py-3 mb-4 overflow-x-auto whitespace-nowrap">
        <button onClick={onBackToHome} className="hover:text-slate-800 transition-colors">
          Electronics
        </button>
        <ChevronRight className="w-3 h-3 text-slate-300" />
        <span className="hover:text-slate-800 cursor-pointer">Audio</span>
        <ChevronRight className="w-3 h-3 text-slate-300" />
        <span className="hover:text-slate-800 cursor-pointer">{product.category}</span>
        <ChevronRight className="w-3 h-3 text-slate-300" />
        <span className="text-slate-800 font-semibold truncate max-w-[200px]">{product.slug}</span>
      </nav>

      {/* Main Two-Column PDP Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left Column: Product Gallery */}
        <div className="lg:col-span-6 space-y-4">
          <div className="relative rounded-3xl bg-[#f8f9fa] border border-slate-100 p-8 sm:p-12 flex items-center justify-center min-h-[380px] sm:min-h-[460px] shadow-2xs">
            {/* Top Right Wishlist & Share */}
            <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
              <button
                onClick={() => setIsWishlisted(!isWishlisted)}
                className="w-9 h-9 rounded-full bg-white shadow-2xs border border-slate-100 flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
              >
                <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`} />
              </button>
              <button className="w-9 h-9 rounded-full bg-white shadow-2xs border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors cursor-pointer">
                <Share2 className="w-4 h-4" />
              </button>
            </div>

            {/* Main Interactive Product Graphic */}
            <ProductVisual
              imageKey={product.image}
              name={product.name}
              colorHex={selectedHex}
              size="lg"
            />
          </div>

          {/* Color Thumbnails Grid (as shown in image 1) */}
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 pt-2">
            {colors.map((c) => {
              const isSelected = selectedColor === c.name;
              return (
                <button
                  key={c.name}
                  onClick={() => handleColorChange(c.name, c.hex)}
                  className={`rounded-xl bg-[#f8f9fa] p-2 border-2 transition-all flex flex-col items-center justify-center cursor-pointer ${
                    isSelected
                      ? 'border-[#003d29] shadow-xs'
                      : 'border-transparent hover:border-slate-300'
                  }`}
                >
                  <ProductVisual
                    imageKey={product.image}
                    colorHex={c.hex}
                    size="sm"
                    className="w-12 h-12"
                  />
                  <span className="text-[10px] font-medium text-slate-600 mt-1 truncate max-w-full">
                    {c.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Contiguous Purchase Module */}
        <div className="lg:col-span-6 space-y-6">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
              {product.name}
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 font-normal leading-relaxed">
              {product.short_desc || product.description}
            </p>

            {/* Stars & Reviews */}
            <div className="flex items-center gap-2 mt-3">
              <div className="flex text-emerald-600 text-sm tracking-tight">
                ★★★★★
              </div>
              <span className="text-xs font-semibold text-slate-500">
                ({product.review_count || 121})
              </span>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-5">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tabular-nums">
                ${(Number(product.price) || 0).toFixed(2)}
              </span>
              {product.monthly_price ? (
                <span className="text-sm font-semibold text-slate-500">
                  or {(Number(product.monthly_price) || 0).toFixed(2)}/month
                </span>
              ) : null}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Suggested payments with 6 months special financing
            </p>
          </div>

          {/* Color Selector */}
          <div className="border-t border-slate-100 pt-5 space-y-3">
            <div className="text-xs font-semibold text-slate-800">
              Choose a Color: <span className="text-slate-500 font-normal">{selectedColor}</span>
            </div>
            <div className="flex items-center gap-3">
              {colors.map((c) => {
                const isSelected = selectedColor === c.name;
                return (
                  <button
                    key={c.name}
                    onClick={() => handleColorChange(c.name, c.hex)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                      isSelected
                        ? 'ring-2 ring-offset-2 ring-[#003d29]'
                        : 'hover:scale-110'
                    }`}
                    style={{ backgroundColor: c.hex }}
                    title={c.name}
                  >
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-white shadow-xs" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quantity & Stock warning */}
          <div className="border-t border-slate-100 pt-5 flex flex-wrap items-center gap-6">
            <div className="flex items-center bg-slate-100/90 rounded-full px-3 py-1.5 border border-slate-200/60">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-7 h-7 flex items-center justify-center text-slate-600 hover:text-slate-900 cursor-pointer disabled:opacity-30"
                disabled={quantity <= 1}
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-8 text-center text-sm font-bold text-slate-800 tabular-nums">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-7 h-7 flex items-center justify-center text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="text-xs text-slate-500">
              Only <span className="font-bold text-amber-600 tabular-nums">{product.stock || 12} items</span> Left!
              <br />
              <span className="text-slate-400">Don't miss it</span>
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <button
              onClick={handleBuy}
              className="w-full sm:w-1/2 py-3.5 px-6 rounded-full font-semibold text-white bg-[#003d29] hover:bg-[#064e3b] active:scale-[0.99] shadow-md shadow-emerald-950/10 text-sm transition-all cursor-pointer"
            >
              Buy Now
            </button>
            <button
              onClick={handleAdd}
              className={`w-full sm:w-1/2 py-3.5 px-6 rounded-full font-semibold text-sm transition-all border cursor-pointer flex items-center justify-center gap-2 ${
                addedSuccess
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-800 border-slate-300 hover:border-slate-800 hover:bg-slate-50 shadow-2xs'
              }`}
            >
              {addedSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Added to Cart</span>
                </>
              ) : (
                <span>Add to Cart</span>
              )}
            </button>
          </div>

          {/* Delivery & Return info cards */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-amber-50/40 border border-amber-100/60">
              <div className="w-8 h-8 rounded-lg bg-amber-100/80 flex items-center justify-center text-amber-700 shrink-0">
                <Truck className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <div className="font-bold text-slate-900">Free Delivery</div>
                <div className="text-slate-500 mt-0.5">
                  Enter your Postal code for Delivery Availability
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-amber-50/40 border border-amber-100/60">
              <div className="w-8 h-8 rounded-lg bg-amber-100/80 flex items-center justify-center text-amber-700 shrink-0">
                <RotateCcw className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <div className="font-bold text-slate-900">Return Delivery</div>
                <div className="text-slate-500 mt-0.5">
                  Free 30days Delivery Returns. <span className="underline cursor-pointer">Details</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Specifications Table */}
      <div className="mt-16 border-t border-slate-100 pt-10">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-6">
          {product.name} Full Specifications
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-[#fafafa] rounded-3xl p-6 sm:p-8 border border-slate-100">
          {/* General specs */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-4 pb-2 border-b border-slate-200">
              General
            </h3>
            <dl className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <dt className="text-slate-500">Brand</dt>
                <dd className="font-semibold text-slate-800">Apple</dd>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <dt className="text-slate-500">Model</dt>
                <dd className="font-semibold text-slate-800">{product.name}</dd>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <dt className="text-slate-500">Category</dt>
                <dd className="font-semibold text-slate-800">{product.category}</dd>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <dt className="text-slate-500">Connectivity</dt>
                <dd className="font-semibold text-slate-800">Bluetooth 5.0 Wireless</dd>
              </div>
            </dl>
          </div>

          {/* Product details */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-4 pb-2 border-b border-slate-200">
              Product details
            </h3>
            <dl className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <dt className="text-slate-500">Microphone</dt>
                <dd className="font-semibold text-slate-800">Yes (Active ANC Mics)</dd>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <dt className="text-slate-500">Driver Unit</dt>
                <dd className="font-semibold text-slate-800">Dynamic 40mm Driver</dd>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <dt className="text-slate-500">Battery Life</dt>
                <dd className="font-semibold text-slate-800">Up to 20 Hours Playback</dd>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <dt className="text-slate-500">Weight</dt>
                <dd className="font-semibold text-slate-800">384.8 g</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* Similar Items You Might Like */}
      {relatedProducts.length > 0 && (
        <div className="mt-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              Similar Items You Might Like
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                onSelect={onSelectProduct}
                onAddToCart={(prod) => onAddToCart(prod, 1)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
