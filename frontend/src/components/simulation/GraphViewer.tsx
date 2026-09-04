/**
 * Graph viewer: axes are measurable signals from SimulationResult.
 * Never invents series; shows an explicit empty reason when data is missing.
 */
import { useMemo, useState } from "react";
import type { SimulationResult } from "./engine/types";
import {
  buildGraphFromSignals,
  listAvailableSignals,
  type GraphData,
  type GraphPoint,
  type MeasurementSignal,
} from "./engine/graphData";

interface GraphViewerProps {
  result: SimulationResult;
  graphs?: GraphData[];
}

const W = 420;
const H = 240;
const PAD = { top: 28, right: 16, bottom: 40, left: 52 };

function GraphViewer({ result, graphs: presetGraphs }: GraphViewerProps) {
  const signals = useMemo(() => listAvailableSignals(result), [result]);
  const available = useMemo(() => signals.filter((s) => s.available), [signals]);
  const yCandidates = useMemo(
    () => available.filter((s) => s.quantity !== "index" && s.quantity !== "time"),
    [available],
  );
  const xCandidates = useMemo(() => {
    const idx = available.filter((s) => s.quantity === "index");
    const scalars = available.filter(
      (s) =>
        s.quantity === "voltage" ||
        s.quantity === "current" ||
        s.quantity === "power" ||
        s.quantity === "resistance",
    );
    const time = signals.filter((s) => s.quantity === "time");
    return [...idx, ...scalars, ...time];
  }, [available, signals]);

  const presets = useMemo(
    () => (presetGraphs?.length ? presetGraphs : result.graphs ?? []),
    [presetGraphs, result.graphs],
  );

  const [mode, setMode] = useState<"preset" | "custom">("preset");
  const [activeId, setActiveId] = useState(presets[0]?.id ?? "");
  const [xId, setXId] = useState(xCandidates[0]?.id ?? "index");
  const [yId, setYId] = useState(yCandidates[0]?.id ?? "");
  const [zoom, setZoom] = useState(1);
  const [hover, setHover] = useState<{ x: number; y: number; label: string } | null>(null);

  const resolvedActiveId = presets.some((g) => g.id === activeId)
    ? activeId
    : (presets[0]?.id ?? "");
  const resolvedXId = xCandidates.some((s) => s.id === xId)
    ? xId
    : (xCandidates[0]?.id ?? "index");
  const resolvedYId = yCandidates.some((s) => s.id === yId)
    ? yId
    : (yCandidates[0]?.id ?? "");

  const customBuild = useMemo(() => {
    if (mode !== "custom" || !result.measurements || !resolvedYId) {
      return { graph: null as GraphData | null, unavailableReason: undefined as string | undefined };
    }
    return buildGraphFromSignals(result.measurements, resolvedXId, [resolvedYId]);
  }, [mode, result.measurements, resolvedXId, resolvedYId]);

  const graph = useMemo(() => {
    if (mode === "custom") return customBuild.graph;
    return presets.find((g) => g.id === resolvedActiveId) ?? presets[0] ?? null;
  }, [mode, customBuild.graph, presets, resolvedActiveId]);

  const unavailableReason =
    mode === "custom"
      ? customBuild.unavailableReason
      : !presets.length
        ? "No measurement-based graphs are available for this SimulationRun."
        : undefined;

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

  const toSvg = (p: GraphPoint) => {
    const iw = W - PAD.left - PAD.right;
    const ih = H - PAD.top - PAD.bottom;
    const x = PAD.left + ((p.x - bounds.minX) / (bounds.maxX - bounds.minX || 1)) * iw;
    const y = PAD.top + ih - ((p.y - bounds.minY) / (bounds.maxY - bounds.minY || 1)) * ih;
    return { x, y };
  };

  const axisOptionLabel = (s: MeasurementSignal) =>
    s.available ? `${s.label}${s.unit ? ` (${s.unit})` : ""}` : `${s.label} — unavailable`;

  if (!result.measurements) {
    return (
      <p className="sim2-analysis-empty">
        Run a simulation to plot measurement signals.
      </p>
    );
  }

  if (unavailableReason && !graph) {
    return (
      <div className="sim-graph-viewer">
        <SignalToolbar
          mode={mode}
          setMode={setMode}
          presets={presets}
          activeId={resolvedActiveId}
          setActiveId={(id) => {
            setActiveId(id);
            setZoom(1);
            setHover(null);
          }}
          xId={resolvedXId}
          setXId={setXId}
          yId={resolvedYId}
          setYId={setYId}
          xCandidates={xCandidates}
          yCandidates={yCandidates}
          axisOptionLabel={axisOptionLabel}
          onResetView={() => {
            setZoom(1);
            setHover(null);
          }}
        />
        <p className="sim2-analysis-empty" role="status">
          {unavailableReason}
        </p>
      </div>
    );
  }

  if (!graph) {
    return (
      <p className="sim2-analysis-empty">
        No measurement-based graphs are available for this SimulationRun.
      </p>
    );
  }

  const categoryLabels = (graph.metadata?.labels as string[] | undefined) ?? [];

  return (
    <div className="sim-graph-viewer">
      <SignalToolbar
        mode={mode}
        setMode={setMode}
        presets={presets}
        activeId={graph.id}
        setActiveId={(id) => {
          setActiveId(id);
          setZoom(1);
          setHover(null);
        }}
        xId={resolvedXId}
        setXId={setXId}
        yId={resolvedYId}
        setYId={setYId}
        xCandidates={xCandidates}
        yCandidates={yCandidates}
        axisOptionLabel={axisOptionLabel}
        setZoom={setZoom}
        onResetView={() => {
          setZoom(1);
          setHover(null);
        }}
      />

      <svg
        className="sim-graph-svg"
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={graph.title}
      >
        <rect x={0} y={0} width={W} height={H} className="sim-graph-svg-bg" />
        {/* subtle grid */}
        {[0.25, 0.5, 0.75].map((t) => {
          const y = PAD.top + (H - PAD.top - PAD.bottom) * (1 - t);
          return (
            <line
              key={`gy-${t}`}
              x1={PAD.left}
              y1={y}
              x2={W - PAD.right}
              y2={y}
              className="sim-graph-grid"
            />
          );
        })}
        <line
          x1={PAD.left}
          y1={H - PAD.bottom}
          x2={W - PAD.right}
          y2={H - PAD.bottom}
          className="sim-graph-axis"
        />
        <line
          x1={PAD.left}
          y1={PAD.top}
          x2={PAD.left}
          y2={H - PAD.bottom}
          className="sim-graph-axis"
        />
        <text x={W / 2} y={16} textAnchor="middle" fontSize={12} className="sim-graph-title">
          {graph.title}
        </text>
        <text x={W / 2} y={H - 8} textAnchor="middle" fontSize={10} className="sim-graph-axis-text">
          {graph.xAxis.label}
          {graph.xAxis.unit ? ` (${graph.xAxis.unit})` : ""}
        </text>
        <text
          x={14}
          y={H / 2}
          textAnchor="middle"
          fontSize={10}
          className="sim-graph-axis-text"
          transform={`rotate(-90 14 ${H / 2})`}
        >
          {graph.yAxis.label}
          {graph.yAxis.unit ? ` (${graph.yAxis.unit})` : ""}
        </text>

        {graph.series.map((series) => {
          const pts = series.points.map(toSvg);
          if (graph.type === "bar") {
            const barW = Math.max(4, (W - PAD.left - PAD.right) / (series.points.length * 2 || 2));
            return series.points.map((p, i) => {
              const c = toSvg(p);
              const base = toSvg({ x: p.x, y: Math.min(0, bounds.minY) });
              const y0 = Math.min(c.y, base.y);
              const h = Math.abs(c.y - base.y) || 1;
              const cat = categoryLabels[i] ?? series.name;
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
                      label: `${cat}: ${p.y.toPrecision(4)} ${graph.yAxis.unit}`,
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
              {pts.length > 1 && (
                <path d={d} fill="none" stroke={series.color || "#2563eb"} strokeWidth={2} />
              )}
              {series.points.map((p, i) => {
                const c = pts[i];
                return (
                  <circle
                    key={i}
                    cx={c.x}
                    cy={c.y}
                    r={3.5}
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
        From SimulationRun measurements · signals only (no synthetic sweeps)
      </p>
    </div>
  );
}

function SignalToolbar({
  mode,
  setMode,
  presets,
  activeId,
  setActiveId,
  xId,
  setXId,
  yId,
  setYId,
  xCandidates,
  yCandidates,
  axisOptionLabel,
  setZoom,
  onResetView,
}: {
  mode: "preset" | "custom";
  setMode: (m: "preset" | "custom") => void;
  presets: GraphData[];
  activeId: string;
  setActiveId: (id: string) => void;
  xId: string;
  setXId: (id: string) => void;
  yId: string;
  setYId: (id: string) => void;
  xCandidates: MeasurementSignal[];
  yCandidates: MeasurementSignal[];
  axisOptionLabel: (s: MeasurementSignal) => string;
  setZoom?: (fn: (z: number) => number) => void;
  onResetView: () => void;
}) {
  return (
    <div className="sim-graph-toolbar">
      <select
        className="sim-graph-select"
        value={mode}
        onChange={(e) => setMode(e.target.value as "preset" | "custom")}
        aria-label="Graph mode"
      >
        <option value="preset">Measurement plots</option>
        <option value="custom">Custom X / Y signals</option>
      </select>
      {mode === "preset" ? (
        <select
          className="sim-graph-select"
          value={activeId}
          onChange={(e) => setActiveId(e.target.value)}
          aria-label="Select measurement graph"
        >
          {presets.map((g) => (
            <option key={g.id} value={g.id}>
              {g.title}
            </option>
          ))}
        </select>
      ) : (
        <>
          <label className="sim-graph-axis-label">
            X
            <select
              className="sim-graph-select"
              value={xId}
              onChange={(e) => setXId(e.target.value)}
              aria-label="X-axis signal"
            >
              {xCandidates.map((s) => (
                <option key={s.id} value={s.id} disabled={!s.available && s.quantity !== "time"}>
                  {axisOptionLabel(s)}
                </option>
              ))}
            </select>
          </label>
          <label className="sim-graph-axis-label">
            Y
            <select
              className="sim-graph-select"
              value={yId}
              onChange={(e) => setYId(e.target.value)}
              aria-label="Y-axis signal"
            >
              {yCandidates.map((s) => (
                <option key={s.id} value={s.id}>
                  {axisOptionLabel(s)}
                </option>
              ))}
            </select>
          </label>
        </>
      )}
      <div className="sim-graph-actions">
        {setZoom && (
          <>
            <button type="button" onClick={() => setZoom((z) => Math.min(8, z * 1.25))}>
              Zoom +
            </button>
            <button type="button" onClick={() => setZoom((z) => Math.max(0.5, z / 1.25))}>
              Zoom −
            </button>
          </>
        )}
        <button type="button" onClick={onResetView}>
          Reset view
        </button>
      </div>
    </div>
  );
}

export default GraphViewer;
