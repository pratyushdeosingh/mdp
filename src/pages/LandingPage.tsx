import { useNavigate } from 'react-router-dom';
import { Radio, ArrowRight, Cpu, MapPin, Activity, Shield, Zap, BarChart3, Wifi } from 'lucide-react';

const features = [
  {
    icon: MapPin,
    title: 'GPS Tracking',
    desc: 'Real-time NEO-6M GPS module with live map visualization and coordinate logging.',
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10 border-cyan-500/20',
  },
  {
    icon: Activity,
    title: 'Motion Detection',
    desc: 'MPU6050 accelerometer monitors 3-axis motion at 100Hz with g-force analysis.',
    color: 'text-orange-400',
    bg: 'bg-orange-500/10 border-orange-500/20',
  },
  {
    icon: Shield,
    title: 'Accident Detection',
    desc: 'Intelligent threshold-based algorithm detects impacts and triggers emergency alerts.',
    color: 'text-red-400',
    bg: 'bg-red-500/10 border-red-500/20',
  },
  {
    icon: Wifi,
    title: 'Live Dashboard',
    desc: 'WebSocket bridge streams data in real-time from Arduino to React dashboard.',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10 border-blue-500/20',
  },
];

const stats = [
  { value: '6', label: 'Sensors', suffix: '' },
  { value: '100', label: 'Sample Rate', suffix: 'Hz' },
  { value: '<2', label: 'Alert Latency', suffix: 's' },
  { value: '3', label: 'Axis Accel', suffix: '-axis' },
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div
      className="min-h-screen flex flex-col items-center relative overflow-hidden"
      style={{ background: 'var(--bg-primary)' }}
    >
      {/* Animated background orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-3xl" />

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(var(--text-muted) 1px, transparent 1px), linear-gradient(90deg, var(--text-muted) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Hero Section */}
      <section className="relative z-10 text-center max-w-4xl px-6 pt-20 md:pt-32 pb-16 animate-fade-in-up">
        {/* Icon cluster */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 hover:scale-110 transition-transform">
            <Cpu size={28} className="text-blue-400" />
          </div>
          <div className="p-4 rounded-2xl bg-blue-500/15 border border-blue-500/25 scale-110 hover:scale-125 transition-transform">
            <Radio size={36} className="text-blue-400" />
          </div>
          <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 hover:scale-110 transition-transform">
            <MapPin size={28} className="text-blue-400" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-[var(--text-primary)] mb-4 leading-tight">
          Smart Safety
          <br />
          <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
            Helmet
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-lg md:text-xl text-[var(--text-secondary)] mb-3 max-w-xl mx-auto">
          Multidisciplinary Project (MDP) — Review III
        </p>
        <p className="text-sm text-[var(--text-muted)] mb-8 max-w-lg mx-auto leading-relaxed">
          IoT-based accident detection and emergency alert system integrating GPS, accelerometer,
          and Arduino — designed to improve rider safety and reduce emergency response time.
        </p>

        {/* Status badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/25 mb-10">
          <span className="w-2 h-2 rounded-full bg-emerald-400 pulse-live" />
          <span className="text-sm font-semibold text-emerald-400">100% Execution Achieved</span>
        </div>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="group inline-flex items-center gap-3 px-8 py-4 bg-blue-500 hover:bg-blue-600 text-white rounded-2xl text-lg font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/25 hover:scale-105 active:scale-[0.98]"
          >
            Enter Dashboard
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </button>
          <button
            onClick={() => navigate('/docs')}
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl text-base font-medium border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent)] hover:bg-[var(--bg-secondary)] transition-all duration-300"
          >
            <BarChart3 size={18} />
            View Documentation
          </button>
        </div>
      </section>

      {/* Stats row */}
      <section className="relative z-10 w-full max-w-3xl px-6 pb-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              className="glass-card p-4 text-center stagger-children"
              style={{ animationDelay: `${0.1 + i * 0.1}s` }}
            >
              <div className="text-2xl md:text-3xl font-bold text-[var(--text-primary)]">
                {stat.value}<span className="text-sm text-[var(--accent)] ml-0.5">{stat.suffix}</span>
              </div>
              <div className="text-xs text-[var(--text-muted)] mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features grid */}
      <section className="relative z-10 w-full max-w-4xl px-6 pb-20">
        <h2 className="text-xl md:text-2xl font-bold text-[var(--text-primary)] text-center mb-8">
          Core Capabilities
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {features.map((feat, i) => (
            <div
              key={feat.title}
              className="glass-card p-5 flex items-start gap-4 group hover:scale-[1.02] transition-transform duration-300"
              style={{ animationDelay: `${0.2 + i * 0.1}s` }}
            >
              <div className={`p-3 rounded-xl border ${feat.bg} shrink-0 group-hover:scale-110 transition-transform`}>
                <feat.icon size={22} className={feat.color} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">{feat.title}</h3>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">{feat.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Tech stack pills */}
      <section className="relative z-10 pb-16">
        <div className="flex flex-wrap items-center justify-center gap-3">
          {[
            { icon: Cpu, label: 'Arduino Uno' },
            { icon: MapPin, label: 'NEO-6M GPS' },
            { icon: Activity, label: 'MPU6050' },
            { icon: Zap, label: 'Piezo Buzzer' },
            { icon: Wifi, label: 'WebSocket' },
            { icon: BarChart3, label: 'React + TS' },
          ].map(tech => (
            <div
              key={tech.label}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--border-color)] text-xs text-[var(--text-muted)] hover:border-[var(--accent)] hover:text-[var(--text-secondary)] transition-all"
            >
              <tech.icon size={12} />
              {tech.label}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
