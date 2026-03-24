/**
 * Breadboard-style SVG circuit schematic for the Smart Safety Helmet.
 * Shows Arduino Uno + half-size breadboard with realistic wiring.
 * Buzzer: 3-pin (S -> D8, + -> 5V rail, - -> GND rail)
 */

// Colors constant - defined outside component
const COLORS = {
  bg: '#050a12',
  gridDot: '#0e1a2e',
  // Board colors
  ardFill: '#0c2744',
  ardStroke: '#2563eb',
  bbFill: '#f5f0e8',
  bbStroke: '#c8bfa8',
  bbHole: '#d4cbb8',
  bbHoleInner: '#8b8070',
  bbRailRed: '#dc2626',
  bbRailBlue: '#2563eb',
  bbRailStripe: 'rgba(0,0,0,0.08)',
  // Wires
  uart: '#06b6d4',
  i2c: '#f59e0b',
  dig: '#3b82f6',
  pwr: '#ef4444',
  gnd: '#374151',
  grn: '#10b981',
  // Text
  text: '#e8ecf4',
  dim: '#5d6b82',
  muted: '#8b95a8',
  dark: '#1f2937',
};

// Wire helper component - defined outside main component
function Wire({ points, color, width = 3, dashed = false }: {
  points: string; color: string; width?: number; dashed?: boolean;
}) {
  return (
    <polyline
      points={points}
      fill="none"
      stroke={color}
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray={dashed ? '6,4' : undefined}
    />
  );
}

// Breadboard hole component - defined outside main component
function Hole({ x, y, active, color }: { x: number; y: number; active?: boolean; color?: string }) {
  return (
    <>
      <rect 
        x={x - 4} 
        y={y - 4} 
        width={8} 
        height={8} 
        rx={1.5} 
        fill={active ? (color || COLORS.dig) : COLORS.bbHole} 
        stroke={active ? 'rgba(255,255,255,0.3)' : COLORS.bbHoleInner} 
        strokeWidth={active ? 1.2 : 0.5} 
      />
      {active && <circle cx={x} cy={y} r={2} fill="white" opacity={0.6} />}
    </>
  );
}

// Module chip component - defined outside main component
function ModuleChip({ x, y, w, h, label, sub, color }: {
  x: number; y: number; w: number; h: number; label: string; sub: string; color: string;
}) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={6} fill="#1a1a2e" stroke={color} strokeWidth={1.8} />
      <text x={x + w / 2} y={y + h / 2 - 5} textAnchor="middle" fill={COLORS.text} fontSize={10} fontWeight="700">{label}</text>
      <text x={x + w / 2} y={y + h / 2 + 8} textAnchor="middle" fill={COLORS.muted} fontSize={7}>{sub}</text>
    </g>
  );
}

