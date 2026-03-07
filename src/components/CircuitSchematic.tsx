/**
 * Textbook-style SVG circuit schematic for the Smart Safety Helmet.
 * Shows Arduino Uno with all connected modules and labeled wires.
 */
export default function CircuitSchematic() {
  const w = 900;
  const h = 560;

  // Arduino board position (center)
  const ard = { x: 320, y: 180, w: 260, h: 200 };

  // Module positions
  const gps  = { x: 30,  y: 60,  w: 180, h: 100 };
  const mpu  = { x: 30,  y: 350, w: 180, h: 100 };
  const buz  = { x: 690, y: 80,  w: 160, h: 90 };
  const btn  = { x: 690, y: 300, w: 160, h: 90 };

  // Colors
  const c = {
    uart: '#06b6d4',   // cyan
    i2c: '#f59e0b',    // amber/orange
    digital: '#3b82f6', // blue
    power: '#ef4444',   // red
    gnd: '#6b7280',     // gray
    board: '#1e3a5f',
    boardStroke: '#3b82f6',
    moduleBg: '#0f1e36',
    moduleStroke: '#2a4a6e',
    text: '#e8ecf4',
    textMuted: '#8b95a8',
    pinBg: '#162a46',
  };

  // Rounded rect helper
  const Rect = ({ x, y, w, h: rh, fill, stroke, rx = 8 }: {
    x: number; y: number; w: number; h: number; fill: string; stroke: string; rx?: number;
  }) => (
    <rect x={x} y={y} width={w} height={rh} rx={rx} fill={fill} stroke={stroke} strokeWidth={2} />
  );

  // Pin label on the Arduino board edge
  const Pin = ({ x, y, label, side }: { x: number; y: number; label: string; side: 'left' | 'right' }) => (
    <g>
      <rect
        x={side === 'left' ? x - 40 : x + 4}
        y={y - 8}
        width={36}
        height={16}
        rx={4}
        fill={c.pinBg}
        stroke={c.moduleStroke}
        strokeWidth={1}
      />
      <text
        x={side === 'left' ? x - 22 : x + 22}
        y={y + 4}
        textAnchor="middle"
        fill={c.text}
        fontSize={9}
        fontFamily="monospace"
        fontWeight="bold"
      >
        {label}
      </text>
      <circle cx={x} cy={y} r={3} fill={c.text} />
    </g>
  );

  // Wire with path
  const Wire = ({ d, color, dashed = false }: { d: string; color: string; dashed?: boolean }) => (
    <path
      d={d}
      fill="none"
      stroke={color}
      strokeWidth={2.5}
      strokeDasharray={dashed ? '6,4' : undefined}
      strokeLinecap="round"
    />
  );

  // Module box
  const Module = ({ x, y, w: mw, h: mh, title, sub, borderColor, pins }: {
    x: number; y: number; w: number; h: number;
    title: string; sub: string; borderColor: string;
    pins: { label: string; side: 'left' | 'right' | 'top' | 'bottom'; offset: number }[];
  }) => (
    <g>
      <Rect x={x} y={y} w={mw} h={mh} fill={c.moduleBg} stroke={borderColor} rx={10} />
      <text x={x + mw / 2} y={y + mh / 2 - 6} textAnchor="middle" fill={c.text} fontSize={13} fontWeight="bold">
        {title}
      </text>
      <text x={x + mw / 2} y={y + mh / 2 + 12} textAnchor="middle" fill={c.textMuted} fontSize={9}>
        {sub}
      </text>
      {pins.map(p => {
        const px = p.side === 'left' ? x : p.side === 'right' ? x + mw : x + p.offset;
        const py = p.side === 'top' ? y : p.side === 'bottom' ? y + mh : y + p.offset;
        return (
          <g key={p.label}>
            <circle cx={px} cy={py} r={4} fill={borderColor} stroke={c.moduleBg} strokeWidth={1.5} />
            <text
              x={p.side === 'left' ? px + 8 : p.side === 'right' ? px - 8 : px}
              y={p.side === 'top' ? py + 14 : p.side === 'bottom' ? py - 6 : py + 3}
              textAnchor={p.side === 'left' ? 'start' : p.side === 'right' ? 'end' : 'middle'}
              fill={c.textMuted}
              fontSize={8}
              fontFamily="monospace"
            >
              {p.label}
            </text>
          </g>
        );
      })}
    </g>
  );

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="w-full min-w-[700px]"
        style={{ maxHeight: '600px' }}
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Background */}
        <rect x={0} y={0} width={w} height={h} fill="#060b14" rx={16} />

        {/* Grid dots for textbook feel */}
        <defs>
          <pattern id="grid" width={20} height={20} patternUnits="userSpaceOnUse">
            <circle cx={10} cy={10} r={0.5} fill="#1a2744" />
          </pattern>
        </defs>
        <rect x={0} y={0} width={w} height={h} fill="url(#grid)" rx={16} />

        {/* ---- WIRES (drawn under components) ---- */}

        {/* GPS TX → D4 (UART cyan) */}
        <Wire d={`M ${gps.x + gps.w} ${gps.y + 35} H 280 Q 300 ${gps.y + 35} 300 ${ard.y + 50} H ${ard.x}`} color={c.uart} />

        {/* D3 → GPS RX (UART cyan) */}
        <Wire d={`M ${ard.x} ${ard.y + 80} H 280 Q 260 ${ard.y + 80} 260 ${gps.y + 65} H ${gps.x + gps.w}`} color={c.uart} dashed />

        {/* MPU SDA → A4 (I2C orange) */}
        <Wire d={`M ${mpu.x + mpu.w} ${mpu.y + 35} H 280 Q 300 ${mpu.y + 35} 300 ${ard.y + 130} H ${ard.x}`} color={c.i2c} />

        {/* MPU SCL → A5 (I2C orange dashed) */}
        <Wire d={`M ${mpu.x + mpu.w} ${mpu.y + 65} H 260 Q 280 ${mpu.y + 65} 280 ${ard.y + 160} H ${ard.x}`} color={c.i2c} dashed />

        {/* D8 → Buzzer (Digital blue) */}
        <Wire d={`M ${ard.x + ard.w} ${ard.y + 50} H 620 Q 650 ${ard.y + 50} 650 ${buz.y + 45} H ${buz.x}`} color={c.digital} />

        {/* D7 → Button (Digital blue dashed) */}
        <Wire d={`M ${ard.x + ard.w} ${ard.y + 80} H 640 Q 660 ${ard.y + 80} 660 ${btn.y + 45} H ${btn.x}`} color={c.digital} dashed />

        {/* 5V → GPS (red power) */}
        <Wire d={`M ${ard.x + 60} ${ard.y} V ${gps.y + gps.h} H ${gps.x + gps.w - 20}`} color={c.power} />
        {/* Small arrow indicator */}
        <polygon points={`${gps.x + gps.w - 20},${gps.y + gps.h - 5} ${gps.x + gps.w - 20},${gps.y + gps.h + 5} ${gps.x + gps.w - 10},${gps.y + gps.h}`} fill={c.power} />

        {/* 5V → MPU (red power) */}
        <Wire d={`M ${ard.x + 60} ${ard.y + ard.h} V ${mpu.y} H ${mpu.x + mpu.w - 20}`} color={c.power} />
        <polygon points={`${mpu.x + mpu.w - 20},${mpu.y - 5} ${mpu.x + mpu.w - 20},${mpu.y + 5} ${mpu.x + mpu.w - 10},${mpu.y}`} fill={c.power} />

        {/* GND bus (gray) - horizontal line across bottom */}
        <Wire d={`M 50 ${h - 35} H ${w - 50}`} color={c.gnd} />
        <text x={w / 2} y={h - 18} textAnchor="middle" fill={c.gnd} fontSize={10} fontFamily="monospace">
          ──── GND Bus (Common Ground) ────
        </text>

        {/* GND drops from each module */}
        <Wire d={`M ${gps.x + gps.w / 2} ${gps.y + gps.h} V ${h - 35}`} color={c.gnd} dashed />
        <Wire d={`M ${mpu.x + mpu.w / 2} ${mpu.y + mpu.h} V ${h - 35}`} color={c.gnd} dashed />
        <Wire d={`M ${ard.x + ard.w / 2} ${ard.y + ard.h} V ${h - 35}`} color={c.gnd} dashed />
        <Wire d={`M ${buz.x + buz.w / 2} ${buz.y + buz.h} V ${h - 35}`} color={c.gnd} dashed />
        <Wire d={`M ${btn.x + btn.w / 2} ${btn.y + btn.h} V ${h - 35}`} color={c.gnd} dashed />

        {/* ---- COMPONENTS ---- */}

        {/* Arduino Uno */}
        <Rect x={ard.x} y={ard.y} w={ard.w} h={ard.h} fill={c.board} stroke={c.boardStroke} rx={12} />
        {/* USB connector shape */}
        <rect x={ard.x + ard.w - 10} y={ard.y + ard.h / 2 - 20} width={20} height={40} rx={4} fill="#2a4a6e" stroke={c.boardStroke} strokeWidth={1.5} />
        <text x={ard.x + ard.w / 2} y={ard.y + ard.h / 2 - 16} textAnchor="middle" fill={c.text} fontSize={15} fontWeight="bold">
          ⚡ Arduino Uno R3
        </text>
        <text x={ard.x + ard.w / 2} y={ard.y + ard.h / 2 + 4} textAnchor="middle" fill={c.textMuted} fontSize={9}>
          ATmega328P · 16 MHz · 2KB SRAM
        </text>
        <text x={ard.x + ard.w + 5} y={ard.y + ard.h / 2 + 4} fill={c.textMuted} fontSize={8}>USB</text>

        {/* Arduino pins — left side */}
        <Pin x={ard.x} y={ard.y + 50} label="D4" side="left" />
        <Pin x={ard.x} y={ard.y + 80} label="D3" side="left" />
        <Pin x={ard.x} y={ard.y + 130} label="A4" side="left" />
        <Pin x={ard.x} y={ard.y + 160} label="A5" side="left" />

        {/* Arduino pins — right side */}
        <Pin x={ard.x + ard.w} y={ard.y + 50} label="D8" side="right" />
        <Pin x={ard.x + ard.w} y={ard.y + 80} label="D7" side="right" />

        {/* Arduino pins — top & bottom (power) */}
        <g>
          <circle cx={ard.x + 60} cy={ard.y} r={3} fill={c.power} />
          <text x={ard.x + 60} y={ard.y + 14} textAnchor="middle" fill={c.power} fontSize={8} fontFamily="monospace">5V</text>
        </g>
        <g>
          <circle cx={ard.x + ard.w / 2} cy={ard.y + ard.h} r={3} fill={c.gnd} />
          <text x={ard.x + ard.w / 2} y={ard.y + ard.h - 8} textAnchor="middle" fill={c.gnd} fontSize={8} fontFamily="monospace">GND</text>
        </g>

        {/* GPS Module */}
        <Module
          x={gps.x} y={gps.y} w={gps.w} h={gps.h}
          title="🛰️ NEO-6M GPS"
          sub="UART · 9600 baud"
          borderColor={c.uart}
          pins={[
            { label: 'TX', side: 'right', offset: 35 },
            { label: 'RX', side: 'right', offset: 65 },
          ]}
        />

        {/* MPU6050 */}
        <Module
          x={mpu.x} y={mpu.y} w={mpu.w} h={mpu.h}
          title="📐 MPU6050"
          sub="I2C · Addr 0x68"
          borderColor={c.i2c}
          pins={[
            { label: 'SDA', side: 'right', offset: 35 },
            { label: 'SCL', side: 'right', offset: 65 },
          ]}
        />

        {/* Buzzer */}
        <Module
          x={buz.x} y={buz.y} w={buz.w} h={buz.h}
          title="🔊 Buzzer"
          sub="Active · 500ms beep"
          borderColor={c.digital}
          pins={[
            { label: '(+)', side: 'left', offset: 45 },
          ]}
        />

        {/* Cancel Button */}
        <Module
          x={btn.x} y={btn.y} w={btn.w} h={btn.h}
          title="🛑 Cancel Btn"
          sub="N.O. · INPUT_PULLUP"
          borderColor="#10b981"
          pins={[
            { label: 'Pin1', side: 'left', offset: 45 },
          ]}
        />

        {/* Wire labels */}
        <text x={290} y={gps.y + 28} fill={c.uart} fontSize={8} fontFamily="monospace" fontWeight="bold">
          TX→RX (9600)
        </text>
        <text x={240} y={ard.y + 73} fill={c.uart} fontSize={8} fontFamily="monospace" fontWeight="bold">
          TX←RX (9600)
        </text>
        <text x={285} y={mpu.y + 28} fill={c.i2c} fontSize={8} fontFamily="monospace" fontWeight="bold">
          SDA (I2C)
        </text>
        <text x={255} y={mpu.y + 58} fill={c.i2c} fontSize={8} fontFamily="monospace" fontWeight="bold">
          SCL (I2C)
        </text>
        <text x={625} y={ard.y + 43} fill={c.digital} fontSize={8} fontFamily="monospace" fontWeight="bold">
          D8 → Buzz
        </text>
        <text x={625} y={ard.y + 73} fill={c.digital} fontSize={8} fontFamily="monospace" fontWeight="bold">
          D7 ← Btn
        </text>

        {/* Title */}
        <text x={w / 2} y={22} textAnchor="middle" fill={c.text} fontSize={14} fontWeight="bold">
          Smart Safety Helmet — Circuit Wiring Schematic
        </text>

        {/* Legend */}
        <g transform={`translate(${w - 180}, ${h - 100})`}>
          <rect x={0} y={0} width={160} height={72} rx={8} fill="#0a1628" stroke={c.moduleStroke} strokeWidth={1} />
          <text x={80} y={14} textAnchor="middle" fill={c.textMuted} fontSize={8} fontWeight="bold">WIRE LEGEND</text>
          {[
            { label: 'UART', color: c.uart, y: 28 },
            { label: 'I2C', color: c.i2c, y: 40 },
            { label: 'Digital', color: c.digital, y: 52 },
            { label: 'Power (5V)', color: c.power, y: 64 },
          ].map(l => (
            <g key={l.label}>
              <line x1={12} y1={l.y} x2={40} y2={l.y} stroke={l.color} strokeWidth={2.5} strokeLinecap="round" />
              <text x={48} y={l.y + 3} fill={l.color} fontSize={8} fontFamily="monospace">{l.label}</text>
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}
