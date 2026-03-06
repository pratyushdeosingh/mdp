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
  totalAcceleration: number;
  accidentDetected: boolean;
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

export interface AccidentEvent {
  id: number;
  timestamp: number;
  gps: {
    latitude: number;
    longitude: number;
    speed: number;
    altitude: number;
  };
  accelerometer: { x: number; y: number; z: number };
  totalAcceleration: number;
  resolved: boolean;
  resolvedAt?: number;
}

export type DataMode = 'simulation' | 'hardware';
export type ThemeMode = 'dark' | 'light';

// Hardware integration types

export interface ArduinoRawData {
  lat: number;
  lng: number;
  spd: number;
  alt: number;
  ax: number;
  ay: number;
  az: number;
  ta: number;
  ad: number;
  bat?: number;
  tmp: number;
}

export interface BridgeMessage {
  type: 'data' | 'status' | 'error' | 'log';
  payload?: SensorData;
  connected?: boolean;
  port?: string;
  message?: string;
}

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface SerialPortInfo {
  path: string;
  manufacturer: string | null;
  serialNumber: string | null;
  friendlyName: string;
}
