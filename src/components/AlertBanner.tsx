import { AlertTriangle, ShieldCheck } from 'lucide-react';

interface AlertBannerProps {
  accidentDetected: boolean;
  onUserSafe: () => void;
  countdownSeconds?: number;
}

export default function AlertBanner({ accidentDetected, onUserSafe, countdownSeconds }: AlertBannerProps) {
  if (!accidentDetected) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="alert-banner-danger rounded-2xl px-5 py-4 flex items-center gap-4 mb-2"
      style={{
        background: 'linear-gradient(135deg, rgba(248, 113, 113, 0.12), rgba(251, 146, 60, 0.08))',
        border: '1px solid rgba(248, 113, 113, 0.3)',
      }}
    >
      <div
        className="p-3 rounded-xl flex-shrink-0"
        style={{ background: 'rgba(248, 113, 113, 0.15)' }}
      >
        <AlertTriangle size={24} style={{ color: 'var(--color-red)' }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-base font-bold" style={{ color: 'var(--color-red)' }}>
          Incident Detected
        </p>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
          Unusual impact detected from your helmet.
          {countdownSeconds !== undefined && countdownSeconds > 0 && (
            <span style={{ color: 'var(--color-amber)' }}>
              {' '}Alert in {countdownSeconds}s
            </span>
          )}
        </p>
      </div>
      <button
        onClick={onUserSafe}
        className="btn-press flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all flex-shrink-0"
        style={{
          background: 'rgba(52, 211, 153, 0.15)',
          color: 'var(--color-emerald)',
          border: '1px solid rgba(52, 211, 153, 0.3)',
        }}
      >
        <ShieldCheck size={16} />
        I'm Safe
      </button>
    </div>
  );
}
