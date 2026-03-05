import { Cpu, Radio, MapPin, Activity, Wrench, CheckCircle, Volume2, ToggleRight } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import StatusBadge from '../components/StatusBadge';
import { hardwareModules } from '../constants/hardware';

const iconMap: Record<string, React.ReactNode> = {
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Hardware Status</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Module integration progress and diagnostics
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs text-[var(--text-muted)]">Modules Online</p>
            <p className="text-lg font-bold text-[var(--text-primary)]">
              {workingCount}/{total}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <CheckCircle size={20} className="text-emerald-400" />
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <GlassCard>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-[var(--text-primary)]">Hardware Integration Progress</span>
          <span className="text-sm font-bold text-emerald-400">{Math.round((workingCount / total) * 100)}%</span>
        </div>
        <div className="w-full h-3 rounded-full bg-[var(--bg-secondary)] overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all duration-1000"
            style={{ width: `${(workingCount / total) * 100}%` }}
          />
        </div>
        <p className="text-xs text-[var(--text-muted)] mt-2">
          {workingCount} of {total} modules operational. All hardware components integrated and tested.
        </p>
      </GlassCard>

      {/* Module Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 stagger-children">
        {hardwareModules.map(mod => (
          <GlassCard key={mod.id}>
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl shrink-0 bg-emerald-500/10 text-emerald-400">
                {iconMap[mod.icon]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-semibold text-[var(--text-primary)]">{mod.name}</h3>
                  <StatusBadge status={mod.status} />
                </div>
                <p className="text-xs text-[var(--text-secondary)] mb-3 leading-relaxed">
                  {mod.description}
                </p>
                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-[var(--bg-secondary)]">
                  <Wrench size={12} className="text-[var(--text-muted)] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-medium mb-0.5">
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
      <GlassCard className="border-emerald-500/20">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10">
            <CheckCircle size={16} className="text-emerald-400" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-1">Integration Complete</h4>
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
