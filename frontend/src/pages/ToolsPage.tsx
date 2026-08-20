import { useMemo, useState } from "react";
import Card from "../components/ui/Card";
import SectionHeading from "../components/ui/SectionHeading";

function OhmsLawCalculator() {
  const [voltage, setVoltage] = useState("12");
  const [current, setCurrent] = useState("2");
  const [solveFor] = useState<"resistance" | "current" | "voltage">("resistance");

  const result = useMemo(() => {
    const v = Number(voltage);
    const i = Number(current);

    if (solveFor === "resistance") {
      if (!Number.isFinite(v) || !Number.isFinite(i) || i === 0) return null;
      return { label: "Resistance", value: v / i, unit: "Ω" };
    }

    return null;
  }, [voltage, current, solveFor]);

  return (
    <Card className="tool-card">
      <h3>Ohm's Law Calculator</h3>
      <p className="tool-description">Solve for resistance using V = I × R.</p>

      <div className="tool-input-row">
        <label>
          Voltage (V)
          <input
            type="number"
            value={voltage}
            onChange={(event) => setVoltage(event.target.value)}
          />
        </label>
        <label>
          Current (A)
          <input
            type="number"
            value={current}
            onChange={(event) => setCurrent(event.target.value)}
          />
        </label>
      </div>

      <div className="tool-result">
        {result ? (
          <span>
            {result.label}: <strong>{result.value.toFixed(2)} {result.unit}</strong>
          </span>
        ) : (
          <span className="tool-result-empty">Enter valid values to see the result.</span>
        )}
      </div>
    </Card>
  );
}

function SeriesResistanceCalculator() {
  const [values, setValues] = useState("100, 220, 330");

  const total = useMemo(() => {
    const parsed = values
      .split(",")
      .map((entry) => Number(entry.trim()))
      .filter((n) => Number.isFinite(n) && n >= 0);

    if (parsed.length === 0) return null;
    return parsed.reduce((sum, n) => sum + n, 0);
  }, [values]);

  return (
    <Card className="tool-card">
      <h3>Series Resistance</h3>
      <p className="tool-description">
        Enter resistor values (Ω) separated by commas.
      </p>

      <input
        type="text"
        value={values}
        onChange={(event) => setValues(event.target.value)}
        className="tool-input-wide"
      />

      <div className="tool-result">
        {total !== null ? (
          <span>Total resistance: <strong>{total.toFixed(2)} Ω</strong></span>
        ) : (
          <span className="tool-result-empty">Enter at least one valid value.</span>
        )}
      </div>
    </Card>
  );
}

function ParallelResistanceCalculator() {
  const [values, setValues] = useState("100, 220, 330");

  const total = useMemo(() => {
    const parsed = values
      .split(",")
      .map((entry) => Number(entry.trim()))
      .filter((n) => Number.isFinite(n) && n > 0);

    if (parsed.length === 0) return null;
    const reciprocalSum = parsed.reduce((sum, n) => sum + 1 / n, 0);
    if (reciprocalSum === 0) return null;
    return 1 / reciprocalSum;
  }, [values]);

  return (
    <Card className="tool-card">
      <h3>Parallel Resistance</h3>
      <p className="tool-description">
        Enter resistor values (Ω) separated by commas.
      </p>

      <input
        type="text"
        value={values}
        onChange={(event) => setValues(event.target.value)}
        className="tool-input-wide"
      />

      <div className="tool-result">
        {total !== null ? (
          <span>Total resistance: <strong>{total.toFixed(2)} Ω</strong></span>
        ) : (
          <span className="tool-result-empty">Enter at least one valid value.</span>
        )}
      </div>
    </Card>
  );
}

const formulaReference = [
  { name: "Ohm's Law", formula: "V = I × R" },
  { name: "Power", formula: "P = V × I" },
  { name: "Series resistance", formula: "R_total = R1 + R2 + ... + Rn" },
  { name: "Parallel resistance", formula: "1 / R_total = 1/R1 + 1/R2 + ... + 1/Rn" },
];

function ToolsPage() {
  return (
    <div className="placeholder-page tools-page">
      <SectionHeading
        eyebrow="Tools"
        title="Quick calculators for common circuit problems"
        description="These run entirely in your browser and are not connected to the backend."
      />

      <div className="tools-grid">
        <OhmsLawCalculator />
        <SeriesResistanceCalculator />
        <ParallelResistanceCalculator />

        <Card className="tool-card">
          <h3>Formula Reference</h3>
          <ul className="tool-formula-list">
            {formulaReference.map((item) => (
              <li key={item.name}>
                <span>{item.name}</span>
                <code>{item.formula}</code>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

export default ToolsPage;
