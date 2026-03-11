import { Timer } from 'lucide-react';

interface AccidentTimerProps {
  elapsedSeconds: number;
  isActive: boolean;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function AccidentTimer({ elapsedSeconds, isActive }: AccidentTimerProps) {
  return (
    <div className={`flex flex-col items-center gap-2 ${isActive ? 'timer-active' : ''}`}>
      <div className="flex items-center gap-2">
        <Timer size={18} style={{ color: isActive ? 'var(--color-red)' : 'var(--text-muted)' }} />
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
          Time Since Accident
        </span>
      </div>
      <span
        className={`text-3xl font-mono font-bold tracking-wider ${isActive ? 'timer-digits' : ''}`}
        style={{ color: isActive ? 'var(--color-red)' : 'var(--text-muted)' }}
      >
        {formatTime(elapsedSeconds)}
      </span>
      {isActive && (
        <span className="text-xs font-medium animate-slow-pulse" style={{ color: 'var(--color-red)' }}>
          Timer Running...
        </span>
      )}
    </div>
  );
}
