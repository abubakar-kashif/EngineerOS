/**
 * Analysis panel: displays simulation results, measurements, and validation errors.
 * Tabbed interface: Results | Measurements | Validation.
 */
import { useState } from "react";
import type { CircuitDefinition, SimulationOutput, ValidationError } from "./engine/types";
import { globalMeasurementRows, componentMeasurementRows, type MeasurementRow } from "./engine/measurements";

type AnalysisTab = "results" | "measurements" | "validation";

interface AnalysisPanelProps {
  circuit: CircuitDefinition;
  output: SimulationOutput | null;
  validationErrors: ValidationError[];
  selectedComponentId: string | null;
}

function AnalysisPanel({
  circuit,
  output,
  validationErrors,
  selectedComponentId,
}: AnalysisPanelProps) {
  const [tab, setTab] = useState<AnalysisTab>("results");

  const errorCount = validationErrors.filter((e) => e.severity === "error").length;
  const warnCount = validationErrors.filter((e) => e.severity === "warning").length;

  return (
    <div className="sim2-analysis">
      {/* Tabs */}
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

      {/* Tab content */}
      <div className="sim2-analysis-content">
        {tab === "results" && (
          <ResultsTab output={output} />
        )}
        {tab === "measurements" && (
          <MeasurementsTab
            circuit={circuit}
            output={output}
            selectedComponentId={selectedComponentId}
          />
        )}
        {tab === "validation" && (
          <ValidationTab errors={validationErrors} />
        )}
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

// ── Results tab ──

function ResultsTab({ output }: { output: SimulationOutput | null }) {
  if (!output) {
    return <p className="sim2-analysis-empty">Run the simulation to see results.</p>;
  }

  const rows = globalMeasurementRows(output.global);
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
      {output.components.map((cr) => {
        const comp = cr.componentId; // just id, label comes from context
        return (
          <div key={comp} className="sim2-comp-result">
            <span className="sim2-comp-result-label">{comp}</span>
            <span className="sim2-comp-result-values">
              {cr.voltage.toFixed(3)} V &nbsp; {cr.current.toFixed(4)} A &nbsp; {cr.power.toFixed(4)} W
              {cr.state !== "inactive" && ` (${cr.state})`}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Measurements tab ──

function MeasurementsTab({
  circuit,
  output,
  selectedComponentId,
}: {
  circuit: CircuitDefinition;
  output: SimulationOutput | null;
  selectedComponentId: string | null;
}) {
  if (!output) {
    return <p className="sim2-analysis-empty">Run the simulation to see measurements.</p>;
  }

  const selectedRows: MeasurementRow[] = selectedComponentId
    ? componentMeasurementRows(circuit, output.components, selectedComponentId)
    : [];

  return (
    <div className="sim2-measurements">
      {selectedComponentId && selectedRows.length > 0 ? (
        <>
          <h4 className="sim2-results-heading">
            {circuit.components.find((c) => c.id === selectedComponentId)?.label ?? selectedComponentId}
          </h4>
          {selectedRows.map((r) => (
            <div key={r.label} className="sim2-result-row">
              <span className="sim2-result-label">{r.label}</span>
              <span className="sim2-result-value">{r.value}</span>
            </div>
          ))}
        </>
      ) : (
        <p className="sim2-analysis-empty">Select a component to view its measurements.</p>
      )}
    </div>
  );
}

// ── Validation tab ──

function ValidationTab({ errors }: { errors: ValidationError[] }) {
  if (errors.length === 0) {
    return (
      <div className="sim2-validation-ok">
        <p>✓ No issues found. Circuit is ready to simulate.</p>
      </div>
    );
  }

  return (
    <div className="sim2-validation-errors">
      {errors.map((err) => (
        <div key={err.id} className={`sim2-error sim2-error--${err.severity}`}>
          <p className="sim2-error-title">
            {err.severity === "error" ? "SIMULATION CANNOT RUN" : err.severity === "warning" ? "WARNING" : "INFO"}
          </p>
          <p className="sim2-error-msg">{err.message}</p>
          <p className="sim2-error-suggestion">{err.suggestion}</p>
        </div>
      ))}
    </div>
  );
}

export default AnalysisPanel;
