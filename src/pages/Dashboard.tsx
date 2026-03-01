import {
  MapPin,
  Navigation,
  Gauge,
  Activity,
  Wifi,
  Battery,
  Thermometer,
  Radio,
} from 'lucide-react';
import MetricCard from '../components/MetricCard';
import StatusBadge from '../components/StatusBadge';
import GlassCard from '../components/GlassCard';
import ConnectionPanel from '../components/ConnectionPanel';
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">System Dashboard</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Real-time telemetry from IoT sensor array
          </p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={d.systemStatus} size="md" />
          <button
            onClick={() => setIsStreaming(!isStreaming)}
            className={`px-4 py-2 rounded-xl text-xs font-medium border transition-all ${
              isStreaming
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-red-500/10 border-red-500/30 text-red-400'
            }`}
          >
            {isStreaming ? 'Streaming' : 'Paused'}
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
        <MetricCard
          label="Latitude"
          value={d.gps.latitude}
          unit="deg"
          icon={<MapPin size={20} />}
          color="text-blue-400"
          pulse
        />
        <MetricCard
          label="Longitude"
          value={d.gps.longitude}
          unit="deg"
          icon={<Navigation size={20} />}
          color="text-cyan-400"
          pulse
        />
        <MetricCard
          label="Speed"
          value={d.gps.speed}
          unit="km/h"
          icon={<Gauge size={20} />}
          color="text-emerald-400"
        />
        <MetricCard
          label="Altitude"
          value={d.gps.altitude}
          unit="m"
          icon={<MapPin size={20} />}
          color="text-purple-400"
        />
      </div>

      {/* Accelerometer + System */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <GlassCard>
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
            <Activity size={16} className="text-orange-400" />
            Accelerometer Readings
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {(['x', 'y', 'z'] as const).map(axis => (
              <div key={axis} className="text-center p-3 rounded-xl bg-[var(--bg-secondary)]">
                <p className="text-xs text-[var(--text-muted)] uppercase mb-1">Axis {axis.toUpperCase()}</p>
                <p className="text-2xl font-bold text-[var(--text-primary)]">
                  {d.accelerometer[axis]}
                </p>
                <p className="text-[10px] text-[var(--text-muted)]">g-force</p>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard>
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
            <Radio size={16} className="text-blue-400" />
            System Vitals
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-secondary)]">
              <div className="flex items-center gap-2">
                <Wifi size={14} className="text-blue-400" />
                <span className="text-sm text-[var(--text-secondary)]">Signal Strength</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 rounded-full bg-[var(--border-color)] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-blue-400 transition-all duration-500"
                    style={{ width: `${d.signalStrength}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-[var(--text-primary)]">{d.signalStrength}%</span>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-secondary)]">
              <div className="flex items-center gap-2">
                <Battery size={14} className="text-emerald-400" />
                <span className="text-sm text-[var(--text-secondary)]">Battery Level</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 rounded-full bg-[var(--border-color)] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-400 transition-all duration-500"
                    style={{ width: `${d.batteryLevel}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-[var(--text-primary)]">{d.batteryLevel}%</span>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-secondary)]">
              <div className="flex items-center gap-2">
                <Thermometer size={14} className="text-red-400" />
                <span className="text-sm text-[var(--text-secondary)]">Temperature</span>
              </div>
              <span className="text-sm font-medium text-[var(--text-primary)]">{d.temperature} °C</span>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Timestamp */}
      <div className="text-center">
        <p className="text-xs text-[var(--text-muted)]">
          Last updated: {new Date(d.timestamp).toLocaleTimeString()} · {dataMode === 'hardware' ? 'Hardware Mode' : 'Simulation Mode'} ·{' '}
          {isStreaming ? 'Updating every 1s' : 'Stream paused'}
        </p>
      </div>
    </div>
  );
}
