/**
 * Measurements
 * Person 1: Simulation Engine
 * Generates measurements from solver results
 */

import {
  CircuitDefinition,
  Component,
  ElectricalNode,
  findComponent,
  getConnectionsForTerminal,
  findComponentByTerminal,
} from './circuitGraph';

import {
  DCResult,
  ComponentResult,
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

/**
 * Generate complete measurements from circuit and solver results
 */
export function generateMeasurements(
  circuit: CircuitDefinition,
  dcResult: DCResult
): CompleteMeasurements {
  // Source measurements
  const sourceMeasurements = generateSourceMeasurements(circuit, dcResult);
  
  // Component measurements
  const componentMeasurements = generateComponentMeasurements(circuit, dcResult);
  
  // Node measurements
  const nodeMeasurements = generateNodeMeasurements(circuit, dcResult);
  
  // Total measurements
  const totalMeasurements = generateTotalMeasurements(circuit, dcResult);
  
  // Summary measurements
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

/**
 * Generate source measurements
 */
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

/**
 * Generate component measurements
 */
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

    // Voltage measurement
    measurements.push({
      id: `${component.id}_voltage`,
      type: 'voltage',
      value: result.voltage,
      unit: 'V',
      label: `${component.label} Voltage`,
      componentId: component.id,
    });

    // Current measurement
    measurements.push({
      id: `${component.id}_current`,
      type: 'current',
      value: result.current,
      unit: 'A',
      label: `${component.label} Current`,
      componentId: component.id,
    });

    // Power measurement
    measurements.push({
      id: `${component.id}_power`,
      type: 'power',
      value: result.power,
      unit: 'W',
      label: `${component.label} Power`,
      componentId: component.id,
    });

    // Resistance measurement (for resistors only)
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

/**
 * Generate node measurements
 */
function generateNodeMeasurements(
  circuit: CircuitDefinition,
  dcResult: DCResult
): Measurement[] {
  const measurements: Measurement[] = [];
  
  // Use nodes from circuit
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

/**
 * Generate total measurements
 */
function generateTotalMeasurements(
  circuit: CircuitDefinition,
  dcResult: DCResult
): Measurement[] {
  const measurements: Measurement[] = [];

  // Total voltage (from voltage source)
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

  // Total current
  measurements.push({
    id: 'total_current',
    type: 'current',
    value: dcResult.totalCurrent,
    unit: 'A',
    label: 'Total Current',
  });

  // Total power
  measurements.push({
    id: 'total_power',
    type: 'power',
    value: dcResult.totalPower,
    unit: 'W',
    label: 'Total Power',
  });

  // Equivalent resistance
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

/**
 * Generate summary measurements
 */
function generateSummaryMeasurements(
  circuit: CircuitDefinition,
  dcResult: DCResult
): Measurement[] {
  const measurements: Measurement[] = [];

  // Count components
  const componentCount = circuit.components.length;
  measurements.push({
    id: 'component_count',
    type: 'resistance' as any,
    value: componentCount,
    unit: '',
    label: 'Total Components',
  });

  // Count resistor types
  const resistorCount = circuit.components.filter(c => c.type === 'resistor').length;
  measurements.push({
    id: 'resistor_count',
    type: 'resistance' as any,
    value: resistorCount,
    unit: '',
    label: 'Resistors',
  });

  // Count sources
  const sourceCount = circuit.components.filter(
    c => c.type === 'voltage_source' || c.type === 'current_source'
  ).length;
  measurements.push({
    id: 'source_count',
    type: 'resistance' as any,
    value: sourceCount,
    unit: '',
    label: 'Sources',
  });

  // Check if circuit has ground
  const hasGround = circuit.components.some(c => c.type === 'ground');
  measurements.push({
    id: 'has_ground',
    type: 'resistance' as any,
    value: hasGround ? 1 : 0,
    unit: '',
    label: 'Ground Present',
  });

  // Solver success
  measurements.push({
    id: 'solver_success',
    type: 'resistance' as any,
    value: dcResult.success ? 1 : 0,
    unit: '',
    label: 'Solver Success',
  });

  return measurements;
}

/**
 * Get measurement by ID
 */
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

/**
 * Get measurements by component ID
 */
export function getMeasurementsForComponent(
  measurements: CompleteMeasurements,
  componentId: string
): Measurement[] {
  const results: Measurement[] = [];
  
  const allGroups = [
    measurements.components,
  ];

  for (const group of allGroups) {
    const found = group.measurements.filter(m => m.componentId === componentId);
    results.push(...found);
  }

  return results;
}

/**
 * Get measurements by type
 */
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

/**
 * Format measurement value for display
 */
export function formatMeasurement(measurement: Measurement): string {
  const value = measurement.value;
  const unit = measurement.unit;
  
  if (value === Infinity) return '∞';
  if (value === -Infinity) return '-∞';
  if (isNaN(value)) return 'N/A';
  
  // Format based on magnitude
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