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
  Wallet
} from 'lucide-react';
import { User, Shop, Product, Order, Review } from '../types';
import { ProductVisual } from './ProductVisual';
import { api, ApiError } from '../services/api';
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
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'inventory' | 'orders' | 'reviews' | 'finances' | 'add_product' | 'register'>('overview');

  // Shop registration state
  const [shopName, setShopName] = useState('');
  const [shopTagline, setShopTagline] = useState('');
  const [shopDesc, setShopDesc] = useState('');
  const [shopCity, setShopCity] = useState(user?.city || 'Jakarta');
  const [shopPhone, setShopPhone] = useState(user?.phone || '+62 812-3456-7890');
  const [isRegistering, setIsRegistering] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');
  const [updatingVariantId, setUpdatingVariantId] = useState<number | null>(null);
  const [fulfillingOrderId, setFulfillingOrderId] = useState<number | null>(null);

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
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutBank, setPayoutBank] = useState('BCA');
  const [payoutAccountNo, setPayoutAccountNo] = useState('');
  const [payoutHolder, setPayoutHolder] = useState(user?.name || '');
  const [payoutLoading, setPayoutLoading] = useState(false);

  // Review reply state
  const [replyTextMap, setReplyTextMap] = useState<Record<number, string>>({});

  const currentShop: Shop | null = user?.shop || null;

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
      setActionSuccess('Selamat! Toko Anda berhasil didaftarkan dan siap berjualan di PASARIA.');
      setActiveTab('overview');
      loadSellerData();
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (err: any) {
      alert(err.message || 'Gagal mendaftarkan toko.');
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
        description: prodDesc.trim() || `${prodName} original dari ${currentShop?.name}.`,
        image: 'airpods-max',
        sku: prodSku.trim() || `SKU-${Date.now().toString().slice(-6)}`,
        variant_name: prodVariantName.trim() || 'Standard Edition',
      });

      onAddProduct(created.product || created);
      setActionSuccess('Produk baru berhasil ditambahkan ke etalase toko Anda!');
      setActiveTab('products');
      setProdName('');
      setProdPrice('');
      setProdDesc('');
      setProdSku('');
      loadSellerData();
      setTimeout(() => setActionSuccess(''), 3000);
    } catch (err: any) {
      alert(err.message || 'Gagal menambahkan produk');
    } finally {
      setProdCreating(false);
    }
  };

  const handleUpdateStock = async (variantId: number, currentStock: number, delta: number) => {
    if (updatingVariantId !== null) return;
    const next = Math.max(0, currentStock + delta);
    setUpdatingVariantId(variantId);
    try {
      await api.updateSellerStock(variantId, next);
      setInventoryList((prev) =>
        prev.map((i) => (i.id === variantId ? { ...i, stock: next } : i))
      );
    } catch (err: any) {
      const msg = (err instanceof ApiError && err.getFirstValidationError()) || err.message || 'Gagal memperbarui stok';
      alert(msg);
    } finally {
      setUpdatingVariantId(null);
    }
  };

  const handleFulfillOrder = async (orderId: number, nextStatus: string) => {
    if (fulfillingOrderId !== null) return;
    setFulfillingOrderId(orderId);
    try {
      const trk = `PSR-EXP-${Math.floor(10000000 + Math.random() * 90000000)}`;
      await api.updateOrderStatus(orderId, nextStatus, trk, 'PASARIA Express Priority');
      setActionSuccess(`Pesanan #${orderId} berhasil diproses ke status: ${nextStatus}`);
      await loadSellerData();
      setTimeout(() => setActionSuccess(''), 3000);
    } catch (err: any) {
      const msg = (err instanceof ApiError && err.getFirstValidationError()) || err.message || 'Gagal memperbarui status pesanan';
      alert(msg);
    } finally {
      setFulfillingOrderId(null);
    }
  };

  const handleReplyReview = async (reviewId: number) => {
    const text = replyTextMap[reviewId];
    if (!text || !text.trim()) return;

    try {
      await api.replyReview(reviewId, text.trim());
      setActionSuccess('Balasan ulasan berhasil dipublikasikan!');
      setReplyTextMap((prev) => ({ ...prev, [reviewId]: '' }));
      await loadSellerData();
      setTimeout(() => setActionSuccess(''), 3000);
    } catch (err: any) {
      const msg = (err instanceof ApiError && err.getFirstValidationError()) || err.message || 'Gagal membalas ulasan';
      alert(msg);
    }
  };

  const handleRequestPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (payoutLoading) return;
    const amt = parseFloat(payoutAmount);
    if (!amt || amt <= 0) return;

    setPayoutLoading(true);
    try {
      await api.requestSellerPayout({
        amount: amt,
        bank_name: payoutBank,
        account_number: payoutAccountNo,
        account_holder: payoutHolder,
      });

      setActionSuccess(`Permintaan penarikan dana ${formatRupiah(amt)} berhasil diajukan.`);
      setPayoutAmount('');
      await loadSellerData();
      setTimeout(() => setActionSuccess(''), 3000);
    } catch (err: any) {
      const msg = (err instanceof ApiError && err.getFirstValidationError()) || err.message || 'Gagal mengajukan penarikan saldo';
      alert(msg);
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
              className="px-4 py-2 rounded-full border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Lihat Toko Publik</span>
            </button>
          )}
          <button
            onClick={onNavigateHome}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#003d29] hover:underline cursor-pointer"
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

      {/* Tabs for Seller Center */}
      {currentShop && (
        <div className="flex items-center gap-2 overflow-x-auto pb-3 border-b border-slate-100 text-xs">
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
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
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
        <div className="max-w-2xl mx-auto bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-2xs space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-[#003d29] flex items-center justify-center mx-auto font-black text-xl">
              <Store className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-black text-slate-900">Buka Toko Resmi di PASARIA</h2>
            <p className="text-xs text-slate-500">Mulai berjualan ke jutaan pembeli aktif dengan perlindungan escrow dan logistik resmi.</p>
          </div>

          <form onSubmit={handleRegisterShop} className="space-y-4 text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Nama Toko Online</label>
              <input
                type="text"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                placeholder="Contoh: Maju Audio Store"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#003d29]"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Slogan / Tagline Toko</label>
              <input
                type="text"
                value={shopTagline}
                onChange={(e) => setShopTagline(e.target.value)}
                placeholder="Contoh: Pusat Gadget & Audio Original Bergaransi"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#003d29]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Kota Domisili Toko</label>
              <input
                type="text"
                value={shopCity}
                onChange={(e) => setShopCity(e.target.value)}
                placeholder="Contoh: Jakarta Pusat"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#003d29]"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Nomor Kontak Toko</label>
              <input
                type="text"
                value={shopPhone}
                onChange={(e) => setShopPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#003d29]"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Deskripsi Toko</label>
              <textarea
                rows={3}
                value={shopDesc}
                onChange={(e) => setShopDesc(e.target.value)}
                placeholder="Jelaskan jenis produk yang Anda jual dan komitmen layanan toko Anda..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#003d29] leading-relaxed"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isRegistering}
                className="w-full py-3.5 rounded-full bg-[#003d29] hover:bg-[#064e3b] text-white font-bold text-xs transition-all shadow-md cursor-pointer disabled:opacity-40"
              >
                {isRegistering ? 'Mendaftarkan Toko...' : 'Buka Toko Sekarang'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && currentShop && (
        <div className="space-y-8">
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
                <span>{Number(currentShop.rating || 5).toFixed(1)}</span>
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              </div>
              <div className="text-[11px] text-emerald-700 font-medium mt-1">Sangat Baik</div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Products Catalog */}
      {activeTab === 'products' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">Daftar Produk Toko ({myProducts.length})</h3>
              <p className="text-xs text-slate-400">Produk yang sedang aktif ditampilkan di etalase pembeli PASARIA.</p>
            </div>
            <button
              onClick={() => setActiveTab('add_product')}
              className="px-4 py-2 rounded-full bg-[#003d29] hover:bg-[#064e3b] text-white text-xs font-bold transition-all cursor-pointer shadow-2xs flex items-center gap-1"
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
                    <div className="text-slate-400 text-[11px]">{p.category} · Stok: {p.stock}</div>
                    <div className="font-extrabold text-[#003d29] mt-0.5">{formatRupiah(p.price)}</div>
                  </div>
                </div>
                {onDeleteProduct && (
                  <button
                    onClick={() => onDeleteProduct(p.id)}
                    className="p-2 rounded-full hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
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
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs space-y-4">
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
                    <td className="py-3 px-4 font-bold text-slate-900">{inv.name || 'Produk Standar'}</td>
                    <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">{inv.sku || 'SKU-001'}</td>
                    <td className="py-3 px-4 font-bold text-[#003d29]">{formatRupiah(inv.price)}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        inv.stock < 5 ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-800'
                      }`}>
                        {inv.stock} Unit
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          disabled={updatingVariantId === inv.id}
                          onClick={() => handleUpdateStock(inv.id, inv.stock, -1)}
                          className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-bold text-slate-700 cursor-pointer disabled:opacity-40"
                        >
                          -
                        </button>
                        <button
                          type="button"
                          disabled={updatingVariantId === inv.id}
                          onClick={() => handleUpdateStock(inv.id, inv.stock, 5)}
                          className="px-2.5 h-7 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-[#003d29] font-bold text-[11px] cursor-pointer disabled:opacity-40"
                        >
                          +5
                        </button>
                        <button
                          type="button"
                          disabled={updatingVariantId === inv.id}
                          onClick={() => handleUpdateStock(inv.id, inv.stock, 20)}
                          className="px-2.5 h-7 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-[#003d29] font-bold text-[11px] cursor-pointer disabled:opacity-40"
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
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs space-y-4">
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
                      <span className="font-extrabold text-slate-900">Pesanan #{ord.order_number}</span>
                      <span className="text-slate-400 ml-2">· {formatDateTime(ord.created_at)}</span>
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
                        type="button"
                        disabled={fulfillingOrderId === ord.id}
                        onClick={() => handleFulfillOrder(ord.id, 'shipped')}
                        className="px-4 py-2 rounded-xl bg-[#003d29] hover:bg-[#064e3b] text-white font-bold text-xs cursor-pointer shadow-2xs disabled:opacity-50"
                      >
                        {fulfillingOrderId === ord.id ? 'Memproses Resi...' : 'Kirim Barang (Generate Resi)'}
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
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs space-y-4">
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
                  <span className="text-amber-500">★★★★★</span>
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
                  className="flex-1 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs"
                />
                <button
                  onClick={() => handleReplyReview(1)}
                  className="px-4 py-2 rounded-xl bg-[#003d29] text-white font-bold cursor-pointer"
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
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-2xs">
              <div className="text-slate-400 text-xs font-semibold mb-1">Saldo Tersedia untuk Ditarik</div>
              <div className="text-2xl font-black text-[#003d29] tabular-nums">
                {formatRupiah(financesData?.available_balance || 14500000)}
              </div>
              <div className="text-[11px] text-emerald-700 font-medium mt-1">Siap Masuk Rekening</div>
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

          {/* Request Payout Form */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-2xs space-y-4 max-w-xl text-xs">
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <Wallet className="w-4 h-4 text-[#003d29]" />
              Ajukan Penarikan Dana (Payout)
            </h3>

            <form onSubmit={handleRequestPayout} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Nominal Penarikan (Rp)</label>
                <input
                  type="number"
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  placeholder="Contoh: 1000000"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-bold tabular-nums"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Bank Tujuan</label>
                  <select
                    value={payoutBank}
                    onChange={(e) => setPayoutBank(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="BCA">Bank BCA</option>
                    <option value="Mandiri">Bank Mandiri</option>
                    <option value="BRI">Bank BRI</option>
                    <option value="BNI">Bank BNI</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Nomor Rekening</label>
                  <input
                    type="text"
                    value={payoutAccountNo}
                    onChange={(e) => setPayoutAccountNo(e.target.value)}
                    placeholder="Contoh: 8830192841"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Nama Pemilik Rekening</label>
                <input
                  type="text"
                  value={payoutHolder}
                  onChange={(e) => setPayoutHolder(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200"
                  required
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={payoutLoading}
                  className="w-full py-3 rounded-full bg-[#003d29] hover:bg-[#064e3b] text-white font-bold transition-all cursor-pointer shadow-2xs disabled:opacity-40"
                >
                  {payoutLoading ? 'Memproses...' : 'Kirim Pengajuan Penarikan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tab 7: Add Product */}
      {activeTab === 'add_product' && (
        <div className="max-w-2xl bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-2xs space-y-6 text-xs">
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm">Tambah Produk Baru ke Etalase</h3>
            <p className="text-slate-400 text-xs mt-0.5">Lengkapi spesifikasi produk dan varian stok barang.</p>
          </div>

          <form onSubmit={handleCreateProduct} className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Nama Produk</label>
              <input
                type="text"
                value={prodName}
                onChange={(e) => setProdName(e.target.value)}
                placeholder="Contoh: AirPods Max Wireless Headphone Space Gray"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#003d29]"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Kategori</label>
                <select
                  value={prodCategory}
                  onChange={(e) => setProdCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white"
                >
                  <option value="Headphones">Headphones</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Shoes">Shoes</option>
                  <option value="Bags">Bags</option>
                  <option value="Books">Books</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Harga Jual (Rp)</label>
                <input
                  type="number"
                  value={prodPrice}
                  onChange={(e) => setProdPrice(e.target.value)}
                  placeholder="Contoh: 1250000"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-bold tabular-nums"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Varian Nama</label>
                <input
                  type="text"
                  value={prodVariantName}
                  onChange={(e) => setProdVariantName(e.target.value)}
                  placeholder="Contoh: Standard Edition"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Jumlah Stok Awal</label>
                <input
                  type="number"
                  value={prodStock}
                  onChange={(e) => setProdStock(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-bold tabular-nums"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Deskripsi Lengkap Produk</label>
              <textarea
                rows={3}
                value={prodDesc}
                onChange={(e) => setProdDesc(e.target.value)}
                placeholder="Jelaskan fitur unggulan, kelengkapan boks, dan keaslian produk..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#003d29] leading-relaxed"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={prodCreating}
                className="w-full py-3.5 rounded-full bg-[#003d29] hover:bg-[#064e3b] text-white font-bold text-xs transition-all shadow-md cursor-pointer disabled:opacity-40"
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
