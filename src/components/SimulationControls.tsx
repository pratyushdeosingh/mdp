import { Play, Zap, AlertTriangle, ShieldCheck } from 'lucide-react';
import type { ScenarioType } from '../types';
import GlassCard from './GlassCard';

interface SimulationControlsProps {
  activeScenario: ScenarioType;
  onTriggerScenario: (scenario: ScenarioType, durationMs?: number) => void;
  onUserSafe: () => void;
}

export default function SimulationControls({ activeScenario, onTriggerScenario, onUserSafe }: SimulationControlsProps) {
  const buttons = [
    {
      label: 'Simulate Normal',
      scenario: 'normal' as const,
      icon: <Play size={16} />,
      color: 'var(--color-emerald)',
      bg: 'var(--status-emerald-bg)',
      border: 'var(--color-emerald)',
      duration: 3000,
    },
    {
      label: 'Simulate Accident',
      scenario: 'accident' as const,
      icon: <AlertTriangle size={16} />,
      color: 'var(--color-amber)',
      bg: 'var(--status-amber-bg)',
      border: 'var(--color-amber)',
      duration: 4000,
    },
    {
      label: 'Simulate Severe Crash',
      scenario: 'severe' as const,
      icon: <Zap size={16} />,
      color: 'var(--color-red)',
      bg: 'var(--status-red-bg)',
      border: 'var(--color-red)',
      duration: 5000,
    },
  ];

  return (
    <GlassCard className="p-5">
      <div className="flex flex-wrap items-center gap-4">
        <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-[0.15em] mr-2">
          🧪 Simulation Mode
        </span>
        {buttons.map(btn => (
          <button
            key={btn.scenario}
            onClick={() => onTriggerScenario(btn.scenario, btn.duration)}
            disabled={activeScenario === btn.scenario}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            style={{
              color: btn.color,
              background: activeScenario === btn.scenario ? btn.bg : 'transparent',
              borderColor: btn.border,
            }}
          >
            {btn.icon}
            {btn.label}
            {activeScenario === btn.scenario && (
              <span className="w-1.5 h-1.5 rounded-full pulse-live ml-1" style={{ background: btn.color }} />
            )}
          </button>
        ))}
        <button
          onClick={onUserSafe}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border transition-all hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400"
          style={{
            color: 'var(--color-emerald)',
            borderColor: 'var(--color-emerald)',
            background: 'transparent',
          }}
        >
          <ShieldCheck size={16} />
          User Safe Button
        </button>
      </div>
    </GlassCard>
  );
}
