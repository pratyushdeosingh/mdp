import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import GlassCard from '../components/GlassCard';
import EmptyState from '../components/EmptyState';
import { useAppContext } from '../context/AppContext';
import { Activity, Gauge, Shield, AlertTriangle } from 'lucide-react';

import { useMemo, memo } from 'react';

const Analytics = memo(function Analytics() {
  const { sensorHistory, accidentEvents } = useAppContext();

  const chartData = useMemo(() =>
    sensorHistory.map((d, i) => ({
      time: new Date(d.timestamp).toLocaleTimeString([], { minute: '2-digit', second: '2-digit' }),
      index: i,
      accX: d.accelerometer.x,
      accY: d.accelerometer.y,
      accZ: d.accelerometer.z,
      speed: d.gps.speed,
      altitude: d.gps.altitude,
      totalAccel: d.totalAcceleration,
    })),
    [sensorHistory]
  );

  // Incident analytics data
  const severityDistribution = useMemo(() => {
    if (accidentEvents.length === 0) return [];
    const buckets = [
      { name: 'Low (<20)', range: [0, 20], color: '#10b981', count: 0 },
      { name: 'Medium (20-25)', range: [20, 25], color: '#f59e0b', count: 0 },
      { name: 'High (25-35)', range: [25, 35], color: '#f97316', count: 0 },
      { name: 'Severe (35+)', range: [35, Infinity], color: '#ef4444', count: 0 },
    ];
    for (const event of accidentEvents) {
      const a = event.totalAcceleration;
      for (const b of buckets) {
        if (a >= b.range[0] && a < b.range[1]) { b.count++; break; }
      }
    }
    return buckets.filter(b => b.count > 0);
  }, [accidentEvents]);

  const hourDistribution = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => ({ hour: `${i}:00`, count: 0 }));
    for (const event of accidentEvents) {
      const h = new Date(event.timestamp).getHours();
      hours[h].count++;
    }
    return hours;
  }, [accidentEvents]);

  const speedCorrelation = useMemo(() =>
    accidentEvents.map(e => ({
      speed: e.gps.speed,
      acceleration: e.totalAcceleration,
      id: e.id,
    })),
    [accidentEvents]
  );

  const responseTimeData = useMemo(() =>
    accidentEvents
      .filter(e => e.resolved && e.resolvedAt)
      .map(e => ({
        id: `#${e.id}`,
        responseTime: Math.round((e.resolvedAt! - e.timestamp) / 1000),
        accel: e.totalAcceleration,
      })),
    [accidentEvents]
  );

  if (sensorHistory.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Analytics</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1.5">60-second rolling charts</p>
        </div>
        {/* Skeleton chart placeholders */}
        <div className="grid grid-cols-1 gap-6">
          {[1, 2, 3].map(i => (
            <GlassCard key={i} className="p-6">
              <div className="skeleton h-5 w-48 mb-4" />
              <div className="skeleton h-[250px] w-full" />
            </GlassCard>
          ))}
        </div>
        <EmptyState
          icon={<Activity size={32} style={{ color: 'var(--color-cyan)' }} />}
          title="Collecting Sensor Data"
          message="Charts will appear once the first data packet arrives. Start streaming to begin."
        />
      </div>
    );
  }

  const tooltipStyle = {
    contentStyle: {
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border-color)',
      borderRadius: '12px',
      fontSize: '12px',
      color: 'var(--text-primary)',
      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
      padding: '10px 14px',
    },
    cursor: { stroke: 'var(--accent)', strokeWidth: 1, strokeDasharray: '4 4' },
    animationDuration: 200,
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto w-full">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Sensor Analytics</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1.5">
          Last {sensorHistory.length} seconds of telemetry data
        </p>
      </div>

      {/* Accelerometer Chart */}
      <GlassCard className="p-6">
        <h3 className="text-xs font-bold text-[var(--text-muted)] tracking-[0.15em] uppercase mb-5 flex items-center gap-2">
          <Activity size={16} style={{ color: 'var(--color-orange)' }} />
          Accelerometer (X, Y, Z) vs Time
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
              stroke="var(--border-color)"
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
              stroke="var(--border-color)"
              domain={['auto', 'auto']}
            />
            <Tooltip {...tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Line type="monotone" dataKey="accX" stroke="#f97316" strokeWidth={2} dot={false} name="Acc X" animationDuration={800} />
            <Line type="monotone" dataKey="accY" stroke="#06b6d4" strokeWidth={2} dot={false} name="Acc Y" animationDuration={800} animationBegin={200} />
            <Line type="monotone" dataKey="accZ" stroke="#a855f7" strokeWidth={2} dot={false} name="Acc Z" animationDuration={800} animationBegin={400} />
          </LineChart>
        </ResponsiveContainer>
      </GlassCard>

      {/* Speed Chart */}
      <GlassCard className="p-6">
        <h3 className="text-xs font-bold text-[var(--text-muted)] tracking-[0.15em] uppercase mb-5 flex items-center gap-2">
          <Gauge size={16} style={{ color: 'var(--color-emerald)' }} />
          Speed vs Time
        </h3>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="speedGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
              stroke="var(--border-color)"
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
              stroke="var(--border-color)"
              unit=" km/h"
            />
            <Tooltip {...tooltipStyle} />
            <Area
              type="monotone"
              dataKey="speed"
              stroke="#10b981"
              strokeWidth={2}
              fill="url(#speedGradient)"
              name="Speed"
              animationDuration={1000}
            />
          </AreaChart>
        </ResponsiveContainer>
      </GlassCard>

      {/* Altitude + Total Acceleration side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <GlassCard className="p-6">
          <h3 className="text-xs font-bold text-[var(--text-muted)] tracking-[0.15em] uppercase mb-5">Altitude vs Time</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="altGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis dataKey="time" tick={{ fontSize: 9, fill: 'var(--text-muted)' }} stroke="var(--border-color)" interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 9, fill: 'var(--text-muted)' }} stroke="var(--border-color)" unit=" m" />
              <Tooltip {...tooltipStyle} />
              <Area type="monotone" dataKey="altitude" stroke="#8b5cf6" strokeWidth={2} fill="url(#altGradient)" name="Altitude" />
            </AreaChart>
          </ResponsiveContainer>
        </GlassCard>

        <GlassCard className="p-6">
          <h3 className="text-xs font-bold text-[var(--text-muted)] tracking-[0.15em] uppercase mb-5 flex items-center gap-2">
            <Shield size={14} style={{ color: 'var(--color-red)' }} />
            Total Acceleration vs Time
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="accelGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis dataKey="time" tick={{ fontSize: 9, fill: 'var(--text-muted)' }} stroke="var(--border-color)" interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 9, fill: 'var(--text-muted)' }} stroke="var(--border-color)" unit=" m/s²" />
              <Tooltip {...tooltipStyle} />
              <Area type="monotone" dataKey="totalAccel" stroke="#ef4444" strokeWidth={2} fill="url(#accelGradient)" name="Total Accel" />
            </AreaChart>
          </ResponsiveContainer>
        </GlassCard>
      </div>

      {/* Incident Analytics Section */}
      {accidentEvents.length > 0 && (
        <>
          <div className="mt-4">
            <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
              <AlertTriangle size={18} style={{ color: 'var(--color-red)' }} />
              Incident Analytics
            </h2>
            <p className="text-sm text-[var(--text-muted)] mt-1">
              {accidentEvents.length} incident{accidentEvents.length !== 1 ? 's' : ''} analyzed
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Severity Distribution */}
            <GlassCard className="p-6">
              <h3 className="text-xs font-bold text-[var(--text-muted)] tracking-[0.15em] uppercase mb-5">
                Severity Distribution
              </h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={severityDistribution}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, value }) => `${name}: ${value}`}
                    labelLine
                  >
                    {severityDistribution.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip {...tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </GlassCard>

            {/* Time-of-Day Pattern */}
            <GlassCard className="p-6">
              <h3 className="text-xs font-bold text-[var(--text-muted)] tracking-[0.15em] uppercase mb-5">
                Incidents by Hour of Day
              </h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={hourDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                  <XAxis dataKey="hour" tick={{ fontSize: 9, fill: 'var(--text-muted)' }} stroke="var(--border-color)" interval={2} />
                  <YAxis tick={{ fontSize: 9, fill: 'var(--text-muted)' }} stroke="var(--border-color)" allowDecimals={false} />
                  <Tooltip {...tooltipStyle} />
                  <Bar dataKey="count" name="Incidents" radius={[4, 4, 0, 0]}>
                    {hourDistribution.map((_, i) => (
                      <Cell key={i} fill={hourDistribution[i].count > 0 ? '#ef4444' : 'var(--border-color)'} opacity={hourDistribution[i].count > 0 ? 0.8 : 0.3} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </GlassCard>

            {/* Speed vs Acceleration Correlation */}
            {speedCorrelation.length > 1 && (
              <GlassCard className="p-6">
                <h3 className="text-xs font-bold text-[var(--text-muted)] tracking-[0.15em] uppercase mb-5">
                  Speed vs Impact Correlation
                </h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={speedCorrelation}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                    <XAxis dataKey="speed" tick={{ fontSize: 9, fill: 'var(--text-muted)' }} stroke="var(--border-color)" unit=" km/h" />
                    <YAxis tick={{ fontSize: 9, fill: 'var(--text-muted)' }} stroke="var(--border-color)" unit=" m/s²" />
                    <Tooltip {...tooltipStyle} />
                    <Bar dataKey="acceleration" name="Impact (m/s²)" fill="#f97316" opacity={0.7} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </GlassCard>
            )}

            {/* Response Time */}
            {responseTimeData.length > 0 && (
              <GlassCard className="p-6">
                <h3 className="text-xs font-bold text-[var(--text-muted)] tracking-[0.15em] uppercase mb-5">
                  Response Time per Incident
                </h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={responseTimeData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                    <XAxis dataKey="id" tick={{ fontSize: 9, fill: 'var(--text-muted)' }} stroke="var(--border-color)" />
                    <YAxis tick={{ fontSize: 9, fill: 'var(--text-muted)' }} stroke="var(--border-color)" unit="s" />
                    <Tooltip {...tooltipStyle} />
                    <Bar dataKey="responseTime" name="Response (seconds)" radius={[4, 4, 0, 0]}>
                      {responseTimeData.map((entry, i) => (
                        <Cell key={i} fill={entry.responseTime > 30 ? '#ef4444' : entry.responseTime > 10 ? '#f59e0b' : '#10b981'} opacity={0.8} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </GlassCard>
            )}
          </div>
        </>
      )}
    </div>
  );
});

export default Analytics;
