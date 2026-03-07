import type { ReactNode } from 'react';

interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  icon: ReactNode;
  color?: string;
  pulse?: boolean;
}

export default function MetricCard({ label, value, unit, icon, color = 'var(--color-blue)', pulse }: MetricCardProps) {
  return (
    <div className="glass-card p-5 flex flex-col gap-4 min-w-0 relative overflow-hidden group">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-[var(--bg-secondary)] shrink-0 group-hover:scale-110 transition-transform duration-300" style={{ color }}>
          {icon}
        </div>
        <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-widest truncate">{label}</p>
        {pulse && (
          <span className="ml-auto inline-block w-2 h-2 rounded-full pulse-live shrink-0" style={{ background: 'var(--color-emerald)' }} />
        )}
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl leading-tight font-bold text-[var(--text-primary)] truncate">{value}</span>
        {unit && <span className="text-xs font-medium text-[var(--text-muted)]">{unit}</span>}
      </div>
    </div>
  );
}

