import { ReactNode } from 'react';

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
    <div className="glass-card p-4 flex items-start gap-3 min-w-0">
      <div className={`p-2.5 rounded-xl bg-[var(--bg-secondary)] ${color} shrink-0`}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-1">{label}</p>
        <div className="flex items-baseline gap-1.5">
          {pulse && (
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 pulse-live shrink-0 mt-1" />
          )}
          <span className="text-xl font-bold text-[var(--text-primary)] truncate">{value}</span>
          {unit && <span className="text-xs text-[var(--text-muted)]">{unit}</span>}
        </div>
      </div>
    </div>
  );
}
