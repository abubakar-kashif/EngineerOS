/**
 * Analysis panel: displays simulation results, measurements, and validation errors.
 * Tabbed interface: Results | Measurements | Validation.
 */
import { useState } from "react";
import type { CircuitDefinition, SimulationResult } from "./engine";
import type { SimulationError } from "./engine/errors";
import { labelForComponent } from "./engine/graphData";
import { formatWithPrefix } from "./engine/units";

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
  const errorCount = validationErrors.filter((e) => e.severity === "error").length;
  const warnCount = validationErrors.filter((e) => e.severity === "warning").length;

  return (
    <div className="sim2-analysis-inner">
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
        {tab === "results" && <ResultsTab circuit={circuit} result={result} />}
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

function ResultsTab({
  circuit,
  result,
}: {
  circuit: CircuitDefinition;
  result: SimulationResult | null;
}) {
  if (!result) return <p className="sim2-analysis-empty">Run the simulation to see results.</p>;
  const measurements = result.measurements;
  if (!measurements) return <p className="sim2-analysis-empty">No measurements available.</p>;

  const rows = [
    { label: "Total Voltage", value: `${measurements.totalVoltage.toFixed(3)} V` },
    { label: "Total Current", value: `${measurements.totalCurrent.toFixed(4)} A` },
    { label: "Total Power", value: `${measurements.totalPower.toFixed(4)} W` },
    { label: "Equivalent Resistance", value: `${measurements.equivalentResistance.toFixed(2)} Ω` },
  ];

  const rc = measurements.rc;
  const rl = measurements.rl;
  const rlc = measurements.rlc;
  const sr = measurements.seriesResonance;

  return (
    <div className="sim2-results-table">
      {sr && (
        <>
          <h4 className="sim2-results-heading">Series resonance (from sweep)</h4>
          {(
            [
              { label: "R", value: formatWithPrefix(sr.R, "Ω") },
              { label: "L", value: formatWithPrefix(sr.L, "H") },
              { label: "C", value: formatWithPrefix(sr.C, "F") },
              { label: "Vin (peak)", value: `${sr.Vin.toFixed(3)} V` },
              { label: "f start", value: `${sr.fStart.toFixed(2)} Hz` },
              { label: "f stop", value: `${sr.fStop.toFixed(2)} Hz` },
              { label: "points", value: String(sr.points) },
              {
                label: "theoretical f₀",
                value: `${sr.f0Theoretical.toFixed(2)} Hz`,
              },
              {
                label: "simulated f₀",
                value:
                  sr.f0Simulated != null
                    ? `${sr.f0Simulated.toFixed(2)} Hz`
                    : "—",
              },
              {
                label: "|I| at peak",
                value:
                  sr.peakCurrentMag != null
                    ? formatWithPrefix(sr.peakCurrentMag, "A")
                    : "—",
              },
              {
                label: "f₀ error",
                value:
                  sr.errorPercent != null
                    ? `${sr.errorPercent.toFixed(2)} %`
                    : "—",
              },
              ...(sr.bandwidth != null && sr.Q != null
                ? [
                    {
                      label: "f1 (half-power)",
                      value: sr.f1 != null ? `${sr.f1.toFixed(2)} Hz` : "—",
                    },
                    {
                      label: "f2 (half-power)",
                      value: sr.f2 != null ? `${sr.f2.toFixed(2)} Hz` : "—",
                    },
                    {
                      label: "bandwidth",
                      value: `${sr.bandwidth.toFixed(2)} Hz`,
                    },
                    { label: "Q (from sweep)", value: sr.Q.toFixed(3) },
                  ]
                : [
                    {
                      label: "bandwidth / Q",
                      value: "not validated on this sweep",
                    },
                  ]),
            ] as const
          ).map((r) => (
            <div key={`sr-${r.label}`} className="sim2-result-row">
              <span className="sim2-result-label">{r.label}</span>
              <span className="sim2-result-value">{r.value}</span>
            </div>
          ))}
        </>
      )}
      {rlc && (
        <>
          <h4 className="sim2-results-heading">RLC transient (measured)</h4>
          {(
            [
              { label: "R", value: formatWithPrefix(rlc.R, "Ω") },
              { label: "L", value: formatWithPrefix(rlc.L, "H") },
              { label: "C", value: formatWithPrefix(rlc.C, "F") },
              { label: "Vin", value: `${rlc.Vin.toFixed(3)} V` },
              { label: "time (last)", value: `${rlc.time.toFixed(6)} s` },
              { label: "i(t)", value: formatWithPrefix(rlc.i, "A") },
              { label: "Vc", value: `${rlc.Vc.toFixed(3)} V` },
              { label: "|i| peak", value: formatWithPrefix(rlc.iPeak, "A") },
              { label: "|Vc| peak", value: `${rlc.vcPeak.toFixed(3)} V` },
              { label: "½Li² (last)", value: formatWithPrefix(rlc.energyL, "J") },
              { label: "½CVc² (last)", value: formatWithPrefix(rlc.energyC, "J") },
              { label: "i zero-crossings", value: String(rlc.zeroCrossings) },
              { label: "samples", value: String(rlc.sampleCount) },
              { label: "duration", value: `${rlc.duration.toFixed(6)} s` },
              { label: "Δt", value: `${rlc.timeStep.toFixed(8)} s` },
            ] as const
          ).map((r) => (
            <div key={`rlc-${r.label}`} className="sim2-result-row">
              <span className="sim2-result-label">{r.label}</span>
              <span className="sim2-result-value">{r.value}</span>
            </div>
          ))}
        </>
      )}
      {rc && (
        <>
          <h4 className="sim2-results-heading">RC transient</h4>
          {(
            [
              { label: "Mode", value: rc.mode },
              { label: "R", value: formatWithPrefix(rc.R, "Ω") },
              { label: "C", value: formatWithPrefix(rc.C, "F") },
              { label: "Vin", value: `${rc.Vin.toFixed(3)} V` },
              { label: "V0 (t=0)", value: `${rc.V0.toFixed(3)} V` },
              { label: "time (last)", value: `${rc.time.toFixed(4)} s` },
              { label: "Vc", value: `${rc.Vc.toFixed(3)} V` },
              { label: "Ic", value: formatWithPrefix(rc.Ic, "A") },
              { label: "Ic(0+)", value: formatWithPrefix(rc.Ic0, "A") },
              { label: "τ theoretical", value: `${rc.tauTheoretical.toFixed(4)} s` },
              {
                label: "τ simulated",
                value:
                  rc.tauSimulated != null
                    ? `${rc.tauSimulated.toFixed(4)} s`
                    : "—",
              },
              {
                label: "τ error",
                value:
                  rc.tauErrorPercent != null
                    ? `${rc.tauErrorPercent.toFixed(2)} %`
                    : "—",
              },
            ] as const
          ).map((r) => (
            <div key={r.label} className="sim2-result-row">
              <span className="sim2-result-label">{r.label}</span>
              <span className="sim2-result-value">{r.value}</span>
            </div>
          ))}
        </>
      )}
      {rl && (
        <>
          <h4 className="sim2-results-heading">RL transient</h4>
          {(
            [
              { label: "Mode", value: rl.mode },
              { label: "R", value: formatWithPrefix(rl.R, "Ω") },
              { label: "L", value: formatWithPrefix(rl.L, "H") },
              { label: "Vin", value: `${rl.Vin.toFixed(3)} V` },
              { label: "I0 (t=0)", value: formatWithPrefix(rl.I0, "A") },
              { label: "final current", value: formatWithPrefix(rl.Ifinal, "A") },
              { label: "time (last)", value: `${rl.time.toFixed(6)} s` },
              { label: "i(t)", value: formatWithPrefix(rl.iL, "A") },
              { label: "VR", value: `${Number.isFinite(rl.vR) ? rl.vR.toFixed(3) : "—"} V` },
              { label: "τ theoretical", value: `${rl.tauTheoretical.toFixed(6)} s` },
              {
                label: "τ simulated",
                value:
                  rl.tauSimulated != null
                    ? `${rl.tauSimulated.toFixed(6)} s`
                    : "—",
              },
              {
                label: "τ error",
                value:
                  rl.tauErrorPercent != null
                    ? `${rl.tauErrorPercent.toFixed(2)} %`
                    : "—",
              },
            ] as const
          ).map((r) => (
            <div key={`rl-${r.label}`} className="sim2-result-row">
              <span className="sim2-result-label">{r.label}</span>
              <span className="sim2-result-value">{r.value}</span>
            </div>
          ))}
        </>
      )}
      <h4 className="sim2-results-heading">Global Measurements</h4>
      {rows.map((r) => (
        <div key={r.label} className="sim2-result-row">
          <span className="sim2-result-label">{r.label}</span>
          <span className="sim2-result-value">{r.value}</span>
        </div>
      ))}
      <h4 className="sim2-results-heading" style={{ marginTop: 16 }}>Component Results</h4>
      {measurements.componentMeasurements.map((cr) => (
        <div key={cr.componentId} className="sim2-comp-result">
          <span className="sim2-comp-result-label">
            {labelForComponent(circuit, cr.componentId, cr.type)}
          </span>
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
    const comp = circuit.components.find((c) => c.id === selectedComponentId);
    const compMeas = measurements.componentMeasurements.find((m) => m.componentId === selectedComponentId);
    if (compMeas) {
      const rows = [
        { label: "Voltage", value: `${compMeas.voltage.toFixed(3)} V` },
        { label: "Current", value: `${compMeas.current.toFixed(4)} A` },
        { label: "Power", value: `${compMeas.power.toFixed(4)} W` },
        ...(compMeas.resistance !== undefined ? [{ label: "Resistance", value: `${compMeas.resistance.toFixed(2)} Ω` }] : []),
      ];
      return (
        <div className="sim2-measurements">
          <h4 className="sim2-results-heading">
            {labelForComponent(circuit, selectedComponentId, comp?.type ?? compMeas.type)}
          </h4>
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

function ValidationTab({ errors }: { errors: SimulationError[] }) {
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
          {err.suggestedFix && <p className="sim2-error-suggestion">{err.suggestedFix}</p>}
        </div>
      ))}
    </div>
  );
}

export default AnalysisPanel;