import { Cpu, Radio, MapPin, Activity, Wrench, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import StatusBadge from '../components/StatusBadge';
import type { HardwareModule } from '../types';

const hardwareModules: HardwareModule[] = [
  {
    name: 'Arduino Uno R3',
    id: 'mcu',
    status: 'working',
    description: 'Main microcontroller unit. Firmware uploaded via Arduino IDE. Serial communication established at 9600 baud. Handles sensor polling and GSM module interfacing.',
    nextAction: 'Integrate with all sensor modules on breadboard prototype.',
    icon: 'cpu',
  },
  {
    name: 'SIM800L GSM/GPRS Module',
    id: 'gsm',
    status: 'damaged',
    description: 'GSM/GPRS module for SMS alerts and GPRS data transmission. Module was tested with AT commands but shows intermittent power-on failures. Suspected voltage regulator damage.',
    nextAction: 'Replace with new SIM800L unit. Order backup module. Test with external 3.7V LiPo supply.',
    icon: 'radio',
  },
  {
    name: 'NEO-6M GPS Module',
    id: 'gps',
    status: 'pending',
    description: 'u-blox NEO-6M GPS receiver with ceramic antenna. Capable of tracking up to 50 channels. NMEA protocol output via UART. Module procured, awaiting integration.',
    nextAction: 'Wire TX/RX to Arduino SoftwareSerial pins. Parse $GPGGA and $GPRMC sentences. Test cold start fix time.',
    icon: 'map-pin',
  },
  {
    name: 'ADXL345 Accelerometer',
    id: 'acc',
    status: 'pending',
    description: '3-axis digital accelerometer with I2C/SPI interface. 13-bit resolution, ±16g range. Will detect vehicle motion, sudden braking, and collision events.',
    nextAction: 'Connect via I2C bus (SDA/SCL). Install Adafruit ADXL345 library. Calibrate zero-g offset values.',
    icon: 'activity',
  },
];

const iconMap: Record<string, React.ReactNode> = {
  cpu: <Cpu size={24} />,
  radio: <Radio size={24} />,
  'map-pin': <MapPin size={24} />,
  activity: <Activity size={24} />,
};

const statusIconMap: Record<string, React.ReactNode> = {
  working: <CheckCircle size={16} className="text-emerald-400" />,
  damaged: <AlertTriangle size={16} className="text-red-400" />,
  pending: <Clock size={16} className="text-amber-400" />,
};

export default function HardwareStatus() {
  const workingCount = hardwareModules.filter(m => m.status === 'working').length;
  const total = hardwareModules.length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Hardware Status</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Module integration progress and diagnostics
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs text-[var(--text-muted)]">Modules Online</p>
            <p className="text-lg font-bold text-[var(--text-primary)]">
              {workingCount}/{total}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <Cpu size={20} className="text-blue-400" />
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <GlassCard>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-[var(--text-primary)]">Hardware Integration Progress</span>
          <span className="text-sm font-bold text-blue-400">{Math.round((workingCount / total) * 100)}%</span>
        </div>
        <div className="w-full h-3 rounded-full bg-[var(--bg-secondary)] overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-1000"
            style={{ width: `${(workingCount / total) * 100}%` }}
          />
        </div>
        <p className="text-xs text-[var(--text-muted)] mt-2">
          {workingCount} of {total} modules operational. Remaining modules under procurement/repair.
        </p>
      </GlassCard>

      {/* Module Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 stagger-children">
        {hardwareModules.map(mod => (
          <GlassCard key={mod.id}>
            <div className="flex items-start gap-4">
              <div
                className={`p-3 rounded-xl shrink-0 ${
                  mod.status === 'working'
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : mod.status === 'damaged'
                    ? 'bg-red-500/10 text-red-400'
                    : 'bg-amber-500/10 text-amber-400'
                }`}
              >
                {iconMap[mod.icon]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-semibold text-[var(--text-primary)]">{mod.name}</h3>
                  <StatusBadge status={mod.status} />
                </div>
                <p className="text-xs text-[var(--text-secondary)] mb-3 leading-relaxed">
                  {mod.description}
                </p>
                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-[var(--bg-secondary)]">
                  <Wrench size={12} className="text-[var(--text-muted)] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-medium mb-0.5">
                      Next Action
                    </p>
                    <p className="text-xs text-[var(--text-secondary)]">{mod.nextAction}</p>
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Summary note */}
      <GlassCard className="border-blue-500/20">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-blue-500/10">
            <Wrench size={16} className="text-blue-400" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-1">Integration Notes</h4>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              The SIM800L module failure is the primary bottleneck. A replacement has been ordered.
              Meanwhile, the web dashboard uses simulated data that mirrors the exact data format
              the hardware will produce, ensuring seamless transition once integration is complete.
              GPS and Accelerometer modules will be wired after the GSM module is replaced and validated.
            </p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
