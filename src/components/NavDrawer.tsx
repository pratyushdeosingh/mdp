import { useState, useEffect, useCallback, useRef } from 'react';
import { NavLink } from 'react-router-dom';
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
  AlertTriangle,
  X,
  Sparkles,
  ShieldCheck,
  Zap,
  Activity,
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { exportSensorDataCSV, downloadCSV } from '../utils/simulator';
import { generateSystemReport } from '../utils/reportGenerator';
import { hardwareModules } from '../constants/hardware';
import AccordionSection from './AccordionSection';

const navPages = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/sensors', label: 'Sensor Data', icon: Activity },
  { path: '/map', label: 'Live Map', icon: Map },
  { path: '/analytics', label: 'Analytics', icon: BarChart3 },
  { path: '/accidents', label: 'Incident Log', icon: AlertTriangle },
  { path: '/serial', label: 'Serial Monitor', icon: Terminal },
  { path: '/hardware', label: 'Hardware', icon: Cpu },
  { path: '/validation', label: 'Validation', icon: ShieldCheck },
  { path: '/load-testing', label: 'Load Testing', icon: Zap },
  { path: '/onboarding', label: 'Setup Wizard', icon: Sparkles },
  { path: '/docs', label: 'Documentation', icon: FileText },
];

interface NavDrawerProps {
  open: boolean;
  onClose: () => void;
}

export default function NavDrawer({ open, onClose }: NavDrawerProps) {
  const { theme, toggleTheme, dataMode, setDataMode, sensorData, sensorHistory, connectionStatus } = useAppContext();
  const { toast } = useToast();
  const panelRef = useRef<HTMLDivElement>(null);
  const [closing, setClosing] = useState(false);

  // Define handleClose for closing with animation
  const handleClose = useCallback(() => {
    setClosing(true);
    setTimeout(() => {
      setClosing(false);
      onClose();
    }, 200);
  }, [onClose]);

  // Close on Escape key - this is a valid external event subscription
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Use onClose directly to avoid lint warning
        setClosing(true);
        setTimeout(() => {
          setClosing(false);
          onClose();
        }, 200);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  const handleExportCSV = () => {
    if (sensorHistory.length === 0) {
      toast('warning', 'No sensor data to export');
      return;
    }
    const csv = exportSensorDataCSV(sensorHistory);
    downloadCSV(csv, `sensor_data_${new Date().toISOString().split('T')[0]}.csv`);
    toast('success', `Exported ${sensorHistory.length} data points as CSV`);
  };

  const handleExportPDF = () => {
    if (!sensorData) {
      toast('warning', 'No sensor data available for report');
      return;
    }
    generateSystemReport(sensorData, sensorHistory, hardwareModules);
    toast('success', 'System report PDF generated');
  };

  if (!open && !closing) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="drawer-overlay"
        onClick={handleClose}
        aria-label="Close navigation"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className={`drawer-panel ${closing ? 'closing' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation drawer"
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid var(--border-color)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(0, 212, 255, 0.1)' }}
            >
              <Radio size={18} style={{ color: 'var(--accent)' }} />
            </div>
            <div>
              <h2
                className="text-sm font-bold"
                style={{ color: 'var(--text-primary)' }}
              >
                Smart Helmet
              </h2>
              <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                Review III
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-xl transition-colors"
            style={{ color: 'var(--text-muted)' }}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Links */}
        <AccordionSection
          title="Pages"
          icon={<LayoutDashboard size={16} />}
          defaultOpen
          accentColor="var(--accent)"
        >
          <nav className="space-y-1">
            {navPages.map(item => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'sidebar-nav-active text-[var(--nav-active-text)]'
                      : 'text-[var(--text-secondary)] hover:bg-[rgba(255,255,255,0.04)] hover:text-[var(--text-primary)]'
                  }`
                }
              >
                <item.icon size={17} className="shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </AccordionSection>

        {/* Settings */}
        <AccordionSection
          title="Settings"
          icon={<Wifi size={16} />}
          defaultOpen={false}
          accentColor="var(--color-emerald)"
        >
          {/* Data Mode Toggle */}
          <div className="mb-4">
            <label className="text-[11px] font-semibold uppercase tracking-wider mb-2 block" style={{ color: 'var(--text-muted)' }}>
              Data Source
            </label>
            <div className="flex rounded-xl overflow-hidden" style={{ border: '1px solid var(--border-color)' }}>
              <button
                onClick={() => setDataMode('simulation')}
                className="flex-1 text-xs font-semibold py-2.5 transition-all"
                style={{
                  background: dataMode === 'simulation' ? 'rgba(0, 212, 255, 0.15)' : 'transparent',
                  color: dataMode === 'simulation' ? 'var(--accent)' : 'var(--text-muted)',
                }}
              >
                Simulation
              </button>
              <button
                onClick={() => setDataMode('hardware')}
                className="flex-1 text-xs font-semibold py-2.5 transition-all"
                style={{
                  background: dataMode === 'hardware' ? 'rgba(52, 211, 153, 0.12)' : 'transparent',
                  color: dataMode === 'hardware' ? 'var(--color-emerald)' : 'var(--text-muted)',
                }}
              >
                Hardware
              </button>
            </div>
            {dataMode === 'hardware' && (
              <div className="flex items-center gap-2 mt-2.5">
                <span
                  className={`w-2 h-2 rounded-full ${connectionStatus === 'connected' ? 'pulse-live' : connectionStatus === 'connecting' ? 'pulse-live' : ''}`}
                  style={{
                    background:
                      connectionStatus === 'connected'
                        ? 'var(--color-emerald)'
                        : connectionStatus === 'connecting'
                        ? 'var(--color-amber)'
                        : 'var(--color-red)',
                  }}
                />
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {connectionStatus === 'connected'
                    ? 'Device connected'
                    : connectionStatus === 'connecting'
                    ? 'Connecting…'
                    : 'No device'}
                </span>
              </div>
            )}
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-colors"
            style={{ color: 'var(--text-secondary)' }}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </button>
        </AccordionSection>

        {/* Exports */}
        <AccordionSection
          title="Export"
          icon={<Download size={16} />}
          defaultOpen={false}
          accentColor="var(--color-purple)"
        >
          <div className="space-y-1">
            <button
              onClick={handleExportCSV}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-colors"
              style={{ color: 'var(--text-secondary)' }}
            >
              <Download size={16} />
              Export CSV
            </button>
            <button
              onClick={handleExportPDF}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-colors"
              style={{ color: 'var(--text-secondary)' }}
            >
              <FileText size={16} />
              System Report (PDF)
            </button>
          </div>
        </AccordionSection>

        {/* Bottom spacer */}
        <div className="flex-1" />
      </div>
    </>
  );
}
