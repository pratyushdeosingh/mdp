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
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:4173',
  ],
}));
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

// ── State ──────────────────────────────────────────────────
let serialPort = null;
let parser = null;
let heartbeatInterval = null;
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
      // NOTE: Arduino firmware does not send a 'bat' field — no battery sensor
      // exists in the current hardware. This will always be 0 in hardware mode.
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

// Basic inline rate limiting middleware for /api/ routes
const rateLimitMap = new Map();
app.use('/api/', (req, res, next) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxRequests = 30;

  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
  } else {
    const record = rateLimitMap.get(ip);
    if (now > record.resetTime) {
      record.count = 1;
      record.resetTime = now + windowMs;
    } else {
      record.count++;
      if (record.count > maxRequests) {
        return res.status(429).json({ error: 'Too many requests, please try again later.' });
      }
    }
  }
  next();
});

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

  // Validate port is a non-empty string
  if (!port || typeof port !== 'string') {
    return res.status(400).json({ error: 'Port is required and must be a string' });
  }

  // Validate port path format (Windows COM or Linux /dev/tty)
  if (!/^(COM\d+|\/dev\/tty\w+)$/i.test(port)) {
    return res.status(400).json({ error: 'Invalid port path format' });
  }

  // Validate baud rate against known safe values
  const validBaudRates = [9600, 19200, 38400, 57600, 115200];
  if (!validBaudRates.includes(baudRate)) {
    return res.status(400).json({ error: `Invalid baud rate. Allowed: ${validBaudRates.join(', ')}` });
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
  ws.isAlive = true;

  ws.on('pong', () => {
    ws.isAlive = true;
  });

  // Send current status to newly connected client
  ws.send(JSON.stringify({ type: 'status', ...connectionState }));

  ws.on('close', () => {
    console.log('[WS] Client disconnected');
  });
});

heartbeatInterval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) {
      console.log('[WS] Terminating dead client');
      return ws.terminate();
    }
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

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
['SIGINT', 'SIGTERM'].forEach(signal => {
  process.on(signal, async () => {
    console.log(`\n[Server] Received ${signal}, shutting down...`);
    if (heartbeatInterval) clearInterval(heartbeatInterval);
    await closeSerialPort();
    server.close();
    process.exit(0);
  });
});
