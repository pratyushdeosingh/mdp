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
} from 'recharts';
import GlassCard from '../components/GlassCard';
import { useAppContext } from '../context/AppContext';
import { Activity, Gauge } from 'lucide-react';

export default function Analytics() {
  const { sensorHistory } = useAppContext();

  if (sensorHistory.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-[var(--text-muted)]">Collecting sensor data...</p>
      </div>
    );
  }

  const chartData = sensorHistory.map((d, i) => ({
    time: new Date(d.timestamp).toLocaleTimeString([], { minute: '2-digit', second: '2-digit' }),
    index: i,
    accX: d.accelerometer.x,
    accY: d.accelerometer.y,
    accZ: d.accelerometer.z,
    speed: d.gps.speed,
    altitude: d.gps.altitude,
    signal: d.signalStrength,
  }));

  const tooltipStyle = {
    contentStyle: {
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border-color)',
      borderRadius: '12px',
      fontSize: '12px',
      color: 'var(--text-primary)',
    },
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Sensor Analytics</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Last {sensorHistory.length} seconds of telemetry data
        </p>
      </div>

      {/* Accelerometer Chart */}
      <GlassCard>
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
          <Activity size={16} className="text-orange-400" />
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
            <Line type="monotone" dataKey="accX" stroke="#f97316" strokeWidth={2} dot={false} name="Acc X" />
            <Line type="monotone" dataKey="accY" stroke="#06b6d4" strokeWidth={2} dot={false} name="Acc Y" />
            <Line type="monotone" dataKey="accZ" stroke="#a855f7" strokeWidth={2} dot={false} name="Acc Z" />
          </LineChart>
        </ResponsiveContainer>
      </GlassCard>

      {/* Speed Chart */}
      <GlassCard>
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
          <Gauge size={16} className="text-emerald-400" />
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
            />
          </AreaChart>
        </ResponsiveContainer>
      </GlassCard>

      {/* Altitude + Signal side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <GlassCard>
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Altitude vs Time</h3>
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

        <GlassCard>
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Signal Strength vs Time</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="sigGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis dataKey="time" tick={{ fontSize: 9, fill: 'var(--text-muted)' }} stroke="var(--border-color)" interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 9, fill: 'var(--text-muted)' }} stroke="var(--border-color)" unit="%" domain={[0, 100]} />
              <Tooltip {...tooltipStyle} />
              <Area type="monotone" dataKey="signal" stroke="#3b82f6" strokeWidth={2} fill="url(#sigGradient)" name="Signal" />
            </AreaChart>
          </ResponsiveContainer>
        </GlassCard>
      </div>
    </div>
  );
}
