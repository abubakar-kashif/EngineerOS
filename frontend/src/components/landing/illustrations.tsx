/**
 * Custom line-art illustrations for the landing page.
 * Hand-drawn SVG in the brand blue palette — no AI-generated raster art, no
 * external image requests, and no layout shift (every graphic is sized).
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
 * Hero graphic: a schematic-style circuit board rendered as line art, with
 * current pulses travelling the traces. Only opacity/transform/offset animate.
 */
export function HeroCircuitArt() {
  const reduced = useReducedMotion();

  return (
    <svg
      width={640}
      height={520}
      viewBox="0 0 640 520"
      className="h-auto w-full max-w-[640px]"
      role="img"
      aria-label="Line-art illustration of a circuit board with a power source, resistors, an LED and measurement probes"
    >
      <defs>
        <linearGradient id="eos-hero-trace" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#22D3EE" />
        </linearGradient>
        <radialGradient id="eos-hero-glow" cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor="#2563EB" stopOpacity="0.36" />
          <stop offset="100%" stopColor="#2563EB" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect x="0" y="0" width="640" height="520" fill="url(#eos-hero-glow)" />

      {/* board */}
      <rect
        x="58"
        y="52"
        width="524"
        height="416"
        rx="24"
        fill="#0B1220"
        stroke="#1F2937"
        strokeWidth="2"
      />
      <rect
        x="86"
        y="80"
        width="468"
        height="360"
        rx="16"
        fill="none"
        stroke="#16233A"
        strokeWidth="1.5"
        strokeDasharray="4 8"
      />

      {/* traces */}
      <g fill="none" stroke="url(#eos-hero-trace)" strokeWidth="2.5" strokeLinecap="round">
        <path id="eos-trace-a" d="M136 380 L136 176 L268 176 L268 132 L448 132" />
        <path id="eos-trace-b" d="M136 380 L332 380 L332 300 L500 300 L500 208" />
        <path d="M332 300 L332 240 L404 240" opacity="0.65" />
        <path d="M448 132 L504 132 L504 176" opacity="0.65" />
      </g>

      {/* pads */}
      {[
        [136, 380],
        [268, 176],
        [448, 132],
        [332, 300],
        [500, 300],
        [404, 240],
      ].map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="6" fill="#0A0E17" stroke="#3B82F6" strokeWidth="2" />
      ))}

      {/* battery / source */}
      <g stroke="#60A5FA" strokeWidth="2.5" strokeLinecap="round" fill="none">
        <path d="M104 380 L104 336" />
        <path d="M168 380 L168 336" />
        <path d="M92 336 L116 336" />
        <path d="M156 344 L180 344" />
      </g>
      <text x="120" y="410" fill="#9CA3AF" fontSize="15" fontFamily="Inter, sans-serif">
        V1
      </text>

      {/* resistors */}
      <g fill="none" stroke="#22D3EE" strokeWidth="2.5" strokeLinejoin="round">
        <path d="M240 176 L250 160 L262 192 L274 160 L286 192 L296 176" />
        <path d="M472 300 L482 284 L494 316 L506 284 L518 316 L528 300" />
      </g>
      <text x="246" y="146" fill="#9CA3AF" fontSize="15" fontFamily="Inter, sans-serif">
        R1
      </text>
      <text x="478" y="346" fill="#9CA3AF" fontSize="15" fontFamily="Inter, sans-serif">
        R2
      </text>

      {/* LED */}
      <g>
        <circle cx="448" cy="132" r="22" fill="#2563EB" opacity="0.18" />
        <circle cx="448" cy="132" r="11" fill="#3B82F6" />
        <g stroke="#93C5FD" strokeWidth="2" strokeLinecap="round">
          <path d="M448 100 L448 90" />
          <path d="M472 112 L480 104" />
          <path d="M424 112 L416 104" />
        </g>
      </g>

      {/* probe / meter */}
      <g>
        <rect x="368" y="216" width="72" height="48" rx="10" fill="#0D1117" stroke="#1F2937" strokeWidth="2" />
        <text x="404" y="246" fill="#60A5FA" fontSize="17" textAnchor="middle" fontFamily="Inter, sans-serif">
          5.0 V
        </text>
      </g>

      {/* travelling current */}
      {!reduced && (
        <>
          <circle r="4.5" fill="#93C5FD">
            <animateMotion
              dur="3.6s"
              repeatCount="indefinite"
              path="M136 380 L136 176 L268 176 L268 132 L448 132"
            />
          </circle>
          <circle r="4.5" fill="#67E8F9">
            <animateMotion
              dur="4.4s"
              begin="0.8s"
              repeatCount="indefinite"
              path="M136 380 L332 380 L332 300 L500 300 L500 208"
            />
          </circle>
        </>
      )}
    </svg>
  );
}

/** Flat/line-art mentor robot for the AI Mentor spotlight. */
export function MentorRobotArt() {
  return (
    <svg
      width={260}
      height={260}
      viewBox="0 0 260 260"
      className="h-auto w-[180px] sm:w-[220px] lg:w-[260px]"
      role="img"
      aria-label="Line-art illustration of the EngineerOS AI mentor robot"
    >
      <defs>
        <linearGradient id="eos-robot-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1E3A8A" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#0D1117" stopOpacity="0.9" />
        </linearGradient>
      </defs>

      {/* antenna */}
      <g stroke="#3B82F6" strokeWidth="3" strokeLinecap="round">
        <path d="M130 44 L130 26" />
      </g>
      <circle cx="130" cy="20" r="7" fill="#60A5FA" />

      {/* head */}
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

      {/* ears */}
      <rect x="46" y="80" width="14" height="36" rx="7" fill="#1F2937" stroke="#3B82F6" strokeWidth="2" />
      <rect x="200" y="80" width="14" height="36" rx="7" fill="#1F2937" stroke="#3B82F6" strokeWidth="2" />

      {/* body */}
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

      {/* arms */}
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
      height={320}
      viewBox="0 0 420 320"
      className="h-auto w-full max-w-[420px]"
      aria-hidden="true"
      focusable="false"
    >
      <g fill="none" stroke="#1E40AF" strokeWidth="2" strokeLinecap="round" opacity="0.75">
        <path id="eos-chip-trace-a" d="M14 60 L110 60 L110 128 L164 128" />
        <path id="eos-chip-trace-b" d="M14 260 L110 260 L110 192 L164 192" />
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
