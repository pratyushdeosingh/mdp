/**
 * MDP IoT Serial-to-WebSocket Bridge Server
 *
 * Reads JSON lines from Arduino over USB serial,
 * transforms them into the SensorData format,
 * and broadcasts via WebSocket to the React dashboard.
 *
 * Usage:
 *   cd server
 *   npm install
 *   node server.js
 *
 * Endpoints:
 *   GET  /api/ports      — list available COM ports
 *   POST /api/connect    — open serial { port, baudRate }
 *   POST /api/disconnect — close serial
 *   GET  /api/status     — connection state
 *   WS   /ws             — WebSocket stream
 */

const express = require('express');
const cors = require('cors');
const http = require('http');
const { WebSocketServer } = require('ws');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

const PORT = 3001;

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

// ── State ──────────────────────────────────────────────────
let serialPort = null;
let parser = null;
let connectionState = {
  connected: false,
  port: null,
  baudRate: 9600,
};

// ── Transform Arduino short-key JSON → full SensorData ─────
function transformArduinoData(raw) {
  const hasGPS = raw.lat !== 0 || raw.lng !== 0;

  return {
    type: 'data',
    payload: {
      timestamp: Date.now(),
      gps: {
        latitude: raw.lat ?? 0,
        longitude: raw.lng ?? 0,
        speed: raw.spd ?? 0,
        altitude: raw.alt ?? 0,
      },
      accelerometer: {
        x: raw.ax ?? 0,
        y: raw.ay ?? 0,
        z: raw.az ?? 0,
      },
      systemStatus: hasGPS ? 'online' : 'warning',
      totalAcceleration: raw.ta ?? 0,
      accidentDetected: (raw.ad ?? 0) === 1,
      batteryLevel: raw.bat ?? 0,
      temperature: raw.tmp ?? 0,
    },
  };
}

// ── Broadcast to all WebSocket clients ─────────────────────
function broadcast(message) {
  const data = JSON.stringify(message);
  wss.clients.forEach((client) => {
    if (client.readyState === 1) { // WebSocket.OPEN
      client.send(data);
    }
  });
}

// ── Serial Port Helpers ────────────────────────────────────
function openSerialPort(portPath, baudRate) {
  return new Promise((resolve, reject) => {
    if (serialPort && serialPort.isOpen) {
      reject(new Error('Already connected. Disconnect first.'));
      return;
    }

    serialPort = new SerialPort({
      path: portPath,
      baudRate: baudRate,
      autoOpen: false,
    });

    parser = serialPort.pipe(new ReadlineParser({ delimiter: '\n' }));

    // On each complete line from Arduino
    parser.on('data', (line) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      try {
        const raw = JSON.parse(trimmed);

        // Skip boot/status messages from Arduino
        if (raw.status === 'boot') {
          console.log(`[Arduino] ${raw.msg || 'Booted'}`);
          broadcast({ type: 'log', message: raw.msg || 'Arduino booted' });
          return;
        }

        const message = transformArduinoData(raw);
        broadcast(message);
      } catch (err) {
        // Partial or malformed JSON line — skip silently
        console.warn(`[Parse] Skipping malformed line: ${trimmed.substring(0, 80)}`);
      }
    });

    serialPort.on('close', () => {
      console.log(`[Serial] Port closed`);
      connectionState = { connected: false, port: null, baudRate };
      broadcast({ type: 'status', connected: false, port: null });
    });

    serialPort.on('error', (err) => {
      console.error(`[Serial] Error: ${err.message}`);
      connectionState = { connected: false, port: null, baudRate };
      broadcast({ type: 'error', message: err.message });
    });

    serialPort.open((err) => {
      if (err) {
        serialPort = null;
        parser = null;
        reject(new Error(`Failed to open ${portPath}: ${err.message}`));
        return;
      }

      console.log(`[Serial] Connected to ${portPath} at ${baudRate} baud`);
      connectionState = { connected: true, port: portPath, baudRate };
      broadcast({ type: 'status', connected: true, port: portPath });
      resolve();
    });
  });
}

function closeSerialPort() {
  return new Promise((resolve) => {
    if (!serialPort || !serialPort.isOpen) {
      serialPort = null;
      parser = null;
      resolve();
      return;
    }

    serialPort.close((err) => {
      if (err) console.warn(`[Serial] Close error: ${err.message}`);
      serialPort = null;
      parser = null;
      connectionState = { connected: false, port: null, baudRate: connectionState.baudRate };
      broadcast({ type: 'status', connected: false, port: null });
      resolve();
    });
  });
}

// ── REST Endpoints ─────────────────────────────────────────

// List available serial ports
app.get('/api/ports', async (req, res) => {
  try {
    const ports = await SerialPort.list();
    const formatted = ports.map((p) => ({
      path: p.path,
      manufacturer: p.manufacturer || null,
      serialNumber: p.serialNumber || null,
      friendlyName: p.friendlyName || p.path,
    }));
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Connect to a serial port
app.post('/api/connect', async (req, res) => {
  const { port, baudRate = 9600 } = req.body;
  if (!port) {
    return res.status(400).json({ error: 'Port is required' });
  }

  try {
    await openSerialPort(port, baudRate);
    res.json({ success: true, port, baudRate });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Disconnect from serial port
app.post('/api/disconnect', async (req, res) => {
  try {
    await closeSerialPort();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get connection status
app.get('/api/status', (req, res) => {
  res.json(connectionState);
});

// ── WebSocket events ───────────────────────────────────────
wss.on('connection', (ws) => {
  console.log('[WS] Client connected');

  // Send current status to newly connected client
  ws.send(JSON.stringify({ type: 'status', ...connectionState }));

  ws.on('close', () => {
    console.log('[WS] Client disconnected');
  });
});

// ── Start Server ───────────────────────────────────────────
server.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════╗
║   MDP IoT Serial Bridge Server                   ║
║   Running on http://localhost:${PORT}               ║
║                                                    ║
║   REST:  http://localhost:${PORT}/api/ports         ║
║   WS:    ws://localhost:${PORT}/ws                  ║
║                                                    ║
║   Waiting for dashboard to connect...              ║
╚══════════════════════════════════════════════════╝
`);
});

// ── Graceful Shutdown ──────────────────────────────────────
process.on('SIGINT', async () => {
  console.log('\n[Server] Shutting down...');
  await closeSerialPort();
  server.close();
  process.exit(0);
});
