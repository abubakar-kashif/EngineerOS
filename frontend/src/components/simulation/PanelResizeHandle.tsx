/**
 * Drag resize handle for simulation lab panels (horizontal or vertical).
 */
import { useCallback, useRef } from "react";

interface PanelResizeHandleProps {
  axis: "x" | "y";
  /** Positive delta grows the primary panel (left for x, top for y when inverted=false). */
  onDelta: (deltaPx: number) => void;
  /** When true, dragging down grows analysis (inverted Y). */
  invert?: boolean;
  label: string;
  className?: string;
}

function PanelResizeHandle({
  axis,
  onDelta,
  invert = false,
  label,
  className = "",
}: PanelResizeHandleProps) {
  const lastRef = useRef<number | null>(null);

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      const el = e.currentTarget;
      el.setPointerCapture(e.pointerId);
      lastRef.current = axis === "x" ? e.clientX : e.clientY;
      document.body.style.cursor = axis === "x" ? "col-resize" : "row-resize";
      document.body.style.userSelect = "none";
    },
    [axis],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (lastRef.current == null || !e.currentTarget.hasPointerCapture(e.pointerId)) return;
      const pos = axis === "x" ? e.clientX : e.clientY;
      let delta = pos - lastRef.current;
      if (invert) delta = -delta;
      lastRef.current = pos;
      if (delta !== 0) onDelta(delta);
    },
    [axis, invert, onDelta],
  );

  const endDrag = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    lastRef.current = null;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }, []);

  return (
    <div
      className={`sim2-resize-handle sim2-resize-handle--${axis} ${className}`.trim()}
      role="separator"
      aria-orientation={axis === "x" ? "vertical" : "horizontal"}
      aria-label={label}
      title={label}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      <span className="sim2-resize-handle-glyph" aria-hidden="true">
        {axis === "x" ? "<-->" : "↕"}
      </span>
    </div>
  );
}

export default PanelResizeHandle;
