import { useNavigate } from 'react-router-dom';
import { Radio, ArrowRight, FileText, MapPin, Activity, Shield, Wifi, Zap } from 'lucide-react';

const features = [
  { icon: MapPin, title: 'GPS Tracking', colorVar: 'var(--color-cyan)', desc: 'Real-time location & speed' },
  { icon: Activity, title: 'Motion Detection', colorVar: 'var(--color-orange)', desc: 'MPU6050 accelerometer' },
  { icon: Shield, title: 'Accident Alert', colorVar: 'var(--color-red)', desc: 'Impact severity analysis' },
  { icon: Wifi, title: 'Live Dashboard', colorVar: 'var(--color-blue)', desc: 'WebSocket data stream' },
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden px-6 py-12"
      style={{ background: 'var(--bg-primary)' }}
    >
      {/* Animated background orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full blur-3xl opacity-20 landing-orb-1" style={{ background: 'var(--accent-glow)' }} />
      <div className="absolute bottom-1/4 left-1/3 w-[400px] h-[400px] rounded-full blur-3xl opacity-10 landing-orb-2" style={{ background: 'var(--color-emerald)' }} />

      {/* Hero section */}
      <div className="relative z-10 text-center max-w-3xl w-full animate-fade-in-up flex flex-col items-center">
        {/* Animated icon */}
        <div className="inline-flex p-5 rounded-2xl border border-[var(--border-color)] mb-10 landing-icon-float" style={{ background: 'var(--status-blue-bg)' }}>
          <Radio size={40} style={{ color: 'var(--color-blue)' }} />
        </div>

        {/* Gradient title */}
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold mb-6 leading-tight tracking-tight landing-gradient-text">
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
            className="group inline-flex items-center gap-3 px-12 py-5 text-white rounded-2xl text-lg font-semibold transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/25 active:scale-[0.97] landing-cta-glow"
            style={{ background: 'linear-gradient(135deg, var(--accent), #6366f1)' }}
          >
            <Zap size={20} className="group-hover:rotate-12 transition-transform duration-300" />
            Enter Dashboard
            <ArrowRight size={20} className="group-hover:translate-x-1.5 transition-transform duration-300" />
          </button>
          <button
            onClick={() => navigate('/docs')}
            className="inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl text-base font-medium border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent)] hover:bg-[var(--bg-secondary)] active:scale-[0.97] transition-all duration-300 hover:shadow-lg"
          >
            <FileText size={18} />
            Documentation
          </button>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 animate-fade-in-up w-full max-w-2xl" style={{ animationDelay: '0.3s' }}>
          {features.map((feat, i) => (
            <div
              key={feat.title}
              className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-[var(--border-color)] status-card-hover landing-feature-card"
              style={{ background: 'var(--glass-bg)', animationDelay: `${0.4 + i * 0.08}s` }}
            >
              <div className="p-2.5 rounded-xl" style={{ background: `color-mix(in srgb, ${feat.colorVar} 15%, transparent)` }}>
                <feat.icon size={20} style={{ color: feat.colorVar }} />
              </div>
              <span className="text-xs font-bold text-[var(--text-primary)]">{feat.title}</span>
              <span className="text-[10px] text-[var(--text-muted)] text-center leading-snug">{feat.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom tag */}
      <div className="absolute bottom-6 text-xs text-[var(--text-muted)] animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
        Multidisciplinary Project — Review IV
      </div>
    </div>
  );
}
