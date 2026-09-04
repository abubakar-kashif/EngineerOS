/**
 * DC Solver
 * Person 1: Simulation Engine
 * Solves DC circuits using Ohm's Law, KCL, and KVL
 */

import type {
  CircuitDefinition,
  ElectricalNode,
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

import { analyzeDiode, analyzeLED } from './diodeAnalysis';

export interface DCResult {
  nodeVoltages: Map<string, number>;
  branchCurrents: Map<string, number>;
  componentResults: Map<string, ComponentResult>;
  totalCurrent: number;
  totalPower: number;
  equivalentResistance: number;
  success: boolean;
  error?: string;
}

export interface ComponentResult {
  componentId: string;
  voltage: number;
  current: number;
  power: number;
  resistance?: number;
}

export function solveDC(circuit: CircuitDefinition): DCResult {
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
      error: `Validation failed: ${validation.errors[0]?.message || 'Unknown error'}`,
    };
  }

  const graphResult = buildElectricalNodes(circuit);
  
  const fatalErrors = graphResult.errors.filter(e => 
    e.includes('has no connections') || 
    e.includes('No components with terminals found')
  );
  
  if (fatalErrors.length > 0) {
    return {
      nodeVoltages: new Map(),
      branchCurrents: new Map(),
      componentResults: new Map(),
      totalCurrent: 0,
      totalPower: 0,
      equivalentResistance: 0,
      success: false,
      error: `Graph error: ${fatalErrors[0]}`,
    };
  }

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

  return solveResistiveNetwork(circuit, graphResult.nodes, groundNode);
}

