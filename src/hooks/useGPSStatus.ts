import { useState, useEffect, useRef, useCallback } from 'react';
import type { SensorData } from '../types';

export type GPSState =
  | 'unknown'      // No data received yet
  | 'cold_start'   // GPS searching, within expected cold-start window
  | 'searching'    // GPS searching, beyond expected cold-start window
  | 'locked'       // GPS has a valid fix
  | 'lost_fix';    // Had a fix, now lost it

export interface GPSStatus {
  state: GPSState;
  /** Seconds elapsed since we first started tracking GPS (first data received) */
  elapsedSinceStart: number;
  /** Seconds elapsed since GPS fix was lost (only for lost_fix state) */
  secondsSinceLostFix: number;
  /** Whether GPS has ever had a valid fix this session */
  hasEverLocked: boolean;
  /** Current coordinates when locked */
  coordinates: { lat: number; lng: number } | null;
  /** A user-friendly message explaining the current state */
  message: string;
  /** Estimated progress toward first fix (0-100, only during cold_start) */
  coldStartProgress: number;
}

// NEO-6M typical cold start: 5-12 minutes
const COLD_START_EXPECTED_SECONDS = 600; // 10 minutes
const COLD_START_MAX_SECONDS = 900;      // 15 minutes — beyond this, likely a problem

function isGPSValid(data: SensorData): boolean {
  // Prefer explicit gpsValid flag from Arduino firmware (gv field)
  if (data.gpsValid !== undefined) return data.gpsValid;
  // Fallback: check if coordinates are non-null and non-zero
  const lat = data.gps.latitude;
  const lng = data.gps.longitude;
  return lat !== null && lng !== null && (lat !== 0 || lng !== 0);
}

function getStateMessage(state: GPSState, elapsed: number, hasEverLocked: boolean): string {
  switch (state) {
    case 'unknown':
      return 'Waiting for sensor data…';
    case 'cold_start': {
      const remaining = Math.max(0, COLD_START_EXPECTED_SECONDS - elapsed);
      const mins = Math.ceil(remaining / 60);
      return `GPS acquiring satellites — first fix typically takes 5–10 min (est. ${mins} min remaining)`;
    }
    case 'searching':
      return 'GPS search is taking longer than expected — ensure the helmet has clear sky visibility';
    case 'locked':
      return 'GPS locked — receiving valid coordinates';
    case 'lost_fix':
      return hasEverLocked
        ? 'GPS fix lost — satellite signal interrupted. Check sky visibility.'
        : 'GPS signal lost before full lock was established';
    default:
      return '';
  }
}

export function useGPSStatus(sensorData: SensorData | null): GPSStatus {
  const [status, setStatus] = useState<GPSStatus>({
    state: 'unknown',
    elapsedSinceStart: 0,
    secondsSinceLostFix: 0,
    hasEverLocked: false,
    coordinates: null,
    message: 'Waiting for sensor data…',
    coldStartProgress: 0,
  });

  const firstDataTime = useRef<number | null>(null);
  const hasEverLocked = useRef(false);
  const lastFixLostTime = useRef<number | null>(null);
  const wasLocked = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const computeState = useCallback((): GPSState => {
    if (!sensorData) return 'unknown';

    const valid = isGPSValid(sensorData);

    if (valid) {
      hasEverLocked.current = true;
      wasLocked.current = true;
      lastFixLostTime.current = null;
      return 'locked';
    }

    // GPS not valid
    if (wasLocked.current) {
      // Had a fix, now lost it
      wasLocked.current = false;
      if (!lastFixLostTime.current) {
        lastFixLostTime.current = Date.now();
      }
      return 'lost_fix';
    }

    if (lastFixLostTime.current) {
      return 'lost_fix';
    }

    // Never had a fix — determine if cold start or prolonged search
    const elapsed = firstDataTime.current
      ? (Date.now() - firstDataTime.current) / 1000
      : 0;

    return elapsed < COLD_START_MAX_SECONDS ? 'cold_start' : 'searching';
  }, [sensorData]);

  // Track first data arrival
  useEffect(() => {
    if (sensorData && !firstDataTime.current) {
      firstDataTime.current = Date.now();
    }
  }, [sensorData]);

  // Update state every second for timer accuracy
  useEffect(() => {
    const update = () => {
      const state = computeState();
      const elapsed = firstDataTime.current
        ? Math.floor((Date.now() - firstDataTime.current) / 1000)
        : 0;
      const sinceLost = lastFixLostTime.current
        ? Math.floor((Date.now() - lastFixLostTime.current) / 1000)
        : 0;

      const lat = sensorData?.gps?.latitude;
      const lng = sensorData?.gps?.longitude;
      const coords = sensorData && isGPSValid(sensorData) && lat != null && lng != null
        ? { lat: lat as number, lng: lng as number }
        : null;

      const progress = state === 'cold_start'
        ? Math.min(100, Math.round((elapsed / COLD_START_EXPECTED_SECONDS) * 100))
        : 0;

      setStatus({
        state,
        elapsedSinceStart: elapsed,
        secondsSinceLostFix: sinceLost,
        hasEverLocked: hasEverLocked.current,
        coordinates: coords,
        message: getStateMessage(state, elapsed, hasEverLocked.current),
        coldStartProgress: progress,
      });
    };

    update();
    timerRef.current = setInterval(update, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [sensorData, computeState]);

  return status;
}
