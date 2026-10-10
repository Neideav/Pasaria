import React, { useState, useEffect } from 'react';
import {
  Store,
  Plus,
  Package,
  DollarSign,
  TrendingUp,
  Star,
  MapPin,
  CheckCircle2,
  Trash2,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  Tag,
  Phone,
  Layers,
  ArrowLeft,
  Truck,
  MessageCircle,
  Clock,
  AlertTriangle,
  Wallet,
  X
} from 'lucide-react';
import { User, Shop, Product, Order, Review } from '../types';
import { ProductVisual } from './ProductVisual';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { formatRupiah, formatDateTime } from '../utils/formatters';

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
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'inventory' | 'orders' | 'reviews' | 'finances' | 'add_product' | 'register'>('overview');

  // Shop registration state
  const [shopName, setShopName] = useState('');
  const [shopTagline, setShopTagline] = useState('');
  const [shopDesc, setShopDesc] = useState('');
  const [shopCity, setShopCity] = useState(user?.city || 'Jakarta');
  const [shopPhone, setShopPhone] = useState(user?.phone || '+62 812-3456-7890');
  const [isRegistering, setIsRegistering] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');

  // Seller Data from API
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [inventoryList, setInventoryList] = useState<any[]>([]);
  const [sellerOrders, setSellerOrders] = useState<Order[]>([]);
  const [financesData, setFinancesData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // New Product Form
  const [prodName, setProdName] = useState('');
  const [prodCategory, setProdCategory] = useState('Headphones');
  const [prodPrice, setProdPrice] = useState('');
  const [prodStock, setProdStock] = useState('25');
  const [prodDesc, setProdDesc] = useState('');
  const [prodVariantName, setProdVariantName] = useState('Standard');
  const [prodSku, setProdSku] = useState('');
  const [prodCreating, setProdCreating] = useState(false);

  // Payout request modal/form
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutBank, setPayoutBank] = useState('BCA');
  const [payoutAccountNo, setPayoutAccountNo] = useState('');
  const [payoutHolder, setPayoutHolder] = useState(user?.name || '');
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [payoutErrors, setPayoutErrors] = useState<{
    amount?: string;
    bank?: string;
    accountNo?: string;
    accountHolder?: string;
  }>({});

  // Review reply state
  const [replyTextMap, setReplyTextMap] = useState<Record<number, string>>({});

  const currentShop: Shop | null = user?.shop || null;
  const availableBalance = financesData?.available_balance ?? 14500000;

  useEffect(() => {
    if (!currentShop) {
      setActiveTab('register');
    } else {
      loadSellerData();
    }
  }, [currentShop?.id]);

  const loadSellerData = async () => {
    setLoading(true);
    try {
      const dbRes = await api.getSellerDashboard();
      setDashboardData(dbRes);
    } catch (e) {
      console.warn('Dashboard load note:', e);
    }

    try {
      const inv = await api.getSellerInventory();
      setInventoryList(inv || []);
    } catch (e) {
      console.warn('Inventory load note:', e);
    }

    try {
      const ords = await api.getSellerOrders();
      setSellerOrders(ords || []);
    } catch (e) {
      console.warn('Orders load note:', e);
    }

    try {
      const fin = await api.getSellerFinances();
      setFinancesData(fin);
    } catch (e) {
      console.warn('Finances load note:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterShop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopName.trim()) return;

    setIsRegistering(true);
    try {
      const res = await api.createShop({
        name: shopName.trim(),
        slogan: shopTagline.trim() || 'Penyedia Produk Resmi Terpercaya',
        description: shopDesc.trim() || 'Toko resmi dengan jaminan produk original dan pengiriman cepat.',
        city: shopCity.trim() || 'Jakarta',
        phone: shopPhone.trim() || '+62 812-3456-7890',
      });

      const updatedUser: User = {
        ...(user as User),
        role: 'seller',
        shop: res,
      };

      onUpdateUser(updatedUser);
      const msg = 'Selamat! Toko Anda berhasil didaftarkan dan siap berjualan di PASARIA.';
      setActionSuccess(msg);
      showToast(msg, 'success');
      setActiveTab('overview');
      loadSellerData();
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (err: any) {
      showToast(err.message || 'Gagal mendaftarkan toko.', 'error');
    } finally {
      setIsRegistering(false);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName.trim() || !prodPrice) return;

    setProdCreating(true);
    try {
      const priceNum = parseFloat(prodPrice) || 50000;
      const stockNum = parseInt(prodStock, 10) || 10;

      const created = await api.createSellerProduct({
        name: prodName.trim(),
        category: prodCategory,
        price: priceNum,
        stock: stockNum,
        description: prodDesc.trim() || 'Produk resmi dengan garansi kualitas terjamin.',
        variant_name: prodVariantName.trim() || 'Standard',
        sku: prodSku.trim() || `SKU-${Date.now().toString().slice(-6)}`,
      });

      onAddProduct((created as any).product || created);
      const msg = 'Produk baru berhasil ditambahkan ke etalase toko Anda!';
      setActionSuccess(msg);
      showToast(msg, 'success');
      setProdName('');
      setProdPrice('');
      setProdDesc('');
      setProdSku('');
      setActiveTab('products');
      loadSellerData();
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (err: any) {
      showToast(err.message || 'Gagal menambahkan produk.', 'error');
    } finally {
      setProdCreating(false);
    }
  };

  const handleUpdateStock = async (inventoryId: number, currentStock: number, delta: number) => {
    const newStock = Math.max(0, currentStock + delta);
    try {
      await api.updateSellerStock(inventoryId, newStock);
      setInventoryList((prev) =>
        prev.map((item) => (item.id === inventoryId ? { ...item, stock: newStock } : item))
      );
      showToast(`Stok berhasil diperbarui: ${newStock} unit.`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Gagal memperbarui stok', 'error');
    }
  };

  const handleFulfillOrder = async (orderId: number, status: string) => {
    try {
      const trackingNumber = `PASARIA-EXP-${Date.now().toString().slice(-8)}`;
      await api.updateOrderStatus(orderId, status, trackingNumber);
      setSellerOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: 'shipped', tracking_number: trackingNumber } : o))
      );
      const msg = `Pesanan #${orderId} dikirim dengan nomor resi ${trackingNumber}.`;
      setActionSuccess(msg);
      showToast(msg, 'success');
      loadSellerData();
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (err: any) {
      showToast(err.message || 'Gagal memproses pesanan', 'error');
    }
  };

  const handleReplyReview = async (reviewId: number) => {
    const text = replyTextMap[reviewId];
    if (!text || !text.trim()) return;

    try {
      await api.replyReview(reviewId, text.trim());
      showToast('Balasan ulasan berhasil dikirim ke pembeli.', 'success');
      setReplyTextMap((prev) => ({ ...prev, [reviewId]: '' }));
      loadSellerData();
      setTimeout(() => setActionSuccess(''), 3000);
    } catch (err: any) {
      showToast(err.message || 'Gagal membalas ulasan', 'error');
    }
  };

  const validatePayout = (): boolean => {
    const errors: {
      amount?: string;
      bank?: string;
      accountNo?: string;
      accountHolder?: string;
    } = {};

    const amt = parseFloat(payoutAmount);

    if (!payoutAmount || isNaN(amt) || amt <= 0) {
      errors.amount = 'Nominal penarikan harus lebih dari Rp 0.';
    } else if (amt < 10000) {
      errors.amount = 'Nominal penarikan minimal Rp 10.000.';
    } else if (amt > availableBalance) {
      errors.amount = `Nominal melebihi saldo tersedia (${formatRupiah(availableBalance)}).`;
    }

    if (!payoutBank.trim()) {
      errors.bank = 'Silakan pilih bank tujuan penarikan.';
    }

    const cleanAccountNo = payoutAccountNo.trim().replace(/\s+/g, '');
    if (!cleanAccountNo) {
      errors.accountNo = 'Nomor rekening tujuan wajib diisi.';
    } else if (!/^\d{5,25}$/.test(cleanAccountNo)) {
      errors.accountNo = 'Nomor rekening harus berupa 5-25 digit angka.';
    }

    if (!payoutHolder.trim()) {
      errors.accountHolder = 'Nama pemilik rekening wajib diisi.';
    } else if (payoutHolder.trim().length < 3) {
      errors.accountHolder = 'Nama pemilik rekening minimal 3 karakter.';
    }

    setPayoutErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRequestPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePayout()) {
      showToast('Periksa kembali data formulir penarikan dana.', 'error');
      return;
    }

    const amt = parseFloat(payoutAmount);
    setPayoutLoading(true);
    try {
      await api.requestSellerPayout({
        amount: amt,
        bank_name: payoutBank,
        account_number: payoutAccountNo.trim(),
        account_holder: payoutHolder.trim(),
      });

      const msg = `Permintaan penarikan dana ${formatRupiah(amt)} berhasil diajukan.`;
      setActionSuccess(msg);
      showToast(msg, 'success');
      setPayoutAmount('');
      setPayoutErrors({});
      setShowPayoutModal(false);
      loadSellerData();
      setTimeout(() => setActionSuccess(''), 3000);
    } catch (err: any) {
      showToast(err.message || 'Gagal mengajukan penarikan saldo', 'error');
    } finally {
      setPayoutLoading(false);
    }
  };

  // Filter products for this shop
  const myProducts = currentShop
    ? products.filter(
        (p) =>
          (p.shop_id != null && currentShop.id != null && String(p.shop_id) === String(currentShop.id)) ||
          (p.shop_name && currentShop.name && p.shop_name.trim().toLowerCase() === currentShop.name.trim().toLowerCase())
      )
    : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 text-left space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200/80 gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs uppercase tracking-wider mb-1">
            <Store className="w-4 h-4 text-emerald-700" />
            <span>PASARIA Seller Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {currentShop ? currentShop.name : 'Pendaftaran Toko Baru'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Pusat operasional manajemen inventaris, pesanan masuk, ulasan pembeli, dan keuangan merchant.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {currentShop && (
            <button
              onClick={() => onViewShopPublic(currentShop)}
              aria-label="Lihat profil publik toko di katalog marketplace"
              className="min-h-[44px] px-4 py-2 rounded-full border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#003d29] motion-press active:scale-[0.96]"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Lihat Toko Publik</span>
            </button>
          )}
          <button
            onClick={onNavigateHome}
            aria-label="Kembali ke Beranda PASARIA"
            className="min-h-[44px] inline-flex items-center gap-1 text-xs font-semibold text-[#003d29] hover:underline cursor-pointer px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#003d29] motion-press active:scale-[0.96]"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Beranda</span>
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Tabs for Seller Center (Motion Point #48) */}
      {currentShop && (
        <div
          role="tablist"
          aria-label="Navigasi Menu Seller Center"
          className="flex items-center gap-2 overflow-x-auto pb-3 border-b border-slate-100 text-xs"
        >
          {[
            { id: 'overview', label: 'Ringkasan & Metrik', icon: TrendingUp },
            { id: 'products', label: 'Katalog Produk', icon: Package },
            { id: 'inventory', label: 'Manajemen Stok & SKU', icon: Layers },
            { id: 'orders', label: 'Pesanan Masuk', icon: Truck },
            { id: 'reviews', label: 'Ulasan & Rating', icon: Star },
            { id: 'finances', label: 'Keuangan & Saldo', icon: Wallet },
            { id: 'add_product', label: '+ Tambah Produk Baru', icon: Plus },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`shop-tab-${tab.id}`}
                role="tab"
                aria-selected={isActive}
                aria-controls={`shop-panel-${tab.id}`}
                tabIndex={isActive ? 0 : -1}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer min-h-[44px] focus:outline-none focus:ring-2 focus:ring-[#003d29] motion-press active:scale-[0.96] ${
                  isActive
                    ? 'bg-[#003d29] text-white shadow-xs'
                    : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200/80'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Registration View for New Sellers */}
      {activeTab === 'register' && (
        <div
          id="shop-panel-register"
          role="tabpanel"
          aria-labelledby="shop-tab-register"
          tabIndex={0}
          className="motion-tab-pane max-w-2xl mx-auto bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-2xs space-y-6 focus:outline-none"
        >
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-[#003d29] flex items-center justify-center mx-auto font-black text-xl">
              <Store className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-black text-slate-900">Buka Toko Resmi di PASARIA</h2>
            <p className="text-xs text-slate-500">Mulai berjualan ke jutaan pembeli aktif dengan perlindungan escrow dan logistik resmi.</p>
          </div>

          <form onSubmit={handleRegisterShop} className="space-y-4 text-xs">
            <div>
              <label htmlFor="reg-shop-name" className="block text-[11px] font-semibold text-slate-700 mb-1">Nama Toko Online</label>
              <input
                id="reg-shop-name"
                type="text"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                placeholder="Contoh: Maju Audio Store"
                className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#003d29] focus:ring-2 focus:ring-[#003d29]"
                required
              />
            </div>

            <div>
              <label htmlFor="reg-shop-tagline" className="block text-[11px] font-semibold text-slate-700 mb-1">Slogan / Tagline Toko</label>
              <input
                id="reg-shop-tagline"
                type="text"
                value={shopTagline}
                onChange={(e) => setShopTagline(e.target.value)}
                placeholder="Contoh: Pusat Gadget & Audio Original Bergaransi"
                className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#003d29] focus:ring-2 focus:ring-[#003d29]"
              />
            </div>

            <div>
              <label htmlFor="reg-shop-city" className="block text-[11px] font-semibold text-slate-700 mb-1">Kota Domisili Toko</label>
              <input
                id="reg-shop-city"
                type="text"
                value={shopCity}
                onChange={(e) => setShopCity(e.target.value)}
                placeholder="Contoh: Jakarta Pusat"
                className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#003d29] focus:ring-2 focus:ring-[#003d29]"
                required
              />
            </div>

            <div>
              <label htmlFor="reg-shop-phone" className="block text-[11px] font-semibold text-slate-700 mb-1">Nomor Kontak Toko</label>
              <input
                id="reg-shop-phone"
                type="text"
                value={shopPhone}
                onChange={(e) => setShopPhone(e.target.value)}
                className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#003d29] focus:ring-2 focus:ring-[#003d29]"
                required
              />
            </div>

            <div>
              <label htmlFor="reg-shop-desc" className="block text-[11px] font-semibold text-slate-700 mb-1">Deskripsi Toko</label>
              <textarea
                id="reg-shop-desc"
                rows={3}
                value={shopDesc}
                onChange={(e) => setShopDesc(e.target.value)}
                placeholder="Jelaskan jenis produk yang Anda jual dan komitmen layanan toko Anda..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#003d29] focus:ring-2 focus:ring-[#003d29] leading-relaxed"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isRegistering}
                className="w-full min-h-[44px] py-3.5 rounded-full bg-[#003d29] hover:bg-[#064e3b] text-white font-bold text-xs transition-all shadow-md cursor-pointer disabled:opacity-40 inline-flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-[#003d29] motion-press active:scale-[0.96]"
              >
                {isRegistering ? 'Mendaftarkan Toko...' : 'Buka Toko Sekarang'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && currentShop && (
        <div
          id="shop-panel-overview"
          role="tabpanel"
          aria-labelledby="shop-tab-overview"
          tabIndex={0}
          className="motion-tab-pane space-y-8 focus:outline-none"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-2xs">
              <div className="text-slate-400 text-xs font-semibold mb-1">Pendapatan Kotor</div>
              <div className="text-xl font-extrabold text-[#003d29] tabular-nums">
                {formatRupiah(dashboardData?.revenue || 42500000)}
              </div>
              <div className="text-[11px] text-emerald-700 font-medium mt-1">Total Penjualan</div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-2xs">
              <div className="text-slate-400 text-xs font-semibold mb-1">Pesanan Masuk</div>
              <div className="text-xl font-extrabold text-slate-900 tabular-nums">
                {dashboardData?.total_orders || sellerOrders.length || 8}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Transaksi Berjalan</div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-2xs">
              <div className="text-slate-400 text-xs font-semibold mb-1">Stok Menipis (&lt;5 unit)</div>
              <div className="text-xl font-extrabold text-amber-700 tabular-nums">
                {inventoryList.filter((i) => i.stock < 5).length}
              </div>
              <div className="text-[11px] text-amber-600 font-medium mt-1">Perlu Restok Segera</div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-2xs">
              <div className="text-slate-400 text-xs font-semibold mb-1">Rating Kepuasan Toko</div>
              <div className="text-xl font-extrabold text-slate-900 tabular-nums flex items-center gap-1">
                <span className="tabular-nums">{Number(currentShop.rating || 5).toFixed(1)}</span>
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              </div>
              <div className="text-[11px] text-emerald-700 font-medium mt-1">Sangat Baik</div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Products Catalog */}
      {activeTab === 'products' && (
        <div
          id="shop-panel-products"
          role="tabpanel"
          aria-labelledby="shop-tab-products"
          tabIndex={0}
          className="motion-tab-pane bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs space-y-4 focus:outline-none"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">
                Daftar Produk Toko (<span className="tabular-nums">{myProducts.length}</span>)
              </h3>
              <p className="text-xs text-slate-400">Produk yang sedang aktif ditampilkan di etalase pembeli PASARIA.</p>
            </div>
            <button
              onClick={() => setActiveTab('add_product')}
              aria-label="Tambah produk baru ke etalase"
              className="min-h-[44px] px-4 py-2 rounded-full bg-[#003d29] hover:bg-[#064e3b] text-white text-xs font-bold transition-all cursor-pointer shadow-2xs inline-flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-[#003d29] motion-press active:scale-[0.96]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Produk</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {myProducts.map((p) => (
              <div
                key={p.id}
                className="p-4 rounded-2xl border border-slate-100 hover:border-slate-200 bg-white flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center p-1 shrink-0">
                    <ProductVisual imageKey={p.image} name={p.name} size="sm" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 line-clamp-1">{p.name}</h4>
                    <p className="text-slate-400 text-[11px]">{p.category}</p>
                    <div className="font-extrabold text-[#003d29] tabular-nums mt-1">
                      {formatRupiah(p.price)}
                    </div>
                  </div>
                </div>

                {onDeleteProduct && (
                  <button
                    onClick={() => onDeleteProduct(p.id)}
                    aria-label={`Hapus produk ${p.name}`}
                    className="min-w-[40px] min-h-[40px] rounded-full hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer inline-flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-rose-500 motion-press active:scale-[0.96]"
                    title="Hapus Produk"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Inventory & SKU Management */}
      {activeTab === 'inventory' && (
        <div
          id="shop-panel-inventory"
          role="tabpanel"
          aria-labelledby="shop-tab-inventory"
          tabIndex={0}
          className="motion-tab-pane bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs space-y-4 focus:outline-none"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">Manajemen Inventaris Stok & SKU</h3>
              <p className="text-xs text-slate-400">Atur ketersediaan barang secara instan untuk mencegah pembatalan pesanan.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Produk & Varian</th>
                  <th className="py-3 px-4">SKU</th>
                  <th className="py-3 px-4">Harga Jual</th>
                  <th className="py-3 px-4">Stok Saat Ini</th>
                  <th className="py-3 px-4 text-right">Penyesuaian Cepat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {inventoryList.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      <div>{inv.product?.name || inv.name || 'Produk Seller'}</div>
                      <div className="text-[11px] text-slate-400 font-normal">{inv.variant_name || 'Standard'}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">{inv.sku || `SKU-${inv.id}`}</td>
                    <td className="py-3 px-4 font-extrabold text-[#003d29] tabular-nums">
                      {formatRupiah(inv.product?.price || 150000)}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold tabular-nums ${
                        inv.stock < 5 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {inv.stock} Unit
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => handleUpdateStock(inv.id, inv.stock, -1)}
                          aria-label={`Kurangi 1 unit stok ${inv.name || 'produk'}`}
                          className="min-w-[40px] min-h-[40px] rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-bold text-slate-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-slate-400 motion-press active:scale-[0.96]"
                        >
                          -
                        </button>
                        <button
                          onClick={() => handleUpdateStock(inv.id, inv.stock, 5)}
                          aria-label={`Tambah 5 unit stok ${inv.name || 'produk'}`}
                          className="min-h-[40px] px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#003d29] font-bold text-[11px] tabular-nums cursor-pointer inline-flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-[#003d29] motion-press active:scale-[0.96]"
                        >
                          +5
                        </button>
                        <button
                          onClick={() => handleUpdateStock(inv.id, inv.stock, 20)}
                          aria-label={`Tambah 20 unit stok ${inv.name || 'produk'}`}
                          className="min-h-[40px] px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#003d29] font-bold text-[11px] tabular-nums cursor-pointer inline-flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-[#003d29] motion-press active:scale-[0.96]"
                        >
                          +20
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Orders Management */}
      {activeTab === 'orders' && (
        <div
          id="shop-panel-orders"
          role="tabpanel"
          aria-labelledby="shop-tab-orders"
          tabIndex={0}
          className="motion-tab-pane bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs space-y-4 focus:outline-none"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">Pesanan Pembeli untuk Toko Anda</h3>
              <p className="text-xs text-slate-400">Proses pengemasan dan input resi pengiriman untuk pembeli.</p>
            </div>
          </div>

          <div className="space-y-4">
            {sellerOrders.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                Belum ada pesanan masuk saat ini.
              </div>
            ) : (
              sellerOrders.map((ord) => (
                <div
                  key={ord.id}
                  className="p-5 rounded-2xl bg-slate-50 border border-slate-200/60 space-y-3 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-extrabold text-slate-900">
                        Pesanan #<span className="tabular-nums">{ord.order_number}</span>
                      </span>
                      <span className="text-slate-400 ml-2 tabular-nums">· {formatDateTime(ord.created_at)}</span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                      {ord.status || 'Processing'}
                    </span>
                  </div>

                  <div className="text-slate-600">
                    <div>Penerima: <span className="font-bold text-slate-900">{ord.customer_name}</span></div>
                    <div>Alamat Kirim: {ord.shipping_address}</div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                    <div className="font-extrabold text-[#003d29] text-sm tabular-nums">
                      Total: {formatRupiah(ord.total)}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleFulfillOrder(ord.id, 'shipped')}
                        aria-label={`Kirim pesanan nomor ${ord.order_number} dan terbitkan nomor resi`}
                        className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#003d29] hover:bg-[#064e3b] text-white font-bold text-xs cursor-pointer shadow-2xs inline-flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-[#003d29] motion-press active:scale-[0.96]"
                      >
                        Kirim Barang (Generate Resi)
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 5: Reviews */}
      {activeTab === 'reviews' && (
        <div
          id="shop-panel-reviews"
          role="tabpanel"
          aria-labelledby="shop-tab-reviews"
          tabIndex={0}
          className="motion-tab-pane bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs space-y-4 focus:outline-none"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">Ulasan Produk & Respon Penjual</h3>
              <p className="text-xs text-slate-400">Balas ulasan pembeli untuk meningkatkan loyalitas dan kredibilitas toko Anda.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-slate-900">
                  <span>Pembeli Terverifikasi</span>
                  <span className="text-amber-500 tabular-nums">★★★★★ (5.0)</span>
                </div>
                <span className="text-slate-400 text-[11px]">Kemarin</span>
              </div>
              <p className="text-slate-700">"Barang bagus banget, original, pengiriman super kilat sampai ke rumah."</p>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Tulis balasan terima kasih..."
                  value={replyTextMap[1] || ''}
                  onChange={(e) => setReplyTextMap({ ...replyTextMap, 1: e.target.value })}
                  className="flex-1 min-h-[44px] px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#003d29]"
                />
                <button
                  onClick={() => handleReplyReview(1)}
                  aria-label="Kirim balasan untuk ulasan pembeli"
                  className="min-h-[44px] px-5 py-2 rounded-xl bg-[#003d29] hover:bg-[#064e3b] text-white font-bold cursor-pointer inline-flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-[#003d29] motion-press active:scale-[0.96]"
                >
                  Balas
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 6: Finances & Saldo */}
      {activeTab === 'finances' && (
        <div
          id="shop-panel-finances"
          role="tabpanel"
          aria-labelledby="shop-tab-finances"
          tabIndex={0}
          className="motion-tab-pane space-y-6 focus:outline-none"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="text-slate-400 text-xs font-semibold mb-1">Saldo Tersedia untuk Ditarik</div>
                <div className="text-2xl font-black text-[#003d29] tabular-nums">
                  {formatRupiah(availableBalance)}
                </div>
                <div className="text-[11px] text-emerald-700 font-medium mt-1">Siap Masuk Rekening</div>
              </div>
              <button
                type="button"
                onClick={() => setShowPayoutModal(true)}
                className="mt-4 w-full min-h-[40px] px-4 py-2 rounded-xl bg-[#003d29] hover:bg-[#064e3b] text-white text-xs font-bold transition-all cursor-pointer shadow-xs inline-flex items-center justify-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-[#003d29] motion-press active:scale-[0.96]"
              >
                <Wallet className="w-3.5 h-3.5" />
                <span>Tarik Saldo Toko</span>
              </button>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-2xs">
              <div className="text-slate-400 text-xs font-semibold mb-1">Saldo Tertahan (Dalam Pengiriman)</div>
              <div className="text-2xl font-black text-slate-900 tabular-nums">
                {formatRupiah(financesData?.pending_balance || 2300000)}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">Akan Cair Saat Barang Diterima</div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-2xs">
              <div className="text-slate-400 text-xs font-semibold mb-1">Total Sudah Ditarik</div>
              <div className="text-2xl font-black text-slate-900 tabular-nums">
                {formatRupiah(financesData?.total_payouts || 25000000)}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">Rekening Terverifikasi</div>
            </div>
          </div>

          {/* Request Payout Form (Inline Card) */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-2xs space-y-4 max-w-xl text-xs">
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <Wallet className="w-4 h-4 text-[#003d29]" />
              Ajukan Penarikan Dana (Payout)
            </h3>

            {/* Quick Amount Presets (Motion Point #50) */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-600">Pilih Cepat Nominal:</span>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: 'Rp 100rb', value: '100000' },
                  { label: 'Rp 500rb', value: '500000' },
                  { label: 'Rp 1jt', value: '1000000' },
                  { label: 'Tarik Semua', value: String(availableBalance) },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      setPayoutAmount(preset.value);
                      if (payoutErrors.amount) {
                        setPayoutErrors((prev) => ({ ...prev, amount: undefined }));
                      }
                    }}
                    className="min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-200 hover:border-[#003d29] hover:bg-emerald-50 text-slate-700 transition-colors tabular-nums cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#003d29] motion-press active:scale-[0.96] transition-transform duration-120"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleRequestPayout} className="space-y-4" noValidate>
              <div>
                <label htmlFor="payout-amount" className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Nominal Penarikan (Rp) *
                </label>
                <input
                  id="payout-amount"
                  type="number"
                  min="10000"
                  max={availableBalance}
                  value={payoutAmount}
                  onChange={(e) => {
                    setPayoutAmount(e.target.value);
                    if (payoutErrors.amount) {
                      setPayoutErrors((prev) => ({ ...prev, amount: undefined }));
                    }
                  }}
                  placeholder="Contoh: 1000000"
                  aria-invalid={!!payoutErrors.amount}
                  aria-describedby={payoutErrors.amount ? 'payout-amount-error' : undefined}
                  className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border font-bold tabular-nums focus:outline-none focus:ring-2 ${
                    payoutErrors.amount
                      ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200'
                      : 'border-slate-200 focus:border-[#003d29] focus:ring-[#003d29]/20'
                  }`}
                  required
                />
                {payoutErrors.amount && (
                  <p id="payout-amount-error" role="alert" className="mt-1 text-[11px] text-rose-600 font-semibold">
                    {payoutErrors.amount}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="payout-bank" className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Bank Tujuan *
                  </label>
                  <select
                    id="payout-bank"
                    value={payoutBank}
                    onChange={(e) => {
                      setPayoutBank(e.target.value);
                      if (payoutErrors.bank) {
                        setPayoutErrors((prev) => ({ ...prev, bank: undefined }));
                      }
                    }}
                    aria-invalid={!!payoutErrors.bank}
                    aria-describedby={payoutErrors.bank ? 'payout-bank-error' : undefined}
                    className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border bg-white focus:outline-none focus:ring-2 ${
                      payoutErrors.bank
                        ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200'
                        : 'border-slate-200 focus:border-[#003d29] focus:ring-[#003d29]/20'
                    }`}
                  >
                    <option value="BCA">Bank BCA</option>
                    <option value="Mandiri">Bank Mandiri</option>
                    <option value="BRI">Bank BRI</option>
                    <option value="BNI">Bank BNI</option>
                    <option value="BSI">Bank Syariah Indonesia (BSI)</option>
                    <option value="CIMB">CIMB Niaga</option>
                  </select>
                  {payoutErrors.bank && (
                    <p id="payout-bank-error" role="alert" className="mt-1 text-[11px] text-rose-600 font-semibold">
                      {payoutErrors.bank}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="payout-account-no" className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Nomor Rekening *
                  </label>
                  <input
                    id="payout-account-no"
                    type="text"
                    inputMode="numeric"
                    value={payoutAccountNo}
                    onChange={(e) => {
                      setPayoutAccountNo(e.target.value);
                      if (payoutErrors.accountNo) {
                        setPayoutErrors((prev) => ({ ...prev, accountNo: undefined }));
                      }
                    }}
                    placeholder="Contoh: 8830192841"
                    aria-invalid={!!payoutErrors.accountNo}
                    aria-describedby={payoutErrors.accountNo ? 'payout-account-no-error' : undefined}
                    className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border font-mono tabular-nums focus:outline-none focus:ring-2 ${
                      payoutErrors.accountNo
                        ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200'
                        : 'border-slate-200 focus:border-[#003d29] focus:ring-[#003d29]/20'
                    }`}
                    required
                  />
                  {payoutErrors.accountNo && (
                    <p id="payout-account-no-error" role="alert" className="mt-1 text-[11px] text-rose-600 font-semibold">
                      {payoutErrors.accountNo}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="payout-holder" className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Nama Pemilik Rekening *
                </label>
                <input
                  id="payout-holder"
                  type="text"
                  value={payoutHolder}
                  onChange={(e) => {
                    setPayoutHolder(e.target.value);
                    if (payoutErrors.accountHolder) {
                      setPayoutErrors((prev) => ({ ...prev, accountHolder: undefined }));
                    }
                  }}
                  placeholder="Nama sesuai buku tabungan"
                  aria-invalid={!!payoutErrors.accountHolder}
                  aria-describedby={payoutErrors.accountHolder ? 'payout-holder-error' : undefined}
                  className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border focus:outline-none focus:ring-2 ${
                    payoutErrors.accountHolder
                      ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200'
                      : 'border-slate-200 focus:border-[#003d29] focus:ring-[#003d29]/20'
                  }`}
                  required
                />
                {payoutErrors.accountHolder && (
                  <p id="payout-holder-error" role="alert" className="mt-1 text-[11px] text-rose-600 font-semibold">
                    {payoutErrors.accountHolder}
                  </p>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={payoutLoading}
                  aria-label="Kirim pengajuan penarikan dana saldo toko"
                  className="w-full min-h-[44px] py-3.5 rounded-full bg-[#003d29] hover:bg-[#064e3b] text-white font-bold transition-all cursor-pointer shadow-2xs disabled:opacity-40 inline-flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-[#003d29] motion-press active:scale-[0.96]"
                >
                  {payoutLoading ? 'Memproses Pengajuan...' : 'Kirim Pengajuan Penarikan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Motion Point #49: Payout Modal Centered Scale Entrance */}
      {showPayoutModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="payout-modal-title"
          className="motion-modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowPayoutModal(false);
          }}
        >
          <div className="motion-modal bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 p-6 sm:p-8 text-left relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <h3 id="payout-modal-title" className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <Wallet className="w-5 h-5 text-[#003d29]" />
                <span>Tarik Saldo Toko (Payout)</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowPayoutModal(false)}
                className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer motion-press active:scale-[0.96]"
                aria-label="Tutup formulir penarikan dana"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 mb-5 flex items-center justify-between text-xs">
              <div>
                <div className="text-[11px] text-slate-500 font-semibold">Saldo Tersedia:</div>
                <div className="font-black text-[#003d29] text-base tabular-nums">{formatRupiah(availableBalance)}</div>
              </div>
              <span className="text-[10px] font-bold text-emerald-800 bg-white/80 px-2.5 py-1 rounded-full border border-emerald-200">
                Siap Cair
              </span>
            </div>

            {/* Quick Amount Presets (Motion Point #50) */}
            <div className="space-y-1.5 mb-4 text-xs">
              <span className="text-[11px] font-semibold text-slate-600">Pilih Cepat Nominal:</span>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: 'Rp 100rb', value: '100000' },
                  { label: 'Rp 500rb', value: '500000' },
                  { label: 'Rp 1jt', value: '1000000' },
                  { label: 'Tarik Semua', value: String(availableBalance) },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      setPayoutAmount(preset.value);
                      if (payoutErrors.amount) {
                        setPayoutErrors((prev) => ({ ...prev, amount: undefined }));
                      }
                    }}
                    className="min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-200 hover:border-[#003d29] hover:bg-emerald-50 text-slate-700 transition-colors tabular-nums cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#003d29] motion-press active:scale-[0.96] transition-transform duration-120"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleRequestPayout} className="space-y-4 text-xs" noValidate>
              <div>
                <label htmlFor="modal-payout-amount" className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Nominal Penarikan (Rp) *
                </label>
                <input
                  id="modal-payout-amount"
                  type="number"
                  min="10000"
                  max={availableBalance}
                  value={payoutAmount}
                  onChange={(e) => {
                    setPayoutAmount(e.target.value);
                    if (payoutErrors.amount) {
                      setPayoutErrors((prev) => ({ ...prev, amount: undefined }));
                    }
                  }}
                  placeholder="Contoh: 1000000"
                  aria-invalid={!!payoutErrors.amount}
                  aria-describedby={payoutErrors.amount ? 'modal-payout-amount-error' : undefined}
                  className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border font-bold tabular-nums focus:outline-none focus:ring-2 ${
                    payoutErrors.amount
                      ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200'
                      : 'border-slate-200 focus:border-[#003d29] focus:ring-[#003d29]/20'
                  }`}
                  required
                />
                {payoutErrors.amount && (
                  <p id="modal-payout-amount-error" role="alert" className="mt-1 text-[11px] text-rose-600 font-semibold">
                    {payoutErrors.amount}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="modal-payout-bank" className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Bank Tujuan *
                  </label>
                  <select
                    id="modal-payout-bank"
                    value={payoutBank}
                    onChange={(e) => {
                      setPayoutBank(e.target.value);
                      if (payoutErrors.bank) {
                        setPayoutErrors((prev) => ({ ...prev, bank: undefined }));
                      }
                    }}
                    aria-invalid={!!payoutErrors.bank}
                    aria-describedby={payoutErrors.bank ? 'modal-payout-bank-error' : undefined}
                    className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border bg-white focus:outline-none focus:ring-2 ${
                      payoutErrors.bank
                        ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200'
                        : 'border-slate-200 focus:border-[#003d29] focus:ring-[#003d29]/20'
                    }`}
                  >
                    <option value="BCA">Bank BCA</option>
                    <option value="Mandiri">Bank Mandiri</option>
                    <option value="BRI">Bank BRI</option>
                    <option value="BNI">Bank BNI</option>
                    <option value="BSI">Bank Syariah Indonesia (BSI)</option>
                    <option value="CIMB">CIMB Niaga</option>
                  </select>
                  {payoutErrors.bank && (
                    <p id="modal-payout-bank-error" role="alert" className="mt-1 text-[11px] text-rose-600 font-semibold">
                      {payoutErrors.bank}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="modal-payout-account-no" className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Nomor Rekening *
                  </label>
                  <input
                    id="modal-payout-account-no"
                    type="text"
                    inputMode="numeric"
                    value={payoutAccountNo}
                    onChange={(e) => {
                      setPayoutAccountNo(e.target.value);
                      if (payoutErrors.accountNo) {
                        setPayoutErrors((prev) => ({ ...prev, accountNo: undefined }));
                      }
                    }}
                    placeholder="Contoh: 8830192841"
                    aria-invalid={!!payoutErrors.accountNo}
                    aria-describedby={payoutErrors.accountNo ? 'modal-payout-account-no-error' : undefined}
                    className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border font-mono tabular-nums focus:outline-none focus:ring-2 ${
                      payoutErrors.accountNo
                        ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200'
                        : 'border-slate-200 focus:border-[#003d29] focus:ring-[#003d29]/20'
                    }`}
                    required
                  />
                  {payoutErrors.accountNo && (
                    <p id="modal-payout-account-no-error" role="alert" className="mt-1 text-[11px] text-rose-600 font-semibold">
                      {payoutErrors.accountNo}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="modal-payout-holder" className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Nama Pemilik Rekening *
                </label>
                <input
                  id="modal-payout-holder"
                  type="text"
                  value={payoutHolder}
                  onChange={(e) => {
                    setPayoutHolder(e.target.value);
                    if (payoutErrors.accountHolder) {
                      setPayoutErrors((prev) => ({ ...prev, accountHolder: undefined }));
                    }
                  }}
                  placeholder="Nama sesuai buku tabungan"
                  aria-invalid={!!payoutErrors.accountHolder}
                  aria-describedby={payoutErrors.accountHolder ? 'modal-payout-holder-error' : undefined}
                  className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border focus:outline-none focus:ring-2 ${
                    payoutErrors.accountHolder
                      ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200'
                      : 'border-slate-200 focus:border-[#003d29] focus:ring-[#003d29]/20'
                  }`}
                  required
                />
                {payoutErrors.accountHolder && (
                  <p id="modal-payout-holder-error" role="alert" className="mt-1 text-[11px] text-rose-600 font-semibold">
                    {payoutErrors.accountHolder}
                  </p>
                )}
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPayoutModal(false)}
                  className="min-h-[44px] px-5 py-2.5 rounded-full border border-slate-200 text-slate-600 font-semibold cursor-pointer motion-press active:scale-[0.96]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={payoutLoading}
                  aria-label="Kirim pengajuan penarikan dana saldo toko"
                  className="min-h-[44px] px-6 py-2.5 rounded-full bg-[#003d29] hover:bg-[#064e3b] text-white font-bold transition-all cursor-pointer shadow-2xs disabled:opacity-40 inline-flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-[#003d29] motion-press active:scale-[0.96]"
                >
                  {payoutLoading ? 'Memproses...' : 'Kirim Pengajuan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tab 7: Add Product */}
      {activeTab === 'add_product' && (
        <div
          id="shop-panel-add-product"
          role="tabpanel"
          aria-labelledby="shop-tab-add_product"
          tabIndex={0}
          className="motion-tab-pane max-w-2xl bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-2xs space-y-6 text-xs focus:outline-none"
        >
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm">Tambah Produk Baru ke Etalase</h3>
            <p className="text-slate-400 text-xs mt-0.5">Lengkapi spesifikasi produk dan varian stok barang.</p>
          </div>

          <form onSubmit={handleCreateProduct} className="space-y-4">
            <div>
              <label htmlFor="prod-name" className="block text-[11px] font-semibold text-slate-700 mb-1">Nama Produk</label>
              <input
                id="prod-name"
                type="text"
                value={prodName}
                onChange={(e) => setProdName(e.target.value)}
                placeholder="Contoh: AirPods Max Wireless Headphone Space Gray"
                className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#003d29] focus:ring-2 focus:ring-[#003d29]"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="prod-category" className="block text-[11px] font-semibold text-slate-700 mb-1">Kategori</label>
                <select
                  id="prod-category"
                  value={prodCategory}
                  onChange={(e) => setProdCategory(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#003d29]"
                >
                  <option value="Headphones">Headphones</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Shoes">Shoes</option>
                  <option value="Bags">Bags</option>
                  <option value="Books">Books</option>
                </select>
              </div>

              <div>
                <label htmlFor="prod-price" className="block text-[11px] font-semibold text-slate-700 mb-1">Harga Jual (Rp)</label>
                <input
                  id="prod-price"
                  type="number"
                  value={prodPrice}
                  onChange={(e) => setProdPrice(e.target.value)}
                  placeholder="Contoh: 1250000"
                  className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-slate-200 font-bold tabular-nums focus:outline-none focus:border-[#003d29] focus:ring-2 focus:ring-[#003d29]"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="prod-variant-name" className="block text-[11px] font-semibold text-slate-700 mb-1">Varian Nama</label>
                <input
                  id="prod-variant-name"
                  type="text"
                  value={prodVariantName}
                  onChange={(e) => setProdVariantName(e.target.value)}
                  placeholder="Contoh: Standard Edition"
                  className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#003d29] focus:ring-2 focus:ring-[#003d29]"
                />
              </div>

              <div>
                <label htmlFor="prod-stock" className="block text-[11px] font-semibold text-slate-700 mb-1">Jumlah Stok Awal</label>
                <input
                  id="prod-stock"
                  type="number"
                  value={prodStock}
                  onChange={(e) => setProdStock(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-slate-200 font-bold tabular-nums focus:outline-none focus:border-[#003d29] focus:ring-2 focus:ring-[#003d29]"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="prod-desc" className="block text-[11px] font-semibold text-slate-700 mb-1">Deskripsi Lengkap Produk</label>
              <textarea
                id="prod-desc"
                rows={3}
                value={prodDesc}
                onChange={(e) => setProdDesc(e.target.value)}
                placeholder="Jelaskan fitur unggulan, kelengkapan boks, dan keaslian produk..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#003d29] focus:ring-2 focus:ring-[#003d29] leading-relaxed"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={prodCreating}
                aria-label="Publikasikan produk baru ke katalog toko"
                className="w-full min-h-[44px] py-3.5 rounded-full bg-[#003d29] hover:bg-[#064e3b] text-white font-bold text-xs transition-all shadow-md cursor-pointer disabled:opacity-40 inline-flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-[#003d29] motion-press active:scale-[0.96]"
              >
                {prodCreating ? 'Menyimpan Produk...' : 'Publikasikan Produk'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
