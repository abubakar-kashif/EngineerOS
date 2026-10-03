export type Matrix = number[][];

export function parseMatrix(rows: string[][]): Matrix {
  if (rows.length < 1 || rows.length > 3) throw new Error("Use 1 to 3 rows");
  const width = rows[0]?.length ?? 0;
  if (width < 1 || width > 3) throw new Error("Use 1 to 3 columns");
  return rows.map((row) => {
    if (row.length !== width) throw new Error("Every row needs the same number of entries");
    return row.map((cell) => {
      const value = Number(cell);
      if (!Number.isFinite(value)) throw new Error("Invalid matrix entry");
      return value;
    });
  });
}

export function addMatrices(a: Matrix, b: Matrix): Matrix {
  if (a.length !== b.length || a[0]?.length !== b[0]?.length) {
    throw new Error("Addition needs matching dimensions");
  }
  return a.map((row, i) => row.map((value, j) => value + (b[i]?.[j] ?? 0)));
}

export function subtractMatrices(a: Matrix, b: Matrix): Matrix {
  if (a.length !== b.length || a[0]?.length !== b[0]?.length) {
    throw new Error("Subtraction needs matching dimensions");
  }
  return a.map((row, i) => row.map((value, j) => value - (b[i]?.[j] ?? 0)));
}

export function scaleMatrix(matrix: Matrix, scalar: number): Matrix {
  if (!Number.isFinite(scalar)) throw new Error("Invalid scalar");
  return matrix.map((row) => row.map((value) => value * scalar));
}

export function multiplyMatrices(a: Matrix, b: Matrix): Matrix {
  const aCols = a[0]?.length ?? 0;
  const bRows = b.length;
  const bCols = b[0]?.length ?? 0;
  if (aCols !== bRows) throw new Error("Multiplication needs the inner dimensions to match");
  return a.map((row) =>
    Array.from({ length: bCols }, (_, col) =>
      row.reduce((sum, value, k) => sum + value * (b[k]?.[col] ?? 0), 0),
    ),
  );
}

export function transposeMatrix(matrix: Matrix): Matrix {
  const cols = matrix[0]?.length ?? 0;
  return Array.from({ length: cols }, (_, col) => matrix.map((row) => row[col] ?? 0));
}

function determinant(matrix: Matrix): number {
  const n = matrix.length;
  if (matrix.some((row) => row.length !== n)) throw new Error("Determinant needs a square matrix");
  if (n === 1) return matrix[0]?.[0] ?? 0;
  if (n === 2) {
    return (matrix[0]?.[0] ?? 0) * (matrix[1]?.[1] ?? 0) - (matrix[0]?.[1] ?? 0) * (matrix[1]?.[0] ?? 0);
  }
  let sign = 1;
  let total = 0;
  for (let col = 0; col < n; col += 1) {
    const minor = matrix.slice(1).map((row) => row.filter((_, index) => index !== col));
    total += sign * (matrix[0]?.[col] ?? 0) * determinant(minor);
    sign = -sign;
  }
  return total;
}

export function matrixDeterminant(matrix: Matrix): number {
  if (matrix.length !== (matrix[0]?.length ?? 0)) {
    throw new Error("Determinant is only defined for a square matrix");
  }
  return determinant(matrix);
}

export function invertMatrix(matrix: Matrix): Matrix {
  const n = matrix.length;
  if (n !== (matrix[0]?.length ?? 0)) throw new Error("Inverse is only defined for a square matrix");
  const det = determinant(matrix);
  if (Math.abs(det) < 1e-12) throw new Error("Singular matrix");
  if (n === 1) return [[1 / (matrix[0]?.[0] ?? 1)]];
  const cofactors = matrix.map((row, i) =>
    row.map((_, j) => {
      const minor = matrix
        .filter((_, rowIndex) => rowIndex !== i)
        .map((minorRow) => minorRow.filter((_, colIndex) => colIndex !== j));
      return ((i + j) % 2 === 0 ? 1 : -1) * determinant(minor);
    }),
  );
  const adjugate = transposeMatrix(cofactors);
  return scaleMatrix(adjugate, 1 / det);
}

/** Rank from row reduction. */
export function matrixRank(matrix: Matrix): number {
  const rows = matrix.map((row) => [...row]);
  const height = rows.length;
  const width = rows[0]?.length ?? 0;
  let rank = 0;
  let pivotCol = 0;
  for (let row = 0; row < height && pivotCol < width; row += 1) {
    let pivot = row;
    while (pivot < height && Math.abs(rows[pivot]?.[pivotCol] ?? 0) < 1e-10) pivot += 1;
    if (pivot === height) {
      pivotCol += 1;
      row -= 1;
      continue;
    }
    const current = rows[row];
    const chosen = rows[pivot];
    if (!current || !chosen) continue;
    rows[row] = chosen;
    rows[pivot] = current;
    const scale = rows[row]?.[pivotCol] ?? 1;
    for (let col = pivotCol; col < width; col += 1) {
      const target = rows[row];
      if (target) target[col] = (target[col] ?? 0) / scale;
    }
    for (let other = 0; other < height; other += 1) {
      if (other === row) continue;
      const factor = rows[other]?.[pivotCol] ?? 0;
      for (let col = pivotCol; col < width; col += 1) {
        const target = rows[other];
        if (target && rows[row]) target[col] = (target[col] ?? 0) - factor * (rows[row]?.[col] ?? 0);
      }
    }
    rank += 1;
    pivotCol += 1;
  }
  return rank;
}
