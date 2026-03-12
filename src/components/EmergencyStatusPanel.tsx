import { useState } from 'react';
import {
  Shield,
  Activity,
  AlertTriangle,
  Zap,
  UserCheck,
  ShieldCheck,
  ShieldAlert,
  Satellite,
} from 'lucide-react';
import type { SensorData, ImpactSeverity, UserResponse } from '../types';
import type { AccidentDetectionState } from '../hooks/useAccidentDetection';
import type { GPSStatus } from '../hooks/useGPSStatus';
import GlassCard from './GlassCard';
import ImpactMeter from './ImpactMeter';
import SeverityBadge from './SeverityBadge';
import AccidentTimer from './AccidentTimer';

interface EmergencyStatusPanelProps {
  sensorData: SensorData;
  accidentState: AccidentDetectionState;
  onUserSafe: () => void;
  gpsStatus?: GPSStatus;
}

const severityColorMap: Record<ImpactSeverity, { color: string; bg: string }> = {
  none:   { color: 'var(--color-gray)',    bg: 'var(--status-gray-bg)' },
  low:    { color: 'var(--color-emerald)', bg: 'var(--status-emerald-bg)' },
  medium: { color: 'var(--color-amber)',   bg: 'var(--status-amber-bg)' },
  high:   { color: '#f97316',              bg: 'rgba(249, 115, 22, 0.15)' },
  severe: { color: 'var(--color-red)',     bg: 'var(--status-red-bg)' },
};

const userResponseConfig: Record<UserResponse, { label: string; color: string; bg: string }> = {
  pending:      { label: 'Standby',      color: 'var(--color-gray)',    bg: 'var(--status-gray-bg)' },
  not_received: { label: 'Not Received', color: 'var(--color-red)',     bg: 'var(--status-red-bg)' },
  safe:         { label: 'User Safe ✓',  color: 'var(--color-emerald)', bg: 'var(--status-emerald-bg)' },
};

