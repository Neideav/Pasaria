import React, { useState } from 'react';
import {
  Store,
  Plus,
  Package,
  DollarSign,
  TrendingUp,
  Star,
  MapPin,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  Trash2,
  Edit,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  Tag,
  Phone,
  Layers,
  ArrowLeft
} from 'lucide-react';
import { User, Shop, Product } from '../types';
import { ProductVisual } from './ProductVisual';

interface ShopDashboardViewProps {
  user: User | null;
  products: Product[];
  onUpdateUser: (user: User) => void;
  onAddProduct: (newProduct: Product) => void;
  onDeleteProduct?: (productId: number) => void;
  onNavigateHome: () => void;
  onViewShopPublic: (shop: Shop) => void;
  onSelectProduct: (product: Product) => void;
}

export const ShopDashboardView: React.FC<ShopDashboardViewProps> = ({
  user,
  products,
  onUpdateUser,
  onAddProduct,
  onDeleteProduct,
  onNavigateHome,
  onViewShopPublic,
  onSelectProduct,
}) => {
  const [activeTab, setActiveTab] = useState<'products' | 'add_product' | 'settings'>('products');

  // Shop registration form state (for new sellers)
  const [shopName, setShopName] = useState('');
  const [shopTagline, setShopTagline] = useState('');
  const [shopDesc, setShopDesc] = useState('');
  const [shopCity, setShopCity] = useState(user?.city || 'Jakarta');
  const [shopPhone, setShopPhone] = useState(user?.phone || '+62 812-3456-7890');
  const [shopLogo, setShopLogo] = useState<string>('');
  const [shopBanner, setShopBanner] = useState<string>('');
  const [isCreatingShop, setIsCreatingShop] = useState(false);
  const [shopSuccessMsg, setShopSuccessMsg] = useState('');

  // Add Product form state
  const [prodName, setProdName] = useState('');
  const [prodCategory, setProdCategory] = useState('Headphone');
  const [prodPrice, setProdPrice] = useState('');
  const [prodOriginalPrice, setProdOriginalPrice] = useState('');
  const [prodStock, setProdStock] = useState('20');
  const [prodShortDesc, setProdShortDesc] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodImage, setProdImage] = useState('');
  const [prodColorName, setProdColorName] = useState('Black');
  const [prodColorHex, setProdColorHex] = useState('#111827');
  const [prodBrand, setProdBrand] = useState('');
  const [prodSuccessMsg, setProdSuccessMsg] = useState('');

  // User's current shop
  const currentShop: Shop | null = user?.shop || null;

  // Filter products belonging to this seller/shop
  const shopProducts = currentShop
    ? products.filter((p) =>
        (p.shop_id != null && currentShop.id != null && String(p.shop_id) === String(currentShop.id)) ||
        (p.shop_name && currentShop.name && p.shop_name.trim().toLowerCase() === currentShop.name.trim().toLowerCase())
      )
    : [];

  // Handle Logo Upload (Base64 data URL)
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setShopLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle Banner Upload
  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setShopBanner(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle Product Image Upload
  const handleProductImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProdImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit Shop Registration
  const handleRegisterShop = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopName.trim()) return;

    setIsCreatingShop(true);
    const newShop: Shop = {
      id: Date.now(),
      user_id: user?.id || 1,
      name: shopName.trim(),
      slug: shopName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      tagline: shopTagline.trim() || 'Official Verified Store on Shopcart',
      description: shopDesc.trim() || 'Toko resmi dengan jaminan produk original dan pengiriman cepat.',
      logo: shopLogo || '',
      banner: shopBanner || '',
      city: shopCity.trim() || 'Jakarta',
      phone: shopPhone.trim() || '+62 812-3456-7890',
      rating: 5.0,
      product_count: 0,
      total_sales: 0,
      joined_date: 'Baru Bergabung (2026)',
      is_verified: true,
    };

    const updatedUser: User = {
      ...(user || {
        id: 1,
        name: 'Wade Warren',
        username: 'wadewarren',
        email: 'customer@shopcart.com',
        role: 'seller'
      }),
      role: 'seller',
      shop: newShop,
    };

    onUpdateUser(updatedUser);
    setIsCreatingShop(false);
    setShopSuccessMsg('Selamat! Toko online Anda berhasil didaftarkan dan siap berjualan.');
    setActiveTab('add_product');
    setTimeout(() => setShopSuccessMsg(''), 4000);
  };

  // Submit New Product
  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName.trim() || !prodPrice) return;

    const priceNum = parseFloat(prodPrice) || 0;
    const origPriceNum = prodOriginalPrice ? parseFloat(prodOriginalPrice) : undefined;
    const stockNum = parseInt(prodStock, 10) || 10;

    const newProd: Product = {
      id: Date.now(),
      name: prodName.trim(),
      slug: prodName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Math.floor(Math.random() * 1000),
      category: prodCategory,
      price: priceNum,
      original_price: origPriceNum,
      monthly_price: Number((priceNum / 6).toFixed(2)),
      short_desc: prodShortDesc.trim() || prodName.trim(),
      description: prodDesc.trim() || `${prodName} berkualitas tinggi dari toko ${currentShop?.name || 'Official Store'}.`,
      image: prodImage || 'airpods-max',
      rating: 5.0,
      review_count: 0,
      stock: stockNum,
      shop_id: currentShop?.id,
      shop_name: currentShop?.name || 'Toko Saya',
      shop_city: currentShop?.city || 'Jakarta',
      shop_logo: currentShop?.logo,
      colors: [
        { name: prodColorName || 'Standard', hex: prodColorHex || '#111827', active: true },
      ],
      specs: {
        General: {
          Brand: prodBrand.trim() || currentShop?.name || 'Shopcart Verified',
          Category: prodCategory,
          Condition: 'Baru / 100% Original',
        },
        ProductDetails: {
          Stock: `${stockNum} Unit`,
          Origin: currentShop?.city || 'Indonesia',
        }
      },
      created_at: new Date().toISOString(),
    };

    onAddProduct(newProd);

    // Reset form
    setProdName('');
    setProdPrice('');
    setProdOriginalPrice('');
    setProdShortDesc('');
    setProdDesc('');
    setProdImage('');
    setProdBrand('');
    setProdSuccessMsg(`Produk "${newProd.name}" berhasil dipublikasikan dan tersimpan di database toko!`);
    setActiveTab('products');
    setTimeout(() => setProdSuccessMsg(''), 4000);
  };

  // ---------------------------------------------------------------------------
  // IF USER DOES NOT HAVE A SHOP YET: DISPLAY REGISTRATION ONBOARDING
  // ---------------------------------------------------------------------------
  if (!currentShop) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-8 text-left space-y-8">
        <div className="flex items-center justify-between pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-1.5">
              <button onClick={onNavigateHome} className="hover:text-slate-700">Home</button>
              <ChevronRight className="w-3 h-3 text-slate-300" />
              <span className="text-slate-800 font-semibold">Buka Toko Online</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
              <Store className="w-7 h-7 text-[#003d29]" />
              <span>Buka Toko Gratis di Shopcart</span>
            </h1>
          </div>

          <button
            onClick={onNavigateHome}
            className="text-xs font-semibold text-[#003d29] hover:underline"
          >
            Kembali ke Toko
          </button>
        </div>

        {/* Benefits Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-3xl bg-emerald-50/70 border border-emerald-200/60 space-y-2 text-xs">
            <div className="w-9 h-9 rounded-2xl bg-[#003d29] text-white flex items-center justify-center font-bold">
              <DollarSign className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Bebas Biaya Pendaftaran</h3>
            <p className="text-slate-600">Daftarkan toko Anda dalam 1 menit tanpa biaya bulanan.</p>
          </div>

          <div className="p-5 rounded-3xl bg-emerald-50/70 border border-emerald-200/60 space-y-2 text-xs">
            <div className="w-9 h-9 rounded-2xl bg-[#003d29] text-white flex items-center justify-center font-bold">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Badge Verified Seller</h3>
            <p className="text-slate-600">Toko langsung mendapatkan verifikasi resmi untuk meningkatkan kepercayaan pembeli.</p>
          </div>

          <div className="p-5 rounded-3xl bg-emerald-50/70 border border-emerald-200/60 space-y-2 text-xs">
            <div className="w-9 h-9 rounded-2xl bg-[#003d29] text-white flex items-center justify-center font-bold">
              <TrendingUp className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Jangkauan Luas</h3>
            <p className="text-slate-600">Terintegrasi otomatis dengan sistem kurir pengiriman real-time Shopcart.</p>
          </div>
        </div>

        {/* Registration Form Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg font-extrabold text-slate-900">Formulir Pendaftaran Toko</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Isi data toko Anda untuk mulai memposting dan menjual produk.
            </p>
          </div>

          <form onSubmit={handleRegisterShop} className="space-y-5 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Nama Toko / Brand <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  placeholder="Contoh: AudioTech Official Store"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#003d29]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Slogan / Tagline Singkat
                </label>
                <input
                  type="text"
                  value={shopTagline}
                  onChange={(e) => setShopTagline(e.target.value)}
                  placeholder="Contoh: Pusat Headphone & Audio Original Terlengkap"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#003d29]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Kota / Lokasi Toko <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={shopCity}
                  onChange={(e) => setShopCity(e.target.value)}
                  placeholder="Contoh: Jakarta Pusat / Bandung"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#003d29]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Kontak Telepon / WhatsApp Toko
                </label>
                <input
                  type="text"
                  value={shopPhone}
                  onChange={(e) => setShopPhone(e.target.value)}
                  placeholder="+62 812-3456-7890"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#003d29]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Deskripsi Profil Toko
                </label>
                <textarea
                  rows={3}
                  value={shopDesc}
                  onChange={(e) => setShopDesc(e.target.value)}
                  placeholder="Jelaskan tentang toko Anda, keunggulan produk, dan jam operasional..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#003d29]"
                />
              </div>
            </div>

            {/* Photo Upload: Logo & Banner Toko */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              {/* Logo Upload */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1.5">
                  Foto Logo Toko
                </label>
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                    {shopLogo ? (
                      <img src={shopLogo} alt="Logo Preview" className="w-full h-full object-cover" />
                    ) : (
                      <Store className="w-6 h-6 text-slate-400" />
                    )}
                  </div>
                  <label className="py-2 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors cursor-pointer flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Logo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Banner Upload */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1.5">
                  Foto Banner Cover Toko
                </label>
                <div className="flex items-center gap-3">
                  <div className="w-24 h-16 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                    {shopBanner ? (
                      <img src={shopBanner} alt="Banner Preview" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-slate-400" />
                    )}
                  </div>
                  <label className="py-2 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors cursor-pointer flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Banner</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleBannerUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={isCreatingShop}
                className="w-full sm:w-auto py-3.5 px-8 rounded-full font-bold text-sm text-white bg-[#003d29] hover:bg-[#064e3b] shadow-md shadow-emerald-950/15 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Store className="w-4 h-4" />
                <span>{isCreatingShop ? 'Memproses...' : 'Buka Toko & Mulai Jual Barang'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // IF USER ALREADY HAS A SHOP: SELLER DASHBOARD
  // ---------------------------------------------------------------------------
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 text-left space-y-8">
      {/* Success Notification Alert */}
      {(shopSuccessMsg || prodSuccessMsg) && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 font-semibold flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{shopSuccessMsg || prodSuccessMsg}</span>
        </div>
      )}

      {/* Shop Header Banner Card */}
      <div className="relative rounded-3xl overflow-hidden bg-white border border-slate-200/80 shadow-xs">
        {/* Banner Cover */}
        <div className="h-32 sm:h-44 bg-gradient-to-r from-[#003d29] to-[#046a48] relative">
          {currentShop.banner && (
            <img
              src={currentShop.banner}
              alt="Shop Banner"
              className="w-full h-full object-cover opacity-60"
            />
          )}
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-white/90 backdrop-blur-md text-xs font-bold text-[#003d29] flex items-center gap-1.5 shadow-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Verified Seller
            </span>
          </div>
        </div>

        {/* Shop Info Row */}
        <div className="p-6 sm:p-8 pt-0 relative flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12 sm:-mt-14">
          <div className="flex items-end gap-4">
            <div className="w-24 h-24 rounded-3xl bg-white p-1.5 shadow-lg border-2 border-white overflow-hidden shrink-0">
              {currentShop.logo ? (
                <img src={currentShop.logo} alt={currentShop.name} className="w-full h-full object-cover rounded-2xl" />
              ) : (
                <div className="w-full h-full rounded-2xl bg-emerald-50 text-[#003d29] flex items-center justify-center font-extrabold text-xl">
                  {currentShop.name.slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                  {currentShop.name}
                </h1>
              </div>
              <p className="text-xs text-slate-500 font-medium">{currentShop.tagline}</p>
              <div className="flex items-center gap-3 text-xs text-slate-500 pt-0.5">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#003d29]" />
                  <span>{currentShop.city}</span>
                </span>
                <span>·</span>
                <span className="flex items-center gap-1 font-semibold text-emerald-700">
                  <Star className="w-3.5 h-3.5 fill-emerald-600 text-emerald-600" />
                  <span>5.0 Rating</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 pt-2 sm:pt-0">
            <button
              onClick={() => onViewShopPublic(currentShop)}
              className="py-2.5 px-4 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Lihat Toko Publik</span>
            </button>

            <button
              onClick={() => setActiveTab('add_product')}
              className="py-2.5 px-5 rounded-full bg-[#003d29] hover:bg-[#064e3b] text-white text-xs font-bold shadow-md shadow-emerald-950/15 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Jual Barang Baru</span>
            </button>
          </div>
        </div>
      </div>

      {/* Seller Analytics Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-2xs space-y-1 text-left">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Produk Toko</div>
          <div className="text-2xl font-extrabold text-slate-900 tabular-nums">
            {shopProducts.length} <span className="text-xs text-slate-400 font-normal">Item</span>
          </div>
          <div className="text-[11px] text-emerald-700 font-medium">Aktif dipajang di etalase</div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-2xs space-y-1 text-left">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Stok Tersedia</div>
          <div className="text-2xl font-extrabold text-slate-900 tabular-nums">
            {shopProducts.reduce((sum, p) => sum + (p.stock || 0), 0)} <span className="text-xs text-slate-400 font-normal">Unit</span>
          </div>
          <div className="text-[11px] text-emerald-700 font-medium">Siap dikirim ke pembeli</div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-2xs space-y-1 text-left">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Transaksi</div>
          <div className="text-2xl font-extrabold text-[#003d29] tabular-nums">
            18 <span className="text-xs text-slate-400 font-normal">Pesanan</span>
          </div>
          <div className="text-[11px] text-emerald-700 font-medium">100% Pengiriman Berhasil</div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-2xs space-y-1 text-left">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Performa Toko</div>
          <div className="text-2xl font-extrabold text-slate-900 flex items-center gap-1">
            <span>5.0</span>
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
          </div>
          <div className="text-[11px] text-emerald-700 font-medium">Penjual Sangat Responsif</div>
        </div>
      </div>

      {/* Tabs Header Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('products')}
          className={`py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'products'
              ? 'bg-[#003d29] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          <span>Katalog Produk Toko ({shopProducts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('add_product')}
          className={`py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'add_product'
              ? 'bg-[#003d29] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Tambah Barang Jualan</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'settings'
              ? 'bg-[#003d29] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Store className="w-3.5 h-3.5" />
          <span>Pengaturan Toko</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: DAFTAR PRODUK TOKO */}
      {/* ========================================================================= */}
      {activeTab === 'products' && (
        <div className="space-y-4 animate-in fade-in">
          {shopProducts.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200/80 space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-[#003d29] flex items-center justify-center mx-auto">
                <Package className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Belum Ada Barang yang Dijual</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Mulai tambahkan produk jualan pertama Anda agar pembeli dapat melihat dan membeli dari toko Anda.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('add_product')}
                className="py-3 px-6 rounded-full bg-[#003d29] hover:bg-[#064e3b] text-white text-xs font-bold shadow-md transition-all cursor-pointer"
              >
                + Tambah Produk Sekarang
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                      <th className="py-3.5 px-4">Produk</th>
                      <th className="py-3.5 px-4">Kategori</th>
                      <th className="py-3.5 px-4">Harga Jual</th>
                      <th className="py-3.5 px-4">Stok</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {shopProducts.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-slate-50 p-1 border border-slate-200/80 flex items-center justify-center shrink-0">
                              <ProductVisual imageKey={p.image} name={p.name} size="sm" />
                            </div>
                            <div>
                              <div
                                onClick={() => onSelectProduct(p)}
                                className="font-bold text-slate-900 hover:text-[#003d29] cursor-pointer line-clamp-1"
                              >
                                {p.name}
                              </div>
                              <div className="text-[10px] text-slate-400">SKU: {p.slug}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 font-medium">{p.category}</td>
                        <td className="py-3.5 px-4 font-bold text-slate-900 tabular-nums">
                          ${p.price.toFixed(2)}
                          {p.original_price && (
                            <span className="text-[10px] text-slate-400 line-through ml-1.5 font-normal">
                              ${p.original_price.toFixed(2)}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-slate-800 tabular-nums">{p.stock}</span>{' '}
                          <span className="text-[10px] text-slate-400">unit</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/60">
                            Aktif Dijual
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => onSelectProduct(p)}
                              className="p-1.5 rounded-lg text-slate-600 hover:text-[#003d29] hover:bg-slate-100 transition-colors"
                              title="Lihat Produk"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                            {onDeleteProduct && (
                              <button
                                onClick={() => {
                                  if (confirm(`Hapus produk "${p.name}" dari toko Anda?`)) {
                                    onDeleteProduct(p.id);
                                  }
                                }}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                title="Hapus Produk"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: FORM TAMBAH PRODUK BARU */}
      {/* ========================================================================= */}
      {activeTab === 'add_product' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/80 shadow-2xs space-y-6 animate-in fade-in">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg font-extrabold text-slate-900">Formulir Tambah Produk Baru</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Masukkan informasi produk dengan lengkap untuk dipajang di katalog toko dan beranda Shopcart.
            </p>
          </div>

          <form onSubmit={handleCreateProduct} className="space-y-6 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Nama Produk <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  placeholder="Contoh: Sony WH-1000XM5 Wireless Headphones"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#003d29]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Kategori Produk <span className="text-rose-500">*</span>
                </label>
                <select
                  value={prodCategory}
                  onChange={(e) => setProdCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#003d29]"
                >
                  <option value="Headphone">Headphone & Audio</option>
                  <option value="Furniture">Furniture</option>
                  <option value="Shoe">Sepatu / Shoes</option>
                  <option value="Bag">Tas / Bags</option>
                  <option value="Laptop">Laptop & Gadget</option>
                  <option value="Book">Buku / Books</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Brand / Merk
                </label>
                <input
                  type="text"
                  value={prodBrand}
                  onChange={(e) => setProdBrand(e.target.value)}
                  placeholder="Contoh: Sony / Apple / Custom"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#003d29]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Harga Jual ($) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={prodPrice}
                  onChange={(e) => setProdPrice(e.target.value)}
                  placeholder="Contoh: 199.99"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#003d29]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Harga Coret / Normal ($) (Opsional Diskon)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={prodOriginalPrice}
                  onChange={(e) => setProdOriginalPrice(e.target.value)}
                  placeholder="Contoh: 249.99"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#003d29]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Jumlah Stok Awal <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  value={prodStock}
                  onChange={(e) => setProdStock(e.target.value)}
                  placeholder="20"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#003d29]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Pilihan Warna Produk
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={prodColorName}
                    onChange={(e) => setProdColorName(e.target.value)}
                    placeholder="Nama Warna (cth: Midnight Black)"
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#003d29]"
                  />
                  <input
                    type="color"
                    value={prodColorHex}
                    onChange={(e) => setProdColorHex(e.target.value)}
                    className="w-11 h-10 rounded-xl border border-slate-200 cursor-pointer p-0.5"
                    title="Pilih Kode Warna"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Deskripsi Singkat Produk
                </label>
                <input
                  type="text"
                  value={prodShortDesc}
                  onChange={(e) => setProdShortDesc(e.target.value)}
                  placeholder="Ringkasan 1 kalimat fitur unggulan produk..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#003d29]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Deskripsi Lengkap & Spesifikasi
                </label>
                <textarea
                  rows={4}
                  value={prodDesc}
                  onChange={(e) => setProdDesc(e.target.value)}
                  placeholder="Jelaskan detail spesifikasi, bahan, kelengkapan kotak, dan garansi..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#003d29]"
                />
              </div>
            </div>

            {/* Upload Foto Produk */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <label className="block text-[11px] font-bold text-slate-800">
                Upload Foto Produk
              </label>

              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="w-24 h-24 rounded-2xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
                  {prodImage ? (
                    <img src={prodImage} alt="Product Preview" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="w-8 h-8 text-slate-300" />
                  )}
                </div>

                <div className="space-y-2 text-left">
                  <label className="inline-flex items-center gap-2 py-2.5 px-4 rounded-full bg-[#003d29] hover:bg-[#064e3b] text-white text-xs font-bold transition-all cursor-pointer shadow-xs">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Pilih Foto dari Perangkat</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProductImageUpload}
                      className="hidden"
                    />
                  </label>
                  <p className="text-[11px] text-slate-500">
                    Format yang didukung: JPG, PNG, WEBP (Maksimal 5MB). Foto akan disimpan langsung ke database toko.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex gap-3">
              <button
                type="submit"
                className="py-3.5 px-8 rounded-full font-bold text-sm text-white bg-[#003d29] hover:bg-[#064e3b] shadow-md shadow-emerald-950/15 flex items-center gap-2 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Posting & Simpan Produk ke Database</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('products')}
                className="py-3.5 px-6 rounded-full font-semibold text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                Batal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: PENGATURAN TOKO */}
      {/* ========================================================================= */}
      {activeTab === 'settings' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/80 shadow-2xs space-y-6 animate-in fade-in">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg font-extrabold text-slate-900">Pengaturan Informasi Toko</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Ubah profil, slogan, lokasi toko, dan foto logo/banner toko Anda.
            </p>
          </div>

          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Nama Toko</label>
                <input
                  type="text"
                  defaultValue={currentShop.name}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#003d29]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Kota Asal Toko</label>
                <input
                  type="text"
                  defaultValue={currentShop.city}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#003d29]"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Slogan Toko</label>
                <input
                  type="text"
                  defaultValue={currentShop.tagline}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#003d29]"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Deskripsi Toko</label>
                <textarea
                  rows={3}
                  defaultValue={currentShop.description}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#003d29]"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <button
                onClick={() => {
                  alert('Informasi toko berhasil disimpan!');
                }}
                className="py-3 px-6 rounded-full font-bold text-xs text-white bg-[#003d29] hover:bg-[#064e3b] shadow-md transition-all cursor-pointer"
              >
                Simpan Perubahan Toko
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
