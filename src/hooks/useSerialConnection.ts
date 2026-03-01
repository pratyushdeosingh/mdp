import { useState, useRef, useCallback, useEffect } from 'react';
import type { SensorData, ConnectionStatus, SerialPortInfo, BridgeMessage } from '../types';

const BRIDGE_URL = 'http://localhost:3001';
const WS_URL = 'ws://localhost:3001/ws';

export function useSerialConnection(onData: (data: SensorData) => void) {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [availablePorts, setAvailablePorts] = useState<SerialPortInfo[]>([]);
  const [selectedPort, setSelectedPort] = useState<string>('');
  const [lastError, setLastError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const onDataRef = useRef(onData);

  // Keep callback ref fresh without re-triggering effects
  useEffect(() => {
    onDataRef.current = onData;
  }, [onData]);

  const refreshPorts = useCallback(async () => {
    setLastError(null);
    try {
      const res = await fetch(`${BRIDGE_URL}/api/ports`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const ports: SerialPortInfo[] = await res.json();
      setAvailablePorts(ports);
      // Auto-select first port if none selected
      if (ports.length > 0 && !selectedPort) {
        setSelectedPort(ports[0].path);
      }
    } catch {
      setLastError('Cannot reach bridge server. Is it running on localhost:3001?');
      setAvailablePorts([]);
    }
  }, [selectedPort]);

  const connect = useCallback(async (port: string) => {
    setConnectionStatus('connecting');
    setLastError(null);

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

      ws.onopen = () => {
        // Status will be confirmed by the bridge's status message
      };

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
