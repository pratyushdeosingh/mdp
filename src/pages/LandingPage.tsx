import { useNavigate } from 'react-router-dom';
import { Radio, ArrowRight, Cpu, MapPin, Activity, Shield } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{ background: 'var(--bg-primary)' }}
    >
      {/* Background gradient orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-3xl" />

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(var(--text-muted) 1px, transparent 1px), linear-gradient(90deg, var(--text-muted) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      <div className="relative z-10 text-center max-w-3xl px-6 animate-fade-in-up">
        {/* Icon cluster */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20">
            <Cpu size={28} className="text-blue-400" />
          </div>
          <div className="p-4 rounded-2xl bg-blue-500/15 border border-blue-500/25 scale-110">
            <Radio size={36} className="text-blue-400" />
          </div>
          <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20">
            <MapPin size={28} className="text-blue-400" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-4xl md:text-6xl font-extrabold text-[var(--text-primary)] mb-4 leading-tight">
          GPS & Motion
          <br />
          <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
            Tracking System
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-lg md:text-xl text-[var(--text-secondary)] mb-3 max-w-xl mx-auto">
          Basic Multidisciplinary Project — Review III
        </p>
        <p className="text-sm text-[var(--text-muted)] mb-8 max-w-lg mx-auto">
          Real-time IoT dashboard integrating GPS (NEO-6M), accelerometer (MPU6050),
          and accident detection with Arduino Uno for vehicle tracking, motion sensing, and safety alerting.
        </p>

        {/* Execution badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/25 mb-10">
          <span className="w-2 h-2 rounded-full bg-emerald-400 pulse-live" />
          <span className="text-sm font-semibold text-emerald-400">100% Execution Achieved</span>
        </div>

        {/* Enter button */}
        <div>
          <button
            onClick={() => navigate('/dashboard')}
            className="group inline-flex items-center gap-3 px-8 py-4 bg-blue-500 hover:bg-blue-600 text-white rounded-2xl text-lg font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/25 hover:scale-105 active:scale-[0.98]"
          >
            Enter Dashboard
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-12">
          {[
            { icon: MapPin, label: 'GPS Tracking' },
            { icon: Activity, label: 'Motion Detection' },
            { icon: Shield, label: 'Accident Detection' },
            { icon: Cpu, label: 'Embedded IoT' },
          ].map(feat => (
            <div
              key={feat.label}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--border-color)] text-xs text-[var(--text-muted)]"
            >
              <feat.icon size={12} />
              {feat.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
