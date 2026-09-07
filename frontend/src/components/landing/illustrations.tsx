/**
 * Custom line-art illustrations for the landing page.
 * Hand-drawn SVG in the brand blue palette — no AI-generated raster art.
 */
import { useReducedMotion } from "framer-motion";
import { BOLT_PATH, BOLT_VIEWBOX } from "./boltGeometry";

export function BoltMark({ size = 22, className }: { size?: number; className?: string }) {
  const height = size;
  const width = Math.round((BOLT_VIEWBOX.width / BOLT_VIEWBOX.height) * size);
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${BOLT_VIEWBOX.width} ${BOLT_VIEWBOX.height}`}
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="eos-bolt-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="100%" stopColor="#2563EB" />
        </linearGradient>
      </defs>
      <path d={BOLT_PATH} fill="url(#eos-bolt-grad)" />
    </svg>
  );
}

/**
 * Proper series LED circuit schematic:
 * V1 (DC source) → R1 (current-limiting resistor) → D1 (LED) → GND return.
 * Orthogonal wires only, standard schematic symbols, voltmeter across the LED.
 */
export function HeroCircuitArt() {
  const reduced = useReducedMotion();

  const loop =
    "M140 360 L140 170 L220 170 L300 170 L380 170 L460 170 L520 170 L520 360 L140 360";

  return (
    <svg
      width={560}
      height={460}
      viewBox="0 0 560 460"
      className="landing-hero-art"
      role="img"
      aria-label="Schematic of a series LED circuit with voltage source V1, resistor R1, LED D1, ground, and a voltmeter reading 2.0 V"
    >
      <defs>
        <radialGradient id="eos-hero-glow" cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor="#2563EB" stopOpacity="0.32" />
          <stop offset="100%" stopColor="#2563EB" stopOpacity="0" />
        </radialGradient>
        <filter id="eos-led-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <rect x="0" y="0" width="560" height="460" fill="url(#eos-hero-glow)" />

      <rect
        x="36"
        y="36"
        width="488"
        height="388"
        rx="22"
        fill="#0B1220"
        stroke="#1F2937"
        strokeWidth="1.5"
      />

      <text
        x="280"
        y="68"
        fill="#6B7280"
        fontSize="12"
        fontFamily="Inter, sans-serif"
        letterSpacing="1.5"
        textAnchor="middle"
      >
        SERIES LED CIRCUIT
      </text>

      {/* Center the schematic inside the card */}
      <g transform="translate(-18, 22)">
      <g fill="none" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="square">
        <path d="M140 300 L140 170" />
        <path d="M140 170 L220 170" />
        <path d="M300 170 L380 170" />
        <path d="M460 170 L520 170 L520 360 L140 360" />
        <path d="M140 360 L140 340" />
      </g>

      {/* V1 battery */}
      <g stroke="#60A5FA" strokeWidth="2.5" strokeLinecap="round" fill="none">
        <path d="M116 300 L164 300" />
        <path d="M126 320 L154 320" />
        <path d="M116 340 L164 340" />
      </g>
      <text x="176" y="318" fill="#E5E7EB" fontSize="14" fontFamily="Inter, sans-serif" fontWeight="600">
        V1
      </text>
      <text x="176" y="336" fill="#9CA3AF" fontSize="12" fontFamily="Inter, sans-serif">
        5 V DC
      </text>
      <text x="98" y="304" fill="#60A5FA" fontSize="14" fontFamily="Inter, sans-serif">
        +
      </text>
      <text x="100" y="346" fill="#9CA3AF" fontSize="14" fontFamily="Inter, sans-serif">
        −
      </text>

      {/* R1 zigzag */}
      <g fill="none" stroke="#22D3EE" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
        <path d="M220 170 L232 170 L244 150 L256 190 L268 150 L280 190 L292 170 L300 170" />
      </g>
      <text x="244" y="130" fill="#E5E7EB" fontSize="14" fontFamily="Inter, sans-serif" fontWeight="600">
        R1
      </text>
      <text x="236" y="216" fill="#9CA3AF" fontSize="12" fontFamily="Inter, sans-serif">
        220 Ω
      </text>

      {/* D1 LED */}
      <g filter={reduced ? undefined : "url(#eos-led-glow)"}>
        <path d="M380 170 L430 148 L430 192 Z" fill="#3B82F6" stroke="#93C5FD" strokeWidth="1.5" />
        <path d="M430 148 L430 192" stroke="#93C5FD" strokeWidth="2.5" fill="none" />
        <path d="M460 170 L430 170" stroke="#3B82F6" strokeWidth="2.5" fill="none" />
        <g stroke="#67E8F9" strokeWidth="2" strokeLinecap="round">
          <path d="M448 138 L462 124" />
          <path d="M456 146 L472 136" />
        </g>
      </g>
      <text x="392" y="130" fill="#E5E7EB" fontSize="14" fontFamily="Inter, sans-serif" fontWeight="600">
        D1
      </text>
      <text x="392" y="216" fill="#9CA3AF" fontSize="12" fontFamily="Inter, sans-serif">
        LED
      </text>

      {/* Ground */}
      <g stroke="#9CA3AF" strokeWidth="2.5" strokeLinecap="round">
        <path d="M330 360 L330 378" />
        <path d="M312 378 L348 378" />
        <path d="M318 386 L342 386" />
        <path d="M324 394 L336 394" />
      </g>
      <text x="356" y="390" fill="#9CA3AF" fontSize="12" fontFamily="Inter, sans-serif">
        GND
      </text>

      {/* Voltmeter across LED */}
      <g fill="none" stroke="#4B5563" strokeWidth="1.5" strokeDasharray="4 4">
        <path d="M380 170 L380 250" />
        <path d="M460 170 L460 250" />
        <path d="M380 250 L460 250" />
      </g>
      <circle cx="420" cy="250" r="22" fill="#0D1117" stroke="#3B82F6" strokeWidth="2" />
      <text
        x="420"
        y="246"
        fill="#60A5FA"
        fontSize="13"
        fontFamily="Inter, sans-serif"
        fontWeight="700"
        textAnchor="middle"
      >
        V
      </text>
      <text
        x="420"
        y="260"
        fill="#93C5FD"
        fontSize="10"
        fontFamily="Inter, sans-serif"
        textAnchor="middle"
      >
        2.0 V
      </text>

      {[
        [140, 170],
        [220, 170],
        [300, 170],
        [380, 170],
        [460, 170],
        [520, 170],
        [520, 360],
        [140, 360],
      ].map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="4" fill="#93C5FD" />
      ))}

      {!reduced && (
        <circle r="4.5" fill="#67E8F9">
          <animateMotion dur="4.2s" repeatCount="indefinite" path={loop} />
        </circle>
      )}
      </g>
    </svg>
  );
}

/** Flat/line-art mentor robot for the AI Mentor spotlight. */
export function MentorRobotArt() {
  return (
    <svg
      width={220}
      height={220}
      viewBox="0 0 260 260"
      style={{ width: "100%", maxWidth: 220, height: "auto" }}
      role="img"
      aria-label="Line-art illustration of the EngineerOS AI mentor robot"
    >
      <defs>
        <linearGradient id="eos-robot-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1E3A8A" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#0D1117" stopOpacity="0.9" />
        </linearGradient>
      </defs>

      <g stroke="#3B82F6" strokeWidth="3" strokeLinecap="round">
        <path d="M130 44 L130 26" />
      </g>
      <circle cx="130" cy="20" r="7" fill="#60A5FA" />

      <rect
        x="64"
        y="46"
        width="132"
        height="104"
        rx="26"
        fill="url(#eos-robot-grad)"
        stroke="#3B82F6"
        strokeWidth="2.5"
      />
      <circle cx="102" cy="96" r="11" fill="#60A5FA" />
      <circle cx="158" cy="96" r="11" fill="#60A5FA" />
      <path
        d="M104 124 Q130 138 156 124"
        fill="none"
        stroke="#22D3EE"
        strokeWidth="3"
        strokeLinecap="round"
      />

      <rect x="46" y="80" width="14" height="36" rx="7" fill="#1F2937" stroke="#3B82F6" strokeWidth="2" />
      <rect x="200" y="80" width="14" height="36" rx="7" fill="#1F2937" stroke="#3B82F6" strokeWidth="2" />

      <rect
        x="80"
        y="164"
        width="100"
        height="72"
        rx="20"
        fill="url(#eos-robot-grad)"
        stroke="#3B82F6"
        strokeWidth="2.5"
      />
      <path
        d="M112 200 L124 200 L130 186 L136 214 L142 200 L152 200"
        fill="none"
        stroke="#22D3EE"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <g stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" fill="none">
        <path d="M80 182 L56 196" />
        <path d="M180 182 L204 196" />
      </g>
    </svg>
  );
}

/** Decorative chip + traces with looping current for the final CTA band. */
export function ChipTraceArt() {
  const reduced = useReducedMotion();

  return (
    <svg
      width={420}
      height={300}
      viewBox="0 0 420 320"
      style={{ width: "100%", maxWidth: 400, height: "auto" }}
      aria-hidden="true"
      focusable="false"
    >
      <g fill="none" stroke="#1E40AF" strokeWidth="2" strokeLinecap="round" opacity="0.8">
        <path d="M14 60 L110 60 L110 128 L164 128" />
        <path d="M14 260 L110 260 L110 192 L164 192" />
        <path d="M256 128 L310 128 L310 60 L406 60" />
        <path d="M256 192 L310 192 L310 260 L406 260" />
      </g>

      <rect
        x="164"
        y="104"
        width="92"
        height="112"
        rx="14"
        fill="#0D1117"
        stroke="#2563EB"
        strokeWidth="2.5"
      />
      <rect x="182" y="126" width="56" height="68" rx="8" fill="none" stroke="#1E3A8A" strokeWidth="2" />
      <path
        d="M198 160 L208 160 L212 146 L218 174 L222 160 L232 160"
        fill="none"
        stroke="#60A5FA"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {[128, 148, 168, 188].map((y) => (
        <g key={y} stroke="#2563EB" strokeWidth="2" strokeLinecap="round">
          <path d={`M150 ${y} L164 ${y}`} />
          <path d={`M256 ${y} L270 ${y}`} />
        </g>
      ))}

      {!reduced && (
        <>
          <circle r="4" fill="#60A5FA">
            <animateMotion dur="4s" repeatCount="indefinite" path="M14 60 L110 60 L110 128 L164 128" />
          </circle>
          <circle r="4" fill="#22D3EE">
            <animateMotion
              dur="4.8s"
              begin="1.2s"
              repeatCount="indefinite"
              path="M14 260 L110 260 L110 192 L164 192"
            />
          </circle>
          <circle r="4" fill="#60A5FA">
            <animateMotion
              dur="4.4s"
              begin="0.6s"
              repeatCount="indefinite"
              path="M256 128 L310 128 L310 60 L406 60"
            />
          </circle>
        </>
      )}
    </svg>
  );
}
