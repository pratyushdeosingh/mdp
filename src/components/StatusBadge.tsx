interface StatusBadgeProps {
  status: 'online' | 'offline' | 'warning' | 'working' | 'damaged' | 'pending' | 'not-connected';
  size?: 'sm' | 'md';
}

const statusConfig: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  online:         { bg: 'bg-emerald-500/15', text: 'text-emerald-400', dot: 'bg-emerald-400', label: 'Online' },
  offline:        { bg: 'bg-red-500/15',     text: 'text-red-400',     dot: 'bg-red-400',     label: 'Offline' },
  warning:        { bg: 'bg-amber-500/15',   text: 'text-amber-400',   dot: 'bg-amber-400',   label: 'Warning' },
  working:        { bg: 'bg-emerald-500/15', text: 'text-emerald-400', dot: 'bg-emerald-400', label: 'Working' },
  damaged:        { bg: 'bg-red-500/15',     text: 'text-red-400',     dot: 'bg-red-400',     label: 'Damaged' },
  pending:        { bg: 'bg-amber-500/15',   text: 'text-amber-400',   dot: 'bg-amber-400',   label: 'Pending' },
  'not-connected': { bg: 'bg-gray-500/15',   text: 'text-gray-400',    dot: 'bg-gray-400',    label: 'Not Connected' },
};

export default function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const cfg = statusConfig[status] || statusConfig['offline'];
  const sizeClasses = size === 'md' ? 'px-3 py-1.5 text-sm' : 'px-2 py-0.5 text-xs';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-medium ${cfg.bg} ${cfg.text} ${sizeClasses}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${status === 'online' || status === 'working' ? 'pulse-live' : ''}`} />
      {cfg.label}
    </span>
  );
}
