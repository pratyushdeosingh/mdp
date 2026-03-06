import { useState, useRef, useCallback, useEffect } from 'react';
import type { SensorData, ConnectionStatus, SerialPortInfo, BridgeMessage } from '../types';

const BRIDGE_URL = import.meta.env.VITE_BRIDGE_URL || 'http://localhost:3001';
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3001/ws';
const MAX_RECONNECT_ATTEMPTS = 5;
const FETCH_TIMEOUT_MS = 10_000;

// Fetch with timeout wrapper
function fetchWithTimeout(url: string, opts?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  return fetch(url, { ...opts, signal: controller.signal }).finally(() => clearTimeout(timer));
}

// Basic runtime check that payload looks like SensorData
function isValidSensorPayload(p: unknown): p is SensorData {
  if (!p || typeof p !== 'object') return false;
  const o = p as Record<string, unknown>;
  return (
    typeof o.gps === 'object' && o.gps !== null &&
    typeof o.accelerometer === 'object' && o.accelerometer !== null &&
    typeof o.totalAcceleration === 'number' &&
    typeof o.accidentDetected === 'boolean'
  );
}

export function useSerialConnection(onData: (data: SensorData) => void) {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [availablePorts, setAvailablePorts] = useState<SerialPortInfo[]>([]);
  const [selectedPort, setSelectedPort] = useState<string>('');
  const [lastError, setLastError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const onDataRef = useRef(onData);
  const selectedPortRef = useRef(selectedPort);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const isIntentionallyDisconnectedRef = useRef<boolean>(true);

  // Keep refs fresh
  useEffect(() => {
    onDataRef.current = onData;
  }, [onData]);

  useEffect(() => {
    selectedPortRef.current = selectedPort;
  }, [selectedPort]);

  const refreshPorts = useCallback(async () => {
    setLastError(null);
    try {
      const res = await fetchWithTimeout(`${BRIDGE_URL}/api/ports`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const ports: SerialPortInfo[] = await res.json();
      setAvailablePorts(ports);
      if (ports.length > 0 && !selectedPortRef.current) {
        setSelectedPort(ports[0].path);
      }
    } catch (err) {
      const msg = err instanceof DOMException && err.name === 'AbortError'
        ? `Bridge server not responding (timeout ${FETCH_TIMEOUT_MS / 1000}s). Is it running on ${BRIDGE_URL}?`
        : `Cannot reach bridge server. Is it running on ${BRIDGE_URL}?`;
      setLastError(msg);
      setAvailablePorts([]);
    }
  }, []);

  const connect = useCallback(async (port: string) => {
    setConnectionStatus('connecting');
    setLastError(null);
    isIntentionallyDisconnectedRef.current = false;

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    try {
      // Close any existing WebSocket before opening a new one
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
        wsRef.current = null;
      }

      // Tell the bridge to open the serial port
      const res = await fetchWithTimeout(`${BRIDGE_URL}/api/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ port, baudRate: 9600 }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: 'Connection failed' }));
        throw new Error(body.error || `HTTP ${res.status}`);
      }

      // Open WebSocket to receive data stream
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        reconnectAttemptsRef.current = 0; // Reset on successful connection
        setConnectionStatus('connected');
      };

      ws.onmessage = (event) => {
        try {
          const msg: BridgeMessage = JSON.parse(event.data);

          if (msg.type === 'data' && msg.payload) {
            if (isValidSensorPayload(msg.payload)) {
              onDataRef.current(msg.payload);
            } else {
              console.warn('[WS] Received malformed sensor payload, skipping');
            }
          } else if (msg.type === 'status') {
            setConnectionStatus(msg.connected === true ? 'connected' : 'disconnected');
          } else if (msg.type === 'error') {
            setLastError(msg.message || 'Unknown error from bridge');
          }
        } catch {
          console.warn('[WS] Failed to parse WebSocket message');
        }
      };

      ws.onclose = () => {
        setConnectionStatus('disconnected');
        // Auto-reconnect with exponential backoff
        if (!isIntentionallyDisconnectedRef.current) {
          const attempts = reconnectAttemptsRef.current;
          if (attempts < MAX_RECONNECT_ATTEMPTS) {
            const delay = Math.min(1000 * Math.pow(2, attempts), 16000); // 1s, 2s, 4s, 8s, 16s
            reconnectAttemptsRef.current = attempts + 1;
            setLastError(`Connection lost. Reconnecting in ${delay / 1000}s (attempt ${attempts + 1}/${MAX_RECONNECT_ATTEMPTS})...`);
            reconnectTimeoutRef.current = window.setTimeout(() => {
              if (!isIntentionallyDisconnectedRef.current) {
                connect(port);
              }
            }, delay);
          } else {
            setLastError(`Connection lost after ${MAX_RECONNECT_ATTEMPTS} attempts. Click Connect to retry.`);
            setConnectionStatus('error');
          }
        }
      };

      ws.onerror = () => {
        // onclose will fire after onerror — reconnect logic lives there
        setLastError('WebSocket connection to bridge lost');
      };
    } catch (err) {
      setConnectionStatus('error');
      if (err instanceof DOMException && err.name === 'AbortError') {
        setLastError(`Bridge server not responding (timeout ${FETCH_TIMEOUT_MS / 1000}s)`);
      } else {
        setLastError(err instanceof Error ? err.message : 'Connection failed');
      }
    }
  }, []);

  const disconnect = useCallback(async () => {
    isIntentionallyDisconnectedRef.current = true;
    reconnectAttemptsRef.current = 0;
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // Close WebSocket first
    if (wsRef.current) {
      wsRef.current.onclose = null; // Prevent reconnect from firing
      wsRef.current.close();
      wsRef.current = null;
    }

    // Tell bridge to close serial port
    try {
      await fetchWithTimeout(`${BRIDGE_URL}/api/disconnect`, { method: 'POST' });
    } catch {
      // Best effort — bridge may already be down
    }

    setConnectionStatus('disconnected');
    setLastError(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isIntentionallyDisconnectedRef.current = true;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, []);

  return {
    connectionStatus,
    availablePorts,
    selectedPort,
    setSelectedPort,
    lastError,
    refreshPorts,
    connect,
    disconnect,
  };
}
