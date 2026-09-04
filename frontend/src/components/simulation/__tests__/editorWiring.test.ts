/**
 * Regression: wire/cursor alignment helpers (terminal world positions + preview path).
 * Defects: stub terminal positions, preview append lag, rotation/offset mismatch.
 */
import { describe, expect, it } from "vitest";
import type { ComponentInstance } from "../editorTypes";
import {
  buildOrthogonalPreview,
  getTerminalLocalOffset,
  getTerminalWorldPosition,
  rotateLocalOffset,
} from "../editorUtils";

function resistorAt(x: number, y: number, rotation: 0 | 90 | 180 | 270 = 0): ComponentInstance {
  return {
    id: "R1",
    type: "resistor",
    label: "R1",
    x,
    y,
    rotation,
    properties: { resistance: 1000 },
    terminals: ["A", "B"],
  };
}

describe("editor wiring alignment", () => {
  it("resistor terminal local offsets match ComponentNodes lead ends (±30, 0)", () => {
    expect(getTerminalLocalOffset("resistor", "A")).toEqual({ x: -30, y: 0 });
    expect(getTerminalLocalOffset("resistor", "B")).toEqual({ x: 30, y: 0 });
  });

  it("getTerminalWorldPosition is origin + rotated local offset (not component origin)", () => {
    const r = resistorAt(100, 200);
    expect(getTerminalWorldPosition(r, "A")).toEqual({ x: 70, y: 200 });
    expect(getTerminalWorldPosition(r, "B")).toEqual({ x: 130, y: 200 });
  });

  it("rotation 90° maps A to (x, y-30) for a horizontal resistor symbol", () => {
    const r = resistorAt(100, 200, 90);
    const a = getTerminalWorldPosition(r, "A");
    expect(a.x).toBeCloseTo(100, 5);
    expect(a.y).toBeCloseTo(170, 5);
  });

  it("buildOrthogonalPreview replaces path (does not append) and ends at cursor", () => {
    const start = { x: 0, y: 0 };
    const cursor = { x: 80, y: 40 };
    const path = buildOrthogonalPreview(start, cursor);
    expect(path[0]).toEqual(start);
    expect(path[path.length - 1]).toEqual(cursor);
    expect(path.length).toBe(3);
    // Horizontal-dominant: elbow keeps start.y then goes to cursor
    expect(path[1]).toEqual({ x: 80, y: 0 });
  });

  it("rotateLocalOffset is invertible every 360°", () => {
    const local = { x: -30, y: 0 };
    const r90 = rotateLocalOffset(local, 90);
    const r180 = rotateLocalOffset(local, 180);
    const r360 = rotateLocalOffset(local, 360);
    expect(r90.x).toBeCloseTo(0, 5);
    expect(r90.y).toBeCloseTo(-30, 5);
    expect(r180.x).toBeCloseTo(30, 5);
    expect(r180.y).toBeCloseTo(0, 5);
    expect(r360.x).toBeCloseTo(local.x, 5);
    expect(r360.y).toBeCloseTo(local.y, 5);
  });

  it("voltage source and ground terminals have non-zero offsets", () => {
    const v: ComponentInstance = {
      id: "V1",
      type: "voltage_source",
      label: "V1",
      x: 0,
      y: 0,
      rotation: 0,
      properties: { voltage: 12 },
      terminals: ["positive", "negative"],
    };
    const g: ComponentInstance = {
      id: "GND",
      type: "ground",
      label: "GND",
      x: 40,
      y: 80,
      rotation: 0,
      properties: {},
      terminals: ["ground"],
    };
    expect(getTerminalWorldPosition(v, "positive")).toEqual({ x: 0, y: -20 });
    expect(getTerminalWorldPosition(v, "negative")).toEqual({ x: 0, y: 20 });
    expect(getTerminalWorldPosition(g, "ground")).toEqual({ x: 40, y: 65 });
  });
});
