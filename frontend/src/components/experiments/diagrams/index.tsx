import { lazy, Suspense, type ComponentType } from "react";

/* Lazy-load each diagram so the page bundle stays lean. */
const OhmsLawDiagram = lazy(() => import("./OhmsLawDiagram"));
const SeriesCircuitDiagram = lazy(() => import("./SeriesCircuitDiagram"));
const ParallelCircuitDiagram = lazy(() => import("./ParallelCircuitDiagram"));
const KVLDiagram = lazy(() => import("./KVLDiagram"));
const KCLDiagram = lazy(() => import("./KCLDiagram"));
const VoltageDividerDiagram = lazy(() => import("./VoltageDividerDiagram"));
const CurrentDividerDiagram = lazy(() => import("./CurrentDividerDiagram"));
const RCDiagram = lazy(() => import("./RCDiagram"));
const DiodeDiagram = lazy(() => import("./DiodeDiagram"));
const LEDDiagram = lazy(() => import("./LEDDiagram"));

/** Experiment-id → diagram component mapping. */
const diagramMap: Record<string, ComponentType> = {
  "ohms-law": OhmsLawDiagram,
  "series-circuit": SeriesCircuitDiagram,
  "parallel-circuit": ParallelCircuitDiagram,
  kvl: KVLDiagram,
  kcl: KCLDiagram,
  "voltage-divider": VoltageDividerDiagram,
  "current-divider": CurrentDividerDiagram,
  "rc-circuit": RCDiagram,
  "diode-characteristics": DiodeDiagram,
  "led-circuit": LEDDiagram,
};

interface DiagramRendererProps {
  experimentId: string;
}

/** Renders the matching SVG diagram or null if no diagram exists for this id. */
function DiagramRenderer({ experimentId }: DiagramRendererProps) {
  const Diagram = diagramMap[experimentId];
  if (!Diagram) return null;
  return (
    <Suspense fallback={<div className="detail-diagram-loading">Loading diagram…</div>}>
      <Diagram />
    </Suspense>
  );
}

export default DiagramRenderer;
