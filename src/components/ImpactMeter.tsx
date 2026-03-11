import { useRef, useEffect, useState } from 'react';

interface ImpactMeterProps {
  value: number;
  maxValue?: number;
  zone: 'normal' | 'caution' | 'danger';
}

export default function ImpactMeter({ value, maxValue = 50, zone }: ImpactMeterProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const animRef = useRef<number>(0);
  const currentRef = useRef(value);

  useEffect(() => {
    const target = Math.min(Math.max(value, 0), maxValue);
    const animate = () => {
      const diff = target - currentRef.current;
      if (Math.abs(diff) < 0.01) {
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

  const cx = 150;
  const cy = 155;
  const radius = 115;
  const arcWidth = 16;
  const startAngle = 180;
  const endAngle = 360;
  const sweepAngle = 180;

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

  // Zone boundaries: Green 0-12, Yellow 12-20, Red 20-50
  const zones = [
    { from: 0, to: 12, color: '#10b981', label: 'Normal' },
    { from: 12, to: 20, color: '#f59e0b', label: 'Caution' },
    { from: 20, to: maxValue, color: '#ef4444', label: 'Danger' },
  ];

  const ticks = [0, 10, 20, 30, 40, 50];

  const needleAngle = valueToAngle(displayValue);

  const zoneColor = zone === 'danger' ? '#ef4444' : zone === 'caution' ? '#f59e0b' : '#10b981';

  return (
    <div className={`relative flex flex-col items-center ${zone === 'danger' ? 'impact-meter-alert' : ''}`}>
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 300 185"
        className="overflow-visible max-w-[300px]"
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
        {zones.map((z, i) => (
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
        {ticks.map(val => {
          const angle = valueToAngle(val);
          const innerR = radius - arcWidth / 2 - 12;
          const outerR = radius - arcWidth / 2 - 2;
          const p1 = polarToCartesian(angle, innerR);
          const p2 = polarToCartesian(angle, outerR);
          const labelR = radius - arcWidth / 2 - 22;
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
                fontWeight={500}
                fontFamily="Inter, sans-serif"
              >
                {val}
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

        {/* Center value */}
        <text
          x={cx} y={cy - 35}
          textAnchor="middle"
          dominantBaseline="central"
          fill="var(--text-primary)"
          fontSize={32}
          fontWeight={800}
          fontFamily="Inter, sans-serif"
        >
          {displayValue.toFixed(1)}
        </text>
        <text
          x={cx} y={cy - 14}
          textAnchor="middle"
          dominantBaseline="central"
          fill="var(--text-muted)"
          fontSize={11}
          fontFamily="Inter, sans-serif"
        >
          m/s²
        </text>

        {/* Zone labels at bottom */}
        {zones.map((z, i) => {
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
              fontSize={9}
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
