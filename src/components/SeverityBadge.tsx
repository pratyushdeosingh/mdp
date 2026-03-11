import type { ImpactSeverity } from '../types';

interface SeverityBadgeProps {
  severity: ImpactSeverity;
  size?: 'sm' | 'lg';
}

const severityConfig: Record<ImpactSeverity, { color: string; bg: string; label: string }> = {
  none:   { color: 'var(--color-gray)',    bg: 'var(--status-gray-bg)',    label: 'None' },
  low:    { color: 'var(--color-emerald)', bg: 'var(--status-emerald-bg)', label: 'Low Impact' },
  medium: { color: 'var(--color-amber)',   bg: 'var(--status-amber-bg)',   label: 'Medium Impact' },
  high:   { color: '#f97316',              bg: 'rgba(249, 115, 22, 0.15)', label: 'High Impact' },
  severe: { color: 'var(--color-red)',     bg: 'var(--status-red-bg)',     label: 'Severe Crash' },
};

export default function SeverityBadge({ severity, size = 'sm' }: SeverityBadgeProps) {
  const cfg = severityConfig[severity];
  const isLarge = size === 'lg';

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full font-bold ${
        isLarge ? 'px-4 py-2 text-base' : 'px-3 py-1 text-xs'
      } ${severity === 'severe' || severity === 'high' ? 'severity-pulse' : ''}`}
      style={{ background: cfg.bg, color: cfg.color }}
    >
      <span
        className={`rounded-full ${isLarge ? 'w-2.5 h-2.5' : 'w-2 h-2'} ${
          severity !== 'none' ? 'pulse-live' : ''
        }`}
        style={{ background: cfg.color }}
      />
      {cfg.label}
    </span>
  );
}
