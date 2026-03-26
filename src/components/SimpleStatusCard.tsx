import type { ReactNode } from 'react';

interface SimpleStatusCardProps {
  icon: ReactNode;
  label: string;
  status: 'good' | 'warning' | 'critical' | 'offline';
  statusText: string;
  detail?: string;
  children?: ReactNode;
}

const statusConfig = {
  good: {
    color: 'var(--color-emerald)',
    bg: 'rgba(52, 211, 153, 0.1)',
  },
  warning: {
    color: 'var(--color-amber)',
    bg: 'rgba(251, 191, 36, 0.1)',
  },
  critical: {
    color: 'var(--color-red)',
    bg: 'rgba(248, 113, 113, 0.1)',
  },
  offline: {
    color: 'var(--color-gray)',
    bg: 'rgba(107, 114, 128, 0.1)',
  },
};

export default function SimpleStatusCard({
  icon,
  label,
  status,
  statusText,
  detail,
  children,
}: SimpleStatusCardProps) {
  const cfg = statusConfig[status];

  return (
    <div className="status-card">
      {/* Icon */}
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5"
        style={{ background: cfg.bg }}
      >
        <span style={{ color: cfg.color }}>{icon}</span>
      </div>

      {/* Label */}
      <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
        {label}
      </p>

      {/* Status line */}
      <div className="flex items-center gap-2.5 mb-1">
        <span
          className="w-2.5 h-2.5 rounded-full flex-shrink-0 status-dot-pulse"
          style={{ background: cfg.color }}
        />
        <span className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
          {statusText}
        </span>
      </div>

      {/* Detail */}
      {detail && (
        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
          {detail}
        </p>
      )}

      {/* Optional children (e.g., battery bar) */}
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}
