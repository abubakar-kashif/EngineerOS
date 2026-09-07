/**
 * Dense Gaussian elimination with partial pivoting.
 * Used by the DC MNA solver — no geometry, no heuristics.
 */

const PIVOT_EPS = 1e-12;

export function solveLinearSystem(
  matrix: number[][],
  rhs: number[],
): { x: number[] } | { singular: true } {
  const n = rhs.length;
  if (n === 0) return { x: [] };
  if (matrix.length !== n || matrix.some((row) => row.length !== n)) {
    return { singular: true };
  }

  const a: number[][] = matrix.map((row, i) => [...row, rhs[i]]);

  for (let col = 0; col < n; col++) {
    let pivot = col;
    let best = Math.abs(a[col][col]);
    for (let row = col + 1; row < n; row++) {
      const mag = Math.abs(a[row][col]);
      if (mag > best) {
        best = mag;
        pivot = row;
      }
    }
    if (best < PIVOT_EPS) {
      return { singular: true };
    }
    if (pivot !== col) {
      const tmp = a[col];
      a[col] = a[pivot];
      a[pivot] = tmp;
    }
    const diag = a[col][col];
    for (let row = col + 1; row < n; row++) {
      const f = a[row][col] / diag;
      if (f === 0) continue;
      for (let j = col; j <= n; j++) {
        a[row][j] -= f * a[col][j];
      }
    }
  }

  const x = new Array<number>(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let sum = a[i][n];
    for (let j = i + 1; j < n; j++) {
      sum -= a[i][j] * x[j];
    }
    if (Math.abs(a[i][i]) < PIVOT_EPS) {
      return { singular: true };
    }
    x[i] = sum / a[i][i];
    if (!Number.isFinite(x[i])) {
      return { singular: true };
    }
  }
  return { x };
}
