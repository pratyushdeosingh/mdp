import { useState, useRef, useCallback, useEffect } from 'react';
import type { SensorData, ConnectionStatus, SerialPortInfo, BridgeMessage } from '../types';

const BRIDGE_URL = import.meta.env.VITE_BRIDGE_URL || 'http://localhost:3001';
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3001/ws';

export function useSerialConnection(onData: (data: SensorData) => void) {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [availablePorts, setAvailablePorts] = useState<SerialPortInfo[]>([]);
  const [selectedPort, setSelectedPort] = useState<string>('');
  const [lastError, setLastError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const onDataRef = useRef(onData);
  const selectedPortRef = useRef(selectedPort);
  const reconnectTimeoutRef = useRef<number | null>(null);
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
      const res = await fetch(`${BRIDGE_URL}/api/ports`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const ports: SerialPortInfo[] = await res.json();
      setAvailablePorts(ports);
      // Auto-select first port if none selected
      if (ports.length > 0 && !selectedPortRef.current) {
        setSelectedPort(ports[0].path);
      }
    } catch {
      setLastError(`Cannot reach bridge server. Is it running on ${BRIDGE_URL}?`);
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
      // Tell the bridge to open the serial port
      const res = await fetch(`${BRIDGE_URL}/api/connect`, {
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

      ws.onmessage = (event) => {
        try {
          const msg: BridgeMessage = JSON.parse(event.data);

          if (msg.type === 'data' && msg.payload) {
            onDataRef.current(msg.payload);
          } else if (msg.type === 'status') {
            setConnectionStatus(msg.connected ? 'connected' : 'disconnected');
          } else if (msg.type === 'error') {
            setLastError(msg.message || 'Unknown error from bridge');
          }
        } catch {
          // Ignore malformed WebSocket messages
        }
      };

      ws.onclose = () => {
        setConnectionStatus('disconnected');
        // Auto-reconnect after 3 seconds if not intentionally disconnected
        if (!isIntentionallyDisconnectedRef.current) {
          reconnectTimeoutRef.current = window.setTimeout(() => {
            if (!isIntentionallyDisconnectedRef.current) {
              connect(port);
            }
          }, 3000);
        }
      };

      ws.onerror = () => {
        setConnectionStatus('error');
        setLastError('WebSocket connection to bridge lost');
      };
    } catch (err) {
      setConnectionStatus('error');
      setLastError(err instanceof Error ? err.message : 'Connection failed');
    }
  }, []);

  const disconnect = useCallback(async () => {
    isIntentionallyDisconnectedRef.current = true;
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // Close WebSocket first
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    // Tell bridge to close serial port
    try {
      await fetch(`${BRIDGE_URL}/api/disconnect`, { method: 'POST' });
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