function solveResistiveNetwork(
  circuit: CircuitDefinition,
  nodes: ElectricalNode[],
  groundNode: ElectricalNode
): DCResult {
  const nodeVoltages = new Map<string, number>();
  const componentResults = new Map<string, ComponentResult>();
  const branchCurrents = new Map<string, number>();

  nodeVoltages.set(groundNode.id, 0);

  const voltageSources = circuit.components.filter(c => c.type === 'voltage_source');
  if (voltageSources.length === 0) {
    return {
      nodeVoltages,
      branchCurrents,
      componentResults,
      totalCurrent: 0,
      totalPower: 0,
      equivalentResistance: 0,
      success: false,
      error: 'No voltage source found',
    };
  }

  const voltageSource = voltageSources[0];
  const sourceVoltage = voltageSource.properties.voltage || 0;

  const posTerm = voltageSource.terminals.find(t => t.type === 'positive');
  const negTerm = voltageSource.terminals.find(t => t.type === 'negative');
  
  if (!posTerm || !negTerm) {
    return {
      nodeVoltages,
      branchCurrents,
      componentResults,
      totalCurrent: 0,
      totalPower: 0,
      equivalentResistance: 0,
      success: false,
      error: 'Invalid voltage source terminals',
    };
  }

  const posNodeId = getNodeIdForTerminal(nodes, posTerm.id);
  const negNodeId = getNodeIdForTerminal(nodes, negTerm.id);

  if (!posNodeId || !negNodeId) {
    return {
      nodeVoltages,
      branchCurrents,
      componentResults,
      totalCurrent: 0,
      totalPower: 0,
      equivalentResistance: 0,
      success: false,
      error: 'Voltage source not connected',
    };
  }

  // Set node voltages
  if (negNodeId === groundNode.id) {
    nodeVoltages.set(posNodeId, sourceVoltage);
  } else if (posNodeId === groundNode.id) {
    nodeVoltages.set(negNodeId, -sourceVoltage);
  } else {
    nodeVoltages.set(posNodeId, sourceVoltage / 2);
    nodeVoltages.set(negNodeId, -sourceVoltage / 2);
  }

  const resistors = circuit.components.filter(c => c.type === 'resistor');
  
  // Check if resistors are in parallel (share same node pair)
  // Get the node pair for each resistor
  const resistorNodePairs = new Map<string, string[]>();
  
  for (const resistor of resistors) {
    const termA = resistor.terminals.find(t => t.type === 'A');
    const termB = resistor.terminals.find(t => t.type === 'B');
    if (!termA || !termB) continue;
    
    const nodeAId = getNodeIdForTerminal(nodes, termA.id);
    const nodeBId = getNodeIdForTerminal(nodes, termB.id);
    if (!nodeAId || !nodeBId) continue;
    
    const key = [nodeAId, nodeBId].sort().join('--');
    if (!resistorNodePairs.has(key)) {
      resistorNodePairs.set(key, []);
    }
    resistorNodePairs.get(key)!.push(resistor.id);
  }

  // Detect parallel: all resistors share the same node pair
  let isParallel = false;
  if (resistorNodePairs.size === 1 && resistors.length > 1) {
    isParallel = true;
  }

  // Also detect parallel by checking if both resistors connect to ground and source
  // This catches the case where resistors are in parallel but not detected above
  if (!isParallel && resistors.length === 2) {
    // Check if both resistors connect to the same two nodes
    const keys = Array.from(resistorNodePairs.keys());
    if (keys.length === 1) {
      isParallel = true;
    }
  }

  // Calculate equivalent resistance
  let equivalentResistance = 0;

  if (isParallel) {
    // Parallel: 1/Req = 1/R1 + 1/R2 + ...
    let sum = 0;
    for (const resistor of resistors) {
      const r = resistor.properties.resistance || 0;
      if (r > 0) {
        sum += 1 / r;
      }
    }
    equivalentResistance = sum > 0 ? 1 / sum : 0;
  } else {
    // Series: Req = R1 + R2 + ...
    for (const resistor of resistors) {
      equivalentResistance += resistor.properties.resistance || 0;
    }
  }

  // For parallel with 2 equal resistors, Req = R/2
  if (isParallel && resistors.length === 2) {
    const r1 = resistors[0].properties.resistance || 0;
    const r2 = resistors[1].properties.resistance || 0;
    if (r1 === r2 && r1 > 0) {
      equivalentResistance = r1 / 2;
    }
  }

  // Total current
  let totalCurrent = 0;
  if (equivalentResistance > 0) {
    totalCurrent = sourceVoltage / equivalentResistance;
  }

  let totalPower = 0;

  // Calculate each resistor's values
  for (const resistor of resistors) {
    const termA = resistor.terminals.find(t => t.type === 'A');
    const termB = resistor.terminals.find(t => t.type === 'B');
    if (!termA || !termB) continue;

    const nodeAId = getNodeIdForTerminal(nodes, termA.id);
    const nodeBId = getNodeIdForTerminal(nodes, termB.id);
    if (!nodeAId || !nodeBId) continue;

    const resistance = resistor.properties.resistance || 0;
    if (resistance <= 0) continue;

    let voltageDrop: number;
    let current: number;

    if (isParallel) {
      // In parallel: voltage is same across all resistors = source voltage
      voltageDrop = sourceVoltage;
      current = voltageDrop / resistance;
    } else {
      // In series: current is same
      current = totalCurrent;
      voltageDrop = current * resistance;
    }

    const power = current * current * resistance;

    componentResults.set(resistor.id, {
      componentId: resistor.id,
      voltage: voltageDrop,
      current,
      power,
      resistance,
    });

    totalPower += power;
  }

  // For parallel, total current is sum of branch currents
  if (isParallel) {
    totalCurrent = 0;
    for (const resistor of resistors) {
      const result = componentResults.get(resistor.id);
      if (result) {
        totalCurrent += result.current;
      }
    }
  }

  // Diode / LED in series with resistive path (educational DC model)
  const nonlinear = circuit.components.filter(c => c.type === 'diode' || c.type === 'led');
  if (nonlinear.length > 0 && resistors.length > 0) {
    const device = nonlinear[0];
    const vf =
      device.properties.forwardVoltage ??
      (device.type === 'led' ? 2.0 : 0.7);
    const seriesR =
      equivalentResistance > 0
        ? equivalentResistance
        : resistors.reduce((s, r) => s + (r.properties.resistance || 0), 0);

    const analysis =
      device.type === 'led'
        ? analyzeLED(sourceVoltage, vf, seriesR)
        : analyzeDiode(sourceVoltage, vf, seriesR, false);

    totalCurrent = analysis.current;
    totalPower = 0;
    componentResults.clear();

    for (const resistor of resistors) {
      const resistance = resistor.properties.resistance || 0;
      if (resistance <= 0) continue;
      const voltageDrop = analysis.current * resistance;
      const power = analysis.current * analysis.current * resistance;
      componentResults.set(resistor.id, {
        componentId: resistor.id,
        voltage: voltageDrop,
        current: analysis.current,
        power,
        resistance,
      });
      totalPower += power;
    }

    componentResults.set(device.id, {
      componentId: device.id,
      voltage: analysis.voltageDrop,
      current: analysis.current,
      power: analysis.power,
    });

    // Effective load seen by the source
    if (analysis.current > 0) {
      equivalentResistance = sourceVoltage / analysis.current;
    }
  }

  // Add voltage source
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
    equivalentResistance,
    success: true,
  };
}