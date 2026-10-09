import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
  ReactNode,
} from "react";
import { ToastItem, ToastType } from "../types/toast";
import { ToastContainer } from "../components/ToastContainer";

export interface ToastOptions {
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number;
}

export interface ToastContextType {
  showToast: (
    message: string,
    type?: ToastType,
    options?: ToastOptions,
  ) => string;
  dismissToast: (id: string) => void;
  toasts: ToastItem[];
}

export const ToastContext = createContext<ToastContextType | undefined>(
  undefined,
);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );
  const exitTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );

  const dismissToast = useCallback((id: string) => {
    // Clear auto-dismiss timer if pending
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }

    // Set exit state so animation can play (200ms var(--ease-out))
    setToasts((prev) => {
      const target = prev.find((item) => item.id === id);
      if (!target || target.isExiting) return prev;
      return prev.map((item) =>
        item.id === id ? { ...item, isExiting: true } : item,
      );
    });

    // Remove from DOM after exit animation completes
    if (!exitTimersRef.current.has(id)) {
      const exitTimer = setTimeout(() => {
        setToasts((prev) => prev.filter((item) => item.id !== id));
        exitTimersRef.current.delete(id);
      }, 200);
      exitTimersRef.current.set(id, exitTimer);
    }
  }, []);

  const showToast = useCallback(
    (
      message: string,
      type: ToastType = "info",
      options?: ToastOptions,
    ): string => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const duration =
        options?.duration !== undefined ? options.duration : 4000;

      const newToast: ToastItem = {
        id,
        type,
        message,
        action: options?.action,
        duration,
        isExiting: false,
      };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        const timer = setTimeout(() => {
          dismissToast(id);
        }, duration);
        timersRef.current.set(id, timer);
      }

      return id;
    },
    [dismissToast],
  );

  useEffect(() => {
    const currentTimers = timersRef.current;
    const currentExitTimers = exitTimersRef.current;
    return () => {
      currentTimers.forEach((timer) => clearTimeout(timer));
      currentTimers.clear();
      currentExitTimers.forEach((timer) => clearTimeout(timer));
      currentExitTimers.clear();
    };
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, dismissToast, toasts }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
};

export function useToast(): ToastContextType {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
