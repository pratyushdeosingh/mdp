import { MapPin } from 'lucide-react';

interface LocationCardProps {
  latitude: number;
  longitude: number;
  speed: number;
  gpsState: string;
}

function formatCoord(value: number, type: 'lat' | 'lng'): string {
  const abs = Math.abs(value);
  const dir = type === 'lat'
    ? (value >= 0 ? 'N' : 'S')
    : (value >= 0 ? 'E' : 'W');
  return `${abs.toFixed(4)}° ${dir}`;
}

export default function LocationCard({ latitude, longitude, speed, gpsState }: LocationCardProps) {
  const isActive = gpsState === 'locked';
  const statusColor = isActive ? 'var(--color-emerald)' : 'var(--color-amber)';
  const statusLabel = isActive ? 'GPS Active' : 'Acquiring…';

  return (
    <div className="status-card">
      {/* Icon */}
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5"
        style={{ background: 'rgba(0, 212, 255, 0.1)' }}
      >
        <MapPin size={22} style={{ color: 'var(--color-cyan)' }} />
      </div>

      {/* Label */}
      <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
        Last Known Location
      </p>

      {/* Coordinates */}
      <div className="mb-3">
        <p className="text-base font-bold" style={{ color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
          {formatCoord(latitude, 'lat')}
        </p>
        <p className="text-base font-bold" style={{ color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
          {formatCoord(longitude, 'lng')}
        </p>
      </div>

      {/* Speed + GPS status */}
      <div className="flex items-center justify-between mt-auto pt-3" style={{ borderTop: '1px solid var(--border-subtle)' }} aria-live="polite">
        <div className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full status-dot-pulse"
            style={{ background: statusColor }}
            aria-hidden="true"
          />
          <span className="text-xs font-medium" style={{ color: statusColor }}>
            {statusLabel}
          </span>
        </div>
        <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
          {speed.toFixed(0)} km/h
        </span>
      </div>
    </div>
  );
}
