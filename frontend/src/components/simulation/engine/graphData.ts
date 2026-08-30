/**
 * Graph Data Generation
 * Person 1: Simulation Engine
 * Generates graph data from simulation results
 */

import type {
  CircuitDefinition,
} from './circuitGraph';

import {
  findComponent,
} from './circuitGraph';

import type {
  DCResult,
} from './dcSolver';

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
  metadata?: Record<string, any>;
}

export interface GraphOptions {
  title?: string;
  xLabel?: string;
  xUnit?: string;
  yLabel?: string;
  yUnit?: string;
  numPoints?: number;
  minX?: number;
  maxX?: number;
}

export function generateOhmsLawGraph(
  circuit: CircuitDefinition,
  _dcResult: DCResult,
  options: GraphOptions = {}
): GraphData {
  const voltageSource = circuit.components.find(c => c.type === 'voltage_source');
  const resistor = circuit.components.find(c => c.type === 'resistor');
  
  if (!voltageSource || !resistor) {
    throw new Error('Circuit must have a voltage source and resistor for Ohm\'s Law graph');
  }

  const resistance = resistor.properties.resistance || 1000;
  const maxVoltage = voltageSource.properties.voltage || 10;
  const numPoints = options.numPoints || 10;
  
  const points: GraphPoint[] = [];
  
  for (let i = 0; i <= numPoints; i++) {
    const voltage = (i / numPoints) * maxVoltage;
    const current = voltage / resistance;
    points.push({ x: voltage, y: current });
  }

  return {
    id: 'ohms_law',
    type: 'line',
    title: options.title || 'Ohm\'s Law: Voltage vs Current',
    xAxis: {
      label: options.xLabel || 'Voltage',
      unit: options.xUnit || 'V',
    },
    yAxis: {
      label: options.yLabel || 'Current',
      unit: options.yUnit || 'A',
    },
    series: [
      {
        name: `R = ${resistance}Ω`,
        points,
        color: '#3b82f6',
      },
    ],
    metadata: {
      resistance,
      maxVoltage,
      numPoints,
    },
  };
}

export function generateVoltageDividerGraph(
  circuit: CircuitDefinition,
  _dcResult: DCResult,
  options: GraphOptions = {}
): GraphData {
  const resistors = circuit.components.filter(c => c.type === 'resistor');
  
  if (resistors.length < 2) {
    throw new Error('Voltage divider graph requires at least 2 resistors');
  }

  const r1 = resistors[0].properties.resistance || 1000;
  const r2 = resistors[1].properties.resistance || 1000;
  
  const maxVoltage = 10;
  const numPoints = options.numPoints || 10;
  
  const points: GraphPoint[] = [];
  
  for (let i = 0; i <= numPoints; i++) {
    const vin = (i / numPoints) * maxVoltage;
    const vout = vin * (r2 / (r1 + r2));
    points.push({ x: vin, y: vout });
  }

  return {
    id: 'voltage_divider',
    type: 'line',
    title: options.title || 'Voltage Divider: Input vs Output Voltage',
    xAxis: {
      label: options.xLabel || 'Input Voltage',
      unit: options.xUnit || 'V',
    },
    yAxis: {
      label: options.yLabel || 'Output Voltage',
      unit: options.yUnit || 'V',
    },
    series: [
      {
        name: `R1 = ${r1}Ω, R2 = ${r2}Ω`,
        points,
        color: '#10b981',
      },
    ],
    metadata: {
      r1,
      r2,
      maxVoltage,
      numPoints,
    },
  };
}

