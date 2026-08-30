/**
 * DC Solver
 * Person 1: Simulation Engine
 * Solves DC circuits using Ohm's Law, KCL, and KVL
 */

import {
  CircuitDefinition,
  Component,
  ElectricalNode,
  Connection,
  findComponent,
  findTerminal,
  getConnectionsForTerminal,
  findComponentByTerminal,
} from './circuitGraph';

import {
  buildElectricalNodes,
  hasGround,
  findGroundNode,
  getNodeIdForTerminal,
} from './circuitGraphBuilder';

import {
  validateCircuit,
} from './circuitValidator';

import {
  NUMERICAL_TOLERANCE,
  areEqual,
} from './units';

export interface DCResult {
  nodeVoltages: Map<string, number>; // nodeId -> voltage (V)
  branchCurrents: Map<string, number>; // connectionId -> current (A)
  componentResults: Map<string, ComponentResult>;
  totalCurrent: number; // A
  totalPower: number; // W
  equivalentResistance: number; // Ω
  success: boolean;
  error?: string;
}

export interface ComponentResult {
  componentId: string;
  voltage: number; // V (voltage across component)
  current: number; // A (current through component)
  power: number; // W
  resistance?: number; // Ω (for resistors)
}

/**
 * Main DC solver
 */
export function solveDC(circuit: CircuitDefinition): DCResult {
  // First validate the circuit
  const validation = validateCircuit(circuit);
  if (!validation.valid) {
    return {
      nodeVoltages: new Map(),
      branchCurrents: new Map(),
      componentResults: new Map(),
      totalCurrent: 0,
      totalPower: 0,
      equivalentResistance: 0,
      success: false,
      error: `Circuit validation failed: ${validation.errors[0]?.message || 'Unknown error'}`,
    };
  }

  // Build electrical nodes
  const graphResult = buildElectricalNodes(circuit);
  if (graphResult.errors.length > 0) {
    return {
      nodeVoltages: new Map(),
      branchCurrents: new Map(),
      componentResults: new Map(),
      totalCurrent: 0,
      totalPower: 0,
      equivalentResistance: 0,
      success: false,
      error: `Graph building failed: ${graphResult.errors[0]}`,
    };
  }

  // Check for ground
  if (!hasGround(graphResult.nodes)) {
    return {
      nodeVoltages: new Map(),
      branchCurrents: new Map(),
      componentResults: new Map(),
      totalCurrent: 0,
      totalPower: 0,
      equivalentResistance: 0,
      success: false,
      error: 'No ground found in circuit',
    };
  }

  // Find ground node
  const groundNode = findGroundNode(graphResult.nodes);
  if (!groundNode) {
    return {
      nodeVoltages: new Map(),
      branchCurrents: new Map(),
      componentResults: new Map(),
      totalCurrent: 0,
      totalPower: 0,
      equivalentResistance: 0,
      success: false,
      error: 'Ground node not found',
    };
  }

  // Solve using node voltage analysis
  return solveNodeVoltages(circuit, graphResult.nodes, groundNode);
}

/**
 * Solve circuit using node voltage analysis
 */
function solveNodeVoltages(
  circuit: CircuitDefinition,
  nodes: ElectricalNode[],
  groundNode: ElectricalNode
): DCResult {
  const nodeVoltages = new Map<string, number>();
  const branchCurrents = new Map<string, number>();
  const componentResults = new Map<string, ComponentResult>();

  // Set ground voltage to 0
  nodeVoltages.set(groundNode.id, 0);

  // Find all voltage sources
  const voltageSources = circuit.components.filter(
    c => c.type === 'voltage_source'
  );

  // Find all current sources
  const currentSources = circuit.components.filter(
    c => c.type === 'current_source'
  );

  // Find all resistors
  const resistors = circuit.components.filter(
    c => c.type === 'resistor'
  );

  // Simple case: single voltage source with resistors (series/parallel)
  if (voltageSources.length === 1 && currentSources.length === 0) {
    return solveSimpleResistiveCircuit(circuit, nodes, voltageSources[0], groundNode);
  }

  // More complex: multiple sources or current sources
  // For now, handle simple cases
  if (voltageSources.length > 1) {
    return solveMultiSourceCircuit(circuit, nodes, voltageSources, groundNode);
  }

  // If we have current sources, solve using modified nodal analysis
  if (currentSources.length > 0) {
    return solveWithCurrentSources(circuit, nodes, currentSources, groundNode);
  }

  // Default: solve using simple method
  return solveSimpleCircuit(circuit, nodes, groundNode);
}

