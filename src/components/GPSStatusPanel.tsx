import { useMemo } from 'react';
import type { GPSStatus, GPSState } from '../hooks/useGPSStatus';

interface GPSStatusPanelProps {
  gpsStatus: GPSStatus;
}

const stateConfig: Record<GPSState, { label: string; color: string; icon: string; bg: string }> = {
  unknown:    { label: 'No Data',      color: 'var(--color-gray, #6b7280)',   icon: '❓', bg: 'var(--status-gray-bg, #f3f4f6)' },
  cold_start: { label: 'Cold Start',   color: 'var(--color-yellow, #f59e0b)', icon: '🛰️', bg: 'var(--status-yellow-bg, #fef9c3)' },
  searching:  { label: 'No Fix',       color: 'var(--color-orange, #f97316)', icon: '⚠️', bg: 'var(--status-orange-bg, #fff7ed)' },
  locked:     { label: 'GPS Locked',   color: 'var(--color-green, #22c55e)',  icon: '✅', bg: 'var(--status-green-bg, #dcfce7)' },
  lost_fix:   { label: 'Fix Lost',     color: 'var(--color-red, #ef4444)',    icon: '📡', bg: 'var(--status-red-bg, #fef2f2)' },
};

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function GPSStatusPanel({ gpsStatus }: GPSStatusPanelProps) {
  const config = stateConfig[gpsStatus.state];

  const progressBar = useMemo(() => {
    if (gpsStatus.state !== 'cold_start') return null;
    return (
      <div className="gps-progress-container">
        <div className="gps-progress-bar">
          <div
            className="gps-progress-fill"
            style={{ width: `${gpsStatus.coldStartProgress}%` }}
          />
        </div>
        <span className="gps-progress-label">
          {gpsStatus.coldStartProgress}% — ~{Math.ceil((600 - gpsStatus.elapsedSinceStart) / 60)} min remaining
        </span>
      </div>
    );
  }, [gpsStatus.state, gpsStatus.coldStartProgress, gpsStatus.elapsedSinceStart]);

  return (
    <div className="gps-status-panel" style={{ borderColor: config.color }}>
      {/* Header */}
      <div className="gps-status-header">
        <span className="gps-status-icon">{config.icon}</span>
        <div className="gps-status-title">
          <h3 style={{ color: config.color }}>{config.label}</h3>
          <span className="gps-elapsed">Uptime: {formatTime(gpsStatus.elapsedSinceStart)}</span>
        </div>
        <div
          className={`gps-status-dot ${gpsStatus.state === 'locked' ? 'gps-dot-pulse' : ''}`}
          style={{ backgroundColor: config.color }}
        />
      </div>

      {/* Message */}
      <p className="gps-status-message">{gpsStatus.message}</p>

      {/* Cold start progress bar */}
      {progressBar}

      {/* Coordinates when locked */}
      {gpsStatus.state === 'locked' && gpsStatus.coordinates && (
        <div className="gps-coordinates">
          <span>📍 {gpsStatus.coordinates.lat.toFixed(6)}, {gpsStatus.coordinates.lng.toFixed(6)}</span>
        </div>
      )}

      {/* Lost fix timer */}
      {gpsStatus.state === 'lost_fix' && (
        <div className="gps-lost-timer">
          <span>Signal lost for: <strong>{formatTime(gpsStatus.secondsSinceLostFix)}</strong></span>
        </div>
      )}

      {/* Search taking too long warning */}
      {gpsStatus.state === 'searching' && (
        <div className="gps-warning-box">
          <span>⚠️ GPS search has exceeded 15 minutes. Check:</span>
          <ul>
            <li>Helmet is outdoors with clear sky view</li>
            <li>GPS antenna is not blocked or damaged</li>
            <li>GPS module wiring (TX → pin 4, RX → pin 3)</li>
          </ul>
        </div>
      )}
    </div>
  );
}
