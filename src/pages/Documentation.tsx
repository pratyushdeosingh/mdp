import { useState } from 'react';
import GlassCard from '../components/GlassCard';
import { FileText, GitBranch, Presentation, Lightbulb, BookOpen } from 'lucide-react';

const tabs = [
  { id: 'abstract', label: 'Abstract', icon: BookOpen },
  { id: 'block-diagram', label: 'Block Diagram', icon: GitBranch },
  { id: 'flowchart', label: 'Flowchart', icon: GitBranch },
  { id: 'ppt', label: 'PPT Viewer', icon: Presentation },
  { id: 'future', label: 'Future Work', icon: Lightbulb },
];

function AbstractTab() {
  return (
    <div className="space-y-4 text-sm text-[var(--text-secondary)] leading-relaxed">
      <h2 className="text-lg font-bold text-[var(--text-primary)]">Abstract</h2>
      <p>
        This project presents the design and partial implementation of a <strong className="text-[var(--text-primary)]">GPS and Motion-Based
        Vehicle Tracking System</strong> using embedded IoT components. The system integrates a <strong className="text-[var(--text-primary)]">NEO-6M GPS
        module</strong> for real-time location tracking, an <strong className="text-[var(--text-primary)]">ADXL345 accelerometer</strong> for
        3-axis motion detection, and a <strong className="text-[var(--text-primary)]">SIM800L GSM/GPRS module</strong> for wireless
        data transmission, all orchestrated by an <strong className="text-[var(--text-primary)]">Arduino Uno R3</strong> microcontroller.
      </p>
      <p>
        The primary objective is to create a low-cost, reliable vehicle tracking and monitoring
        solution capable of detecting sudden acceleration, braking events, and potential collisions
        while simultaneously transmitting GPS coordinates via SMS and GPRS to a remote monitoring
        dashboard.
      </p>
      <p>
        As of Review III, <strong className="text-[var(--text-primary)]">50% of the project execution is complete</strong>. The
        microcontroller firmware has been developed and tested. The web-based dashboard is fully
        operational with simulated data streams that mirror the exact serial data format the
        hardware will produce. The SIM800L module has encountered hardware failure and is being
        replaced. GPS and accelerometer modules are procured and pending integration.
      </p>
      <p>
        The dashboard features real-time visualization of sensor data, interactive map tracking,
        accelerometer analytics, a serial monitor for AT command debugging, and comprehensive
        hardware status tracking—demonstrating the complete software pipeline while hardware
        integration continues in parallel.
      </p>
    </div>
  );
}

function BlockDiagramTab() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-[var(--text-primary)]">System Block Diagram</h2>
      <GlassCard className="p-8">
        <div className="max-w-2xl mx-auto">
          {/* ASCII-style block diagram using styled divs */}
          <div className="flex flex-col items-center gap-3">
            {/* Sensors Row */}
            <div className="grid grid-cols-3 gap-4 w-full max-w-lg">
              {[
                { label: 'NEO-6M GPS', sub: 'UART', color: 'blue' },
                { label: 'ADXL345', sub: 'I2C', color: 'orange' },
                { label: 'SIM800L GSM', sub: 'UART', color: 'red' },
              ].map(b => (
                <div
                  key={b.label}
                  className={`p-3 rounded-xl border text-center ${
                    b.color === 'blue'
                      ? 'border-blue-500/30 bg-blue-500/10'
                      : b.color === 'orange'
                      ? 'border-orange-500/30 bg-orange-500/10'
                      : 'border-red-500/30 bg-red-500/10'
                  }`}
                >
                  <p className="text-xs font-semibold text-[var(--text-primary)]">{b.label}</p>
                  <p className="text-[10px] text-[var(--text-muted)]">{b.sub}</p>
                </div>
              ))}
            </div>

            {/* Arrows down */}
            <div className="flex justify-center gap-24">
              {[0, 1, 2].map(i => (
                <div key={i} className="text-[var(--text-muted)] text-lg">↓</div>
              ))}
            </div>

            {/* MCU */}
            <div className="p-4 rounded-xl border-2 border-blue-500/40 bg-blue-500/10 w-64 text-center">
              <p className="text-sm font-bold text-[var(--text-primary)]">Arduino Uno R3</p>
              <p className="text-[10px] text-[var(--text-muted)]">ATmega328P | 16MHz</p>
            </div>

            <div className="text-[var(--text-muted)] text-lg">↓</div>

            {/* Communication */}
            <div className="grid grid-cols-2 gap-4 w-full max-w-md">
              <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-center">
                <p className="text-xs font-semibold text-[var(--text-primary)]">Serial / USB</p>
                <p className="text-[10px] text-[var(--text-muted)]">To Web Dashboard</p>
              </div>
              <div className="p-3 rounded-xl border border-purple-500/30 bg-purple-500/10 text-center">
                <p className="text-xs font-semibold text-[var(--text-primary)]">GPRS / SMS</p>
                <p className="text-[10px] text-[var(--text-muted)]">Remote Server</p>
              </div>
            </div>

            <div className="text-[var(--text-muted)] text-lg">↓</div>

            {/* Dashboard */}
            <div className="p-4 rounded-xl border border-cyan-500/30 bg-cyan-500/10 w-80 text-center">
              <p className="text-sm font-bold text-[var(--text-primary)]">Web Dashboard</p>
              <p className="text-[10px] text-[var(--text-muted)]">React + TypeScript | Real-time Visualization</p>
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}

