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
  const speed = d.gps.speed ?? 0;

  return (
    <div className="w-full h-full min-h-[calc(100vh-120px)] flex flex-col gap-6">
      {/* ── Alert Banner ── */}
      <AlertBanner
        accidentDetected={d.accidentDetected}
        onUserSafe={accidentState.markUserSafe}
      />

      {/* ── Main Grid - fills available space ── */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 auto-rows-fr">
        {/* Hero Status Card - large center card */}
        <GlassCard
          className={`lg:col-span-8 lg:row-span-2 p-8 flex flex-col justify-center ${isAccident ? 'emergency-panel-alert' : ''}`}
          style={isAccident ? { borderColor: 'var(--color-red)', borderWidth: '2px' } : undefined}
          aria-live="polite"
          aria-atomic="true"
        >
          <div className="flex flex-col items-center justify-center gap-6 text-center h-full">
            {/* Large Icon */}
            <div
              className={`w-32 h-32 rounded-3xl flex items-center justify-center ${isAccident ? 'animate-slow-pulse' : ''}`}
              style={{
                background: isAccident ? 'var(--status-red-bg)' : 'var(--status-emerald-bg)',
              }}
              aria-hidden="true"
            >
              {isAccident
                ? <ShieldAlert size={64} style={{ color: 'var(--color-red)' }} />
                : <Shield size={64} style={{ color: 'var(--color-emerald)' }} />
              }
            </div>

            {/* Status Text */}
            <div>
              <h1
                className="text-3xl md:text-4xl lg:text-5xl font-extrabold"
                style={{ color: isAccident ? 'var(--color-red)' : 'var(--color-emerald)' }}
                role={isAccident ? 'alert' : undefined}
              >
                {isAccident ? 'ACCIDENT DETECTED' : "You're Safe"}
              </h1>
              <p className="text-base md:text-lg mt-3" style={{ color: 'var(--text-muted)' }}>
                {isAccident
                  ? `Impact detected • ${accidentState.elapsedSeconds}s ago`
                  : 'All systems normal — helmet is actively monitoring'}
              </p>
            </div>

            {/* I'm Safe Button (only during accident) */}
            {isAccident && (
              <button
                onClick={accidentState.markUserSafe}
                className="mt-2 px-10 py-5 rounded-2xl text-lg font-bold text-white transition-all hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400"
                style={{ background: 'linear-gradient(135deg, var(--color-emerald), #10b981)' }}
                aria-label="Mark yourself as safe and dismiss accident alert"
              >
                <ShieldCheck size={24} className="inline mr-2 -mt-0.5" aria-hidden="true" />
                I'm Safe
              </button>
            )}
          </div>
        </GlassCard>

        {/* Right Column - Battery Card */}
        <GlassCard className="lg:col-span-4 p-6 flex flex-col justify-center status-card-hover">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-xl" style={{ background: battLevel > 40 ? 'var(--status-emerald-bg)' : battLevel > 15 ? 'var(--status-amber-bg)' : 'var(--status-red-bg)' }}>
              <Battery size={28} style={{ color: battLevel > 40 ? 'var(--color-emerald)' : battLevel > 15 ? 'var(--color-amber)' : 'var(--color-red)' }} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Battery Level</p>
              <p className="text-3xl font-extrabold mt-1" style={{ color: 'var(--text-primary)' }}>{battLevel}%</p>
            </div>
          </div>
          <div className="w-full h-3 rounded-full overflow-hidden" style={{ background: 'var(--border-color)' }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${battLevel}%`,
                background: battLevel > 40 ? 'var(--color-emerald)' : battLevel > 15 ? 'var(--color-amber)' : 'var(--color-red)',
              }}
            />
          </div>
          <p className="text-sm font-medium mt-3" style={{ color: battLevel > 40 ? 'var(--color-emerald)' : battLevel > 15 ? 'var(--color-amber)' : 'var(--color-red)' }}>
            {battLevel > 60 ? 'Battery healthy' : battLevel > 25 ? 'Consider charging' : 'Battery low!'}
          </p>
        </GlassCard>

        {/* Right Column - Temperature & Speed */}
        <GlassCard className="lg:col-span-4 p-6 flex flex-col justify-center status-card-hover">
          <div className="grid grid-cols-2 gap-6">
            {/* Temperature */}
            <div className="text-center">
              <div className="p-3 rounded-xl mx-auto w-fit mb-3" style={{ background: temp < 40 ? 'var(--status-emerald-bg)' : temp < 55 ? 'var(--status-amber-bg)' : 'var(--status-red-bg)' }}>
                <Thermometer size={24} style={{ color: temp < 40 ? 'var(--color-emerald)' : temp < 55 ? 'var(--color-amber)' : 'var(--color-red)' }} />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Temperature</p>
              <p className="text-3xl font-extrabold mt-1" style={{ color: 'var(--text-primary)' }}>{temp}°C</p>
              <p className="text-xs font-medium mt-1" style={{ color: temp < 40 ? 'var(--color-emerald)' : temp < 55 ? 'var(--color-amber)' : 'var(--color-red)' }}>
                {temp < 40 ? 'Normal' : temp < 55 ? 'Warm' : 'Hot!'}
              </p>
            </div>

            {/* Speed */}
            <div className="text-center">
              <div className="p-3 rounded-xl mx-auto w-fit mb-3" style={{ background: 'var(--status-blue-bg)' }}>
                <Gauge size={24} style={{ color: 'var(--color-blue)' }} />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Speed</p>
              <p className="text-3xl font-extrabold mt-1" style={{ color: 'var(--text-primary)' }}>{speed.toFixed(0)}</p>
              <p className="text-xs font-medium mt-1" style={{ color: 'var(--color-blue)' }}>km/h</p>
            </div>
          </div>
        </GlassCard>

        {/* Bottom Row - Location spanning full width */}
        <GlassCard className="lg:col-span-12 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl" style={{ background: 'var(--status-blue-bg)' }}>
                <MapPin size={24} style={{ color: 'var(--color-blue)' }} />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  Current Location
                </p>
                <p className="text-lg font-semibold mt-1" style={{ color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                  {(d.gps.latitude ?? 0).toFixed(6)}°, {(d.gps.longitude ?? 0).toFixed(6)}°
                </p>
              </div>
            </div>
            <div className="flex items-center gap-8">
              <div className="text-center">
                <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Altitude</p>
                <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{d.gps.altitude?.toFixed(0) ?? 0}m</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>GPS Speed</p>
                <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{speed.toFixed(1)} km/h</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full pulse-live" style={{ background: 'var(--color-emerald)' }} />
                <span className="text-base font-semibold" style={{ color: 'var(--color-emerald)' }}>
                  {isStreaming ? 'Live' : 'Paused'}
                </span>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>

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
