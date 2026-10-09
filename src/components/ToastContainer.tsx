import React from "react";
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  X,
} from "lucide-react";
import { ToastItem, ToastType } from "../types/toast";

export interface ToastContainerProps {
  toasts?: ToastItem[];
  onDismiss?: (id: string) => void;
}

const getToastIcon = (type: ToastType) => {
  switch (type) {
    case "success":
      return (
        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
      );
    case "error":
      return <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />;
    case "warning":
      return (
        <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
      );
    case "info":
    default:
      return <Info className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />;
  }
};

const getToastBorderClass = (type: ToastType) => {
  switch (type) {
    case "success":
      return "border-emerald-200 bg-white text-slate-800 shadow-emerald-950/5";
    case "error":
      return "border-rose-200 bg-white text-slate-800 shadow-rose-950/5";
    case "warning":
      return "border-amber-200 bg-white text-slate-800 shadow-amber-950/5";
    case "info":
    default:
      return "border-sky-200 bg-white text-slate-800 shadow-sky-950/5";
  }
};

const getToastProgressColor = (type: ToastType) => {
  switch (type) {
    case "success":
      return "bg-emerald-500";
    case "error":
      return "bg-rose-500";
    case "warning":
      return "bg-amber-500";
    case "info":
    default:
      return "bg-sky-500";
  }
};

export const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts = [],
  onDismiss = () => {},
}) => {
  if (!toasts || toasts.length === 0) {
    return null;
  }

  return (
    <div
      aria-live="polite"
      role="status"
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
    >
      {toasts.map((toast) => {
        const isExiting = Boolean(toast.isExiting);
        const duration = toast.duration !== undefined ? toast.duration : 4000;

        return (
          <div
            key={toast.id}
            role="status"
            aria-live="polite"
            className={`pointer-events-auto relative overflow-hidden group flex items-start gap-3 p-3.5 pb-4 rounded-xl border shadow-lg ${
              isExiting ? "motion-toast-exit" : "motion-toast-enter"
            } ${getToastBorderClass(toast.type)}`}
          >
            {getToastIcon(toast.type)}

            <div className="flex-1 min-w-0 pt-0.5">
              <p className="text-sm font-medium leading-snug break-words text-slate-800">
                {toast.message}
              </p>

              {toast.action && (
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      toast.action?.onClick();
                      onDismiss(toast.id);
                    }}
                    className="inline-flex items-center justify-center text-xs font-semibold px-2.5 py-1 rounded-lg bg-[#003d29] text-white hover:bg-[#00281b] transition-colors shadow-xs cursor-pointer motion-press"
                  >
                    {toast.action.label}
                  </button>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              aria-label="Tutup notifikasi"
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors shrink-0 cursor-pointer motion-press"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Motion Point #31: Toast Timeout Progress Bar (linear width 100% -> 0%) */}
            {duration > 0 && !isExiting && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-100/80 overflow-hidden">
                <div
                  className={`h-full motion-toast-progress ${getToastProgressColor(
                    toast.type,
                  )}`}
                  style={{ animationDuration: `${duration}ms` }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
