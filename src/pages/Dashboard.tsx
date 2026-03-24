import { memo, useEffect } from 'react';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Battery,
  Thermometer,
  Gauge,
  MapPin,
  Radio,
} from 'lucide-react';
import AlertBanner from '../components/AlertBanner';
import GlassCard from '../components/GlassCard';
import EmptyState from '../components/EmptyState';
import ConnectionPanel from '../components/ConnectionPanel';
import SimulationControls from '../components/SimulationControls';
import { useAppContext } from '../context/AppContext';
import { useAccidentDetection } from '../hooks/useAccidentDetection';

/* ───────── Dashboard ───────── */
const Dashboard = memo(function Dashboard() {
  const { sensorData, dataMode, isStreaming, setIsStreaming, connectionStatus, activeScenario, triggerScenario } = useAppContext();
  const accidentState = useAccidentDetection(sensorData);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.altKey) {
        if (e.key === 's' || e.key === 'S') {
          e.preventDefault();
          accidentState.markUserSafe();
        } else if (e.key === 'p' || e.key === 'P') {
          e.preventDefault();
          setIsStreaming(!isStreaming);
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [accidentState, isStreaming, setIsStreaming]);

  // Hardware mode — no data yet
  if (dataMode === 'hardware' && !sensorData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 animate-fade-in-up">
        <ConnectionPanel />
        {connectionStatus === 'connected' && (
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full pulse-live" style={{ background: 'var(--color-emerald)' }} />
            <span className="text-sm font-medium" style={{ color: 'var(--color-emerald)' }}>Connected — awaiting sensor data</span>
          </div>
        )}
      </div>
    );
  }

  // Still loading
  if (!sensorData) {
    return (
      <EmptyState
        icon={<Radio size={32} style={{ color: 'var(--color-blue)' }} />}
        title="Initializing Sensors"
        message="Establishing connection to simulation engine…"
      />
    );
  }

  const d = sensorData;
  const isAccident = accidentState.isAccidentActive;
  const battLevel = d.batteryLevel;
  const temp = d.temperature;
  const speed = d.gps.speed;

  return (
    <div className="grid gap-6 max-w-3xl mx-auto">
      {/* ── Alert Banner ── */}
      <AlertBanner
        accidentDetected={d.accidentDetected}
        onUserSafe={accidentState.markUserSafe}
      />

      {/* ── Hero Status Card ── */}
      <GlassCard
        className={`p-8 text-center ${isAccident ? 'emergency-panel-alert' : ''}`}
        style={isAccident ? { borderColor: 'var(--color-red)', borderWidth: '2px' } : undefined}
      >
        <div className="flex flex-col items-center gap-4">
          {/* Icon */}
          <div
            className={`w-20 h-20 rounded-2xl flex items-center justify-center ${isAccident ? 'animate-slow-pulse' : ''}`}
            style={{
              background: isAccident ? 'var(--status-red-bg)' : 'var(--status-emerald-bg)',
            }}
          >
            {isAccident
              ? <ShieldAlert size={40} style={{ color: 'var(--color-red)' }} />
              : <Shield size={40} style={{ color: 'var(--color-emerald)' }} />
            }
          </div>

          {/* Status Text */}
          <div>
            <h1
              className="text-2xl md:text-3xl font-extrabold"
              style={{ color: isAccident ? 'var(--color-red)' : 'var(--color-emerald)' }}
            >
              {isAccident ? 'ACCIDENT DETECTED' : "You're Safe"}
            </h1>
            <p className="text-sm mt-1.5" style={{ color: 'var(--text-muted)' }}>
              {isAccident
                ? `Impact detected • ${accidentState.elapsedSeconds}s ago • Tap below if you're okay`
                : 'All systems normal — helmet is monitoring'}
            </p>
          </div>

          {/* I'm Safe Button (only during accident) */}
          {isAccident && (
            <button
              onClick={accidentState.markUserSafe}
              className="mt-2 px-8 py-4 rounded-2xl text-base font-bold text-white transition-all hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400"
              style={{ background: 'linear-gradient(135deg, #059669, #10b981)', minHeight: '56px' }}
            >
              <ShieldCheck size={20} className="inline mr-2 -mt-0.5" />
              I'm Safe
            </button>
          )}
        </div>
      </GlassCard>

      {/* ── 3 Key Metrics ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 stagger-children">
        {/* Battery */}
        <MetricCard
          icon={<Battery size={24} />}
          label="Battery"
          value={`${battLevel}%`}
          sublabel={battLevel > 60 ? 'Healthy' : battLevel > 25 ? 'Charge soon' : 'Low!'}
          status={battLevel > 40 ? 'good' : battLevel > 15 ? 'warning' : 'critical'}
        >
          <div className="w-full h-2 rounded-full overflow-hidden mt-2" style={{ background: 'var(--border-color)' }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${battLevel}%`,
                background: battLevel > 40 ? 'var(--color-emerald)' : battLevel > 15 ? 'var(--color-amber)' : 'var(--color-red)',
              }}
            />
          </div>
        </MetricCard>

        {/* Temperature */}
        <MetricCard
          icon={<Thermometer size={24} />}
          label="Temperature"
          value={`${temp}°C`}
          sublabel={temp < 40 ? 'Normal' : temp < 55 ? 'Warm' : 'Hot!'}
          status={temp < 40 ? 'good' : temp < 55 ? 'warning' : 'critical'}
        />

        {/* Speed */}
        <MetricCard
          icon={<Gauge size={24} />}
          label="Speed"
          value={`${speed.toFixed(0)}`}
          unit="km/h"
          sublabel={speed === 0 ? 'Stationary' : speed < 60 ? 'City speed' : 'Highway speed'}
          status="good"
        />
      </div>

      {/* ── Location Strip ── */}
      <GlassCard className="flex items-center gap-3 px-5 py-4">
        <div className="p-2 rounded-xl" style={{ background: 'var(--status-blue-bg)' }}>
          <MapPin size={18} style={{ color: 'var(--color-blue)' }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            Location
          </p>
          <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
            {d.gps.latitude.toFixed(4)}°, {d.gps.longitude.toFixed(4)}°
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="w-2 h-2 rounded-full pulse-live" style={{ background: 'var(--color-emerald)' }} />
          <span className="text-xs font-medium" style={{ color: 'var(--color-emerald)' }}>
            {isStreaming ? 'Live' : 'Paused'}
          </span>
        </div>
      </GlassCard>

      {/* ── Simulation Controls (only in sim mode) ── */}
      {dataMode === 'simulation' && (
        <SimulationControls
          activeScenario={activeScenario}
          onTriggerScenario={triggerScenario}
          onUserSafe={accidentState.markUserSafe}
        />
      )}
    </div>
  );
});

/* ── MetricCard sub-component ── */
function MetricCard({
  icon,
  label,
  value,
  unit,
  sublabel,
  status,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit?: string;
  sublabel: string;
  status: 'good' | 'warning' | 'critical';
  children?: React.ReactNode;
}) {
  const colorMap = {
    good: 'var(--color-emerald)',
    warning: 'var(--color-amber)',
    critical: 'var(--color-red)',
  };
  const bgMap = {
    good: 'var(--status-emerald-bg)',
    warning: 'var(--status-amber-bg)',
    critical: 'var(--status-red-bg)',
  };
  const color = colorMap[status];
  const bg = bgMap[status];

  return (
    <GlassCard className="p-5 flex flex-col gap-3 status-card-hover">
      <div className="flex items-center gap-2.5">
        <div className="p-2 rounded-xl" style={{ background: bg }}>
          <span style={{ color }}>{icon}</span>
        </div>
        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          {label}
        </span>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-3xl font-extrabold" style={{ color: 'var(--text-primary)' }}>
          {value}
        </span>
        {unit && (
          <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
            {unit}
          </span>
        )}
      </div>
      <span className="text-xs font-medium" style={{ color }}>
        {sublabel}
      </span>
      {children}
    </GlassCard>
  );
}

export default Dashboard;