export default function EmergencyStatusPanel({ sensorData, accidentState, onUserSafe, gpsStatus }: EmergencyStatusPanelProps) {
  const {
    impactMagnitude,
    severityPercent,
    isAccidentActive,
    elapsedSeconds,
    severity,
    userResponse,
    impactZone,
  } = accidentState;

  const sevCfg = severityColorMap[severity];
  const resCfg = userResponseConfig[userResponse];
  const isOnline = sensorData.systemStatus !== 'offline';

  // Debounce "I'm Safe" button to prevent accidental double-taps
  const [isSafeMarking, setIsSafeMarking] = useState(false);
  const handleMarkSafe = () => {
    if (isSafeMarking) return;
    setIsSafeMarking(true);
    onUserSafe();
    setTimeout(() => setIsSafeMarking(false), 1500);
  };

  // GPS status card config
  const gpsCardColor = gpsStatus
    ? gpsStatus.state === 'locked' ? 'var(--color-emerald)'
      : gpsStatus.state === 'cold_start' ? 'var(--color-amber)'
      : gpsStatus.state === 'searching' ? 'var(--color-orange, #c2410c)'
      : gpsStatus.state === 'lost_fix' ? 'var(--color-red)'
      : 'var(--color-gray)'
    : 'var(--color-gray)';
  const gpsCardBg = gpsStatus
    ? gpsStatus.state === 'locked' ? 'var(--status-emerald-bg)'
      : gpsStatus.state === 'cold_start' ? 'var(--status-amber-bg)'
      : gpsStatus.state === 'searching' ? 'rgba(249, 115, 22, 0.15)'
      : gpsStatus.state === 'lost_fix' ? 'var(--status-red-bg)'
      : 'var(--status-gray-bg)'
    : 'var(--status-gray-bg)';
  const gpsLabel = gpsStatus
    ? gpsStatus.state === 'locked' ? 'GPS Locked'
      : gpsStatus.state === 'cold_start' ? 'Acquiring…'
      : gpsStatus.state === 'searching' ? 'No Fix'
      : gpsStatus.state === 'lost_fix' ? 'Fix Lost'
      : 'No Data'
    : 'No Data';

  return (
    <section
      role="region"
      aria-label="Emergency Status Monitor"
      aria-live="assertive"
      aria-atomic="true"
    >
    <GlassCard
      className={`p-6 md:p-8 ${isAccidentActive ? 'emergency-panel-alert' : ''}`}
      style={isAccidentActive ? { borderColor: 'var(--color-red)', borderWidth: '2px' } : undefined}
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div
            className={`p-2.5 rounded-xl ${isAccidentActive ? 'animate-slow-pulse' : ''}`}
            style={{ background: isAccidentActive ? 'var(--status-red-bg)' : 'var(--status-blue-bg)' }}
          >
            {isAccidentActive
              ? <ShieldAlert size={22} style={{ color: 'var(--color-red)' }} />
              : <Shield size={22} style={{ color: 'var(--color-blue)' }} />
            }
          </div>
          <div>
            <h2 className="text-base font-bold text-[var(--text-primary)] tracking-wide">
              Emergency Status Panel
            </h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Real-time safety monitoring for non-technical observers
            </p>
          </div>
        </div>
        {isAccidentActive && (
          <button
            onClick={handleMarkSafe}
            disabled={isSafeMarking}
            aria-label={`Mark user as safe — ${isSafeMarking ? 'processing' : 'press to reset accident alert'}`}
            className="emergency-safe-btn px-6 py-4 md:py-3 rounded-xl text-sm font-bold text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-60 disabled:cursor-wait focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400 focus-visible:ring-offset-2"
            style={{ background: 'linear-gradient(135deg, #059669, #10b981)', minHeight: '48px' }}
          >
            <ShieldCheck size={18} className="inline mr-2 -mt-0.5" />
            {isSafeMarking ? 'Marking Safe…' : "I'm Safe"}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] lg:grid-cols-[minmax(240px,320px)_1fr] gap-6">
        {/* Left: Impact Meter */}
        <div className="flex flex-col items-center justify-center">
          <h3 className="text-[10px] font-bold text-[var(--text-muted)] tracking-[0.2em] uppercase mb-3">
            Impact Meter
          </h3>
          <ImpactMeter value={severityPercent} rawAcceleration={impactMagnitude} zone={impactZone} />
          <div
            className={`mt-3 flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold ${
              isAccidentActive ? 'gauge-status-pulse' : ''
            }`}
            style={{
              background: impactZone === 'danger' ? 'var(--status-red-bg)'
                : impactZone === 'caution' ? 'var(--status-amber-bg)'
                : 'var(--status-emerald-bg)',
              color: impactZone === 'danger' ? 'var(--color-red)'
                : impactZone === 'caution' ? 'var(--color-amber)'
                : 'var(--color-emerald)',
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full pulse-live"
              style={{
                background: impactZone === 'danger' ? 'var(--color-red)'
                  : impactZone === 'caution' ? 'var(--color-amber)'
                  : 'var(--color-emerald)',
              }}
            />
            {impactZone === 'danger' ? 'Possible Accident'
              : impactZone === 'caution' ? 'Sudden Movement'
              : 'Normal Movement'}
          </div>
        </div>

        {/* Right: 6 Status Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
          {/* Card 1: Helmet Status */}
          <StatusCard
            icon={<Shield size={20} />}
            label="Helmet Status"
            value={isOnline ? 'Online' : 'Offline'}
            color={isOnline ? 'var(--color-emerald)' : 'var(--color-red)'}
            bg={isOnline ? 'var(--status-emerald-bg)' : 'var(--status-red-bg)'}
          />

          {/* Card 2: Impact Level */}
          <StatusCard
            icon={<Activity size={20} />}
            label="Impact Level"
            value={`${severityPercent}%`}
            subValue={`${impactMagnitude.toFixed(1)} m/s²`}
            color={impactZone === 'danger' ? 'var(--color-red)' : impactZone === 'caution' ? 'var(--color-amber)' : 'var(--color-emerald)'}
            bg={impactZone === 'danger' ? 'var(--status-red-bg)' : impactZone === 'caution' ? 'var(--status-amber-bg)' : 'var(--status-emerald-bg)'}
          />

          {/* Card 3: Accident Detection */}
          <StatusCard
            icon={<AlertTriangle size={20} />}
            label="Accident Detection"
            value={isAccidentActive ? 'DETECTED' : 'No Accident'}
            color={isAccidentActive ? 'var(--color-red)' : 'var(--color-emerald)'}
            bg={isAccidentActive ? 'var(--status-red-bg)' : 'var(--status-emerald-bg)'}
            pulse={isAccidentActive}
          />

          {/* Card 4: Impact Severity */}
          <div className="p-4 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] flex flex-col gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg" style={{ background: sevCfg.bg }}>
                <Zap size={20} style={{ color: sevCfg.color }} />
              </div>
              <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.15em]">
                Impact Severity
              </span>
            </div>
            <SeverityBadge severity={severity} size="lg" />
          </div>

          {/* Card 5: Emergency Timer */}
          <div className="p-4 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] flex flex-col items-center justify-center gap-2">
            <AccidentTimer elapsedSeconds={elapsedSeconds} isActive={isAccidentActive} />
          </div>

          {/* Card 6: User Response */}
          <StatusCard
            icon={<UserCheck size={20} />}
            label="User Response"
            value={resCfg.label}
            color={resCfg.color}
            bg={resCfg.bg}
            pulse={userResponse === 'not_received'}
          />

          {/* Card 7: GPS Status */}
          {gpsStatus && (
            <StatusCard
              icon={<Satellite size={20} />}
              label="GPS Status"
              value={gpsLabel}
              subValue={gpsStatus.state === 'cold_start'
                ? `${gpsStatus.coldStartProgress}% acquired`
                : gpsStatus.coordinates
                  ? `${gpsStatus.coordinates.lat.toFixed(4)}°, ${gpsStatus.coordinates.lng.toFixed(4)}°`
                  : undefined}
              color={gpsCardColor}
              bg={gpsCardBg}
              pulse={gpsStatus.state === 'lost_fix'}
            />
          )}
        </div>
      </div>
    </GlassCard>
    </section>
  );
}

function StatusCard({
  icon,
  label,
  value,
  subValue,
  color,
  bg,
  pulse,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subValue?: string;
  color: string;
  bg: string;
  pulse?: boolean;
}) {
  return (
    <div
      className={`p-4 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] flex flex-col gap-3 status-card-hover ${
        pulse ? 'animate-slow-pulse' : ''
      }`}
    >
      <div className="flex items-center gap-2.5">
        <div className="p-2 rounded-lg" style={{ background: bg }}>
          <span style={{ color }}>{icon}</span>
        </div>
        <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.15em]">
          {label}
        </span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="w-2 h-2 rounded-full shrink-0 self-center" style={{ background: color }} />
        <span className="text-lg font-bold" style={{ color }}>{value}</span>
        {subValue && (
          <span className="text-xs text-[var(--text-muted)] font-medium">{subValue}</span>
        )}
      </div>
    </div>
  );
}