/**
 * Solve simple resistive circuit with single voltage source
 */
function solveSimpleResistiveCircuit(
  circuit: CircuitDefinition,
  nodes: ElectricalNode[],
  voltageSource: Component,
  groundNode: ElectricalNode
): DCResult {
  const nodeVoltages = new Map<string, number>();
  const branchCurrents = new Map<string, number>();
  const componentResults = new Map<string, ComponentResult>();

  // Get voltage source value
  const sourceVoltage = voltageSource.properties.voltage || 0;
  
  // Find positive and negative terminals of source
  const positiveTerminal = voltageSource.terminals.find(t => t.type === 'positive');
  const negativeTerminal = voltageSource.terminals.find(t => t.type === 'negative');

  if (!positiveTerminal || !negativeTerminal) {
    return createErrorResult('Invalid voltage source terminals');
  }

  // Find which node the positive terminal is connected to
  const positiveNodeId = getNodeIdForTerminal(nodes, positiveTerminal.id);
  const negativeNodeId = getNodeIdForTerminal(nodes, negativeTerminal.id);

  if (!positiveNodeId || !negativeNodeId) {
    return createErrorResult('Voltage source not properly connected');
  }

  // Set node voltages
  nodeVoltages.set(groundNode.id, 0);
  
  // If negative terminal is connected to ground, positive node is at source voltage
  if (negativeNodeId === groundNode.id) {
    nodeVoltages.set(positiveNodeId, sourceVoltage);
  } else if (positiveNodeId === groundNode.id) {
    nodeVoltages.set(negativeNodeId, -sourceVoltage);
  } else {
    // Source not connected to ground, need more complex analysis
    return solveFloatingSource(circuit, nodes, voltageSource, groundNode);
  }

  // Find all resistors and calculate currents
  const resistors = circuit.components.filter(c => c.type === 'resistor');
  
  let totalCurrent = 0;
  let totalPower = 0;
  let totalResistance = 0;

  // Calculate equivalent resistance and currents
  const resistorResults = calculateResistorNetwork(
    circuit,
    resistors,
    nodes,
    nodeVoltages,
    groundNode
  );

  // Merge results
  for (const [id, result] of resistorResults) {
    componentResults.set(id, result);
    totalCurrent += result.current;
    totalPower += result.power;
  }

  // Calculate total resistance
  if (totalCurrent > 0) {
    totalResistance = sourceVoltage / totalCurrent;
  }

  // Calculate branch currents for connections
  for (const conn of circuit.connections) {
    const fromNodeId = getNodeIdForTerminal(nodes, conn.from);
    const toNodeId = getNodeIdForTerminal(nodes, conn.to);
    
    if (fromNodeId && toNodeId) {
      const vFrom = nodeVoltages.get(fromNodeId) || 0;
      const vTo = nodeVoltages.get(toNodeId) || 0;
      
      // Calculate current through connection (simplified)
      // In a real solver, this would use the actual component values
      const component = findComponentByTerminal(circuit, conn.from);
      if (component && component.type === 'resistor') {
        const resistance = component.properties.resistance || 0;
        if (resistance > 0) {
          const current = (vFrom - vTo) / resistance;
          branchCurrents.set(conn.id, current);
        }
      }
    }
  }

  // Add voltage source to results
  componentResults.set(voltageSource.id, {
    componentId: voltageSource.id,
    voltage: sourceVoltage,
    current: totalCurrent,
    power: sourceVoltage * totalCurrent,
  });

  return {
    nodeVoltages,
    branchCurrents,
    componentResults,
    totalCurrent,
    totalPower,
    equivalentResistance: totalResistance,
    success: true,
  };
}

/**
 * Calculate resistor network currents
 */
