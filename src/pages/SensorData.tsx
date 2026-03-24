import { memo, useMemo } from 'react';
import {
  Activity,
  Gauge,
  Radio,
  TrendingUp,
  Zap,
  AlertTriangle,
  ThermometerSun,
  Box,
} from 'lucide-react';
import GlassCard from '../components/GlassCard';
import ImpactMeter from '../components/ImpactMeter';
import SeverityBadge from '../components/SeverityBadge';
import EmptyState from '../components/EmptyState';
import { useAppContext } from '../context/AppContext';
import { useAccidentDetection } from '../hooks/useAccidentDetection';

/* ───────── Sensor Data Page ─────────
   Displays technical sensor readings:
   - Severity Meter (ImpactMeter gauge)
   - MPU6050 Accelerometer/Gyroscope readings
   - Impact threshold indicator
   - Real-time updates via WebSocket/simulation
*/

const SensorData = memo(function SensorData() {
  const { sensorData, dataMode, isStreaming } = useAppContext();
  const accidentState = useAccidentDetection(sensorData);

  // Compute zone color for UI accents
  const zoneColors = useMemo(() => {
    const zone = accidentState.impactZone;
    if (zone === 'danger') return { bg: 'var(--status-red-bg)', color: 'var(--color-red)', border: 'rgba(248, 113, 113, 0.3)' };
    if (zone === 'caution') return { bg: 'var(--status-amber-bg)', color: 'var(--color-amber)', border: 'rgba(251, 191, 36, 0.3)' };
    return { bg: 'var(--status-emerald-bg)', color: 'var(--color-emerald)', border: 'rgba(52, 211, 153, 0.3)' };
  }, [accidentState.impactZone]);

  // No data state
  if (!sensorData) {
    return (
      <EmptyState
        icon={<Radio size={32} style={{ color: 'var(--color-blue)' }} />}
        title="Waiting for Sensor Data"
        message={dataMode === 'hardware' 
          ? 'Connect your Arduino device to start receiving live sensor data.' 
          : 'Starting simulation engine...'}
      />
    );
  }

  const { accelerometer, totalAcceleration, temperature, gps } = sensorData;

  // Impact threshold constants (match Arduino firmware)
  const ACCIDENT_THRESHOLD = 25; // m/s²
  const CAUTION_THRESHOLD = 12; // m/s²
  const thresholdProgress = Math.min((totalAcceleration / ACCIDENT_THRESHOLD) * 100, 100);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Sensor Data</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Real-time MPU6050 accelerometer readings and impact severity
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: zoneColors.bg, border: `1px solid ${zoneColors.border}` }}>
            <span className="w-2 h-2 rounded-full pulse-live" style={{ background: zoneColors.color }} />
            <span className="text-xs font-semibold capitalize" style={{ color: zoneColors.color }}>
              {accidentState.impactZone} Zone
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${isStreaming ? 'pulse-live' : ''}`} style={{ background: isStreaming ? 'var(--color-emerald)' : 'var(--text-muted)' }} />
            <span className="text-xs font-medium" style={{ color: isStreaming ? 'var(--color-emerald)' : 'var(--text-muted)' }}>
              {isStreaming ? 'Live' : 'Paused'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Severity Meter + Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ─── Severity Meter Card ─── */}
        <GlassCard 
          className={`p-6 ${accidentState.impactZone === 'danger' ? 'emergency-panel-alert' : ''}`}
          style={accidentState.impactZone === 'danger' ? { borderColor: 'var(--color-red)', borderWidth: '2px' } : undefined}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl" style={{ background: zoneColors.bg }}>
                <Gauge size={20} style={{ color: zoneColors.color }} />
              </div>
              <div>
                <h2 className="text-sm font-bold text-[var(--text-primary)]">Impact Severity</h2>
                <p className="text-xs text-[var(--text-muted)]">Real-time impact analysis</p>
              </div>
            </div>
            <SeverityBadge severity={accidentState.severity} />
          </div>
          
          {/* The Severity Gauge */}
          <div className="flex justify-center py-2">
            <ImpactMeter
              value={accidentState.severityPercent}
              rawAcceleration={totalAcceleration}
              zone={accidentState.impactZone}
            />
          </div>

          {/* Peak + Current readings */}
          <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-[var(--border-color)]">
            <div className="text-center">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">Current</p>
              <p className="text-xl font-bold" style={{ color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                {totalAcceleration.toFixed(2)} <span className="text-sm text-[var(--text-muted)] font-medium">m/s²</span>
              </p>
            </div>
            <div className="text-center">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">Peak</p>
              <p className="text-xl font-bold" style={{ color: accidentState.peakAcceleration > CAUTION_THRESHOLD ? 'var(--color-red)' : 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                {accidentState.peakAcceleration.toFixed(2)} <span className="text-sm text-[var(--text-muted)] font-medium">m/s²</span>
              </p>
            </div>
          </div>
        </GlassCard>

        {/* ─── Accelerometer Readings Card ─── */}
        <GlassCard className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-xl" style={{ background: 'var(--status-blue-bg)' }}>
              <Box size={20} style={{ color: 'var(--color-blue)' }} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[var(--text-primary)]">MPU6050 Readings</h2>
              <p className="text-xs text-[var(--text-muted)]">3-axis accelerometer data</p>
            </div>
          </div>

          {/* X, Y, Z Axis Cards */}
          <div className="space-y-4">
            {/* X Axis */}
            <div className="flex items-center gap-4 p-4 rounded-xl" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
                X
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-[var(--text-secondary)]">X-Axis</span>
                  <span className="text-xs text-[var(--text-muted)]">Lateral</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-[var(--text-primary)]" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {accelerometer.x.toFixed(3)}
                  </span>
                  <span className="text-sm text-[var(--text-muted)]">m/s²</span>
                </div>
              </div>
              <AxisBar value={accelerometer.x} maxValue={30} color="#ef4444" />
            </div>

            {/* Y Axis */}
            <div className="flex items-center gap-4 p-4 rounded-xl" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm" style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e' }}>
                Y
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-[var(--text-secondary)]">Y-Axis</span>
                  <span className="text-xs text-[var(--text-muted)]">Longitudinal</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-[var(--text-primary)]" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {accelerometer.y.toFixed(3)}
                  </span>
                  <span className="text-sm text-[var(--text-muted)]">m/s²</span>
                </div>
              </div>
              <AxisBar value={accelerometer.y} maxValue={30} color="#22c55e" />
            </div>

            {/* Z Axis */}
            <div className="flex items-center gap-4 p-4 rounded-xl" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' }}>
                Z
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-[var(--text-secondary)]">Z-Axis</span>
                  <span className="text-xs text-[var(--text-muted)]">Vertical</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-[var(--text-primary)]" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {accelerometer.z.toFixed(3)}
                  </span>
                  <span className="text-sm text-[var(--text-muted)]">m/s²</span>
                </div>
              </div>
              <AxisBar value={accelerometer.z} maxValue={30} color="#3b82f6" />
            </div>
          </div>

          {/* Total magnitude footer */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-[var(--border-color)]">
            <div className="flex items-center gap-2">
              <TrendingUp size={14} style={{ color: 'var(--color-purple)' }} />
              <span className="text-xs font-semibold text-[var(--text-muted)]">Total Magnitude</span>
            </div>
            <span className="text-sm font-bold" style={{ color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
              √(x² + y² + z²) = {totalAcceleration.toFixed(3)} m/s²
            </span>
          </div>
        </GlassCard>
      </div>

      {/* ─── Impact Threshold Indicator ─── */}
      <GlassCard className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-xl" style={{ background: totalAcceleration >= ACCIDENT_THRESHOLD ? 'var(--status-red-bg)' : 'var(--status-amber-bg)' }}>
            <AlertTriangle size={20} style={{ color: totalAcceleration >= ACCIDENT_THRESHOLD ? 'var(--color-red)' : 'var(--color-amber)' }} />
          </div>
          <div className="flex-1">
            <h2 className="text-sm font-bold text-[var(--text-primary)]">Impact Threshold Monitor</h2>
            <p className="text-xs text-[var(--text-muted)]">Accident detection threshold: {ACCIDENT_THRESHOLD} m/s²</p>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold" style={{ color: zoneColors.color, fontVariantNumeric: 'tabular-nums' }}>
              {thresholdProgress.toFixed(0)}%
            </p>
            <p className="text-[10px] text-[var(--text-muted)]">of threshold</p>
          </div>
        </div>

        {/* Threshold Progress Bar */}
        <div className="relative">
          <div className="w-full h-4 rounded-full overflow-hidden" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
            <div
              className="h-full rounded-full transition-all duration-300 threshold-bar"
              style={{
                width: `${thresholdProgress}%`,
                background: totalAcceleration >= ACCIDENT_THRESHOLD 
                  ? 'linear-gradient(90deg, #f97316, #ef4444)' 
                  : totalAcceleration >= CAUTION_THRESHOLD 
                    ? 'linear-gradient(90deg, #fbbf24, #f97316)'
                    : 'linear-gradient(90deg, #34d399, #22d3ee)',
              }}
            />
          </div>
          
          {/* Threshold markers */}
          <div className="flex justify-between mt-2 px-1">
            <div className="text-center">
              <div className="w-0.5 h-2 bg-[var(--text-muted)] mx-auto mb-1 rounded-full" />
              <span className="text-[10px] text-[var(--text-muted)]">0</span>
            </div>
            <div className="text-center" style={{ marginLeft: `${(CAUTION_THRESHOLD / ACCIDENT_THRESHOLD) * 100 - 5}%` }}>
              <div className="w-0.5 h-2 mx-auto mb-1 rounded-full" style={{ background: 'var(--color-amber)' }} />
              <span className="text-[10px]" style={{ color: 'var(--color-amber)' }}>Caution ({CAUTION_THRESHOLD})</span>
            </div>
            <div className="text-center">
              <div className="w-0.5 h-2 mx-auto mb-1 rounded-full" style={{ background: 'var(--color-red)' }} />
              <span className="text-[10px]" style={{ color: 'var(--color-red)' }}>Accident ({ACCIDENT_THRESHOLD})</span>
            </div>
          </div>
        </div>

        {/* Zone Legend */}
        <div className="grid grid-cols-3 gap-3 mt-6">
          <div className="flex items-center gap-2 p-2 rounded-lg" style={{ background: 'var(--status-emerald-bg)' }}>
            <span className="w-3 h-3 rounded-full" style={{ background: 'var(--color-emerald)' }} />
            <span className="text-xs font-medium" style={{ color: 'var(--color-emerald)' }}>Normal (&lt;12)</span>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg" style={{ background: 'var(--status-amber-bg)' }}>
            <span className="w-3 h-3 rounded-full" style={{ background: 'var(--color-amber)' }} />
            <span className="text-xs font-medium" style={{ color: 'var(--color-amber)' }}>Caution (12-25)</span>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg" style={{ background: 'var(--status-red-bg)' }}>
            <span className="w-3 h-3 rounded-full" style={{ background: 'var(--color-red)' }} />
            <span className="text-xs font-medium" style={{ color: 'var(--color-red)' }}>Danger (≥25)</span>
          </div>
        </div>
      </GlassCard>

      {/* ─── Additional Sensor Info ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Temperature */}
        <GlassCard className="p-5 status-card-hover">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-xl" style={{ background: temperature > 45 ? 'var(--status-red-bg)' : 'var(--status-blue-bg)' }}>
              <ThermometerSun size={18} style={{ color: temperature > 45 ? 'var(--color-red)' : 'var(--color-blue)' }} />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Temperature</span>
          </div>
          <p className="text-2xl font-bold text-[var(--text-primary)]" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {temperature.toFixed(1)}°C
          </p>
          <p className="text-xs mt-1" style={{ color: temperature > 45 ? 'var(--color-red)' : 'var(--color-emerald)' }}>
            {temperature > 45 ? 'High temperature!' : 'Normal range'}
          </p>
        </GlassCard>

        {/* Speed */}
        <GlassCard className="p-5 status-card-hover">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-xl" style={{ background: 'var(--status-emerald-bg)' }}>
              <Zap size={18} style={{ color: 'var(--color-emerald)' }} />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Speed</span>
          </div>
          <p className="text-2xl font-bold text-[var(--text-primary)]" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {gps.speed.toFixed(1)} <span className="text-sm text-[var(--text-muted)] font-medium">km/h</span>
          </p>
          <p className="text-xs mt-1 text-[var(--color-emerald)]">
            {gps.speed === 0 ? 'Stationary' : gps.speed < 40 ? 'City speed' : 'Highway speed'}
          </p>
        </GlassCard>

        {/* Data Mode */}
        <GlassCard className="p-5 status-card-hover">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-xl" style={{ background: 'var(--accent-glow)' }}>
              <Activity size={18} style={{ color: 'var(--accent)' }} />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Data Source</span>
          </div>
          <p className="text-2xl font-bold text-[var(--text-primary)] capitalize">{dataMode}</p>
          <p className="text-xs mt-1" style={{ color: 'var(--accent)' }}>
            {dataMode === 'hardware' ? 'Live from Arduino' : 'Simulated data'}
          </p>
        </GlassCard>
      </div>
    </div>
  );
});

/* ─── Axis Bar Component ─── */
function AxisBar({ value, maxValue, color }: { value: number; maxValue: number; color: string }) {
  const absValue = Math.abs(value);
  const percentage = Math.min((absValue / maxValue) * 100, 100);
  const isNegative = value < 0;
  
  return (
    <div className="w-20 flex flex-col items-end gap-1">
      <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'var(--border-color)' }}>
        <div 
          className="h-full rounded-full transition-all duration-200"
          style={{ 
            width: `${percentage}%`, 
            background: color,
            marginLeft: isNegative ? 'auto' : 0,
            marginRight: isNegative ? 0 : 'auto',
          }} 
        />
      </div>
      <span className="text-[9px] font-mono text-[var(--text-muted)]">
        {isNegative ? '-' : '+'}{absValue.toFixed(1)}
      </span>
    </div>
  );
}

export default SensorData;
