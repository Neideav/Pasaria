import React, { useState, useEffect } from 'react';
import { ProductDetailPage } from '../components/ProductDetailPage';
import { Product } from '../types';
import { api } from '../services/api';
import { useAppContext } from '../layouts/MainLayout';

interface ProductPageProps {
  slug: string;
  initialProduct?: Product;
}

export function ProductPage({ slug, initialProduct }: ProductPageProps) {
  const { handleAddToCart, handleBuyNow, openChat, openReview } = useAppContext();

  const [product, setProduct] = useState<Product | null>(initialProduct || null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(!initialProduct);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProduct();
  }, [slug]);

  const loadProduct = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getProductBySlug(slug);
      setProduct(data.product);
      setRelatedProducts(data.related || []);
      if (data.product && data.product.id) {
        api.recordViewedProduct(data.product.id).catch(() => {});
      }
    } catch (err: any) {
      console.error('Failed to load product detail:', err);
      setError(err.message || 'Produk tidak ditemukan atau gagal dimuat.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-32 text-center flex flex-col items-center justify-center space-y-3">
        <div className="w-10 h-10 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-slate-500 font-medium">Memuat detail produk...</span>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-md mx-auto py-24 px-6 text-center space-y-4">
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-semibold">
          {error || 'Produk yang Anda cari tidak tersedia.'}
        </div>
        <button
          onClick={() => { window.location.href = '/'; }}
          className="px-6 py-2.5 rounded-full bg-[#003d29] hover:bg-[#064e3b] text-white text-xs font-bold transition-all cursor-pointer"
        >
          Kembali ke Beranda
        </button>
      </div>
    );
  }

  return (
    <ProductDetailPage
      product={product}
      relatedProducts={relatedProducts}
      onAddToCart={handleAddToCart}
      onBuyNow={handleBuyNow}
      onSelectProduct={(p) => {
        window.location.href = '/products/' + p.slug;
      }}
      onBackToHome={() => {
        window.location.href = '/';
      }}
      onViewShop={(shopName, shopId) => {
        window.location.href = '/shops/' + (shopId || shopName);
      }}
      onOpenChatWithShop={(sId) => {
        openChat(sId);
      }}
      onOpenReviewModal={(prod) => {
        openReview({
          productId: prod.id,
          productName: prod.name,
        });
      }}
    />
  );
}

