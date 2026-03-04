import { useRef, useEffect, useState } from 'react';

interface AccelerationGaugeProps {
    value: number;
    maxValue?: number;
    threshold?: number;
    accidentDetected: boolean;
}

export default function AccelerationGauge({
    value,
    maxValue = 30,
    threshold = 25,
    accidentDetected,
}: AccelerationGaugeProps) {
    const [displayValue, setDisplayValue] = useState(value);
    const animRef = useRef<number>(0);
    const currentRef = useRef(value);

    // Smooth needle animation using requestAnimationFrame
    useEffect(() => {
        const target = Math.min(Math.max(value, 0), maxValue);
        const animate = () => {
            const diff = target - currentRef.current;
            if (Math.abs(diff) < 0.01) {
                currentRef.current = target;
                setDisplayValue(target);
                return;
            }
            // Easing — moves 12% of remaining distance each frame
            currentRef.current += diff * 0.12;
            setDisplayValue(currentRef.current);
            animRef.current = requestAnimationFrame(animate);
        };
        animRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animRef.current);
    }, [value, maxValue]);

    // SVG dimensions
    const size = 260;
    const cx = size / 2;
    const cy = size / 2;
    const radius = 105;
    const arcWidth = 12;

    // Gauge sweep: 240° arc, from 150° (bottom-left) to 390° (bottom-right)
    const startAngle = 150;
    const endAngle = 390;
    const sweepAngle = endAngle - startAngle; // 240°

    const valueToAngle = (v: number) => {
        const clamped = Math.min(Math.max(v, 0), maxValue);
        return startAngle + (clamped / maxValue) * sweepAngle;
    };

    const degToRad = (deg: number) => (deg * Math.PI) / 180;

    const polarToCartesian = (angle: number, r: number) => ({
        x: cx + r * Math.cos(degToRad(angle)),
        y: cy + r * Math.sin(degToRad(angle)),
    });

    // Arc path helper
    const describeArc = (startA: number, endA: number, r: number) => {
        const start = polarToCartesian(startA, r);
        const end = polarToCartesian(endA, r);
        const largeArcFlag = endA - startA > 180 ? 1 : 0;
        return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
    };

    // Color zone arcs
    const zones = [
        { from: 0, to: 10, color: '#10b981' },   // Emerald / Safe
        { from: 10, to: 20, color: '#f59e0b' },   // Amber / Warning
        { from: 20, to: 30, color: '#ef4444' },   // Red / Danger
    ];

    // Tick marks
    const majorTicks = [0, 5, 10, 15, 20, 25, 30];
    const allTicks: { value: number; major: boolean }[] = [];
    for (let i = 0; i <= maxValue; i += 1) {
        allTicks.push({ value: i, major: majorTicks.includes(i) });
    }

    const needleAngle = valueToAngle(displayValue);

    // Determine current zone color for center glow
    const getZoneColor = (v: number) => {
        if (v >= 20) return '#ef4444';
        if (v >= 10) return '#f59e0b';
        return '#10b981';
    };

    const zoneColor = getZoneColor(displayValue);

    return (
        <div className={`relative flex flex-col items-center gauge-container ${accidentDetected ? 'gauge-alert' : ''}`}>
            <svg
                width={size}
                height={size * 0.78}
                viewBox={`0 0 ${size} ${size * 0.85}`}
                className="overflow-visible"
            >
                <defs>
                    {/* Needle gradient */}
                    <linearGradient id="needleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#fff" stopOpacity="0.95" />
                        <stop offset="100%" stopColor={zoneColor} stopOpacity="0.9" />
                    </linearGradient>

                    {/* Needle glow */}
                    <filter id="needleGlow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>

                    {/* Outer ring glow for alert */}
                    <filter id="alertGlow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="6" result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>

                    {/* Zone arc glow */}
                    <filter id="arcGlow" x="-10%" y="-10%" width="120%" height="120%">
                        <feGaussianBlur stdDeviation="2" result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* Background arc (track) */}
                <path
                    d={describeArc(startAngle, endAngle, radius)}
                    fill="none"
                    stroke="var(--border-color)"
                    strokeWidth={arcWidth}
                    strokeLinecap="round"
                    opacity="0.4"
                />

                {/* Color zone arcs */}
                {zones.map((zone, i) => (
                    <path
                        key={i}
                        d={describeArc(valueToAngle(zone.from), valueToAngle(zone.to), radius)}
                        fill="none"
                        stroke={zone.color}
                        strokeWidth={arcWidth}
                        strokeLinecap="round"
                        opacity={0.7}
                        filter="url(#arcGlow)"
                    />
                ))}

                {/* Active value arc (brighter overlay from 0 to current value) */}
                {displayValue > 0.5 && (
                    <path
                        d={describeArc(startAngle, valueToAngle(Math.min(displayValue, maxValue)), radius)}
                        fill="none"
                        stroke={zoneColor}
                        strokeWidth={arcWidth + 2}
                        strokeLinecap="round"
                        opacity={0.45}
                        filter="url(#arcGlow)"
                    />
                )}

                {/* Tick marks */}
                {allTicks.map((tick) => {
                    const angle = valueToAngle(tick.value);
                    const innerR = tick.major ? radius - arcWidth / 2 - 14 : radius - arcWidth / 2 - 8;
                    const outerR = radius - arcWidth / 2 - 2;
                    const p1 = polarToCartesian(angle, innerR);
                    const p2 = polarToCartesian(angle, outerR);
                    const isThreshold = tick.value === threshold;

                    return (
                        <line
                            key={tick.value}
                            x1={p1.x}
                            y1={p1.y}
                            x2={p2.x}
                            y2={p2.y}
                            stroke={isThreshold ? '#ef4444' : tick.major ? 'var(--text-secondary)' : 'var(--text-muted)'}
                            strokeWidth={isThreshold ? 2.5 : tick.major ? 2 : 1}
                            opacity={isThreshold ? 1 : tick.major ? 0.9 : 0.4}
                        />
                    );
                })}

                {/* Tick labels (major only) */}
                {majorTicks.map((val) => {
                    const angle = valueToAngle(val);
                    const labelR = radius - arcWidth / 2 - 24;
                    const pos = polarToCartesian(angle, labelR);
                    const isThreshold = val === threshold;

                    return (
                        <text
                            key={val}
                            x={pos.x}
                            y={pos.y}
                            textAnchor="middle"
                            dominantBaseline="central"
                            fill={isThreshold ? '#ef4444' : 'var(--text-muted)'}
                            fontSize={isThreshold ? 12 : 11}
                            fontWeight={isThreshold ? 700 : val % 10 === 0 ? 600 : 400}
                            fontFamily="Inter, sans-serif"
                        >
                            {val}
                        </text>
                    );
                })}

                {/* Threshold marker line (outer) */}
                {(() => {
                    const angle = valueToAngle(threshold);
                    const p1 = polarToCartesian(angle, radius + 4);
                    const p2 = polarToCartesian(angle, radius + 14);
                    return (
                        <line
                            x1={p1.x}
                            y1={p1.y}
                            x2={p2.x}
                            y2={p2.y}
                            stroke="#ef4444"
                            strokeWidth={2.5}
                            strokeLinecap="round"
                            opacity={0.9}
                        />
                    );
                })()}

                {/* Needle */}
                <g
                    transform={`rotate(${needleAngle}, ${cx}, ${cy})`}
                    filter="url(#needleGlow)"
                    className={accidentDetected ? 'gauge-needle-pulse' : ''}
                >
                    {/* Needle body — elongated triangle */}
                    <polygon
                        points={`
              ${cx + radius - 22}, ${cy}
              ${cx - 14}, ${cy - 4}
              ${cx - 14}, ${cy + 4}
            `}
                        fill="url(#needleGrad)"
                    />
                    {/* Needle cap shadow */}
                    <circle cx={cx} cy={cy} r={10} fill="var(--bg-secondary)" stroke="var(--border-color)" strokeWidth={1} />
                    {/* Needle cap */}
                    <circle cx={cx} cy={cy} r={7} fill={zoneColor} opacity={0.9} />
                    <circle cx={cx} cy={cy} r={3} fill="#fff" opacity={0.6} />
                </g>

                {/* Center digital display */}
                <text
                    x={cx}
                    y={cy + 38}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="var(--text-primary)"
                    fontSize={28}
                    fontWeight={800}
                    fontFamily="Inter, sans-serif"
                >
                    {displayValue.toFixed(1)}
                </text>
                <text
                    x={cx}
                    y={cy + 56}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="var(--text-muted)"
                    fontSize={10}
                    fontFamily="Inter, sans-serif"
                >
                    m/s²
                </text>
            </svg>

            {/* Status text below gauge */}
            <div className={`mt-1 flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold ${accidentDetected
                ? 'bg-red-500/15 text-red-400 gauge-status-pulse'
                : 'bg-emerald-500/10 text-emerald-400'
                }`}>
                {accidentDetected ? (
                    <span>⚠ Accident Detected</span>
                ) : (
                    <>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-live" />
                        <span>System Safe</span>
                    </>
                )}
            </div>
        </div>
    );
}