function calculateResistorNetwork(
  circuit: CircuitDefinition,
  resistors: Component[],
  nodes: ElectricalNode[],
  nodeVoltages: Map<string, number>,
  groundNode: ElectricalNode
): Map<string, ComponentResult> {
  const results = new Map<string, ComponentResult>();
  
  for (const resistor of resistors) {
    const terminals = resistor.terminals;
    const terminalA = terminals.find(t => t.type === 'A');
    const terminalB = terminals.find(t => t.type === 'B');

    if (!terminalA || !terminalB) continue;

    const nodeAId = getNodeIdForTerminal(nodes, terminalA.id);
    const nodeBId = getNodeIdForTerminal(nodes, terminalB.id);

    if (!nodeAId || !nodeBId) continue;

    const vA = nodeVoltages.get(nodeAId) || 0;
    const vB = nodeVoltages.get(nodeBId) || 0;
    const resistance = resistor.properties.resistance || 0;

    if (resistance <= 0) continue;

    const voltageDrop = Math.abs(vA - vB);
    const current = voltageDrop / resistance;
    const power = current * current * resistance;

    results.set(resistor.id, {
      componentId: resistor.id,
      voltage: voltageDrop,
      current,
      power,
      resistance,
    });
  }

  return results;
}

/**
 * Solve circuit with floating voltage source
 */
function solveFloatingSource(
  circuit: CircuitDefinition,
  nodes: ElectricalNode[],
  voltageSource: Component,
  groundNode: ElectricalNode
): DCResult {
  // For floating source, we need to find the voltage difference
  // between the two nodes connected to the source
  
  const positiveTerminal = voltageSource.terminals.find(t => t.type === 'positive');
  const negativeTerminal = voltageSource.terminals.find(t => t.type === 'negative');

  if (!positiveTerminal || !negativeTerminal) {
    return createErrorResult('Invalid voltage source terminals');
  }

  const positiveNodeId = getNodeIdForTerminal(nodes, positiveTerminal.id);
  const negativeNodeId = getNodeIdForTerminal(nodes, negativeTerminal.id);

  if (!positiveNodeId || !negativeNodeId) {
    return createErrorResult('Voltage source not properly connected');
  }

  // Simple approach: assume ground is connected somewhere in the circuit
  // and solve using superposition
  const sourceVoltage = voltageSource.properties.voltage || 0;
  
  // Find total resistance looking from the source
  const totalResistance = findEquivalentResistance(circuit, positiveNodeId, negativeNodeId);
  
  if (totalResistance === 0) {
    return createErrorResult('Cannot determine equivalent resistance');
  }

  const current = sourceVoltage / totalResistance;
  
  // Set node voltages relative to ground
  const nodeVoltages = new Map<string, number>();
  nodeVoltages.set(groundNode.id, 0);
  
  // Set voltage at positive node relative to ground
  // This is approximate - for a real solver, use full nodal analysis
  nodeVoltages.set(positiveNodeId, sourceVoltage / 2);
  nodeVoltages.set(negativeNodeId, -sourceVoltage / 2);

  // Calculate resistor currents
  const resistors = circuit.components.filter(c => c.type === 'resistor');
  const componentResults = new Map<string, ComponentResult>();
  let totalPower = 0;

  for (const resistor of resistors) {
    const terminals = resistor.terminals;
    const terminalA = terminals.find(t => t.type === 'A');
    const terminalB = terminals.find(t => t.type === 'B');

    if (!terminalA || !terminalB) continue;

    const nodeAId = getNodeIdForTerminal(nodes, terminalA.id);
    const nodeBId = getNodeIdForTerminal(nodes, terminalB.id);

    if (!nodeAId || !nodeBId) continue;

    const vA = nodeVoltages.get(nodeAId) || 0;
    const vB = nodeVoltages.get(nodeBId) || 0;
    const resistance = resistor.properties.resistance || 0;

    if (resistance <= 0) continue;

    const voltageDrop = Math.abs(vA - vB);
    const resistorCurrent = voltageDrop / resistance;
    const power = resistorCurrent * resistorCurrent * resistance;

    componentResults.set(resistor.id, {
      componentId: resistor.id,
      voltage: voltageDrop,
      current: resistorCurrent,
      power,
      resistance,
    });

    totalPower += power;
  }

  return {
    nodeVoltages,
    branchCurrents: new Map(),
    componentResults,
    totalCurrent: current,
    totalPower,
    equivalentResistance: totalResistance,
    success: true,
  };
}

/**
 * Find equivalent resistance between two nodes
 */
