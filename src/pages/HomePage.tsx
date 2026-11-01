import React, { useState, useEffect } from 'react';
import { HeroBanner } from '../components/HeroBanner';
import { CategoryRecommendationBar } from '../components/CategoryRecommendationBar';
import { ProductFilterBar } from '../components/ProductFilterBar';
import { ProductCard } from '../components/ProductCard';
import { ServicesSection } from '../components/ServicesSection';
import { TestimonialsSection } from '../components/TestimonialsSection';
import { CTASection } from '../components/CTASection';
import { Product } from '../types';
import { api } from '../services/api';
import { useAppContext } from '../layouts/MainLayout';
import { ChevronDown } from 'lucide-react';

interface HomePageProps {
  initialQuery?: string;
  initialCategory?: string;
}

export function HomePage({ initialQuery = '', initialCategory = 'all' }: HomePageProps) {
  const { user, lang, handleAddToCart, openChat } = useAppContext();

  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState<string | null>(null);

  const [searchQuery] = useState(initialQuery);
  const [activeCategory, setActiveCategory] = useState(initialCategory);

  const [filters, setFilters] = useState<{
    category: string;
    minPrice: number;
    maxPrice: number;
    minRating: number;
    color?: string;
    material?: string;
    offer?: string;
    sort: string;
  }>({
    category: initialCategory,
    minPrice: 0,
    maxPrice: 999999999,
    minRating: 0,
    color: 'all',
    material: 'all',
    offer: 'all',
    sort: 'popular',
  });

  const INITIAL_VISIBLE_COUNT = 18;
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT);

  useEffect(() => {
    loadProducts();
  }, [filters, searchQuery, activeCategory]);

  const loadProducts = async () => {
    setProductsLoading(true);
    setProductsError(null);
    try {
      const selectedCat =
        filters.category && filters.category !== 'all'
          ? filters.category
          : activeCategory !== 'all'
          ? activeCategory
          : undefined;

      const res = await api.getProducts({
        q: searchQuery,
        category: selectedCat,
        sort: filters.sort,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
        minRating: filters.minRating,
      });

      let list = res.products || [];

      if (filters.color && filters.color !== 'all') {
        const cLower = filters.color.toLowerCase();
        list = list.filter((p) => {
          const nameMatch = p.name?.toLowerCase().includes(cLower);
          const descMatch = p.description?.toLowerCase().includes(cLower);
          const colorsMatch = Array.isArray(p.colors)
            ? p.colors.some((col: any) =>
                typeof col === 'string'
                  ? col.toLowerCase().includes(cLower)
                  : col?.name?.toLowerCase().includes(cLower)
              )
            : false;
          return nameMatch || descMatch || colorsMatch;
        });
      }

      if (filters.material && filters.material !== 'all') {
        const mLower = filters.material.toLowerCase();
        list = list.filter((p) => {
          const nameMatch = p.name?.toLowerCase().includes(mLower);
          const descMatch = p.description?.toLowerCase().includes(mLower);
          const specsMatch = JSON.stringify(p.specs || {}).toLowerCase().includes(mLower);
          return nameMatch || descMatch || specsMatch;
        });
      }

      if (filters.offer && filters.offer !== 'all') {
        if (filters.offer === 'discount') {
          list = list.filter((p) => p.original_price && p.original_price > p.price);
        } else if (filters.offer === 'official') {
          list = list.filter((p) => p.shop_name?.toLowerCase().includes('official'));
        } else if (filters.offer === 'instock') {
          list = list.filter((p) => p.stock > 0);
        } else if (filters.offer === 'popular') {
          list = list.filter((p) => (p.review_count || 0) >= 5 || p.rating >= 4.5);
        }
      }

      setProducts(list);
      setVisibleCount(INITIAL_VISIBLE_COUNT);
    } catch (err: any) {
      console.error('Failed to load products:', err);
      setProductsError(err.message || 'Gagal memuat katalog produk.');
    } finally {
      setProductsLoading(false);
    }
  };

  const currentProducts = products.slice(0, visibleCount);
  const hasMoreProducts = visibleCount < products.length;
  const weeklyProducts = products.slice(0, 6);

  return (
    <div>
      <HeroBanner
        lang={lang}
        onBuyNow={(category?: string) => {
          if (category) {
            setFilters((prev) => ({ ...prev, category }));
          } else if (products.length > 0) {
            window.location.href = '/products/' + products[0].slug;
          }
        }}
        onContactUs={() => {
          openChat(undefined);
        }}
      />

      <CategoryRecommendationBar
        user={user}
        lang={lang}
        selectedCategory={filters.category}
        onSelectCategory={(slug) => {
          setFilters((prev) => ({ ...prev, category: slug }));
          const section = document.getElementById('products-section');
          if (section) {
            section.scrollIntoView({ behavior: 'smooth' });
          }
        }}
        onViewOrders={() => {
          if (!user) {
            window.location.href = '/login?message=' + encodeURIComponent('Silakan masuk untuk melihat riwayat pesanan Anda.');
          } else {
            window.location.href = '/orders';
          }
        }}
      />

      <ProductFilterBar
        filters={filters}
        onChangeFilters={(f) => setFilters((prev) => ({ ...prev, ...f }))}
        onResetFilters={() =>
          setFilters({
            category: 'all',
            minPrice: 0,
            maxPrice: 999999999,
            minRating: 0,
            color: 'all',
            material: 'all',
            offer: 'all',
            sort: 'popular',
          })
        }
      />

      {/* Main Product Grid */}
      <section id="products-section" className="max-w-[1536px] mx-auto px-4 sm:px-8 py-8 text-left">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Rekomendasi Pilihan untuk Anda
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Produk original berkualitas dari official store dan seller terverifikasi PASARIA.
            </p>
          </div>
        </div>

        {productsLoading ? (
          <div className="py-20 text-center flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-slate-500 font-medium">Memuat rekomendasi produk PASARIA...</span>
          </div>
        ) : productsError ? (
          <div className="py-12 px-6 rounded-2xl bg-rose-50 border border-rose-200 text-center space-y-3 max-w-md mx-auto">
            <p className="text-xs font-semibold text-rose-700">{productsError}</p>
            <button
              onClick={() => loadProducts()}
              className="px-4 py-2 rounded-full bg-[#003d29] hover:bg-[#064e3b] text-white text-xs font-bold transition-all cursor-pointer"
            >
              Coba Lagi
            </button>
          </div>
        ) : currentProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 sm:gap-3 md:gap-3.5">
            {currentProducts.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                onSelect={(prod) => {
                  window.location.href = '/products/' + prod.slug;
                }}
                onAddToCart={(prod) => handleAddToCart(prod, 1)}
              />
            ))}
          </div>
        ) : (
          <div className="py-12 text-center text-slate-500 text-sm">
            Tidak ada produk yang cocok dengan filter yang dipilih.
          </div>
        )}

        {/* Muat Lebih Banyak Button */}
        {hasMoreProducts ? (
          <div className="flex flex-col items-center justify-center mt-10">
            <button
              onClick={() => setVisibleCount((prev) => prev + 18)}
              className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-full text-xs sm:text-sm font-bold text-slate-800 bg-white hover:bg-slate-50 border border-slate-300 hover:border-slate-800 transition-all cursor-pointer shadow-none active:scale-[0.98]"
            >
              <span>Muat Lebih Banyak</span>
              <ChevronDown className="w-4 h-4 text-slate-500" />
            </button>
            <span className="text-[11px] text-slate-400 mt-2 font-medium">
              Menampilkan {Math.min(visibleCount, products.length)} dari {products.length} produk
            </span>
          </div>
        ) : products.length > 18 ? (
          <div className="text-center mt-10">
            <p className="text-xs text-slate-400 font-medium">
              Semua produk telah ditampilkan ({products.length} produk)
            </p>
          </div>
        ) : null}
      </section>

      {/* Weekly Popular Products */}
      {weeklyProducts.length > 0 && (
        <section id="weekly-popular-section" className="max-w-[1536px] mx-auto px-4 sm:px-8 py-8 text-left border-t border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Produk Terlaris Minggu Ini
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 sm:gap-3 md:gap-3.5">
            {weeklyProducts.map((p) => (
              <ProductCard
                key={`weekly-${p.id}`}
                product={p}
                onSelect={(prod) => {
                  window.location.href = '/products/' + prod.slug;
                }}
                onAddToCart={(prod) => handleAddToCart(prod, 1)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Services Section */}
      <ServicesSection
        lang={lang}
        onLearnMore={(serviceTitle) => {
          if (
            serviceTitle.includes('Payment') ||
            serviceTitle.includes('Bayar') ||
            serviceTitle.includes('Pembayaran')
          ) {
            window.location.href = '/cart';
          } else if (
            serviceTitle.includes('Delivery') ||
            serviceTitle.includes('Kirim') ||
            serviceTitle.includes('Pengiriman')
          ) {
            window.location.href = '/delivery';
          } else {
            openChat(undefined);
          }
        }}
      />

      {/* Parallax CTA */}
      <CTASection lang={lang} />

      {/* Testimonials */}
      <TestimonialsSection lang={lang} />
    </div>
  );
}

