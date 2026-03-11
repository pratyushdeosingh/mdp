import { useState, useEffect, useRef, useCallback } from 'react';
import type { SensorData, ImpactSeverity, UserResponse } from '../types';

const ACCIDENT_THRESHOLD = 20;
const CAUTION_THRESHOLD = 12;
const BASELINE = 9.8;
const SEVERE_CEILING = 40;
const BUFFER_SIZE = 5;

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

// Smooth curve: maps acceleration to 0-100 score
function accelToScore(accel: number): number {
  const normalized = Math.max(0, accel - BASELINE) / (SEVERE_CEILING - BASELINE);
  // Quadratic curve: gentle near baseline, steep at high values
  return Math.min(100, normalized * normalized * 100 * 1.2);
}

function computeSeverityPercent(magnitude: number, peak: number, buffer: number[]): number {
  const magnitudeScore = accelToScore(magnitude);
  const peakScore = accelToScore(peak);
  const highCount = buffer.filter(v => v >= CAUTION_THRESHOLD).length;
  const durationScore = (highCount / Math.max(buffer.length, 1)) * 100;

  return Math.min(100, Math.round(
    magnitudeScore * 0.50 + peakScore * 0.30 + durationScore * 0.20
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
    if (state.isAccidentActive && state.userResponse !== 'safe') {
      timerRef.current = setInterval(() => {
        setState(prev => ({
          ...prev,
          elapsedSeconds: prev.accidentStartTime
            ? Math.floor((Date.now() - prev.accidentStartTime) / 1000)
            : 0,
        }));
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
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
    setTimeout(() => {
      setState(prev => ({ ...prev, userResponse: 'pending' }));
    }, 5000);
  }, []);

  return { ...state, markUserSafe };
}
