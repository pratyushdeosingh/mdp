import type { ReactNode } from 'react';

interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  icon: ReactNode;
  color?: string;
  pulse?: boolean;
}

export default function MetricCard({ label, value, unit, icon, color = 'text-blue-400', pulse }: MetricCardProps) {
  return (
    <div className="glass-card p-6 flex flex-col justify-between min-w-0 relative overflow-hidden">
      <div className="flex items-center gap-3">
        <div className={`p-2.5 rounded-xl bg-[var(--bg-secondary)] ${color} shrink-0`}>
          {icon}
        </div>
        <p className="text-sm font-medium text-[var(--text-secondary)] uppercase tracking-wider truncate">{label}</p>
      </div>
      <div className="flex items-baseline gap-2 mt-2">
        {pulse && (
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 pulse-live shrink-0 mt-1" />
        )}
        <span className="text-xl leading-tight font-bold text-[var(--text-primary)] truncate">{value}</span>
        {unit && <span className="text-xs font-medium text-[var(--text-muted)]">{unit}</span>}
      </div>
    </div>
  );
}

