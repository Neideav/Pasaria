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
  const [reportsList, setReportsList] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState('');

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
    if (activeTab === 'reports') loadReports();
    if (activeTab === 'audit') loadAuditLogs();
  }, [activeTab]);

  const handleToggleUser = async (userId: number, currentStatus: string) => {
    const nextStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
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
    try {
      await api.approveSeller(shopId, status);
      const msg = `Toko #${shopId} berhasil di-${status === 'approved' ? 'setujui' : 'tolak'}`;
      setActionMsg(msg);
      showToast(msg, 'success');
      loadDashboard();
      setTimeout(() => setActionMsg(''), 3000);
    } catch (e: any) {
      showToast(e.message || 'Gagal memperbarui status seller', 'error');
    }
  };

  const handleModerateReview = async (reviewId: number, status: 'approved' | 'hidden' | 'active') => {
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
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#003d29] hover:underline cursor-pointer"
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

      {/* Admin Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 border-b border-slate-100 text-xs">
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

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-2xs">
              <div className="text-slate-400 text-xs font-semibold mb-1">Total Transaksi (GMV)</div>
              <div className="text-xl font-extrabold text-[#003d29] tabular-nums">
                {formatRupiah(metrics?.total_revenue || 0)}
              </div>
              <div className="text-[11px] text-emerald-700 font-medium mt-1">Platform Multi-Vendor</div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-2xs">
              <div className="text-slate-400 text-xs font-semibold mb-1">Total Pesanan</div>
              <div className="text-xl font-extrabold text-slate-900 tabular-nums">
                {metrics?.total_orders || 0}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Pesanan Terverifikasi</div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-2xs">
              <div className="text-slate-400 text-xs font-semibold mb-1">Pengguna Terdaftar</div>
              <div className="text-xl font-extrabold text-slate-900 tabular-nums">
                {metrics?.total_users || 0}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Customer & Seller</div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-2xs">
              <div className="text-slate-400 text-xs font-semibold mb-1">Toko Aktif</div>
              <div className="text-xl font-extrabold text-slate-900 tabular-nums">
                {metrics?.total_sellers || 0}
              </div>
              <div className="text-[11px] text-emerald-700 font-medium mt-1">Official Merchant</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-2xs space-y-4">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <Store className="w-4 h-4 text-[#003d29]" />
                Antrean Verifikasi Toko
              </h3>
              <p className="text-xs text-slate-500">
                Ada {metrics?.pending_sellers || 0} toko baru menunggu tinjauan dokumen identitas dan izin usaha.
              </p>
              <button
                onClick={() => setActiveTab('sellers')}
                className="w-full py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#003d29] text-xs font-bold transition-colors cursor-pointer"
              >
                Tinjau Pengajuan Seller
              </button>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-2xs space-y-4">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-rose-600" />
                Sengketa Retur & Komplain
              </h3>
              <p className="text-xs text-slate-500">
                Terdapat {metrics?.pending_returns || 0} pengajuan retur yang perlu diputuskan antara pembeli dan penjual.
              </p>
              <button
                onClick={() => setActiveTab('disputes')}
                className="w-full py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-colors cursor-pointer"
              >
                Buka Pusat Resolusi
              </button>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-2xs space-y-4">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-600" />
                Moderasi Ulasan
              </h3>
              <p className="text-xs text-slate-500">
                {metrics?.total_reviews || 0} ulasan produk terpublikasi. Pantau ulasan yang dilaporkan pengguna.
              </p>
              <button
                onClick={() => setActiveTab('reviews')}
                className="w-full py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold transition-colors cursor-pointer"
              >
                Moderasi Ulasan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Users Management */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-extrabold text-slate-900 text-sm">Daftar Pengguna Platform</h3>
            <span className="text-xs text-slate-500">{usersList.length} Pengguna Terdaftar</span>
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
                {usersList.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50">
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
                          className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition-colors ${
                            u.status === 'suspended'
                              ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                              : 'bg-rose-50 hover:bg-rose-100 text-rose-600'
                          }`}
                        >
                          {u.status === 'suspended' ? 'Aktifkan Kembali' : 'Bekukan Akun'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Sellers Verification */}
      {activeTab === 'sellers' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-extrabold text-slate-900 text-sm">Pengajuan Verifikasi Seller & Merchant</h3>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60 flex items-center justify-between gap-4">
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
                  className="px-4 py-2 rounded-xl bg-[#003d29] hover:bg-[#064e3b] text-white text-xs font-bold transition-all cursor-pointer"
                >
                  Setujui
                </button>
                <button
                  onClick={() => handleApproveSeller(1, 'rejected')}
                  className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold transition-all cursor-pointer"
                >
                  Tolak
                </button>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60 flex items-center justify-between gap-4">
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
                  className="px-4 py-2 rounded-xl bg-[#003d29] hover:bg-[#064e3b] text-white text-xs font-bold transition-all cursor-pointer"
                >
                  Setujui
                </button>
                <button
                  onClick={() => handleApproveSeller(2, 'rejected')}
                  className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold transition-all cursor-pointer"
                >
                  Tolak
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Review Moderation */}
      {activeTab === 'reviews' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-extrabold text-slate-900 text-sm">Daftar & Moderasi Ulasan</h3>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60 flex items-start justify-between gap-4 text-xs">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-slate-900">Pembeli Terverifikasi (Order #9945284820)</span>
                <span className="text-amber-500 font-bold">★★★★★ (5.0)</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                "Kualitas suara AirPods Max original luar biasa, pengiriman cepat 1 hari sampai dan packaging aman banget dengan bubble tebal."
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => handleModerateReview(1, 'active')}
                className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold cursor-pointer"
              >
                Setujui
              </button>
              <button
                onClick={() => handleModerateReview(1, 'hidden')}
                className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-semibold cursor-pointer"
              >
                Sembunyikan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Disputes */}
      {activeTab === 'disputes' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-extrabold text-slate-900 text-sm">Pusat Sengketa Retur & Komplain Pembeli</h3>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900">Sengketa #1 · Pesanan #ORD-9945284820</span>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 font-bold text-[10px]">
                Menunggu Putusan Admin
              </span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Alasan: Barang mengalami cacat visual saat kurir menyerahkan paket. Pembeli meminta pengembalian dana penuh.
            </p>
            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200/50">
              <button
                onClick={() => handleResolveDispute(1, 'refund_buyer')}
                className="px-4 py-2 rounded-xl bg-[#003d29] hover:bg-[#064e3b] text-white font-bold cursor-pointer"
              >
                Kabulkan Pengembalian Dana Pembeli
              </button>
              <button
                onClick={() => handleResolveDispute(1, 'reject_claim')}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold cursor-pointer"
              >
                Tolak Komplain
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 6: Reports */}
      {activeTab === 'reports' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-2xs">
          <h3 className="font-extrabold text-slate-900 text-sm mb-4">Laporan Indikasi Pelanggaran</h3>
          <div className="py-12 text-center text-xs text-slate-400">
            Tidak ada laporan pelanggaran aktif saat ini. Platform berjalan tertib.
          </div>
        </div>
      )}

      {/* Tab 7: Audit Logs */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-2xs">
          <h3 className="font-extrabold text-slate-900 text-sm mb-4">Riwayat Log Audit Administrator</h3>
          <div className="space-y-3 text-xs">
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
          </div>
        </div>
      )}
    </div>
  );
};
