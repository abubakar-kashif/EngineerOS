import { describe, expect, it } from "vitest";

import {
  calculateSeriesCircuit,
  calculateParallelCircuit,
  calculateCurrent,
  calculatePower,
  runSimulation,
} from "./simulationService";

describe("Simulation Service", () => {
  it("calculates a series circuit correctly", () => {
    const result = runSimulation({
      voltage: 12,
      r1: 6,
      mode: "series",
      switchOn: true,
    });

    expect(result.totalResistance).toBe(6);
    expect(result.current).toBe(2);
    expect(result.power).toBe(24);
  });

  it("calculates a parallel circuit correctly", () => {
    const result = runSimulation({
      voltage: 12,
      r1: 6,
      r2: 12,
      mode: "parallel",
      switchOn: true,
    });

    expect(result.totalResistance).toBe(4);
    expect(result.current).toBe(3);
    expect(result.power).toBe(36);
  });

  it("returns zero current and power when switch is OFF", () => {
    const result = runSimulation({
      voltage: 12,
      r1: 6,
      mode: "series",
      switchOn: false,
    });

    expect(result.totalResistance).toBe(6);
    expect(result.current).toBe(0);
    expect(result.power).toBe(0);
  });

  it("rejects invalid resistance", () => {
    expect(() =>
      runSimulation({
        voltage: 12,
        r1: 0,
        mode: "series",
        switchOn: true,
      })
    ).toThrow();
  });

  it("rejects negative resistance", () => {
    expect(() =>
      runSimulation({
        voltage: 12,
        r1: -5,
        mode: "series",
        switchOn: true,
      })
    ).toThrow();
  });

  it("rejects invalid voltage", () => {
    expect(() =>
      runSimulation({
        voltage: -12,
        r1: 6,
        mode: "series",
        switchOn: true,
      })
    ).toThrow();
  });

  it("requires R2 in parallel mode", () => {
    expect(() =>
      runSimulation({
        voltage: 12,
        r1: 6,
        mode: "parallel",
        switchOn: true,
      })
    ).toThrow();
  });

  it("calculates current correctly", () => {
    expect(calculateCurrent(12, 6)).toBe(2);
  });

  it("calculates power correctly", () => {
    expect(calculatePower(12, 2)).toBe(24);
  });

  it("calculates series resistance correctly", () => {
    expect(calculateSeriesCircuit(6)).toBe(6);
  });

  it("calculates parallel resistance correctly", () => {
    expect(calculateParallelCircuit(6, 12)).toBe(4);
  });
});