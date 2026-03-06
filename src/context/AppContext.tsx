import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import type { SensorData, LogEntry, DataMode, ThemeMode, ConnectionStatus, SerialPortInfo, AccidentEvent } from '../types';
import { generateSensorData, generateLogEntry, resetSimulatorState } from '../utils/simulator';
import { useSerialConnection } from '../hooks/useSerialConnection';

interface AppContextType {
  sensorData: SensorData | null;
  sensorHistory: SensorData[];
  logs: LogEntry[];
  accidentEvents: AccidentEvent[];
  dataMode: DataMode;
  theme: ThemeMode;
  isStreaming: boolean;
  setDataMode: (mode: DataMode) => void;
  toggleTheme: () => void;
  setIsStreaming: (v: boolean) => void;
  // Hardware connection
  connectionStatus: ConnectionStatus;
  availablePorts: SerialPortInfo[];
  selectedPort: string;
  setSelectedPort: (port: string) => void;
  lastConnectionError: string | null;
  refreshPorts: () => Promise<void>;
  connectSerial: (port: string) => Promise<void>;
  disconnectSerial: () => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

const MAX_HISTORY = 60;
const MAX_LOGS = 200;

export function AppProvider({ children }: { children: ReactNode }) {
  const [sensorData, setSensorData] = useState<SensorData | null>(null);
  const [sensorHistory, setSensorHistory] = useState<SensorData[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [accidentEvents, setAccidentEvents] = useState<AccidentEvent[]>([]);
  const [dataMode, setDataMode] = useState<DataMode>('simulation');
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('helmet-theme');
    return saved === 'light' ? 'light' : 'dark';
  });
  const [isStreaming, setIsStreaming] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const accidentIdRef = useRef(0);
  const prevAccidentRef = useRef(false);

  // Track accident transitions (false→true = new event, true→false = resolved)
  const trackAccident = useCallback((data: SensorData) => {
    const wasActive = prevAccidentRef.current;
    const isActive = data.accidentDetected;
    prevAccidentRef.current = isActive;

    if (isActive && !wasActive) {
      // New accident event
      accidentIdRef.current += 1;
      const event: AccidentEvent = {
        id: accidentIdRef.current,
        timestamp: data.timestamp,
        gps: { ...data.gps },
        accelerometer: { ...data.accelerometer },
        totalAcceleration: data.totalAcceleration,
        resolved: false,
      };
      setAccidentEvents(prev => [event, ...prev]);
    } else if (!isActive && wasActive) {
      // Resolve most recent active event
      setAccidentEvents(prev =>
        prev.map((e, i) => i === 0 && !e.resolved ? { ...e, resolved: true, resolvedAt: Date.now() } : e)
      );
    }
  }, []);

  // Hardware data callback — receives SensorData from the WebSocket bridge
  const handleHardwareData = useCallback((data: SensorData) => {
    setSensorData(data);
    trackAccident(data);
    setSensorHistory(prev => {
      const updated = prev.concat(data);
      return updated.length > MAX_HISTORY ? updated.slice(-MAX_HISTORY) : updated;
    });
    setLogs(prev => {
      const newLog: LogEntry = {
        timestamp: Date.now(),
        type: 'info',
        message: `[HW] GPS: ${data.gps.latitude.toFixed(4)},${data.gps.longitude.toFixed(4)} | Spd: ${data.gps.speed} km/h | Accel: ${data.totalAcceleration} m/s²${data.accidentDetected ? ' | !! ACCIDENT !!' : ''}`,
      };
      const updated = prev.concat(newLog);
      return updated.length > MAX_LOGS ? updated.slice(-MAX_LOGS) : updated;
    });
  }, [trackAccident]);

  // Serial connection hook
  const serial = useSerialConnection(handleHardwareData);

  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      document.documentElement.classList.toggle('dark', next === 'dark');
      localStorage.setItem('helmet-theme', next);
      return next;
    });
  }, []);

  // Initialize theme from saved preference
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, []);

  // Data simulation loop
  useEffect(() => {
    if (dataMode === 'simulation' && isStreaming) {
      // Reset simulator state so we don't continue from old coordinates
      resetSimulatorState();

      // Generate initial data immediately
      const initial = generateSensorData();
      setSensorData(initial);
      trackAccident(initial);
      setSensorHistory([initial]);

      intervalRef.current = setInterval(() => {
        const newData = generateSensorData();
        setSensorData(newData);
        trackAccident(newData);
        setSensorHistory(prev => {
          const updated = prev.concat(newData);
          return updated.length > MAX_HISTORY ? updated.slice(-MAX_HISTORY) : updated;
        });

        // Generate 1-2 log entries per tick
        const logCount = Math.random() > 0.5 ? 2 : 1;
        for (let i = 0; i < logCount; i++) {
          const newLog = generateLogEntry();
          setLogs(prev => {
            const updated = prev.concat(newLog);
            return updated.length > MAX_LOGS ? updated.slice(-MAX_LOGS) : updated;
          });
        }
      }, 1000);

      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    } else if (dataMode === 'hardware') {
      // Stop simulation interval
      if (intervalRef.current) clearInterval(intervalRef.current);
      // Clear sensor data — will be populated by hardware connection
      setSensorData(null);
      setSensorHistory([]);
      setLogs(prev => [...prev, {
        timestamp: Date.now(),
        type: 'warning',
        message: '[SYS] Switched to HARDWARE mode – Use the connection panel to connect your Arduino.',
      }]);
    }
  }, [dataMode, isStreaming, trackAccident]);

  return (
    <AppContext.Provider
      value={{
        sensorData,
        sensorHistory,
        logs,
        accidentEvents,
        dataMode,
        theme,
        isStreaming,
        setDataMode,
        toggleTheme,
        setIsStreaming,
        // Hardware connection state
        connectionStatus: serial.connectionStatus,
        availablePorts: serial.availablePorts,
        selectedPort: serial.selectedPort,
        setSelectedPort: serial.setSelectedPort,
        lastConnectionError: serial.lastError,
        refreshPorts: serial.refreshPorts,
        connectSerial: serial.connect,
        disconnectSerial: serial.disconnect,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
}
