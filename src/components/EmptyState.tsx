import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  message: string;
  action?: ReactNode;
}

export default function EmptyState({ icon, title, message, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 animate-fade-in-up">
      <div className="p-5 rounded-2xl border border-[var(--border-color)]" style={{ background: 'var(--glass-bg)' }}>
        {icon}
      </div>
      <h2 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h2>
      <p className="text-sm text-[var(--text-muted)] text-center max-w-sm">{message}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
