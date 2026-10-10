import React from 'react';
import { LayoutGrid } from 'lucide-react';
import { Language } from '../i18n/translations';
import catAccessories from '../assets/images/cat_accessories.jpg';
import catElectronics from '../assets/images/cat_electronics.jpg';
import catHomePlant from '../assets/images/cat_home_plant.jpg';
import catFashionClothes from '../assets/images/cat_fashion_clothes.jpg';
import catBeautyCosmetics from '../assets/images/cat_beauty_cosmetics.jpg';
import catSportsDumbbells from '../assets/images/cat_sports_dumbbells.jpg';
import catToysTeddybear from '../assets/images/cat_toys_teddybear.jpg';

interface CategoryItem {
  id: string;
  slug: string;
  nameEn: string;
  nameId: string;
  image?: string;
  isMore?: boolean;
}

interface CategoryRecommendationBarProps {
  user?: unknown;
  lang?: Language;
  selectedCategory: string;
  onSelectCategory: (slug: string) => void;
  onViewOrders?: () => void;
}

export const CategoryRecommendationBar: React.FC<CategoryRecommendationBarProps> = ({
  lang = 'id',
  selectedCategory,
  onSelectCategory,
}) => {
  const isId = lang === 'id';

  const categoryList: CategoryItem[] = [
    {
      id: 'accessories',
      slug: 'bags',
      nameEn: 'Accessories',
      nameId: 'Aksesoris',
      image: catAccessories,
    },
    {
      id: 'electronics',
      slug: 'headphones',
      nameEn: 'Electronics',
      nameId: 'Elektronik',
      image: catElectronics,
    },
    {
      id: 'home',
      slug: 'furniture',
      nameEn: 'Home & Living',
      nameId: 'Rumah & Dapur',
      image: catHomePlant,
    },
    {
      id: 'fashion',
      slug: 'shoes',
      nameEn: 'Fashion',
      nameId: 'Fashion',
      image: catFashionClothes,
    },
    {
      id: 'beauty',
      slug: 'beauty',
      nameEn: 'Beauty',
      nameId: 'Kecantikan',
      image: catBeautyCosmetics,
    },
    {
      id: 'sports',
      slug: 'sports',
      nameEn: 'Sports',
      nameId: 'Olahraga',
      image: catSportsDumbbells,
    },
    {
      id: 'toys',
      slug: 'books',
      nameEn: 'Toys & Games',
      nameId: 'Mainan & Hobi',
      image: catToysTeddybear,
    },
    {
      id: 'more',
      slug: 'all',
      nameEn: 'More Categories',
      nameId: 'Kategori Lainnya',
      isMore: true,
    },
  ];

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-6 sm:my-8">
      {/* Section Headline */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-1 mb-4 sm:mb-5">
        <div>
          <h2 className="text-lg sm:text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight">
            {isId ? 'Jelajahi Kategori Pilihan' : 'Browse by Category'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            {isId
              ? 'Temukan koleksi produk terlengkap dari berbagai kategori favorit Anda'
              : 'Discover a wide range of verified products across popular categories'}
          </p>
        </div>
      </div>

      {/* Bordered Category Grid */}
      <div className="w-full grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 divide-x divide-y lg:divide-y-0 divide-slate-200 border border-slate-200 rounded-2xl overflow-hidden bg-transparent">
        {categoryList.map((item) => {
          const isSelected = selectedCategory === item.slug && item.slug !== 'all';
          const label = isId ? item.nameId : item.nameEn;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectCategory(item.slug)}
              className={`group flex flex-col items-center justify-between py-6 sm:py-7 md:py-8 px-3 sm:px-4 min-h-[145px] sm:min-h-[165px] md:min-h-[185px] transition-colors cursor-pointer text-center relative ${
                isSelected
                  ? 'bg-slate-200/60 text-slate-950 font-bold'
                  : 'bg-transparent hover:bg-slate-200/40 text-slate-800'
              }`}
            >
              {/* Product Cutout / Icon Area on Top */}
              <div className="w-full flex-1 flex items-center justify-center min-h-[70px] sm:min-h-[85px]">
                {item.isMore ? (
                  <div className="w-full flex items-center justify-center text-slate-700 group-hover:text-slate-950 group-hover:scale-110 transition-transform duration-200">
                    <LayoutGrid className="w-8 h-8 sm:w-10 sm:h-10 stroke-[1.2]" />
                  </div>
                ) : (
                  <img
                    src={item.image}
                    alt={label}
                    className="max-h-16 sm:max-h-20 md:max-h-22 max-w-[85%] object-contain mix-blend-multiply contrast-[1.08] brightness-[1.04] group-hover:scale-105 transition-transform duration-200"
                    loading="lazy"
                  />
                )}
              </div>

              {/* Category Text Label on Bottom */}
              <span className="w-full text-xs sm:text-sm font-bold text-slate-900 group-hover:text-emerald-700 tracking-tight truncate px-1 mt-3">
                {label}
              </span>

              {/* Active Bottom Indicator Line */}
              {isSelected && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900" />
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
};




