import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Wifi, Sliders, Bell, ChevronRight, CheckCircle, Rocket } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import { useAppContext } from '../context/AppContext';

type Step = 'welcome' | 'mode' | 'thresholds' | 'alerts' | 'complete';

const STEPS: { id: Step; label: string; icon: React.ReactNode }[] = [
  { id: 'welcome', label: 'Welcome', icon: <Shield size={20} /> },
  { id: 'mode', label: 'Connection', icon: <Wifi size={20} /> },
  { id: 'thresholds', label: 'Thresholds', icon: <Sliders size={20} /> },
  { id: 'alerts', label: 'Alerts', icon: <Bell size={20} /> },
  { id: 'complete', label: 'Ready', icon: <Rocket size={20} /> },
];

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState<Step>('welcome');
  const { setDataMode, dataMode } = useAppContext();
  const navigate = useNavigate();
  const stepIndex = STEPS.findIndex(s => s.id === currentStep);

  const next = () => {
    const nextIdx = stepIndex + 1;
    if (nextIdx < STEPS.length) setCurrentStep(STEPS[nextIdx].id);
  };
  const back = () => {
    const prevIdx = stepIndex - 1;
    if (prevIdx >= 0) setCurrentStep(STEPS[prevIdx].id);
  };

  return (
    <div className="w-full min-h-[calc(100vh-120px)] flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Setup Wizard</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1.5">
          Get your Smart Safety Helmet dashboard ready in a few steps
        </p>
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-2" role="tablist" aria-label="Setup wizard steps">
        {STEPS.map((step, i) => (
          <div key={step.id} className="flex items-center gap-2 flex-1">
            <button
              type="button"
              role="tab"
              aria-selected={i === stepIndex}
              aria-label={`Step ${i + 1}: ${step.label}${i < stepIndex ? ' (completed)' : i === stepIndex ? ' (current)' : ''}`}
              onClick={() => i < stepIndex && setCurrentStep(step.id)}
              disabled={i > stepIndex}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                i < stepIndex ? 'text-white cursor-pointer hover:opacity-80' : i === stepIndex ? 'text-white' : 'text-[var(--text-muted)] cursor-not-allowed'
              }`}
              style={{
                background: i < stepIndex
                  ? 'var(--color-emerald)'
                  : i === stepIndex
                  ? 'var(--accent)'
                  : 'var(--bg-secondary)',
                border: i > stepIndex ? '2px solid var(--border-color)' : 'none',
              }}
            >
              {i < stepIndex ? <CheckCircle size={16} /> : i + 1}
            </button>
            {i < STEPS.length - 1 && (
              <div
                className="flex-1 h-0.5 rounded"
                style={{ background: i < stepIndex ? 'var(--color-emerald)' : 'var(--border-color)' }}
                aria-hidden="true"
              />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <GlassCard className="p-8">
        {currentStep === 'welcome' && (
          <div className="text-center space-y-6">
            <div className="inline-flex p-4 rounded-2xl" style={{ background: 'var(--status-blue-bg)' }}>
              <Shield size={48} style={{ color: 'var(--accent)' }} />
            </div>
            <h2 className="text-xl font-bold text-[var(--text-primary)]">
              Welcome to Smart Safety Helmet
            </h2>
            <p className="text-sm text-[var(--text-secondary)] max-w-md mx-auto leading-relaxed">
              This dashboard monitors your helmet's accelerometer and GPS sensors in real-time to detect
              accidents and provide emergency alerts. Let's set it up!
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
              {[
                { title: 'Impact Detection', desc: 'Real-time accelerometer monitoring' },
                { title: 'GPS Tracking', desc: 'Live location and speed' },
                { title: 'Emergency Alerts', desc: 'Automatic accident detection' },
              ].map(f => (
                <div key={f.title} className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)]">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">{f.title}</p>
                  <p className="text-xs text-[var(--text-muted)] mt-1">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentStep === 'mode' && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-[var(--text-primary)]">Choose Connection Mode</h2>
            <p className="text-sm text-[var(--text-secondary)]">
              How will this dashboard receive sensor data?
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => setDataMode('simulation')}
                className={`p-5 rounded-2xl border-2 text-left transition-all ${
                  dataMode === 'simulation' ? 'border-[var(--accent)]' : 'border-[var(--border-color)]'
                }`}
                style={{ background: dataMode === 'simulation' ? 'var(--status-blue-bg)' : 'var(--bg-secondary)' }}
              >
                <RadioWaveIcon size={24} style={{ color: 'var(--accent)' }} />
                <p className="text-sm font-bold text-[var(--text-primary)] mt-3">Simulation Mode</p>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  No hardware needed. Uses simulated sensor data for testing and demonstration.
                </p>
              </button>
              <button
                onClick={() => setDataMode('hardware')}
                className={`p-5 rounded-2xl border-2 text-left transition-all ${
                  dataMode === 'hardware' ? 'border-[var(--accent)]' : 'border-[var(--border-color)]'
                }`}
                style={{ background: dataMode === 'hardware' ? 'var(--status-blue-bg)' : 'var(--bg-secondary)' }}
              >
                <Wifi size={24} style={{ color: 'var(--color-emerald)' }} />
                <p className="text-sm font-bold text-[var(--text-primary)] mt-3">Hardware Mode</p>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  Connect to Arduino via USB serial. Requires the bridge server running.
                </p>
              </button>
            </div>
          </div>
        )}

        {currentStep === 'thresholds' && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-[var(--text-primary)]">Understanding Thresholds</h2>
            <p className="text-sm text-[var(--text-secondary)]">
              The system uses these pre-configured safety thresholds (matching Arduino firmware):
            </p>
            <div className="space-y-3">
              {[
                { label: 'Accident Detection', value: '25 m/s²', desc: 'Total acceleration above this triggers accident alert', color: 'var(--color-red)' },
                { label: 'Caution Zone', value: '12 m/s²', desc: 'Sudden movement detected — elevated monitoring', color: 'var(--color-amber)' },
                { label: 'Normal Range', value: '~9.8 m/s²', desc: 'Gravity only — safe and stationary', color: 'var(--color-emerald)' },
                { label: 'GPS Cold Start', value: '5-10 min', desc: 'NEO-6M GPS needs time for first satellite fix', color: 'var(--color-blue)' },
              ].map(t => (
                <div key={t.label} className="flex items-center gap-4 p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)]">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ background: t.color }} />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{t.label}: {t.value}</p>
                    <p className="text-xs text-[var(--text-muted)]">{t.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentStep === 'alerts' && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-[var(--text-primary)]">Emergency Features</h2>
            <p className="text-sm text-[var(--text-secondary)]">
              Here's what happens when an accident is detected:
            </p>
            <div className="space-y-3">
              {[
                { step: '1', title: 'Accelerometer spike detected', desc: 'Impact exceeds 25 m/s² threshold' },
                { step: '2', title: 'Emergency panel activates', desc: 'Timer starts, severity is calculated' },
                { step: '3', title: 'Arduino buzzer sounds', desc: '10-second alert with beeping pattern' },
                { step: '4', title: 'User response monitored', desc: 'Press "I\'m Safe" button or Ctrl+Alt+S' },
                { step: '5', title: 'Incident logged', desc: 'Event saved with GPS, acceleration, and response time' },
              ].map(s => (
                <div key={s.step} className="flex items-start gap-4 p-3">
                  <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ background: 'var(--accent)' }}>
                    {s.step}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{s.title}</p>
                    <p className="text-xs text-[var(--text-muted)]">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentStep === 'complete' && (
          <div className="text-center space-y-6">
            <div className="inline-flex p-4 rounded-2xl" style={{ background: 'var(--status-emerald-bg)' }}>
              <CheckCircle size={48} style={{ color: 'var(--color-emerald)' }} />
            </div>
            <h2 className="text-xl font-bold text-[var(--text-primary)]">You're All Set!</h2>
            <p className="text-sm text-[var(--text-secondary)] max-w-md mx-auto">
              Your Smart Safety Helmet dashboard is configured and ready.
              {dataMode === 'simulation' && ' Simulation mode is active — use the scenario buttons to test different situations.'}
              {dataMode === 'hardware' && ' Connect your Arduino via the Dashboard connection panel.'}
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="inline-flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-bold text-white transition-all hover:scale-105"
              style={{ background: 'linear-gradient(135deg, var(--accent), #6366f1)' }}
            >
              <Rocket size={18} />
              Go to Dashboard
            </button>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-[var(--border-color)]">
          <button
            onClick={back}
            disabled={stepIndex === 0}
            className="px-4 py-2 rounded-xl text-sm font-medium text-[var(--text-secondary)] transition-all hover:bg-[var(--bg-secondary)] disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Back
          </button>
          <span className="text-xs text-[var(--text-muted)]">
            Step {stepIndex + 1} of {STEPS.length}
          </span>
          {currentStep !== 'complete' ? (
            <button
              onClick={next}
              className="flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105"
              style={{ background: 'var(--accent)' }}
            >
              Next <ChevronRight size={16} />
            </button>
          ) : (
            <div />
          )}
        </div>
      </GlassCard>
    </div>
  );
}

function RadioWaveIcon(props: { size: number; style: React.CSSProperties }) {
  return (
    <svg width={props.size} height={props.size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={props.style}>
      <path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9" /><path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5" />
      <path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5" /><path d="M19.1 4.9C23 8.8 23 15.1 19.1 19" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}
