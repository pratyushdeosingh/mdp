import { createContext, useContext, useState, useCallback, useRef, useEffect, type ReactNode } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: number;
  type: ToastType;
  message: string;
  exiting?: boolean;
}

interface ToastContextType {
  toast: (type: ToastType, message: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

const TOAST_DURATION_MS = 4000;
const ANIMATION_DURATION_MS = 300;

const ICONS = { success: CheckCircle, error: XCircle, warning: AlertTriangle, info: Info };
const COLORS: Record<ToastType, { bg: string; border: string; text: string }> = {
  success: { bg: 'var(--status-emerald-bg)', border: 'var(--color-emerald)', text: 'var(--color-emerald)' },
  error:   { bg: 'var(--status-red-bg)',     border: 'var(--color-red)',     text: 'var(--color-red)' },
  warning: { bg: 'var(--status-amber-bg)',   border: 'var(--color-amber)',   text: 'var(--color-amber)' },
  info:    { bg: 'var(--status-blue-bg)',     border: 'var(--color-blue)',    text: 'var(--color-blue)' },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);
  const timersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const dismissToast = useCallback((id: number) => {
    timersRef.current.delete(id);
    setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), ANIMATION_DURATION_MS);
  }, []);

  const toast = useCallback((type: ToastType, message: string) => {
    const id = ++idRef.current;
    setToasts(prev => [...prev, { id, type, message }]);
    const timer = setTimeout(() => dismissToast(id), TOAST_DURATION_MS);
    timersRef.current.set(id, timer);
  }, [dismissToast]);

  // Cleanup all timers on unmount
  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach(clearTimeout);
      timers.clear();
    };
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast container — bottom-right */}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none max-w-sm">
        {toasts.map(t => {
          const Icon = ICONS[t.type];
          const color = COLORS[t.type];
          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl border backdrop-blur-xl shadow-lg transition-all duration-300 ${t.exiting ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0 toast-slide-in'}`}
              style={{
                background: color.bg,
                borderColor: color.border,
                color: color.text,
              }}
            >
              <Icon size={18} className="shrink-0 mt-0.5" />
              <span className="text-sm font-medium text-[var(--text-primary)] flex-1">{t.message}</span>
              <button
                onClick={() => dismissToast(t.id)}
                className="shrink-0 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextType {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
