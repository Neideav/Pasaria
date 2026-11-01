import React, { useState, useEffect } from 'react';
import { SearchPage } from '../components/SearchPage';
import { Product } from '../types';
import { api } from '../services/api';
import { useAppContext } from '../layouts/MainLayout';

interface CategoryPageProps {
  slug: string;
  categoryName?: string;
  preset?: string;
}

export function CategoryPage({ slug, categoryName, preset }: CategoryPageProps) {
  const { handleAddToCart } = useAppContext();

  const [products, setProducts] = useState<Product[]>([]);
  const [, setLoading] = useState(false);

  const initialSort = preset === 'newest' ? 'newest' : 'popular';
  const initialMaxPrice = preset === 'deals' ? 1500000 : 999999999;

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
    category: preset ? 'all' : (slug === 'all' ? 'all' : slug),
    minPrice: 0,
    maxPrice: initialMaxPrice,
    minRating: 0,
    color: 'all',
    material: 'all',
    offer: preset === 'deals' ? 'discount' : 'all',
    sort: initialSort,
  });

  useEffect(() => {
    loadProducts();
  }, [filters, slug]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const selectedCat = filters.category !== 'all' ? filters.category : (preset ? undefined : slug);
      const res = await api.getProducts({
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
    } catch (err) {
      console.error('Failed to load category products:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SearchPage
      query=""
      category={categoryName || (preset ? (preset === 'deals' ? 'Promo & Deals' : 'Produk Terbaru') : slug)}
      products={products}
      onSelectProduct={(p) => {
        window.location.href = '/products/' + p.slug;
      }}
      onAddToCart={(p) => handleAddToCart(p, 1)}
      onBackToHome={() => {
        window.location.href = '/';
      }}
      filters={filters}
      onChangeFilters={(f) => setFilters((prev) => ({ ...prev, ...f }))}
      onResetFilters={() =>
        setFilters({
          category: preset ? 'all' : slug,
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
  );
}

