import { useState, useEffect, useRef, useCallback } from 'react';
import type { SensorData, ImpactSeverity, UserResponse } from '../types';

const ACCIDENT_THRESHOLD = 20;
const BUFFER_SIZE = 5;

export interface AccidentDetectionState {
  impactMagnitude: number;
  isAccidentActive: boolean;
  accidentStartTime: number | null;
  elapsedSeconds: number;
  severity: ImpactSeverity;
  peakAcceleration: number;
  userResponse: UserResponse;
  impactZone: 'normal' | 'caution' | 'danger';
}

function classifySeverity(buffer: number[], peak: number): ImpactSeverity {
  if (peak < 15) return 'none';
  const highReadings = buffer.filter(v => v >= ACCIDENT_THRESHOLD).length;
  const severeReadings = buffer.filter(v => v >= 30).length;

  if (peak >= 40 || severeReadings >= 2) return 'severe';
  if (peak >= 30 || highReadings >= 3) return 'high';
  if (peak >= 20 || highReadings >= 2) return 'medium';
  return 'low';
}

function getImpactZone(magnitude: number): 'normal' | 'caution' | 'danger' {
  if (magnitude >= 20) return 'danger';
  if (magnitude >= 12) return 'caution';
  return 'normal';
}

export function useAccidentDetection(sensorData: SensorData | null) {
  const [state, setState] = useState<AccidentDetectionState>({
    impactMagnitude: 0,
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
    const isAccident = magnitude >= ACCIDENT_THRESHOLD || sensorData.accidentDetected;

    if (isAccident && !accidentActiveRef.current) {
      accidentActiveRef.current = true;
      peakRef.current = magnitude;

      setState(prev => ({
        ...prev,
        impactMagnitude: magnitude,
        isAccidentActive: true,
        accidentStartTime: Date.now(),
        elapsedSeconds: 0,
        severity: classifySeverity(bufferRef.current, magnitude),
        peakAcceleration: magnitude,
        userResponse: 'not_received',
        impactZone: zone,
      }));
    } else if (accidentActiveRef.current) {
      const severity = classifySeverity(bufferRef.current, peakRef.current);
      setState(prev => ({
        ...prev,
        impactMagnitude: magnitude,
        severity,
        peakAcceleration: peakRef.current,
        impactZone: zone,
      }));
    } else {
      setState(prev => ({
        ...prev,
        impactMagnitude: magnitude,
        impactZone: zone,
        severity: classifySeverity(bufferRef.current, peakRef.current),
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
