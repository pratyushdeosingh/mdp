import { useState } from 'react';
import GlassCard from '../components/GlassCard';
import CircuitSchematic from '../components/CircuitSchematic';
import { GitBranch, Presentation, Lightbulb, BookOpen, Workflow, Cpu } from 'lucide-react';

const tabs = [
  { id: 'abstract', label: 'Abstract', icon: BookOpen },
  { id: 'circuit', label: 'Circuit Diagram', icon: Cpu },
  { id: 'block-diagram', label: 'Block Diagram', icon: GitBranch },
  { id: 'flowchart', label: 'Flowchart', icon: Workflow },
  { id: 'ppt', label: 'PPT Viewer', icon: Presentation },
  { id: 'future', label: 'Future Work', icon: Lightbulb },
];

function AbstractTab() {
  return (
    <div className="space-y-4 text-sm text-[var(--text-secondary)] leading-relaxed">
      <h2 className="text-lg font-bold text-[var(--text-primary)]">Abstract</h2>
      <p>
        The <strong className="text-[var(--text-primary)]">Smart Safety Helmet</strong> is an IoT-based safety system
        designed to reduce fatalities caused by delayed emergency response during road accidents. Many accident victims
        are unable to call for help due to severe injuries or unconsciousness, which leads to delays in medical assistance.
        This project aims to bridge that gap by <strong className="text-[var(--text-primary)]">automatically detecting
          accidents and sending emergency alerts</strong>.
      </p>
      <p>
        The system uses sensors integrated into a helmet to continuously monitor the rider's movement. An
        <strong className="text-[var(--text-primary)]"> MPU6050 accelerometer and gyroscope</strong> detects sudden
        impacts, abnormal motion, or crashes. When such an event is detected, the system triggers an emergency response
        mechanism. The core controller is an <strong className="text-[var(--text-primary)]">Arduino Uno R3</strong>
        microcontroller, which processes sensor data and controls the communication modules.
      </p>
      <p>
        In the complete design, the helmet also includes <strong className="text-[var(--text-primary)]">GPS and GSM
          communication modules</strong> to send an automated SOS message containing the rider's location to emergency
        contacts or hospitals. The <strong className="text-[var(--text-primary)]">NEO-6M GPS module</strong> provides
        real-time location tracking, while all sensor data is streamed to a web dashboard via a Node.js WebSocket bridge
        server for real-time visualization.
      </p>
      <p>
        However, the GSM communication functionality is currently not implemented in the working prototype because a
        SIM card is not available for the SIM module. Therefore, the present version focuses mainly on
        <strong className="text-[var(--text-primary)]"> accident detection using the MPU6050 sensor</strong> along with
        alert mechanisms such as buzzers and dashboard notifications, while the GSM-based SOS messaging feature remains
        part of the planned future implementation.
      </p>
      <p>
        Overall, the Smart Safety Helmet demonstrates how embedded systems, sensors, and IoT technologies can be combined
        to improve road safety. By enabling automatic accident detection and faster emergency response, the system has the
        potential to reduce response time, increase rider safety, and contribute to smarter transportation systems.
      </p>
    </div>
  );
}

const wireColors: Record<string, string> = {
  uart: 'var(--color-cyan)',
  i2c: 'var(--color-orange)',
  digital: 'var(--color-blue)',
  power: 'var(--color-red)',
  ground: 'var(--color-gray)',
};

const connections = [
  { from: 'NEO-6M GPS', fromPin: 'TX', to: 'Arduino Uno', toPin: 'D4', type: 'uart', label: 'SoftwareSerial RX · 9600 baud' },
  { from: 'Arduino Uno', fromPin: 'D3', to: 'NEO-6M GPS', toPin: 'RX', type: 'uart', label: 'SoftwareSerial TX · 9600 baud' },
  { from: 'MPU6050', fromPin: 'SDA', to: 'Arduino Uno', toPin: 'A4', type: 'i2c', label: 'I2C Data · Addr 0x68' },
  { from: 'MPU6050', fromPin: 'SCL', to: 'Arduino Uno', toPin: 'A5', type: 'i2c', label: 'I2C Clock' },
  { from: 'Arduino Uno', fromPin: 'D8', to: 'Buzzer Module', toPin: 'S', type: 'digital', label: 'Signal pin · 500ms beep' },
  { from: 'Arduino Uno', fromPin: '5V', to: 'Buzzer Module', toPin: '(+)', type: 'power', label: '5V Power' },
  { from: 'Arduino Uno', fromPin: 'GND', to: 'Buzzer Module', toPin: '(−)', type: 'ground', label: 'Ground' },
  { from: 'Cancel Button', fromPin: 'Pin 1', to: 'Arduino Uno', toPin: 'D7', type: 'digital', label: 'INPUT_PULLUP · Active LOW' },
  { from: 'Arduino Uno', fromPin: '5V', to: 'NEO-6M GPS', toPin: 'VCC', type: 'power', label: '5V Power' },
  { from: 'Arduino Uno', fromPin: '5V', to: 'MPU6050', toPin: 'VCC', type: 'power', label: '5V Power' },
  { from: 'Arduino Uno', fromPin: 'GND', to: 'All Modules', toPin: 'GND', type: 'ground', label: 'Common Ground' },
];

