/**
 * Graph data from SimulationRun measurements only.
 * Axes are measurable signals (V, I, P, …) — never experiment names.
 * No synthetic sweeps or invented time series.
 */

import type { CircuitDefinition } from './circuitGraph';
import type { DCResult } from './dcSolver';
import type { Measurements, SimulationResult } from './types';

export interface GraphPoint {
  x: number;
  y: number;
}

export interface GraphSeries {
  name: string;
  points: GraphPoint[];
  color?: string;
}

export interface GraphData {
  id: string;
  type: 'line' | 'scatter' | 'bar';
  title: string;
  xAxis: {
    label: string;
    unit: string;
  };
  yAxis: {
    label: string;
    unit: string;
  };
  series: GraphSeries[];
  metadata?: Record<string, unknown>;
}

export type SignalQuantity =
  | 'voltage'
  | 'current'
  | 'power'
  | 'resistance'
  | 'time'
  | 'index';

/** A measurable axis candidate derived from the current SimulationResult. */
export interface MeasurementSignal {
  id: string;
  label: string;
  unit: string;
  quantity: SignalQuantity;
  /** Scalar from this run; null when the quantity is not on this result. */
  value: number | null;
  available: boolean;
  unavailableReason?: string;
}

const COLORS = ['#2563eb', '#dc2626', '#16a34a', '#ca8a04', '#7c3aed', '#0891b2'];

function labelForComponent(
  circuit: CircuitDefinition | undefined,
  componentId: string,
  fallbackType: string,
): string {
  const comp = circuit?.components.find((c) => c.id === componentId);
  return comp?.label || fallbackType || componentId;
}

/**
 * Inspect SimulationResult measurements and list real signal axes.
 * Time is listed but marked unavailable unless the run carries a time series.
 */
export function listAvailableSignals(
  result: Pick<SimulationResult, 'measurements' | 'metadata'> | null | undefined,
  circuit?: CircuitDefinition,
): MeasurementSignal[] {
  const m = result?.measurements;
  if (!m) return [];

  const signals: MeasurementSignal[] = [
    {
      id: 'Vs',
      label: 'Vs (source)',
      unit: 'V',
      quantity: 'voltage',
      value: m.totalVoltage,
      available: Number.isFinite(m.totalVoltage),
    },
    {
      id: 'ΣI',
      label: 'ΣI (total current)',
      unit: 'A',
      quantity: 'current',
      value: m.totalCurrent,
      available: Number.isFinite(m.totalCurrent),
    },
    {
      id: 'P_total',
      label: 'Total power',
      unit: 'W',
      quantity: 'power',
      value: m.totalPower,
      available: Number.isFinite(m.totalPower),
    },
    {
      id: 'Req',
      label: 'Req',
      unit: 'Ω',
      quantity: 'resistance',
      value: m.equivalentResistance,
      available: Number.isFinite(m.equivalentResistance),
    },
    {
      id: 'time',
      label: 'Time',
      unit: 's',
      quantity: 'time',
      value: null,
      available: false,
      unavailableReason: 'No time-series data is available on this SimulationRun (DC solve).',
    },
    {
      id: 'index',
      label: 'Component',
      unit: '',
      quantity: 'index',
      value: 0,
      available: m.componentMeasurements.length > 0,
      unavailableReason:
        m.componentMeasurements.length === 0
          ? 'No component measurements are available.'
          : undefined,
    },
  ];

  let i = 1;
  for (const cm of m.componentMeasurements) {
    const name = labelForComponent(circuit, cm.componentId, cm.type);
    signals.push({
      id: `V_${cm.componentId}`,
      label: `V_${name}`,
      unit: 'V',
      quantity: 'voltage',
      value: cm.voltage,
      available: Number.isFinite(cm.voltage),
    });
    signals.push({
      id: `I_${cm.componentId}`,
      label: `I${i}`,
      unit: 'A',
      quantity: 'current',
      value: cm.current,
      available: Number.isFinite(cm.current),
    });
    signals.push({
      id: `P_${cm.componentId}`,
      label: `P_${name}`,
      unit: 'W',
      quantity: 'power',
      value: cm.power,
      available: Number.isFinite(cm.power),
    });
    if (cm.resistance != null && Number.isFinite(cm.resistance)) {
      signals.push({
        id: `R_${cm.componentId}`,
        label: `R_${name}`,
        unit: 'Ω',
        quantity: 'resistance',
        value: cm.resistance,
        available: true,
      });
    }
    i += 1;
  }

  return signals;
}

