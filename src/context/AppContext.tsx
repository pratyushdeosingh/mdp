import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { SensorData, LogEntry, DataMode, ThemeMode, ConnectionStatus, SerialPortInfo } from '../types';
import { generateSensorData, generateLogEntry, resetSimulatorState } from '../utils/simulator';
import { useSerialConnection } from '../hooks/useSerialConnection';

interface AppContextType {
  sensorData: SensorData | null;
  sensorHistory: SensorData[];
  logs: LogEntry[];
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

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [sensorData, setSensorData] = useState<SensorData | null>(null);
  const [sensorHistory, setSensorHistory] = useState<SensorData[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [dataMode, setDataMode] = useState<DataMode>('simulation');
  const [theme, setTheme] = useState<ThemeMode>('dark');
  const [isStreaming, setIsStreaming] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Hardware data callback — receives SensorData from the WebSocket bridge
  const handleHardwareData = useCallback((data: SensorData) => {
    setSensorData(data);
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
  }, []);

  // Serial connection hook
  const serial = useSerialConnection(handleHardwareData);

  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      document.documentElement.classList.toggle('dark', next === 'dark');
      return next;
    });
  }, []);

  // Initialize dark mode
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  // Data simulation loop
  useEffect(() => {
    if (dataMode === 'simulation' && isStreaming) {
      // Reset simulator state so we don't continue from old coordinates
      resetSimulatorState();

      // Generate initial data immediately
      const initial = generateSensorData();
      setSensorData(initial);
      setSensorHistory([initial]);

      intervalRef.current = setInterval(() => {
        const newData = generateSensorData();
        setSensorData(newData);
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
  }, [dataMode, isStreaming]);

  return (
    <AppContext.Provider
      value={{
        sensorData,
        sensorHistory,
        logs,
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