const modules = [
  {
    name: '⚡ Arduino Uno R3',
    sub: 'ATmega328P · 16 MHz · 2KB SRAM',
    pins: ['D3', 'D4', 'D7', 'D8', 'A4', 'A5', '5V', 'GND'],
    color: 'blue',
  },
  {
    name: '🛰️ NEO-6M GPS',
    sub: 'UART · 9600 baud · NMEA',
    pins: ['TX', 'RX', 'VCC', 'GND'],
    color: 'cyan',
  },
  {
    name: '📐 MPU6050 IMU',
    sub: 'I2C · Addr 0x68 · ±2g default',
    pins: ['SDA', 'SCL', 'VCC', 'GND'],
    color: 'orange',
  },
  {
    name: '🔊 Buzzer Module',
    sub: 'Active · 3-Pin (S, +, −)',
    pins: ['S → D8', '(+) → 5V', '(−) → GND'],
    color: 'red',
  },
  {
    name: '🛑 Cancel Button',
    sub: 'Momentary N.O. · 200ms debounce',
    pins: ['Pin 1 → D7', 'Pin 2 → GND'],
    color: 'emerald',
  },
];

function CircuitDiagramTab() {
  const moduleColors: Record<string, { border: string; bg: string }> = {
    blue: { border: 'border-blue-500/40', bg: 'bg-blue-500/10' },
    cyan: { border: 'border-cyan-500/40', bg: 'bg-cyan-500/10' },
    orange: { border: 'border-orange-500/40', bg: 'bg-orange-500/10' },
    red: { border: 'border-red-500/40', bg: 'bg-red-500/10' },
    emerald: { border: 'border-emerald-500/40', bg: 'bg-emerald-500/10' },
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold text-[var(--text-primary)]">Circuit Wiring Diagram</h2>

      {/* SVG Schematic — textbook style */}
      <GlassCard className="p-4">
        <CircuitSchematic />
      </GlassCard>

      {/* Visual module layout */}
      <GlassCard className="p-6">
        <p className="text-xs font-bold tracking-widest uppercase text-[var(--text-muted)] mb-4">Hardware Modules</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.map(mod => {
            const c = moduleColors[mod.color];
            return (
              <div key={mod.name} className={`p-4 rounded-xl border-2 ${c.border} ${c.bg}`}>
                <p className="text-sm font-bold text-[var(--text-primary)]">{mod.name}</p>
                <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{mod.sub}</p>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {mod.pins.map(pin => (
                    <span
                      key={pin}
                      className="text-[10px] px-2 py-0.5 rounded-md font-mono bg-[var(--bg-primary)] text-[var(--text-secondary)] border border-[var(--border-color)]"
                    >
                      {pin}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </GlassCard>

      {/* Connection table */}
      <GlassCard className="p-6">
        <p className="text-xs font-bold tracking-widest uppercase text-[var(--text-muted)] mb-4">Wire Connections</p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[var(--border-color)]">
                <th className="text-left py-2 pr-3 font-semibold text-[var(--text-primary)]">From</th>
                <th className="text-left py-2 pr-3 font-semibold text-[var(--text-primary)]">Pin</th>
                <th className="text-center py-2 pr-3 font-semibold text-[var(--text-primary)]">→</th>
                <th className="text-left py-2 pr-3 font-semibold text-[var(--text-primary)]">To</th>
                <th className="text-left py-2 pr-3 font-semibold text-[var(--text-primary)]">Pin</th>
                <th className="text-left py-2 pr-3 font-semibold text-[var(--text-primary)]">Type</th>
                <th className="text-left py-2 font-semibold text-[var(--text-primary)]">Notes</th>
              </tr>
            </thead>
            <tbody>
              {connections.map((c, i) => (
                <tr key={i} className="border-b border-[var(--border-color)]/50">
                  <td className="py-2 pr-3 text-[var(--text-secondary)]">{c.from}</td>
                  <td className="py-2 pr-3 font-mono font-semibold text-[var(--text-primary)]">{c.fromPin}</td>
                  <td className="py-2 pr-3 text-center">
                    <span
                      className="inline-block w-6 h-0.5 rounded-full"
                      style={{ background: wireColors[c.type] }}
                    />
                  </td>
                  <td className="py-2 pr-3 text-[var(--text-secondary)]">{c.to}</td>
                  <td className="py-2 pr-3 font-mono font-semibold text-[var(--text-primary)]">{c.toPin}</td>
                  <td className="py-2 pr-3">
                    <span
                      className="px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider"
                      style={{
                        color: wireColors[c.type],
                        background: `color-mix(in srgb, ${wireColors[c.type]} 15%, transparent)`,
                      }}
                    >
                      {c.type}
                    </span>
                  </td>
                  <td className="py-2 text-[var(--text-muted)]">{c.label}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Color legend */}
      <GlassCard className="p-4">
        <p className="text-xs font-bold tracking-widest uppercase text-[var(--text-muted)] mb-3">Wire Color Legend</p>
        <div className="flex flex-wrap gap-4">
          {Object.entries(wireColors).map(([type, color]) => (
            <div key={type} className="flex items-center gap-2">
              <span className="w-6 h-1 rounded-full" style={{ background: color }} />
              <span className="text-xs uppercase tracking-wide font-medium text-[var(--text-secondary)]">{type}</span>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-[var(--text-muted)] mt-3">
          ⚡ Power MPU6050 and NEO-6M from Arduino <strong>3.3V or 5V</strong> depending on your module variant. Cancel button uses internal pull-up resistor (no external resistor needed).
        </p>
      </GlassCard>
    </div>
  );
}

function BlockDiagramTab() {
  const colorMap: Record<string, string> = {
    blue: 'border-blue-500/30 bg-blue-500/10',
    orange: 'border-orange-500/30 bg-orange-500/10',
    emerald: 'border-emerald-500/30 bg-emerald-500/10',
    red: 'border-red-500/30 bg-red-500/10',
    amber: 'border-amber-500/30 bg-amber-500/10',
    purple: 'border-purple-500/30 bg-purple-500/10',
    cyan: 'border-cyan-500/30 bg-cyan-500/10',
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-[var(--text-primary)]">System Block Diagram</h2>
      <GlassCard className="p-8">
        <div className="max-w-3xl mx-auto">
          <div className="flex flex-col items-center gap-3">
            {/* HARDWARE LAYER label */}
            <p className="text-[10px] font-bold tracking-widest uppercase text-[var(--text-muted)]">Hardware Layer — Arduino Uno R3</p>

            {/* Sensors Row */}
            <div className="grid grid-cols-2 gap-4 w-full max-w-md">
              {[
                { label: '🛰️ NEO-6M GPS', sub: 'UART · D3 (TX), D4 (RX)', color: 'blue' },
                { label: '📐 MPU6050 IMU', sub: 'I2C · SDA (A4), SCL (A5)', color: 'orange' },
              ].map(b => (
                <div key={b.label} className={`p-3 rounded-xl border text-center ${colorMap[b.color]}`}>
                  <p className="text-xs font-semibold text-[var(--text-primary)]">{b.label}</p>
                  <p className="text-[10px] text-[var(--text-muted)]">{b.sub}</p>
                </div>
              ))}
            </div>

            <div className="flex justify-center gap-32">
              {[0, 1].map(i => (
                <div key={i} className="text-[var(--text-muted)] text-lg">↓</div>
              ))}
            </div>

            {/* MCU */}
            <div className={`p-4 rounded-xl border-2 border-blue-500/40 bg-blue-500/10 w-72 text-center`}>
              <p className="text-sm font-bold text-[var(--text-primary)]">⚡ Arduino Uno R3</p>
              <p className="text-[10px] text-[var(--text-muted)]">ATmega328P · 16 MHz · 2KB SRAM</p>
              <p className="text-[10px] text-[var(--text-muted)] mt-1">Accident Detection · JSON Serialization</p>
            </div>

            {/* Arrows to outputs */}
            <div className="flex justify-center gap-10">
              {[0, 1, 2].map(i => (
                <div key={i} className="text-[var(--text-muted)] text-lg">↓</div>
              ))}
            </div>

            {/* Outputs Row */}
            <div className="grid grid-cols-3 gap-3 w-full max-w-lg">
              <div className={`p-3 rounded-xl border text-center ${colorMap.emerald}`}>
                <p className="text-xs font-semibold text-[var(--text-primary)]">📟 USB Serial</p>
                <p className="text-[10px] text-[var(--text-muted)]">JSON @ 9600 baud · 1 Hz</p>
              </div>
              <div className={`p-3 rounded-xl border text-center ${colorMap.red}`}>
                <p className="text-xs font-semibold text-[var(--text-primary)]">🔊 Buzzer</p>
                <p className="text-[10px] text-[var(--text-muted)]">Pin 8 · 500ms beep</p>
              </div>
              <div className={`p-3 rounded-xl border text-center ${colorMap.amber}`}>
                <p className="text-xs font-semibold text-[var(--text-primary)]">🛑 Cancel Button</p>
                <p className="text-[10px] text-[var(--text-muted)]">Pin 7 · INPUT_PULLUP</p>
              </div>
            </div>

            {/* JSON Fields Preview */}
            <div className={`p-3 rounded-xl border text-center w-full max-w-lg ${colorMap.emerald}`}>
              <p className="text-[10px] font-semibold text-[var(--text-primary)] mb-1">JSON Output Fields (14)</p>
              <p className="text-[10px] text-[var(--text-muted)] font-mono">
                gv · lat · lng · spd · alt · ax · ay · az · ta · ad · tmp · bat · mpu · ms
              </p>
            </div>

            <div className="text-[var(--text-muted)] text-lg">↓</div>

            {/* BRIDGE LAYER label */}
            <p className="text-[10px] font-bold tracking-widest uppercase text-[var(--text-muted)]">Bridge Layer — Node.js</p>

            {/* Bridge Server */}
            <div className={`p-4 rounded-xl border w-80 text-center ${colorMap.purple}`}>
              <p className="text-xs font-semibold text-[var(--text-primary)]">🖥️ Bridge Server · Port 3001</p>
              <p className="text-[10px] text-[var(--text-muted)] mt-1">SerialPort → transformData() → WebSocket</p>
              <div className="flex justify-center gap-2 mt-2 flex-wrap">
                {['GET /api/ports', 'POST /api/connect', 'POST /api/disconnect', 'GET /api/status'].map(ep => (
                  <span key={ep} className="text-[9px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono">{ep}</span>
                ))}
              </div>
            </div>

            <div className="text-[var(--text-muted)] text-lg">↓</div>

            {/* DASHBOARD LAYER label */}
            <p className="text-[10px] font-bold tracking-widest uppercase text-[var(--text-muted)]">Dashboard Layer — React 19</p>

            {/* Dashboard */}
            <div className={`p-4 rounded-xl border w-full max-w-lg text-center ${colorMap.cyan}`}>
              <p className="text-sm font-bold text-[var(--text-primary)]">🖼️ Web Dashboard · Port 5173</p>
              <p className="text-[10px] text-[var(--text-muted)] mt-1">React + TypeScript + Vite · Glass-Morphism UI</p>
              <div className="flex justify-center gap-2 mt-2 flex-wrap">
                {['Dashboard', 'Live Map', 'Analytics', 'Accidents', 'Serial', 'Hardware', 'Docs'].map(p => (
                  <span key={p} className="text-[9px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300">{p}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}

function FlowchartTab() {
  const boxStyle = (color: string) => ({
    borderColor:
      color === 'emerald' ? 'rgba(16,185,129,0.3)' :
      color === 'amber'   ? 'rgba(245,158,11,0.3)' :
      color === 'red'     ? 'rgba(239,68,68,0.3)' :
      color === 'cyan'    ? 'rgba(6,182,212,0.3)' : 'rgba(59,130,246,0.3)',
    background:
      color === 'emerald' ? 'rgba(16,185,129,0.1)' :
      color === 'amber'   ? 'rgba(245,158,11,0.1)' :
      color === 'red'     ? 'rgba(239,68,68,0.1)' :
      color === 'cyan'    ? 'rgba(6,182,212,0.1)' : 'rgba(59,130,246,0.1)',
  });

  const Box = ({ text, color, pill = false }: { text: string; color: string; pill?: boolean }) => (
    <div className={`p-3 border text-center ${pill ? 'rounded-full' : 'rounded-xl'}`} style={boxStyle(color)}>
      <p className="text-xs font-medium text-[var(--text-primary)]">{text}</p>
    </div>
  );

  const Diamond = ({ text, color }: { text: string; color: string }) => (
    <div className="p-3 border rounded-xl text-center" style={boxStyle(color)}>
      <p className="text-xs font-medium text-[var(--text-primary)]">◇ {text}</p>
    </div>
  );

  const Arrow = ({ label }: { label?: string }) => (
    <div className="flex flex-col items-center">
      <div className="text-[var(--text-muted)] text-lg">↓</div>
      {label && <span className="text-[10px] text-[var(--text-muted)] -mt-1">{label}</span>}
    </div>
  );

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-[var(--text-primary)]">System Flowchart</h2>
      <GlassCard className="p-8">
        <div className="max-w-2xl mx-auto flex flex-col items-center gap-2">
          {/* Start */}
          <div className="w-full max-w-xs"><Box text="System Power ON" color="emerald" pill /></div>
          <Arrow />
          <div className="w-full max-w-xs"><Box text="Initialize MCU, GPS, MPU6050" color="blue" /></div>
          <Arrow />
          <div className="w-full max-w-xs"><Box text="Feed GPS Parser (200ms window)" color="blue" /></div>
          <Arrow />
          <div className="w-full max-w-xs"><Box text="Read MPU6050 via I2C (X, Y, Z)" color="blue" /></div>
          <Arrow />
          <div className="w-full max-w-xs"><Box text="Calculate √(ax² + ay² + az²)" color="blue" /></div>
          <Arrow />

          {/* Decision 1 — Accident threshold */}
          <div className="w-full max-w-xs"><Diamond text="Total Accel > 25 m/s²?" color="amber" /></div>

          {/* Branching */}
          <div className="grid grid-cols-2 gap-6 w-full max-w-md">
            {/* YES path */}
            <div className="flex flex-col items-center gap-2">
              <span className="text-[10px] font-semibold text-red-400">YES</span>
              <div className="text-[var(--text-muted)]">↓</div>
              <Box text="🔊 Trigger Buzzer (500ms on/off)" color="red" />
              <div className="text-[var(--text-muted)]">↓</div>
              <Diamond text="Cancel Pressed or 10s Elapsed?" color="amber" />
              <div className="grid grid-cols-2 gap-3 w-full">
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[10px] font-semibold text-emerald-400">YES</span>
                  <div className="text-[var(--text-muted)]">↓</div>
                  <Box text="Silence Alert" color="emerald" />
                </div>
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[10px] font-semibold text-red-400">NO</span>
                  <div className="text-[var(--text-muted)]">↓</div>
                  <Box text="Keep Beeping" color="red" />
                  <div className="text-[10px] text-[var(--text-muted)]">↻ loop</div>
                </div>
              </div>
            </div>

            {/* NO path */}
            <div className="flex flex-col items-center gap-2">
              <span className="text-[10px] font-semibold text-emerald-400">NO</span>
              <div className="text-[var(--text-muted)]">↓</div>
              <Box text="No accident — continue normally" color="emerald" />
            </div>
          </div>

          {/* Merge back */}
          <div className="flex justify-center gap-32 w-full max-w-md">
            {[0, 1].map(i => (
              <div key={i} className="text-[var(--text-muted)] text-lg">↓</div>
            ))}
          </div>

          {/* Output JSON */}
          <div className="w-full max-w-xs"><Box text="Output JSON via USB Serial (14 fields)" color="cyan" /></div>
          <Arrow />
          <div className="w-full max-w-xs"><Box text="Wait 1s → Loop" color="emerald" pill /></div>
          <div className="text-[10px] text-[var(--text-muted)]">↻ Repeat forever at 1 Hz</div>
        </div>
      </GlassCard>
    </div>
  );
}

function PPTViewerTab() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-[var(--text-primary)]">Presentation Viewer</h2>
      <GlassCard className="p-0 overflow-hidden">
        <div className="w-full" style={{ height: '600px' }}>
          <iframe
            title="Project Design Presentation"
            src="https://docs.google.com/presentation/d/e/2PACX-1vQwzo7CsKPlFXdhLu8-7LbdzcO5w03hOFQE2GQqbht-PAisAy4cKKAMy98n7k-7eQ/embed?start=false&loop=false&delayms=3000"
            frameBorder="0"
            width="100%"
            height="100%"
            allowFullScreen
            style={{ borderRadius: '16px' }}
          />
        </div>
      </GlassCard>
    </div>
  );
}

function FutureWorkTab() {
  const items = [
    {
      phase: '✅ Completed — Current Implementation',
      tasks: [
        'Arduino Uno R3 firmware with JSON output via USB serial at 1 Hz',
        'MPU6050 accelerometer/gyroscope — raw I2C reads with memory-safe dtostrf() buffers',
        'NEO-6M GPS with explicit validity flag (gv field) for equator edge-case safety',
        'Accident detection (>25 m/s²) with 10s buzzer alert + debounced cancel button',
        'MPU6050 health reporting (mpu field) and Arduino uptime (ms field)',
        'Node.js bridge server — Serial→WebSocket with 30 req/min rate limiting',
        'React 19 + TypeScript dashboard with glass-morphism UI and dark/light theme',
        'Real-time dashboard with acceleration gauge, GPS metrics, and accident alerts',
        'Interactive Leaflet map with live position marker and movement trail',
        'Analytics page with 60-second rolling charts (acceleration, speed, altitude)',
        'Accident history log with GPS coordinates, peak acceleration, and duration',
        'Serial monitor with macOS-style terminal and color-coded messages',
        'PDF system reports and CSV data exports',
        'Code-split bundle — 81% smaller initial load via lazy routes and vendor chunks',
        'Toast notification system with auto-dismiss',
        'Mobile responsive layout with hamburger menu overlay',
      ],
    },
    {
      phase: '🔴 Phase 1 — Enhanced Communication',
      tasks: [
        'GSM/SIM module integration — send automated SOS with GPS coordinates to emergency contacts',
        'Emergency contact auto-dial when accident is confirmed after 10-second window',
        'Cloud push notifications via Firebase Cloud Messaging',
        'Companion mobile app (React Native) with real-time helmet monitoring',
      ],
    },
    {
      phase: '🟡 Phase 2 — Intelligence & Storage',
      tasks: [
        'Cloud IoT platform integration (AWS IoT Core / Azure IoT Hub) for persistent data logging',
        'Machine learning model for driving behavior analysis and false-positive reduction',
        'Trip recording with start/stop, route replay, and exportable trip reports',
        'Geofencing alerts when rider leaves designated safe zones',
        'DHT22 temperature sensor integration for environmental monitoring',
      ],
    },
    {
      phase: '🟢 Phase 3 — Production & Scaling',
      tasks: [
        'Custom PCB design for compact form factor inside production helmets',
        'Rechargeable LiPo battery with INA219 current sensor and deep sleep modes',
        'Multi-helmet fleet tracking with rider identification on a single dashboard',
        'FOTA (Firmware Over-The-Air) updates via WiFi module (ESP32 upgrade)',
        'CE/FCC certification preparation for commercial deployment',
      ],
    },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-[var(--text-primary)]">Future Work & Roadmap</h2>
      <div className="space-y-4">
        {items.map((section, i) => (
          <GlassCard key={i}>
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">{section.phase}</h3>
            <ul className="space-y-2">
              {section.tasks.map((task, j) => (
                <li key={j} className="flex items-start gap-2 text-xs text-[var(--text-secondary)]">
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 mt-1.5 ${i === 0 ? 'bg-emerald-400' : i === 1 ? 'bg-red-400' : i === 2 ? 'bg-amber-400' : 'bg-blue-400'}`} />
                  {task}
                </li>
              ))}
            </ul>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}

export default function Documentation() {
  const [activeTab, setActiveTab] = useState('abstract');

  const renderContent = () => {
    switch (activeTab) {
      case 'abstract': return <AbstractTab />;
      case 'circuit': return <CircuitDiagramTab />;
      case 'block-diagram': return <BlockDiagramTab />;
      case 'flowchart': return <FlowchartTab />;
      case 'ppt': return <PPTViewerTab />;
      case 'future': return <FutureWorkTab />;
      default: return <AbstractTab />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Project Documentation</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Technical documentation, diagrams, and project roadmap
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 p-1 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)]">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-all ${activeTab === tab.id
              ? 'bg-blue-500 text-white shadow-sm'
              : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)]'
              }`}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="animate-fade-in-up">
        {renderContent()}
      </div>
    </div>
  );
}
