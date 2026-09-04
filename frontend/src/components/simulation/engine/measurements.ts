/**
 * Measurements
 * Person 1: Simulation Engine
 * Generates measurements from solver results
 */

import type {
  CircuitDefinition,
} from './circuitGraph';

import type {
  DCResult,
} from './dcSolver';

export interface Measurement {
  id: string;
  type: 'voltage' | 'current' | 'power' | 'resistance' | 'energy';
  value: number;
  unit: string;
  label: string;
  componentId?: string;
  terminalIds?: string[];
  nodeId?: string;
}

export interface MeasurementGroup {
  name: string;
  measurements: Measurement[];
}

export interface CompleteMeasurements {
  source: MeasurementGroup;
  components: MeasurementGroup;
  nodes: MeasurementGroup;
  totals: MeasurementGroup;
  summary: MeasurementGroup;
}

export function generateMeasurements(
  circuit: CircuitDefinition,
  dcResult: DCResult
): CompleteMeasurements {
  const sourceMeasurements = generateSourceMeasurements(circuit, dcResult);
  const componentMeasurements = generateComponentMeasurements(circuit, dcResult);
  const nodeMeasurements = generateNodeMeasurements(circuit, dcResult);
  const totalMeasurements = generateTotalMeasurements(circuit, dcResult);
  const summaryMeasurements = generateSummaryMeasurements(circuit, dcResult);

  return {
    source: {
      name: 'Source',
      measurements: sourceMeasurements,
    },
    components: {
      name: 'Components',
      measurements: componentMeasurements,
    },
    nodes: {
      name: 'Nodes',
      measurements: nodeMeasurements,
    },
    totals: {
      name: 'Totals',
      measurements: totalMeasurements,
    },
    summary: {
      name: 'Summary',
      measurements: summaryMeasurements,
    },
  };
}

function generateSourceMeasurements(
  circuit: CircuitDefinition,
  dcResult: DCResult
): Measurement[] {
  const measurements: Measurement[] = [];
  
  const sources = circuit.components.filter(
    c => c.type === 'voltage_source' || c.type === 'current_source'
  );

  for (const source of sources) {
    const result = dcResult.componentResults.get(source.id);
    if (!result) continue;

    if (source.type === 'voltage_source') {
      const voltage = source.properties.voltage || 0;
      
      measurements.push({
        id: `${source.id}_voltage`,
        type: 'voltage',
        value: voltage,
        unit: 'V',
        label: `${source.label} Voltage`,
        componentId: source.id,
      });

      measurements.push({
        id: `${source.id}_current`,
        type: 'current',
        value: result.current,
        unit: 'A',
        label: `${source.label} Current`,
        componentId: source.id,
      });

      measurements.push({
        id: `${source.id}_power`,
        type: 'power',
        value: result.power,
        unit: 'W',
        label: `${source.label} Power`,
        componentId: source.id,
      });
    }

    if (source.type === 'current_source') {
      const current = source.properties.current || 0;
      
      measurements.push({
        id: `${source.id}_current`,
        type: 'current',
        value: current,
        unit: 'A',
        label: `${source.label} Current`,
        componentId: source.id,
      });

      measurements.push({
        id: `${source.id}_voltage`,
        type: 'voltage',
        value: result.voltage,
        unit: 'V',
        label: `${source.label} Voltage`,
        componentId: source.id,
      });

      measurements.push({
        id: `${source.id}_power`,
        type: 'power',
        value: result.power,
        unit: 'W',
        label: `${source.label} Power`,
        componentId: source.id,
      });
    }
  }

  return measurements;
}

function generateComponentMeasurements(
  circuit: CircuitDefinition,
  dcResult: DCResult
): Measurement[] {
  const measurements: Measurement[] = [];
  
  const passiveComponents = circuit.components.filter(
    c => ['resistor', 'capacitor', 'inductor', 'diode', 'led'].includes(c.type)
  );

  for (const component of passiveComponents) {
    const result = dcResult.componentResults.get(component.id);
    if (!result) continue;

    measurements.push({
      id: `${component.id}_voltage`,
      type: 'voltage',
      value: result.voltage,
      unit: 'V',
      label: `${component.label} Voltage`,
      componentId: component.id,
    });

    measurements.push({
      id: `${component.id}_current`,
      type: 'current',
      value: result.current,
      unit: 'A',
      label: `${component.label} Current`,
      componentId: component.id,
    });

    measurements.push({
      id: `${component.id}_power`,
      type: 'power',
      value: result.power,
      unit: 'W',
      label: `${component.label} Power`,
      componentId: component.id,
    });

    if (component.type === 'resistor' && result.resistance) {
      measurements.push({
        id: `${component.id}_resistance`,
        type: 'resistance',
        value: result.resistance,
        unit: 'Ω',
        label: `${component.label} Resistance`,
        componentId: component.id,
      });
    }
  }

  return measurements;
}

