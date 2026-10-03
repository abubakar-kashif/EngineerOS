import { describe, expect, it } from "vitest";
import { toEngineCircuit } from "../../editorAdapters";
import { createFullWaveBridgeStarter } from "../../starters/fullWaveBridge";
import { solveCircuit } from "../circuitSolver";
import { generateGraphsFromMeasurements } from "../graphData";
import { instantaneousSourceVoltage } from "../transientSolver";
import type { CircuitDefinition } from "../circuitGraph";
import { series5VTwo1k } from "./circuitFixtures";

describe("Full-wave bridge rectifier", () => {
  it("starter is a floating AC source, four diodes, and a 1 kΩ load", () => {
    const circuit = toEngineCircuit(createFullWaveBridgeStarter());
    const diodes = circuit.components.filter((c) => c.type === "diode");
    expect(diodes).toHaveLength(4);
    expect(circuit.components.find((c) => c.id === "V1")?.properties.frequency).toBe(50);
    expect(circuit.components.find((c) => c.id === "RL")?.properties.resistance).toBe(1000);
  });

  it("rectifies both half-cycles through the diode model", () => {
    const circuit = toEngineCircuit(createFullWaveBridgeStarter());
    circuit.experimentId = "full-wave-bridge-rectifier";
    const result = solveCircuit(circuit, { frequencySweep: false });
    expect(result.status, result.error).toBe("completed");
    const fw = result.measurements?.fullWaveBridge;
    expect(fw).toBeDefined();
    expect(fw!.VinPeak).toBeGreaterThan(9);
    // Two diode drops: Vout peak ≈ Vin − 2·Vf ≈ 8.6 V
    expect(fw!.VoutPeak).toBeGreaterThan(7.5);
    expect(fw!.VoutPeak).toBeLessThan(fw!.VinPeak - 0.5);
    expect(fw!.averageOutput).toBeGreaterThan(4);
    expect(fw!.rippleFrequency).not.toBeNull();
    expect(Math.abs(fw!.rippleFrequency! - 100) / 100).toBeLessThan(0.2);
    expect(fw!.conductingDiodeIds.length).toBeGreaterThanOrEqual(4);

    const series = result.measurements!.timeSeries!;
    let positivePulse = false;
    let negativeHalfStillPositive = false;
    for (const s of series) {
      const vin = Number(s.values.V_VM_in ?? s.values.V_V1 ?? 0);
      const vout = Number(s.values.V_VM_out ?? 0);
      if (vin > 5 && vout > 4) positivePulse = true;
      if (vin < -5 && vout > 4) negativeHalfStillPositive = true;
    }
    expect(positivePulse).toBe(true);
    expect(negativeHalfStillPositive).toBe(true);
    expect(result.measurements?.halfWaveRectifier).toBeUndefined();
    const graphs = generateGraphsFromMeasurements(result.measurements!, circuit);
    const scope = graphs.find((g) => g.id === "full_wave_bridge_scope");
    expect(scope?.series).toHaveLength(2);
    expect(scope?.series[0].name).toMatch(/Channel A/i);
    expect(scope?.series[1].name).toMatch(/Channel B/i);
    const out = scope!.series[1].points.map((p) => p.y);
    expect(Math.min(...out)).toBeGreaterThan(-0.5);
  });
});

describe("function generator waveforms", () => {
  it("square and triangle are not sine samples", () => {
    const base = {
      components: [
        {
          id: "V1",
          type: "voltage_source" as const,
          label: "V1",
          terminals: [],
          properties: {
            amplitude: 10,
            voltage: 10,
            frequency: 50,
            phase: 0,
            acMode: true,
            waveform: "sine",
          },
        },
      ],
      connections: [],
    } as CircuitDefinition;
    const sine = instantaneousSourceVoltage(base, "V1", 10, 0.005);
    const squareCircuit = {
      ...base,
      components: [
        { ...base.components[0], properties: { ...base.components[0].properties, waveform: "square" } },
      ],
    };
    const triangleCircuit = {
      ...base,
      components: [
        { ...base.components[0], properties: { ...base.components[0].properties, waveform: "triangle" } },
      ],
    };
    // t = 5 ms is a quarter cycle of 50 Hz: sine peak, square still high, triangle at 0.
    expect(sine).toBeCloseTo(10, 5);
    expect(instantaneousSourceVoltage(squareCircuit, "V1", 10, 0.005)).toBeCloseTo(10, 5);
    expect(instantaneousSourceVoltage(triangleCircuit, "V1", 10, 0.005)).toBeCloseTo(0, 5);
    // Mid second half-cycle: square low, triangle back through zero toward −A.
    expect(instantaneousSourceVoltage(squareCircuit, "V1", 10, 0.015)).toBeCloseTo(-10, 5);
    expect(instantaneousSourceVoltage(triangleCircuit, "V1", 10, 0.01)).toBeCloseTo(10, 5);
  });

  it("oscilloscope shows the solved square and triangle, and frequency changes the window", () => {
    const drive = (waveform: "sine" | "square" | "triangle", frequency = 50) => {
      const circuit = series5VTwo1k();
      const source = circuit.components.find((c) => c.id === "V1")!;
      source.properties = {
        voltage: 10,
        amplitude: 10,
        frequency,
        phase: 0,
        acMode: true,
        waveform,
      };
      return solveCircuit(circuit, { frequencySweep: false });
    };

    const square = drive("square");
    expect(square.status, square.error).toBe("completed");
    const squareScope = square.graphs?.find((g) => g.id === "function_generator_scope");
    expect(squareScope?.series[0].points.length).toBeGreaterThan(20);
    const squareYs = squareScope!.series[0].points.map((p) => p.y);
    const nearRail = squareYs.filter((y) => Math.abs(Math.abs(y) - 10) < 0.5).length;
    expect(nearRail / squareYs.length).toBeGreaterThan(0.8);

    const triangle = drive("triangle");
    const triScope = triangle.graphs?.find((g) => g.id === "function_generator_scope");
    const at = (t: number) => {
      let best = triScope!.series[0].points[0];
      for (const point of triScope!.series[0].points) {
        if (Math.abs(point.x - t) < Math.abs(best.x - t)) best = point;
      }
      return best.y;
    };
    expect(at(0)).toBeCloseTo(-10, 0);
    expect(at(0.005)).toBeCloseTo(0, 0);
    expect(at(0.01)).toBeCloseTo(10, 0);

    const lastT = (result: ReturnType<typeof drive>) => {
      const series = result.measurements!.timeSeries!;
      return series[series.length - 1].t;
    };
    expect(lastT(drive("sine", 1000))).toBeLessThan(lastT(drive("sine", 50)) / 5);
  });
});
