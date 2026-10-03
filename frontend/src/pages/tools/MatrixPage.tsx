import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import SectionHeading from "../../components/ui/SectionHeading";
import {
  addMatrices,
  invertMatrix,
  matrixDeterminant,
  matrixRank,
  multiplyMatrices,
  parseMatrix,
  scaleMatrix,
  subtractMatrices,
  transposeMatrix,
  type Matrix,
} from "../../services/tools/matrixMath";

function blank(rows: number, cols: number, fill = "0"): string[][] {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => fill));
}

function formatMatrix(matrix: Matrix): string {
  return matrix.map((row) => row.map((value) => Number(value.toPrecision(8))).join("  ")).join("\n");
}

function MatrixGrid({
  label,
  rows,
  onChange,
}: {
  label: string;
  rows: string[][];
  onChange: (next: string[][]) => void;
}) {
  const focusCell = (row: number, col: number) => {
    const target = document.querySelector<HTMLInputElement>(
      `[data-matrix="${label}"][data-row="${row}"][data-col="${col}"]`,
    );
    target?.focus();
  };

  return (
    <div>
      <p>{label}</p>
      {rows.map((row, rowIndex) => (
        <div key={`${label}-${rowIndex}`} style={{ display: "flex", gap: "0.4rem", marginBottom: "0.4rem" }}>
          {row.map((cell, colIndex) => (
            <input
              key={`${label}-${rowIndex}-${colIndex}`}
              data-matrix={label}
              data-row={rowIndex}
              data-col={colIndex}
              aria-label={`${label} row ${rowIndex + 1} column ${colIndex + 1}`}
              value={cell}
              inputMode="decimal"
              style={{ width: "4.5rem" }}
              onChange={(event) => {
                const next = rows.map((entry) => [...entry]);
                const target = next[rowIndex];
                if (target) target[colIndex] = event.target.value;
                onChange(next);
              }}
              onKeyDown={(event) => {
                if (event.key === "ArrowRight" || (event.key === "Tab" && !event.shiftKey && colIndex < row.length - 1)) {
                  if (event.key !== "Tab") event.preventDefault();
                  if (event.key === "ArrowRight") focusCell(rowIndex, colIndex + 1);
                } else if (event.key === "ArrowLeft" || (event.key === "Tab" && event.shiftKey && colIndex > 0)) {
                  if (event.key !== "Tab") event.preventDefault();
                  if (event.key === "ArrowLeft") focusCell(rowIndex, colIndex - 1);
                } else if (event.key === "ArrowDown" || event.key === "Enter") {
                  event.preventDefault();
                  focusCell(Math.min(rows.length - 1, rowIndex + 1), colIndex);
                } else if (event.key === "ArrowUp") {
                  event.preventDefault();
                  focusCell(Math.max(0, rowIndex - 1), colIndex);
                }
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

function MatrixPage() {
  const [rows, setRows] = useState(2);
  const [cols, setCols] = useState(2);
  const [a, setA] = useState(blank(2, 2, "1"));
  const [b, setB] = useState(blank(2, 2, "1"));
  const [scalar, setScalar] = useState("2");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);

  const resize = (nextRows: number, nextCols: number) => {
    setRows(nextRows);
    setCols(nextCols);
    setA(blank(nextRows, nextCols));
    setB(blank(nextRows, nextCols));
  };

  const run = (operation: string) => {
    try {
      const left = parseMatrix(a);
      const right = parseMatrix(b);
      let result: Matrix | number;
      if (operation === "add") result = addMatrices(left, right);
      else if (operation === "subtract") result = subtractMatrices(left, right);
      else if (operation === "multiply") result = multiplyMatrices(left, right);
      else if (operation === "scale") result = scaleMatrix(left, Number(scalar));
      else if (operation === "transpose") result = transposeMatrix(left);
      else if (operation === "determinant") result = matrixDeterminant(left);
      else if (operation === "inverse") result = invertMatrix(left);
      else result = matrixRank(left);
      setOutput(typeof result === "number" ? String(result) : formatMatrix(result));
      setError(null);
    } catch (cause) {
      setOutput("");
      setError(cause instanceof Error ? cause.message : "Invalid matrix");
    }
  };

  return (
    <main className="page">
      <SectionHeading
        eyebrow="Tools"
        title="Matrix calculator"
        description="Add, subtract, multiply, scale, transpose, and — for square matrices — determinant, inverse, and rank."
      />
      <label>
        Rows
        <select
          aria-label="Matrix rows"
          value={rows}
          onChange={(event) => resize(Number(event.target.value), cols)}
        >
          {[1, 2, 3].map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </label>
      <label>
        Columns
        <select
          aria-label="Matrix columns"
          value={cols}
          onChange={(event) => resize(rows, Number(event.target.value))}
        >
          {[1, 2, 3].map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </label>
      <MatrixGrid label="A" rows={a} onChange={setA} />
      <MatrixGrid label="B" rows={b} onChange={setB} />
      <label>
        Scalar
        <input aria-label="Scalar" value={scalar} onChange={(event) => setScalar(event.target.value)} />
      </label>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
        {(
          [
            ["add", "A + B"],
            ["subtract", "A − B"],
            ["multiply", "A × B"],
            ["scale", "Scalar × A"],
            ["transpose", "Transpose A"],
            ["determinant", "det A"],
            ["inverse", "Inverse A"],
            ["rank", "Rank A"],
          ] as const
        ).map(([id, label]) => (
          <button key={id} type="button" onClick={() => run(id)}>
            {label}
          </button>
        ))}
      </div>
      {error ? <p role="alert">{error}</p> : output && <pre role="status">{output}</pre>}
      <p className="tools-back-note">
        <Link to="/tools" className="tools-back-link">
          <ArrowLeft size={13} /> All tools
        </Link>
      </p>
    </main>
  );
}

export default MatrixPage;
