import React, { useState, useEffect } from 'react';
import { SearchPage as SearchPageComponent } from '../components/SearchPage';
import { Product } from '../types';
import { api } from '../services/api';
import { useAppContext } from '../layouts/MainLayout';

interface SearchPageProps {
  q?: string;
  category?: string;
}

export function SearchPage({ q = '', category = '' }: SearchPageProps) {
  const { handleAddToCart } = useAppContext();

  const [products, setProducts] = useState<Product[]>([]);
  const [, setLoading] = useState(false);

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
    category: category || 'all',
    minPrice: 0,
    maxPrice: 999999999,
    minRating: 0,
    color: 'all',
    material: 'all',
    offer: 'all',
    sort: 'popular',
  });

  useEffect(() => {
    if (q.trim()) {
      api.recordSearchQuery(q.trim()).catch(() => {});
    }
  }, [q]);

  useEffect(() => {
    loadProducts();
  }, [filters, q]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const selectedCat = filters.category !== 'all' ? filters.category : (category || undefined);
      const res = await api.getProducts({
        q: q,
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
      console.error('Failed to load search products:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SearchPageComponent
      query={q}
      category={category || undefined}
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
  );
}

