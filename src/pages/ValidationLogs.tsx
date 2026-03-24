import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ShieldCheck, ShieldAlert, AlertTriangle, CheckCircle, XCircle, Filter, Trash2 } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import { useAppContext } from '../context/AppContext';
import type { SensorData } from '../types';

interface ValidationEntry {
  id: number;
  timestamp: number;
  check: string;
  status: 'pass' | 'warn' | 'fail';
  message: string;
  value?: string;
}

type FilterType = 'all' | 'pass' | 'warn' | 'fail';

const MAX_ENTRIES = 500;

function validateSensorData(data: SensorData): ValidationEntry[] {
  const now = Date.now();
  const entries: ValidationEntry[] = [];
  let idCounter = now;

  // Accelerometer range check (MPU6050 ±2g = ±19.6 m/s²; extreme values suggest noise)
  const accelMag = data.totalAcceleration;
  if (accelMag > 50) {
    entries.push({
      id: idCounter++, timestamp: now, check: 'Accelerometer Range',
      status: 'fail', message: `Total acceleration ${accelMag.toFixed(1)} m/s² exceeds sensor range`,
      value: `${accelMag.toFixed(1)} m/s²`,
    });
  } else if (accelMag > 30) {
    entries.push({
      id: idCounter++, timestamp: now, check: 'Accelerometer Range',
      status: 'warn', message: `High acceleration reading: ${accelMag.toFixed(1)} m/s²`,
      value: `${accelMag.toFixed(1)} m/s²`,
    });
  }

  // Z-axis gravity check (should be ~9.81 when stationary, flag if wildly off)
  const zDev = Math.abs(data.accelerometer.z - 9.81);
  if (zDev > 8 && accelMag < 15) {
    entries.push({
      id: idCounter++, timestamp: now, check: 'Gravity Baseline',
      status: 'warn', message: `Z-axis (${data.accelerometer.z.toFixed(2)}) deviates ${zDev.toFixed(1)} from gravity (9.81)`,
      value: `${data.accelerometer.z.toFixed(2)} m/s²`,
    });
  }

  // GPS validity check
  if (data.gpsValid === false) {
    entries.push({
      id: idCounter++, timestamp: now, check: 'GPS Signal',
      status: 'warn', message: 'GPS has no satellite fix — coordinates are zeros',
      value: 'No fix',
    });
  } else if (data.gps.latitude === 0 && data.gps.longitude === 0 && data.gpsValid !== true) {
    entries.push({
      id: idCounter++, timestamp: now, check: 'GPS Coordinates',
      status: 'warn', message: 'GPS coordinates are (0, 0) — likely no fix',
      value: '0°, 0°',
    });
  }

  // Speed reasonableness (>200 km/h is unusual for a motorcycle/bicycle)
  if (data.gps.speed > 200) {
    entries.push({
      id: idCounter++, timestamp: now, check: 'Speed Range',
      status: 'fail', message: `Speed ${data.gps.speed} km/h is unreasonably high — possible GPS error`,
      value: `${data.gps.speed} km/h`,
    });
  }

  // Battery check
  if (data.batteryLevel < 20) {
    entries.push({
      id: idCounter++, timestamp: now, check: 'Battery Level',
      status: 'warn', message: `Battery at ${data.batteryLevel}% — consider charging`,
      value: `${data.batteryLevel}%`,
    });
  }

  // Temperature range
  if (data.temperature > 60) {
    entries.push({
      id: idCounter++, timestamp: now, check: 'Temperature',
      status: 'fail', message: `Temperature ${data.temperature}°C exceeds safe operating range`,
      value: `${data.temperature}°C`,
    });
  } else if (data.temperature > 50) {
    entries.push({
      id: idCounter++, timestamp: now, check: 'Temperature',
      status: 'warn', message: `Temperature ${data.temperature}°C is elevated`,
      value: `${data.temperature}°C`,
    });
  }

  // System status
  if (data.systemStatus === 'offline') {
    entries.push({
      id: idCounter++, timestamp: now, check: 'System Status',
      status: 'fail', message: 'System is reporting offline — both GPS and MPU6050 may be down',
      value: 'Offline',
    });
  } else if (data.systemStatus === 'warning') {
    entries.push({
      id: idCounter++, timestamp: now, check: 'System Status',
      status: 'warn', message: 'System has a warning — a sensor may be degraded',
      value: 'Warning',
    });
  }

  // Timestamp check (data should be recent)
  if (Math.abs(now - data.timestamp) > 10000) {
    entries.push({
      id: idCounter++, timestamp: now, check: 'Data Freshness',
      status: 'warn', message: `Data is ${((now - data.timestamp) / 1000).toFixed(0)}s old — possible connection lag`,
      value: `${((now - data.timestamp) / 1000).toFixed(0)}s delay`,
    });
  }

  return entries;
}

