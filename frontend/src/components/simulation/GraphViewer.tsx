/**
 * Interactive graph viewer for engine GraphData (zoom, hover, axes, reset).
 */
import { useCallback, useMemo, useState } from "react";
import type { GraphData, GraphPoint } from "./engine/graphData";

interface GraphViewerProps {
  graphs: GraphData[];
}

const W = 420;
const H = 240;
const PAD = { top: 28, right: 16, bottom: 40, left: 52 };

function GraphViewer({ graphs }: GraphViewerProps) {
  const [activeId, setActiveId] = useState(graphs[0]?.id ?? "");
  const [zoom, setZoom] = useState(1);
  const [hover, setHover] = useState<{ x: number; y: number; label: string } | null>(null);

  const graph = useMemo(
    () => graphs.find(g => g.id === activeId) ?? graphs[0],
    [graphs, activeId],
  );

  const bounds = useMemo(() => {
    if (!graph) return { minX: 0, maxX: 1, minY: 0, maxY: 1 };
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    for (const s of graph.series) {
      for (const p of s.points) {
        minX = Math.min(minX, p.x);
        maxX = Math.max(maxX, p.x);
        minY = Math.min(minY, p.y);
        maxY = Math.max(maxY, p.y);
      }
    }
    if (!Number.isFinite(minX)) {
      return { minX: 0, maxX: 1, minY: 0, maxY: 1 };
    }
    const dx = (maxX - minX) || 1;
    const dy = (maxY - minY) || 1;
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    const halfX = (dx / 2) / zoom;
    const halfY = (dy / 2) / zoom;
    return {
      minX: cx - halfX,
      maxX: cx + halfX,
      minY: cy - halfY - dy * 0.05,
      maxY: cy + halfY + dy * 0.05,
    };
  }, [graph, zoom]);

  const toSvg = useCallback(
    (p: GraphPoint) => {
      const iw = W - PAD.left - PAD.right;
      const ih = H - PAD.top - PAD.bottom;
      const x =
        PAD.left +
        ((p.x - bounds.minX) / (bounds.maxX - bounds.minX || 1)) * iw;
      const y =
        PAD.top +
        ih -
        ((p.y - bounds.minY) / (bounds.maxY - bounds.minY || 1)) * ih;
      return { x, y };
    },
    [bounds],
  );

  if (!graphs.length || !graph) {
    return (
      <p className="sim2-analysis-empty">
        No graph arrays on this SimulationResult.
      </p>
    );
  }

  return (
    <div className="sim-graph-viewer">
      <div className="sim-graph-toolbar">
        <select
          className="sim-graph-select"
          value={graph.id}
          onChange={e => {
            setActiveId(e.target.value);
            setZoom(1);
            setHover(null);
          }}
          aria-label="Select graph"
        >
          {graphs.map(g => (
            <option key={g.id} value={g.id}>
              {g.title}
            </option>
          ))}
        </select>
        <div className="sim-graph-actions">
          <button type="button" onClick={() => setZoom(z => Math.min(8, z * 1.25))}>
            Zoom +
          </button>
          <button type="button" onClick={() => setZoom(z => Math.max(0.5, z / 1.25))}>
            Zoom −
          </button>
          <button
            type="button"
            onClick={() => {
              setZoom(1);
              setHover(null);
            }}
          >
            Reset view
          </button>
        </div>
      </div>

      <svg
        className="sim-graph-svg"
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={graph.title}
      >
        <rect x={0} y={0} width={W} height={H} fill="var(--color-surface, #f8fafc)" />
        <line
          x1={PAD.left}
          y1={H - PAD.bottom}
          x2={W - PAD.right}
          y2={H - PAD.bottom}
          stroke="#94a3b8"
        />
        <line
          x1={PAD.left}
          y1={PAD.top}
          x2={PAD.left}
          y2={H - PAD.bottom}
          stroke="#94a3b8"
        />
        <text x={W / 2} y={16} textAnchor="middle" fontSize={11} fill="#0f172a">
          {graph.title}
        </text>
        <text
          x={W / 2}
          y={H - 8}
          textAnchor="middle"
          fontSize={10}
          fill="#475569"
        >
          {graph.xAxis.label}
          {graph.xAxis.unit ? ` (${graph.xAxis.unit})` : ""}
        </text>
        <text
          x={14}
          y={H / 2}
          textAnchor="middle"
          fontSize={10}
          fill="#475569"
          transform={`rotate(-90 14 ${H / 2})`}
        >
          {graph.yAxis.label}
          {graph.yAxis.unit ? ` (${graph.yAxis.unit})` : ""}
        </text>

        {graph.series.map(series => {
          const pts = series.points.map(toSvg);
          if (graph.type === "bar") {
            const barW = Math.max(4, (W - PAD.left - PAD.right) / (series.points.length * 2));
            return series.points.map((p, i) => {
              const c = toSvg(p);
              const base = toSvg({ x: p.x, y: Math.min(0, bounds.minY) });
              const y0 = Math.min(c.y, base.y);
              const h = Math.abs(c.y - base.y) || 1;
              return (
                <rect
                  key={`${series.name}-${i}`}
                  x={c.x - barW / 2}
                  y={y0}
                  width={barW}
                  height={h}
                  fill={series.color || "#2563eb"}
                  opacity={0.85}
                  onMouseEnter={() =>
                    setHover({
                      x: p.x,
                      y: p.y,
                      label: `${series.name}: (${p.x.toPrecision(4)}, ${p.y.toPrecision(4)})`,
                    })
                  }
                  onMouseLeave={() => setHover(null)}
                />
              );
            });
          }
          const d = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
          return (
            <g key={series.name}>
              <path d={d} fill="none" stroke={series.color || "#2563eb"} strokeWidth={2} />
              {series.points.map((p, i) => {
                const c = pts[i];
                return (
                  <circle
                    key={i}
                    cx={c.x}
                    cy={c.y}
                    r={3}
                    fill={series.color || "#2563eb"}
                    onMouseEnter={() =>
                      setHover({
                        x: p.x,
                        y: p.y,
                        label: `${series.name}: ${p.x.toPrecision(4)} ${graph.xAxis.unit}, ${p.y.toPrecision(4)} ${graph.yAxis.unit}`,
                      })
                    }
                    onMouseLeave={() => setHover(null)}
                  />
                );
              })}
            </g>
          );
        })}
      </svg>

      {hover && (
        <div className="sim-graph-hover" role="status">
          {hover.label}
        </div>
      )}
      <p className="sim-graph-association">
        Tied to current SimulationResult · {graphs.length} graph
        {graphs.length === 1 ? "" : "s"}
      </p>
    </div>
  );
}

export default GraphViewer;
