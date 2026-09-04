/**
 * Renders a wire (orthogonal segments) with optional endpoint handles.
 */
import type { WireSegment } from "./editorTypes";

interface CircuitWireProps {
  wire: WireSegment;
  selected?: boolean;
  active?: boolean;
  showEndpoints?: boolean;
  onMouseDown?: (e: React.MouseEvent) => void;
  onEndpointMouseDown?: (e: React.MouseEvent, which: "a" | "b") => void;
}

function CircuitWire({
  wire,
  selected,
  active,
  showEndpoints,
  onMouseDown,
  onEndpointMouseDown,
}: CircuitWireProps) {
  if (wire.points.length < 2) return null;

  const d = wire.points
    .map((p: { x: number; y: number }, i: number) => `${i === 0 ? "M" : "L"}${p.x} ${p.y}`)
    .join(" ");

  const start = wire.points[0];
  const end = wire.points[wire.points.length - 1];

  return (
    <g
      className="canvas-wire"
      data-wire-id={wire.id}
      onMouseDown={onMouseDown}
      style={{ cursor: onMouseDown ? "pointer" : undefined }}
    >
      <path d={d} stroke="transparent" strokeWidth={12} fill="none" />
      <path
        d={d}
        stroke={active ? "var(--color-primary)" : selected ? "var(--color-info)" : "currentColor"}
        strokeWidth={selected ? 2.5 : 2}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        pointerEvents="none"
      />
      {showEndpoints && (
        <>
          <circle
            className="canvas-wire-endpoint"
            cx={start.x}
            cy={start.y}
            r={5}
            fill="var(--color-surface)"
            stroke="var(--color-info)"
            strokeWidth={2}
            style={{ cursor: "grab" }}
            onMouseDown={(e) => {
              e.stopPropagation();
              onEndpointMouseDown?.(e, "a");
            }}
          />
          <circle
            className="canvas-wire-endpoint"
            cx={end.x}
            cy={end.y}
            r={5}
            fill="var(--color-surface)"
            stroke="var(--color-info)"
            strokeWidth={2}
            style={{ cursor: "grab" }}
            onMouseDown={(e) => {
              e.stopPropagation();
              onEndpointMouseDown?.(e, "b");
            }}
          />
        </>
      )}
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
