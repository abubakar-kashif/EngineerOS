/**
 * Graph data from SimulationRun measurements only.
 * Axes are measurable signals (V, I, P, …) — never experiment names.
 * No synthetic sweeps or invented time series.
 */

import type { CircuitDefinition } from './circuitGraph';
import type { DCResult } from './dcSolver';
import type { Measurements, SimulationResult } from './types';
import { resolveComponentReference } from '../componentReference';

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
  /** Set when this catalog slot has no real points (never filled with synthetic data). */
  unavailableReason?: string;
}

/** Empty-state copy for missing SimulationRun data. */
export const NO_MEASUREMENT_DATA = 'No measurement data available';

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

const METER_TYPES = new Set(['voltmeter', 'ammeter', 'ohmmeter', 'power_meter']);

function hasRunTimeSeries(m: Measurements): boolean {
  return Array.isArray(m.timeSeries) && m.timeSeries.length > 0;
}

function isPhysicalMeasurement(cm: Measurements['componentMeasurements'][number]): boolean {
  if (cm.componentId.startsWith('__')) return false;
  if (METER_TYPES.has(cm.type)) return false;
  return true;
}

function isPassiveDrop(cm: Measurements['componentMeasurements'][number]): boolean {
  return isPhysicalMeasurement(cm) && cm.type !== 'voltage_source' && cm.type !== 'current_source';
}

/** True when a catalog/custom graph has real plottable points from this SimulationRun. */
export function graphHasRenderableData(graph: GraphData): boolean {
  if (graph.unavailableReason) return false;
  return Boolean(graph.series?.some((s) => s.points.length > 0));
}

/**
 * Graph options backed by real measurement data only.
 * Empty catalog placeholders (RC with no time series, divider without R2, …) are omitted.
 */
export function selectAvailableGraphs(
  graphs: GraphData[] | null | undefined,
): GraphData[] {
  return (graphs ?? []).filter(graphHasRenderableData);
}

function emptyCatalogGraph(
  id: string,
  title: string,
  xAxis: GraphData['xAxis'],
  yAxis: GraphData['yAxis'],
  type: GraphData['type'] = 'line',
): GraphData {
  return {
    id,
    type,
    title,
    xAxis,
    yAxis,
    series: [{ name: yAxis.label, points: [], color: COLORS[0] }],
    metadata: { source: 'measurements', empty: true },
    unavailableReason: NO_MEASUREMENT_DATA,
  };
}

