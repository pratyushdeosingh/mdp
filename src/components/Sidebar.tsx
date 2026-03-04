import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Map,
  BarChart3,
  Terminal,
  Cpu,
  FileText,
  Sun,
  Moon,
  Radio,
  Wifi,
  Download,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { exportSensorDataCSV, downloadCSV } from '../utils/simulator';
import { generateSystemReport } from '../utils/reportGenerator';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/map', label: 'Live Map', icon: Map },
  { path: '/analytics', label: 'Analytics', icon: BarChart3 },
  { path: '/serial', label: 'Serial Monitor', icon: Terminal },
  { path: '/hardware', label: 'Hardware', icon: Cpu },
  { path: '/docs', label: 'Documentation', icon: FileText },
];

const hardwareModules = [
  { name: 'Arduino Uno R3', id: 'mcu', status: 'working' as const, description: 'Main microcontroller unit – firmware uploaded and running', nextAction: 'All modules integrated and operational', icon: 'cpu' },
  { name: 'MPU6050 Accelerometer/Gyroscope', id: 'mpu', status: 'working' as const, description: '6-axis IMU for motion and accident detection – I2C interface active', nextAction: 'Calibrated and running accident detection', icon: 'activity' },
  { name: 'NEO-6M GPS Module', id: 'gps', status: 'working' as const, description: 'GPS receiver for real-time location tracking – NMEA parsing active', nextAction: 'Tracking operational with satellite fix', icon: 'map-pin' },
  { name: 'Buzzer Alert System', id: 'buzzer', status: 'working' as const, description: 'Piezo buzzer for accident alert – driven from pin 8', nextAction: 'Alert system tested and operational', icon: 'radio' },
];

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
}

export default function Sidebar({ collapsed, setCollapsed }: SidebarProps) {
  const { theme, toggleTheme, dataMode, setDataMode, sensorData, sensorHistory, connectionStatus } = useAppContext();
  const location = useLocation();

  const isLanding = location.pathname === '/';

  if (isLanding) return null;

  const handleExportCSV = () => {
    if (sensorHistory.length === 0) return;
    const csv = exportSensorDataCSV(sensorHistory);
    downloadCSV(csv, `sensor_data_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handleExportPDF = () => {
    if (!sensorData) return;
    generateSystemReport(sensorData, sensorHistory, hardwareModules);
  };

  return (
    <aside
      className={`fixed top-0 left-0 h-screen z-40 flex flex-col transition-all duration-300 ${collapsed ? 'w-16' : 'w-60'
        }`}
      style={{
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(20px)',
        borderRight: '1px solid var(--glass-border)',
      }}
    >
      {/* Header */}
      <div className="p-4 flex items-center gap-3 border-b border-[var(--glass-border)]">
        <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center shrink-0">
          <Radio size={16} className="text-white" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-[var(--text-primary)] truncate">Smart Helmet</h2>
            <p className="text-[10px] text-[var(--text-muted)]">Review III</p>
          </div>
        )}
      </div>

      {/* Mode Toggle */}
      <div className="px-3 py-3 border-b border-[var(--glass-border)]">
        {!collapsed ? (
          <div className="flex rounded-lg overflow-hidden border border-[var(--border-color)]">
            <button
              onClick={() => setDataMode('simulation')}
              className={`flex-1 text-[10px] font-medium py-1.5 transition-all ${dataMode === 'simulation'
                  ? 'bg-blue-500 text-white'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
            >
              Simulation
            </button>
            <button
              onClick={() => setDataMode('hardware')}
              className={`flex-1 text-[10px] font-medium py-1.5 transition-all ${dataMode === 'hardware'
                  ? 'bg-emerald-500 text-white'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
            >
              Hardware
            </button>
          </div>
        ) : (
          <button
            onClick={() => setDataMode(dataMode === 'simulation' ? 'hardware' : 'simulation')}
            className="w-full flex justify-center"
            title={`Mode: ${dataMode}`}
          >
            <Wifi size={16} className={dataMode === 'simulation' ? 'text-blue-400' : 'text-emerald-400'} />
          </button>
        )}
        {dataMode === 'hardware' && !collapsed && (
          <div className="flex items-center gap-1.5 mt-2 px-1">
            <span className={`w-1.5 h-1.5 rounded-full ${connectionStatus === 'connected' ? 'bg-emerald-400 pulse-live' :
                connectionStatus === 'connecting' ? 'bg-amber-400 animate-pulse' :
                  'bg-red-400'
              }`} />
            <span className="text-[9px] text-[var(--text-muted)]">
              {connectionStatus === 'connected' ? 'Device connected' :
                connectionStatus === 'connecting' ? 'Connecting...' :
                  'No device'}
            </span>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-2 px-2 space-y-0.5 overflow-y-auto">
        {navItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive
                ? 'bg-blue-500/15 text-blue-400'
                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]'
              } ${collapsed ? 'justify-center' : ''}`
            }
            title={item.label}
          >
            <item.icon size={18} className="shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Bottom Actions */}
      <div className="p-3 space-y-1 border-t border-[var(--glass-border)]">
        <button
          onClick={handleExportCSV}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-all ${collapsed ? 'justify-center' : ''}`}
          title="Export CSV"
        >
          <Download size={14} />
          {!collapsed && 'Export CSV'}
        </button>
        <button
          onClick={handleExportPDF}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-all ${collapsed ? 'justify-center' : ''}`}
          title="Download Report"
        >
          <FileText size={14} />
          {!collapsed && 'System Report'}
        </button>
        <button
          onClick={toggleTheme}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-all ${collapsed ? 'justify-center' : ''}`}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
          {!collapsed && (theme === 'dark' ? 'Light Mode' : 'Dark Mode')}
        </button>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-all ${collapsed ? 'justify-center' : ''}`}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          {!collapsed && 'Collapse'}
        </button>
      </div>
    </aside>
  );
}
