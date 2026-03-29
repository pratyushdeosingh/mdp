/**
 * MDP IoT Serial-to-WebSocket Bridge Server
 * Version 2.0 — Production Safety Fixes
 *
 * Reads JSON lines from Arduino over USB serial,
 * transforms them into the SensorData format,
 * and broadcasts via WebSocket to the React dashboard.
 *
 * Safety Features:
 * - Numeric validation on all Arduino data fields
 * - WebSocket memory leak prevention with client cleanup
 * - Backpressure handling for slow clients
 * - Connection race condition prevention
 * - Sequence numbers for packet loss detection
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
const { WebSocketServer, WebSocket } = require('ws');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

const PORT = 3001;

// ── Validation Constants ───────────────────────────────────
const MAX_LINE_LENGTH = 512;  // Max JSON line length from Arduino
const DEAD_CONNECTION_THRESHOLD = 3;  // Send failures before terminating client
const MAX_BACKLOG_BYTES = 16 * 1024 * 1024;  // 16MB max buffer per client

// Numeric field ranges for Arduino data validation
const FIELD_RANGES = {
  lat: [-90, 90],
  lng: [-180, 180],
  spd: [0, 500],        // km/h (500 allows for future high-speed applications)
  alt: [-1000, 50000],  // meters (below sea level to aircraft altitude)
  ax: [-320, 320],      // m/s² (±16g * 9.81 * 2 safety margin)
  ay: [-320, 320],
  az: [-320, 320],
  ta: [0, 500],         // total acceleration magnitude
  bat: [0, 100],        // percentage
  tmp: [-40, 125],      // temperature range (typical sensor limits)
  ms: [0, 4294967295],  // 32-bit millis() max
};

const app = express();
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, Postman) or any localhost port
    if (!origin || /^https?:\/\/localhost(:\d+)?$/.test(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
}));
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

// ── State ──────────────────────────────────────────────────
let serialPort = null;
let parser = null;
let heartbeatInterval = null;
let connectionLock = null;  // Prevents race conditions in /api/connect
let messageSequence = 0;    // Packet sequence number for loss detection
let connectionState = {
  connected: false,
  port: null,
  baudRate: 9600,
};

// Metrics for monitoring
const metrics = {
  parseSuccess: 0,
  parseFailed: 0,
  parseInvalid: 0,
  broadcastCount: 0,
  clientsTerminated: 0,
};

// ── Data Validation ────────────────────────────────────────
/**
 * Validates Arduino data fields are within expected ranges.
 * Prevents Infinity, NaN, and out-of-range values from reaching clients.
 */
function isValidArduinoData(raw) {
  if (!raw || typeof raw !== 'object') return false;

  // Validate numeric fields against defined ranges
  for (const [key, [min, max]] of Object.entries(FIELD_RANGES)) {
    if (key in raw) {
      const val = raw[key];
      // Must be a finite number within range
      if (typeof val !== 'number' || !Number.isFinite(val) || val < min || val > max) {
        console.warn(`[Validation] Field '${key}' invalid: ${val} (expected ${min}-${max})`);
        return false;
      }
    }
  }

  // Validate flag fields (must be 0 or 1)
  if ('gv' in raw && ![0, 1].includes(raw.gv)) {
    console.warn(`[Validation] Field 'gv' invalid: ${raw.gv}`);
    return false;
  }
  if ('ad' in raw && ![0, 1].includes(raw.ad)) {
    console.warn(`[Validation] Field 'ad' invalid: ${raw.ad}`);
    return false;
  }
  if ('mpu' in raw && ![0, 1].includes(raw.mpu)) {
    console.warn(`[Validation] Field 'mpu' invalid: ${raw.mpu}`);
    return false;
  }

  return true;
}

// ── Transform Arduino short-key JSON → full SensorData ─────
function transformArduinoData(raw) {
  // Use explicit GPS valid flag if available, fall back to lat/lng check
  const hasGPS = raw.gv === 1 || (raw.gv === undefined && (raw.lat !== 0 || raw.lng !== 0));
  const mpuOk = raw.mpu === undefined || raw.mpu === 1;

  let systemStatus = 'online';
  if (!hasGPS && !mpuOk) systemStatus = 'offline';
  else if (!hasGPS || !mpuOk) systemStatus = 'warning';

  // Increment sequence number for packet loss detection
  messageSequence++;

  return {
    type: 'data',
    sequence: messageSequence,
    payload: {
      timestamp: Date.now(),
      gps: {
        latitude: hasGPS ? (raw.lat ?? 0) : null,
        longitude: hasGPS ? (raw.lng ?? 0) : null,
        speed: hasGPS ? (raw.spd ?? 0) : null,
        altitude: hasGPS ? (raw.alt ?? 0) : null,
      },
      accelerometer: {
        x: mpuOk ? (raw.ax ?? 0) : null,
        y: mpuOk ? (raw.ay ?? 0) : null,
        z: mpuOk ? (raw.az ?? 0) : null,
      },
      systemStatus,
      totalAcceleration: mpuOk ? (raw.ta ?? 0) : null,
      accidentDetected: mpuOk && (raw.ad ?? 0) === 1,
      batteryLevel: 'bat' in raw ? raw.bat : null,
      temperature: 'tmp' in raw ? raw.tmp : null,
      gpsValid: hasGPS,
      mpuStatus: mpuOk,
      uptime: raw.ms ?? 0,
    },
  };
}

