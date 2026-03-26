import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { Zap, Play, Square, BarChart2, AlertTriangle, CheckCircle, Clock, Cpu } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import { useAppContext } from '../context/AppContext';

interface TestResult {
  id: string;
  name: string;
  status: 'idle' | 'running' | 'passed' | 'failed';
  eventsGenerated: number;
  eventsMissed: number;
  avgProcessingMs: number;
  duration: number;
  errors: string[];
}

type Preset = {
  id: string;
  name: string;
  description: string;
  rateHz: number;
  durationSec: number;
  scenario: 'rapid_accidents' | 'gps_dropouts' | 'sensor_noise_burst' | 'mixed_chaos';
  icon: React.ReactNode;
};

const PRESETS: Preset[] = [
  {
    id: 'rapid_accidents',
    name: 'Rapid Accident Bursts',
    description: 'Trigger 10+ accidents per second to test detection queue',
    rateHz: 10,
    durationSec: 5,
    scenario: 'rapid_accidents',
    icon: <Zap size={18} />,
  },
  {
    id: 'gps_dropouts',
    name: 'GPS Dropout Storm',
    description: 'Alternating GPS fix/loss every 200ms',
    rateHz: 5,
    durationSec: 8,
    scenario: 'gps_dropouts',
    icon: <AlertTriangle size={18} />,
  },
  {
    id: 'sensor_noise',
    name: 'Sensor Noise Flood',
    description: 'Random extreme values at high frequency',
    rateHz: 20,
    durationSec: 5,
    scenario: 'sensor_noise_burst',
    icon: <BarChart2 size={18} />,
  },
  {
    id: 'mixed_chaos',
    name: 'Mixed Chaos Mode',
    description: 'Random combination of all failure modes',
    rateHz: 15,
    durationSec: 10,
    scenario: 'mixed_chaos',
    icon: <Cpu size={18} />,
  },
];

function generateStressData(scenario: Preset['scenario']): {
  ax: number; ay: number; az: number; gpsValid: boolean; speed: number;
} {
  switch (scenario) {
    case 'rapid_accidents':
      return {
        ax: (Math.random() - 0.5) * 60,
        ay: (Math.random() - 0.5) * 60,
        az: 9.81 + (Math.random() - 0.5) * 40,
        gpsValid: true,
        speed: Math.random() * 80,
      };
    case 'gps_dropouts':
      return {
        ax: (Math.random() - 0.5) * 4,
        ay: (Math.random() - 0.5) * 4,
        az: 9.81 + (Math.random() - 0.5) * 2,
        gpsValid: Math.random() > 0.5,
        speed: Math.random() > 0.5 ? Math.random() * 60 : 0,
      };
    case 'sensor_noise_burst':
      return {
        ax: (Math.random() - 0.5) * 200,
        ay: (Math.random() - 0.5) * 200,
        az: (Math.random() - 0.5) * 200,
        gpsValid: true,
        speed: Math.random() * 300,
      };
    case 'mixed_chaos': {
      const mode = Math.random();
      if (mode < 0.33) return generateStressData('rapid_accidents');
      if (mode < 0.66) return generateStressData('gps_dropouts');
      return generateStressData('sensor_noise_burst');
    }
  }
}

