/**
 * Analysis panel: displays simulation results, measurements, and validation errors.
 * Tabbed interface: Results | Measurements | Validation.
 */
import { useState } from "react";
import type { CircuitDefinition } from "./engine";
import type { SimulationResult } from "./engine";

type AnalysisTab = "results" | "measurements" | "validation";

interface AnalysisPanelProps {
  circuit: CircuitDefinition;
  result: SimulationResult | null;
  selectedComponentId: string | null;
}

function AnalysisPanel({
  circuit,
  result,
  selectedComponentId,
}: AnalysisPanelProps) {
  const [tab, setTab] = useState<AnalysisTab>("results");

  const validationErrors = result?.validation?.errors ?? [];
  const errorCount = validationErrors.filter((e: any) => e.severity === "error").length;
  const warnCount = validationErrors.filter((e: any) => e.severity === "warning").length;

  return (
    <div className="sim2-analysis">
      <div className="sim2-analysis-tabs">
        <TabBtn active={tab === "results"} onClick={() => setTab("results")}>
          Results
        </TabBtn>
        <TabBtn active={tab === "measurements"} onClick={() => setTab("measurements")}>
          Measurements
        </TabBtn>
        <TabBtn active={tab === "validation"} onClick={() => setTab("validation")}>
          Validation {errorCount > 0 && <span className="sim2-badge sim2-badge--error">{errorCount}</span>}
          {warnCount > 0 && <span className="sim2-badge sim2-badge--warn">{warnCount}</span>}
        </TabBtn>
      </div>

      <div className="sim2-analysis-content">
        {tab === "results" && <ResultsTab result={result} />}
        {tab === "measurements" && (
          <MeasurementsTab
            circuit={circuit}
            result={result}
            selectedComponentId={selectedComponentId}
          />
        )}
        {tab === "validation" && <ValidationTab errors={validationErrors} />}
      </div>
    </div>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button className={`sim2-tab ${active ? "sim2-tab--active" : ""}`} onClick={onClick}>
      {children}
    </button>
  );
}

function ResultsTab({ result }: { result: SimulationResult | null }) {
  if (!result) return <p className="sim2-analysis-empty">Run the simulation to see results.</p>;
  const measurements = result.measurements;
  if (!measurements) return <p className="sim2-analysis-empty">No measurements available.</p>;

  const rows = [
    { label: "Total Voltage", value: `${measurements.totalVoltage.toFixed(3)} V` },
    { label: "Total Current", value: `${measurements.totalCurrent.toFixed(4)} A` },
    { label: "Total Power", value: `${measurements.totalPower.toFixed(4)} W` },
    { label: "Equivalent Resistance", value: `${measurements.equivalentResistance.toFixed(2)} Ω` },
  ];

  return (
    <div className="sim2-results-table">
      <h4 className="sim2-results-heading">Global Measurements</h4>
      {rows.map((r) => (
        <div key={r.label} className="sim2-result-row">
          <span className="sim2-result-label">{r.label}</span>
          <span className="sim2-result-value">{r.value}</span>
        </div>
      ))}
      <h4 className="sim2-results-heading" style={{ marginTop: 16 }}>Component Results</h4>
      {measurements.componentMeasurements.map((cr: any) => (
        <div key={cr.componentId} className="sim2-comp-result">
          <span className="sim2-comp-result-label">{cr.componentId}</span>
          <span className="sim2-comp-result-values">
            {cr.voltage.toFixed(3)} V &nbsp; {cr.current.toFixed(4)} A &nbsp; {cr.power.toFixed(4)} W
            {cr.resistance !== undefined && ` (${cr.resistance.toFixed(2)} Ω)`}
          </span>
        </div>
      ))}
    </div>
  );
}

function MeasurementsTab({
  circuit,
  result,
  selectedComponentId,
}: {
  circuit: CircuitDefinition;
  result: SimulationResult | null;
  selectedComponentId: string | null;
}) {
  if (!result) return <p className="sim2-analysis-empty">Run the simulation to see measurements.</p>;
  const measurements = result.measurements;
  if (!measurements) return <p className="sim2-analysis-empty">No measurements available.</p>;

  if (selectedComponentId) {
    const comp = circuit.components.find((c: any) => c.id === selectedComponentId);
    const compMeas = measurements.componentMeasurements.find((m: any) => m.componentId === selectedComponentId);
    if (compMeas) {
      const rows = [
        { label: "Voltage", value: `${compMeas.voltage.toFixed(3)} V` },
        { label: "Current", value: `${compMeas.current.toFixed(4)} A` },
        { label: "Power", value: `${compMeas.power.toFixed(4)} W` },
        ...(compMeas.resistance !== undefined ? [{ label: "Resistance", value: `${compMeas.resistance.toFixed(2)} Ω` }] : []),
      ];
      return (
        <div className="sim2-measurements">
          <h4 className="sim2-results-heading">{comp?.label ?? selectedComponentId}</h4>
          {rows.map((r) => (
            <div key={r.label} className="sim2-result-row">
              <span className="sim2-result-label">{r.label}</span>
              <span className="sim2-result-value">{r.value}</span>
            </div>
          ))}
        </div>
      );
    }
  }
  return <p className="sim2-analysis-empty">Select a component to view its measurements.</p>;
}

function ValidationTab({ errors }: { errors: any[] }) {
  if (errors.length === 0) {
    return (
      <div className="sim2-validation-ok">
        <p>✓ No issues found. Circuit is ready to simulate.</p>
      </div>
    );
  }
  return (
    <div className="sim2-validation-errors">
      {errors.map((err, idx) => (
        <div key={idx} className={`sim2-error sim2-error--${err.severity || "info"}`}>
          <p className="sim2-error-title">
            {err.severity === "error" ? "ERROR" : err.severity === "warning" ? "WARNING" : "INFO"}
          </p>
          <p className="sim2-error-msg">{err.message}</p>
          {err.suggestion && <p className="sim2-error-suggestion">{err.suggestion}</p>}
        </div>
      ))}
    </div>
  );
}

export default AnalysisPanel;