import { useNavigate } from 'react-router-dom';
import { Radio, ArrowRight, FileText, MapPin, Activity, Shield, Wifi } from 'lucide-react';

const features = [
  { icon: MapPin, title: 'GPS Tracking', colorVar: 'var(--color-cyan)' },
  { icon: Activity, title: 'Motion Detection', colorVar: 'var(--color-orange)' },
  { icon: Shield, title: 'Accident Alert', colorVar: 'var(--color-red)' },
  { icon: Wifi, title: 'Live Dashboard', colorVar: 'var(--color-blue)' },
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden px-6 py-12"
      style={{ background: 'var(--bg-primary)' }}
    >
      {/* Subtle background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full blur-3xl opacity-20" style={{ background: 'var(--accent-glow)' }} />

      {/* Hero section — icon + title + subtitle */}
      <div className="relative z-10 text-center max-w-3xl w-full animate-fade-in-up flex flex-col items-center">
        {/* Icon */}
        <div className="inline-flex p-5 rounded-2xl border border-[var(--border-color)] mb-10" style={{ background: 'var(--status-blue-bg)' }}>
          <Radio size={40} style={{ color: 'var(--color-blue)' }} />
        </div>

        {/* Title */}
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-[var(--text-primary)] mb-6 leading-tight tracking-tight">
          Smart Safety Helmet
        </h1>

        {/* Subtitle */}
        <p className="text-lg md:text-xl text-[var(--text-secondary)] max-w-xl mx-auto leading-relaxed mb-12">
          IoT accident detection system — GPS, accelerometer &amp; real-time dashboard.
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-5 mb-16 animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
          <button
            onClick={() => navigate('/dashboard')}
            className="group inline-flex items-center gap-3 px-12 py-5 bg-[var(--accent)] hover:opacity-90 text-white rounded-2xl text-lg font-semibold transition-all duration-200 hover:shadow-lg active:scale-[0.97]"
          >
            Enter Dashboard
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </button>
          <button
            onClick={() => navigate('/docs')}
            className="inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl text-base font-medium border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent)] hover:bg-[var(--bg-secondary)] active:scale-[0.97] transition-all duration-200"
          >
            <FileText size={18} />
            Documentation
          </button>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap items-center justify-center gap-4 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          {features.map(feat => (
            <div
              key={feat.title}
              className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full border border-[var(--border-color)] text-sm text-[var(--text-secondary)]"
              style={{ background: 'var(--glass-bg)' }}
            >
              <feat.icon size={15} style={{ color: feat.colorVar }} />
              {feat.title}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom tag */}
      <div className="absolute bottom-6 text-xs text-[var(--text-muted)]">
        Multidisciplinary Project — Review IV
      </div>
    </div>
  );
}
