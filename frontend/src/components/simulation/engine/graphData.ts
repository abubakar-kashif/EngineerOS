/**
 * Graph data from SimulationRun measurements only.
 * Axes are measurable signals (V, I, P, …) — never experiment names.
 * No invented time series. Parameter sweeps (e.g. Wheatstone R4) use real solveDC runs.
 */

import type { CircuitDefinition } from './circuitGraph';
import type { DCResult } from './dcSolver';
import { solveDC } from './dcSolver';
import type { Measurements, SimulationResult } from './types';
import {
  extractWheatstoneMetrics,
  findWheatstoneArms,
  wheatstoneRatioSweep,
} from './wheatstoneAnalysis';
import {
  extractPotentiometerMetrics,
  findPotentiometer,
  potentiometerWiperSweep,
} from './potentiometerAnalysis';
import { extractSuperpositionMetrics } from './superpositionAnalysis';
import { extractTheveninMetrics } from './theveninAnalysis';
import { extractNortonMetrics } from './nortonAnalysis';
import { extractMaxPowerTransferMetrics } from './maxPowerTransferAnalysis';
import { isAcVoltageSource } from './acSolver';

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

/** User-facing fallback when a measurement id is not in the live circuit. */
export const UNKNOWN_COMPONENT_LABEL = 'Unknown component';

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

function measurementBelongsToCircuit(
  cm: Measurements['componentMeasurements'][number],
  circuit?: CircuitDefinition,
): boolean {
  if (!isPhysicalMeasurement(cm)) return false;
  if (!circuit) return true;
  return circuit.components.some((c) => c.id === cm.componentId);
}

function plottableComponentMeasurements(
  measurements: Measurements,
  circuit?: CircuitDefinition,
): Measurements['componentMeasurements'] {
  return measurements.componentMeasurements.filter((cm) =>
    measurementBelongsToCircuit(cm, circuit),
  );
}

/** True when a graph contains real SimulationRun points (not an empty catalog slot). */
export function graphHasRealData(graph: GraphData): boolean {
  if (graph.unavailableReason) return false;
  return graph.series.some((s) => s.points.length > 0);
}

/** Selector list: only graphs that actually have measurement points. */
export function selectableGraphs(graphs: GraphData[] | null | undefined): GraphData[] {
  return (graphs ?? []).filter(graphHasRealData);
}

/**
 * User-facing component reference. Looks up circuit.components[].label by id.
 * Does not mutate ids, topology, or measurements.
 */
