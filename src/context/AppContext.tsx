import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { SensorData, LogEntry, DataMode, ThemeMode } from '../types';
import { generateSensorData, generateLogEntry } from '../utils/simulator';

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
      // Generate initial data immediately
      const initial = generateSensorData();
      setSensorData(initial);
      setSensorHistory([initial]);

      intervalRef.current = setInterval(() => {
        const newData = generateSensorData();
        setSensorData(newData);
        setSensorHistory(prev => {
          const updated = [...prev, newData];
          return updated.length > MAX_HISTORY ? updated.slice(-MAX_HISTORY) : updated;
        });

        // Generate 1-2 log entries per tick
        const logCount = Math.random() > 0.5 ? 2 : 1;
        for (let i = 0; i < logCount; i++) {
          const newLog = generateLogEntry();
          setLogs(prev => {
            const updated = [...prev, newLog];
            return updated.length > MAX_LOGS ? updated.slice(-MAX_LOGS) : updated;
          });
        }
      }, 1000);

      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    } else if (dataMode === 'hardware') {
      // In hardware mode, clear interval and show waiting state
      if (intervalRef.current) clearInterval(intervalRef.current);
      setSensorData(null);
      setLogs(prev => [...prev, {
        timestamp: Date.now(),
        type: 'warning',
        message: '[SYS] Switched to HARDWARE mode – Waiting for device connection...',
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