// ── Broadcast to all WebSocket clients ─────────────────────
/**
 * Broadcasts a message to all connected WebSocket clients.
 * Includes backpressure handling and dead connection cleanup.
 */
function broadcast(message) {
  const data = JSON.stringify(message);
  const deadClients = [];
  let slowClients = 0;

  for (const client of wss.clients) {
    // Initialize failure counter if not present
    if (client.sendFailures === undefined) client.sendFailures = 0;

    if (client.readyState === WebSocket.OPEN) {
      // CRITICAL FIX: Check backpressure before sending
      if (client.bufferedAmount > MAX_BACKLOG_BYTES) {
        slowClients++;
        console.warn(`[WS] Client backlog ${(client.bufferedAmount / 1024 / 1024).toFixed(2)}MB — terminating`);
        deadClients.push(client);
        continue;
      }

      try {
        client.send(data);
        client.sendFailures = 0;  // Reset on success
      } catch (err) {
        client.sendFailures++;
        console.warn(`[WS] Send failed (${client.sendFailures}): ${err.message}`);

        // CRITICAL FIX: Remove persistently failing clients
        if (client.sendFailures >= DEAD_CONNECTION_THRESHOLD) {
          deadClients.push(client);
        }
      }
    } else if (client.readyState === WebSocket.CLOSING || client.readyState === WebSocket.CLOSED) {
      // Cleanup clients in transitional states
      deadClients.push(client);
    }
  }

  // Terminate dead/slow connections
  for (const client of deadClients) {
    try {
      client.terminate();
      metrics.clientsTerminated++;
    } catch (err) {
      console.warn(`[WS] Terminate failed: ${err.message}`);
    }
  }

  if (slowClients > 0) {
    console.error(`[WS] Terminated ${slowClients} slow clients`);
  }

  metrics.broadcastCount++;
}

// ── Serial Port Helpers ────────────────────────────────────
function openSerialPort(portPath, baudRate) {
  return new Promise((resolve, reject) => {
    // CRITICAL FIX: Check connection lock to prevent race conditions
    if (connectionLock) {
      reject(new Error('Connection already in progress'));
      return;
    }

    if (serialPort && serialPort.isOpen) {
      reject(new Error('Already connected. Disconnect first.'));
      return;
    }

    // Acquire lock
    connectionLock = { portPath, baudRate, startTime: Date.now() };

    serialPort = new SerialPort({
      path: portPath,
      baudRate: baudRate,
      autoOpen: false,
    });

    parser = serialPort.pipe(new ReadlineParser({ delimiter: '\n' }));

    // Handle parser errors (buffer overflow, encoding issues)
    parser.on('error', (err) => {
      console.error(`[Parser] Error: ${err.message}`);
      broadcast({ type: 'error', message: `Serial parser error: ${err.message}` });
    });

    // On each complete line from Arduino
    parser.on('data', (line) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      // CRITICAL FIX: Validate line length to prevent DoS
      if (trimmed.length > MAX_LINE_LENGTH) {
        console.warn(`[Parse] Line too long (${trimmed.length} > ${MAX_LINE_LENGTH})`);
        metrics.parseFailed++;
        return;
      }

      try {
        const raw = JSON.parse(trimmed);

        // Skip boot/status/error messages from Arduino
        if (raw.status === 'boot') {
          console.log(`[Arduino] ${raw.msg || 'Booted'}`);
          broadcast({ type: 'log', message: raw.msg || 'Arduino booted' });
          return;
        }

        if (raw.err) {
          console.error(`[Arduino] Error: ${raw.err} - ${raw.msg || ''}`);
          broadcast({ type: 'error', message: `Arduino: ${raw.err}` });
          return;
        }

        // CRITICAL FIX: Validate data before transformation
        if (!isValidArduinoData(raw)) {
          console.warn(`[Parse] Invalid Arduino data: ${JSON.stringify(raw).substring(0, 100)}`);
          metrics.parseInvalid++;
          return;
        }

        const message = transformArduinoData(raw);
        broadcast(message);
        metrics.parseSuccess++;
      } catch (err) {
        // Partial or malformed JSON line — skip
        console.warn(`[Parse] Skipping malformed line: ${trimmed.substring(0, 80)}`);
        metrics.parseFailed++;
      }
    });

    serialPort.on('close', () => {
      console.log(`[Serial] Port closed`);
      connectionLock = null;  // Release lock
      connectionState = { connected: false, port: null, baudRate };
      broadcast({ type: 'status', connected: false, port: null });
    });

    serialPort.on('error', (err) => {
      console.error(`[Serial] Error: ${err.message}`);
      connectionLock = null;  // Release lock
      connectionState = { connected: false, port: null, baudRate };
      broadcast({ type: 'error', message: err.message });
      // Clean up references to prevent stale state
      serialPort = null;
      parser = null;
    });

    serialPort.open((err) => {
      connectionLock = null;  // Release lock regardless of outcome
      
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

// Periodically clean up expired rate-limit entries to prevent memory leak
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of rateLimitMap) {
    if (now > record.resetTime) {
      rateLimitMap.delete(ip);
    }
  }
}, 5 * 60 * 1000); // Every 5 minutes

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

  // CRITICAL FIX: Check for connection in progress
  if (connectionLock) {
    return res.status(409).json({ 
      error: 'Connection already in progress',
      lockInfo: { port: connectionLock.portPath, startTime: connectionLock.startTime }
    });
  }

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
  res.json({
    ...connectionState,
    metrics,
    sequence: messageSequence,
    wsClients: wss.clients.size,
  });
});

