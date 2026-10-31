import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Download,
  Trash2,
  Check,
  AlertCircle,
  FileText,
  Lock,
  AlertTriangle,
} from 'lucide-react';
import { UserPrivacyPreferences } from '../../types';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';

interface PrivacyTabProps {
  onLogoutAndNavigateHome: () => void;
}

export const PrivacyTab: React.FC<PrivacyTabProps> = ({ onLogoutAndNavigateHome }) => {
  const { showToast } = useToast();

  const [privacyPrefs, setPrivacyPrefs] = useState<UserPrivacyPreferences>({
    personalization_enabled: true,
    marketing_communication: false,
    activity_logging: true,
  });

  const [loading, setLoading] = useState(true);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [privacyError, setPrivacyError] = useState('');

  // Data Export State
  const [exporting, setExporting] = useState(false);

  // Account Deletion State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteReason, setDeleteReason] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    loadPrivacy();
  }, []);

  const loadPrivacy = async () => {
    setLoading(true);
    try {
      const data = await api.getPrivacyPreferences();
      if (data) {
        setPrivacyPrefs(data);
      }
    } catch (e) {
      console.warn('Privacy prefs load note:', e);
    } finally {
      setLoading(false);
    }
  };

  const handlePrivacySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPrefs(true);
    setPrivacyError('');
    setSaveSuccess(false);

    try {
      const updated = await api.updatePrivacyPreferences({
        personalization_enabled: privacyPrefs.personalization_enabled,
        marketing_communication: privacyPrefs.marketing_communication,
        activity_logging: privacyPrefs.activity_logging,
        default_anonymous_reviews: privacyPrefs.default_anonymous_reviews,
        show_profile_publicly: privacyPrefs.show_profile_publicly,
      });

      if (updated) {
        setPrivacyPrefs(updated);
      }
      setSaveSuccess(true);
      showToast('Pengaturan privasi berhasil diperbarui.', 'success');
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setPrivacyError(err.message || 'Gagal menyimpan pengaturan privasi.');
    } finally {
      setSavingPrefs(false);
    }
  };

  const handleExportData = async () => {
    setExporting(true);
    try {
      const exportData = await api.exportUserData();
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(exportData, null, 2)
      )}`;
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', jsonString);
      downloadAnchor.setAttribute('download', `pasaria_data_export_${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      showToast('Arsip data pribadi Anda berhasil diunduh.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Gagal mengunduh arsip data pribadi.', 'error');
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deletePassword) return;

    setDeletingAccount(true);
    setDeleteError('');

    try {
      await api.deleteAccount(deletePassword, deleteReason);
      setShowDeleteModal(false);
      showToast('Akun Anda berhasil dihapus dan dinonaktifkan.', 'info');
      onLogoutAndNavigateHome();
    } catch (err: any) {
      setDeleteError(err.message || 'Gagal memproses penghapusan akun. Pastikan kata sandi benar.');
    } finally {
      setDeletingAccount(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Privacy Preferences Panel */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-2xs space-y-6">
        <div>
          <h2 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#003d29]" />
            <span>Privasi & Personalisasi Akun</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Atur bagaimana data penggunaan Anda diproses untuk keperluan personalisasi rekomendasi katalog dan buletin komunikasi.
          </p>
        </div>

        {privacyError && (
          <div role="alert" className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{privacyError}</span>
          </div>
        )}

        {saveSuccess && (
          <div role="status" className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>Pengaturan privasi berhasil diperbarui!</span>
          </div>
        )}

        {loading ? (
          <div className="py-8 text-center text-xs text-slate-400">Memuat pengaturan privasi...</div>
        ) : (
          <form onSubmit={handlePrivacySubmit} className="space-y-4 text-xs">
            {/* Toggle 1: Personalization */}
            <label className="flex items-start justify-between p-4 rounded-2xl bg-slate-50/80 border border-slate-200/70 hover:border-slate-300 transition-colors cursor-pointer">
              <div className="pr-4">
                <div className="font-extrabold text-slate-900">Personalisasi Rekomendasi Produk</div>
                <div className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                  Izinkan PASARIA menampilkan saran produk dan etalase toko yang relevan berdasarkan kategori belanja dan riwayat pencarian Anda.
                </div>
              </div>
              <input
                type="checkbox"
                checked={privacyPrefs.personalization_enabled}
                onChange={(e) =>
                  setPrivacyPrefs((prev) => ({ ...prev, personalization_enabled: e.target.checked }))
                }
                className="sr-only"
              />
              <div
                className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out cursor-pointer mt-1 ${
                  privacyPrefs.personalization_enabled ? 'bg-[#003d29]' : 'bg-slate-200'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-md transform transition duration-200 ease-in-out ${
                    privacyPrefs.personalization_enabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </div>
            </label>

            {/* Toggle 2: Anonymous Reviews */}
            <label className="flex items-start justify-between p-4 rounded-2xl bg-slate-50/80 border border-slate-200/70 hover:border-slate-300 transition-colors cursor-pointer">
              <div className="pr-4">
                <div className="font-extrabold text-slate-900">Ulasan Anonim Secara Default</div>
                <div className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                  Sembunyikan nama akun asli saat menulis ulasan produk (nama disamarkan sebagai Pengguna PASARIA).
                </div>
              </div>
              <input
                type="checkbox"
                checked={Boolean(privacyPrefs.default_anonymous_reviews)}
                onChange={(e) =>
                  setPrivacyPrefs((prev) => ({ ...prev, default_anonymous_reviews: e.target.checked }))
                }
                className="sr-only"
              />
              <div
                className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out cursor-pointer mt-1 ${
                  privacyPrefs.default_anonymous_reviews ? 'bg-[#003d29]' : 'bg-slate-200'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-md transform transition duration-200 ease-in-out ${
                    privacyPrefs.default_anonymous_reviews ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </div>
            </label>

            {/* Toggle 3: Show Profile Publicly */}
            <label className="flex items-start justify-between p-4 rounded-2xl bg-slate-50/80 border border-slate-200/70 hover:border-slate-300 transition-colors cursor-pointer">
              <div className="pr-4">
                <div className="font-extrabold text-slate-900">Tampilkan Profil Marketplace ke Publik</div>
                <div className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                  Izinkan pembeli lain melihat ringkasan profil publik dan badge belanja Anda.
                </div>
              </div>
              <input
                type="checkbox"
                checked={privacyPrefs.show_profile_publicly !== false}
                onChange={(e) =>
                  setPrivacyPrefs((prev) => ({ ...prev, show_profile_publicly: e.target.checked }))
                }
                className="sr-only"
              />
              <div
                className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out cursor-pointer mt-1 ${
                  privacyPrefs.show_profile_publicly !== false ? 'bg-[#003d29]' : 'bg-slate-200'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-md transform transition duration-200 ease-in-out ${
                    privacyPrefs.show_profile_publicly !== false ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </div>
            </label>

            {/* Toggle 4: Marketing Communication */}
            <label className="flex items-start justify-between p-4 rounded-2xl bg-slate-50/80 border border-slate-200/70 hover:border-slate-300 transition-colors cursor-pointer">
              <div className="pr-4">
                <div className="font-extrabold text-slate-900">Email Buletin & Pemasaran Opsional</div>
                <div className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                  Terima wawasan tren belanja pasar dan buletin promosi produk pilihan melalui email. Pesan operasional transaksi tetap dikirimkan.
                </div>
              </div>
              <input
                type="checkbox"
                checked={privacyPrefs.marketing_communication}
                onChange={(e) =>
                  setPrivacyPrefs((prev) => ({ ...prev, marketing_communication: e.target.checked }))
                }
                className="sr-only"
              />
              <div
                className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out cursor-pointer mt-1 ${
                  privacyPrefs.marketing_communication ? 'bg-[#003d29]' : 'bg-slate-200'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-md transform transition duration-200 ease-in-out ${
                    privacyPrefs.marketing_communication ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </div>
            </label>

            {/* Toggle 5: Activity Logging */}
            <label className="flex items-start justify-between p-4 rounded-2xl bg-slate-50/80 border border-slate-200/70 hover:border-slate-300 transition-colors cursor-pointer">
              <div className="pr-4">
                <div className="font-extrabold text-slate-900">Pencatatan Riwayat Aktivitas & Perangkat</div>
                <div className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                  Catat waktu dan token sesi perangkat aktif untuk membantu Anda mendeteksi potensi login mencurigakan.
                </div>
              </div>
              <input
                type="checkbox"
                checked={privacyPrefs.activity_logging}
                onChange={(e) =>
                  setPrivacyPrefs((prev) => ({ ...prev, activity_logging: e.target.checked }))
                }
                className="sr-only"
              />
              <div
                className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out cursor-pointer mt-1 ${
                  privacyPrefs.activity_logging ? 'bg-[#003d29]' : 'bg-slate-200'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-md transform transition duration-200 ease-in-out ${
                    privacyPrefs.activity_logging ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </div>
            </label>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={savingPrefs}
                className="min-h-[44px] px-6 py-2.5 rounded-full font-bold text-xs text-white bg-[#003d29] hover:bg-[#064e3b] transition-all cursor-pointer shadow-2xs disabled:opacity-50 motion-press active:scale-[0.96]"
              >
                {savingPrefs ? 'Menyimpan...' : 'Simpan Pengaturan Privasi'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* 2. Personal Data Export Panel */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-1 flex-1">
            <h2 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#003d29]" />
              <span>Unduh Arsip Data Pribadi (Ekspor JSON)</span>
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed max-w-xl">
              Sesuai prinsip perlindungan data pribadi (UU PDP / GDPR), Anda berhak mengunduh salinan seluruh data profil, buku alamat pengiriman, riwayat pesanan, dan ulasan yang tersimpan di sistem PASARIA.
            </p>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 text-[11px] text-slate-600 mt-2">
              <strong className="text-slate-800">Jaminan Keamanan:</strong> Berkas ekspor tidak memuat kata sandi, token otentikasi, atau data rahasia pihak lain.
            </div>
          </div>

          <button
            type="button"
            onClick={handleExportData}
            disabled={exporting}
            className="min-h-[44px] px-5 py-2.5 rounded-full border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-[#003d29] font-bold text-xs transition-colors cursor-pointer flex items-center gap-2 shrink-0 disabled:opacity-50 motion-press active:scale-[0.96]"
          >
            <Download className="w-4 h-4" />
            <span>{exporting ? 'Menyiapkan Berkas...' : 'Unduh Data Pribadi (.json)'}</span>
          </button>
        </div>
      </div>

      {/* 3. Account Deletion Panel (Danger Zone) */}
      <div className="bg-rose-50/50 rounded-3xl p-6 sm:p-8 border border-rose-200/80 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 text-rose-700 font-extrabold text-sm">
          <AlertTriangle className="w-4 h-4 text-rose-600" />
          <span>Zona Bahaya: Hapus Akun Pengguna</span>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
          Menghapus akun Anda akan mencabut seluruh token sesi login secara permanen dan menonaktifkan akun. Demi kepatuhan hukum dan transaksi, data keuangan terdahulu akan dianonimkan sesuai regulasi perbankan. Anda tidak dapat menghapus akun jika masih memiliki pesanan aktif dalam pengiriman atau komplain yang belum selesai.
        </p>

        <div className="pt-2">
          <button
            type="button"
            onClick={() => {
              setDeletePassword('');
              setDeleteReason('');
              setDeleteError('');
              setShowDeleteModal(true);
            }}
            className="min-h-[44px] px-6 py-2.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-all cursor-pointer flex items-center gap-2 shadow-2xs motion-press active:scale-[0.96]"
          >
            <Trash2 className="w-4 h-4" />
            <span>Hapus Akun PASARIA</span>
          </button>
        </div>
      </div>

      {/* Account Deletion Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 shadow-xl space-y-4 text-left">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="font-extrabold text-slate-900 text-base">Konfirmasi Hapus Akun</h3>
              <p className="text-xs text-slate-500 mt-1">
                Tindakan ini tidak dapat dibatalkan. Masukkan kata sandi akun Anda untuk melanjutkan proses penghapusan.
              </p>
            </div>

            {deleteError && (
              <div role="alert" className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{deleteError}</span>
              </div>
            )}

            <form onSubmit={handleDeleteAccount} className="space-y-4 text-xs">
              <div>
                <label htmlFor="del-pass" className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Kata Sandi Akun
                </label>
                <input
                  id="del-pass"
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="Masukkan kata sandi untuk verifikasi"
                  required
                  className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label htmlFor="del-reason" className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Alasan Penghapusan (Opsional)
                </label>
                <textarea
                  id="del-reason"
                  rows={2}
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  placeholder="Beri tahu kami masukan Anda..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#003d29]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="min-h-[40px] px-4 py-2 rounded-full border border-slate-200 text-slate-600 font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={deletingAccount || !deletePassword}
                  className="min-h-[40px] px-5 py-2 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer disabled:opacity-50"
                >
                  {deletingAccount ? 'Menghapus Akun...' : 'Konfirmasi Hapus Akun'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