export default function LoadTesting() {
  const { triggerScenario } = useAppContext();
  const [results, setResults] = useState<TestResult[]>([]);
  const [activeTest, setActiveTest] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopTest = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (progressRef.current) clearInterval(progressRef.current);
    intervalRef.current = null;
    progressRef.current = null;
    setActiveTest(null);
    setProgress(0);
    triggerScenario('normal');
  }, [triggerScenario]);

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (progressRef.current) clearInterval(progressRef.current);
    };
  }, []);

  const runTest = useCallback((preset: Preset) => {
    if (activeTest) return;

    const testId = `${preset.id}-${Date.now()}`;
    const startTime = performance.now();
    let eventsGenerated = 0;
    const errors: string[] = [];
    const processingTimes: number[] = [];

    setActiveTest(preset.id);
    setProgress(0);

    // Progress updater
    const totalMs = preset.durationSec * 1000;
    progressRef.current = setInterval(() => {
      const elapsed = performance.now() - startTime;
      setProgress(Math.min(100, (elapsed / totalMs) * 100));
    }, 100);

    const intervalMs = 1000 / preset.rateHz;
    intervalRef.current = setInterval(() => {
      const elapsed = performance.now() - startTime;
      if (elapsed > totalMs) {
        // Test complete
        const result: TestResult = {
          id: testId,
          name: preset.name,
          status: errors.length > 3 ? 'failed' : 'passed',
          eventsGenerated,
          eventsMissed: 0,
          avgProcessingMs: processingTimes.length > 0
            ? processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length
            : 0,
          duration: elapsed,
          errors,
        };
        setResults(prev => [result, ...prev].slice(0, 20));
        stopTest();
        return;
      }

      const t0 = performance.now();
      try {
        const data = generateStressData(preset.scenario);
        // Inject scenario to trigger the system's accident detection
        if (Math.sqrt(data.ax ** 2 + data.ay ** 2 + data.az ** 2) > 25) {
          triggerScenario('accident');
        }
        eventsGenerated++;
      } catch (err) {
        errors.push(err instanceof Error ? err.message : 'Unknown error');
      }
      processingTimes.push(performance.now() - t0);
    }, intervalMs);
  }, [activeTest, triggerScenario, stopTest]);

  const stats = useMemo(() => {
    if (results.length === 0) return null;
    const passed = results.filter(r => r.status === 'passed').length;
    const totalEvents = results.reduce((s, r) => s + r.eventsGenerated, 0);
    const avgProc = results.reduce((s, r) => s + r.avgProcessingMs, 0) / results.length;
    return { passed, failed: results.length - passed, totalEvents, avgProc };
  }, [results]);

  return (
    <div className="w-full min-h-[calc(100vh-120px)] flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Load Testing</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1.5">
          Stress-test the dashboard with high-frequency sensor events
        </p>
      </div>

      {/* Test Presets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {PRESETS.map(preset => (
          <GlassCard key={preset.id} className="p-5">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl" style={{ background: 'var(--status-blue-bg)', color: 'var(--accent)' }}>
                {preset.icon}
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-[var(--text-primary)]">{preset.name}</p>
                <p className="text-xs text-[var(--text-muted)] mt-1">{preset.description}</p>
                <div className="flex items-center gap-3 mt-2 text-[10px] text-[var(--text-muted)]">
                  <span>{preset.rateHz} Hz</span>
                  <span>•</span>
                  <span>{preset.durationSec}s</span>
                </div>
              </div>
              <button
                onClick={() => activeTest ? stopTest() : runTest(preset)}
                disabled={activeTest !== null && activeTest !== preset.id}
                aria-label={activeTest === preset.id ? `Stop ${preset.name} test` : `Start ${preset.name} test`}
                aria-pressed={activeTest === preset.id}
                className="p-2 rounded-xl transition-all hover:scale-105 disabled:opacity-30 disabled:cursor-not-allowed"
                style={{
                  background: activeTest === preset.id ? 'var(--status-red-bg)' : 'var(--status-emerald-bg)',
                  color: activeTest === preset.id ? 'var(--color-red)' : 'var(--color-emerald)',
                }}
              >
                {activeTest === preset.id ? <Square size={16} /> : <Play size={16} />}
              </button>
            </div>
            {activeTest === preset.id && (
              <div className="mt-3">
                <div className="h-1.5 rounded-full bg-[var(--bg-secondary)] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-100"
                    style={{
                      width: `${progress}%`,
                      background: 'linear-gradient(90deg, var(--accent), #6366f1)',
                    }}
                  />
                </div>
                <p className="text-[10px] text-[var(--text-muted)] text-right mt-1">
                  {progress.toFixed(0)}%
                </p>
              </div>
            )}
          </GlassCard>
        ))}
      </div>

      {/* Aggregate stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <GlassCard className="p-4 text-center">
            <p className="text-2xl font-bold" style={{ color: 'var(--color-emerald)' }}>{stats.passed}</p>
            <p className="text-xs text-[var(--text-muted)]">Passed</p>
          </GlassCard>
          <GlassCard className="p-4 text-center">
            <p className="text-2xl font-bold" style={{ color: 'var(--color-red)' }}>{stats.failed}</p>
            <p className="text-xs text-[var(--text-muted)]">Failed</p>
          </GlassCard>
          <GlassCard className="p-4 text-center">
            <p className="text-2xl font-bold text-[var(--text-primary)]">{stats.totalEvents.toLocaleString()}</p>
            <p className="text-xs text-[var(--text-muted)]">Total Events</p>
          </GlassCard>
          <GlassCard className="p-4 text-center">
            <p className="text-2xl font-bold text-[var(--text-primary)]">{stats.avgProc.toFixed(2)}</p>
            <p className="text-xs text-[var(--text-muted)]">Avg ms/event</p>
          </GlassCard>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <GlassCard className="divide-y divide-[var(--border-color)]">
          <div className="px-4 py-3 flex items-center gap-2">
            <Clock size={14} className="text-[var(--text-muted)]" />
            <span className="text-xs font-bold text-[var(--text-primary)]">Test History</span>
          </div>
          {results.map(r => (
            <div key={r.id} className="flex items-center gap-3 px-4 py-3">
              {r.status === 'passed'
                ? <CheckCircle size={14} style={{ color: 'var(--color-emerald)' }} />
                : <AlertTriangle size={14} style={{ color: 'var(--color-red)' }} />
              }
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-[var(--text-primary)]">{r.name}</p>
                <p className="text-[10px] text-[var(--text-muted)]">
                  {r.eventsGenerated} events in {(r.duration / 1000).toFixed(1)}s
                  {r.errors.length > 0 && ` • ${r.errors.length} errors`}
                </p>
              </div>
              <span className="text-[10px] font-mono text-[var(--text-muted)]">
                {r.avgProcessingMs.toFixed(2)}ms avg
              </span>
            </div>
          ))}
        </GlassCard>
      )}
    </div>
  );
}