// ── Express error handler (must be last middleware) ─────────
app.use((err, _req, res, _next) => {
  console.error(`[Express] Unhandled error: ${err.message}`);
  res.status(500).json({ error: 'Internal server error' });
});

// ── WebSocket events ───────────────────────────────────────
wss.on('connection', (ws) => {
  console.log('[WS] Client connected');
  ws.isAlive = true;
  ws.sendFailures = 0;
  ws.connectedAt = Date.now();
  ws.connectionId = Math.random().toString(36).substring(7);

  ws.on('pong', () => {
    ws.isAlive = true;
  });

  // Send current status to newly connected client
  try {
    ws.send(JSON.stringify({ 
      type: 'status', 
      connected: connectionState.connected, 
      port: connectionState.port,
      sequence: messageSequence,
    }));
  } catch (err) {
    console.warn(`[WS] Failed to send initial status: ${err.message}`);
  }

  ws.on('close', (code, reason) => {
    const uptime = Date.now() - ws.connectedAt;
    console.log(`[WS] Client ${ws.connectionId} disconnected (code: ${code}, uptime: ${Math.round(uptime / 1000)}s)`);
  });

  ws.on('error', (err) => {
    console.warn(`[WS] Client ${ws.connectionId} error: ${err.message}`);
    ws.terminate();
  });

  // Rate limit incoming messages (clients shouldn't send much)
  let messagesThisSecond = 0;
  let lastSecond = Date.now();
  
  ws.on('message', (data) => {
    const now = Date.now();
    if (now - lastSecond > 1000) {
      messagesThisSecond = 0;
      lastSecond = now;
    } else {
      messagesThisSecond++;
      if (messagesThisSecond > 100) {
        console.warn(`[WS] Client ${ws.connectionId} rate limit exceeded`);
        ws.terminate();
        return;
      }
    }
    // Optional: handle client commands here (e.g., sync requests)
  });
});

// Heartbeat with proper termination
heartbeatInterval = setInterval(() => {
  for (const ws of wss.clients) {
    if (ws.isAlive === false) {
      console.log(`[WS] Terminating dead client ${ws.connectionId || 'unknown'}`);
      ws.terminate();
      metrics.clientsTerminated++;
      continue;  // Don't ping a terminated client
    }
    ws.isAlive = false;
    ws.ping();
  }
}, 30000);

// Periodic cleanup of orphaned connections (safety net)
setInterval(() => {
  let orphaned = 0;
  for (const ws of wss.clients) {
    if (ws.readyState === WebSocket.CLOSED) {
      orphaned++;
    }
  }
  if (orphaned > 0) {
    console.log(`[WS] Found ${orphaned} orphaned connections in set`);
  }
}, 60000);

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
    // Notify all clients before closing
    broadcast({ type: 'status', connected: false, port: null, message: 'Server shutting down' });
    await closeSerialPort();
    wss.close();
    server.close(() => {
      console.log('[Server] Closed.');
      process.exit(0);
    });
    // Force exit after 5s if graceful close hangs
    setTimeout(() => process.exit(0), 5000);
  });
});

// Catch unhandled errors to prevent crash
process.on('uncaughtException', (err) => {
  console.error(`[FATAL] Uncaught exception: ${err.message}`);
  console.error(err.stack);
});

process.on('unhandledRejection', (reason) => {
  console.error(`[FATAL] Unhandled promise rejection:`, reason);
});