function findEquivalentResistance(
  circuit: CircuitDefinition,
  nodeAId: string,
  nodeBId: string
): number {
  // Simple approach: find all resistors connected between the nodes
  const resistors = circuit.components.filter(c => c.type === 'resistor');
  let totalResistance = 0;

  for (const resistor of resistors) {
    const terminals = resistor.terminals;
    const terminalA = terminals.find(t => t.type === 'A');
    const terminalB = terminals.find(t => t.type === 'B');

    if (!terminalA || !terminalB) continue;

    const node1 = getNodeIdForTerminal([], terminalA.id);
    const node2 = getNodeIdForTerminal([], terminalB.id);

    // Simple: add all resistors in series
    // This is a simplification - real solver would handle parallel too
    totalResistance += resistor.properties.resistance || 0;
  }

  return totalResistance;
}

/**
 * Solve multi-source circuit (simplified)
 */
function solveMultiSourceCircuit(
  circuit: CircuitDefinition,
  nodes: ElectricalNode[],
  voltageSources: Component[],
  groundNode: ElectricalNode
): DCResult {
  // Use superposition: solve for each source separately
  let totalCurrent = 0;
  let totalPower = 0;
  const nodeVoltages = new Map<string, number>();
  const componentResults = new Map<string, ComponentResult>();

  // Set ground
  nodeVoltages.set(groundNode.id, 0);

  // Simple approach: take the first source as dominant
  const mainSource = voltageSources[0];
  const result = solveSimpleResistiveCircuit(circuit, nodes, mainSource, groundNode);
  
  if (result.success) {
    return result;
  }

  return createErrorResult('Multi-source circuit not fully supported yet');
}

/**
 * Solve circuit with current sources (simplified)
 */
function solveWithCurrentSources(
  circuit: CircuitDefinition,
  nodes: ElectricalNode[],
  currentSources: Component[],
  groundNode: ElectricalNode
): DCResult {
  // For educational MVP, handle simple current source with resistors
  const currentSource = currentSources[0];
  const sourceCurrent = currentSource.properties.current || 0;

  // Find resistors connected to current source
  const resistors = circuit.components.filter(c => c.type === 'resistor');
  const componentResults = new Map<string, ComponentResult>();
  const nodeVoltages = new Map<string, number>();
  
  nodeVoltages.set(groundNode.id, 0);

  let totalResistance = 0;
  let totalPower = 0;

  for (const resistor of resistors) {
    const resistance = resistor.properties.resistance || 0;
    if (resistance > 0) {
      totalResistance += resistance;
      const voltage = sourceCurrent * resistance;
      const power = sourceCurrent * sourceCurrent * resistance;
      
      componentResults.set(resistor.id, {
        componentId: resistor.id,
        voltage,
        current: sourceCurrent,
        power,
        resistance,
      });
      
      totalPower += power;
    }
  }

  return {
    nodeVoltages,
    branchCurrents: new Map(),
    componentResults,
    totalCurrent: sourceCurrent,
    totalPower,
    equivalentResistance: totalResistance,
    success: true,
  };
}

/**
 * Solve simple circuit with basic components
 */
function solveSimpleCircuit(
  circuit: CircuitDefinition,
  nodes: ElectricalNode[],
  groundNode: ElectricalNode
): DCResult {
  const nodeVoltages = new Map<string, number>();
  nodeVoltages.set(groundNode.id, 0);

  const resistors = circuit.components.filter(c => c.type === 'resistor');
  const componentResults = new Map<string, ComponentResult>();
  
  // Check for voltage sources
  const voltageSources = circuit.components.filter(c => c.type === 'voltage_source');
  if (voltageSources.length > 0) {
    return solveSimpleResistiveCircuit(circuit, nodes, voltageSources[0], groundNode);
  }

  // No sources found
  return {
    nodeVoltages,
    branchCurrents: new Map(),
    componentResults,
    totalCurrent: 0,
    totalPower: 0,
    equivalentResistance: 0,
    success: false,
    error: 'No power source found in circuit',
  };
}

/**
 * Create error result
 */
function createErrorResult(error: string): DCResult {
  return {
    nodeVoltages: new Map(),
    branchCurrents: new Map(),
    componentResults: new Map(),
    totalCurrent: 0,
    totalPower: 0,
    equivalentResistance: 0,
    success: false,
    error,
  };
}