export function generateRCGraph(
  circuit: CircuitDefinition,
  _dcResult: DCResult,
  options: GraphOptions = {}
): GraphData {
  const capacitor = circuit.components.find(c => c.type === 'capacitor');
  const resistor = circuit.components.find(c => c.type === 'resistor');
  
  if (!capacitor || !resistor) {
    throw new Error('Circuit must have a capacitor and resistor for RC graph');
  }

  const capacitance = capacitor.properties.capacitance || 0.000001;
  const resistance = resistor.properties.resistance || 1000;
  const voltageSource = circuit.components.find(c => c.type === 'voltage_source');
  const sourceVoltage = voltageSource?.properties.voltage || 5;
  
  const tau = resistance * capacitance;
  const numPoints = options.numPoints || 20;
  const maxTime = options.maxX || (tau * 5);
  
  const chargingPoints: GraphPoint[] = [];
  const dischargingPoints: GraphPoint[] = [];
  
  for (let i = 0; i <= numPoints; i++) {
    const time = (i / numPoints) * maxTime;
    
    const chargingVoltage = sourceVoltage * (1 - Math.exp(-time / tau));
    chargingPoints.push({ x: time, y: chargingVoltage });
    
    const dischargingVoltage = sourceVoltage * Math.exp(-time / tau);
    dischargingPoints.push({ x: time, y: dischargingVoltage });
  }

  return {
    id: 'rc_charging',
    type: 'line',
    title: options.title || 'RC Circuit: Time vs Capacitor Voltage',
    xAxis: {
      label: options.xLabel || 'Time',
      unit: options.xUnit || 's',
    },
    yAxis: {
      label: options.yLabel || 'Capacitor Voltage',
      unit: options.yUnit || 'V',
    },
    series: [
      {
        name: `Charging (τ = ${(tau * 1000).toFixed(2)}ms)`,
        points: chargingPoints,
        color: '#3b82f6',
      },
      {
        name: `Discharging (τ = ${(tau * 1000).toFixed(2)}ms)`,
        points: dischargingPoints,
        color: '#ef4444',
      },
    ],
    metadata: {
      capacitance,
      resistance,
      sourceVoltage,
      tau,
      maxTime,
      numPoints,
    },
  };
}

export function generateRLGraph(
  circuit: CircuitDefinition,
  _dcResult: DCResult,
  options: GraphOptions = {}
): GraphData {
  const inductor = circuit.components.find(c => c.type === 'inductor');
  const resistor = circuit.components.find(c => c.type === 'resistor');
  
  if (!inductor || !resistor) {
    throw new Error('Circuit must have an inductor and resistor for RL graph');
  }

  const inductance = inductor.properties.inductance || 0.001;
  const resistance = resistor.properties.resistance || 1000;
  const voltageSource = circuit.components.find(c => c.type === 'voltage_source');
  const sourceVoltage = voltageSource?.properties.voltage || 5;
  
  const tau = inductance / resistance;
  const maxCurrent = sourceVoltage / resistance;
  const numPoints = options.numPoints || 20;
  const maxTime = options.maxX || (tau * 5);
  
  const points: GraphPoint[] = [];
  
  for (let i = 0; i <= numPoints; i++) {
    const time = (i / numPoints) * maxTime;
    const current = maxCurrent * (1 - Math.exp(-time / tau));
    points.push({ x: time, y: current });
  }

  return {
    id: 'rl_charging',
    type: 'line',
    title: options.title || 'RL Circuit: Time vs Inductor Current',
    xAxis: {
      label: options.xLabel || 'Time',
      unit: options.xUnit || 's',
    },
    yAxis: {
      label: options.yLabel || 'Inductor Current',
      unit: options.yUnit || 'A',
    },
    series: [
      {
        name: `L = ${inductance * 1000}mH, R = ${resistance}Ω`,
        points,
        color: '#8b5cf6',
      },
    ],
    metadata: {
      inductance,
      resistance,
      sourceVoltage,
      tau,
      maxCurrent,
      maxTime,
      numPoints,
    },
  };
}

export function generatePowerGraph(
  circuit: CircuitDefinition,
  _dcResult: DCResult,
  options: GraphOptions = {}
): GraphData {
  const voltageSource = circuit.components.find(c => c.type === 'voltage_source');
  const resistor = circuit.components.find(c => c.type === 'resistor');
  
  if (!voltageSource || !resistor) {
    throw new Error('Circuit must have a voltage source and resistor for power graph');
  }

  const sourceVoltage = voltageSource.properties.voltage || 5;
  const baseResistance = resistor.properties.resistance || 1000;
  const numPoints = options.numPoints || 10;
  
  const points: GraphPoint[] = [];
  const minR = baseResistance * 0.1;
  const maxR = baseResistance * 10;
  
  for (let i = 0; i <= numPoints; i++) {
    const resistance = minR + (i / numPoints) * (maxR - minR);
    const current = sourceVoltage / resistance;
    const power = current * current * resistance;
    points.push({ x: resistance, y: power });
  }

  return {
    id: 'power_graph',
    type: 'line',
    title: options.title || 'Power vs Resistance',
    xAxis: {
      label: options.xLabel || 'Resistance',
      unit: options.xUnit || 'Ω',
    },
    yAxis: {
      label: options.yLabel || 'Power',
      unit: options.yUnit || 'W',
    },
    series: [
      {
        name: `V = ${sourceVoltage}V`,
        points,
        color: '#f59e0b',
      },
    ],
    metadata: {
      sourceVoltage,
      baseResistance,
      minR,
      maxR,
      numPoints,
    },
  };
}

