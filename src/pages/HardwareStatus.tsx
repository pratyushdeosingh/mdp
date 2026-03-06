import type { ReactNode } from 'react';
import { Cpu, Radio, MapPin, Activity, Wrench, CheckCircle, Volume2, ToggleRight } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import StatusBadge from '../components/StatusBadge';
import { hardwareModules } from '../constants/hardware';

const iconMap: Record<string, ReactNode> = {
  cpu: <Cpu size={24} />,
  radio: <Radio size={24} />,
  'map-pin': <MapPin size={24} />,
  activity: <Activity size={24} />,
  buzzer: <Volume2 size={24} />,
  button: <ToggleRight size={24} />,
};

export default function HardwareStatus() {
  const workingCount = hardwareModules.filter(m => m.status === 'working').length;
  const total = hardwareModules.length;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Hardware Status</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1.5">
            Module integration progress and diagnostics
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Modules Online</p>
            <p className="text-xl font-bold text-[var(--text-primary)]">
              {workingCount}<span className="text-[var(--text-muted)] font-normal">/{total}</span>
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <CheckCircle size={20} className="text-emerald-400" />
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-[var(--text-muted)] tracking-[0.15em] uppercase">Hardware Integration Progress</span>
          <span className="text-sm font-bold text-emerald-400">{Math.round((workingCount / total) * 100)}%</span>
        </div>
        <div className="w-full h-2.5 rounded-full bg-[var(--bg-secondary)] overflow-hidden border border-[var(--border-color)]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all duration-1000"
            style={{ width: `${(workingCount / total) * 100}%` }}
          />
        </div>
        <p className="text-xs text-[var(--text-muted)] mt-2.5">
          {workingCount} of {total} modules operational. All hardware components integrated and tested.
        </p>
      </GlassCard>

      {/* Module Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 stagger-children">
        {hardwareModules.map(mod => (
          <GlassCard key={mod.id} className="p-6">
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-xl shrink-0 border ${mod.status === 'working'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/15'
                    : mod.status === 'damaged' ? 'bg-red-500/10 text-red-400 border-red-500/15'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/15'
                  }`}>
                {iconMap[mod.icon]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <h3 className="text-sm font-semibold text-[var(--text-primary)]">{mod.name}</h3>
                  <StatusBadge status={mod.status} />
                </div>
                <p className="text-xs text-[var(--text-secondary)] mb-3 leading-relaxed">
                  {mod.description}
                </p>
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)]">
                  <Wrench size={12} className="text-[var(--text-muted)] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.15em] text-[var(--text-muted)] font-bold mb-0.5">
                      Status
                    </p>
                    <p className="text-xs text-[var(--text-secondary)]">{mod.nextAction}</p>
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Summary note */}
      <GlassCard className="p-6 border-emerald-500/15">
        <div className="flex items-start gap-4">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 shrink-0">
            <CheckCircle size={18} className="text-emerald-400" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-1.5">Integration Complete</h4>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              All hardware modules have been successfully integrated and tested. The system includes
              GPS tracking (NEO-6M), motion sensing (MPU6050), accident detection with buzzer alert,
              and a manual cancel button. The Arduino outputs JSON data via USB serial at 9600 baud,
              which is received by the Node.js bridge server and forwarded to this web dashboard
              via WebSocket in real-time.
            </p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
