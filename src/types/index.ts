export interface SensorData {
  timestamp: number;
  gps: {
    latitude: number;
    longitude: number;
    speed: number;
    altitude: number;
  };
  accelerometer: {
    x: number;
    y: number;
    z: number;
  };
  systemStatus: 'online' | 'offline' | 'warning';
  signalStrength: number;
  batteryLevel: number;
  temperature: number;
}

export interface HardwareModule {
  name: string;
  id: string;
  status: 'working' | 'damaged' | 'pending' | 'not-connected';
  description: string;
  nextAction: string;
  icon: string;
}

export interface LogEntry {
  timestamp: number;
  type: 'info' | 'warning' | 'error' | 'success' | 'command';
  message: string;
}

export type DataMode = 'simulation' | 'hardware';
export type ThemeMode = 'dark' | 'light';
