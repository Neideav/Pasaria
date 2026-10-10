import React, { useState, useEffect } from 'react';
import {
  Shield,
  Users,
  Store,
  Package,
  ShoppingBag,
  DollarSign,
  AlertTriangle,
  RotateCcw,
  CheckCircle,
  XCircle,
  FileText,
  Activity,
  ArrowLeft,
  Search,
  Check,
  Eye,
  Clock
} from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { formatRupiah, formatDateTime } from '../utils/formatters';

interface AdminDashboardViewProps {
  onNavigateHome: () => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  onNavigateHome,
}) => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'sellers' | 'reviews' | 'disputes' | 'reports' | 'audit'>('overview');
  const [metrics, setMetrics] = useState<any>(null);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [sellersList, setSellersList] = useState<any[]>([]);
  const [reportsList, setReportsList] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState('');
  const [flashAction, setFlashAction] = useState<{ id: string | number; type: 'success' | 'danger' } | null>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const data = await api.getAdminDashboard();
      setMetrics(data.metrics || null);
    } catch (e) {
      console.warn('Load admin dashboard note:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const data = await api.getAdminUsers();
      setUsersList(data || []);
    } catch (e) {
      console.warn('Load users note:', e);
    }
  };

  const loadSellers = async () => {
    try {
      const data = await api.getAdminSellers();
      setSellersList(data || []);
    } catch (e) {
      console.warn('Load sellers note:', e);
    }
  };

  const loadReports = async () => {
    try {
      const data = await api.getAdminReports();
      setReportsList(data || []);
    } catch (e) {
      console.warn('Load reports note:', e);
    }
  };

  const loadAuditLogs = async () => {
    try {
      const data = await api.getAdminAuditLogs();
      setAuditLogs(data || []);
    } catch (e) {
      console.warn('Load audit note:', e);
    }
  };

  useEffect(() => {
    if (activeTab === 'users') loadUsers();
    if (activeTab === 'sellers') loadSellers();
    if (activeTab === 'reports') loadReports();
    if (activeTab === 'audit') loadAuditLogs();
  }, [activeTab]);

  const handleToggleUser = async (userId: number, currentStatus: string) => {
    const nextStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
    setFlashAction({ id: `user-${userId}`, type: nextStatus === 'active' ? 'success' : 'danger' });
    setTimeout(() => setFlashAction(null), 400);

    try {
      await api.toggleUserStatus(userId, nextStatus);
      const msg = `Status pengguna #${userId} berhasil diubah ke ${nextStatus}`;
      setActionMsg(msg);
      showToast(msg, 'success');
      loadUsers();
      setTimeout(() => setActionMsg(''), 3000);
    } catch (e: any) {
      showToast(e.message || 'Gagal mengubah status pengguna', 'error');
    }
  };

  const handleApproveSeller = async (shopId: number, status: 'approved' | 'rejected') => {
    setFlashAction({ id: shopId, type: status === 'approved' ? 'success' : 'danger' });
    setTimeout(() => setFlashAction(null), 400);

    try {
      await api.approveSeller(shopId, status);
      const msg = `Toko #${shopId} berhasil di-${status === 'approved' ? 'setujui' : 'tolak'}`;
      setActionMsg(msg);
      showToast(msg, 'success');
      loadDashboard();
      loadSellers();
      setTimeout(() => setActionMsg(''), 3000);
    } catch (e: any) {
      showToast(e.message || 'Gagal memperbarui status seller', 'error');
    }
  };

  const handleModerateReview = async (reviewId: number, status: 'approved' | 'hidden' | 'active') => {
    setFlashAction({ id: `review-${reviewId}`, type: status === 'approved' || status === 'active' ? 'success' : 'danger' });
    setTimeout(() => setFlashAction(null), 400);

    try {
      await api.moderateReview(reviewId, status);
      const msg = `Ulasan #${reviewId} telah diatur ke status ${status}`;
      setActionMsg(msg);
      showToast(msg, 'success');
      loadDashboard();
      setTimeout(() => setActionMsg(''), 3000);
    } catch (e: any) {
      showToast(e.message || 'Gagal memoderasi ulasan', 'error');
    }
  };

  const handleResolveDispute = async (disputeId: number, resolution: string) => {
    setFlashAction({ id: `dispute-${disputeId}`, type: resolution === 'refund_buyer' ? 'success' : 'danger' });
    setTimeout(() => setFlashAction(null), 400);

    try {
      await api.resolveDispute(disputeId, resolution, 'Keputusan oleh Tim Resolusi PASARIA');
      const msg = `Sengketa #${disputeId} berhasil diselesaikan (${resolution})`;
      setActionMsg(msg);
      showToast(msg, 'success');
      loadDashboard();
      setTimeout(() => setActionMsg(''), 3000);
    } catch (e: any) {
      showToast(e.message || 'Gagal menyelesaikan sengketa', 'error');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 text-left">
      {/* Admin Header */}
      <div className="flex items-center justify-between pb-6 border-b border-slate-200/80 mb-6">
        <div>
          <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs uppercase tracking-wider mb-1">
            <Shield className="w-4 h-4 text-emerald-700" />
            <span>Pusat Kendali Platform</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            PASARIA Administrator Portal
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manajemen operasional marketplace, verifikasi seller, moderasi konten, dan resolusi sengketa.
          </p>
        </div>

        <button
          onClick={onNavigateHome}
          aria-label="Kembali ke Toko Utama PASARIA"
          className="min-h-[44px] inline-flex items-center gap-1.5 text-xs font-semibold text-[#003d29] hover:underline cursor-pointer px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#003d29] motion-press active:scale-[0.96]"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Toko Utama</span>
        </button>
      </div>

      {actionMsg && (
        <div className="mb-6 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4" />
          <span>{actionMsg}</span>
        </div>
      )}

      {/* Admin Navigation Tabs (Motion Point #51) */}
      <div
        role="tablist"
        aria-label="Navigasi Menu Admin"
        className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 border-b border-slate-100 text-xs"
      >
        {[
          { id: 'overview', label: 'Ringkasan & Metrik', icon: Activity },
          { id: 'users', label: 'Manajemen Pengguna', icon: Users },
          { id: 'sellers', label: 'Verifikasi Seller', icon: Store },
          { id: 'reviews', label: 'Moderasi Ulasan', icon: FileText },
          { id: 'disputes', label: 'Pusat Sengketa Retur', icon: RotateCcw },
          { id: 'reports', label: 'Laporan Pengaduan', icon: AlertTriangle },
          { id: 'audit', label: 'Log Audit Admin', icon: Clock },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`admin-tab-${tab.id}`}
              role="tab"
              aria-selected={isActive}
              aria-controls={`admin-panel-${tab.id}`}
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

      {/* Tab 1: Overview (Motion Point #51: Tab Crossfade & Stat Card Hover) */}
      {activeTab === 'overview' && (
        <div
          id="admin-panel-overview"
          role="tabpanel"
          aria-labelledby="admin-tab-overview"
          tabIndex={0}
          className="motion-tab-pane space-y-8 focus:outline-none"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-2xs hover:-translate-y-1 hover:shadow-md transition-[transform,box-shadow] duration-200 cursor-default">
              <div className="text-slate-400 text-xs font-semibold mb-1">Total Pendapatan (GMV)</div>
              <div className="text-xl font-extrabold text-[#003d29] tabular-nums">
                {formatRupiah(metrics?.total_revenue || 0)}
              </div>
              <div className="text-[11px] text-emerald-700 font-medium mt-1">Platform Multi-Vendor</div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-2xs hover:-translate-y-1 hover:shadow-md transition-[transform,box-shadow] duration-200 cursor-default">
              <div className="text-slate-400 text-xs font-semibold mb-1">Total Transaksi</div>
              <div className="text-xl font-extrabold text-slate-900 tabular-nums">
                {metrics?.total_orders || 0}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Pesanan Terverifikasi</div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-2xs hover:-translate-y-1 hover:shadow-md transition-[transform,box-shadow] duration-200 cursor-default">
              <div className="text-slate-400 text-xs font-semibold mb-1">Pengguna Aktif</div>
              <div className="text-xl font-extrabold text-slate-900 tabular-nums">
                {metrics?.total_users || 0}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Customer & Seller</div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-2xs hover:-translate-y-1 hover:shadow-md transition-[transform,box-shadow] duration-200 cursor-default">
              <div className="text-slate-400 text-xs font-semibold mb-1">Seller Terdaftar</div>
              <div className="text-xl font-extrabold text-slate-900 tabular-nums">
                {metrics?.total_sellers || 0}
              </div>
              <div className="text-[11px] text-emerald-700 font-medium mt-1">Official Merchant</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-2xs space-y-4 hover:-translate-y-1 hover:shadow-md transition-[transform,box-shadow] duration-200">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <Store className="w-4 h-4 text-[#003d29]" />
                Antrean Verifikasi Toko
              </h3>
              <p className="text-xs text-slate-500">
                Ada <span className="tabular-nums font-bold text-slate-800">{metrics?.pending_sellers || 0}</span> toko baru menunggu tinjauan dokumen identitas dan izin usaha.
              </p>
              <button
                onClick={() => setActiveTab('sellers')}
                aria-label="Tinjau antrean pengajuan pendaftaran seller baru"
                className="w-full min-h-[44px] py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#003d29] text-xs font-bold transition-colors cursor-pointer inline-flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-[#003d29] motion-press active:scale-[0.96]"
              >
                Tinjau Pengajuan Seller
              </button>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-2xs space-y-4 hover:-translate-y-1 hover:shadow-md transition-[transform,box-shadow] duration-200">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-rose-600" />
                Sengketa Retur & Komplain
              </h3>
              <p className="text-xs text-slate-500">
                Terdapat <span className="tabular-nums font-bold text-slate-800">{metrics?.pending_returns || 0}</span> pengajuan retur yang perlu diputuskan antara pembeli dan penjual.
              </p>
              <button
                onClick={() => setActiveTab('disputes')}
                aria-label="Buka pusat resolusi sengketa dan komplain retur barang"
                className="w-full min-h-[44px] py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-colors cursor-pointer inline-flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-rose-600 motion-press active:scale-[0.96]"
              >
                Buka Pusat Resolusi
              </button>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-2xs space-y-4 hover:-translate-y-1 hover:shadow-md transition-[transform,box-shadow] duration-200">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-600" />
                Moderasi Ulasan
              </h3>
              <p className="text-xs text-slate-500">
                <span className="tabular-nums font-bold text-slate-800">{metrics?.total_reviews || 0}</span> ulasan produk terpublikasi. Pantau ulasan yang dilaporkan pengguna.
              </p>
              <button
                onClick={() => setActiveTab('reviews')}
                aria-label="Buka daftar ulasan untuk proses moderasi"
                className="w-full min-h-[44px] py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold transition-colors cursor-pointer inline-flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-amber-600 motion-press active:scale-[0.96]"
              >
                Moderasi Ulasan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Users Management (Motion Point #51 & #52) */}
      {activeTab === 'users' && (
        <div
          id="admin-panel-users"
          role="tabpanel"
          aria-labelledby="admin-tab-users"
          tabIndex={0}
          className="motion-tab-pane bg-white rounded-3xl p-6 border border-slate-100 shadow-2xs focus:outline-none"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-extrabold text-slate-900 text-sm">Daftar Pengguna Platform</h3>
            <span className="text-xs text-slate-500 tabular-nums">{usersList.length} Pengguna Terdaftar</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Nama</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Peran (Role)</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {usersList.map((u) => {
                  const isFlashed = flashAction && flashAction.id === `user-${u.id}`;
                  return (
                    <tr
                      key={u.id}
                      className={`transition-colors duration-200 ${
                        isFlashed
                          ? flashAction.type === 'success'
                            ? 'bg-emerald-50/70'
                            : 'bg-rose-50/70'
                          : 'hover:bg-slate-50/50'
                      }`}
                    >
                      <td className="py-3.5 px-4 font-bold text-slate-900">{u.name}</td>
                      <td className="py-3.5 px-4 text-slate-600">{u.email}</td>
                      <td className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[11px] text-[#003d29]">
                        {u.role}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          u.status === 'suspended' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-700'
                        }`}>
                          {u.status || 'active'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {u.role !== 'admin' && (
                          <button
                            onClick={() => handleToggleUser(u.id, u.status || 'active')}
                            aria-label={`${u.status === 'suspended' ? 'Aktifkan kembali akun' : 'Tangguhkan akun'} ${u.name}`}
                            className={`min-h-[40px] px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors inline-flex items-center justify-center focus:outline-none focus:ring-2 motion-press active:scale-[0.96] ${
                              u.status === 'suspended'
                                ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 focus:ring-emerald-600'
                                : 'bg-rose-50 hover:bg-rose-100 text-rose-600 focus:ring-rose-600'
                            }`}
                          >
                            {u.status === 'suspended' ? 'Aktifkan Kembali' : 'Bekukan Akun'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Sellers Verification (Motion Point #51 & #52: Seller Moderation Action Approval/Rejection Flash) */}
      {activeTab === 'sellers' && (
        <div
          id="admin-panel-sellers"
          role="tabpanel"
          aria-labelledby="admin-tab-sellers"
          tabIndex={0}
          className="motion-tab-pane bg-white rounded-3xl p-6 border border-slate-100 shadow-2xs space-y-4 focus:outline-none"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-extrabold text-slate-900 text-sm">Pengajuan Verifikasi Seller & Merchant</h3>
            <span className="text-xs text-slate-500 tabular-nums">
              {sellersList.length > 0 ? `${sellersList.length} Seller Terdaftar` : '2 Antrean Toko'}
            </span>
          </div>

          <div className="space-y-4">
            {sellersList.length > 0 ? (
              sellersList.map((s) => {
                const isFlashed = flashAction && flashAction.id === s.id;
                return (
                  <div
                    key={s.id}
                    className={`p-4 rounded-2xl border border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors duration-200 ${
                      isFlashed
                        ? flashAction.type === 'success'
                          ? 'bg-emerald-50/70'
                          : 'bg-rose-50/70'
                        : 'bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center font-extrabold text-[#003d29]">
                        {(s.name || 'PA').slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{s.name}</h4>
                        <p className="text-xs text-slate-500">
                          {s.city || 'Indonesia'} · {s.user?.email || 'Seller Resmi'} · <span className="tabular-nums font-semibold">{s.products_count ?? 0}</span> Produk
                        </p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 inline-block ${
                          s.verified || s.status === 'approved' ? 'text-emerald-700 bg-emerald-50' : 'text-amber-700 bg-amber-50'
                        }`}>
                          {s.verified || s.status === 'approved' ? 'Official Store Terverifikasi' : 'Menunggu Verifikasi'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleApproveSeller(s.id, 'approved')}
                        aria-label={`Setujui pendaftaran toko ${s.name}`}
                        className="min-h-[44px] px-4 py-2 rounded-xl bg-[#003d29] hover:bg-[#064e3b] text-white text-xs font-bold transition-all cursor-pointer inline-flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-[#003d29] motion-press active:scale-[0.96]"
                      >
                        Setujui Toko
                      </button>
                      <button
                        onClick={() => handleApproveSeller(s.id, 'rejected')}
                        aria-label={`Tolak pendaftaran toko ${s.name}`}
                        className="min-h-[44px] px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold transition-all cursor-pointer inline-flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-rose-600 motion-press active:scale-[0.96]"
                      >
                        Tolak Toko
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <>
                <div
                  className={`p-4 rounded-2xl border border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors duration-200 ${
                    flashAction && flashAction.id === 1
                      ? flashAction.type === 'success'
                        ? 'bg-emerald-50/70'
                        : 'bg-rose-50/70'
                      : 'bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center font-extrabold text-[#003d29]">
                      PA
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">PASARIA Audio Official</h4>
                      <p className="text-xs text-slate-500">Jakarta Pusat · Dokumen SIUP & KTP Terunggah</p>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full mt-1 inline-block">
                        Official Store Terverifikasi
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleApproveSeller(1, 'approved')}
                      aria-label="Setujui pendaftaran toko PASARIA Audio Official"
                      className="min-h-[44px] px-4 py-2 rounded-xl bg-[#003d29] hover:bg-[#064e3b] text-white text-xs font-bold transition-all cursor-pointer inline-flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-[#003d29] motion-press active:scale-[0.96]"
                    >
                      Setujui Toko
                    </button>
                    <button
                      onClick={() => handleApproveSeller(1, 'rejected')}
                      aria-label="Tolak pendaftaran toko PASARIA Audio Official"
                      className="min-h-[44px] px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold transition-all cursor-pointer inline-flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-rose-600 motion-press active:scale-[0.96]"
                    >
                      Tolak Toko
                    </button>
                  </div>
                </div>

                <div
                  className={`p-4 rounded-2xl border border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors duration-200 ${
                    flashAction && flashAction.id === 2
                      ? flashAction.type === 'success'
                        ? 'bg-emerald-50/70'
                        : 'bg-rose-50/70'
                      : 'bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center font-extrabold text-[#003d29]">
                      NG
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">NextGen Soundworks</h4>
                      <p className="text-xs text-slate-500">Surabaya · Seller Perorangan</p>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full mt-1 inline-block">
                        Official Store Terverifikasi
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleApproveSeller(2, 'approved')}
                      aria-label="Setujui pendaftaran toko NextGen Soundworks"
                      className="min-h-[44px] px-4 py-2 rounded-xl bg-[#003d29] hover:bg-[#064e3b] text-white text-xs font-bold transition-all cursor-pointer inline-flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-[#003d29] motion-press active:scale-[0.96]"
                    >
                      Setujui Toko
                    </button>
                    <button
                      onClick={() => handleApproveSeller(2, 'rejected')}
                      aria-label="Tolak pendaftaran toko NextGen Soundworks"
                      className="min-h-[44px] px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold transition-all cursor-pointer inline-flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-rose-600 motion-press active:scale-[0.96]"
                    >
                      Tolak Toko
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Review Moderation (Motion Point #51 & #52) */}
      {activeTab === 'reviews' && (
        <div
          id="admin-panel-reviews"
          role="tabpanel"
          aria-labelledby="admin-tab-reviews"
          tabIndex={0}
          className="motion-tab-pane bg-white rounded-3xl p-6 border border-slate-100 shadow-2xs space-y-4 focus:outline-none"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-extrabold text-slate-900 text-sm">Daftar & Moderasi Ulasan</h3>
          </div>
          <div
            className={`p-4 rounded-2xl border border-slate-200/60 flex flex-col sm:flex-row sm:items-start justify-between gap-4 text-xs transition-colors duration-200 ${
              flashAction && flashAction.id === 'review-1'
                ? flashAction.type === 'success'
                  ? 'bg-emerald-50/70'
                  : 'bg-rose-50/70'
                : 'bg-slate-50'
            }`}
          >
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-slate-900">Pembeli Terverifikasi (Order #<span className="tabular-nums">9945284820</span>)</span>
                <span className="text-amber-500 font-bold tabular-nums">★★★★★ (5.0)</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                "Kualitas suara AirPods Max original luar biasa, pengiriman cepat 1 hari sampai dan packaging aman banget dengan bubble tebal."
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => handleModerateReview(1, 'active')}
                aria-label="Setujui ulasan pembeli order 9945284820"
                className="min-h-[40px] px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold cursor-pointer inline-flex items-center justify-center text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600 motion-press active:scale-[0.96]"
              >
                Setujui
              </button>
              <button
                onClick={() => handleModerateReview(1, 'hidden')}
                aria-label="Sembunyikan ulasan pembeli order 9945284820"
                className="min-h-[40px] px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-semibold cursor-pointer inline-flex items-center justify-center text-xs focus:outline-none focus:ring-2 focus:ring-rose-600 motion-press active:scale-[0.96]"
              >
                Sembunyikan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Disputes (Motion Point #51 & #52) */}
      {activeTab === 'disputes' && (
        <div
          id="admin-panel-disputes"
          role="tabpanel"
          aria-labelledby="admin-tab-disputes"
          tabIndex={0}
          className="motion-tab-pane bg-white rounded-3xl p-6 border border-slate-100 shadow-2xs space-y-4 focus:outline-none"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-extrabold text-slate-900 text-sm">Pusat Sengketa Retur & Komplain Pembeli</h3>
          </div>
          <div
            className={`p-4 rounded-2xl border border-slate-200/60 space-y-3 text-xs transition-colors duration-200 ${
              flashAction && flashAction.id === 'dispute-1'
                ? flashAction.type === 'success'
                  ? 'bg-emerald-50/70'
                  : 'bg-rose-50/70'
                : 'bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900">
                Sengketa #<span className="tabular-nums">1</span> · Pesanan #<span className="tabular-nums">ORD-9945284820</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 font-bold text-[10px]">
                Menunggu Putusan Admin
              </span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Alasan: Barang mengalami cacat visual saat kurir menyerahkan paket. Pembeli meminta pengembalian dana penuh.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-end gap-2 border-t border-slate-200/50">
              <button
                onClick={() => handleResolveDispute(1, 'refund_buyer')}
                aria-label="Kabulkan pengembalian dana pembeli untuk sengketa nomor 1"
                className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#003d29] hover:bg-[#064e3b] text-white font-bold cursor-pointer inline-flex items-center justify-center text-xs focus:outline-none focus:ring-2 focus:ring-[#003d29] motion-press active:scale-[0.96]"
              >
                Kabulkan Pengembalian Dana Pembeli
              </button>
              <button
                onClick={() => handleResolveDispute(1, 'reject_claim')}
                aria-label="Tolak komplain retur untuk sengketa nomor 1"
                className="min-h-[44px] px-4 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold cursor-pointer inline-flex items-center justify-center text-xs focus:outline-none focus:ring-2 focus:ring-slate-400 motion-press active:scale-[0.96]"
              >
                Tolak Komplain
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 6: Reports */}
      {activeTab === 'reports' && (
        <div
          id="admin-panel-reports"
          role="tabpanel"
          aria-labelledby="admin-tab-reports"
          tabIndex={0}
          className="motion-tab-pane bg-white rounded-3xl p-6 border border-slate-100 shadow-2xs focus:outline-none"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-extrabold text-slate-900 text-sm">Laporan Indikasi Pelanggaran</h3>
            <span className="text-xs text-slate-500 tabular-nums">{reportsList.length} Laporan</span>
          </div>
          {reportsList.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              Tidak ada laporan pelanggaran aktif saat ini. Platform berjalan tertib.
            </div>
          ) : (
            <div className="space-y-3">
              {reportsList.map((rep) => (
                <div key={rep.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900">{rep.reason || 'Laporan Pengguna'}</span>
                    <span className="text-slate-500 ml-2">{rep.details || 'Menunggu verifikasi admin'}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700">{rep.status || 'pending'}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 7: Audit Logs */}
      {activeTab === 'audit' && (
        <div
          id="admin-panel-audit"
          role="tabpanel"
          aria-labelledby="admin-tab-audit"
          tabIndex={0}
          className="motion-tab-pane bg-white rounded-3xl p-6 border border-slate-100 shadow-2xs focus:outline-none"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-extrabold text-slate-900 text-sm">Riwayat Log Audit Administrator</h3>
            <span className="text-xs text-slate-500 tabular-nums">
              {auditLogs.length > 0 ? `${auditLogs.length} Entri Tercatat` : '2 Entri Tercatat'}
            </span>
          </div>
          <div className="space-y-3 text-xs">
            {auditLogs.length > 0 ? (
              auditLogs.map((log) => (
                <div key={log.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900">{log.user?.name || 'Admin'}</span>
                    <span className="text-slate-500 ml-2">
                      {log.action}: {typeof log.details_json === 'string' ? log.details_json : JSON.stringify(log.details_json || {})}
                    </span>
                  </div>
                  <span className="text-slate-400 text-[11px] tabular-nums">{formatDateTime(log.created_at)}</span>
                </div>
              ))
            ) : (
              <>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900">Admin Utama</span>
                    <span className="text-slate-500 ml-2">Melakukan verifikasi resmi merchant toko PASARIA Audio</span>
                  </div>
                  <span className="text-slate-400 text-[11px]">Tercatat di MariaDB</span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900">Admin Utama</span>
                    <span className="text-slate-500 ml-2">Mempublikasikan katalog produk & voucher PASARIA50</span>
                  </div>
                  <span className="text-slate-400 text-[11px]">Tercatat di MariaDB</span>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
