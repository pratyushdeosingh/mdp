import { memo } from 'react';
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
import EmptyState from '../components/EmptyState';
import ConnectionPanel from '../components/ConnectionPanel';
import AccelerationGauge from '../components/AccelerationGauge';
import EmergencyStatusPanel from '../components/EmergencyStatusPanel';
import SimulationControls from '../components/SimulationControls';
import { GPSStatusPanel } from '../components/GPSStatusPanel';
import { useAppContext } from '../context/AppContext';
import { useAccidentDetection } from '../hooks/useAccidentDetection';
import { useGPSStatus } from '../hooks/useGPSStatus';

const Dashboard = memo(function Dashboard() {
  const { sensorData, dataMode, isStreaming, setIsStreaming, connectionStatus, activeScenario, triggerScenario } = useAppContext();
  const accidentState = useAccidentDetection(sensorData);
  const gpsStatus = useGPSStatus(sensorData);

  // Hardware mode with no data yet — show connection panel
  if (dataMode === 'hardware' && !sensorData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 animate-fade-in-up">
        <ConnectionPanel />
        {connectionStatus === 'connected' && (
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full pulse-live" style={{ background: 'var(--color-emerald)' }} />
            <span className="text-sm font-medium" style={{ color: 'var(--color-emerald)' }}>Connected — waiting for first data packet...</span>
          </div>
        )}
      </div>
    );
  }

  // Simulation mode still loading
  if (!sensorData) {
    return (
      <EmptyState
        icon={<Radio size={32} style={{ color: 'var(--color-blue)' }} />}
        title="Initializing Sensors"
        message="Waiting for the first data packet from the simulation engine..."
      />
    );
  }

  const d = sensorData;

  return (
    <div className="grid h-full min-h-full gap-8">
      {/* Emergency Status Panel — layman-friendly overview */}
      <EmergencyStatusPanel
        sensorData={d}
        accidentState={accidentState}
        onUserSafe={accidentState.markUserSafe}
        gpsStatus={gpsStatus}
      />

      {/* Simulation Controls — test scenarios without hardware */}
      {dataMode === 'simulation' && (
        <SimulationControls
          activeScenario={activeScenario}
          onTriggerScenario={triggerScenario}
          onUserSafe={accidentState.markUserSafe}
        />
      )}

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
            aria-label={isStreaming ? 'Pause streaming' : 'Resume streaming'}
            className="px-4 py-2 rounded-xl text-xs font-medium border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            style={{
              background: isStreaming ? 'var(--status-emerald-bg)' : 'var(--status-red-bg)',
              borderColor: isStreaming ? 'var(--color-emerald)' : 'var(--color-red)',
              color: isStreaming ? 'var(--color-emerald)' : 'var(--color-red)',
            }}
          >
            {isStreaming ? 'Streaming' : 'Paused'}
          </button>
        </div>
      </div>

      {/* Accident Detection Alert */}
      {d.accidentDetected && (
        <div role="alert" aria-live="assertive" aria-atomic="true"
          className="p-5 rounded-2xl border-2 flex items-center gap-4 animate-slow-pulse"
          style={{ background: 'var(--status-red-bg)', borderColor: 'var(--color-red)', borderWidth: '2px' }}
        >
          <div className="p-3 rounded-xl" style={{ background: 'var(--status-red-bg)' }}>
            <AlertTriangle size={28} style={{ color: 'var(--color-red)' }} />
          </div>
          <div>
            <p className="text-base font-bold" style={{ color: 'var(--color-red)' }}>⚠ ACCIDENT DETECTED</p>
            <p className="text-sm mt-0.5" style={{ color: 'var(--color-red)', opacity: 0.8 }}>Total acceleration exceeded threshold (25 m/s²). Buzzer alert active.</p>
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
          color="var(--color-blue)"
          pulse
        />
        <MetricCard
          label="Longitude"
          value={d.gps.longitude}
          unit="deg"
          icon={<Navigation size={24} />}
          color="var(--color-cyan)"
          pulse
        />
        <MetricCard
          label="Speed"
          value={d.gps.speed}
          unit="km/h"
          icon={<Gauge size={24} />}
          color="var(--color-emerald)"
        />
        <MetricCard
          label="Altitude"
          value={d.gps.altitude}
          unit="m"
          icon={<Mountain size={24} />}
          color="var(--color-purple)"
        />
      </div>

      {/* Accelerometer + System — Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Accelerometer Card */}
        <GlassCard className="p-7 flex flex-col">
          <h3 className="text-xs font-bold text-[var(--text-muted)] tracking-[0.15em] uppercase mb-5 flex items-center gap-2 shrink-0">
            <Activity size={16} style={{ color: 'var(--color-orange)' }} />
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
            <Radio size={16} style={{ color: 'var(--color-blue)' }} />
            SYSTEM VITALS
          </h3>
          <div className="flex-1 flex flex-col justify-center gap-3.5">
            {/* Accident Detection */}
            <div className="flex items-center justify-between py-3.5 px-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)]">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-lg shrink-0" style={{ background: d.accidentDetected ? 'var(--status-red-bg)' : 'var(--status-blue-bg)' }}>
                  <Activity size={18} style={{ color: d.accidentDetected ? 'var(--color-red)' : 'var(--color-blue)' }} />
                </div>
                <span className="text-sm font-medium text-[var(--text-secondary)]">Accident Detection</span>
              </div>
              <span
                className="text-xs font-semibold px-3 py-1 rounded-full shrink-0"
                style={{
                  background: d.accidentDetected ? 'var(--status-red-bg)' : 'var(--status-emerald-bg)',
                  color: d.accidentDetected ? 'var(--color-red)' : 'var(--color-emerald)',
                }}
              >
                {d.accidentDetected ? 'TRIGGERED' : 'Normal'}
              </span>
            </div>

            {/* Battery Level */}
            <div className="flex items-center justify-between py-3.5 px-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)]">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-lg shrink-0" style={{ background: 'var(--status-emerald-bg)' }}>
                  <Battery size={18} style={{ color: 'var(--color-emerald)' }} />
                </div>
                <span className="text-sm font-medium text-[var(--text-secondary)]">Battery</span>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="w-24 h-3 rounded-full bg-[var(--border-color)] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${d.batteryLevel}%`, background: 'var(--color-emerald)' }}
                  />
                </div>
                <span className="text-sm font-bold text-[var(--text-primary)]">{d.batteryLevel}%</span>
              </div>
            </div>

            {/* Temperature */}
            <div className="flex items-center justify-between py-3.5 px-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)]">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-lg shrink-0" style={{ background: 'var(--status-red-bg)' }}>
                  <Thermometer size={18} style={{ color: 'var(--color-red)' }} />
                </div>
                <span className="text-sm font-medium text-[var(--text-secondary)]">Temperature</span>
              </div>
              <span className="text-sm font-bold text-[var(--text-primary)] shrink-0">{d.temperature} °C</span>
            </div>

            {/* System Status */}
            <div className="flex items-center justify-between py-3.5 px-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)]">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-lg shrink-0" style={{ background: 'var(--status-blue-bg)' }}>
                  <Satellite size={18} style={{ color: 'var(--color-purple)' }} />
                </div>
                <span className="text-sm font-medium text-[var(--text-secondary)]">System Status</span>
              </div>
              <StatusBadge status={d.systemStatus} size="md" />
            </div>
          </div>
        </GlassCard>
      </div>

      {/* GPS Health Monitor */}
      <GPSStatusPanel gpsStatus={gpsStatus} />

      {/* GPS Info Strip */}
      <GlassCard className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2.5">
              <Satellite size={16} style={{ color: 'var(--color-blue)' }} />
              <span className="text-sm text-[var(--text-muted)]">GPS</span>
              <span className="text-sm font-semibold" style={{
                color: gpsStatus.state === 'locked' ? 'var(--color-emerald)' :
                       gpsStatus.state === 'cold_start' ? 'var(--color-amber)' :
                       gpsStatus.state === 'searching' ? 'var(--color-orange)' :
                       gpsStatus.state === 'lost_fix' ? 'var(--color-red)' : 'var(--color-gray)'
              }}>
                {gpsStatus.state === 'locked' ? 'Active' :
                 gpsStatus.state === 'cold_start' ? 'Acquiring…' :
                 gpsStatus.state === 'searching' ? 'No Fix' :
                 gpsStatus.state === 'lost_fix' ? 'Fix Lost' : 'No Data'}
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <MapPin size={16} style={{ color: 'var(--color-cyan)' }} />
              <span className="text-sm text-[var(--text-muted)]">Position</span>
              <span className="text-sm font-medium text-[var(--text-primary)]">
                {d.gps.latitude}°, {d.gps.longitude}°
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <Gauge size={16} style={{ color: 'var(--color-emerald)' }} />
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
});

export default Dashboard;
