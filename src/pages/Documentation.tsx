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
        This project presents the design and implementation of a <strong className="text-[var(--text-primary)]">GPS and Motion-Based
        Vehicle Tracking System with Accident Detection</strong> using embedded IoT components. The system integrates a <strong className="text-[var(--text-primary)]">NEO-6M GPS
        module</strong> for real-time location tracking and an <strong className="text-[var(--text-primary)]">MPU6050 accelerometer/gyroscope</strong> for
        6-axis motion detection and accident event triggering, all orchestrated by an <strong className="text-[var(--text-primary)]">Arduino Uno R3</strong> microcontroller.
      </p>
      <p>
        The primary objective is to create a low-cost, reliable vehicle tracking and safety
        solution capable of detecting sudden impacts and potential collisions by monitoring total
        acceleration. When the threshold (25 m/s²) is exceeded, the system triggers a <strong className="text-[var(--text-primary)]">buzzer alert</strong> with
        a 10-second countdown, which can be cancelled via a <strong className="text-[var(--text-primary)]">manual button</strong> to prevent false alarms.
      </p>
      <p>
        As of Review III, <strong className="text-[var(--text-primary)]">100% of the project execution is complete</strong>. All hardware
        modules (Arduino Uno, MPU6050, NEO-6M GPS, Buzzer, Cancel Button) have been successfully
        integrated and tested. The Arduino outputs JSON-formatted sensor data via USB serial at 9600 baud,
        which is received by a Node.js bridge server and forwarded to the web dashboard via WebSocket
        in real-time.
      </p>
      <p>
        The dashboard features real-time visualization of sensor data, interactive map tracking,
        accelerometer analytics with accident detection monitoring, a serial data monitor, and comprehensive
        hardware status tracking — demonstrating the complete hardware-software integration pipeline.
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
            <div className="grid grid-cols-2 gap-4 w-full max-w-md">
              {[
                { label: 'NEO-6M GPS', sub: 'UART (Pins 4,3)', color: 'blue' },
                { label: 'MPU6050 IMU', sub: 'I2C (A4,A5)', color: 'orange' },
              ].map(b => (
                <div
                  key={b.label}
                  className={`p-3 rounded-xl border text-center ${
                    b.color === 'blue'
                      ? 'border-blue-500/30 bg-blue-500/10'
                      : 'border-orange-500/30 bg-orange-500/10'
                  }`}
                >
                  <p className="text-xs font-semibold text-[var(--text-primary)]">{b.label}</p>
                  <p className="text-[10px] text-[var(--text-muted)]">{b.sub}</p>
                </div>
              ))}
            </div>

            {/* Arrows down */}
            <div className="flex justify-center gap-32">
              {[0, 1].map(i => (
                <div key={i} className="text-[var(--text-muted)] text-lg">↓</div>
              ))}
            </div>

            {/* MCU */}
            <div className="p-4 rounded-xl border-2 border-blue-500/40 bg-blue-500/10 w-64 text-center">
              <p className="text-sm font-bold text-[var(--text-primary)]">Arduino Uno R3</p>
              <p className="text-[10px] text-[var(--text-muted)]">ATmega328P | 16MHz</p>
            </div>

            {/* Arrows to outputs */}
            <div className="flex justify-center gap-16">
              {[0, 1, 2].map(i => (
                <div key={i} className="text-[var(--text-muted)] text-lg">↓</div>
              ))}
            </div>

            {/* Outputs Row */}
            <div className="grid grid-cols-3 gap-4 w-full max-w-lg">
              <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-center">
                <p className="text-xs font-semibold text-[var(--text-primary)]">USB Serial</p>
                <p className="text-[10px] text-[var(--text-muted)]">JSON @ 9600 baud</p>
              </div>
              <div className="p-3 rounded-xl border border-red-500/30 bg-red-500/10 text-center">
                <p className="text-xs font-semibold text-[var(--text-primary)]">Buzzer</p>
                <p className="text-[10px] text-[var(--text-muted)]">Pin 8 | Alert</p>
              </div>
              <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-center">
                <p className="text-xs font-semibold text-[var(--text-primary)]">Button</p>
                <p className="text-[10px] text-[var(--text-muted)]">Pin 7 | Cancel</p>
              </div>
            </div>

            <div className="text-[var(--text-muted)] text-lg">↓</div>

            {/* Bridge Server */}
            <div className="p-3 rounded-xl border border-purple-500/30 bg-purple-500/10 w-64 text-center">
              <p className="text-xs font-semibold text-[var(--text-primary)]">Node.js Bridge Server</p>
              <p className="text-[10px] text-[var(--text-muted)]">Serial → WebSocket | Port 3001</p>
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
            { text: 'Initialize MCU, GPS, MPU6050', shape: 'rounded-xl', color: 'blue' },
            { text: 'Feed GPS Parser (200ms window)', shape: 'rounded-xl', color: 'blue' },
            { text: 'Read MPU6050 Accelerometer (X, Y, Z)', shape: 'rounded-xl', color: 'blue' },
            { text: 'Calculate Total Acceleration', shape: 'rounded-xl', color: 'blue' },
            { text: 'Total Accel > 25 m/s²?', shape: 'rotate-45', color: 'amber', diamond: true },
            { text: 'Trigger Buzzer + Start 10s Timer', shape: 'rounded-xl', color: 'red' },
            { text: 'Cancel Button Pressed?', shape: 'rotate-45', color: 'amber', diamond: true },
            { text: 'Output JSON via Serial USB', shape: 'rounded-xl', color: 'cyan' },
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
                    step.color === 'red' ? 'rgba(239,68,68,0.1)' :
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
      phase: 'Completed — Current Implementation',
      tasks: [
        'Arduino Uno R3 with firmware outputting JSON via USB serial',
        'MPU6050 accelerometer/gyroscope for 6-axis motion sensing',
        'NEO-6M GPS for real-time location tracking',
        'Accident detection with buzzer alert (10s timer + cancel button)',
        'Node.js bridge server (Serial → WebSocket)',
        'Full web dashboard with real-time data visualization',
      ],
    },
    {
      phase: 'Phase 1 — Enhanced Safety Features',
      tasks: [
        'Add SMS notification via GSM module when accident is confirmed',
        'Implement geofencing alerts for restricted area monitoring',
        'Add emergency contact auto-dial on confirmed accidents',
        'Integrate temperature sensor (LM35) for environmental monitoring',
      ],
    },
    {
      phase: 'Phase 2 — Data & Analytics',
      tasks: [
        'Implement historical data storage (IndexedDB or cloud backend)',
        'Add trip recording with start/stop and route replay',
        'Export trip reports with route maps and acceleration graphs',
        'Machine learning-based driving behavior analysis',
      ],
    },
    {
      phase: 'Phase 3 — Deployment & Scaling',
      tasks: [
        'PCB design for compact final form factor',
        'Power management with battery and sleep modes',
        'Mobile app companion with push notifications',
        'Multi-vehicle fleet tracking support',
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
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 mt-1.5 ${i === 0 ? 'bg-emerald-400' : 'bg-blue-400'}`} />
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