export function getSignalById(
  signals: MeasurementSignal[],
  id: string,
): MeasurementSignal | undefined {
  return signals.find((s) => s.id === id);
}

/**
 * Build a plot from selected X/Y signal ids using only this run's measurements.
 * Returns null + reason when the requested data does not exist (never invents points).
 */
export function buildGraphFromSignals(
  measurements: Measurements,
  xSignalId: string,
  ySignalIds: string[],
  circuit?: CircuitDefinition,
): { graph: GraphData | null; unavailableReason?: string } {
  const measurementProbe = { measurements };
  const signals = listAvailableSignals(measurementProbe, circuit);
  const x = getSignalById(signals, xSignalId);
  if (!x) {
    return { graph: null, unavailableReason: `Unknown X-axis signal "${xSignalId}".` };
  }

  const ys = ySignalIds
    .map((id) => getSignalById(signals, id))
    .filter((s): s is MeasurementSignal => Boolean(s));

  if (ys.length === 0) {
    return { graph: null, unavailableReason: 'Select at least one Y-axis signal.' };
  }

  // Time domain is never invented under DC — prefer the specific current-vs-time copy.
  if (x.quantity === 'time') {
    return {
      graph: null,
      unavailableReason: ys.some((y) => y.quantity === 'current')
        ? 'No current-vs-time data is available.'
        : x.unavailableReason ??
          'No time-series data is available on this SimulationRun.',
    };
  }

  if (!x.available) {
    return {
      graph: null,
      unavailableReason:
        x.unavailableReason ??
        `No ${x.label}-axis data is available.`,
    };
  }

  for (const y of ys) {
    if (!y.available) {
      return {
        graph: null,
        unavailableReason: y.unavailableReason ?? `No ${y.label} data is available.`,
      };
    }
  }

  if (x.quantity === 'index') {
    // Bar chart: one bar per component for each Y quantity family
    const comps = measurements.componentMeasurements;
    if (comps.length === 0) {
      return { graph: null, unavailableReason: 'No component measurements are available.' };
    }
    const series: GraphSeries[] = ys.map((y, si) => {
      const points: GraphPoint[] = [];
      comps.forEach((cm, idx) => {
        let val: number | null = null;
        if (y.id.startsWith('V_') && y.id === `V_${cm.componentId}`) val = cm.voltage;
        else if (y.id.startsWith('I_') && y.id === `I_${cm.componentId}`) val = cm.current;
        else if (y.id.startsWith('P_') && y.id === `P_${cm.componentId}`) val = cm.power;
        else if (y.id.startsWith('R_') && y.id === `R_${cm.componentId}`) val = cm.resistance ?? null;
        else if (y.quantity === 'voltage' && y.id.startsWith('V_')) {
          // single-component voltage handled below via y.value
        }
        if (val != null && Number.isFinite(val)) {
          points.push({ x: idx + 1, y: val });
        }
      });
      // If Y is a single component signal, still place it at its index
      if (points.length === 0) {
        const idx = comps.findIndex((cm) => y.id.endsWith(cm.componentId));
        if (idx >= 0 && y.value != null) {
          points.push({ x: idx + 1, y: y.value });
        }
      }
      return { name: y.label, points, color: COLORS[si % COLORS.length] };
    });

    // Better default: if user selected quantity groups via multiple V_* — merge into one series per quantity
    const allVoltage = ys.every((y) => y.quantity === 'voltage' && y.id.startsWith('V_'));
    const allCurrent = ys.every((y) => y.quantity === 'current' && y.id.startsWith('I_'));
    const allPower = ys.every((y) => y.quantity === 'power' && y.id.startsWith('P_'));

    let finalSeries = series.filter((s) => s.points.length > 0);
    if ((allVoltage || allCurrent || allPower) && ys.length === comps.length) {
      const qty = allVoltage ? 'voltage' : allCurrent ? 'current' : 'power';
      finalSeries = [
        {
          name: allVoltage ? 'Voltage' : allCurrent ? 'Current' : 'Power',
          color: COLORS[0],
          points: comps.map((cm, idx) => ({
            x: idx + 1,
            y: qty === 'voltage' ? cm.voltage : qty === 'current' ? cm.current : cm.power,
          })),
        },
      ];
    }

    if (finalSeries.length === 0) {
      return { graph: null, unavailableReason: 'No plottable points for the selected signals.' };
    }

    const yUnit = ys[0].unit;
    const yLabel = ys.map((y) => y.label).join(', ');
    return {
      graph: {
        id: `plot_${xSignalId}_${ySignalIds.join('_')}`,
        type: 'bar',
        title: `${yLabel} vs Component`,
        xAxis: { label: 'Component', unit: '' },
        yAxis: { label: yLabel, unit: yUnit },
        series: finalSeries,
        metadata: {
          source: 'measurements',
          labels: comps.map((cm) => labelForComponent(circuit, cm.componentId, cm.type)),
        },
      },
    };
  }

  // Scalar vs scalar: one measured point per Y against X (honest DC snapshot — not a sweep)
  if (x.value == null || !Number.isFinite(x.value)) {
    return { graph: null, unavailableReason: `No ${x.label} data is available.` };
  }

  const series: GraphSeries[] = ys.map((y, si) => {
    if (y.value == null || !Number.isFinite(y.value)) {
      return { name: y.label, points: [], color: COLORS[si % COLORS.length] };
    }
    return {
      name: y.label,
      points: [{ x: x.value as number, y: y.value }],
      color: COLORS[si % COLORS.length],
    };
  }).filter((s) => s.points.length > 0);

  if (series.length === 0) {
    return { graph: null, unavailableReason: 'No plottable points for the selected signals.' };
  }

  return {
    graph: {
      id: `plot_${xSignalId}_${ySignalIds.join('_')}`,
      type: 'scatter',
      title: `${ys.map((y) => y.label).join(', ')} vs ${x.label}`,
      xAxis: { label: x.label, unit: x.unit },
      yAxis: { label: ys.map((y) => y.label).join(', '), unit: ys[0].unit },
      series,
      metadata: { source: 'measurements', pointCount: series.reduce((n, s) => n + s.points.length, 0) },
    },
  };
}

