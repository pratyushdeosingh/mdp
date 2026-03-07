/**
 * Textbook-style SVG circuit schematic for the Smart Safety Helmet.
 * Clean layout: Arduino center, sensors left, outputs right.
 * Buzzer is 3-pin module: S (signal) → D8, (+) → 5V, (−) → GND.
 */
export default function CircuitSchematic() {
  const W = 960;
  const H = 620;

  // Colors
  const C = {
    bg: '#060b14',
    grid: '#111d33',
    board: '#0f2040',
    boardBorder: '#2563eb',
    modBg: '#0b1a30',
    text: '#e8ecf4',
    dim: '#5d6b82',
    muted: '#8b95a8',
    uart: '#22d3ee',
    i2c: '#fbbf24',
    dig: '#60a5fa',
    pwr: '#f87171',
    gnd: '#6b7280',
    grn: '#34d399',
  };

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[700px]" style={{ maxHeight: '640px' }}>
        {/* Background */}
        <rect width={W} height={H} rx={14} fill={C.bg} />
        <defs>
          <pattern id="dots" width={24} height={24} patternUnits="userSpaceOnUse">
            <circle cx={12} cy={12} r={0.6} fill={C.grid} />
          </pattern>
        </defs>
        <rect width={W} height={H} rx={14} fill="url(#dots)" />

        {/* Title */}
        <text x={W / 2} y={28} textAnchor="middle" fill={C.text} fontSize={13} fontWeight="700" letterSpacing={0.5}>
          Smart Safety Helmet — Circuit Wiring Schematic
        </text>

        {/* ═══════════ ARDUINO UNO (center) ═══════════ */}
        <rect x={340} y={170} width={280} height={260} rx={14} fill={C.board} stroke={C.boardBorder} strokeWidth={2.5} />
        {/* USB port stub */}
        <rect x={606} y={270} width={24} height={40} rx={5} fill="#162a46" stroke={C.boardBorder} strokeWidth={1.5} />
        <text x={480} y={262} textAnchor="middle" fill={C.text} fontSize={16} fontWeight="800">Arduino Uno R3</text>
        <text x={480} y={282} textAnchor="middle" fill={C.muted} fontSize={9}>ATmega328P · 16 MHz · 2KB SRAM</text>
        <text x={622} y={294} fill={C.dim} fontSize={7}>USB</text>

        {/* Left pins */}
        {[
          { pin: 'D4', y: 210, color: C.uart },
          { pin: 'D3', y: 245, color: C.uart },
          { pin: 'A4', y: 320, color: C.i2c },
          { pin: 'A5', y: 355, color: C.i2c },
          { pin: '5V', y: 395, color: C.pwr },
          { pin: 'GND', y: 415, color: C.gnd },
        ].map(p => (
          <g key={`L${p.pin}`}>
            <line x1={340} y1={p.y} x2={328} y2={p.y} stroke={p.color} strokeWidth={2} />
            <circle cx={328} cy={p.y} r={4} fill={p.color} />
            <rect x={344} y={p.y - 9} width={38} height={18} rx={4} fill="#0a1628" stroke={C.dim} strokeWidth={0.8} />
            <text x={363} y={p.y + 4} textAnchor="middle" fill={C.text} fontSize={9} fontWeight="700" fontFamily="monospace">{p.pin}</text>
          </g>
        ))}

        {/* Right pins */}
        {[
          { pin: 'D8', y: 220, color: C.dig },
          { pin: 'D7', y: 260, color: C.dig },
        ].map(p => (
          <g key={`R${p.pin}`}>
            <line x1={620} y1={p.y} x2={632} y2={p.y} stroke={p.color} strokeWidth={2} />
            <circle cx={632} cy={p.y} r={4} fill={p.color} />
            <rect x={578} y={p.y - 9} width={38} height={18} rx={4} fill="#0a1628" stroke={C.dim} strokeWidth={0.8} />
            <text x={597} y={p.y + 4} textAnchor="middle" fill={C.text} fontSize={9} fontWeight="700" fontFamily="monospace">{p.pin}</text>
          </g>
        ))}

        {/* ═══════════ MODULES ═══════════ */}

        {/* — NEO-6M GPS (top-left) — */}
        <rect x={40} y={170} width={200} height={100} rx={12} fill={C.modBg} stroke={C.uart} strokeWidth={2} />
        <text x={140} y={206} textAnchor="middle" fill={C.text} fontSize={13} fontWeight="700">🛰️ NEO-6M GPS</text>
        <text x={140} y={222} textAnchor="middle" fill={C.muted} fontSize={9}>UART · 9600 baud · NMEA</text>
        {/* Pin labels inside */}
        {[
          { label: 'TX', y: 243 },
          { label: 'RX', y: 258 },
        ].map(p => (
          <g key={`gps${p.label}`}>
            <rect x={195} y={p.y - 8} width={28} height={16} rx={3} fill="#0a2030" stroke={C.uart} strokeWidth={0.8} />
            <text x={209} y={p.y + 4} textAnchor="middle" fill={C.uart} fontSize={8} fontFamily="monospace" fontWeight="600">{p.label}</text>
            <circle cx={240} cy={p.y} r={3.5} fill={C.uart} />
          </g>
        ))}

        {/* — MPU6050 (bottom-left) — */}
        <rect x={40} y={320} width={200} height={100} rx={12} fill={C.modBg} stroke={C.i2c} strokeWidth={2} />
        <text x={140} y={356} textAnchor="middle" fill={C.text} fontSize={13} fontWeight="700">📐 MPU6050</text>
        <text x={140} y={372} textAnchor="middle" fill={C.muted} fontSize={9}>I2C · Address 0x68 · ±2g</text>
        {[
          { label: 'SDA', y: 393 },
          { label: 'SCL', y: 408 },
        ].map(p => (
          <g key={`mpu${p.label}`}>
            <rect x={191} y={p.y - 8} width={34} height={16} rx={3} fill="#1a1500" stroke={C.i2c} strokeWidth={0.8} />
            <text x={208} y={p.y + 4} textAnchor="middle" fill={C.i2c} fontSize={8} fontFamily="monospace" fontWeight="600">{p.label}</text>
            <circle cx={240} cy={p.y} r={3.5} fill={C.i2c} />
          </g>
        ))}

        {/* — Buzzer (top-right) — 3-pin module */}
        <rect x={720} y={140} width={190} height={130} rx={12} fill={C.modBg} stroke={C.dig} strokeWidth={2} />
        <text x={815} y={172} textAnchor="middle" fill={C.text} fontSize={13} fontWeight="700">🔊 Buzzer Module</text>
        <text x={815} y={188} textAnchor="middle" fill={C.muted} fontSize={9}>Active · 3-Pin · 500ms beep</text>
        {[
          { label: 'S', y: 210, color: C.dig, note: '← D8' },
          { label: '+', y: 235, color: C.pwr, note: '← 5V' },
          { label: '−', y: 258, color: C.gnd, note: '← GND' },
        ].map(p => (
          <g key={`buz${p.label}`}>
            <rect x={734} y={p.y - 9} width={22} height={18} rx={3} fill="#0a1628" stroke={p.color} strokeWidth={0.8} />
            <text x={745} y={p.y + 4} textAnchor="middle" fill={p.color} fontSize={9} fontFamily="monospace" fontWeight="700">{p.label}</text>
            <circle cx={720} cy={p.y} r={3.5} fill={p.color} />
            <text x={764} y={p.y + 3} fill={C.dim} fontSize={7} fontFamily="monospace">{p.note}</text>
          </g>
        ))}

        {/* — Cancel Button (bottom-right) — */}
        <rect x={720} y={320} width={190} height={100} rx={12} fill={C.modBg} stroke={C.grn} strokeWidth={2} />
        <text x={815} y={356} textAnchor="middle" fill={C.text} fontSize={13} fontWeight="700">🛑 Cancel Button</text>
        <text x={815} y={372} textAnchor="middle" fill={C.muted} fontSize={9}>Momentary N.O. · 200ms debounce</text>
        {[
          { label: 'Pin1', y: 393, color: C.dig, note: '← D7' },
          { label: 'Pin2', y: 408, color: C.gnd, note: '← GND' },
        ].map(p => (
          <g key={`btn${p.label}`}>
            <rect x={730} y={p.y - 9} width={34} height={18} rx={3} fill="#0a1628" stroke={p.color} strokeWidth={0.8} />
            <text x={747} y={p.y + 4} textAnchor="middle" fill={p.color} fontSize={8} fontFamily="monospace" fontWeight="600">{p.label}</text>
            <circle cx={720} cy={p.y} r={3.5} fill={p.color} />
            <text x={770} y={p.y + 3} fill={C.dim} fontSize={7} fontFamily="monospace">{p.note}</text>
          </g>
        ))}

        {/* ═══════════ WIRES ═══════════ */}

        {/* GPS TX → D4 (cyan solid) */}
        <path d="M 240 243 H 290 Q 304 243 304 229 V 210 Q 304 210 316 210 H 328" fill="none" stroke={C.uart} strokeWidth={2.5} strokeLinecap="round" />
        {/* GPS RX ← D3 (cyan dashed) */}
        <path d="M 240 258 H 280 Q 294 258 294 250 V 245 Q 294 245 314 245 H 328" fill="none" stroke={C.uart} strokeWidth={2.5} strokeDasharray="6,3" strokeLinecap="round" />

        {/* MPU SDA → A4 (orange solid) */}
        <path d="M 240 393 H 290 Q 308 393 308 374 V 320 Q 308 320 318 320 H 328" fill="none" stroke={C.i2c} strokeWidth={2.5} strokeLinecap="round" />
        {/* MPU SCL → A5 (orange dashed) */}
        <path d="M 240 408 H 278 Q 296 408 296 390 V 355 Q 296 355 314 355 H 328" fill="none" stroke={C.i2c} strokeWidth={2.5} strokeDasharray="6,3" strokeLinecap="round" />

        {/* D8 → Buzzer S (blue solid) */}
        <path d="M 632 220 H 670 Q 690 220 690 215 V 210 Q 690 210 710 210 H 720" fill="none" stroke={C.dig} strokeWidth={2.5} strokeLinecap="round" />
        {/* 5V → Buzzer + (red) */}
        <path d="M 328 395 H 310 Q 300 395 300 470 H 680 Q 700 470 700 235 H 720" fill="none" stroke={C.pwr} strokeWidth={2} strokeLinecap="round" />
        {/* GND → Buzzer − */}
        <path d="M 328 415 H 316 Q 306 415 306 480 H 688 Q 706 480 706 258 H 720" fill="none" stroke={C.gnd} strokeWidth={2} strokeDasharray="5,3" strokeLinecap="round" />

        {/* D7 → Button Pin1 (blue dashed) */}
        <path d="M 632 260 H 670 Q 686 260 686 330 V 393 Q 686 393 710 393 H 720" fill="none" stroke={C.dig} strokeWidth={2.5} strokeDasharray="6,3" strokeLinecap="round" />
        {/* GND → Button Pin2 */}
        <path d="M 306 480 H 676 Q 694 480 694 408 H 720" fill="none" stroke={C.gnd} strokeWidth={2} strokeDasharray="5,3" strokeLinecap="round" />

        {/* 5V → GPS VCC (red, through top) */}
        <path d="M 300 470 V 148 H 140 V 170" fill="none" stroke={C.pwr} strokeWidth={2} strokeLinecap="round" />
        <text x={150} y={158} fill={C.pwr} fontSize={7} fontFamily="monospace">5V</text>

        {/* 5V → MPU VCC (red, through bottom) */}
        <path d="M 300 470 V 442 H 140 V 420" fill="none" stroke={C.pwr} strokeWidth={2} strokeLinecap="round" />
        <text x={150} y={436} fill={C.pwr} fontSize={7} fontFamily="monospace">5V</text>

        {/* GND bus line */}
        <line x1={60} y1={540} x2={900} y2={540} stroke={C.gnd} strokeWidth={3} strokeLinecap="round" />
        <text x={W / 2} y={558} textAnchor="middle" fill={C.gnd} fontSize={9} fontFamily="monospace">━━ GND Bus (Common Ground) ━━</text>

        {/* GND drops */}
        {[
          { xv: 140, yv: 270 },
          { xv: 140, yv: 420 },
          { xv: 480, yv: 415 },
          { xv: 815, yv: 258 },
          { xv: 815, yv: 408 },
        ].map((g, i) => (
          <line key={i} x1={g.xv} y1={g.yv} x2={g.xv} y2={540} stroke={C.gnd} strokeWidth={1.5} strokeDasharray="4,4" opacity={0.5} />
        ))}

        {/* Wire labels on paths */}
        <text x={264} y={236} fill={C.uart} fontSize={7.5} fontWeight="600" fontFamily="monospace">TX→RX</text>
        <text x={264} y={264} fill={C.uart} fontSize={7.5} fontWeight="600" fontFamily="monospace">RX←TX</text>
        <text x={264} y={315} fill={C.i2c} fontSize={7.5} fontWeight="600" fontFamily="monospace">SDA</text>
        <text x={260} y={375} fill={C.i2c} fontSize={7.5} fontWeight="600" fontFamily="monospace">SCL</text>
        <text x={650} y={212} fill={C.dig} fontSize={7.5} fontWeight="600" fontFamily="monospace">SIG</text>
        <text x={650} y={332} fill={C.dig} fontSize={7.5} fontWeight="600" fontFamily="monospace">BTN</text>

        {/* ═══════════ LEGEND ═══════════ */}
        <rect x={W - 200} y={H - 108} width={180} height={90} rx={10} fill="#0a1628" stroke={C.dim} strokeWidth={1} />
        <text x={W - 110} y={H - 90} textAnchor="middle" fill={C.muted} fontSize={8} fontWeight="700" letterSpacing={1}>WIRE LEGEND</text>
        {[
          { label: 'UART (Serial)', color: C.uart, y: H - 74 },
          { label: 'I2C (Data/Clk)', color: C.i2c, y: H - 60 },
          { label: 'Digital I/O', color: C.dig, y: H - 46 },
          { label: 'Power (5V)', color: C.pwr, y: H - 32 },
        ].map(l => (
          <g key={l.label}>
            <line x1={W - 188} y1={l.y} x2={W - 160} y2={l.y} stroke={l.color} strokeWidth={2.5} strokeLinecap="round" />
            <text x={W - 152} y={l.y + 3.5} fill={l.color} fontSize={8} fontFamily="monospace">{l.label}</text>
          </g>
        ))}

        {/* Section labels */}
        <text x={140} y={155} textAnchor="middle" fill={C.dim} fontSize={8} fontWeight="700" letterSpacing={1.5}>SENSORS</text>
        <text x={815} y={128} textAnchor="middle" fill={C.dim} fontSize={8} fontWeight="700" letterSpacing={1.5}>OUTPUTS</text>
        <text x={480} y={158} textAnchor="middle" fill={C.dim} fontSize={8} fontWeight="700" letterSpacing={1.5}>MICROCONTROLLER</text>
      </svg>
    </div>
  );
}