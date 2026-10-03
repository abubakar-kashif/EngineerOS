/**
 * Complex arithmetic + dense Gaussian elimination for phasor MNA.
 */

export interface Complex {
  re: number;
  im: number;
}

export const C0: Complex = { re: 0, im: 0 };
export const C1: Complex = { re: 1, im: 0 };

export function c(re: number, im = 0): Complex {
  return { re, im };
}

export function cAdd(a: Complex, b: Complex): Complex {
  return { re: a.re + b.re, im: a.im + b.im };
}

export function cSub(a: Complex, b: Complex): Complex {
  return { re: a.re - b.re, im: a.im - b.im };
}

export function cMul(a: Complex, b: Complex): Complex {
  return {
    re: a.re * b.re - a.im * b.im,
    im: a.re * b.im + a.im * b.re,
  };
}

export function cScale(a: Complex, s: number): Complex {
  return { re: a.re * s, im: a.im * s };
}

export function cDiv(a: Complex, b: Complex): Complex | null {
  const den = b.re * b.re + b.im * b.im;
  if (den < 1e-30) return null;
  return {
    re: (a.re * b.re + a.im * b.im) / den,
    im: (a.im * b.re - a.re * b.im) / den,
  };
}

export function cAbs(a: Complex): number {
  return Math.hypot(a.re, a.im);
}

export function cArgDeg(a: Complex): number {
  return (Math.atan2(a.im, a.re) * 180) / Math.PI;
}

export function cFromPolar(mag: number, phaseDeg: number): Complex {
  const rad = (phaseDeg * Math.PI) / 180;
  return { re: mag * Math.cos(rad), im: mag * Math.sin(rad) };
}

const PIVOT_EPS = 1e-14;

/**
 * Solve A x = b for complex A (n×n) and b (n).
 * In-place Gaussian elimination with partial pivoting on magnitude.
 */
export function solveComplexLinearSystem(
  matrix: Complex[][],
  rhs: Complex[],
): { x: Complex[] } | { singular: true } {
  const n = rhs.length;
  if (n === 0) return { x: [] };
  if (matrix.length !== n || matrix.some((row) => row.length !== n)) {
    return { singular: true };
  }

  const a: Complex[][] = matrix.map((row, i) => [...row.map((z) => ({ ...z })), { ...rhs[i] }]);

  for (let col = 0; col < n; col++) {
    let pivot = col;
    let best = cAbs(a[col][col]);
    for (let row = col + 1; row < n; row++) {
      const mag = cAbs(a[row][col]);
      if (mag > best) {
        best = mag;
        pivot = row;
      }
    }
    if (best < PIVOT_EPS) return { singular: true };
    if (pivot !== col) {
      const tmp = a[col];
      a[col] = a[pivot];
      a[pivot] = tmp;
    }
    const diag = a[col][col];
    for (let row = col + 1; row < n; row++) {
      const f = cDiv(a[row][col], diag);
      if (!f || (f.re === 0 && f.im === 0)) continue;
      for (let j = col; j <= n; j++) {
        a[row][j] = cSub(a[row][j], cMul(f, a[col][j]));
      }
    }
  }

  const x: Complex[] = Array.from({ length: n }, () => ({ re: 0, im: 0 }));
  for (let i = n - 1; i >= 0; i--) {
    let sum = { ...a[i][n] };
    for (let j = i + 1; j < n; j++) {
      sum = cSub(sum, cMul(a[i][j], x[j]));
    }
    const xi = cDiv(sum, a[i][i]);
    if (!xi || !Number.isFinite(xi.re) || !Number.isFinite(xi.im)) {
      return { singular: true };
    }
    x[i] = xi;
  }
  return { x };
}
