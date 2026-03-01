import { useEffect } from 'react';
import { Usb, RefreshCw, Plug, Unplug, AlertCircle } from 'lucide-react';
import GlassCard from './GlassCard';
import { useAppContext } from '../context/AppContext';

export default function ConnectionPanel() {
  const {
    connectionStatus,
    availablePorts,
    selectedPort,
    setSelectedPort,
    lastConnectionError,
    refreshPorts,
    connectSerial,
    disconnectSerial,
  } = useAppContext();

  // Auto-refresh ports on mount
  useEffect(() => {
    refreshPorts();
  }, [refreshPorts]);

  const isConnected = connectionStatus === 'connected';
  const isConnecting = connectionStatus === 'connecting';

  const statusColor =
    connectionStatus === 'connected' ? 'bg-emerald-400' :
    connectionStatus === 'connecting' ? 'bg-amber-400 animate-pulse' :
    connectionStatus === 'error' ? 'bg-red-400' :
    'bg-gray-400';

  const statusLabel =
    connectionStatus === 'connected' ? 'Connected' :
    connectionStatus === 'connecting' ? 'Connecting...' :
    connectionStatus === 'error' ? 'Error' :
    'Disconnected';

  return (
    <GlassCard className="w-full max-w-lg">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2.5 rounded-xl bg-blue-500/10">
          <Usb size={20} className="text-blue-400" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Serial Connection</h3>
          <p className="text-[10px] text-[var(--text-muted)]">Connect to Arduino via USB</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${statusColor}`} />
          <span className="text-xs text-[var(--text-muted)]">{statusLabel}</span>
        </div>
      </div>

      {/* Port selection */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <select
            value={selectedPort}
            onChange={(e) => setSelectedPort(e.target.value)}
            disabled={isConnected || isConnecting}
            className="flex-1 px-3 py-2 rounded-lg text-sm bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] outline-none focus:border-blue-500 transition-colors disabled:opacity-50"
          >
            {availablePorts.length === 0 ? (
              <option value="">No ports found</option>
            ) : (
              availablePorts.map((port) => (
                <option key={port.path} value={port.path}>
                  {port.path} {port.manufacturer ? `(${port.manufacturer})` : ''}
                </option>
              ))
            )}
          </select>
          <button
            onClick={refreshPorts}
            disabled={isConnected || isConnecting}
            className="p-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-blue-500 transition-all disabled:opacity-50"
            title="Refresh ports"
          >
            <RefreshCw size={16} />
          </button>
        </div>

        {/* Baud rate (fixed) */}
        <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-[var(--bg-secondary)]">
          <span className="text-xs text-[var(--text-muted)]">Baud Rate</span>
          <span className="text-xs font-medium text-[var(--text-primary)]">9600</span>
        </div>

        {/* Connect / Disconnect button */}
        {!isConnected ? (
          <button
            onClick={() => selectedPort && connectSerial(selectedPort)}
            disabled={!selectedPort || isConnecting}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-blue-500 hover:bg-blue-600 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isConnecting ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Plug size={14} />
                Connect
              </>
            )}
          </button>
        ) : (
          <button
            onClick={disconnectSerial}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-all"
          >
            <Unplug size={14} />
            Disconnect
          </button>
        )}

        {/* Error message */}
        {lastConnectionError && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <AlertCircle size={14} className="text-red-400 shrink-0 mt-0.5" />
            <p className="text-xs text-red-400">{lastConnectionError}</p>
          </div>
        )}

        {/* Help text */}
        <p className="text-[10px] text-[var(--text-muted)] leading-relaxed">
          Start the bridge server first: <code className="terminal-text px-1 py-0.5 rounded bg-[var(--bg-secondary)]">cd server && node server.js</code>
          <br />
          Make sure Arduino IDE Serial Monitor is closed before connecting.
        </p>
      </div>
    </GlassCard>
  );
}
