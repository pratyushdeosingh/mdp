import type { SensorData, LogEntry } from '../types';

// Simulate GPS coordinates around a central point (Chennai, India - engineering college area)
const BASE_LAT = 13.0827;
const BASE_LNG = 80.2707;
let currentLat = BASE_LAT;
let currentLng = BASE_LNG;
let heading = Math.random() * 360;

// Stable battery simulation - starts at 95% and slowly depletes
let batteryLevel = 95;
let lastBatteryUpdate = Date.now();
const BATTERY_DRAIN_RATE = 0.002; // % per second (roughly 0.12% per minute, 7.2% per hour)

// Simulator start time for uptime tracking
const simulatorStartTime = Date.now();

// Stable temperature simulation - fluctuates slowly around a base
let currentTemp = 35 + Math.random() * 3;

// Stable speed simulation - smooth transitions
let currentSpeed = 35; // Start at 35 km/h
let targetSpeed = 35;
let speedChangeTimer = 0;

// Stable altitude simulation
let currentAltitude = 48; // Start at 48m

// Accelerometer stability - smooth values
let smoothAccX = 0;
let smoothAccY = 0;
let smoothAccZ = 9.81;

export function resetSimulatorState() {
  currentLat = BASE_LAT;
  currentLng = BASE_LNG;
  heading = Math.random() * 360;
  logCounter = 0;
  batteryLevel = 95;
  lastBatteryUpdate = Date.now();
  currentTemp = 35 + Math.random() * 3;
  currentSpeed = 35;
  targetSpeed = 35;
  speedChangeTimer = 0;
  currentAltitude = 48;
  smoothAccX = 0;
  smoothAccY = 0;
  smoothAccZ = 9.81;
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function randomWalk(current: number, step: number, min: number, max: number): number {
  const delta = (Math.random() - 0.5) * step;
  return clamp(current + delta, min, max);
}

export function generateSensorData(): SensorData {
  // Smooth heading changes - gradual turns
  heading += (Math.random() - 0.5) * 8; // Much smaller heading changes
  
  // Smooth speed transitions - occasionally change target, then interpolate
  speedChangeTimer++;
  if (speedChangeTimer > 15) { // Change target every ~15 seconds
    speedChangeTimer = 0;
    // New target speed - realistic city driving between 0-60 km/h
    if (Math.random() < 0.1) {
      targetSpeed = 0; // Occasional stop
    } else if (Math.random() < 0.3) {
      targetSpeed = 20 + Math.random() * 20; // Slow speed (20-40)
    } else {
      targetSpeed = 35 + Math.random() * 25; // Normal speed (35-60)
    }
  }
  // Smooth interpolation towards target (ease towards it)
  currentSpeed = currentSpeed + (targetSpeed - currentSpeed) * 0.08;
  currentSpeed = clamp(currentSpeed, 0, 80);
  
  // GPS position - smooth movement based on current speed
  const moveDistance = (currentSpeed / 3600) * 0.0008; // Smaller movement increments
  currentLat += Math.cos((heading * Math.PI) / 180) * moveDistance;
  currentLng += Math.sin((heading * Math.PI) / 180) * moveDistance;

  // Keep within a reasonable area with smooth turnaround
  if (Math.abs(currentLat - BASE_LAT) > 0.015) {
    heading += 120 + Math.random() * 60; // Gradual turn back
  }
  if (Math.abs(currentLng - BASE_LNG) > 0.015) {
    heading += 120 + Math.random() * 60;
  }
  
  // Smooth altitude changes - very gradual (±0.2m per tick)
  currentAltitude = randomWalk(currentAltitude, 0.2, 42, 55);

  // Smooth accelerometer readings - low-pass filtered with small perturbations
  const rawAccX = (Math.sin(Date.now() / 2000) * 0.3 + (Math.random() - 0.5) * 0.1);
  const rawAccY = (Math.cos(Date.now() / 1500) * 0.2 + (Math.random() - 0.5) * 0.08);
  const rawAccZ = (9.81 + (Math.random() - 0.5) * 0.15);
  
  // Smooth interpolation for accelerometer (low-pass filter)
  smoothAccX = smoothAccX * 0.85 + rawAccX * 0.15;
  smoothAccY = smoothAccY * 0.85 + rawAccY * 0.15;
  smoothAccZ = smoothAccZ * 0.85 + rawAccZ * 0.15;
  
  const accX = parseFloat(smoothAccX.toFixed(3));
  const accY = parseFloat(smoothAccY.toFixed(3));
  const accZ = parseFloat(smoothAccZ.toFixed(3));
  const totalAccel = parseFloat(Math.sqrt(accX * accX + accY * accY + accZ * accZ).toFixed(2));

  // Simulate rare accident events (~0.5% chance - reduced)
  const accidentDetected = Math.random() < 0.005;

  // Realistic battery drain - slowly decreases over time
  const now = Date.now();
  const elapsedSeconds = (now - lastBatteryUpdate) / 1000;
  batteryLevel = Math.max(5, batteryLevel - elapsedSeconds * BATTERY_DRAIN_RATE);
  lastBatteryUpdate = now;

  // Realistic temperature - slow random walk with tiny fluctuations
  currentTemp = randomWalk(currentTemp, 0.05, 33, 40);

  return {
    timestamp: Date.now(),
    gps: {
      latitude: parseFloat(currentLat.toFixed(6)),
      longitude: parseFloat(currentLng.toFixed(6)),
      speed: parseFloat(currentSpeed.toFixed(1)),
      altitude: parseFloat(currentAltitude.toFixed(1)),
    },
    accelerometer: {
      x: accX,
      y: accY,
      z: accZ,
    },
    systemStatus: 'online', // More stable - always online in normal operation
    totalAcceleration: totalAccel,
    accidentDetected,
    batteryLevel: Math.floor(batteryLevel),
    temperature: parseFloat(currentTemp.toFixed(1)),
    gpsValid: true,
    mpuStatus: true,
    uptime: Date.now() - simulatorStartTime,
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

export function generateScenarioData(scenario: 'normal' | 'accident' | 'severe' | 'gps_loss' | 'sensor_noise'): SensorData {
  const base = generateSensorData();
  switch (scenario) {
    case 'normal':
      return base;
    case 'accident': {
      const ax = parseFloat((15 + Math.random() * 5).toFixed(3));
      const ay = parseFloat((12 + Math.random() * 5).toFixed(3));
      const az = parseFloat((10 + Math.random() * 3).toFixed(3));
      return {
        ...base,
        accelerometer: { x: ax, y: ay, z: az },
        totalAcceleration: parseFloat(Math.sqrt(ax * ax + ay * ay + az * az).toFixed(2)),
        accidentDetected: true,
        systemStatus: 'warning',
      };
    }
    case 'severe': {
      const ax = parseFloat((25 + Math.random() * 10).toFixed(3));
      const ay = parseFloat((20 + Math.random() * 10).toFixed(3));
      const az = parseFloat((15 + Math.random() * 5).toFixed(3));
      return {
        ...base,
        accelerometer: { x: ax, y: ay, z: az },
        totalAcceleration: parseFloat(Math.sqrt(ax * ax + ay * ay + az * az).toFixed(2)),
        accidentDetected: true,
        systemStatus: 'warning',
      };
    }
    case 'gps_loss':
      return {
        ...base,
        gps: { latitude: 0, longitude: 0, speed: 0, altitude: 0 },
        gpsValid: false,
        systemStatus: 'warning',
      };
    case 'sensor_noise': {
      // Erratic readings with random spikes simulating electromagnetic interference
      const spike = Math.random() > 0.5;
      const ax = parseFloat(((spike ? 8 : 0.5) * (Math.random() - 0.5) * 2).toFixed(3));
      const ay = parseFloat(((spike ? 6 : 0.3) * (Math.random() - 0.5) * 2).toFixed(3));
      const az = parseFloat((9.81 + (spike ? 5 : 0.2) * (Math.random() - 0.5) * 2).toFixed(3));
      return {
        ...base,
        accelerometer: { x: ax, y: ay, z: az },
        totalAcceleration: parseFloat(Math.sqrt(ax * ax + ay * ay + az * az).toFixed(2)),
        accidentDetected: false,
        systemStatus: spike ? 'warning' : 'online',
      };
    }
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