/**
 * Default graphs attached to a SimulationResult — all derived from measurements.
 * Titles describe signals, not experiment names (KVL/KCL/Ohm's Law).
 */
export function generateGraphsFromMeasurements(
  measurements: Measurements,
  circuit?: CircuitDefinition,
): GraphData[] {
  const graphs: GraphData[] = [];
  const comps = measurements.componentMeasurements;
  if (comps.length === 0) return graphs;

  const labels = comps.map((cm) => labelForComponent(circuit, cm.componentId, cm.type));

  graphs.push({
    id: 'component_voltages',
    type: 'bar',
    title: 'Component voltage',
    xAxis: { label: 'Component', unit: '' },
    yAxis: { label: 'Voltage', unit: 'V' },
    series: [
      {
        name: 'Voltage',
        color: COLORS[0],
        points: comps.map((cm, i) => ({ x: i + 1, y: cm.voltage })),
      },
    ],
    metadata: { source: 'measurements', labels, signals: comps.map((cm) => `V_${cm.componentId}`) },
  });

  graphs.push({
    id: 'component_currents',
    type: 'bar',
    title: 'Component current',
    xAxis: { label: 'Component', unit: '' },
    yAxis: { label: 'Current', unit: 'A' },
    series: [
      {
        name: 'Current',
        color: COLORS[1],
        points: comps.map((cm, i) => ({ x: i + 1, y: cm.current })),
      },
    ],
    metadata: {
      source: 'measurements',
      labels,
      signals: comps.map((_, i) => `I${i + 1}`),
    },
  });

  graphs.push({
    id: 'component_power',
    type: 'bar',
    title: 'Component power',
    xAxis: { label: 'Component', unit: '' },
    yAxis: { label: 'Power', unit: 'W' },
    series: [
      {
        name: 'Power',
        color: COLORS[2],
        points: comps.map((cm, i) => ({ x: i + 1, y: cm.power })),
      },
    ],
    metadata: { source: 'measurements', labels },
  });

  // Measured V–I points (one per component) — not a fabricated Ohm sweep
  graphs.push({
    id: 'measured_vi',
    type: 'scatter',
    title: 'Measured V–I',
    xAxis: { label: 'Voltage', unit: 'V' },
    yAxis: { label: 'Current', unit: 'A' },
    series: [
      {
        name: 'Components',
        color: COLORS[0],
        points: comps.map((cm) => ({ x: cm.voltage, y: cm.current })),
      },
    ],
    metadata: { source: 'measurements', labels },
  });

  // KVL-style voltage set: Vs + each V_comp + sum of component voltages
  const sumV = comps.reduce((s, cm) => s + cm.voltage, 0);
  const kvlPoints: GraphPoint[] = [
    { x: 1, y: measurements.totalVoltage },
    ...comps.map((cm, i) => ({ x: i + 2, y: cm.voltage })),
    { x: comps.length + 2, y: sumV },
  ];
  const kvlLabels = ['Vs', ...labels.map((l) => `V_${l}`), 'ΣV'];
  graphs.push({
    id: 'voltage_signals',
    type: 'bar',
    title: 'Voltage signals (Vs, Vn, ΣV)',
    xAxis: { label: 'Signal', unit: '' },
    yAxis: { label: 'Voltage', unit: 'V' },
    series: [{ name: 'Voltage', color: COLORS[0], points: kvlPoints }],
    metadata: { source: 'measurements', labels: kvlLabels },
  });

  // KCL-style current set: each In + ΣI
  const kclPoints: GraphPoint[] = [
    ...comps.map((cm, i) => ({ x: i + 1, y: cm.current })),
    { x: comps.length + 1, y: measurements.totalCurrent },
  ];
  const kclLabels = [...comps.map((_, i) => `I${i + 1}`), 'ΣI'];
  graphs.push({
    id: 'current_signals',
    type: 'bar',
    title: 'Current signals (In, ΣI)',
    xAxis: { label: 'Signal', unit: '' },
    yAxis: { label: 'Current', unit: 'A' },
    series: [{ name: 'Current', color: COLORS[1], points: kclPoints }],
    metadata: { source: 'measurements', labels: kclLabels },
  });

  return graphs;
}

/**
 * @deprecated Use generateGraphsFromMeasurements — kept as a name alias for callers.
 * Intentionally ignores DC topology sweeps; only measurements are plotted.
 */
export function generateAllGraphs(
  circuit: CircuitDefinition,
  _dcResult: DCResult,
  measurements?: Measurements,
): GraphData[] {
  if (measurements) {
    return generateGraphsFromMeasurements(measurements, circuit);
  }
  return [];
}

export function validateGraphData(graph: GraphData): boolean {
  if (!graph.id || !graph.series?.length) return false;
  if (!graph.xAxis?.label || !graph.yAxis?.label) return false;
  return graph.series.every(
    (s) =>
      s.name &&
      Array.isArray(s.points) &&
      s.points.every((p) => Number.isFinite(p.x) && Number.isFinite(p.y)),
  );
}

export function getGraphById(graphs: GraphData[], id: string): GraphData | undefined {
  return graphs.find((g) => g.id === id);
}
