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
  Truck,
  HelpCircle,
  Star,
  Store,
  PackageCheck,
  Moon,
  Clock,
  Sparkles,
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
    shipping_delivery_email: true,
    shipping_delivery_in_app: true,
    qa_answers_email: true,
    qa_answers_in_app: true,
    review_activity_email: true,
    review_activity_in_app: true,
    shop_updates_email: true,
    shop_updates_in_app: true,
    price_alerts_email: true,
    price_alerts_in_app: true,
    stock_alerts_email: true,
    stock_alerts_in_app: true,
    quiet_hours_enabled: false,
    quiet_hours_start: '22:00',
    quiet_hours_end: '07:00',
    quiet_hours_timezone: 'Asia/Jakarta',
    email_digest_frequency: 'instant',
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
        setPrefs((prev) => ({
          ...prev,
          ...data,
          quiet_hours_start: data.quiet_hours_start || '22:00',
          quiet_hours_end: data.quiet_hours_end || '07:00',
          quiet_hours_timezone: data.quiet_hours_timezone || 'Asia/Jakarta',
          email_digest_frequency: data.email_digest_frequency || 'instant',
        }));
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal memuat preferensi notifikasi.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (key: keyof UserNotificationPreferences) => {
    if (key === 'security_alerts_email' || key === 'security_alerts_in_app') {
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
        shipping_delivery_email: prefs.shipping_delivery_email,
        shipping_delivery_in_app: prefs.shipping_delivery_in_app,
        qa_answers_email: prefs.qa_answers_email,
        qa_answers_in_app: prefs.qa_answers_in_app,
        review_activity_email: prefs.review_activity_email,
        review_activity_in_app: prefs.review_activity_in_app,
        shop_updates_email: prefs.shop_updates_email,
        shop_updates_in_app: prefs.shop_updates_in_app,
        price_alerts_email: prefs.price_alerts_email,
        price_alerts_in_app: prefs.price_alerts_in_app,
        stock_alerts_email: prefs.stock_alerts_email,
        stock_alerts_in_app: prefs.stock_alerts_in_app,
        quiet_hours_enabled: prefs.quiet_hours_enabled,
        quiet_hours_start: prefs.quiet_hours_start,
        quiet_hours_end: prefs.quiet_hours_end,
        quiet_hours_timezone: prefs.quiet_hours_timezone,
        email_digest_frequency: prefs.email_digest_frequency,
      });

      if (updated) {
        setPrefs((prev) => ({ ...prev, ...updated }));
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
      title: 'Pembaruan Pesanan',
      desc: 'Notifikasi status pesanan, pembayaran lunas, dan konfirmasi barang tiba.',
      icon: ShoppingBag,
      emailKey: 'order_updates_email',
      inAppKey: 'order_updates_in_app',
    },
    {
      id: 'shipping',
      title: 'Pengiriman & Pelacakan Kurir',
      desc: 'Pemberitahuan nomor resi pengiriman, paket diantar kurir, dan estimasi waktu tiba.',
      icon: Truck,
      emailKey: 'shipping_delivery_email',
      inAppKey: 'shipping_delivery_in_app',
    },
    {
      id: 'chat',
      title: 'Pesan Chat Penjual & Pembeli',
      desc: 'Notifikasi saat ada pesan masuk atau balasan diskusi komplain belanja.',
      icon: MessageSquare,
      emailKey: 'chat_messages_email',
      inAppKey: 'chat_messages_in_app',
    },
    {
      id: 'qa',
      title: 'Tanya Jawab Produk (Q&A)',
      desc: 'Kabar saat pertanyaan produk Anda telah dijawab oleh penjual.',
      icon: HelpCircle,
      emailKey: 'qa_answers_email',
      inAppKey: 'qa_answers_in_app',
    },
    {
      id: 'reviews',
      title: 'Ulasan & Balasan Toko',
      desc: 'Pemberitahuan saat penjual membalas ulasan atau rating belanja Anda.',
      icon: Star,
      emailKey: 'review_activity_email',
      inAppKey: 'review_activity_in_app',
    },
    {
      id: 'shop_updates',
      title: 'Produk Baru dari Toko yang Diikuti',
      desc: 'Pemberitahuan saat toko favorit Anda merilis katalog barang baru.',
      icon: Store,
      emailKey: 'shop_updates_email',
      inAppKey: 'shop_updates_in_app',
    },
    {
      id: 'price_alerts',
      title: 'Pantau Harga & Diskon Wishlist',
      desc: 'Kabar saat barang di wishlist atau pantauan Anda mengalami diskon harga.',
      icon: Heart,
      emailKey: 'price_alerts_email',
      inAppKey: 'price_alerts_in_app',
    },
    {
      id: 'stock_alerts',
      title: 'Ketersediaan Stok Kembali (Back in Stock)',
      desc: 'Peringatan saat barang yang sebelumnya habis kini dapat dibeli kembali.',
      icon: PackageCheck,
      emailKey: 'stock_alerts_email',
      inAppKey: 'stock_alerts_in_app',
    },
    {
      id: 'promo',
      title: 'Promo, Flash Sale & Buletin Mingguan',
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

  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-12 border border-slate-200/80 shadow-2xs text-center text-xs text-slate-400">
        Memuat preferensi notifikasi dari server...
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 1. Main Category Channels */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h2 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#003d29]" />
              <span>Preferensi Pemberitahuan & Saluran</span>
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

        <div className="space-y-3 text-xs">
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
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-200/70 px-2 py-0.5 rounded-full">
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
        </div>
      </div>

      {/* 2. Quiet Hours (Jam Tenang) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <Moon className="w-4 h-4 text-[#003d29]" />
              <span>Jam Tenang (Quiet Hours)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Tunda pemberitahuan promosi dan update toko selama jam istirahat. Notifikasi keamanan darurat akan tetap dikirimkan.
            </p>
          </div>

          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={prefs.quiet_hours_enabled || false}
              onChange={(e) => {
                setPrefs({ ...prefs, quiet_hours_enabled: e.target.checked });
                setIsDirty(true);
              }}
              className="sr-only peer"
            />
            <div className="w-10 h-5.5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-[#003d29]"></div>
          </label>
        </div>

        {prefs.quiet_hours_enabled && (
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-4 pt-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>Waktu Mulai</span>
                </label>
                <input
                  type="time"
                  value={prefs.quiet_hours_start || '22:00'}
                  onChange={(e) => {
                    setPrefs({ ...prefs, quiet_hours_start: e.target.value });
                    setIsDirty(true);
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-hidden focus:border-[#003d29]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>Waktu Selesai</span>
                </label>
                <input
                  type="time"
                  value={prefs.quiet_hours_end || '07:00'}
                  onChange={(e) => {
                    setPrefs({ ...prefs, quiet_hours_end: e.target.value });
                    setIsDirty(true);
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-hidden focus:border-[#003d29]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Zona Waktu
                </label>
                <select
                  value={prefs.quiet_hours_timezone || 'Asia/Jakarta'}
                  onChange={(e) => {
                    setPrefs({ ...prefs, quiet_hours_timezone: e.target.value });
                    setIsDirty(true);
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-hidden focus:border-[#003d29]"
                >
                  <option value="Asia/Jakarta">WIB (Jakarta - UTC+7)</option>
                  <option value="Asia/Makassar">WITA (Makassar/Bali - UTC+8)</option>
                  <option value="Asia/Jayapura">WIT (Jayapura - UTC+9)</option>
                  <option value="UTC">UTC (Universal)</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. Email Digest Frequency */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-2xs space-y-4">
        <div>
          <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#003d29]" />
            <span>Frekuensi Ringkasan Email (Email Digest)</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Pilih seberapa sering Anda ingin menerima email ringkasan aktivitas belanja Anda.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          {[
            { id: 'instant', title: 'Langsung (Real-time)', desc: 'Email dikirim segera saat peristiwa terjadi' },
            { id: 'daily', title: 'Ringkasan Harian', desc: 'Satu rangkuman notifikasi setiap sore' },
            { id: 'weekly', title: 'Ringkasan Mingguan', desc: 'Rangkuman aktivitas dan promo setiap Senin' },
          ].map((mode) => {
            const isSelected = (prefs.email_digest_frequency || 'instant') === mode.id;
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => {
                  setPrefs({ ...prefs, email_digest_frequency: mode.id as any });
                  setIsDirty(true);
                }}
                className={`p-4 rounded-2xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-50/60 border-emerald-400 shadow-2xs'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="font-extrabold text-slate-900 flex items-center justify-between">
                  <span>{mode.title}</span>
                  {isSelected && <Check className="w-4 h-4 text-[#003d29]" />}
                </div>
                <div className="text-[11px] text-slate-400">{mode.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Save Button Bar */}
      <div className="pt-2 flex items-center justify-between">
        <span className="text-[11px] text-slate-400">
          {isDirty ? 'Ada perubahan yang belum disimpan.' : 'Semua preferensi tersinkronisasi.'}
        </span>

        <button
          type="submit"
          disabled={saving || !isDirty}
          className="min-h-[44px] px-6 py-2.5 rounded-full font-bold text-xs text-white bg-[#003d29] hover:bg-[#064e3b] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#003d29] transition-all cursor-pointer flex items-center gap-2 shadow-2xs disabled:opacity-40 motion-press active:scale-[0.96]"
        >
          <Save className="w-3.5 h-3.5" />
          <span>{saving ? 'Menyimpan...' : 'Simpan Preferensi Notifikasi'}</span>
        </button>
      </div>
    </form>
  );
};
