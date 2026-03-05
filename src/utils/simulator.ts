import type { SensorData, LogEntry } from '../types';

// Simulate GPS coordinates around a central point (Chennai, India - engineering college area)
const BASE_LAT = 13.0827;
const BASE_LNG = 80.2707;
let currentLat = BASE_LAT;
let currentLng = BASE_LNG;
let heading = Math.random() * 360;

export function resetSimulatorState() {
  currentLat = BASE_LAT;
  currentLng = BASE_LNG;
  heading = Math.random() * 360;
  logCounter = 0;
}

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

  const accX = parseFloat((Math.sin(Date.now() / 1000) * 0.5 + (Math.random() - 0.5) * 0.3).toFixed(3));
  const accY = parseFloat((Math.cos(Date.now() / 800) * 0.3 + (Math.random() - 0.5) * 0.2).toFixed(3));
  const accZ = parseFloat((9.81 + (Math.random() - 0.5) * 0.4).toFixed(3));
  const totalAccel = parseFloat(Math.sqrt(accX * accX + accY * accY + accZ * accZ).toFixed(2));

  // Simulate rare accident events (~1% chance)
  const accidentDetected = Math.random() < 0.01;

  return {
    timestamp: Date.now(),
    gps: {
      latitude: parseFloat(currentLat.toFixed(6)),
      longitude: parseFloat(currentLng.toFixed(6)),
      speed: parseFloat(speed.toFixed(1)),
      altitude: parseFloat((45 + Math.random() * 10).toFixed(1)),
    },
    accelerometer: {
      x: accX,
      y: accY,
      z: accZ,
    },
    systemStatus: Math.random() > 0.05 ? 'online' : 'warning',
    totalAcceleration: totalAccel,
    accidentDetected,
    batteryLevel: Math.floor(70 + Math.random() * 30),
    temperature: parseFloat((35 + Math.random() * 10).toFixed(1)),
  };
}

let logCounter = 0;

export function generateLogEntry(): LogEntry {
  logCounter++;
  const rand = Math.random();

  if (rand < 0.25) {
    return { timestamp: Date.now(), type: 'info', message: `[GPS] Fix acquired: ${currentLat.toFixed(6)}, ${currentLng.toFixed(6)}` };
  } else if (rand < 0.4) {
    const ta = Math.sqrt(9.81 * 9.81 + Math.random() * 2).toFixed(2);
    return { timestamp: Date.now(), type: 'info', message: `[MPU] Total acceleration: ${ta} m/s² | Threshold: 25.0 m/s²` };
  } else if (rand < 0.55) {
    return { timestamp: Date.now(), type: 'info', message: `[ACC] Reading: X=${(Math.random() * 2 - 1).toFixed(3)} Y=${(Math.random() * 2 - 1).toFixed(3)} Z=${(9.8 + Math.random() * 0.2).toFixed(3)}` };
  } else if (rand < 0.7) {
    return { timestamp: Date.now(), type: 'success', message: `[SYS] Data packet #${logCounter} sent via serial` };
  } else if (rand < 0.8) {
    return { timestamp: Date.now(), type: 'info', message: `[GPS] Speed: ${(20 + Math.random() * 40).toFixed(1)} km/h | Satellites: ${Math.floor(4 + Math.random() * 8)}` };
  } else if (rand < 0.88) {
    return { timestamp: Date.now(), type: 'warning', message: `[SYS] MPU6050 calibrating... please hold steady` };
  } else if (rand < 0.94) {
    return { timestamp: Date.now(), type: 'success', message: `[SYS] Accident detection: NORMAL — acceleration within safe range` };
  } else {
    return { timestamp: Date.now(), type: 'error', message: `[GPS] Waiting for satellite fix... ${Math.floor(Math.random() * 3)} satellites in view` };
  }
}

export function exportSensorDataCSV(history: SensorData[]): string {
  const headers = 'Timestamp,Latitude,Longitude,Speed,Altitude,AccX,AccY,AccZ,TotalAccel,AccidentDetected,Status,Battery,Temp\n';
  const rows = history.map(d =>
    `${new Date(d.timestamp).toISOString()},${d.gps.latitude},${d.gps.longitude},${d.gps.speed},${d.gps.altitude},${d.accelerometer.x},${d.accelerometer.y},${d.accelerometer.z},${d.totalAcceleration},${d.accidentDetected},${d.systemStatus},${d.batteryLevel},${d.temperature}`
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
