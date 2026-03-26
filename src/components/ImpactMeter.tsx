import { useRef, useEffect, useState } from 'react';

// Gauge configuration constants
const GAUGE = {
  CENTER_X: 150,
  CENTER_Y: 155,
  RADIUS: 115,
  ARC_WIDTH: 16,
  START_ANGLE: 180,
  END_ANGLE: 360,
  SWEEP_ANGLE: 180,
  TICKS: [0, 20, 40, 60, 80, 100],
} as const;

// Zone color mappings
const ZONE_COLORS = {
  SAFE: 'var(--color-emerald, #10b981)',
  ELEVATED: 'var(--color-amber, #f59e0b)',
  WARNING: 'var(--color-orange, #f97316)',
  CRITICAL: 'var(--color-red, #ef4444)',
  SEVERE: '#b91c1c',
} as const;

// Zone boundaries: 0-20% Safe, 20-40% Elevated, 40-60% Warning, 60-80% Critical, 80-100% Severe
const ZONES = [
  { from: 0, to: 20, color: ZONE_COLORS.SAFE, label: 'Safe' },
  { from: 20, to: 40, color: ZONE_COLORS.ELEVATED, label: 'Elevated' },
  { from: 40, to: 60, color: ZONE_COLORS.WARNING, label: 'Warning' },
  { from: 60, to: 80, color: ZONE_COLORS.CRITICAL, label: 'Critical' },
  { from: 80, to: 100, color: ZONE_COLORS.SEVERE, label: 'Severe' },
] as const;

interface ImpactMeterProps {
  value: number;
  rawAcceleration: number;
  maxValue?: number;
  zone: 'normal' | 'caution' | 'danger';
}

