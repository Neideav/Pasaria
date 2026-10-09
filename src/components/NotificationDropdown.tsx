import React, { useState, useEffect, useRef } from 'react';
import { Bell, Package } from 'lucide-react';
import { NotificationItem } from '../types';
import { api } from '../services/api';
import { formatDateTime } from '../utils/formatters';

export const NotificationDropdown: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadNotifications();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const list = await api.getNotifications();
      setNotifications(list || []);
    } catch (e) {
      console.warn('Load notifications note:', e);
    } finally {
      setLoading(false);
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleMarkAsRead = async (id: number) => {
    try {
      await api.markNotificationAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (e) {
      console.warn('Mark as read note:', e);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (e) {
      console.warn('Mark all note:', e);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Motion Point #7 & #8: Trigger Button with .motion-press and Badge Pop */}
      <button
        type="button"
        onClick={() => {
          setOpen(!open);
          if (!open) loadNotifications();
        }}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={`Notifikasi, ${unreadCount} pesan belum dibaca`}
        className="motion-press relative w-11 h-11 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#003d29] focus-visible:ring-offset-2 shrink-0"
        title="Notifikasi"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span
            key={unreadCount}
            className="motion-badge-pop absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white pointer-events-none"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Motion Point #8: Notification dropdown popover origin anchor (top right, 180ms var(--ease-out)) */}
      {open && (
        <div
          role="dialog"
          aria-label="Panel Notifikasi"
          className="motion-popover absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-100 py-3 z-50 text-left"
          style={{ transformOrigin: 'top right' }}
        >
          <div className="px-4 pb-2 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-900">Notifikasi</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600">
                  {unreadCount} Baru
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                className="motion-press text-[11px] font-semibold text-[#003d29] hover:underline cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-[#003d29] rounded"
              >
                Tandai Semua Dibaca
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y border-t border-slate-100 divide-slate-100">
            {loading ? (
              <div className="py-8 text-center text-xs text-slate-400">Memuat notifikasi...</div>
            ) : notifications.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">Tidak ada notifikasi saat ini.</div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => !n.is_read && handleMarkAsRead(n.id)}
                  className={`motion-press p-3.5 hover:bg-slate-50 transition-colors cursor-pointer flex items-start gap-3 ${
                    !n.is_read ? 'bg-emerald-50/40' : ''
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-[#003d29] flex items-center justify-center shrink-0 mt-0.5">
                    <Package className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs font-bold text-slate-900 truncate">{n.title}</span>
                      {!n.is_read && (
                        <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                      {n.message}
                    </p>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      {formatDateTime(n.created_at)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
