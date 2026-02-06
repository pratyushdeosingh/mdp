import type { SensorData, LogEntry } from '../types';

// Simulate GPS coordinates around a central point (Chennai, India - engineering college area)
const BASE_LAT = 13.0827;
const BASE_LNG = 80.2707;
let currentLat = BASE_LAT;
let currentLng = BASE_LNG;
let heading = Math.random() * 360;

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function randomWalk(current: number, step: number, min: number, max: number): number {
  const delta = (Math.random() - 0.5) * step;
  return clamp(current + delta, min, max);
}

export function generateSensorData(): SensorData {
  // Simulate a moving vehicle with realistic GPS drift
  heading += (Math.random() - 0.5) * 30;
  const speed = 20 + Math.random() * 40; // 20-60 km/h
  const moveDistance = (speed / 3600) * 0.001; // rough movement per tick

  currentLat += Math.cos((heading * Math.PI) / 180) * moveDistance;
  currentLng += Math.sin((heading * Math.PI) / 180) * moveDistance;

  // Keep within a reasonable area
  if (Math.abs(currentLat - BASE_LAT) > 0.02) {
    heading += 180;
    currentLat = randomWalk(currentLat, 0.001, BASE_LAT - 0.02, BASE_LAT + 0.02);
  }
  if (Math.abs(currentLng - BASE_LNG) > 0.02) {
    heading += 180;
    currentLng = randomWalk(currentLng, 0.001, BASE_LNG - 0.02, BASE_LNG + 0.02);
  }

  return {
    timestamp: Date.now(),
    gps: {
      latitude: parseFloat(currentLat.toFixed(6)),
      longitude: parseFloat(currentLng.toFixed(6)),
      speed: parseFloat(speed.toFixed(1)),
      altitude: parseFloat((45 + Math.random() * 10).toFixed(1)),
    },
    accelerometer: {
      x: parseFloat((Math.sin(Date.now() / 1000) * 0.5 + (Math.random() - 0.5) * 0.3).toFixed(3)),
      y: parseFloat((Math.cos(Date.now() / 800) * 0.3 + (Math.random() - 0.5) * 0.2).toFixed(3)),
      z: parseFloat((9.81 + (Math.random() - 0.5) * 0.4).toFixed(3)),
    },
    systemStatus: Math.random() > 0.05 ? 'online' : 'warning',
    signalStrength: Math.floor(60 + Math.random() * 40),
    batteryLevel: Math.floor(70 + Math.random() * 30),
    temperature: parseFloat((35 + Math.random() * 10).toFixed(1)),
  };
}

const AT_COMMANDS = [
  'AT+CPIN?',
  'AT+CREG?',
  'AT+CSQ',
  'AT+CGATT?',
  'AT+CIPSTART="TCP","api.server.com","8080"',
  'AT+CIPSEND',
  'AT+CMGS="+91XXXXXXXXXX"',
  'AT+HTTPINIT',
  'AT+HTTPPARA="URL","http://iot.server.com/data"',
  'AT+HTTPACTION=1',
];

const RESPONSES: Record<string, string[]> = {
  'AT+CPIN?': ['+CPIN: READY', 'OK'],
  'AT+CREG?': ['+CREG: 0,1', 'OK'],
  'AT+CSQ': ['+CSQ: 18,0', 'OK'],
  'AT+CGATT?': ['+CGATT: 1', 'OK'],
  'AT+CIPSTART': ['CONNECT OK'],
  'AT+CIPSEND': ['>', 'SEND OK'],
  'AT+CMGS': ['+CMGS: 42', 'OK', '> Sending SMS to +91XXXXXXXXXX...'],
  'AT+HTTPINIT': ['OK'],
  'AT+HTTPPARA': ['OK'],
  'AT+HTTPACTION': ['+HTTPACTION: 1,200,128', 'OK'],
};

let logCounter = 0;

export function generateLogEntry(): LogEntry {
  logCounter++;
  const rand = Math.random();

  if (rand < 0.3) {
    // AT command exchange
    const cmd = AT_COMMANDS[Math.floor(Math.random() * AT_COMMANDS.length)];
    const cmdKey = Object.keys(RESPONSES).find(k => cmd.startsWith(k)) || 'AT+CSQ';
    const response = RESPONSES[cmdKey];
    if (logCounter % 2 === 0) {
      return { timestamp: Date.now(), type: 'command', message: `>> ${cmd}` };
    } else {
      return { timestamp: Date.now(), type: 'success', message: `<< ${response[Math.floor(Math.random() * response.length)]}` };
    }
  } else if (rand < 0.5) {
    return { timestamp: Date.now(), type: 'info', message: `[GPS] Fix acquired: ${currentLat.toFixed(6)}, ${currentLng.toFixed(6)}` };
  } else if (rand < 0.65) {
    return { timestamp: Date.now(), type: 'info', message: `[GSM] Signal strength: ${Math.floor(60 + Math.random() * 40)}%` };
  } else if (rand < 0.75) {
    return { timestamp: Date.now(), type: 'info', message: `[ACC] Reading: X=${(Math.random() * 2 - 1).toFixed(3)} Y=${(Math.random() * 2 - 1).toFixed(3)} Z=${(9.8 + Math.random() * 0.2).toFixed(3)}` };
  } else if (rand < 0.85) {
    return { timestamp: Date.now(), type: 'success', message: `[SYS] Data packet #${logCounter} transmitted successfully` };
  } else if (rand < 0.92) {
    return { timestamp: Date.now(), type: 'warning', message: `[SYS] Retrying connection... attempt ${Math.floor(Math.random() * 3) + 1}/3` };
  } else if (rand < 0.96) {
    return { timestamp: Date.now(), type: 'info', message: `[GSM] Sending SMS alert: "Vehicle location updated"` };
  } else {
    return { timestamp: Date.now(), type: 'error', message: `[ERR] SIM800 timeout - module not responding (damaged)` };
  }
}

export function exportSensorDataCSV(history: SensorData[]): string {
  const headers = 'Timestamp,Latitude,Longitude,Speed,Altitude,AccX,AccY,AccZ,Status,Signal,Battery,Temp\n';
  const rows = history.map(d =>
    `${new Date(d.timestamp).toISOString()},${d.gps.latitude},${d.gps.longitude},${d.gps.speed},${d.gps.altitude},${d.accelerometer.x},${d.accelerometer.y},${d.accelerometer.z},${d.systemStatus},${d.signalStrength},${d.batteryLevel},${d.temperature}`
  ).join('\n');
  return headers + rows;
}

export function downloadCSV(data: string, filename: string): void {
  const blob = new Blob([data], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