export default function ImpactMeter({ value, rawAcceleration, maxValue = 100, zone }: ImpactMeterProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const animRef = useRef<number>(0);
  const currentRef = useRef(value);

  useEffect(() => {
    const target = Math.min(Math.max(value, 0), maxValue);
    const animate = () => {
      const diff = target - currentRef.current;
      if (Math.abs(diff) < 0.05) {
        currentRef.current = target;
        setDisplayValue(target);
        return;
      }
      currentRef.current += diff * 0.12;
      setDisplayValue(currentRef.current);
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [value, maxValue]);

  const { CENTER_X: cx, CENTER_Y: cy, RADIUS: radius, ARC_WIDTH: arcWidth, START_ANGLE: startAngle, END_ANGLE: endAngle, SWEEP_ANGLE: sweepAngle } = GAUGE;

  const valueToAngle = (v: number) => {
    const clamped = Math.min(Math.max(v, 0), maxValue);
    return startAngle + (clamped / maxValue) * sweepAngle;
  };

  const degToRad = (deg: number) => (deg * Math.PI) / 180;

  const polarToCartesian = (angle: number, r: number) => ({
    x: cx + r * Math.cos(degToRad(angle)),
    y: cy + r * Math.sin(degToRad(angle)),
  });

  const describeArc = (startA: number, endA: number, r: number) => {
    const start = polarToCartesian(startA, r);
    const end = polarToCartesian(endA, r);
    const largeArcFlag = endA - startA > 180 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
  };

  const needleAngle = valueToAngle(displayValue);

  const getZoneColor = (v: number) => {
    if (v >= 80) return ZONE_COLORS.SEVERE;
    if (v >= 60) return ZONE_COLORS.CRITICAL;
    if (v >= 40) return ZONE_COLORS.WARNING;
    if (v >= 20) return ZONE_COLORS.ELEVATED;
    return ZONE_COLORS.SAFE;
  };

  const zoneColor = getZoneColor(displayValue);

  return (
    <div className={`relative flex flex-col items-center ${zone === 'danger' ? 'impact-meter-alert' : ''}`}>
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 300 190"
        className="overflow-visible max-w-[300px]"
        role="img"
        aria-label={`Impact severity gauge showing ${Math.round(displayValue)}% severity at ${rawAcceleration.toFixed(1)} meters per second squared`}
      >
        <defs>
          <linearGradient id="impactNeedleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#fff" stopOpacity="0.95" />
            <stop offset="100%" stopColor={zoneColor} stopOpacity="0.9" />
          </linearGradient>
          <filter id="impactGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="impactArcGlow" x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background track */}
        <path
          d={describeArc(startAngle, endAngle, radius)}
          fill="none"
          stroke="var(--border-color)"
          strokeWidth={arcWidth}
          strokeLinecap="round"
          opacity="0.3"
        />

        {/* Color zone arcs */}
        {ZONES.map((z, i) => (
          <path
            key={i}
            d={describeArc(valueToAngle(z.from), valueToAngle(z.to), radius)}
            fill="none"
            stroke={z.color}
            strokeWidth={arcWidth}
            strokeLinecap="round"
            opacity={0.65}
            filter="url(#impactArcGlow)"
          />
        ))}

        {/* Active value arc overlay */}
        {displayValue > 0.5 && (
          <path
            d={describeArc(startAngle, valueToAngle(Math.min(displayValue, maxValue)), radius)}
            fill="none"
            stroke={zoneColor}
            strokeWidth={arcWidth + 3}
            strokeLinecap="round"
            opacity={0.4}
            filter="url(#impactArcGlow)"
          />
        )}

        {/* Tick marks and labels */}
        {GAUGE.TICKS.map(val => {
          const angle = valueToAngle(val);
          const innerR = radius - arcWidth / 2 - 12;
          const outerR = radius - arcWidth / 2 - 2;
          const p1 = polarToCartesian(angle, innerR);
          const p2 = polarToCartesian(angle, outerR);
          const labelR = radius - arcWidth / 2 - 24;
          const labelPos = polarToCartesian(angle, labelR);

          return (
            <g key={val}>
              <line
                x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
                stroke="var(--text-secondary)"
                strokeWidth={2}
                opacity={0.8}
              />
              <text
                x={labelPos.x} y={labelPos.y}
                textAnchor="middle"
                dominantBaseline="central"
                fill="var(--text-muted)"
                fontSize={10}
                fontWeight={600}
                fontFamily="Inter, sans-serif"
              >
                {val}%
              </text>
            </g>
          );
        })}

        {/* Needle */}
        <g
          transform={`rotate(${needleAngle}, ${cx}, ${cy})`}
          filter="url(#impactGlow)"
          className={zone === 'danger' ? 'gauge-needle-pulse' : ''}
        >
          <polygon
            points={`${cx + radius - 25}, ${cy} ${cx - 12}, ${cy - 4.5} ${cx - 12}, ${cy + 4.5}`}
            fill="url(#impactNeedleGrad)"
          />
          <circle cx={cx} cy={cy} r={10} fill="var(--bg-secondary)" stroke="var(--border-color)" strokeWidth={1} />
          <circle cx={cx} cy={cy} r={6} fill={zoneColor} opacity={0.9} />
          <circle cx={cx} cy={cy} r={2.5} fill="#fff" opacity={0.5} />
        </g>

        {/* Center percentage display */}
        <text
          x={cx} y={cy - 40}
          textAnchor="middle"
          dominantBaseline="central"
          fill={zoneColor}
          fontSize={36}
          fontWeight={800}
          fontFamily="Inter, sans-serif"
        >
          {Math.round(displayValue)}%
        </text>
        <text
          x={cx} y={cy - 18}
          textAnchor="middle"
          dominantBaseline="central"
          fill="var(--text-muted)"
          fontSize={10}
          fontFamily="Inter, sans-serif"
          fontWeight={600}
          letterSpacing="0.05em"
        >
          SEVERITY
        </text>

        {/* Small m/s² reference below center */}
        <text
          x={cx} y={cy - 2}
          textAnchor="middle"
          dominantBaseline="central"
          fill="var(--text-muted)"
          fontSize={10}
          fontFamily="Inter, sans-serif"
          opacity={0.7}
        >
          {rawAcceleration.toFixed(1)} m/s²
        </text>

        {/* Zone labels along the outer edge */}
        {ZONES.map((z, i) => {
          const midVal = (z.from + z.to) / 2;
          const angle = valueToAngle(midVal);
          const labelR = radius + 20;
          const pos = polarToCartesian(angle, labelR);
          return (
            <text
              key={i}
              x={pos.x} y={Math.min(pos.y, cy + 8)}
              textAnchor="middle"
              dominantBaseline="central"
              fill={z.color}
              fontSize={8}
              fontWeight={700}
              fontFamily="Inter, sans-serif"
              letterSpacing="0.05em"
            >
              {z.label.toUpperCase()}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
