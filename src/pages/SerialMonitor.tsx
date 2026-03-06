import { useEffect, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import GlassCard from '../components/GlassCard';
import { Terminal, Circle } from 'lucide-react';
import type { LogEntry } from '../types';

function LogLine({ entry }: { entry: LogEntry }) {
  const colorMap: Record<string, string> = {
    info: 'text-blue-400',
    success: 'text-emerald-400',
    warning: 'text-amber-400',
    error: 'text-red-400',
    command: 'text-cyan-300',
  };

  const time = new Date(entry.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <div className="flex gap-2 py-0.5 hover:bg-white/5 px-2 rounded transition-colors">
      <span className="text-[var(--text-muted)] shrink-0 w-20">{time}</span>
      <span className={`${colorMap[entry.type] || 'text-gray-400'}`}>{entry.message}</span>
    </div>
  );
}

export default function SerialMonitor() {
  const { logs, dataMode } = useAppContext();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Serial Monitor</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1.5">
            Live sensor data trace and system event log
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)]">
            <Circle size={8} className={dataMode === 'simulation' ? 'text-emerald-400 fill-emerald-400' : 'text-amber-400 fill-amber-400'} />
            <span className="text-xs font-medium text-[var(--text-muted)]">
              {dataMode === 'simulation' ? 'SIM MODE' : 'HW MODE'}
            </span>
          </div>
          <div className="px-3 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)]">
            <span className="text-xs font-medium text-[var(--text-muted)]">9600 baud</span>
          </div>
        </div>
      </div>

      {/* Terminal */}
      <GlassCard className="p-0 overflow-hidden">
        {/* Terminal header */}
        <div className="flex items-center gap-2.5 px-5 py-3 border-b border-[var(--glass-border)]" style={{ background: 'var(--bg-secondary)' }}>
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/70" />
            <div className="w-3 h-3 rounded-full bg-amber-500/70" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/70" />
          </div>
          <div className="flex-1 flex items-center justify-center gap-2">
            <Terminal size={13} className="text-[var(--text-muted)]" />
            <span className="text-[11px] font-medium text-[var(--text-muted)]">Serial Output — USB</span>
          </div>
        </div>

        {/* Terminal body */}
        <div
          ref={scrollRef}
          className="h-[520px] overflow-y-auto p-4 terminal-text text-xs leading-relaxed"
          style={{ background: 'var(--bg-primary)' }}
        >
          {/* Initial boot sequence */}
          <div className="text-[var(--text-muted)] mb-2 opacity-50">
            <p>═══════════════════════════════════════════</p>
            <p>  Smart Safety Helmet — Serial Monitor v1.0</p>
            <p>  GPS & Accident Detection System</p>
            <p>  Baud Rate: 9600 | Mode: {dataMode.toUpperCase()}</p>
            <p>═══════════════════════════════════════════</p>
            <p>&nbsp;</p>
          </div>

          {logs.length === 0 ? (
            <div className="text-[var(--text-muted)] animate-pulse">
              Waiting for data...
            </div>
          ) : (
            logs.map((entry, i) => <LogLine key={`${entry.timestamp}-${i}`} entry={entry} />)
          )}

          {/* Blinking cursor */}
          <div className="flex items-center gap-1 mt-1">
            <span className="text-emerald-400">{'>'}</span>
            <span className="w-2 h-4 bg-emerald-400/80 animate-pulse" />
          </div>
        </div>
      </GlassCard>

      {/* Legend */}
      <div className="flex flex-wrap gap-5 text-xs px-1">
        {[
          { color: 'text-emerald-400', bg: 'bg-emerald-400', label: 'Success' },
          { color: 'text-blue-400', bg: 'bg-blue-400', label: 'Info' },
          { color: 'text-amber-400', bg: 'bg-amber-400', label: 'Warning' },
          { color: 'text-red-400', bg: 'bg-red-400', label: 'Error' },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${item.bg}`} />
            <span className="text-[var(--text-muted)] font-medium">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
