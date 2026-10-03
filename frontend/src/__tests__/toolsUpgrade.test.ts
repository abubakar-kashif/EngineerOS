import { describe, expect, it } from "vitest";
import { numericalDerivative, numericalIntegral } from "../services/tools/toolsService";
import { convertNumberBase } from "../services/tools/numberSystems";
import {
  addMatrices,
  invertMatrix,
  matrixDeterminant,
  matrixRank,
  multiplyMatrices,
  subtractMatrices,
  transposeMatrix,
} from "../services/tools/matrixMath";
import { CALCULATORS } from "../data/engineeringCalculators";

describe("number systems", () => {
  it("converts the common pairs", () => {
    expect(convertNumberBase("1010", "binary", "decimal")).toBe("10");
    expect(convertNumberBase("10", "decimal", "binary")).toBe("1010");
    expect(convertNumberBase("ff", "hexadecimal", "decimal")).toBe("255");
    expect(convertNumberBase("255", "decimal", "hexadecimal")).toBe("ff");
    expect(convertNumberBase("17", "octal", "decimal")).toBe("15");
    expect(convertNumberBase("ff", "hexadecimal", "octal")).toBe("377");
  });

  it("rejects empty input and illegal digits", () => {
    expect(() => convertNumberBase("  ", "decimal", "binary")).toThrow(/Enter a value/);
    expect(() => convertNumberBase("102", "binary", "decimal")).toThrow(/Invalid binary digit/);
  });
});

describe("matrix math", () => {
  const a = [
    [1, 2],
    [3, 4],
  ];
  const b = [
    [5, 6],
    [7, 8],
  ];

  it("adds, subtracts, multiplies, and transposes", () => {
    expect(addMatrices(a, b)).toEqual([
      [6, 8],
      [10, 12],
    ]);
    expect(subtractMatrices(b, a)).toEqual([
      [4, 4],
      [4, 4],
    ]);
    expect(multiplyMatrices(a, b)).toEqual([
      [19, 22],
      [43, 50],
    ]);
    expect(transposeMatrix(a)).toEqual([
      [1, 3],
      [2, 4],
    ]);
  });

  it("computes determinant, inverse, and rank, and rejects a singular inverse", () => {
    expect(matrixDeterminant(a)).toBeCloseTo(-2);
    const inverse = invertMatrix(a);
    expect(inverse[0]?.[0]).toBeCloseTo(-2);
    expect(inverse[1]?.[1]).toBeCloseTo(-0.5);
    expect(matrixRank(a)).toBe(2);
    expect(() => invertMatrix([
      [1, 2],
      [2, 4],
    ])).toThrow(/Singular/);
    expect(() => matrixDeterminant([[1, 2, 3]])).toThrow(/square/);
  });
});

describe("numerical calculus and RC cutoff", () => {
  it("differentiates and integrates x^2 numerically", () => {
    expect(numericalDerivative("x^2", 3)).toBeCloseTo(6, 4);
    expect(numericalIntegral("x^2", 0, 1)).toBeCloseTo(1 / 3, 3);
  });

  it("computes fc = 1/(2πRC)", () => {
    const cutoff = CALCULATORS.find((item) => item.id === "rc-low-pass-cutoff");
    expect(cutoff).toBeDefined();
    const fc = cutoff!.compute({ R: 1000, C: 100e-9 }, "fc");
    expect(fc).toBeCloseTo(1 / (2 * Math.PI * 1000 * 100e-9), 6);
  });
});
