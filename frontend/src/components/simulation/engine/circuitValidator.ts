/**
 * Circuit Validator
 * Person 1: Simulation Engine
 * Validates circuit structure and electrical rules
 */

import {
  CircuitDefinition,
  Component,
  Connection,
  Terminal,
  findComponent,
  findTerminal,
  getConnectionsForTerminal,
  findComponentByTerminal,
  ComponentTerminals,
} from './circuitGraph';

import {
  buildElectricalNodes,
  hasGround,
  GraphBuilderResult,
} from './circuitGraphBuilder';

import {
  ValidationResult,
  SimulationError,
  createErrorWithDetails,
  ErrorMessages,
  ErrorCode,
} from './errors';

export interface ValidatorOptions {
  strictMode?: boolean; // Enables additional checks
  checkLEDCurrentLimit?: boolean;
}

/**
 * Main circuit validator
 * Performs structural and electrical validation
 */
export function validateCircuit(
  circuit: CircuitDefinition,
  options: ValidatorOptions = {}
): ValidationResult {
  const errors: SimulationError[] = [];
  const warnings: SimulationError[] = [];

  // 1. Basic structural validation
  validateStructure(circuit, errors, warnings);

  // 2. Validate component values
  validateComponentValues(circuit, errors, warnings);

  // 3. Build electrical nodes
  const graphResult = buildElectricalNodes(circuit);
  
  // 4. Validate electrical rules
  validateElectricalRules(circuit, graphResult, errors, warnings, options);

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Structural validation
 */
function validateStructure(
  circuit: CircuitDefinition,
  errors: SimulationError[],
  warnings: SimulationError[]
): void {
  // Check for empty circuit
  if (circuit.components.length === 0) {
    errors.push(createErrorWithDetails('INVALID_COMPONENT_ID', 'Circuit has no components', {
      suggestedFix: 'Add at least one component to the circuit.',
    }));
    return;
  }

  // Validate each component
  for (const component of circuit.components) {
    validateComponent(component, circuit, errors, warnings);
  }

  // Validate each connection
  for (const connection of circuit.connections) {
    validateConnection(connection, circuit, errors, warnings);
  }

  // Check for duplicate connections
  checkDuplicateConnections(circuit, errors);
}

/**
 * Validate a single component
 */
function validateComponent(
  component: Component,
  circuit: CircuitDefinition,
  errors: SimulationError[],
  warnings: SimulationError[]
): void {
  // Check component ID
  if (!component.id || component.id.trim() === '') {
    errors.push(createErrorWithDetails('INVALID_COMPONENT_ID', 'Component has empty ID', {
      affectedComponents: [component.id || 'unknown'],
    }));
    return;
  }

  // Check component type
  const validTypes = [
    'resistor', 'capacitor', 'inductor', 'diode', 'led',
    'switch', 'voltage_source', 'current_source', 'ground',
    'voltmeter', 'ammeter'
  ];
  
  if (!validTypes.includes(component.type)) {
    errors.push(createErrorWithDetails('UNSUPPORTED_COMPONENT', 
      `Unsupported component type: ${component.type}`,
      {
        affectedComponents: [component.id],
        suggestedFix: 'Use a supported component type.',
      }
    ));
    return;
  }

  // Check terminals match component type
  const expectedTerminals = ComponentTerminals[component.type];
  if (expectedTerminals) {
    const terminalTypes = component.terminals.map(t => t.type);
    const missingTerminals = expectedTerminals.filter(t => !terminalTypes.includes(t));
    
    if (missingTerminals.length > 0) {
      errors.push(createErrorWithDetails('INVALID_TERMINAL_ID',
        `Component ${component.id} missing terminals: ${missingTerminals.join(', ')}`,
        {
          affectedComponents: [component.id],
          suggestedFix: `Add ${missingTerminals.join(', ')} terminal(s) to ${component.id}.`,
        }
      ));
    }
  }

  // Validate terminal IDs
  for (const terminal of component.terminals) {
    if (!terminal.id || terminal.id.trim() === '') {
      errors.push(createErrorWithDetails('INVALID_TERMINAL_ID',
        `Component ${component.id} has invalid terminal ID`,
        {
          affectedComponents: [component.id],
          affectedTerminals: [terminal.id || 'unknown'],
        }
      ));
    }
  }

  // Check for duplicate terminal IDs within component
  const terminalIds = component.terminals.map(t => t.id);
  const duplicateTerminals = terminalIds.filter((id, index) => terminalIds.indexOf(id) !== index);
  if (duplicateTerminals.length > 0) {
    errors.push(createErrorWithDetails('DUPLICATE_CONNECTION',
      `Component ${component.id} has duplicate terminal IDs: ${duplicateTerminals.join(', ')}`,
      {
        affectedComponents: [component.id],
        affectedTerminals: duplicateTerminals,
      }
    ));
  }

  // Check component values
  if (component.type === 'resistor') {
    const resistance = component.properties.resistance;
    if (resistance !== undefined && resistance <= 0) {
      errors.push(createErrorWithDetails('INVALID_COMPONENT_VALUE',
        `Resistor ${component.id} has invalid resistance: ${resistance}Ω`,
        {
          affectedComponents: [component.id],
          suggestedFix: 'Resistance must be greater than 0 Ω.',
        }
      ));
    }
  }

  if (component.type === 'voltage_source') {
    const voltage = component.properties.voltage;
    if (voltage !== undefined && voltage < 0) {
      errors.push(createErrorWithDetails('INVALID_COMPONENT_VALUE',
        `Voltage source ${component.id} has invalid voltage: ${voltage}V`,
        {
          affectedComponents: [component.id],
          suggestedFix: 'Voltage must be >= 0 V.',
        }
      ));
    }
  }

  if (component.type === 'current_source') {
    const current = component.properties.current;
    if (current !== undefined && current < 0) {
      errors.push(createErrorWithDetails('INVALID_COMPONENT_VALUE',
        `Current source ${component.id} has invalid current: ${current}A`,
        {
          affectedComponents: [component.id],
          suggestedFix: 'Current must be >= 0 A.',
        }
      ));
    }
  }
}

/**
 * Validate a single connection
 */
function validateConnection(
  connection: Connection,
  circuit: CircuitDefinition,
  errors: SimulationError[],
  warnings: SimulationError[]
): void {
  // Check connection ID
  if (!connection.id || connection.id.trim() === '') {
    errors.push(createErrorWithDetails('INVALID_CONNECTION', 'Connection has empty ID', {}));
    return;
  }

  // Check from terminal exists
  const fromTerminal = findTerminal(circuit, connection.from);
  if (!fromTerminal) {
    errors.push(createErrorWithDetails('INVALID_TERMINAL_ID',
      `Connection ${connection.id} has invalid 'from' terminal: ${connection.from}`,
      {
        affectedTerminals: [connection.from],
        suggestedFix: `Check if terminal ${connection.from} exists.`,
      }
    ));
  }

  // Check to terminal exists
  const toTerminal = findTerminal(circuit, connection.to);
  if (!toTerminal) {
    errors.push(createErrorWithDetails('INVALID_TERMINAL_ID',
      `Connection ${connection.id} has invalid 'to' terminal: ${connection.to}`,
      {
        affectedTerminals: [connection.to],
        suggestedFix: `Check if terminal ${connection.to} exists.`,
      }
    ));
  }

  // Check for self-connection
  if (connection.from === connection.to) {
    errors.push(createErrorWithDetails('INVALID_CONNECTION',
      `Connection ${connection.id} connects a terminal to itself`,
      {
        affectedTerminals: [connection.from],
        suggestedFix: 'A terminal cannot be connected to itself.',
      }
    ));
  }

  // Check components for from and to are different (can't connect same component terminals)
  const fromComponent = findComponentByTerminal(circuit, connection.from);
  const toComponent = findComponentByTerminal(circuit, connection.to);
  
  if (fromComponent && toComponent && fromComponent.id === toComponent.id) {
    warnings.push(createErrorWithDetails('INVALID_CONNECTION',
      `Connection ${connection.id} connects terminals of the same component: ${fromComponent.id}`,
      {
        affectedComponents: [fromComponent.id],
        affectedTerminals: [connection.from, connection.to],
        suggestedFix: 'Consider if this is intentional (connecting component terminals together).',
      }
    ));
  }
}

/**
 * Check for duplicate connections
 */
function checkDuplicateConnections(
  circuit: CircuitDefinition,
  errors: SimulationError[]
): void {
  const seen = new Set<string>();
  
  for (const conn of circuit.connections) {
    // Create a sorted key to detect duplicates in both directions
    const key = [conn.from, conn.to].sort().join('--');
    
    if (seen.has(key)) {
      errors.push(createErrorWithDetails('DUPLICATE_CONNECTION',
        `Duplicate connection detected: ${conn.from} ↔ ${conn.to}`,
        {
          affectedTerminals: [conn.from, conn.to],
          suggestedFix: 'Remove duplicate connections.',
        }
      ));
    }
    seen.add(key);
  }
}

/**
 * Validate component values
 */
function validateComponentValues(
  circuit: CircuitDefinition,
  errors: SimulationError[],
  warnings: SimulationError[]
): void {
  for (const component of circuit.components) {
    // Check for zero resistance
    if (component.type === 'resistor') {
      const resistance = component.properties.resistance;
      if (resistance === 0) {
        warnings.push(createErrorWithDetails('SHORT_CIRCUIT',
          `Resistor ${component.id} has 0Ω resistance (short circuit)`,
          {
            affectedComponents: [component.id],
            suggestedFix: 'Use a resistance greater than 0 Ω.',
          }
        ));
      }
      if (resistance === undefined || resistance === null) {
        errors.push(createErrorWithDetails('INVALID_COMPONENT_VALUE',
          `Resistor ${component.id} has no resistance value`,
          {
            affectedComponents: [component.id],
            suggestedFix: 'Set a resistance value for the resistor.',
          }
        ));
      }
    }

    // Check for LED current limiting
    if (component.type === 'led') {
      // Check if LED has a series resistor
      const hasCurrentLimit = checkLEDCurrentLimit(circuit, component);
      if (!hasCurrentLimit) {
        errors.push(createErrorWithDetails('LED_NO_CURRENT_LIMIT',
          `LED ${component.id} has no current-limiting resistor`,
          {
            affectedComponents: [component.id],
            suggestedFix: 'Add a current-limiting resistor in series with the LED.',
          }
        ));
      }
    }
  }
}

/**
 * Check if LED has current limiting
 */
function checkLEDCurrentLimit(circuit: CircuitDefinition, led: Component): boolean {
  // Get connections for LED terminals
  const ledTerminals = led.terminals.map(t => t.id);
  let hasResistor = false;

  for (const terminalId of ledTerminals) {
    const connections = getConnectionsForTerminal(circuit, terminalId);
    for (const conn of connections) {
      // Check connected terminal's component
      const connectedTerminalId = conn.from === terminalId ? conn.to : conn.from;
      const connectedComponent = findComponentByTerminal(circuit, connectedTerminalId);
      
      if (connectedComponent && connectedComponent.type === 'resistor') {
        hasResistor = true;
        break;
      }
    }
    if (hasResistor) break;
  }

  return hasResistor;
}

/**
 * Electrical validation
 */
function validateElectricalRules(
  circuit: CircuitDefinition,
  graphResult: GraphBuilderResult,
  errors: SimulationError[],
  warnings: SimulationError[],
  options: ValidatorOptions
): void {
  // Check for ground
  if (!hasGround(graphResult.nodes)) {
    errors.push(createErrorWithDetails('MISSING_GROUND',
      ErrorMessages.MISSING_GROUND,
      {
        suggestedFix: 'Add a ground component and connect it to the circuit.',
      }
    ));
  }

  // Check for floating nodes
  for (const node of graphResult.nodes) {
    // A node with only one terminal might be floating
    if (node.terminals.length === 1 && !node.isGround) {
      const terminal = node.terminals[0];
      const component = findComponentByTerminal(circuit, terminal);
      
      // Don't warn for measurement devices (voltmeter, ammeter)
      if (component && !['voltmeter', 'ammeter'].includes(component.type)) {
        warnings.push(createErrorWithDetails('FLOATING_NODE',
          `Floating node detected: ${node.id} with terminal ${terminal}`,
          {
            affectedTerminals: [terminal],
            affectedComponents: component ? [component.id] : undefined,
            suggestedFix: 'Connect this terminal to the circuit.',
          }
        ));
      }
    }
  }

  // Check for invalid source configurations
  validateSources(circuit, errors, warnings);

  // Check graph builder errors
  for (const error of graphResult.errors) {
    warnings.push(createErrorWithDetails('DANGLING_TERMINAL',
      error,
      {
        suggestedFix: 'Connect all terminals or remove unused components.',
      }
    ));
  }
}

/**
 * Validate source configurations
 */
function validateSources(
  circuit: CircuitDefinition,
  errors: SimulationError[],
  warnings: SimulationError[]
): void {
  const sources = circuit.components.filter(
    c => c.type === 'voltage_source' || c.type === 'current_source'
  );

  for (const source of sources) {
    const terminals = source.terminals;
    const positiveTerminal = terminals.find(t => t.type === 'positive');
    const negativeTerminal = terminals.find(t => t.type === 'negative');

    if (!positiveTerminal || !negativeTerminal) {
      errors.push(createErrorWithDetails('INVALID_SOURCE_CONFIGURATION',
        `Source ${source.id} has missing terminals`,
        {
          affectedComponents: [source.id],
          suggestedFix: 'Ensure both positive and negative terminals exist.',
        }
      ));
      continue;
    }

    // Check if source has any connections
    const posConnections = getConnectionsForTerminal(circuit, positiveTerminal.id);
    const negConnections = getConnectionsForTerminal(circuit, negativeTerminal.id);

    if (posConnections.length === 0 && negConnections.length === 0) {
      warnings.push(createErrorWithDetails('OPEN_CIRCUIT',
        `Source ${source.id} has no connections`,
        {
          affectedComponents: [source.id],
          suggestedFix: 'Connect the source to the circuit.',
        }
      ));
    }
  }
}