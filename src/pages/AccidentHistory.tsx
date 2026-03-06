import { AlertTriangle, MapPin, Gauge, Activity, Clock, CheckCircle, XCircle } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import { useAppContext } from '../context/AppContext';

export default function AccidentHistory() {
  const { accidentEvents, dataMode } = useAppContext();

  const activeCount = accidentEvents.filter(e => !e.resolved).length;
  const resolvedCount = accidentEvents.filter(e => e.resolved).length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Accident History</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1.5">
            All detected accident events with timestamps and sensor readings
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20">
            <XCircle size={14} className="text-red-400" />
            <span className="text-xs font-medium text-red-400">{activeCount} Active</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <CheckCircle size={14} className="text-emerald-400" />
            <span className="text-xs font-medium text-emerald-400">{resolvedCount} Resolved</span>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <GlassCard className="flex items-center gap-4 p-5">
          <div className="p-2.5 rounded-xl bg-red-500/10">
            <AlertTriangle size={20} className="text-red-400" />
          </div>
          <div>
            <p className="text-xs text-[var(--text-muted)]">Total Events</p>
            <p className="text-xl font-bold text-[var(--text-primary)]">{accidentEvents.length}</p>
          </div>
        </GlassCard>
        <GlassCard className="flex items-center gap-4 p-5">
          <div className="p-2.5 rounded-xl bg-amber-500/10">
            <Activity size={20} className="text-amber-400" />
          </div>
          <div>
            <p className="text-xs text-[var(--text-muted)]">Peak Acceleration</p>
            <p className="text-xl font-bold text-[var(--text-primary)]">
              {accidentEvents.length > 0
                ? Math.max(...accidentEvents.map(e => e.totalAcceleration)).toFixed(1)
                : '0'} m/s²
            </p>
          </div>
        </GlassCard>
        <GlassCard className="flex items-center gap-4 p-5">
          <div className="p-2.5 rounded-xl bg-blue-500/10">
            <Clock size={20} className="text-blue-400" />
          </div>
          <div>
            <p className="text-xs text-[var(--text-muted)]">Mode</p>
            <p className="text-xl font-bold text-[var(--text-primary)] capitalize">{dataMode}</p>
          </div>
        </GlassCard>
      </div>

      {/* Event List */}
      {accidentEvents.length === 0 ? (
        <GlassCard className="flex flex-col items-center justify-center py-16">
          <div className="p-4 rounded-2xl bg-emerald-500/10 mb-4">
            <CheckCircle size={32} className="text-emerald-400" />
          </div>
          <p className="text-lg font-semibold text-[var(--text-primary)]">No Accidents Detected</p>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            The system is monitoring — events will appear here when detected.
          </p>
        </GlassCard>
      ) : (
        <div className="space-y-4 stagger-children">
          {accidentEvents.map(event => {
            const time = new Date(event.timestamp);
            const resolvedTime = event.resolvedAt ? new Date(event.resolvedAt) : null;
            const duration = event.resolvedAt
              ? ((event.resolvedAt - event.timestamp) / 1000).toFixed(1)
              : null;

            return (
              <GlassCard
                key={event.id}
                className={`${!event.resolved ? 'border-red-500/30' : ''}`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  {/* Status + ID */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className={`p-2.5 rounded-xl ${event.resolved ? 'bg-emerald-500/10' : 'bg-red-500/10 animate-pulse'}`}>
                      <AlertTriangle size={20} className={event.resolved ? 'text-emerald-400' : 'text-red-400'} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-[var(--text-primary)]">Event #{event.id}</span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${event.resolved
                          ? 'bg-emerald-500/15 text-emerald-400'
                          : 'bg-red-500/15 text-red-400'
                        }`}>
                          {event.resolved ? 'RESOLVED' : 'ACTIVE'}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--text-muted)]">
                        {time.toLocaleTimeString()} — {time.toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Sensor Readings */}
                  <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="text-blue-400 shrink-0" />
                      <div>
                        <p className="text-[10px] text-[var(--text-muted)]">Location</p>
                        <p className="text-xs font-medium text-[var(--text-primary)]">
                          {event.gps.latitude.toFixed(4)}°, {event.gps.longitude.toFixed(4)}°
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Gauge size={14} className="text-emerald-400 shrink-0" />
                      <div>
                        <p className="text-[10px] text-[var(--text-muted)]">Speed</p>
                        <p className="text-xs font-medium text-[var(--text-primary)]">{event.gps.speed.toFixed(1)} km/h</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Activity size={14} className="text-red-400 shrink-0" />
                      <div>
                        <p className="text-[10px] text-[var(--text-muted)]">Total Accel</p>
                        <p className="text-xs font-bold text-red-400">{event.totalAcceleration.toFixed(2)} m/s²</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={14} className="text-amber-400 shrink-0" />
                      <div>
                        <p className="text-[10px] text-[var(--text-muted)]">Duration</p>
                        <p className="text-xs font-medium text-[var(--text-primary)]">
                          {duration ? `${duration}s` : 'Ongoing'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Resolution Info */}
                  {resolvedTime && (
                    <div className="text-xs text-[var(--text-muted)] shrink-0">
                      Resolved at {resolvedTime.toLocaleTimeString()}
                    </div>
                  )}
                </div>

                {/* Accelerometer Detail */}
                <div className="mt-3 pt-3 border-t border-[var(--border-color)] flex gap-6">
                  {(['x', 'y', 'z'] as const).map(axis => (
                    <div key={axis} className="text-xs">
                      <span className="text-[var(--text-muted)]">Acc {axis.toUpperCase()}: </span>
                      <span className="font-medium text-[var(--text-primary)]">{event.accelerometer[axis].toFixed(3)} m/s²</span>
                    </div>
                  ))}
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