export function generateComponentAnalysisGraph(
  circuit: CircuitDefinition,
  dcResult: DCResult,
  options: GraphOptions = {}
): GraphData {
  const points: GraphPoint[] = [];
  
  const components = circuit.components.filter(
    c => ['resistor', 'capacitor', 'inductor', 'diode', 'led'].includes(c.type)
  );

  for (const component of components) {
    const result = dcResult.componentResults.get(component.id);
    if (!result) continue;
    
    points.push({
      x: components.indexOf(component),
      y: result.power,
    });
  }

  return {
    id: 'component_analysis',
    type: 'bar',
    title: options.title || 'Component Power Analysis',
    xAxis: {
      label: options.xLabel || 'Component',
      unit: options.xUnit || '',
    },
    yAxis: {
      label: options.yLabel || 'Power',
      unit: options.yUnit || 'W',
    },
    series: [
      {
        name: 'Power',
        points,
        color: '#ec4899',
      },
    ],
    metadata: {
      components: components.map(c => c.id),
      numComponents: components.length,
    },
  };
}

export function generateIVGraph(
  circuit: CircuitDefinition,
  dcResult: DCResult,
  componentId: string,
  options: GraphOptions = {}
): GraphData {
  const component = findComponent(circuit, componentId);
  if (!component) {
    throw new Error(`Component ${componentId} not found`);
  }

  const result = dcResult.componentResults.get(componentId);
  if (!result) {
    throw new Error(`No results for component ${componentId}`);
  }

  const points: GraphPoint[] = [];
  const numPoints = options.numPoints || 10;
  const maxVoltage = result.voltage * 1.5;

  for (let i = 0; i <= numPoints; i++) {
    const voltage = (i / numPoints) * maxVoltage;
    let current = 0;
    
    if (component.type === 'resistor') {
      const resistance = component.properties.resistance || 1000;
      current = voltage / resistance;
    } else if (component.type === 'diode') {
      const forwardVoltage = component.properties.forwardVoltage || 0.7;
      if (voltage > forwardVoltage) {
        current = (voltage - forwardVoltage) / 100;
      }
    } else {
      current = voltage / 1000;
    }
    
    points.push({ x: voltage, y: current });
  }

  return {
    id: `iv_${componentId}`,
    type: 'line',
    title: options.title || `${component.label}: Current vs Voltage`,
    xAxis: {
      label: options.xLabel || 'Voltage',
      unit: options.xUnit || 'V',
    },
    yAxis: {
      label: options.yLabel || 'Current',
      unit: options.yUnit || 'A',
    },
    series: [
      {
        name: component.label,
        points,
        color: '#06b6d4',
      },
    ],
    metadata: {
      componentId,
      componentType: component.type,
      numPoints,
    },
  };
}

export function generateAllGraphs(
  circuit: CircuitDefinition,
  dcResult: DCResult
): GraphData[] {
  const graphs: GraphData[] = [];

  try {
    graphs.push(generateOhmsLawGraph(circuit, dcResult));
  } catch (_e) {
    // Skip if not applicable
  }

  try {
    graphs.push(generateVoltageDividerGraph(circuit, dcResult));
  } catch (_e) {
    // Skip if not applicable
  }

  try {
    graphs.push(generateRCGraph(circuit, dcResult));
  } catch (_e) {
    // Skip if not applicable
  }

  try {
    graphs.push(generateRLGraph(circuit, dcResult));
  } catch (_e) {
    // Skip if not applicable
  }

  try {
    graphs.push(generatePowerGraph(circuit, dcResult));
  } catch (_e) {
    // Skip if not applicable
  }

  try {
    graphs.push(generateComponentAnalysisGraph(circuit, dcResult));
  } catch (_e) {
    // Skip if not applicable
  }

  for (const component of circuit.components) {
    if (['resistor', 'diode', 'led'].includes(component.type)) {
      try {
        graphs.push(generateIVGraph(circuit, dcResult, component.id));
      } catch (_e) {
        // Skip if not applicable
      }
    }
  }

  return graphs;
}

export function validateGraphData(graph: GraphData): boolean {
  if (!graph.id || !graph.title || !graph.xAxis || !graph.yAxis) {
    return false;
  }

  if (!graph.series || graph.series.length === 0) {
    return false;
  }

  for (const series of graph.series) {
    if (!series.points || series.points.length === 0) {
      return false;
    }

    for (const point of series.points) {
      if (point.x === undefined || point.y === undefined) {
        return false;
      }
      if (isNaN(point.x) || isNaN(point.y) || !isFinite(point.x) || !isFinite(point.y)) {
        return false;
      }
    }
  }

  return true;
}

export function getGraphById(graphs: GraphData[], id: string): GraphData | undefined {
  return graphs.find(g => g.id === id);
}