export default function ValidationLogs() {
  const { sensorData } = useAppContext();
  const [entries, setEntries] = useState<ValidationEntry[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const prevTimestampRef = useRef(0);

  const addEntries = useCallback((newEntries: ValidationEntry[]) => {
    setEntries(prev => {
      const updated = [...newEntries, ...prev];
      return updated.length > MAX_ENTRIES ? updated.slice(0, MAX_ENTRIES) : updated;
    });
  }, []);

  useEffect(() => {
    if (!sensorData || sensorData.timestamp === prevTimestampRef.current) return;
    prevTimestampRef.current = sensorData.timestamp;

    const validationResults = validateSensorData(sensorData);
    if (validationResults.length > 0) {
      // Use queueMicrotask to avoid synchronous setState in effect
      queueMicrotask(() => addEntries(validationResults));
    }
  }, [sensorData, addEntries]);

  const filtered = useMemo(() =>
    filter === 'all' ? entries : entries.filter(e => e.status === filter),
    [entries, filter]
  );

  const counts = useMemo(() => ({
    pass: entries.filter(e => e.status === 'pass').length,
    warn: entries.filter(e => e.status === 'warn').length,
    fail: entries.filter(e => e.status === 'fail').length,
  }), [entries]);

  const statusIcon = (s: ValidationEntry['status']) => {
    switch (s) {
      case 'pass': return <CheckCircle size={14} style={{ color: 'var(--color-emerald)' }} />;
      case 'warn': return <AlertTriangle size={14} style={{ color: 'var(--color-amber)' }} />;
      case 'fail': return <XCircle size={14} style={{ color: 'var(--color-red)' }} />;
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Validation Logs</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1.5">
            Real-time data integrity checks on incoming sensor readings
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
            entries.length === 0 ? '' : counts.fail > 0 ? '' : counts.warn > 0 ? '' : ''
          }`}
            style={{
              background: entries.length === 0 ? 'var(--status-gray-bg)'
                : counts.fail > 0 ? 'var(--status-red-bg)'
                : counts.warn > 0 ? 'var(--status-amber-bg)'
                : 'var(--status-emerald-bg)',
              color: entries.length === 0 ? 'var(--color-gray)'
                : counts.fail > 0 ? 'var(--color-red)'
                : counts.warn > 0 ? 'var(--color-amber)'
                : 'var(--color-emerald)',
            }}
          >
            {entries.length === 0 ? <ShieldCheck size={14} /> : counts.fail > 0 ? <ShieldAlert size={14} /> : <ShieldCheck size={14} />}
            {entries.length === 0 ? 'All Clear' : counts.fail > 0 ? `${counts.fail} Failures` : counts.warn > 0 ? `${counts.warn} Warnings` : 'All Clear'}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <GlassCard className="p-4 text-center">
          <p className="text-2xl font-bold" style={{ color: 'var(--color-red)' }}>{counts.fail}</p>
          <p className="text-xs text-[var(--text-muted)]">Failures</p>
        </GlassCard>
        <GlassCard className="p-4 text-center">
          <p className="text-2xl font-bold" style={{ color: 'var(--color-amber)' }}>{counts.warn}</p>
          <p className="text-xs text-[var(--text-muted)]">Warnings</p>
        </GlassCard>
        <GlassCard className="p-4 text-center">
          <p className="text-2xl font-bold" style={{ color: 'var(--color-emerald)' }}>{entries.length === 0 ? '✓' : counts.pass}</p>
          <p className="text-xs text-[var(--text-muted)]">Passes</p>
        </GlassCard>
      </div>

      {/* Filter & clear */}
      <div className="flex items-center gap-3">
        <Filter size={14} className="text-[var(--text-muted)]" />
        {(['all', 'fail', 'warn', 'pass'] as FilterType[]).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === f ? 'text-white' : 'text-[var(--text-secondary)]'
            }`}
            style={{
              background: filter === f
                ? f === 'fail' ? 'var(--color-red)' : f === 'warn' ? 'var(--color-amber)' : f === 'pass' ? 'var(--color-emerald)' : 'var(--accent)'
                : 'var(--bg-secondary)',
            }}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
        <div className="flex-1" />
        <button
          onClick={() => setEntries([])}
          disabled={entries.length === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[var(--text-muted)] hover:text-[var(--color-red)] transition-colors disabled:opacity-30"
        >
          <Trash2 size={12} /> Clear
        </button>
      </div>

      {/* Log entries */}
      {filtered.length === 0 ? (
        <GlassCard className="flex flex-col items-center justify-center py-16">
          <div className="p-4 rounded-2xl mb-4" style={{ background: 'var(--status-emerald-bg)' }}>
            <ShieldCheck size={32} style={{ color: 'var(--color-emerald)' }} />
          </div>
          <p className="text-lg font-semibold text-[var(--text-primary)]">
            {entries.length === 0 ? 'No Issues Detected' : 'No matching entries'}
          </p>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            {entries.length === 0
              ? 'All sensor readings are passing validation checks.'
              : 'Try a different filter to see other entries.'}
          </p>
        </GlassCard>
      ) : (
        <GlassCard className="divide-y divide-[var(--border-color)] max-h-[600px] overflow-y-auto">
          {filtered.map(entry => (
            <div key={entry.id} className="flex items-start gap-3 px-4 py-3">
              <div className="mt-0.5">{statusIcon(entry.status)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[var(--text-primary)]">{entry.check}</span>
                  {entry.value && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-[var(--bg-secondary)] text-[var(--text-muted)]">
                      {entry.value}
                    </span>
                  )}
                </div>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">{entry.message}</p>
              </div>
              <span className="text-[10px] text-[var(--text-muted)] shrink-0 font-mono">
                {new Date(entry.timestamp).toLocaleTimeString()}
              </span>
            </div>
          ))}
        </GlassCard>
      )}
    </div>
  );
}
