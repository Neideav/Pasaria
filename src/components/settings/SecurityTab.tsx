import React, { useState, useEffect } from 'react';
import {
  Shield,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  Smartphone,
  LogOut,
  QrCode,
  Copy,
  RefreshCw,
} from 'lucide-react';
import { User, UserSession, TwoFactorStatus, TwoFactorSetupResult } from '../../types';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { formatDateTime } from '../../utils/formatters';

interface SecurityTabProps {
  user: User | null;
  onUpdateUser?: (updated: User) => void;
  onLogout?: () => void;
}

interface PasswordStrength {
  score: number;
  label: string;
  color: string;
  barColor: string;
}

const getPasswordStrength = (pass: string): PasswordStrength => {
  if (!pass) {
    return { score: 0, label: '', color: '', barColor: '' };
  }
  let score = 0;
  if (pass.length >= 8) score += 1;
  if (/[a-z]/.test(pass) && /[A-Z]/.test(pass)) score += 1;
  if (/\d/.test(pass)) score += 1;
  if (/[^a-zA-Z0-9]/.test(pass)) score += 1;

  if (pass.length < 8) {
    return { score: 1, label: 'Terlalu Pendek (< 8 Karakter)', color: 'text-rose-600', barColor: 'bg-rose-500' };
  }

  switch (score) {
    case 1:
    case 2:
      return { score: 2, label: 'Cukup', color: 'text-amber-600', barColor: 'bg-amber-500' };
    case 3:
      return { score: 3, label: 'Kuat', color: 'text-emerald-600', barColor: 'bg-emerald-500' };
    case 4:
      return { score: 4, label: 'Sangat Kuat', color: 'text-[#003d29]', barColor: 'bg-[#003d29]' };
    default:
      return { score: 1, label: 'Lemah', color: 'text-rose-600', barColor: 'bg-rose-500' };
  }
};

