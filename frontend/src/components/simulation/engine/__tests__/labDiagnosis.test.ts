import { describe, expect, it } from "vitest";
import { toEngineCircuit } from "../../editorAdapters";
import { createFullWaveBridgeStarter } from "../../starters/fullWaveBridge";
import { createHalfWaveRectifierStarter } from "../../starters/halfWaveRectifier";
import { createRcLowPassStarter } from "../../starters/rcLowPass";
import { createSeriesResonanceStarter } from "../../starters/seriesResonance";
import type { CircuitDefinition } from "../circuitGraph";
import { solveCircuit } from "../circuitSolver";
import { diagnoseLab } from "../labDiagnosis";
import type { SimulationResult } from "../types";

function lowPass(): CircuitDefinition {
  const circuit = toEngineCircuit(createRcLowPassStarter());
  circuit.experimentId = "rc-low-pass-filter";
  return circuit;
}

function classes(circuit: CircuitDefinition, result?: SimulationResult | null) {
  return diagnoseLab(circuit, result === undefined ? solveCircuit(circuit) : result);
}

describe("lab diagnosis", () => {
  it("calls a matching low-pass response Expected and does not invent a fault", () => {
    const findings = classes(lowPass());
    expect(findings.some((item) => item.classification === "Confirmed")).toBe(false);
    expect(findings.some((item) => item.classification === "Expected" && item.evidence.includes("Simulated gain"))).toBe(true);
  });

  it("confirms a missing ground from the drawing", () => {
    const circuit = lowPass();
    circuit.components = circuit.components.filter((component) => component.type !== "ground");
    const findings = diagnoseLab(circuit, null);
    const ground = findings.find((item) => item.topic === "missing ground");
    expect(ground?.classification).toBe("Confirmed");
    expect(ground?.evidence).toMatch(/no ground/i);
  });

  it("confirms a capacitor with no wires", () => {
    const circuit = lowPass();
    const capacitor = circuit.components.find((component) => component.type === "capacitor")!;
    const terminals = new Set(capacitor.terminals.map((terminal) => terminal.id));
    circuit.connections = circuit.connections.filter(
      (connection) => !terminals.has(connection.from) && !terminals.has(connection.to),
    );
    const findings = diagnoseLab(circuit, null);
    const open = findings.find((item) => item.topic === "disconnected capacitor");
    expect(open?.classification).toBe("Confirmed");
    expect(open?.suggestion).toMatch(/capacitor/i);
  });

  it("confirms a zero drive frequency from the attached metrics", () => {
    const circuit = lowPass();
    const solved = solveCircuit(circuit);
    const lp = solved.measurements!.rcLowPass!;
    const findings = diagnoseLab(circuit, {
      ...solved,
      measurements: { ...solved.measurements!, rcLowPass: { ...lp, driveFrequency: 0 } },
    });
    expect(findings.find((item) => item.topic === "incorrect frequency")?.classification).toBe("Confirmed");
  });

  it("marks a gain that disagrees with 1/sqrt(1+(f/fc)^2) as Likely, without inventing a wiring code", () => {
    const circuit = lowPass();
    const solved = solveCircuit(circuit);
    const lp = solved.measurements!.rcLowPass!;
    const findings = diagnoseLab(circuit, {
      ...solved,
      measurements: { ...solved.measurements!, rcLowPass: { ...lp, gainAtDrive: 0.05, fcSimulated: lp.fcTheoretical * 4 } },
    });
    const unexpected = findings.find((item) => item.topic === "unexpected RC filter response");
    expect(unexpected?.classification).toBe("Likely");
    expect(unexpected?.evidence).toContain("0.050");
    expect(findings.some((item) => item.topic === "MISSING_GROUND")).toBe(false);
  });

  it("treats half-wave and full-wave starters as expected conduction", () => {
    const half = toEngineCircuit(createHalfWaveRectifierStarter());
    const halfFindings = classes(half);
    expect(halfFindings.some((item) => item.classification === "Expected" && item.topic === "half-wave conduction")).toBe(true);

    const full = toEngineCircuit(createFullWaveBridgeStarter());
    const fullFindings = classes(full);
    expect(fullFindings.some((item) => item.classification === "Expected" && item.topic === "bridge conduction")).toBe(true);
  });

  it("flags a reversed half-wave diode when the output peak collapses", () => {
    const circuit = toEngineCircuit(createHalfWaveRectifierStarter());
    const diode = circuit.components.find((component) => component.type === "diode")!;
    const [anode, cathode] = diode.terminals;
    for (const connection of circuit.connections) {
      if (connection.from === anode.id) connection.from = cathode.id;
      else if (connection.from === cathode.id) connection.from = anode.id;
      if (connection.to === anode.id) connection.to = cathode.id;
      else if (connection.to === cathode.id) connection.to = anode.id;
    }
    const result = solveCircuit(circuit);
    const half = result.measurements?.halfWaveRectifier;
    expect(half).toBeTruthy();
    expect(half!.VoutPeak).toBeLessThan(0.05 * half!.VinPeak);
    const findings = diagnoseLab(circuit, result);
    expect(findings.find((item) => item.topic === "diode not conducting")?.classification).toBe("Likely");
  });

  it("calls a series-resonance peak near 1/(2π√LC) Expected", () => {
    const circuit = toEngineCircuit(createSeriesResonanceStarter());
    const findings = classes(circuit);
    expect(findings.some((item) => item.classification === "Expected" && item.topic === "series resonance")).toBe(true);
  });
});
