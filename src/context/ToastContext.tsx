import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from 'react';
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

const ICONS = { success: CheckCircle, error: XCircle, warning: AlertTriangle, info: Info };
const COLORS: Record<ToastType, string> = {
  success: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400',
  error: 'border-red-500/40 bg-red-500/10 text-red-400',
  warning: 'border-amber-500/40 bg-amber-500/10 text-amber-400',
  info: 'border-blue-500/40 bg-blue-500/10 text-blue-400',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);

  const dismissToast = useCallback((id: number) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 300);
  }, []);

  const toast = useCallback((type: ToastType, message: string) => {
    const id = ++idRef.current;
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => dismissToast(id), 4000);
  }, [dismissToast]);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast container — bottom-right */}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none max-w-sm">
        {toasts.map(t => {
          const Icon = ICONS[t.type];
          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl border backdrop-blur-xl shadow-lg transition-all duration-300 ${COLORS[t.type]} ${t.exiting ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0 toast-slide-in'}`}
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