export const SecurityTab: React.FC<SecurityTabProps> = ({ user, onUpdateUser, onLogout }) => {
  const { showToast } = useToast();

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // Active Sessions State
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [revokingSessionId, setRevokingSessionId] = useState<number | null>(null);
  const [revokingOthers, setRevokingOthers] = useState(false);

  // Two-Factor Authentication State
  const [twoFactorStatus, setTwoFactorStatus] = useState<TwoFactorStatus>({ enabled: false });
  const [twoFactorLoading, setTwoFactorLoading] = useState(true);
  const [showTwoFactorSetupModal, setShowTwoFactorSetupModal] = useState(false);
  const [setupData, setSetupData] = useState<TwoFactorSetupResult | null>(null);
  const [totpCodeInput, setTotpCodeInput] = useState('');
  const [totpSubmitting, setTotpSubmitting] = useState(false);
  const [totpModalError, setTotpModalError] = useState('');
  const [copiedSecret, setCopiedSecret] = useState(false);

  // Disable 2FA Modal State
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');
  const [disableSubmitting, setDisableSubmitting] = useState(false);
  const [disableError, setDisableError] = useState('');

  const passwordStrength = getPasswordStrength(newPassword);

  useEffect(() => {
    loadSessions();
    loadTwoFactorStatus();
  }, []);

  const loadSessions = async () => {
    setSessionsLoading(true);
    try {
      const data = await api.getActiveSessions();
      setSessions(data || []);
    } catch (e) {
      console.warn('Sessions load note:', e);
    } finally {
      setSessionsLoading(false);
    }
  };

  const loadTwoFactorStatus = async () => {
    setTwoFactorLoading(true);
    try {
      const status = await api.getTwoFactorStatus();
      setTwoFactorStatus(status);
    } catch (e) {
      console.warn('2FA status load note:', e);
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    if (newPassword.length < 8) {
      setPasswordError('Kata sandi baru minimal 8 karakter.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    setPasswordSaving(true);
    try {
      await api.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
        new_password_confirmation: confirmPassword,
      });

      setPasswordSaved(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showToast('Kata sandi berhasil diubah. Sesi login telah diperbarui.', 'success');
      setTimeout(() => setPasswordSaved(false), 3000);
      loadSessions();
    } catch (err: any) {
      setPasswordError(err.message || 'Gagal mengubah kata sandi. Pastikan kata sandi saat ini benar.');
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleRevokeSession = async (id: number) => {
    const target = sessions.find((s) => s.id === id);
    setRevokingSessionId(id);
    try {
      const res = await api.revokeSession(id);
      if (target?.is_current || res.is_current) {
        api.clearToken();
        showToast('Sesi saat ini telah dicabut. Anda dialihkan ke beranda.', 'info');
        if (onLogout) {
          onLogout();
        } else {
          window.location.reload();
        }
        return;
      }
      setSessions((prev) => prev.filter((s) => s.id !== id));
      showToast('Sesi perangkat berhasil dicabut.', 'info');
    } catch (err: any) {
      showToast(err.message || 'Gagal mencabut sesi perangkat.', 'error');
    } finally {
      setRevokingSessionId(null);
    }
  };

  const handleRevokeOtherSessions = async () => {
    setRevokingOthers(true);
    try {
      await api.revokeOtherSessions();
      setSessions((prev) => prev.filter((s) => s.is_current));
      showToast('Semua sesi lain berhasil dicabut.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Gagal mencabut sesi lain.', 'error');
    } finally {
      setRevokingOthers(false);
    }
  };

  const startTwoFactorSetup = async () => {
    setTotpModalError('');
    setTotpCodeInput('');
    setCopiedSecret(false);
    try {
      const res = await api.setupTwoFactor();
      setSetupData(res);
      setShowTwoFactorSetupModal(true);
    } catch (err: any) {
      showToast(err.message || 'Gagal memulai pengaturan 2FA.', 'error');
    }
  };

  const confirmTwoFactorActivation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!totpCodeInput.trim() || totpCodeInput.length !== 6) return;

    setTotpSubmitting(true);
    setTotpModalError('');
    try {
      await api.confirmTwoFactor(totpCodeInput.trim());
      setTwoFactorStatus({ enabled: true, confirmed_at: new Date().toISOString() });
      setShowTwoFactorSetupModal(false);
      showToast('Autentikasi dua langkah (2FA) berhasil diaktifkan!', 'success');
    } catch (err: any) {
      setTotpModalError(err.message || 'Kode verifikasi 6 digit tidak valid.');
    } finally {
      setTotpSubmitting(false);
    }
  };

  const handleDisableTwoFactor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disablePassword) return;

    setDisableSubmitting(true);
    setDisableError('');
    try {
      await api.disableTwoFactor(disablePassword);
      setTwoFactorStatus({ enabled: false, confirmed_at: null });
      setShowDisableModal(false);
      setDisablePassword('');
      showToast('Autentikasi dua langkah telah dinonaktifkan.', 'info');
    } catch (err: any) {
      setDisableError(err.message || 'Kata sandi salah.');
    } finally {
      setDisableSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Change Password Panel */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-2xs space-y-6">
        <div>
          <h2 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-[#003d29]" />
            <span>Ubah Kata Sandi Akun</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Gunakan kombinasi minimal 8 karakter huruf besar, kecil, angka, dan simbol untuk keamanan maksimal akun Anda.
          </p>
        </div>

        {passwordError && (
          <div role="alert" className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{passwordError}</span>
          </div>
        )}

        {passwordSaved && (
          <div role="status" className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>Kata sandi Anda berhasil diperbarui. Token sesi telah diperbarui secara otomatis.</span>
          </div>
        )}

        <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md text-xs">
          <div>
            <label htmlFor="sec-current-password" className="block text-[11px] font-semibold text-slate-700 mb-1">
              Kata Sandi Saat Ini
            </label>
            <div className="relative">
              <input
                id="sec-current-password"
                name="currentPassword"
                type={showCurrentPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="w-full min-h-[44px] pl-3.5 pr-11 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#003d29] focus:border-[#003d29]"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword((prev) => !prev)}
                aria-label={showCurrentPassword ? 'Sembunyikan kata sandi saat ini' : 'Tampilkan kata sandi saat ini'}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 rounded p-1.5 cursor-pointer"
              >
                {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="sec-new-password" className="block text-[11px] font-semibold text-slate-700 mb-1">
              Kata Sandi Baru
            </label>
            <div className="relative">
              <input
                id="sec-new-password"
                name="newPassword"
                type={showNewPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="w-full min-h-[44px] pl-3.5 pr-11 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#003d29] focus:border-[#003d29]"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword((prev) => !prev)}
                aria-label={showNewPassword ? 'Sembunyikan kata sandi baru' : 'Tampilkan kata sandi baru'}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 rounded p-1.5 cursor-pointer"
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {newPassword.length > 0 && (
              <div className="space-y-1.5 pt-2" aria-live="polite">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 font-medium">Kekuatan Sandi:</span>
                  <span className={`font-bold ${passwordStrength.color}`}>{passwordStrength.label}</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-200 ${passwordStrength.barColor}`}
                    style={{ width: `${Math.max(15, (passwordStrength.score / 4) * 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          <div>
            <label htmlFor="sec-confirm-password" className="block text-[11px] font-semibold text-slate-700 mb-1">
              Konfirmasi Kata Sandi Baru
            </label>
            <div className="relative">
              <input
                id="sec-confirm-password"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full min-h-[44px] pl-3.5 pr-11 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#003d29] focus:border-[#003d29]"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                aria-label={showConfirmPassword ? 'Sembunyikan konfirmasi kata sandi' : 'Tampilkan konfirmasi kata sandi'}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 rounded p-1.5 cursor-pointer"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={passwordSaving || !newPassword || !currentPassword}
              className="min-h-[44px] px-6 py-2.5 rounded-full font-bold text-xs text-white bg-[#003d29] hover:bg-[#064e3b] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#003d29] transition-all cursor-pointer flex items-center justify-center gap-2 shadow-2xs disabled:opacity-50 motion-press active:scale-[0.96]"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{passwordSaving ? 'Memproses...' : 'Perbarui Kata Sandi'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* 2. Two-Step Verification (2FA / TOTP) Panel */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h2 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#003d29]" />
              <span>Autentikasi Dua Langkah (2FA)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Tambahkan lapisan keamanan ekstra dengan aplikasi autentikator standar (Google Authenticator, Authy, Microsoft).
            </p>
          </div>
          <div>
            {twoFactorLoading ? (
              <span className="text-xs text-slate-400">Memeriksa status...</span>
            ) : twoFactorStatus.enabled ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>2FA Aktif</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-slate-600 bg-slate-100 border border-slate-200">
                <span>Nonaktif</span>
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
          <div className="space-y-1">
            <div className="font-bold text-slate-900">
              {twoFactorStatus.enabled ? 'Akun Dilindungi dengan Kode OTP 6 Digit' : 'Lindungi Akun Anda dari Akses Tak Dikenal'}
            </div>
            <p className="text-slate-500 max-w-lg">
              {twoFactorStatus.enabled
                ? 'Aplikasi autentikator Anda akan meminta kode verifikasi saat Anda melakukan tindakan keamanan penting.'
                : 'Setelah diaktifkan, Anda akan memerlukan kode verifikasi 6 digit dari aplikasi autentikator Anda saat login.'}
            </p>
          </div>

          <div>
            {twoFactorStatus.enabled ? (
              <button
                type="button"
                onClick={() => {
                  setDisablePassword('');
                  setDisableError('');
                  setShowDisableModal(true);
                }}
                className="min-h-[40px] px-5 py-2 rounded-full border border-rose-300 text-rose-700 hover:bg-rose-50 font-bold text-xs transition-colors cursor-pointer shrink-0"
              >
                Nonaktifkan 2FA
              </button>
            ) : (
              <button
                type="button"
                onClick={startTwoFactorSetup}
                className="min-h-[40px] px-5 py-2 rounded-full bg-[#003d29] hover:bg-[#064e3b] text-white font-bold text-xs transition-colors cursor-pointer shadow-2xs shrink-0"
              >
                Aktifkan 2FA Sekarang
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. Active Sessions & Device Management Panel */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h2 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-[#003d29]" />
              <span>Sesi Login & Perangkat Aktif</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Daftar sesi browser dan token otentikasi Sanctum yang sedang memiliki akses ke akun Anda.
            </p>
          </div>

          {sessions.length > 1 && (
            <button
              type="button"
              onClick={handleRevokeOtherSessions}
              disabled={revokingOthers}
              className="min-h-[40px] px-4 py-2 rounded-full border border-rose-200 bg-rose-50/50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 shrink-0"
            >
              {revokingOthers ? 'Mencabut Sesi...' : 'Cabut Semua Sesi Lain'}
            </button>
          )}
        </div>

        {sessionsLoading ? (
          <div className="py-8 text-center text-xs text-slate-400">Memuat sesi login aktif...</div>
        ) : sessions.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">Tidak ada sesi aktif ditemukan.</div>
        ) : (
          <div className="space-y-3">
            {sessions.map((sess) => (
              <div
                key={sess.id}
                className={`p-4 rounded-2xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  sess.is_current
                    ? 'bg-emerald-50/40 border-emerald-300 shadow-2xs'
                    : 'bg-white border-slate-200/80 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    sess.is_current ? 'bg-emerald-100 text-[#003d29]' : 'bg-slate-100 text-slate-500'
                  }`}>
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{sess.name}</span>
                      {sess.is_current && (
                        <span className="text-[10px] font-bold text-[#003d29] bg-emerald-100 px-2 py-0.5 rounded-full">
                          Sesi Ini (Aktif)
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Dibuat: {formatDateTime(sess.created_at)}
                      {sess.last_used_at && ` · Terakhir aktif: ${formatDateTime(sess.last_used_at)}`}
                    </div>
                  </div>
                </div>

                {!sess.is_current && (
                  <button
                    type="button"
                    onClick={() => handleRevokeSession(sess.id)}
                    disabled={revokingSessionId === sess.id}
                    className="self-end sm:self-auto min-h-[36px] px-3.5 py-1.5 rounded-xl border border-slate-200 hover:bg-rose-50 hover:text-rose-600 text-slate-600 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>{revokingSessionId === sess.id ? 'Mencabut...' : 'Cabut Sesi'}</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2FA Setup Modal */}
      {showTwoFactorSetupModal && setupData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 shadow-xl space-y-4 text-left max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-sm">Pengaturan 2-Step Verification</h3>
              <button
                type="button"
                onClick={() => setShowTwoFactorSetupModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold p-1 cursor-pointer"
              >
                Tutup
              </button>
            </div>

            {totpModalError && (
              <div role="alert" className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{totpModalError}</span>
              </div>
            )}

            <div className="space-y-3 text-xs text-slate-600">
              <p>
                1. Buka aplikasi Authenticator Anda (Google Authenticator, Microsoft Authenticator, dll).
              </p>
              <p>
                2. Masukkan kode rahasia di bawah ini secara manual atau gunakan tautan otpauth:
              </p>
              <div className="p-3 bg-slate-100 rounded-xl font-mono text-center font-bold text-slate-900 tracking-wider flex items-center justify-between">
                <span>{setupData.secret}</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(setupData.secret);
                    setCopiedSecret(true);
                    setTimeout(() => setCopiedSecret(false), 2000);
                  }}
                  className="p-1 text-slate-500 hover:text-slate-800 cursor-pointer"
                  title="Salin Kunci"
                >
                  {copiedSecret ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              <div>
                <span className="font-bold text-slate-800">Kode Pemulihan Cadangan (Simpan di Tempat Aman):</span>
                <div className="grid grid-cols-2 gap-1.5 p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[11px] mt-1">
                  {setupData.recovery_codes.map((rc, idx) => (
                    <span key={idx} className="text-slate-700">{rc}</span>
                  ))}
                </div>
              </div>

              <form onSubmit={confirmTwoFactorActivation} className="space-y-3 pt-2">
                <div>
                  <label htmlFor="modal-totp-code" className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Masukkan Kode 6 Digit dari Aplikasi Authenticator
                  </label>
                  <input
                    id="modal-totp-code"
                    type="text"
                    maxLength={6}
                    value={totpCodeInput}
                    onChange={(e) => setTotpCodeInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    required
                    className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-slate-200 text-center tracking-widest text-lg font-bold focus:outline-none focus:ring-2 focus:ring-[#003d29]"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowTwoFactorSetupModal(false)}
                    className="min-h-[40px] px-4 py-2 rounded-full border border-slate-200 text-slate-600 font-semibold cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={totpSubmitting || totpCodeInput.length !== 6}
                    className="min-h-[40px] px-5 py-2 rounded-full bg-[#003d29] text-white font-bold cursor-pointer disabled:opacity-50"
                  >
                    {totpSubmitting ? 'Memverifikasi...' : 'Konfirmasi & Aktifkan'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Disable 2FA Modal */}
      {showDisableModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-sm w-full border border-slate-200 shadow-xl space-y-4 text-left">
            <h3 className="font-extrabold text-slate-900 text-sm">Nonaktifkan 2FA</h3>
            <p className="text-xs text-slate-500">
              Masukkan kata sandi akun Anda untuk mengonfirmasi penonaktifan autentikasi dua langkah.
            </p>

            {disableError && (
              <div role="alert" className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{disableError}</span>
              </div>
            )}

            <form onSubmit={handleDisableTwoFactor} className="space-y-4 text-xs">
              <div>
                <label htmlFor="disable-2fa-pass" className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Kata Sandi Akun
                </label>
                <input
                  id="disable-2fa-pass"
                  type="password"
                  value={disablePassword}
                  onChange={(e) => setDisablePassword(e.target.value)}
                  required
                  className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#003d29]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDisableModal(false)}
                  className="min-h-[40px] px-4 py-2 rounded-full border border-slate-200 text-slate-600 font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={disableSubmitting || !disablePassword}
                  className="min-h-[40px] px-5 py-2 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer disabled:opacity-50"
                >
                  {disableSubmitting ? 'Memproses...' : 'Ya, Nonaktifkan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
