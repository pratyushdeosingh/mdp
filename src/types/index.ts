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
  gpsValid?: boolean;
  mpuStatus?: boolean;
  uptime?: number;
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
export type ImpactSeverity = 'none' | 'low' | 'medium' | 'high' | 'severe';
export type UserResponse = 'safe' | 'not_received' | 'pending';
export type ScenarioType = 'normal' | 'accident' | 'severe' | 'gps_loss' | 'sensor_noise' | null;

// Hardware integration types

export interface ArduinoRawData {
  gv: number;       // GPS valid flag (0 or 1)
  lat: number;      // Latitude
  lng: number;      // Longitude
  spd: number;      // Speed (km/h)
  alt: number;      // Altitude (m)
  ax: number;       // Accelerometer X (m/s²)
  ay: number;       // Accelerometer Y (m/s²)
  az: number;       // Accelerometer Z (m/s²)
  ta: number;       // Total acceleration (m/s²)
  ad: number;       // Accident detected (0 or 1)
  tmp: number;      // Temperature (placeholder)
  bat?: number;     // Battery level (placeholder)
  mpu: number;      // MPU6050 status (0 or 1)
  ms: number;       // Uptime in milliseconds
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
