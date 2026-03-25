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
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* ── Alert Banner ── */}
      <AlertBanner
        accidentDetected={d.accidentDetected}
        onUserSafe={accidentState.markUserSafe}
      />

      {/* ── Main Grid: Hero + Metrics Side-by-Side on large screens ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hero Status Card - takes 2 columns on large screens */}
        <GlassCard
          className={`lg:col-span-2 p-8 ${isAccident ? 'emergency-panel-alert' : ''}`}
          style={isAccident ? { borderColor: 'var(--color-red)', borderWidth: '2px' } : undefined}
        >
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Icon */}
            <div
              className={`w-24 h-24 rounded-2xl flex items-center justify-center shrink-0 ${isAccident ? 'animate-slow-pulse' : ''}`}
              style={{
                background: isAccident ? 'var(--status-red-bg)' : 'var(--status-emerald-bg)',
              }}
            >
              {isAccident
                ? <ShieldAlert size={48} style={{ color: 'var(--color-red)' }} />
                : <Shield size={48} style={{ color: 'var(--color-emerald)' }} />
              }
            </div>

            {/* Status Text */}
            <div className="text-center sm:text-left flex-1">
              <h1
                className="text-2xl md:text-3xl lg:text-4xl font-extrabold"
                style={{ color: isAccident ? 'var(--color-red)' : 'var(--color-emerald)' }}
              >
                {isAccident ? 'ACCIDENT DETECTED' : "You're Safe"}
              </h1>
              <p className="text-sm md:text-base mt-2" style={{ color: 'var(--text-muted)' }}>
                {isAccident
                  ? `Impact detected • ${accidentState.elapsedSeconds}s ago`
                  : 'All systems normal — helmet is actively monitoring'}
              </p>

              {/* I'm Safe Button (only during accident) */}
              {isAccident && (
                <button
                  onClick={accidentState.markUserSafe}
                  className="mt-4 px-8 py-4 rounded-2xl text-base font-bold text-white transition-all hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400"
                  style={{ background: 'linear-gradient(135deg, #059669, #10b981)', minHeight: '56px' }}
                >
                  <ShieldCheck size={20} className="inline mr-2 -mt-0.5" />
                  I'm Safe
                </button>
              )}
            </div>
          </div>
        </GlassCard>

        {/* Quick Stats Column - stacked on right side */}
        <div className="flex flex-col gap-4">
          {/* Battery */}
          <GlassCard className="p-5 flex-1 status-card-hover">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl" style={{ background: battLevel > 40 ? 'var(--status-emerald-bg)' : battLevel > 15 ? 'var(--status-amber-bg)' : 'var(--status-red-bg)' }}>
                <Battery size={22} style={{ color: battLevel > 40 ? 'var(--color-emerald)' : battLevel > 15 ? 'var(--color-amber)' : 'var(--color-red)' }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Battery</p>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-2xl font-extrabold" style={{ color: 'var(--text-primary)' }}>{battLevel}%</span>
                  <span className="text-xs font-medium" style={{ color: battLevel > 40 ? 'var(--color-emerald)' : battLevel > 15 ? 'var(--color-amber)' : 'var(--color-red)' }}>
                    {battLevel > 60 ? 'Healthy' : battLevel > 25 ? 'Charge soon' : 'Low!'}
                  </span>
                </div>
              </div>
            </div>
            <div className="w-full h-2 rounded-full overflow-hidden mt-3" style={{ background: 'var(--border-color)' }}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${battLevel}%`,
                  background: battLevel > 40 ? 'var(--color-emerald)' : battLevel > 15 ? 'var(--color-amber)' : 'var(--color-red)',
                }}
              />
            </div>
          </GlassCard>

          {/* Temperature & Speed Row */}
          <div className="grid grid-cols-2 gap-4">
            <GlassCard className="p-4 status-card-hover">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 rounded-xl" style={{ background: temp < 40 ? 'var(--status-emerald-bg)' : temp < 55 ? 'var(--status-amber-bg)' : 'var(--status-red-bg)' }}>
                  <Thermometer size={18} style={{ color: temp < 40 ? 'var(--color-emerald)' : temp < 55 ? 'var(--color-amber)' : 'var(--color-red)' }} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Temp</span>
              </div>
              <p className="text-2xl font-extrabold" style={{ color: 'var(--text-primary)' }}>{temp}°C</p>
            </GlassCard>

            <GlassCard className="p-4 status-card-hover">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 rounded-xl" style={{ background: 'var(--status-blue-bg)' }}>
                  <Gauge size={18} style={{ color: 'var(--color-blue)' }} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Speed</span>
              </div>
              <p className="text-2xl font-extrabold" style={{ color: 'var(--text-primary)' }}>{speed.toFixed(0)} <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>km/h</span></p>
            </GlassCard>
          </div>
        </div>
      </div>

      {/* ── Location + GPS Strip ── */}
      <GlassCard className="p-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="p-2.5 rounded-xl" style={{ background: 'var(--status-blue-bg)' }}>
              <MapPin size={20} style={{ color: 'var(--color-blue)' }} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Current Location
              </p>
              <p className="text-base font-semibold mt-0.5" style={{ color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                {d.gps.latitude.toFixed(6)}°, {d.gps.longitude.toFixed(6)}°
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="text-center">
              <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Altitude</p>
              <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{d.gps.altitude?.toFixed(0) ?? 0}m</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Speed</p>
              <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{speed.toFixed(0)} km/h</p>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full pulse-live" style={{ background: 'var(--color-emerald)' }} />
              <span className="text-sm font-semibold" style={{ color: 'var(--color-emerald)' }}>
                {isStreaming ? 'Live' : 'Paused'}
              </span>
            </div>
          </div>
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

export default Dashboard;
