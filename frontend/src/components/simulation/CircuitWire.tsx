/**
 * Renders a wire (series of orthogonal line segments) on the circuit canvas.
 */
import type { WireSegment } from "./editorTypes";

interface CircuitWireProps {
  wire: WireSegment;
  selected?: boolean;
  active?: boolean;
  onClick?: () => void;
}

function CircuitWire({ wire, selected, active, onClick }: CircuitWireProps) {
  if (wire.points.length < 2) return null;

  const d = wire.points
    .map((p: { x: number; y: number }, i: number) => `${i === 0 ? "M" : "L"}${p.x} ${p.y}`)
    .join(" ");

  return (
    <g className="canvas-wire" onClick={onClick} style={{ cursor: onClick ? "pointer" : undefined }}>
      <path d={d} stroke="transparent" strokeWidth={10} fill="none" />
      <path
        d={d}
        stroke={active ? "var(--color-primary)" : selected ? "var(--color-info)" : "currentColor"}
        strokeWidth={selected ? 2.5 : 2}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  );
}

export default CircuitWire;

export function WirePreview({ points }: { points: { x: number; y: number }[] }) {
  if (points.length < 2) return null;
  const d = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x} ${p.y}`)
    .join(" ");
  return (
    <path
      d={d}
      stroke="var(--color-primary)"
      strokeWidth={2}
      strokeDasharray="6 4"
      fill="none"
      strokeLinecap="round"
      pointerEvents="none"
    />
  );
}