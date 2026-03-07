interface StatusBadgeProps {
  status: 'online' | 'offline' | 'warning' | 'working' | 'damaged' | 'pending' | 'not-connected';
  size?: 'sm' | 'md';
}

const statusConfig: Record<string, { bgVar: string; colorVar: string; dotVar: string; label: string }> = {
  online:         { bgVar: 'var(--status-emerald-bg)', colorVar: 'var(--color-emerald)', dotVar: 'var(--color-emerald)', label: 'Online' },
  offline:        { bgVar: 'var(--status-red-bg)',     colorVar: 'var(--color-red)',     dotVar: 'var(--color-red)',     label: 'Offline' },
  warning:        { bgVar: 'var(--status-amber-bg)',   colorVar: 'var(--color-amber)',   dotVar: 'var(--color-amber)',   label: 'Warning' },
  working:        { bgVar: 'var(--status-emerald-bg)', colorVar: 'var(--color-emerald)', dotVar: 'var(--color-emerald)', label: 'Working' },
  damaged:        { bgVar: 'var(--status-red-bg)',     colorVar: 'var(--color-red)',     dotVar: 'var(--color-red)',     label: 'Damaged' },
  pending:        { bgVar: 'var(--status-amber-bg)',   colorVar: 'var(--color-amber)',   dotVar: 'var(--color-amber)',   label: 'Pending' },
  'not-connected': { bgVar: 'var(--status-gray-bg)',   colorVar: 'var(--color-gray)',    dotVar: 'var(--color-gray)',    label: 'Not Connected' },
};

export default function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const cfg = statusConfig[status] || statusConfig['offline'];
  const sizeClasses = size === 'md' ? 'px-3 py-1.5 text-sm' : 'px-2 py-0.5 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${sizeClasses}`}
      style={{ background: cfg.bgVar, color: cfg.colorVar }}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${status === 'online' || status === 'working' ? 'pulse-live' : ''}`}
        style={{ background: cfg.dotVar }}
      />
      {cfg.label}
    </span>
  );
}