function generateNodeMeasurements(
  circuit: CircuitDefinition,
  dcResult: DCResult
): Measurement[] {
  const measurements: Measurement[] = [];
  
  const nodes = circuit.nodes || [];
  
  for (const node of nodes) {
    const voltage = dcResult.nodeVoltages.get(node.id);
    if (voltage === undefined) continue;

    measurements.push({
      id: `${node.id}_voltage`,
      type: 'voltage',
      value: voltage,
      unit: 'V',
      label: `Node ${node.id} Voltage`,
      nodeId: node.id,
      terminalIds: node.terminals,
    });
  }

  return measurements;
}

function generateTotalMeasurements(
  circuit: CircuitDefinition,
  dcResult: DCResult
): Measurement[] {
  const measurements: Measurement[] = [];

  const voltageSource = circuit.components.find(c => c.type === 'voltage_source');
  if (voltageSource) {
    measurements.push({
      id: 'total_voltage',
      type: 'voltage',
      value: voltageSource.properties.voltage || 0,
      unit: 'V',
      label: 'Total Voltage',
    });
  }

  measurements.push({
    id: 'total_current',
    type: 'current',
    value: dcResult.totalCurrent,
    unit: 'A',
    label: 'Total Current',
  });

  measurements.push({
    id: 'total_power',
    type: 'power',
    value: dcResult.totalPower,
    unit: 'W',
    label: 'Total Power',
  });

  if (dcResult.equivalentResistance > 0) {
    measurements.push({
      id: 'equivalent_resistance',
      type: 'resistance',
      value: dcResult.equivalentResistance,
      unit: 'Ω',
      label: 'Equivalent Resistance',
    });
  }

  return measurements;
}

function generateSummaryMeasurements(
  circuit: CircuitDefinition,
  dcResult: DCResult
): Measurement[] {
  const measurements: Measurement[] = [];

  const componentCount = circuit.components.length;
  measurements.push({
    id: 'component_count',
    type: 'resistance',
    value: componentCount,
    unit: '',
    label: 'Total Components',
  });

  const resistorCount = circuit.components.filter(c => c.type === 'resistor').length;
  measurements.push({
    id: 'resistor_count',
    type: 'resistance',
    value: resistorCount,
    unit: '',
    label: 'Resistors',
  });

  const sourceCount = circuit.components.filter(
    c => c.type === 'voltage_source' || c.type === 'current_source'
  ).length;
  measurements.push({
    id: 'source_count',
    type: 'resistance',
    value: sourceCount,
    unit: '',
    label: 'Sources',
  });

  const hasGround = circuit.components.some(c => c.type === 'ground');
  measurements.push({
    id: 'has_ground',
    type: 'resistance',
    value: hasGround ? 1 : 0,
    unit: '',
    label: 'Ground Present',
  });

  measurements.push({
    id: 'solver_success',
    type: 'resistance',
    value: dcResult.success ? 1 : 0,
    unit: '',
    label: 'Solver Success',
  });

  return measurements;
}

export function getMeasurement(
  measurements: CompleteMeasurements,
  id: string
): Measurement | undefined {
  const allGroups = [
    measurements.source,
    measurements.components,
    measurements.nodes,
    measurements.totals,
    measurements.summary,
  ];

  for (const group of allGroups) {
    const found = group.measurements.find(m => m.id === id);
    if (found) return found;
  }

  return undefined;
}

export function getMeasurementsForComponent(
  measurements: CompleteMeasurements,
  componentId: string
): Measurement[] {
  const results: Measurement[] = [];
  
  const allGroups = [
    measurements.source,
    measurements.components,
    measurements.totals,
  ];

  for (const group of allGroups) {
    const found = group.measurements.filter(m => m.componentId === componentId);
    results.push(...found);
  }

  return results;
}

export function getMeasurementsByType(
  measurements: CompleteMeasurements,
  type: Measurement['type']
): Measurement[] {
  const results: Measurement[] = [];
  
  const allGroups = [
    measurements.source,
    measurements.components,
    measurements.nodes,
    measurements.totals,
    measurements.summary,
  ];

  for (const group of allGroups) {
    const found = group.measurements.filter(m => m.type === type);
    results.push(...found);
  }

  return results;
}

export function formatMeasurement(measurement: Measurement): string {
  const value = measurement.value;
  const unit = measurement.unit;
  
  if (value === Infinity) return '∞';
  if (value === -Infinity) return '-∞';
  if (isNaN(value)) return 'N/A';
  
  if (Math.abs(value) >= 1000000) {
    return `${(value / 1000000).toFixed(2)} M${unit}`;
  }
  if (Math.abs(value) >= 1000) {
    return `${(value / 1000).toFixed(2)} k${unit}`;
  }
  if (Math.abs(value) >= 1) {
    return `${value.toFixed(3)} ${unit}`;
  }
  if (Math.abs(value) >= 0.001) {
    return `${(value * 1000).toFixed(2)} m${unit}`;
  }
  if (Math.abs(value) >= 0.000001) {
    return `${(value * 1000000).toFixed(2)} µ${unit}`;
  }
  
  return `${value.toFixed(6)} ${unit}`;
}