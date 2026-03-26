import { useState, useEffect, useRef, useCallback } from 'react';
import type { SensorData, ImpactSeverity, UserResponse } from '../types';

// Match Arduino firmware ACCIDENT_THRESHOLD (25.0 m/s²) for consistency
const ACCIDENT_THRESHOLD = 25;
const CAUTION_THRESHOLD = 12;
const BUFFER_SIZE = 5;

// Sigmoid midpoint and steepness — tuned so that:
//   9.8 m/s² (gravity) ≈ 5%,  20 m/s² (accident) ≈ 38%,
//   25 m/s² ≈ 68%,  30 m/s² ≈ 88%,  40+ m/s² ≈ 99%
const SIGMOID_MIDPOINT = 22;
const SIGMOID_K = 0.25;

const USER_SAFE_RESET_DELAY_MS = 5000;

export interface AccidentDetectionState {
  impactMagnitude: number;
  severityPercent: number;
  isAccidentActive: boolean;
  accidentStartTime: number | null;
  elapsedSeconds: number;
  severity: ImpactSeverity;
  peakAcceleration: number;
  userResponse: UserResponse;
  impactZone: 'normal' | 'caution' | 'danger';
}

// Sigmoid (logistic) curve — smooth S-shape that maps acceleration to 0-100
function accelToScore(accel: number): number {
  return 100 / (1 + Math.exp(-SIGMOID_K * (accel - SIGMOID_MIDPOINT)));
}

function computeSeverityPercent(magnitude: number, peak: number, buffer: number[]): number {
  const magnitudeScore = accelToScore(magnitude);
  const peakScore = accelToScore(peak);

  // Two-tier duration: caution readings contribute 40%, danger readings 60%
  const cautionCount = buffer.filter(v => v >= CAUTION_THRESHOLD).length;
  const dangerCount = buffer.filter(v => v >= ACCIDENT_THRESHOLD).length;
  const bufLen = Math.max(buffer.length, 1);
  const durationScore = ((cautionCount * 0.4 + dangerCount * 0.6) / bufLen) * 100;

  // Weights: 40% instant magnitude, 35% peak (retains history), 25% duration (sustained = worse)
  return Math.min(100, Math.round(
    magnitudeScore * 0.40 + peakScore * 0.35 + durationScore * 0.25
  ));
}

function severityFromPercent(percent: number): ImpactSeverity {
  if (percent >= 80) return 'severe';
  if (percent >= 60) return 'high';
  if (percent >= 40) return 'medium';
  if (percent >= 20) return 'low';
  return 'none';
}

function getImpactZone(magnitude: number): 'normal' | 'caution' | 'danger' {
  if (magnitude >= 20) return 'danger';
  if (magnitude >= 12) return 'caution';
  return 'normal';
}

export function useAccidentDetection(sensorData: SensorData | null) {
  const [state, setState] = useState<AccidentDetectionState>({
    impactMagnitude: 0,
    severityPercent: 0,
    isAccidentActive: false,
    accidentStartTime: null,
    elapsedSeconds: 0,
    severity: 'none',
    peakAcceleration: 0,
    userResponse: 'pending',
    impactZone: 'normal',
  });

  const bufferRef = useRef<number[]>([]);
  const peakRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const safeResetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const accidentActiveRef = useRef(false);

  useEffect(() => {
    if (!sensorData) return;

    const magnitude = sensorData.totalAcceleration;

    bufferRef.current = [...bufferRef.current, magnitude].slice(-BUFFER_SIZE);

    if (magnitude > peakRef.current) {
      peakRef.current = magnitude;
    }

    const zone = getImpactZone(magnitude);
    const percent = computeSeverityPercent(magnitude, peakRef.current, bufferRef.current);
    const severity = severityFromPercent(percent);
    const isAccident = magnitude >= ACCIDENT_THRESHOLD || sensorData.accidentDetected;

    if (isAccident && !accidentActiveRef.current) {
      accidentActiveRef.current = true;
      peakRef.current = magnitude;

      const freshPercent = computeSeverityPercent(magnitude, magnitude, bufferRef.current);
      setState(prev => ({
        ...prev,
        impactMagnitude: magnitude,
        severityPercent: freshPercent,
        isAccidentActive: true,
        accidentStartTime: Date.now(),
        elapsedSeconds: 0,
        severity: severityFromPercent(freshPercent),
        peakAcceleration: magnitude,
        userResponse: 'not_received',
        impactZone: zone,
      }));
    } else if (accidentActiveRef.current) {
      setState(prev => ({
        ...prev,
        impactMagnitude: magnitude,
        severityPercent: percent,
        severity,
        peakAcceleration: peakRef.current,
        impactZone: zone,
      }));
    } else {
      setState(prev => ({
        ...prev,
        impactMagnitude: magnitude,
        severityPercent: percent,
        severity,
        impactZone: zone,
      }));
    }
  }, [sensorData]);

  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (state.isAccidentActive && state.userResponse !== 'safe') {
      timerRef.current = setInterval(() => {
        setState(prev => ({
          ...prev,
          elapsedSeconds: prev.accidentStartTime
            ? Math.floor((Date.now() - prev.accidentStartTime) / 1000)
            : 0,
        }));
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [state.isAccidentActive, state.userResponse]);

  const markUserSafe = useCallback(() => {
    accidentActiveRef.current = false;
    peakRef.current = 0;
    bufferRef.current = [];
    setState(prev => ({
      ...prev,
      isAccidentActive: false,
      accidentStartTime: null,
      elapsedSeconds: 0,
      severityPercent: 0,
      severity: 'none',
      peakAcceleration: 0,
      userResponse: 'safe',
    }));
    // Clear any existing safe reset timeout before setting a new one
    if (safeResetTimeoutRef.current) {
      clearTimeout(safeResetTimeoutRef.current);
    }
    safeResetTimeoutRef.current = setTimeout(() => {
      setState(prev => ({ ...prev, userResponse: 'pending' }));
    }, USER_SAFE_RESET_DELAY_MS);
  }, []);

  // Cleanup safe reset timeout on unmount
  useEffect(() => {
    return () => {
      if (safeResetTimeoutRef.current) {
        clearTimeout(safeResetTimeoutRef.current);
      }
    };
  }, []);

  return { ...state, markUserSafe };
}
