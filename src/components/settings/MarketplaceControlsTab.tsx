import React, { useState, useEffect } from 'react';
import {
  Store,
  Bell,
  BellOff,
  UserX,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
  Eye,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { Shop, UserPrivacyPreferences } from '../../types';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';

interface MarketplaceControlsTabProps {
  onNavigateShop?: (shopIdOrSlug: string | number) => void;
}

export const MarketplaceControlsTab: React.FC<MarketplaceControlsTabProps> = ({
  onNavigateShop,
}) => {
  const { showToast } = useToast();

  const [shops, setShops] = useState<Shop[]>([]);
  const [privacyPrefs, setPrivacyPrefs] = useState<UserPrivacyPreferences>({
    personalization_enabled: true,
    marketing_communication: false,
    activity_logging: true,
    default_anonymous_reviews: false,
    show_profile_publicly: true,
  });

  const [loading, setLoading] = useState(true);
  const [busyShopId, setBusyShopId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [savingPrivacy, setSavingPrivacy] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const [followingData, privacyData] = await Promise.all([
        api.getFollowingShops(),
        api.getPrivacyPreferences(),
      ]);
      setShops(followingData || []);
      if (privacyData) {
        setPrivacyPrefs(privacyData);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal memuat interaksi toko.');
    } finally {
      setLoading(false);
    }
  };

  const handleUnfollow = async (shopId: number, shopName: string) => {
    if (!window.confirm(`Berhenti mengikuti toko "${shopName}"?`)) {
      return;
    }

    setBusyShopId(shopId);
    try {
      await api.unfollowShop(shopId);
      setShops((prev) => prev.filter((s) => s.id !== shopId));
      showToast(`Berhasil berhenti mengikuti toko "${shopName}".`, 'info');
    } catch (err: any) {
      showToast(err.message || 'Gagal berhenti mengikuti toko.', 'error');
    } finally {
      setBusyShopId(null);
    }
  };

  const handleToggleShopAlert = async (shopId: number, currentVal: boolean) => {
    setBusyShopId(shopId);
    const newVal = !currentVal;
    try {
      await api.updateFollowPreferences(shopId, newVal);
      setShops((prev) =>
        prev.map((s) => {
          if (s.id === shopId) {
            return {
              ...s,
              notify_new_products: newVal,
            };
          }
          return s;
        })
      );
      showToast(
        newVal ? 'Notifikasi produk baru dari toko ini diaktifkan.' : 'Notifikasi produk baru dimatikan.',
        'info'
      );
    } catch (err: any) {
      showToast(err.message || 'Gagal mengubah preferensi notifikasi toko.', 'error');
    } finally {
      setBusyShopId(null);
    }
  };

  const handlePrivacyToggle = async (key: 'default_anonymous_reviews' | 'show_profile_publicly') => {
    const updatedVal = !privacyPrefs[key];
    const newPrefs = {
      ...privacyPrefs,
      [key]: updatedVal,
    };
    setPrivacyPrefs(newPrefs);
    setSavingPrivacy(true);

    try {
      const saved = await api.updatePrivacyPreferences({
        default_anonymous_reviews: newPrefs.default_anonymous_reviews,
        show_profile_publicly: newPrefs.show_profile_publicly,
      });
      if (saved) {
        setPrivacyPrefs(saved);
      }
      showToast('Preferensi aktivitas publik berhasil disimpan.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Gagal memperbarui preferensi publik.', 'error');
    } finally {
      setSavingPrivacy(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-12 border border-slate-200/80 shadow-2xs flex flex-col items-center justify-center min-h-[320px] text-slate-400 gap-3">
        <RefreshCw className="w-6 h-6 animate-spin text-[#003d29]" />
        <span className="text-xs font-semibold">Memuat interaksi marketplace...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-2xs space-y-3">
        <div className="flex items-center gap-2 text-emerald-800 font-extrabold text-xs uppercase tracking-wider">
          <Store className="w-4 h-4 text-emerald-700" />
          <span>Interaksi Toko & Komunitas</span>
        </div>
        <h2 className="text-lg font-black text-slate-900">
          Manajemen Toko yang Diikuti & Profil Publik
        </h2>
        <p className="text-xs text-slate-500 leading-relaxed max-w-2xl">
          Kelola toko langganan Anda, notifikasi peluncuran produk baru toko, serta preferensi anonimitas saat Anda menulis ulasan produk di PASARIA.
        </p>

        {errorMessage && (
          <div role="alert" className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2 mt-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* 1. Public Activity & Review Privacy Preferences */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-2xs space-y-4">
        <div>
          <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#003d29]" />
            <span>Privasi Ulasan & Profil Publik</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Kendalikan visibilitas identitas profil Anda pada ruang publik marketplace.
          </p>
        </div>

        <div className="divide-y divide-slate-100">
          {/* Anonymous reviews */}
          <div className="py-3.5 flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <Eye className="w-4 h-4 text-slate-500 mt-0.5" />
              <div>
                <div className="font-bold text-slate-900 text-xs">Ulasan Anonim Secara Default</div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Sembunyikan nama profil dan foto Anda pada setiap ulasan barang yang Anda kirimkan (nama disamarkan sebagai Pengguna PASARIA).
                </div>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                disabled={savingPrivacy}
                checked={privacyPrefs.default_anonymous_reviews || false}
                onChange={() => handlePrivacyToggle('default_anonymous_reviews')}
                className="sr-only peer"
              />
              <div className="w-10 h-5.5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-[#003d29]"></div>
            </label>
          </div>

          {/* Show profile publicly */}
          <div className="py-3.5 flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <Sparkles className="w-4 h-4 text-emerald-600 mt-0.5" />
              <div>
                <div className="font-bold text-slate-900 text-xs">Tampilkan Ringkasan Profil ke Publik</div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Izinkan pengguna lain melihat badge dan ulasan publik Anda. Data sensitif seperti alamat, nomor HP, dan email tetap dirahasiakan.
                </div>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                disabled={savingPrivacy}
                checked={privacyPrefs.show_profile_publicly !== false}
                onChange={() => handlePrivacyToggle('show_profile_publicly')}
                className="sr-only peer"
              />
              <div className="w-10 h-5.5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-[#003d29]"></div>
            </label>
          </div>
        </div>
      </div>

      {/* 2. Followed Shops List */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <Store className="w-4 h-4 text-[#003d29]" />
              <span>Daftar Toko yang Anda Ikuti ({shops.length})</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Atur pemberitahuan produk baru atau batalkan mengikuti toko tertentu.
            </p>
          </div>
          <button
            type="button"
            onClick={loadData}
            className="text-xs font-bold text-[#003d29] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Segarkan</span>
          </button>
        </div>

        {shops.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <Store className="w-10 h-10 text-slate-300 mx-auto" />
            <h4 className="font-extrabold text-slate-800 text-xs">Belum Mengikuti Toko Mana Pun</h4>
            <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
              Ikuti toko resmi atau penjual favorit Anda di halaman profil toko untuk mendapatkan update rilis produk dan diskon eksklusif.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {shops.map((shop) => {
              const isBusy = busyShopId === shop.id;
              const hasAlert = shop.notify_new_products !== false;

              return (
                <div
                  key={shop.id}
                  className="p-4 rounded-2xl border border-slate-200/90 flex flex-col justify-between gap-3 bg-white hover:border-slate-300 transition-all shadow-2xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={shop.logo || '/placeholder-shop.png'}
                      alt={shop.name}
                      className="w-12 h-12 rounded-2xl object-cover bg-slate-100 border border-slate-100 shrink-0"
                    />
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-extrabold text-slate-900 text-xs truncate">
                          {shop.name}
                        </h4>
                        {shop.is_verified && (
                          <span className="text-[9px] font-black bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full shrink-0">
                            Resmi
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 line-clamp-1">
                        {shop.city || 'Indonesia'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
                    {/* Toggle new product alerts */}
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleToggleShopAlert(shop.id, hasAlert)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold border transition-colors cursor-pointer ${
                        hasAlert
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                          : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                      }`}
                      title={hasAlert ? 'Pemberitahuan produk baru aktif' : 'Pemberitahuan produk baru mati'}
                    >
                      {hasAlert ? (
                        <>
                          <Bell className="w-3 h-3 text-emerald-600" />
                          <span>Notif Aktif</span>
                        </>
                      ) : (
                        <>
                          <BellOff className="w-3 h-3" />
                          <span>Notif Mati</span>
                        </>
                      )}
                    </button>

                    <div className="flex items-center gap-1.5">
                      {onNavigateShop && (
                        <button
                          type="button"
                          onClick={() => onNavigateShop(shop.slug || shop.id)}
                          className="p-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
                          title="Buka Toko"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleUnfollow(shop.id, shop.name)}
                        className="p-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 cursor-pointer"
                        title="Batal Mengikuti"
                      >
                        <UserX className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