function FlowchartTab() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-[var(--text-primary)]">System Flowchart</h2>
      <GlassCard className="p-8">
        <div className="max-w-md mx-auto flex flex-col items-center gap-2">
          {[
            { text: 'System Power ON', shape: 'rounded-full', color: 'emerald' },
            { text: 'Initialize MCU, GPS, Accelerometer', shape: 'rounded-xl', color: 'blue' },
            { text: 'Initialize GSM Module', shape: 'rounded-xl', color: 'blue' },
            { text: 'GSM Ready?', shape: 'rotate-45', color: 'amber', diamond: true },
            { text: 'Acquire GPS Fix', shape: 'rounded-xl', color: 'blue' },
            { text: 'Read Accelerometer (X, Y, Z)', shape: 'rounded-xl', color: 'blue' },
            { text: 'Motion Threshold Exceeded?', shape: 'rotate-45', color: 'amber', diamond: true },
            { text: 'Send SMS Alert + GPS Data via GPRS', shape: 'rounded-xl', color: 'purple' },
            { text: 'Transmit to Web Dashboard via Serial', shape: 'rounded-xl', color: 'cyan' },
            { text: 'Wait 1s → Loop', shape: 'rounded-full', color: 'emerald' },
          ].map((step, i) => (
            <div key={i} className="flex flex-col items-center gap-2 w-full">
              {i > 0 && <div className="text-[var(--text-muted)]">↓</div>}
              <div
                className={`p-3 border text-center w-full max-w-xs ${
                  step.diamond
                    ? `border-${step.color}-500/30 bg-${step.color}-500/10 rounded-xl`
                    : `border-${step.color}-500/30 bg-${step.color}-500/10 ${step.shape}`
                }`}
                style={{
                  borderColor: `var(--${step.color === 'emerald' ? 'success' : step.color === 'amber' ? 'warning' : 'accent'})`,
                  background: step.color === 'emerald' ? 'rgba(16,185,129,0.1)' :
                    step.color === 'amber' ? 'rgba(245,158,11,0.1)' :
                    step.color === 'purple' ? 'rgba(168,85,247,0.1)' :
                    step.color === 'cyan' ? 'rgba(6,182,212,0.1)' : 'rgba(59,130,246,0.1)',
                }}
              >
                <p className="text-xs font-medium text-[var(--text-primary)]">
                  {step.diamond ? `◇ ${step.text}` : step.text}
                </p>
              </div>
            </div>
          ))}
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
      phase: 'Phase 1 — Hardware Completion',
      tasks: [
        'Replace damaged SIM800L GSM module with tested unit',
        'Wire and test NEO-6M GPS module with Arduino',
        'Connect ADXL345 via I2C and calibrate offset values',
        'Complete breadboard prototype with all 4 modules',
      ],
    },
    {
      phase: 'Phase 2 — Firmware Integration',
      tasks: [
        'Implement NMEA sentence parsing for GPS data',
        'Configure AT command sequence for GPRS data upload',
        'Add motion event detection threshold in firmware',
        'Implement SMS alert trigger for collision events',
      ],
    },
    {
      phase: 'Phase 3 — Web Dashboard Enhancement',
      tasks: [
        'Replace simulation engine with real serial/WebSocket data',
        'Add geofencing alert system on the map view',
        'Implement historical data storage (IndexedDB or backend)',
        'Add user authentication for remote monitoring access',
      ],
    },
    {
      phase: 'Phase 4 — Testing & Deployment',
      tasks: [
        'Field testing with actual vehicle movement',
        'Power management optimization (sleep modes)',
        'PCB design for final compact form factor',
        'Documentation and final project report',
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
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0 mt-1.5" />
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
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
              activeTab === tab.id
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