function labelForComponent(
  circuit: CircuitDefinition | undefined,
  componentId: string,
  fallbackType: string,
): string {
  return resolveComponentReference(circuit, componentId, fallbackType);
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
      available: hasRunTimeSeries(m),
      unavailableReason: hasRunTimeSeries(m)
        ? undefined
        : 'No time-series data is available on this SimulationRun (DC solve).',
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

  for (const cm of m.componentMeasurements) {
    // Instruments / synthetic rows are not user graph axes.
    if (!isPhysicalMeasurement(cm)) continue;
    const name = labelForComponent(circuit, cm.componentId, cm.type);
    signals.push({
      id: `V_${cm.componentId}`,
      label: `Voltage — ${name}`,
      unit: 'V',
      quantity: 'voltage',
      value: cm.voltage,
      available: Number.isFinite(cm.voltage),
    });
    signals.push({
      id: `I_${cm.componentId}`,
      label: `Current — ${name}`,
      unit: 'A',
      quantity: 'current',
      value: cm.current,
      available: Number.isFinite(cm.current),
    });
    signals.push({
      id: `P_${cm.componentId}`,
      label: `Power — ${name}`,
      unit: 'W',
      quantity: 'power',
      value: cm.power,
      available: Number.isFinite(cm.power),
    });
    if (cm.resistance != null && Number.isFinite(cm.resistance)) {
      signals.push({
        id: `R_${cm.componentId}`,
        label: `Resistance — ${name}`,
        unit: 'Ω',
        quantity: 'resistance',
        value: cm.resistance,
        available: true,
      });
    }
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

  // Time domain: plot only a real SimulationRun time series. Never invent a DC charging curve.
  if (x.quantity === 'time') {
    if (!hasRunTimeSeries(measurements)) {
      return {
        graph: null,
        unavailableReason: ys.some((y) => y.quantity === 'current')
          ? 'No current-vs-time data is available.'
          : NO_MEASUREMENT_DATA,
      };
    }
    const series: GraphSeries[] = ys.map((y, si) => ({
      name: y.label,
      color: COLORS[si % COLORS.length],
      points: measurements.timeSeries!
        .map((sample) => {
          const yVal = sample.values[y.id];
          return Number.isFinite(sample.t) && Number.isFinite(yVal)
            ? { x: sample.t, y: yVal as number }
            : null;
        })
        .filter((p): p is GraphPoint => p !== null),
    })).filter((s) => s.points.length > 0);
    if (series.length === 0) {
      return { graph: null, unavailableReason: NO_MEASUREMENT_DATA };
    }
    return {
      graph: {
        id: `plot_time_${ySignalIds.join('_')}`,
        type: 'line',
        title: `${ys.map((y) => y.label).join(', ')} vs Time`,
        xAxis: { label: 'Time', unit: 's' },
        yAxis: { label: ys.map((y) => y.label).join(', '), unit: ys[0].unit },
        series,
        metadata: { source: 'measurements', timeSeries: true },
      },
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
 * Catalog slots that lack real data are still produced as empty placeholders for
 * validation; UI should use selectAvailableGraphs() so empty presets are not offered.
 */
export function generateGraphsFromMeasurements(
  measurements: Measurements,
  circuit?: CircuitDefinition,
): GraphData[] {
  const graphs: GraphData[] = [];
  const allComps = measurements.componentMeasurements;
  const physical = allComps.filter(isPhysicalMeasurement);
  const drops = allComps.filter(isPassiveDrop);
  const resistors = drops.filter((cm) => cm.type === 'resistor');

  const ohmsOk =
    Number.isFinite(measurements.totalVoltage) && Number.isFinite(measurements.totalCurrent);
  if (ohmsOk) {
    graphs.push({
      id: 'ohms_law',
      type: 'scatter',
      title: "Ohm's Law (Voltage vs Current)",
      xAxis: { label: 'Voltage', unit: 'V' },
      yAxis: { label: 'Current', unit: 'A' },
      series: [
        {
          name: 'Measured V–I',
          color: COLORS[0],
          points: [{ x: measurements.totalVoltage, y: measurements.totalCurrent }],
        },
      ],
      metadata: { source: 'measurements', pointCount: 1 },
    });
  } else {
    graphs.push(
      emptyCatalogGraph(
        'ohms_law',
        "Ohm's Law (Voltage vs Current)",
        { label: 'Voltage', unit: 'V' },
        { label: 'Current', unit: 'A' },
        'scatter',
      ),
    );
  }

  const r2 =
    resistors.find((cm) => {
      const name = labelForComponent(circuit, cm.componentId, cm.type);
      return cm.componentId === 'R2' || name === 'R2';
    }) ?? (resistors.length >= 2 ? resistors[1] : undefined);
  const r2Circuit = circuit?.components.find((c) => c.id === r2?.componentId);
  const r2Ohms = r2Circuit?.properties?.resistance ?? r2?.resistance;
  if (r2 && r2Ohms != null && Number.isFinite(r2Ohms) && Number.isFinite(r2.voltage)) {
    graphs.push({
      id: 'voltage_divider',
      type: 'scatter',
      title: 'Voltage Divider (R2 vs Vout)',
      xAxis: { label: 'R2', unit: 'Ω' },
      yAxis: { label: 'Vout', unit: 'V' },
      series: [
        {
          name: 'Vout',
          color: COLORS[0],
          points: [{ x: r2Ohms, y: r2.voltage }],
        },
      ],
      metadata: { source: 'measurements', r2Id: r2.componentId, pointCount: 1 },
    });
  } else {
    graphs.push(
      emptyCatalogGraph(
        'voltage_divider',
        'Voltage Divider (R2 vs Vout)',
        { label: 'R2', unit: 'Ω' },
        { label: 'Vout', unit: 'V' },
        'scatter',
      ),
    );
  }

  const cap = physical.find((cm) => cm.type === 'capacitor');
  const rcPoints =
    cap && hasRunTimeSeries(measurements)
      ? measurements.timeSeries!
          .map((sample) => {
            const vc =
              sample.values[`V_${cap.componentId}`] ??
              sample.values.vc ??
              sample.values.capacitorVoltage;
            return Number.isFinite(sample.t) && Number.isFinite(vc)
              ? { x: sample.t, y: vc as number }
              : null;
          })
          .filter((p): p is GraphPoint => p !== null)
      : [];
  if (rcPoints.length > 0) {
    graphs.push({
      id: 'rc_time',
      type: 'line',
      title: 'RC (Time vs Capacitor voltage)',
      xAxis: { label: 'Time', unit: 's' },
      yAxis: { label: 'Capacitor voltage', unit: 'V' },
      series: [{ name: 'Vc', color: COLORS[0], points: rcPoints }],
      metadata: { source: 'measurements', timeSeries: true },
    });
  } else {
    graphs.push(
      emptyCatalogGraph(
        'rc_time',
        'RC (Time vs Capacitor voltage)',
        { label: 'Time', unit: 's' },
        { label: 'Capacitor voltage', unit: 'V' },
      ),
    );
  }

  if (drops.length > 0) {
    const kclPoints: GraphPoint[] = [
      ...drops.map((cm, i) => ({ x: i + 1, y: cm.current })),
      { x: drops.length + 1, y: measurements.totalCurrent },
    ];
    const kclLabels = [
      ...drops.map((cm) => {
        const name = labelForComponent(circuit, cm.componentId, cm.type);
        return `I_${name}`;
      }),
      'ΣI',
    ];
    graphs.push({
      id: 'current_signals',
      type: 'bar',
      title: `KCL (${kclLabels.join(', ')})`,
      xAxis: { label: 'Signal', unit: '' },
      yAxis: { label: 'Current', unit: 'A' },
      series: [{ name: 'Current', color: COLORS[1], points: kclPoints }],
      metadata: { source: 'measurements', labels: kclLabels },
    });
  } else {
    graphs.push(
      emptyCatalogGraph(
        'current_signals',
        'KCL (component currents, ΣI)',
        { label: 'Signal', unit: '' },
        { label: 'Current', unit: 'A' },
        'bar',
      ),
    );
  }

  if (Number.isFinite(measurements.totalVoltage)) {
    const sumV = drops.reduce((s, cm) => s + cm.voltage, 0);
    const kvlPoints: GraphPoint[] = [
      { x: 1, y: measurements.totalVoltage },
      ...drops.map((cm, i) => ({ x: i + 2, y: cm.voltage })),
      { x: drops.length + 2, y: sumV },
    ];
    const dropLabels = drops.map((cm) => {
      const name = labelForComponent(circuit, cm.componentId, cm.type);
      return `V_${name}`;
    });
    const kvlLabels = ['Vs', ...dropLabels, 'ΣV'];
    graphs.push({
      id: 'voltage_signals',
      type: 'bar',
      title: `KVL (${kvlLabels.join(', ')})`,
      xAxis: { label: 'Signal', unit: '' },
      yAxis: { label: 'Voltage', unit: 'V' },
      series: [{ name: 'Voltage', color: COLORS[0], points: kvlPoints }],
      metadata: { source: 'measurements', labels: kvlLabels },
    });
  } else {
    graphs.push(
      emptyCatalogGraph(
        'voltage_signals',
        'KVL (Vs, VR1, VR2, ΣV)',
        { label: 'Signal', unit: '' },
        { label: 'Voltage', unit: 'V' },
        'bar',
      ),
    );
  }

  const powerPoints =
    hasRunTimeSeries(measurements)
      ? measurements.timeSeries!
          .map((sample) => {
            const p = sample.values.P_total ?? sample.values.power;
            return Number.isFinite(sample.t) && Number.isFinite(p)
              ? { x: sample.t, y: p as number }
              : null;
          })
          .filter((p): p is GraphPoint => p !== null)
      : [];
  if (powerPoints.length > 0) {
    graphs.push({
      id: 'power_time',
      type: 'line',
      title: 'Power vs Time',
      xAxis: { label: 'Time', unit: 's' },
      yAxis: { label: 'Power', unit: 'W' },
      series: [{ name: 'Power', color: COLORS[2], points: powerPoints }],
      metadata: { source: 'measurements', timeSeries: true },
    });
  } else {
    graphs.push(
      emptyCatalogGraph(
        'power_time',
        'Power vs Time',
        { label: 'Time', unit: 's' },
        { label: 'Power', unit: 'W' },
      ),
    );
  }

  if (drops.length === 0) return graphs;

  const labels = drops.map((cm) => labelForComponent(circuit, cm.componentId, cm.type));

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
        points: drops.map((cm, i) => ({ x: i + 1, y: cm.voltage })),
      },
    ],
    metadata: { source: 'measurements', labels, signals: drops.map((cm) => `V_${cm.componentId}`) },
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
        points: drops.map((cm, i) => ({ x: i + 1, y: cm.current })),
      },
    ],
    metadata: {
      source: 'measurements',
      labels,
      signals: drops.map((cm) => `I_${cm.componentId}`),
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
        points: drops.map((cm, i) => ({ x: i + 1, y: cm.power })),
      },
    ],
    metadata: { source: 'measurements', labels },
  });

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
        points: drops.map((cm) => ({ x: cm.voltage, y: cm.current })),
      },
    ],
    metadata: { source: 'measurements', labels },
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
  if (!graph.id || !graph.xAxis?.label || !graph.yAxis?.label) return false;
  if (graph.unavailableReason) {
    return graph.series.every((s) => Array.isArray(s.points) && s.points.length === 0);
  }
  if (!graph.series?.length) return false;
  return graph.series.every(
    (s) =>
      s.name &&
      Array.isArray(s.points) &&
      s.points.length > 0 &&
      s.points.every((p) => Number.isFinite(p.x) && Number.isFinite(p.y)),
  );
}

export function getGraphById(graphs: GraphData[], id: string): GraphData | undefined {
  return graphs.find((g) => g.id === id);
}
