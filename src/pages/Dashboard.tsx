import {
  MapPin,
  Navigation,
  Gauge,
  Activity,
  AlertTriangle,
  Battery,
  Thermometer,
  Radio,
  Mountain,
  Satellite,
  Clock,
} from 'lucide-react';
import MetricCard from '../components/MetricCard';
import StatusBadge from '../components/StatusBadge';
import GlassCard from '../components/GlassCard';
import ConnectionPanel from '../components/ConnectionPanel';
import AccelerationGauge from '../components/AccelerationGauge';
import { useAppContext } from '../context/AppContext';

export default function Dashboard() {
  const { sensorData, dataMode, isStreaming, setIsStreaming, connectionStatus } = useAppContext();

  // Hardware mode with no data yet — show connection panel
  if (dataMode === 'hardware' && !sensorData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 animate-fade-in-up">
        <ConnectionPanel />
        {connectionStatus === 'connected' && (
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-sm text-emerald-400 font-medium">Connected — waiting for first data packet...</span>
          </div>
        )}
      </div>
    );
  }

  // Simulation mode still loading
  if (!sensorData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-[var(--text-muted)]">Initializing sensors...</p>
      </div>
    );
  }

  const d = sensorData;

  return (
    <div className="grid h-full min-h-full grid-rows-[auto_auto_1fr_auto] gap-8">
      {/* Header */}
      <div className="relative flex flex-col items-center justify-center text-center">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">System Dashboard</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1.5 mb-6">
            Real-time telemetry from Smart Safety Helmet sensors
          </p>
        </div>
        <div className="sm:absolute sm:right-0 sm:top-0 flex items-center gap-3 mt-4 sm:mt-1">
          <StatusBadge status={d.systemStatus} size="md" />
          <button
            onClick={() => setIsStreaming(!isStreaming)}
            className={`px-4 py-2 rounded-xl text-xs font-medium border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${isStreaming
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-red-500/10 border-red-500/30 text-red-400'
              }`}
          >
            {isStreaming ? 'Streaming' : 'Paused'}
          </button>
        </div>
      </div>

      {/* Accident Detection Alert */}
      {d.accidentDetected && (
        <div role="alert" aria-live="assertive" className="p-5 rounded-2xl bg-red-500/10 border-2 border-red-500/40 flex items-center gap-4 animate-pulse">
          <div className="p-3 rounded-xl bg-red-500/20">
            <AlertTriangle size={28} className="text-red-400" />
          </div>
          <div>
            <p className="text-base font-bold text-red-400">⚠ ACCIDENT DETECTED</p>
            <p className="text-sm text-red-400/80 mt-0.5">Total acceleration exceeded threshold (25 m/s²). Buzzer alert active.</p>
          </div>
        </div>
      )}

      {/* Metrics Grid — GPS & Motion */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 stagger-children">
        <MetricCard
          label="Latitude"
          value={d.gps.latitude}
          unit="deg"
          icon={<MapPin size={24} />}
          color="text-blue-400"
          pulse
        />
        <MetricCard
          label="Longitude"
          value={d.gps.longitude}
          unit="deg"
          icon={<Navigation size={24} />}
          color="text-cyan-400"
          pulse
        />
        <MetricCard
          label="Speed"
          value={d.gps.speed}
          unit="km/h"
          icon={<Gauge size={24} />}
          color="text-emerald-400"
        />
        <MetricCard
          label="Altitude"
          value={d.gps.altitude}
          unit="m"
          icon={<Mountain size={24} />}
          color="text-purple-400"
        />
      </div>

      {/* Accelerometer + System — Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Accelerometer Card */}
        <GlassCard className="p-7 flex flex-col">
          <h3 className="text-xs font-bold text-[var(--text-muted)] tracking-[0.15em] uppercase mb-5 flex items-center gap-2 shrink-0">
            <Activity size={16} className="text-orange-400" />
            ACCELEROMETER READINGS
          </h3>

          {/* Axis Values */}
          <div className="grid grid-cols-3 gap-4 mb-6 shrink-0">
            {(['x', 'y', 'z'] as const).map(axis => (
              <div key={axis} className="text-center p-4 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)]">
                <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.2em] mb-1.5">Axis {axis.toUpperCase()}</p>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-xl font-bold text-[var(--text-primary)] leading-tight">{d.accelerometer[axis]}</span>
                  <span className="text-[10px] font-medium text-[var(--text-muted)]">m/s²</span>
                </div>
              </div>
            ))}
          </div>

          {/* Acceleration Gauge */}
          <div className="flex-1 flex flex-col justify-center items-center py-4 min-h-[260px]">
            <div className="text-center mb-2 z-10">
              <span className="text-sm font-semibold text-[var(--text-primary)] tracking-wide">Resultant Acceleration</span>
              <p className="text-xs text-[var(--text-muted)] mt-0.5 opacity-80">Calculated from X, Y, Z axes (√(ax² + ay² + az²))</p>
            </div>
            <AccelerationGauge
              value={d.totalAcceleration}
              maxValue={30}
              threshold={25}
              accidentDetected={d.accidentDetected}
            />
          </div>
        </GlassCard>

        {/* System Vitals Card */}
        <GlassCard className="p-7 flex flex-col">
          <h3 className="text-xs font-bold text-[var(--text-muted)] tracking-[0.15em] uppercase mb-5 flex items-center gap-2 shrink-0">
            <Radio size={16} className="text-blue-400" />
            SYSTEM VITALS
          </h3>
          <div className="flex-1 flex flex-col justify-center gap-3.5">
            {/* Accident Detection */}
            <div className="flex items-center justify-between py-3.5 px-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)]">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`p-2 rounded-lg shrink-0 ${d.accidentDetected ? 'bg-red-500/15' : 'bg-blue-500/15'}`}>
                  <Activity size={18} className={d.accidentDetected ? 'text-red-400' : 'text-blue-400'} />
                </div>
                <span className="text-sm font-medium text-[var(--text-secondary)]">Accident Detection</span>
              </div>
              <span className={`text-xs font-semibold px-3 py-1 rounded-full shrink-0 ${d.accidentDetected
                ? 'bg-red-500/15 text-red-400'
                : 'bg-emerald-500/15 text-emerald-400'
                }`}>
                {d.accidentDetected ? 'TRIGGERED' : 'Normal'}
              </span>
            </div>

            {/* Battery Level */}
            <div className="flex items-center justify-between py-3.5 px-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)]">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-lg bg-emerald-500/15 shrink-0">
                  <Battery size={18} className="text-emerald-400" />
                </div>
                <span className="text-sm font-medium text-[var(--text-secondary)]">Battery</span>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="w-24 h-3 rounded-full bg-[var(--border-color)] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-400 transition-all duration-500"
                    style={{ width: `${d.batteryLevel}%` }}
                  />
                </div>
                <span className="text-sm font-bold text-[var(--text-primary)]">{d.batteryLevel}%</span>
              </div>
            </div>

            {/* Temperature */}
            <div className="flex items-center justify-between py-3.5 px-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)]">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-lg bg-red-500/15 shrink-0">
                  <Thermometer size={18} className="text-red-400" />
                </div>
                <span className="text-sm font-medium text-[var(--text-secondary)]">Temperature</span>
              </div>
              <span className="text-sm font-bold text-[var(--text-primary)] shrink-0">{d.temperature} °C</span>
            </div>

            {/* System Status */}
            <div className="flex items-center justify-between py-3.5 px-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)]">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-lg bg-purple-500/15 shrink-0">
                  <Satellite size={18} className="text-purple-400" />
                </div>
                <span className="text-sm font-medium text-[var(--text-secondary)]">System Status</span>
              </div>
              <StatusBadge status={d.systemStatus} size="md" />
            </div>
          </div>
        </GlassCard>
      </div>

      {/* GPS Info Strip */}
      <GlassCard className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2.5">
              <Satellite size={16} className="text-blue-400" />
              <span className="text-sm text-[var(--text-muted)]">GPS</span>
              <span className="text-sm font-semibold text-emerald-400">Active</span>
            </div>
            <div className="flex items-center gap-2.5">
              <MapPin size={16} className="text-cyan-400" />
              <span className="text-sm text-[var(--text-muted)]">Position</span>
              <span className="text-sm font-medium text-[var(--text-primary)]">
                {d.gps.latitude}°, {d.gps.longitude}°
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <Gauge size={16} className="text-emerald-400" />
              <span className="text-sm text-[var(--text-muted)]">Velocity</span>
              <span className="text-sm font-medium text-[var(--text-primary)]">{d.gps.speed} km/h</span>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <Clock size={16} className="text-[var(--text-muted)]" />
            <span className="text-sm text-[var(--text-muted)]">
              {new Date(d.timestamp).toLocaleTimeString()} · {dataMode === 'hardware' ? 'Hardware' : 'Simulation'} ·{' '}
              {isStreaming ? 'Live' : 'Paused'}
            </span>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
