import React, { useState, useEffect } from 'react';
import {
  Bell,
  Check,
  AlertCircle,
  Mail,
  ShieldAlert,
  ShoppingBag,
  MessageSquare,
  Tag,
  Heart,
  Save,
} from 'lucide-react';
import { UserNotificationPreferences } from '../../types';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';

export const NotificationsTab: React.FC = () => {
  const { showToast } = useToast();

  const [prefs, setPrefs] = useState<UserNotificationPreferences>({
    order_updates_email: true,
    order_updates_in_app: true,
    chat_messages_email: true,
    chat_messages_in_app: true,
    promotions_email: false,
    promotions_in_app: false,
    wishlist_alerts_email: true,
    wishlist_alerts_in_app: true,
    security_alerts_email: true,
    security_alerts_in_app: true,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const data = await api.getNotificationPreferences();
      if (data) {
        setPrefs(data);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal memuat preferensi notifikasi.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (key: keyof UserNotificationPreferences) => {
    if (key === 'security_alerts_email' || key === 'security_alerts_in_app') {
      // Mandatory security alerts cannot be disabled
      return;
    }
    setPrefs((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
    setIsDirty(true);
    setSaveSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMessage('');
    setSaveSuccess(false);

    try {
      const updated = await api.updateNotificationPreferences({
        order_updates_email: prefs.order_updates_email,
        order_updates_in_app: prefs.order_updates_in_app,
        chat_messages_email: prefs.chat_messages_email,
        chat_messages_in_app: prefs.chat_messages_in_app,
        promotions_email: prefs.promotions_email,
        promotions_in_app: prefs.promotions_in_app,
        wishlist_alerts_email: prefs.wishlist_alerts_email,
        wishlist_alerts_in_app: prefs.wishlist_alerts_in_app,
      });

      if (updated) {
        setPrefs(updated);
      }
      setIsDirty(false);
      setSaveSuccess(true);
      showToast('Preferensi notifikasi berhasil disimpan.', 'success');
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal menyimpan preferensi notifikasi.');
    } finally {
      setSaving(false);
    }
  };

  const channels: Array<{
    id: string;
    title: string;
    desc: string;
    icon: React.ComponentType<{ className?: string }>;
    emailKey: keyof UserNotificationPreferences;
    inAppKey: keyof UserNotificationPreferences;
    locked?: boolean;
  }> = [
    {
      id: 'orders',
      title: 'Pembaruan Pesanan & Pengiriman',
      desc: 'Notifikasi status pesanan, pembayaran lunas, resi pengiriman kurir, dan konfirmasi barang tiba.',
      icon: ShoppingBag,
      emailKey: 'order_updates_email',
      inAppKey: 'order_updates_in_app',
    },
    {
      id: 'chat',
      title: 'Pesan Chat & WhatsApp Penjual',
      desc: 'Notifikasi saat penjual membalas chat pertanyaan produk atau diskusi komplain belanja.',
      icon: MessageSquare,
      emailKey: 'chat_messages_email',
      inAppKey: 'chat_messages_in_app',
    },
    {
      id: 'wishlist',
      title: 'Peringatan Wishlist & Harga Turun',
      desc: 'Kabar saat barang di keranjang atau wishlist Anda mengalami potongan harga spesial.',
      icon: Heart,
      emailKey: 'wishlist_alerts_email',
      inAppKey: 'wishlist_alerts_in_app',
    },
    {
      id: 'promo',
      title: 'Promo, Flash Sale & Voucher Mingguan',
      desc: 'Kabar diskon kilat, penawaran musiman, dan voucher cashback PASARIA.',
      icon: Tag,
      emailKey: 'promotions_email',
      inAppKey: 'promotions_in_app',
    },
    {
      id: 'security',
      title: 'Keamanan Akun & Peringatan Sistem',
      desc: 'Pemberitahuan perubahan sandi, sesi baru terdeteksi, dan bukti transaksi legal. Wajib aktif demi perlindungan akun.',
      icon: ShieldAlert,
      emailKey: 'security_alerts_email',
      inAppKey: 'security_alerts_in_app',
      locked: true,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h2 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#003d29]" />
              <span>Preferensi Pemberitahuan & Notifikasi</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Atur bagaimana PASARIA mengabari Anda melalui Inbox Aplikasi dan Email resmi.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold text-slate-500">
            <span className="flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5 text-slate-400" />
              <span>Inbox Aplikasi</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              <span>Email</span>
            </span>
          </div>
        </div>

        {errorMessage && (
          <div role="alert" className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {saveSuccess && (
          <div role="status" className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>Preferensi notifikasi Anda berhasil disimpan dan diterapkan!</span>
          </div>
        )}

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">
            Memuat preferensi notifikasi dari server...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {channels.map((channel) => {
              const Icon = channel.icon;
              const inAppChecked = Boolean(prefs[channel.inAppKey]);
              const emailChecked = Boolean(prefs[channel.emailKey]);

              return (
                <div
                  key={channel.id}
                  className={`p-4 rounded-2xl border transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    channel.locked ? 'bg-slate-50/70 border-slate-200/60' : 'bg-white border-slate-200/80 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start gap-3 flex-1">
                    <div className="w-9 h-9 rounded-full bg-emerald-50 text-[#003d29] flex items-center justify-center shrink-0 mt-0.5">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-extrabold text-slate-900 flex items-center gap-2">
                        <span>{channel.title}</span>
                        {channel.locked && (
                          <span className="text-[10px] font-bold text-slate-500 bg-slate-200/70 px-2 py-0.2 rounded-full">
                            Wajib Aktif
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                        {channel.desc}
                      </p>
                    </div>
                  </div>

                  {/* Toggle Controls */}
                  <div className="flex items-center gap-6 shrink-0 self-end sm:self-center pl-12 sm:pl-0">
                    {/* In-App Toggle */}
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-[10px] text-slate-400 font-medium sm:hidden">Inbox</span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={inAppChecked}
                        disabled={channel.locked}
                        onClick={() => handleToggle(channel.inAppKey)}
                        className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out cursor-pointer ${
                          inAppChecked ? 'bg-[#003d29]' : 'bg-slate-200'
                        } ${channel.locked ? 'opacity-60 cursor-not-allowed' : ''}`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-md transform transition duration-200 ease-in-out ${
                            inAppChecked ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Email Toggle */}
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-[10px] text-slate-400 font-medium sm:hidden">Email</span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={emailChecked}
                        disabled={channel.locked}
                        onClick={() => handleToggle(channel.emailKey)}
                        className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out cursor-pointer ${
                          emailChecked ? 'bg-[#003d29]' : 'bg-slate-200'
                        } ${channel.locked ? 'opacity-60 cursor-not-allowed' : ''}`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-md transform transition duration-200 ease-in-out ${
                            emailChecked ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            <div className="pt-4 flex items-center justify-between border-t border-slate-100">
              <span className="text-[11px] text-slate-400">
                {isDirty ? 'Ada perubahan yang belum disimpan.' : 'Semua preferensi tersinkronisasi.'}
              </span>

              <button
                type="submit"
                disabled={saving || !isDirty}
                className="min-h-[44px] px-6 py-2.5 rounded-full font-bold text-xs text-white bg-[#003d29] hover:bg-[#064e3b] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#003d29] transition-all cursor-pointer flex items-center gap-2 shadow-2xs disabled:opacity-40 motion-press active:scale-[0.96]"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saving ? 'Menyimpan...' : 'Simpan Preferensi'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