export function labelForComponent(
  circuit: CircuitDefinition | undefined,
  componentId: string,
  fallbackType?: string,
): string {
  if (componentId.startsWith('__')) {
    return (fallbackType || 'instrument').replace(/_/g, ' ');
  }
  const comp = circuit?.components.find((c) => c.id === componentId);
  const label = typeof comp?.label === 'string' ? comp.label.trim() : '';
  if (label) return label;
  if (!circuit && /^[A-Za-z]+\d+$/.test(componentId)) return componentId;
  return UNKNOWN_COMPONENT_LABEL;
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

  const plottable = plottableComponentMeasurements(m, circuit);
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
  ];

  if (hasRunTimeSeries(m)) {
    signals.push({
      id: 'time',
      label: 'Time',
      unit: 's',
      quantity: 'time',
      value: null,
      available: true,
    });
  }

  signals.push({
    id: 'index',
    label: 'Component',
    unit: '',
    quantity: 'index',
    value: 0,
    available: plottable.length > 0,
    unavailableReason:
      plottable.length === 0 ? 'No component measurements are available.' : undefined,
  });

  for (const cm of plottable) {
    const name = labelForComponent(circuit, cm.componentId, cm.type);
    signals.push({
      id: `V_${cm.componentId}`,
      label: `V(${name})`,
      unit: 'V',
      quantity: 'voltage',
      value: cm.voltage,
      available: Number.isFinite(cm.voltage),
    });
    signals.push({
      id: `I_${cm.componentId}`,
      label: `I(${name})`,
      unit: 'A',
      quantity: 'current',
      value: cm.current,
      available: Number.isFinite(cm.current),
    });
    signals.push({
      id: `P_${cm.componentId}`,
      label: `P(${name})`,
      unit: 'W',
      quantity: 'power',
      value: cm.power,
      available: Number.isFinite(cm.power),
    });
    if (cm.resistance != null && Number.isFinite(cm.resistance)) {
      signals.push({
        id: `R_${cm.componentId}`,
        label: `R(${name})`,
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
    if (xSignalId === 'time') {
      return {
        graph: null,
        unavailableReason: ySignalIds.some((id) => id.startsWith('I_') || id === 'ΣI')
          ? 'No current-vs-time data is available.'
          : NO_MEASUREMENT_DATA,
      };
    }
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

/** Graphs that belong to one lab. Other experiments keep their own plots. */
const GRAPH_OWNERS: Record<string, readonly string[]> = {
  ohms_law: ["ohms-law", "series-circuit", "parallel-circuit"],
  current_signals: ["kcl", "parallel-circuit", "current-divider"],
  voltage_signals: ["kvl", "series-circuit", "voltage-divider"],
  thevenin_comparison: ["thevenin-theorem"],
  norton_comparison: ["norton-theorem"],
  max_power_transfer: ["maximum-power-transfer"],
  wheatstone_bridge: ["wheatstone-bridge"],
  wheatstone_bridge_nodes: ["wheatstone-bridge"],
  superposition_comparison: ["superposition-theorem"],
  voltage_divider: ["voltage-divider"],
  potentiometer_wiper: ["potentiometer"],
  component_voltages: [
    "ohms-law", "series-circuit", "parallel-circuit", "kvl", "kcl",
    "voltage-divider", "current-divider", "wheatstone-bridge",
    "thevenin-theorem", "norton-theorem", "superposition-theorem",
    "maximum-power-transfer", "potentiometer",
  ],
  component_currents: [
    "ohms-law", "series-circuit", "parallel-circuit", "kvl", "kcl",
    "voltage-divider", "current-divider", "wheatstone-bridge",
    "thevenin-theorem", "norton-theorem", "superposition-theorem",
    "maximum-power-transfer", "potentiometer",
  ],
  component_power: [
    "ohms-law", "series-circuit", "parallel-circuit", "kvl", "kcl",
    "voltage-divider", "current-divider", "wheatstone-bridge",
    "thevenin-theorem", "norton-theorem", "superposition-theorem",
    "maximum-power-transfer", "potentiometer",
  ],
  measured_vi: [
    "ohms-law", "series-circuit", "parallel-circuit", "kvl", "kcl",
    "voltage-divider", "current-divider", "wheatstone-bridge",
    "thevenin-theorem", "norton-theorem", "superposition-theorem",
    "maximum-power-transfer", "potentiometer",
  ],
  power_time: [
    "rc-circuit", "rl-circuit", "rlc-circuit", "capacitor-charging",
    "half-wave-rectifier", "full-wave-bridge-rectifier",
  ],
};

/** Drop theorem and DC bar charts that do not belong to this experiment. */
function graphsForExperiment(graphs: GraphData[], experimentId?: string): GraphData[] {
  if (!experimentId) return graphs;
  return graphs.filter((graph) => {
    const owners = GRAPH_OWNERS[graph.id];
    return !owners || owners.includes(experimentId);
  });
}

/**
 * Default graphs attached to a SimulationResult — derived from this run only.
 * Experiment catalog slots are included only when the required components and
 * measurement points actually exist (never as empty placeholders).
 */
export function generateGraphsFromMeasurements(
  measurements: Measurements,
  circuit?: CircuitDefinition,
): GraphData[] {
  const graphs: GraphData[] = [];
  const physical = plottableComponentMeasurements(measurements, circuit);
  const drops = physical.filter(isPassiveDrop);
  const resistors = drops.filter((cm) => cm.type === 'resistor');

  const fs = measurements.frequencySweep;
  const sr = measurements.seriesResonance;
  const lp = measurements.rcLowPass;
  if (fs && fs.response.length >= 2) {
    const peakSeries =
      sr && fs.peakCurrentFrequency != null && fs.peakCurrentMag != null
        ? [
            {
              name: 'Simulated f₀ (max |I|)',
              color: COLORS[2] ?? COLORS[1],
              points: [
                { x: fs.peakCurrentFrequency, y: fs.peakCurrentMag },
              ],
            },
          ]
        : [];
    graphs.push({
      id: 'frequency_response',
      type: 'line',
      title: 'Frequency vs Circuit Current',
      xAxis: { label: 'Frequency', unit: 'Hz' },
      yAxis: { label: 'Circuit current', unit: 'A' },
      series: [
        {
          name: '|I| (AC solve)',
          color: COLORS[0],
          points: fs.response.map((p) => ({ x: p.frequency, y: p.currentMag })),
        },
        ...peakSeries,
      ],
      metadata: {
        source: 'ac_frequency_sweep',
        pointCount: fs.response.length,
        fStart: fs.fStart,
        fStop: fs.fStop,
        scale: fs.scale,
        step: fs.step,
        amplitude: fs.amplitude,
        probeId: fs.probeId,
        peakCurrentFrequency: fs.peakCurrentFrequency,
        peakCurrentMag: fs.peakCurrentMag,
        peakVoltageFrequency: fs.peakVoltageFrequency,
        peakVoltageMag: fs.peakVoltageMag,
        f0Theoretical: sr?.f0Theoretical,
        f0Simulated: sr?.f0Simulated,
        errorPercent: sr?.errorPercent,
        bandwidth: sr?.bandwidth,
        Q: sr?.Q,
        gainSeries: fs.response.map((p) => ({ x: p.frequency, y: p.gain })),
        impedanceSeries: fs.response.map((p) => ({
          x: p.frequency,
          y: p.impedanceMag,
        })),
      },
    });
    const theoreticalGain =
      lp && lp.fcTheoretical > 0
        ? [
            {
              name: 'Theoretical |H|',
              color: COLORS[3] ?? COLORS[0],
              points: fs.response.map((p) => {
                const ratio = p.frequency / lp.fcTheoretical;
                return { x: p.frequency, y: 1 / Math.sqrt(1 + ratio * ratio) };
              }),
            },
          ]
        : [];
    const cutoffMarkers = lp
      ? [
          ...(lp.fcSimulated != null
            ? [
                {
                  name: 'Simulated fc (gain = 1/√2)',
                  color: COLORS[2] ?? COLORS[1],
                  points: [{ x: lp.fcSimulated, y: 1 / Math.sqrt(2) }],
                },
              ]
            : []),
          {
            name: 'Theoretical fc',
            color: COLORS[4] ?? COLORS[0],
            points: [{ x: lp.fcTheoretical, y: 1 / Math.sqrt(2) }],
          },
        ]
      : [];
    graphs.push({
      id: 'frequency_response_gain',
      type: 'line',
      title: 'Frequency Response (|Vout|/|Vin|)',
      xAxis: { label: 'Frequency', unit: 'Hz' },
      yAxis: { label: 'Voltage gain', unit: '' },
      series: [
        {
          name: 'Simulated |Vout|/|Vin|',
          color: COLORS[1],
          points: fs.response.map((p) => ({ x: p.frequency, y: p.gain })),
        },
        ...theoreticalGain,
        ...cutoffMarkers,
      ],
      metadata: {
        source: 'ac_frequency_sweep',
        pointCount: fs.response.length,
        probeId: fs.probeId,
        fcTheoretical: lp?.fcTheoretical,
        fcSimulated: lp?.fcSimulated,
      },
    });
    if (lp) {
      graphs.push({
        id: 'rc_low_pass_phase',
        type: 'line',
        title: 'Phase vs Frequency',
        xAxis: { label: 'Frequency', unit: 'Hz' },
        yAxis: { label: 'Phase', unit: 'deg' },
        series: [
          {
            name: 'Simulated phase',
            color: COLORS[0],
            points: fs.response.map((p) => ({ x: p.frequency, y: p.phaseDeg })),
          },
          {
            name: 'Theoretical phase',
            color: COLORS[3] ?? COLORS[1],
            points: fs.response.map((p) => ({
              x: p.frequency,
              y: (-Math.atan2(p.frequency, lp.fcTheoretical) * 180) / Math.PI,
            })),
          },
        ],
        metadata: {
          source: 'ac_frequency_sweep',
          pointCount: fs.response.length,
          fcTheoretical: lp.fcTheoretical,
          fcSimulated: lp.fcSimulated,
        },
      });
    }
  }

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
  }

  const r2 = resistors.find((cm) => {
    const name = labelForComponent(circuit, cm.componentId, cm.type);
    return cm.componentId === 'R2' || name === 'R2';
  });
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
  }

  if (circuit) {
    const pot = findPotentiometer(circuit);
    if (pot) {
      const dc = solveDC(circuit);
      const metrics = extractPotentiometerMetrics(circuit, dc);
      if (metrics) {
        const sweep = potentiometerWiperSweep(circuit, pot.id, 11);
        if (sweep.length >= 2) {
          graphs.push({
            id: 'potentiometer_wiper',
            type: 'line',
            title: 'Potentiometer (Wiper position vs Vout)',
            xAxis: { label: 'Wiper position α', unit: '' },
            yAxis: { label: 'Vout', unit: 'V' },
            series: [
              {
                name: 'Vout (solved)',
                color: COLORS[1],
                points: sweep.map((p) => ({ x: p.alpha, y: p.vout })),
              },
              {
                name: 'Operating point',
                color: COLORS[0],
                points: [{ x: metrics.wiperPosition, y: metrics.vout }],
              },
            ],
            metadata: {
              source: 'dc_sweep',
              pointCount: sweep.length,
              theoreticalVout: metrics.theoreticalVout,
            },
          });
        }
      }
    }

    const arms = findWheatstoneArms(circuit);
    if (arms) {
      const dc = solveDC(circuit);
      const metrics = extractWheatstoneMetrics(circuit, dc, measurements);
      if (metrics) {
        graphs.push({
          id: 'wheatstone_bridge_nodes',
          type: 'bar',
          title: 'Wheatstone Bridge (Vleft, Vright, Vout)',
          xAxis: { label: 'Signal', unit: '' },
          yAxis: { label: 'Voltage', unit: 'V' },
          series: [
            {
              name: 'Bridge voltages',
              color: COLORS[0],
              points: [
                { x: 1, y: metrics.vleft },
                { x: 2, y: metrics.vright },
                { x: 3, y: metrics.vout },
              ],
            },
          ],
          metadata: {
            source: 'measurements',
            labels: ['Vleft', 'Vright', 'Vout'],
            balanced: metrics.balanced,
          },
        });

        const sweep = wheatstoneRatioSweep(circuit, arms, 11);
        if (sweep.length >= 2) {
          graphs.push({
            id: 'wheatstone_bridge',
            type: 'line',
            title: 'Wheatstone Bridge (R3/R4 ratio vs Vout)',
            xAxis: { label: 'Resistance ratio R3/R4', unit: '' },
            yAxis: { label: 'Bridge output Vout', unit: 'V' },
            series: [
              {
                name: 'Vout (solved)',
                color: COLORS[1],
                points: sweep.map((p) => ({ x: p.ratio, y: p.vout })),
              },
              {
                name: 'Operating point',
                color: COLORS[0],
                points: [{ x: metrics.ratioRight, y: metrics.vout }],
              },
            ],
            metadata: {
              source: 'dc_sweep',
              pointCount: sweep.length,
              operatingR4: metrics.r4,
            },
          });
        }
      }
    }

    const superposition = extractSuperpositionMetrics(circuit);
    if (superposition) {
      const labels = [
        'Full',
        ...superposition.contributions.map((c) => c.activeSourceIds[0] ?? c.label),
        'Sum',
      ];
      graphs.push({
        id: 'superposition_comparison',
        type: 'bar',
        title: 'Superposition (full vs contributions)',
        xAxis: { label: 'State', unit: '' },
        yAxis: { label: 'Vout', unit: 'V' },
        series: [
          {
            name: 'Vout',
            color: COLORS[0],
            points: [
              { x: 1, y: superposition.full.vout },
              ...superposition.contributions.map((c, i) => ({
                x: i + 2,
                y: c.vout,
              })),
              {
                x: superposition.contributions.length + 2,
                y: superposition.sumContributions,
              },
            ],
          },
        ],
        metadata: {
          source: 'dc_superposition',
          labels,
          loadId: superposition.loadId,
          fullVout: superposition.full.vout,
          fullILoad: superposition.full.iLoad,
          contributions: superposition.contributions.map((c) => ({
            label: c.label,
            activeSourceIds: c.activeSourceIds,
            vout: c.vout,
            iLoad: c.iLoad,
          })),
          sumContributions: superposition.sumContributions,
          difference: superposition.difference,
          errorPercent: superposition.errorPercent,
          sources: superposition.sources,
        },
      });
    }

    const expId = circuit.experimentId;
    const thevenin = extractTheveninMetrics(circuit);
    if (
      thevenin &&
      expId !== 'norton-theorem' &&
      expId !== 'maximum-power-transfer'
    ) {
      graphs.push({
        id: 'thevenin_comparison',
        type: 'bar',
        title: 'Thévenin (original vs equivalent)',
        xAxis: { label: 'Quantity', unit: '' },
        yAxis: { label: 'Value', unit: '' },
        series: [
          {
            name: 'Comparison',
            color: COLORS[0],
            points: [
              { x: 1, y: thevenin.originalIL },
              { x: 2, y: thevenin.theveninIL },
              { x: 3, y: thevenin.originalVL },
              { x: 4, y: thevenin.theveninVL },
            ],
          },
        ],
        metadata: {
          source: 'dc_thevenin',
          labels: ['Original IL', 'Thevenin IL', 'Original VL', 'Thevenin VL'],
          vth: thevenin.vth,
          rth: thevenin.rth,
          rl: thevenin.rl,
          originalVL: thevenin.originalVL,
          originalIL: thevenin.originalIL,
          theveninVL: thevenin.theveninVL,
          theveninIL: thevenin.theveninIL,
          differenceIL: thevenin.differenceIL,
          errorPercentIL: thevenin.errorPercentIL,
        },
      });
    }

    const norton = extractNortonMetrics(circuit);
    if (
      norton &&
      expId !== 'thevenin-theorem' &&
      expId !== 'maximum-power-transfer'
    ) {
      graphs.push({
        id: 'norton_comparison',
        type: 'bar',
        title: 'Norton (original vs equivalent)',
        xAxis: { label: 'Quantity', unit: '' },
        yAxis: { label: 'Value', unit: '' },
        series: [
          {
            name: 'Comparison',
            color: COLORS[1],
            points: [
              { x: 1, y: norton.originalIL },
              { x: 2, y: norton.nortonIL },
              { x: 3, y: norton.originalVL },
              { x: 4, y: norton.nortonVL },
            ],
          },
        ],
        metadata: {
          source: 'dc_norton',
          labels: ['Original IL', 'Norton IL', 'Original VL', 'Norton VL'],
          inorton: norton.inorton,
          rn: norton.rn,
          rl: norton.rl,
          originalVL: norton.originalVL,
          originalIL: norton.originalIL,
          nortonVL: norton.nortonVL,
          nortonIL: norton.nortonIL,
          differenceIL: norton.differenceIL,
          errorPercentIL: norton.errorPercentIL,
        },
      });
    }

    const mpt = extractMaxPowerTransferMetrics(circuit);
    if (
      mpt &&
      expId !== 'thevenin-theorem' &&
      expId !== 'norton-theorem'
    ) {
      graphs.push({
        id: 'max_power_transfer',
        type: 'line',
        title: 'Maximum Power Transfer (RL vs PL)',
        xAxis: { label: 'Load resistance RL', unit: 'Ω' },
        yAxis: { label: 'Load power PL', unit: 'W' },
        series: [
          {
            name: 'PL (solved)',
            color: COLORS[0],
            points: mpt.sweep.map((p) => ({ x: p.rl, y: p.pl })),
          },
          {
            name: 'Operating point',
            color: COLORS[1],
            points: [{ x: mpt.rl, y: mpt.pl }],
          },
          {
            name: 'Simulated max',
            color: COLORS[2] ?? COLORS[1],
            points: [{ x: mpt.simulatedOptimumRl, y: mpt.simulatedMaxPower }],
          },
        ],
        metadata: {
          source: 'dc_rl_sweep',
          pointCount: mpt.sweep.length,
          vth: mpt.vth,
          rth: mpt.rth,
          rl: mpt.rl,
          vl: mpt.vl,
          il: mpt.il,
          pl: mpt.pl,
          theoreticalOptimumRl: mpt.theoreticalOptimumRl,
          theoreticalMaxPower: mpt.theoreticalMaxPower,
          simulatedOptimumRl: mpt.simulatedOptimumRl,
          simulatedMaxPower: mpt.simulatedMaxPower,
          sweep: mpt.sweep,
        },
      });
    }
  }

  const cap = physical.find((cm) => cm.type === 'capacitor');
  const ind = physical.find((cm) => cm.type === 'inductor');
  const res = physical.find((cm) => cm.type === 'resistor');
  const isRlcRun =
    Boolean(measurements.rlc) ||
    (Boolean(cap) && Boolean(ind) && hasRunTimeSeries(measurements));

  const hw = measurements.halfWaveRectifier;
  if (hw && hasRunTimeSeries(measurements) && circuit) {
    const vs = circuit.components.find((c) => c.type === 'voltage_source');
    const load = circuit.components.find((c) => c.type === 'resistor');
    const vmIn = circuit.components.find((c) => c.id === 'VM_in');
    const vmOut = circuit.components.find((c) => c.id === 'VM_out');
    const vinKey = vmIn ? `V_${vmIn.id}` : vs ? `V_${vs.id}` : 'vin';
    const voutKey = vmOut ? `V_${vmOut.id}` : load ? `V_${load.id}` : 'vout';
    const chA = measurements.timeSeries!
      .map((s) => {
        const y = s.values[vinKey] ?? s.values.vin;
        return Number.isFinite(s.t) && Number.isFinite(y)
          ? { x: s.t, y: y as number }
          : null;
      })
      .filter((p): p is GraphPoint => p !== null);
    const chB = measurements.timeSeries!
      .map((s) => {
        const y = s.values[voutKey] ?? s.values.vout;
        return Number.isFinite(s.t) && Number.isFinite(y)
          ? { x: s.t, y: y as number }
          : null;
      })
      .filter((p): p is GraphPoint => p !== null);
    if (chA.length > 0 && chB.length > 0) {
      graphs.push({
        id: 'half_wave_rectifier_scope',
        type: 'line',
        title: 'Oscilloscope (Vin / Vout)',
        xAxis: { label: 'Time', unit: 's' },
        yAxis: { label: 'Voltage', unit: 'V' },
        series: [
          { name: 'Channel A (input)', color: COLORS[0], points: chA },
          { name: 'Channel B (output)', color: COLORS[1], points: chB },
        ],
        metadata: {
          source: 'measurements',
          timeSeries: true,
          VinPeak: hw.VinPeak,
          VoutPeak: hw.VoutPeak,
          inputFrequency: hw.inputFrequency,
          rippleFrequency: hw.rippleFrequency,
          averageOutput: hw.averageOutput,
          forwardVoltage: hw.forwardVoltage,
          RL: hw.RL,
        },
      });
    }
  }

  const fw = measurements.fullWaveBridge;
  if (fw && hasRunTimeSeries(measurements) && circuit) {
    const vs = circuit.components.find((c) => c.type === 'voltage_source');
    const load = circuit.components.find((c) => c.type === 'resistor');
    const vmIn = circuit.components.find((c) => c.id === 'VM_in');
    const vmOut = circuit.components.find((c) => c.id === 'VM_out');
    const vinKey = vmIn ? `V_${vmIn.id}` : vs ? `V_${vs.id}` : 'vin';
    const voutKey = vmOut ? `V_${vmOut.id}` : load ? `V_${load.id}` : 'vout';
    const chA = measurements.timeSeries!
      .map((s) => {
        const y = s.values[vinKey] ?? s.values.vin;
        return Number.isFinite(s.t) && Number.isFinite(y)
          ? { x: s.t, y: y as number }
          : null;
      })
      .filter((p): p is GraphPoint => p !== null);
    const chB = measurements.timeSeries!
      .map((s) => {
        const y = s.values[voutKey] ?? s.values.vout;
        return Number.isFinite(s.t) && Number.isFinite(y)
          ? { x: s.t, y: y as number }
          : null;
      })
      .filter((p): p is GraphPoint => p !== null);
    if (chA.length > 0 && chB.length > 0) {
      graphs.push({
        id: 'full_wave_bridge_scope',
        type: 'line',
        title: 'Oscilloscope (Vin / Vout)',
        xAxis: { label: 'Time', unit: 's' },
        yAxis: { label: 'Voltage', unit: 'V' },
        series: [
          { name: 'Channel A (input)', color: COLORS[0], points: chA },
          { name: 'Channel B (output)', color: COLORS[1], points: chB },
        ],
        metadata: {
          source: 'measurements',
          timeSeries: true,
          VinPeak: fw.VinPeak,
          VoutPeak: fw.VoutPeak,
          inputFrequency: fw.inputFrequency,
          rippleFrequency: fw.rippleFrequency,
          averageOutput: fw.averageOutput,
          forwardVoltage: fw.forwardVoltage,
          RL: fw.RL,
          conductingDiodeIds: fw.conductingDiodeIds,
        },
      });
    }
  }

  if (
    !hw &&
    !fw &&
    hasRunTimeSeries(measurements) &&
    circuit
  ) {
    const acSources = circuit.components.filter(
      (c) => c.type === 'voltage_source' && isAcVoltageSource(c.properties),
    );
    const pointsFor = (key: string, fallbackVin: boolean) =>
      measurements.timeSeries!
        .map((s) => {
          const y = s.values[key] ?? (fallbackVin ? s.values.vin : undefined);
          return Number.isFinite(s.t) && typeof y === 'number' && Number.isFinite(y)
            ? { x: s.t, y }
            : null;
        })
        .filter((p): p is GraphPoint => p !== null);
    const scopeSeries: GraphSeries[] = [];
    acSources.forEach((src, index) => {
      const kind =
        typeof src.properties.waveform === 'string' ? src.properties.waveform : 'sine';
      const points = pointsFor(`V_${src.id}`, acSources.length === 1);
      if (points.length > 1) {
        const channel = String.fromCharCode(65 + scopeSeries.length);
        scopeSeries.push({
          name: `Channel ${channel} (${src.label || src.id} ${kind})`,
          color: COLORS[index % COLORS.length],
          points,
        });
      }
    });
    const meter = circuit.components.find((c) => c.type === 'voltmeter');
    if (meter && scopeSeries.length < 2) {
      const points = pointsFor(`V_${meter.id}`, false);
      if (points.length > 1) {
        scopeSeries.push({
          name: `Channel B (${meter.label || meter.id})`,
          color: COLORS[1],
          points,
        });
      }
    }
    if (scopeSeries.length > 0) {
      graphs.push({
        id: 'function_generator_scope',
        type: 'line',
        title: 'Oscilloscope',
        xAxis: { label: 'Time', unit: 's' },
        yAxis: { label: 'Voltage', unit: 'V' },
        series: scopeSeries,
        metadata: { source: 'measurements', timeSeries: true },
      });
    }
  }

  if (isRlcRun && cap && ind && hasRunTimeSeries(measurements)) {
    const rlcMeta = measurements.rlc
      ? {
          R: measurements.rlc.R,
          L: measurements.rlc.L,
          C: measurements.rlc.C,
          Vin: measurements.rlc.Vin,
          time: measurements.rlc.time,
          i: measurements.rlc.i,
          Vc: measurements.rlc.Vc,
          iPeak: measurements.rlc.iPeak,
          vcPeak: measurements.rlc.vcPeak,
          energyL: measurements.rlc.energyL,
          energyC: measurements.rlc.energyC,
          zeroCrossings: measurements.rlc.zeroCrossings,
          sampleCount: measurements.rlc.sampleCount,
          duration: measurements.rlc.duration,
          timeStep: measurements.rlc.timeStep,
        }
      : undefined;
    const iPoints = measurements.timeSeries!
      .map((sample) => {
        const i = sample.values[`I_${ind.componentId}`];
        return Number.isFinite(sample.t) && Number.isFinite(i)
          ? { x: sample.t, y: i as number }
          : null;
      })
      .filter((p): p is GraphPoint => p !== null);
    if (iPoints.length > 0) {
      graphs.push({
        id: 'rlc_current_time',
        type: 'line',
        title: 'Current vs Time',
        xAxis: { label: 'Time', unit: 's' },
        yAxis: { label: 'Series current', unit: 'A' },
        series: [{ name: 'i(t)', color: COLORS[0], points: iPoints }],
        metadata: { source: 'measurements', timeSeries: true, ...rlcMeta },
      });
    }
    const vcPoints = measurements.timeSeries!
      .map((sample) => {
        const vc =
          sample.values[`V_${cap.componentId}`] ??
          sample.values.vc ??
          sample.values.capacitorVoltage;
        return Number.isFinite(sample.t) && Number.isFinite(vc)
          ? { x: sample.t, y: vc as number }
          : null;
      })
      .filter((p): p is GraphPoint => p !== null);
    if (vcPoints.length > 0) {
      graphs.push({
        id: 'rlc_capacitor_voltage_time',
        type: 'line',
        title: 'Capacitor Voltage vs Time',
        xAxis: { label: 'Time', unit: 's' },
        yAxis: { label: 'Capacitor voltage', unit: 'V' },
        series: [{ name: 'Vc', color: COLORS[1], points: vcPoints }],
        metadata: { source: 'measurements', timeSeries: true, ...rlcMeta },
      });
    }
  }

  const rcMeta = measurements.rc
    ? {
        mode: measurements.rc.mode,
        R: measurements.rc.R,
        C: measurements.rc.C,
        Vin: measurements.rc.Vin,
        V0: measurements.rc.V0,
        tauTheoretical: measurements.rc.tauTheoretical,
        tauSimulated: measurements.rc.tauSimulated,
        tauErrorPercent: measurements.rc.tauErrorPercent,
        Vc: measurements.rc.Vc,
        Ic: measurements.rc.Ic,
        Ic0: measurements.rc.Ic0,
        time: measurements.rc.time,
      }
    : undefined;
  const rcPoints =
    !isRlcRun && cap && hasRunTimeSeries(measurements)
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
      title: 'Time vs Vc',
      xAxis: { label: 'Time', unit: 's' },
      yAxis: { label: 'Capacitor voltage', unit: 'V' },
      series: [{ name: 'Vc', color: COLORS[0], points: rcPoints }],
      metadata: { source: 'measurements', timeSeries: true, ...rcMeta },
    });
  }

  const icPoints =
    !isRlcRun && cap && hasRunTimeSeries(measurements)
      ? measurements.timeSeries!
          .map((sample) => {
            const ic = sample.values[`I_${cap.componentId}`];
            return Number.isFinite(sample.t) && Number.isFinite(ic)
              ? { x: sample.t, y: ic as number }
              : null;
          })
          .filter((p): p is GraphPoint => p !== null)
      : [];
  if (icPoints.length > 0) {
    graphs.push({
      id: 'rc_current_time',
      type: 'line',
      title: 'Time vs Ic',
      xAxis: { label: 'Time', unit: 's' },
      yAxis: { label: 'Capacitor current', unit: 'A' },
      series: [{ name: 'Ic', color: COLORS[1], points: icPoints }],
      metadata: { source: 'measurements', timeSeries: true, ...rcMeta },
    });
  }

  const rlMeta = measurements.rl
    ? {
        mode: measurements.rl.mode,
        R: measurements.rl.R,
        L: measurements.rl.L,
        Vin: measurements.rl.Vin,
        I0: measurements.rl.I0,
        Ifinal: measurements.rl.Ifinal,
        tauTheoretical: measurements.rl.tauTheoretical,
        tauSimulated: measurements.rl.tauSimulated,
        tauErrorPercent: measurements.rl.tauErrorPercent,
        iL: measurements.rl.iL,
        vR: measurements.rl.vR,
        time: measurements.rl.time,
      }
    : undefined;
  const ilPoints =
    !isRlcRun && ind && hasRunTimeSeries(measurements)
      ? measurements.timeSeries!
          .map((sample) => {
            const i = sample.values[`I_${ind.componentId}`];
            return Number.isFinite(sample.t) && Number.isFinite(i)
              ? { x: sample.t, y: i as number }
              : null;
          })
          .filter((p): p is GraphPoint => p !== null)
      : [];
  if (ilPoints.length > 0) {
    graphs.push({
      id: 'rl_current_time',
      type: 'line',
      title: 'Time vs Inductor Current',
      xAxis: { label: 'Time', unit: 's' },
      yAxis: { label: 'Inductor current', unit: 'A' },
      series: [{ name: 'iL', color: COLORS[0], points: ilPoints }],
      metadata: { source: 'measurements', timeSeries: true, ...rlMeta },
    });
  }

  const vrPoints =
    !isRlcRun && res && ind && hasRunTimeSeries(measurements)
      ? measurements.timeSeries!
          .map((sample) => {
            const v = sample.values[`V_${res.componentId}`];
            return Number.isFinite(sample.t) && Number.isFinite(v)
              ? { x: sample.t, y: v as number }
              : null;
          })
          .filter((p): p is GraphPoint => p !== null)
      : [];
  if (vrPoints.length > 0) {
    graphs.push({
      id: 'rl_resistor_voltage_time',
      type: 'line',
      title: 'Time vs Resistor Voltage',
      xAxis: { label: 'Time', unit: 's' },
      yAxis: { label: 'Resistor voltage', unit: 'V' },
      series: [{ name: 'VR', color: COLORS[1], points: vrPoints }],
      metadata: { source: 'measurements', timeSeries: true, ...rlMeta },
    });
  }

  if (drops.length > 0) {
    const kclPoints: GraphPoint[] = [
      ...drops.map((cm, i) => ({ x: i + 1, y: cm.current })),
      { x: drops.length + 1, y: measurements.totalCurrent },
    ];
    const kclLabels = [
      ...drops.map((cm) => `I(${labelForComponent(circuit, cm.componentId, cm.type)})`),
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
  }

  if (Number.isFinite(measurements.totalVoltage) && drops.length > 0) {
    const sumV = drops.reduce((s, cm) => s + cm.voltage, 0);
    const kvlPoints: GraphPoint[] = [
      { x: 1, y: measurements.totalVoltage },
      ...drops.map((cm, i) => ({ x: i + 2, y: cm.voltage })),
      { x: drops.length + 2, y: sumV },
    ];
    const dropLabels = drops.map((cm) => {
      const name = labelForComponent(circuit, cm.componentId, cm.type);
      return `V(${name})`;
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
  }

  if (drops.length === 0) return graphsForExperiment(graphs, circuit?.experimentId);

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

  return graphsForExperiment(graphs, circuit?.experimentId);
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
