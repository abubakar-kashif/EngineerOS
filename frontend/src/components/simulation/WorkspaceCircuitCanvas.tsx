/**
 * Simple circuit visualisation for the Workspace page (pre-Phase-10 API).
 * Draws a basic series or parallel circuit as an SVG schematic.
 */
import type { SimulationMode } from "../../types/simulation";

interface WorkspaceCircuitCanvasProps {
  mode: SimulationMode;
  voltage: string;
  r1: string;
  r2: string;
  running: boolean;
  switchOn: boolean;
  onToggleSwitch: () => void;
}

function WorkspaceCircuitCanvas({
  mode,
  voltage,
  r1,
  r2,
  running,
  switchOn,
  onToggleSwitch,
}: WorkspaceCircuitCanvasProps) {
  const v = Number(voltage) || 0;
  const res1 = Number(r1) || 0;
  const active = running && switchOn && v > 0 && res1 > 0;

  const wireColor = active ? "var(--color-primary)" : "var(--color-border)";
  const flowOpacity = active ? 1 : 0.2;

  return (
    <div className="sim-canvas-container">
      <svg viewBox="0 0 360 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="ws-canvas-svg">
        {/* Voltage source (left) */}
        <circle cx="40" cy="100" r="22" stroke={wireColor} strokeWidth="2" fill="none" />
        <text x="40" y="94" textAnchor="middle" fill="var(--color-primary)" fontSize="12" fontWeight="700">+</text>
        <text x="40" y="112" textAnchor="middle" fill="var(--color-primary)" fontSize="12" fontWeight="700">−</text>
        <text x="12" y="104" fill="var(--color-text-muted)" fontSize="9" fontWeight="600">V1</text>
        <text x="40" y="140" textAnchor="middle" fill="var(--color-text-secondary)" fontSize="10">{voltage}V</text>

        {/* Top wire */}
        <line x1="40" y1="40" x2="320" y2="40" stroke={wireColor} strokeWidth="1.5" opacity={flowOpacity} />
        <line x1="40" y1="40" x2="40" y2="78" stroke={wireColor} strokeWidth="1.5" opacity={flowOpacity} />

        {/* Bottom wire */}
        <line x1="40" y1="122" x2="40" y2="160" stroke={wireColor} strokeWidth="1.5" opacity={flowOpacity} />
        <line x1="40" y1="160" x2="320" y2="160" stroke={wireColor} strokeWidth="1.5" opacity={flowOpacity} />

        {/* Right wire */}
        <line x1="320" y1="40" x2="320" y2="160" stroke={wireColor} strokeWidth="1.5" opacity={flowOpacity} />

        {/* Switch (top-left) */}
        <g style={{ cursor: "pointer" }} onClick={onToggleSwitch}>
          <circle cx="100" cy="40" r="4" fill={switchOn ? "var(--color-success, #22c55e)" : "var(--color-danger, #ef4444)"} />
          <line x1="100" y1="40" x2={switchOn ? "130" : "125"} y2={switchOn ? "40" : "28"} stroke={wireColor} strokeWidth="2" />
          <circle cx="130" cy="40" r="4" fill={wireColor} />
          <text x="115" y="22" textAnchor="middle" fill="var(--color-text-muted)" fontSize="8">{switchOn ? "ON" : "OFF"}</text>
        </g>

        {/* R1 — always present */}
        <rect x="155" y="30" width="60" height="20" rx="3" fill="none" stroke="var(--color-accent)" strokeWidth="1.5" />
        <text x="185" y="44" textAnchor="middle" fill="var(--color-text-secondary)" fontSize="9" fontWeight="600">R1</text>
        <text x="185" y="24" textAnchor="middle" fill="var(--color-text-muted)" fontSize="8">{r1}Ω</text>

        {mode === "series" && (
          <>
            {/* R2 in series — inline on top wire */}
            <rect x="235" y="30" width="60" height="20" rx="3" fill="none" stroke="var(--color-accent)" strokeWidth="1.5" />
            <text x="265" y="44" textAnchor="middle" fill="var(--color-text-secondary)" fontSize="9" fontWeight="600">R2</text>
            <text x="265" y="24" textAnchor="middle" fill="var(--color-text-muted)" fontSize="8">{r2}Ω</text>
          </>
        )}

        {mode === "parallel" && (
          <>
            {/* R1 path already on top wire; R2 on a parallel branch */}
            <line x1="185" y1="50" x2="185" y2="90" stroke={wireColor} strokeWidth="1.5" opacity={flowOpacity} />
            <line x1="265" y1="50" x2="265" y2="90" stroke={wireColor} strokeWidth="1.5" opacity={flowOpacity} />
            {/* R2 on bottom parallel branch */}
            <rect x="195" y="80" width="60" height="20" rx="3" fill="none" stroke="var(--color-accent)" strokeWidth="1.5" />
            <text x="225" y="94" textAnchor="middle" fill="var(--color-text-secondary)" fontSize="9" fontWeight="600">R2</text>
            <text x="225" y="76" textAnchor="middle" fill="var(--color-text-muted)" fontSize="8">{r2}Ω</text>
            <line x1="185" y1="100" x2="185" y2="160" stroke={wireColor} strokeWidth="1.5" opacity={flowOpacity} />
            <line x1="265" y1="100" x2="265" y2="160" stroke={wireColor} strokeWidth="1.5" opacity={flowOpacity} />
          </>
        )}

        {/* Current flow animation */}
        {active && (
          <circle r="3" fill="var(--color-accent)" opacity="0.9">
            <animateMotion dur="3s" repeatCount="indefinite" path="M40,40 L320,40 L320,160 L40,160 Z" />
          </circle>
        )}

        {/* Mode label */}
        <text x="340" y="190" textAnchor="end" fill="var(--color-text-muted)" fontSize="9" fontWeight="600">
          {mode.toUpperCase()} CIRCUIT
        </text>
      </svg>
    </div>
  );
}

export default WorkspaceCircuitCanvas;
