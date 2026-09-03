/**
 * Circuit validator: checks structural and electrical correctness before solving.
 * Produces human-readable errors with suggestions for the student.
 */
import type {
  CircuitDefinition,
  Net,
  ValidationError,
} from "./types";
import { parseTerminalRef } from "./types";
import {
  computeNets,
  isTerminalConnected,
  getComponentsByType,
  getAdjacentComponents,
} from "./circuitGraph";

let errorCounter = 0;
function makeError(
  severity: ValidationError["severity"],
  componentIds: string[],
  title: string,
  message: string,
  suggestion: string,
): ValidationError {
  return {
    id: `err-${++errorCounter}`,
    severity,
    componentIds,
    title,
    message,
    suggestion,
  };
}

// ── Structural validation ──

function validateStructure(circuit: CircuitDefinition): ValidationError[] {
  const errors: ValidationError[] = [];

  // Empty circuit
  if (circuit.components.length === 0) {
    errors.push(
      makeError("error", [], "Empty Circuit", "The circuit has no components.", "Add components from the palette to begin building your circuit."),
    );
    return errors;
  }

  // Floating (unconnected) terminals
  for (const comp of circuit.components) {
    if (comp.type === "ground") continue; // ground has only one terminal
    for (const term of comp.terminals) {
      const ref = `${comp.id}:${term.id}`;
      if (!isTerminalConnected(circuit, ref)) {
        errors.push(
          makeError("warning", [comp.id], "Floating Terminal",
            `${comp.label} terminal "${term.label}" is not connected to anything.`,
            `Connect a wire from ${comp.label} terminal "${term.label}" to another component.`),
        );
      }
    }
  }

  // Dangling wires (connection with null target)
  for (const conn of circuit.connections) {
    if (!conn.to) {
      const from = parseTerminalRef(conn.from);
      errors.push(
        makeError("warning", [from.componentId], "Dangling Wire",
          `A wire from ${from.componentId} terminal "${from.terminalId}" is not connected to a destination.`,
          `Complete the wire by clicking on a destination terminal, or delete the dangling wire.`),
      );
    }
  }

  return errors;
}

// ── Electrical validation ──

function validateElectrical(circuit: CircuitDefinition, nets: Net[]): ValidationError[] {
  const errors: ValidationError[] = [];

  // Missing ground
  const grounds = getComponentsByType(circuit, "ground");
  if (grounds.length === 0) {
    errors.push(
      makeError("error", [], "No Ground",
        "The circuit has no ground reference. Simulation requires a ground node.",
        "Add a Ground component from the Reference category and connect it to the circuit."),
    );
  } else if (grounds.length > 1) {
    errors.push(
      makeError("warning", grounds.map((g) => g.id), "Multiple Grounds",
        `Found ${grounds.length} ground nodes. Multiple grounds are connected together (same potential).`,
        "Use a single ground node unless you intentionally need multiple ground references."),
    );
  }

  // No voltage/current source
  const sources = [
    ...getComponentsByType(circuit, "voltage_source"),
    ...getComponentsByType(circuit, "current_source"),
  ];
  if (sources.length === 0) {
    errors.push(
      makeError("error", [], "No Source",
        "The circuit has no voltage or current source.",
        "Add a DC Voltage Source or Current Source from the Sources category."),
    );
  }

  // LED without current-limiting resistor
  const leds = getComponentsByType(circuit, "led");
  for (const led of leds) {
    const adjacent = getAdjacentComponents(circuit, led.id);
    const hasResistor = adjacent.some((id) => {
      const comp = circuit.components.find((c) => c.id === id);
      return comp?.type === "resistor";
    });
    if (!hasResistor) {
      // Check if the LED is directly connected to a voltage source
      const hasDirectSource = adjacent.some((id) => {
        const comp = circuit.components.find((c) => c.id === id);
        return comp?.type === "voltage_source" || comp?.type === "current_source";
      });
      if (hasDirectSource) {
        errors.push(
          makeError("error", [led.id], "LED Without Resistor",
            `${led.label} is connected directly to a source without a current-limiting resistor. This would destroy the LED in a real circuit.`,
            `Add a resistor in series with ${led.label} to limit the current to a safe value.`),
        );
      }
    }
  }

  // Short circuit detection: voltage source terminals on the same net
  for (const source of sources) {
    if (source.type === "voltage_source") {
      const posNet = nets.find((n) =>
        n.terminals.includes(`${source.id}:pos`),
      );
      const negNet = nets.find((n) =>
        n.terminals.includes(`${source.id}:neg`),
      );
      if (posNet && negNet && posNet.id === negNet.id) {
        errors.push(
          makeError("error", [source.id], "Short Circuit",
            `${source.label} positive and negative terminals are connected together. This creates a short circuit.`,
            `Add components (resistors, LEDs, etc.) between the positive and negative paths of ${source.label}.`),
        );
      }
    }
  }

  // Invalid component values
  for (const comp of circuit.components) {
    if (comp.type === "resistor") {
      const r = comp.properties.resistance as number;
      if (r <= 0) {
        errors.push(
          makeError("error", [comp.id], "Invalid Resistance",
            `${comp.label} has a resistance of ${r} Ω. Resistance must be positive.`,
            `Set ${comp.label} resistance to a positive value (e.g., 1000 Ω).`),
        );
      }
    }
    if (comp.type === "voltage_source") {
      const v = comp.properties.voltage as number;
      if (v === 0) {
        errors.push(
          makeError("warning", [comp.id], "Zero Voltage",
            `${comp.label} has a voltage of 0 V. The circuit will have no current flow.`,
            `Set ${comp.label} voltage to a non-zero value (e.g., 12 V).`),
        );
      }
    }
  }

  // Voltmeter in series (should be parallel)
  const voltmeters = getComponentsByType(circuit, "voltmeter");
  for (const vm of voltmeters) {
    // A voltmeter should have exactly 2 connections, one at each terminal
    // and should not be the only path between two nets
    const adj = getAdjacentComponents(circuit, vm.id);
    if (adj.length < 2) {
      errors.push(
        makeError("warning", [vm.id], "Voltmeter Connection",
          `${vm.label} should be connected across (in parallel with) the component being measured.`,
          `Connect ${vm.label} terminals across the component you want to measure voltage for.`),
      );
    }
  }

  return errors;
}

// ── Public API ──

/** Validate a complete circuit definition. Returns all errors/warnings. */
export function validateCircuit(circuit: CircuitDefinition): ValidationError[] {
  errorCounter = 0;
  const nets = computeNets(circuit);
  const structural = validateStructure(circuit);
  // Skip electrical checks if circuit is empty
  if (structural.some((e) => e.severity === "error" && e.componentIds.length === 0 && e.title === "Empty Circuit")) {
    return structural;
  }
  const electrical = validateElectrical(circuit, nets);
  return [...structural, ...electrical];
}

/** Check if circuit has blocking errors (severity === "error") */
export function hasBlockingErrors(errors: ValidationError[]): boolean {
  return errors.some((e) => e.severity === "error");
}