export default function CircuitSchematic() {
  const W = 1040;
  const H = 720;

  // Use the colors constant
  const C = COLORS;

  // Breadboard geometry
  const BB = { x: 380, y: 190, w: 620, h: 420 };
  const COL_START = BB.x + 40;
  const COL_GAP = 18;
  const ROW_GAP = 18;
  const cols = (n: number) => COL_START + n * COL_GAP;
  const RAIL_TOP = BB.y + 22;
  const RAIL_BOT = BB.y + BB.h - 22;
  const ROW_A = BB.y + 75;
  const rowY = (r: number) => ROW_A + r * ROW_GAP;

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[760px]" style={{ maxHeight: '720px' }}>
        {/* Background */}
        <rect width={W} height={H} rx={14} fill={C.bg} />
        <defs>
          <pattern id="bgdots" width={20} height={20} patternUnits="userSpaceOnUse">
            <circle cx={10} cy={10} r={0.5} fill={C.gridDot} />
          </pattern>
        </defs>
        <rect width={W} height={H} rx={14} fill="url(#bgdots)" />

        {/* Title */}
        <text x={W / 2} y={30} textAnchor="middle" fill={C.text} fontSize={14} fontWeight="700" letterSpacing={0.5}>
          Smart Safety Helmet — Breadboard Wiring Diagram
        </text>
        <text x={W / 2} y={48} textAnchor="middle" fill={C.dim} fontSize={10}>
          Arduino Uno R3 + Half-Size Breadboard · Actual Connection Layout
        </text>

        {/* ═══════ ARDUINO UNO (left side) ═══════ */}
        <rect x={30} y={140} width={310} height={470} rx={14} fill={C.ardFill} stroke={C.ardStroke} strokeWidth={2.5} />
        {/* USB port */}
        <rect x={140} y={128} width={60} height={20} rx={4} fill="#162a46" stroke={C.ardStroke} strokeWidth={1.5} />
        <text x={170} y={143} textAnchor="middle" fill={C.dim} fontSize={7}>USB</text>
        {/* Board label */}
        <text x={185} y={200} textAnchor="middle" fill={C.text} fontSize={18} fontWeight="800">Arduino</text>
        <text x={185} y={222} textAnchor="middle" fill={C.text} fontSize={18} fontWeight="800">Uno R3</text>
        <text x={185} y={244} textAnchor="middle" fill={C.muted} fontSize={9}>ATmega328P</text>
        <text x={185} y={258} textAnchor="middle" fill={C.muted} fontSize={9}>16 MHz · 2KB SRAM</text>

        {/* Arduino RIGHT-side pins (facing breadboard) */}
        {[
          { pin: '5V',  y: 300, color: C.pwr },
          { pin: 'GND', y: 330, color: C.gnd },
          { pin: 'D3',  y: 380, color: C.uart },
          { pin: 'D4',  y: 410, color: C.uart },
          { pin: 'D7',  y: 450, color: C.dig },
          { pin: 'D8',  y: 480, color: C.dig },
          { pin: 'A4',  y: 520, color: C.i2c },
          { pin: 'A5',  y: 550, color: C.i2c },
        ].map(p => (
          <g key={p.pin}>
            {/* Pin housing */}
            <rect x={306} y={p.y - 10} width={34} height={20} rx={3} fill="#0a1628" stroke={p.color} strokeWidth={1.2} />
            <text x={323} y={p.y + 4} textAnchor="middle" fill={p.color} fontSize={9} fontWeight="700" fontFamily="monospace">{p.pin}</text>
            {/* Connector dot */}
            <circle cx={348} cy={p.y} r={4} fill={p.color} stroke="rgba(255,255,255,0.2)" strokeWidth={1} />
          </g>
        ))}

        {/* ═══════ BREADBOARD ═══════ */}
        {/* Main body */}
        <rect x={BB.x} y={BB.y} width={BB.w} height={BB.h} rx={10} fill={C.bbFill} stroke={C.bbStroke} strokeWidth={2} />

        {/* Power rails - top */}
        <line x1={BB.x + 20} y1={RAIL_TOP - 6} x2={BB.x + BB.w - 20} y2={RAIL_TOP - 6} stroke={C.bbRailRed} strokeWidth={1.5} />
        <line x1={BB.x + 20} y1={RAIL_TOP + 12} x2={BB.x + BB.w - 20} y2={RAIL_TOP + 12} stroke={C.bbRailBlue} strokeWidth={1.5} />
        <text x={BB.x + 12} y={RAIL_TOP - 2} fill={C.pwr} fontSize={10} fontWeight="700">+</text>
        <text x={BB.x + 12} y={RAIL_TOP + 16} fill={C.dig} fontSize={10} fontWeight="700">−</text>

        {/* Power rails - bottom */}
        <line x1={BB.x + 20} y1={RAIL_BOT - 6} x2={BB.x + BB.w - 20} y2={RAIL_BOT - 6} stroke={C.bbRailRed} strokeWidth={1.5} />
        <line x1={BB.x + 20} y1={RAIL_BOT + 12} x2={BB.x + BB.w - 20} y2={RAIL_BOT + 12} stroke={C.bbRailBlue} strokeWidth={1.5} />
        <text x={BB.x + 12} y={RAIL_BOT - 2} fill={C.pwr} fontSize={10} fontWeight="700">+</text>
        <text x={BB.x + 12} y={RAIL_BOT + 16} fill={C.dig} fontSize={10} fontWeight="700">−</text>

        {/* Rail labels */}
        <text x={BB.x + BB.w - 14} y={RAIL_TOP - 2} fill={C.pwr} fontSize={7} textAnchor="end">5V</text>
        <text x={BB.x + BB.w - 14} y={RAIL_TOP + 16} fill={C.gnd} fontSize={7} textAnchor="end">GND</text>

        {/* Center divider */}
        <rect x={BB.x + 20} y={BB.y + BB.h / 2 - 4} width={BB.w - 40} height={8} rx={4} fill="#e0d8c8" />

        {/* Row labels */}
        {['a', 'b', 'c', 'd', 'e', '', 'f', 'g', 'h', 'i', 'j'].map((label, i) => (
          label && <text key={label} x={BB.x + 28} y={ROW_A + i * ROW_GAP + 4} fill="#9b9080" fontSize={8} fontWeight="600" textAnchor="middle">{label}</text>
        ))}

        {/* Column numbers (every 5th) */}
        {[0, 5, 10, 15, 20, 25, 30].map(n => (
          <text key={n} x={cols(n)} y={ROW_A - 16} fill="#9b9080" fontSize={7} textAnchor="middle">{n + 1}</text>
        ))}

        {/* Background holes (subset for visual) */}
        {Array.from({ length: 30 }, (_, col) => (
          <g key={`holes${col}`}>
            {[0, 1, 2, 3, 4, 6, 7, 8, 9, 10].map(row => (
              <Hole key={`h${col}${row}`} x={cols(col)} y={rowY(row)} />
            ))}
            {/* Rail holes */}
            <Hole x={cols(col)} y={RAIL_TOP} />
            <Hole x={cols(col)} y={RAIL_TOP + 14} />
            <Hole x={cols(col)} y={RAIL_BOT} />
            <Hole x={cols(col)} y={RAIL_BOT + 14} />
          </g>
        ))}

        {/* ═══════ MODULE PLACEMENTS ON BREADBOARD ═══════ */}

        {/* NEO-6M GPS — columns 2-5, rows a-d */}
        <ModuleChip x={cols(1) - 8} y={rowY(0) - 10} w={COL_GAP * 5} h={ROW_GAP * 4} label="🛰️ NEO-6M" sub="GPS Module" color={C.uart} />
        {/* GPS pins in row e (row 4): TX=col2, RX=col3, VCC=col4, GND=col5 */}
        <Hole x={cols(2)} y={rowY(4)} active color={C.uart} />
        <Hole x={cols(3)} y={rowY(4)} active color={C.uart} />
        <Hole x={cols(4)} y={rowY(4)} active color={C.pwr} />
        <Hole x={cols(5)} y={rowY(4)} active color={C.gnd} />
        {/* Pin labels */}
        <text x={cols(2)} y={rowY(4) + 14} textAnchor="middle" fill={C.dark} fontSize={6} fontWeight="700">TX</text>
        <text x={cols(3)} y={rowY(4) + 14} textAnchor="middle" fill={C.dark} fontSize={6} fontWeight="700">RX</text>
        <text x={cols(4)} y={rowY(4) + 14} textAnchor="middle" fill={C.dark} fontSize={6} fontWeight="700">VCC</text>
        <text x={cols(5)} y={rowY(4) + 14} textAnchor="middle" fill={C.dark} fontSize={6} fontWeight="700">GND</text>

        {/* MPU6050 — columns 10-14, rows a-d */}
        <ModuleChip x={cols(9) - 8} y={rowY(0) - 10} w={COL_GAP * 5} h={ROW_GAP * 4} label="📐 MPU6050" sub="I2C 0x68" color={C.i2c} />
        {/* MPU pins in row e: VCC=10, GND=11, SCL=12, SDA=13 */}
        <Hole x={cols(10)} y={rowY(4)} active color={C.pwr} />
        <Hole x={cols(11)} y={rowY(4)} active color={C.gnd} />
        <Hole x={cols(12)} y={rowY(4)} active color={C.i2c} />
        <Hole x={cols(13)} y={rowY(4)} active color={C.i2c} />
        <text x={cols(10)} y={rowY(4) + 14} textAnchor="middle" fill={C.dark} fontSize={6} fontWeight="700">VCC</text>
        <text x={cols(11)} y={rowY(4) + 14} textAnchor="middle" fill={C.dark} fontSize={6} fontWeight="700">GND</text>
        <text x={cols(12)} y={rowY(4) + 14} textAnchor="middle" fill={C.dark} fontSize={6} fontWeight="700">SCL</text>
        <text x={cols(13)} y={rowY(4) + 14} textAnchor="middle" fill={C.dark} fontSize={6} fontWeight="700">SDA</text>

        {/* Buzzer Module — columns 20-23, rows f-i (bottom half) */}
        <ModuleChip x={cols(19) - 8} y={rowY(6) - 10} w={COL_GAP * 5} h={ROW_GAP * 4} label="🔊 Buzzer" sub="3-Pin Active" color={C.dig} />
        {/* Buzzer pins in row e (top side): S=col20, +=col21, -=col22 */}
        <Hole x={cols(20)} y={rowY(4)} active color={C.dig} />
        <Hole x={cols(21)} y={rowY(4)} active color={C.pwr} />
        <Hole x={cols(22)} y={rowY(4)} active color={C.gnd} />
        <text x={cols(20)} y={rowY(4) + 14} textAnchor="middle" fill={C.dark} fontSize={6} fontWeight="700">S</text>
        <text x={cols(21)} y={rowY(4) + 14} textAnchor="middle" fill={C.dark} fontSize={6} fontWeight="700">+</text>
        <text x={cols(22)} y={rowY(4) + 14} textAnchor="middle" fill={C.dark} fontSize={6} fontWeight="700">−</text>

        {/* Cancel Button — columns 27-28, straddling center gap */}
        <ModuleChip x={cols(26) - 8} y={rowY(3) - 4} w={COL_GAP * 3} h={ROW_GAP * 5} label="🛑 BTN" sub="N.O." color={C.grn} />
        {/* Button pins: top=col27 row c, bottom=col27 row h */}
        <Hole x={cols(27)} y={rowY(2)} active color={C.dig} />
        <Hole x={cols(27)} y={rowY(8)} active color={C.gnd} />
        <text x={cols(27) + 16} y={rowY(2) + 4} fill={C.dark} fontSize={6} fontWeight="700">→D7</text>
        <text x={cols(27) + 16} y={rowY(8) + 4} fill={C.dark} fontSize={6} fontWeight="700">→GND</text>

        {/* ═══════ WIRES ═══════ */}

        {/* Arduino 5V → top power rail (red) */}
        <Wire points={`348,300 370,300 370,${RAIL_TOP} ${cols(0)},${RAIL_TOP}`} color={C.pwr} />
        <text x={360} y={296} fill={C.pwr} fontSize={7} fontWeight="700">5V</text>

        {/* Arduino GND → top GND rail (gray) */}
        <Wire points={`348,330 366,330 366,${RAIL_TOP + 14} ${cols(0)},${RAIL_TOP + 14}`} color={C.gnd} />
        <text x={360} y={326} fill={C.gnd} fontSize={7} fontWeight="700">GND</text>

        {/* Arduino D4 → GPS TX (col 2, row e→ jumped to row f via column) */}
        <Wire points={`348,410 ${cols(2)},410 ${cols(2)},${rowY(4)}`} color={C.uart} />
        <text x={cols(2) + 10} y={408} fill={C.uart} fontSize={7} fontWeight="600">D4←TX</text>

        {/* Arduino D3 → GPS RX (col 3) */}
        <Wire points={`348,380 ${cols(3)},380 ${cols(3)},${rowY(4)}`} color={C.uart} dashed />
        <text x={cols(3) + 10} y={376} fill={C.uart} fontSize={7} fontWeight="600">D3→RX</text>

        {/* GPS VCC (col 4) → top + rail */}
        <Wire points={`${cols(4)},${rowY(4)} ${cols(4)},${RAIL_TOP}`} color={C.pwr} width={2} />
        {/* GPS GND (col 5) → top - rail */}
        <Wire points={`${cols(5)},${rowY(4)} ${cols(5)},${RAIL_TOP + 14}`} color={C.gnd} width={2} />

        {/* Arduino A5 → MPU SCL (col 12) */}
        <Wire points={`348,550 ${cols(12)},550 ${cols(12)},${rowY(4)}`} color={C.i2c} />
        <text x={cols(12) + 10} y={548} fill={C.i2c} fontSize={7} fontWeight="600">A5→SCL</text>

        {/* Arduino A4 → MPU SDA (col 13) */}
        <Wire points={`348,520 ${cols(13)},520 ${cols(13)},${rowY(4)}`} color={C.i2c} dashed />
        <text x={cols(13) + 10} y={518} fill={C.i2c} fontSize={7} fontWeight="600">A4→SDA</text>

        {/* MPU VCC (col 10) → top + rail */}
        <Wire points={`${cols(10)},${rowY(4)} ${cols(10)},${RAIL_TOP}`} color={C.pwr} width={2} />
        {/* MPU GND (col 11) → top - rail */}
        <Wire points={`${cols(11)},${rowY(4)} ${cols(11)},${RAIL_TOP + 14}`} color={C.gnd} width={2} />

        {/* Arduino D8 → Buzzer S (col 20) */}
        <Wire points={`348,480 ${cols(20)},480 ${cols(20)},${rowY(4)}`} color={C.dig} />
        <text x={cols(20) + 10} y={478} fill={C.dig} fontSize={7} fontWeight="600">D8→S</text>

        {/* Buzzer + (col 21) → top + rail */}
        <Wire points={`${cols(21)},${rowY(4)} ${cols(21)},${RAIL_TOP}`} color={C.pwr} width={2} />
        {/* Buzzer - (col 22) → top - rail */}
        <Wire points={`${cols(22)},${rowY(4)} ${cols(22)},${RAIL_TOP + 14}`} color={C.gnd} width={2} />

        {/* Arduino D7 → Button Pin1 (col 27, row c) */}
        <Wire points={`348,450 ${cols(27)},450 ${cols(27)},${rowY(2)}`} color={C.dig} dashed />
        <text x={cols(25)} y={448} fill={C.dig} fontSize={7} fontWeight="600">D7→BTN</text>

        {/* Button Pin2 (col 27, row h) → bottom - rail */}
        <Wire points={`${cols(27)},${rowY(8)} ${cols(27)},${RAIL_BOT + 14}`} color={C.gnd} width={2} />

        {/* Connect top and bottom GND rails */}
        <Wire points={`${cols(29)},${RAIL_TOP + 14} ${cols(29)},${RAIL_BOT + 14}`} color={C.gnd} width={2} dashed />
        <text x={cols(29) + 8} y={BB.y + BB.h / 2} fill={C.gnd} fontSize={6} fontWeight="600" transform={`rotate(90, ${cols(29) + 8}, ${BB.y + BB.h / 2})`}>GND BRIDGE</text>

        {/* ═══════ LEGEND ═══════ */}
        <rect x={30} y={H - 70} width={W - 60} height={50} rx={10} fill="#0a1628" stroke={C.dim} strokeWidth={1} />
        <text x={60} y={H - 48} fill={C.muted} fontSize={9} fontWeight="700" letterSpacing={1}>WIRE LEGEND:</text>
        {[
          { label: 'UART (Serial)', color: C.uart, x: 180 },
          { label: 'I2C (SDA/SCL)', color: C.i2c, x: 340 },
          { label: 'Digital I/O', color: C.dig, x: 500 },
          { label: 'Power (5V)', color: C.pwr, x: 640 },
          { label: 'Ground', color: C.gnd, x: 770 },
          { label: '= return', color: C.uart, x: 880, dashed: true },
        ].map(l => (
          <g key={l.label}>
            <line x1={l.x} y1={H - 48} x2={l.x + 28} y2={H - 48} stroke={l.color} strokeWidth={3} strokeLinecap="round" strokeDasharray={'dashed' in l ? '6,3' : undefined} />
            <text x={l.x + 34} y={H - 44} fill={l.color} fontSize={8} fontFamily="monospace">{l.label}</text>
          </g>
        ))}
        <text x={W / 2} y={H - 28} textAnchor="middle" fill={C.dim} fontSize={8}>
          Breadboard + rail = 5V power; − rail = GND  •  Dashed wires = return/secondary lines  •  All components share common ground
        </text>
      </svg>
    </div>
  );
}
