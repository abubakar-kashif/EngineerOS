/**
 * Right-rail instruments — readings come only from SimulationResult measurements.
 */
import { useState } from "react";
import type { SimulationResult } from "./engine";

type DmmMode = "dc-voltage" | "ac-rms" | "current" | "resistance";

interface InstrumentsPanelProps {
  result: SimulationResult | null;
  selectedComponentId?: string | null;
  emphasized?: boolean;
}

function formatVoltage(v: number): string {
  return `Voltage = ${v.toFixed(2)} V`;
}

function formatCurrent(a: number): string {
  if (Math.abs(a) < 0.001) return `Current = ${(a * 1e6).toFixed(2)} µA`;
  if (Math.abs(a) < 1) return `Current = ${(a * 1000).toFixed(2)} mA`;
  return `Current = ${a.toFixed(4)} A`;
}

function formatResistance(r: number): string {
  if (r >= 1e6) return `Resistance = ${(r / 1e6).toFixed(2)} MΩ`;
  if (r >= 1e3) return `Resistance = ${(r / 1e3).toFixed(2)} kΩ`;
  return `Resistance = ${r.toFixed(2)} Ω`;
}

function formatPower(w: number): string {
  if (Math.abs(w) < 0.001) return `Power = ${(w * 1000).toFixed(3)} mW`;
  return `Power = ${w.toFixed(4)} W`;
}

function InstrumentsPanel({ result, selectedComponentId, emphasized = false }: InstrumentsPanelProps) {
  const [mode, setMode] = useState<DmmMode>("dc-voltage");
  const measurements = result?.measurements;
  const comps = measurements?.componentMeasurements ?? [];

  const placed = comps.filter((c) => !c.componentId.startsWith("__"));
  const voltmeters = placed.filter((c) => c.type === "voltmeter");
  const ammeters = placed.filter((c) => c.type === "ammeter");
  const ohmmeter = placed.find((c) => c.type === "ohmmeter");
  const powerMeter = placed.find((c) => c.type === "power_meter");

  const selectedVolt = voltmeters.find((c) => c.componentId === selectedComponentId);
  const selectedAmp = ammeters.find((c) => c.componentId === selectedComponentId);
  const voltReading =
    selectedVolt?.voltage ?? (voltmeters.length === 1 ? voltmeters[0].voltage : undefined);
  const ampReading =
    selectedAmp?.current ?? (ammeters.length === 1 ? ammeters[0].current : undefined);
  const equivalent = measurements?.equivalentResistance;
  const dcOpen =
    !ohmmeter &&
    equivalent != null &&
    Number.isFinite(equivalent) &&
    equivalent > 1e8;
  const ohmReading = ohmmeter?.resistance ?? (dcOpen ? undefined : equivalent);
  const powerReading = powerMeter?.power ?? measurements?.totalPower;

  const status = result?.status ?? "idle";
  const ready = status === "completed" && Boolean(measurements);
  const series = measurements?.timeSeries ?? [];
  const meterId = (selectedVolt ?? (voltmeters.length === 1 ? voltmeters[0] : undefined))?.componentId;
  const acSamples = meterId
    ? series
        .map((sample) => sample.values[`V_${meterId}`])
        .filter((value): value is number => typeof value === "number" && Number.isFinite(value))
    : [];
  const acRms =
    acSamples.length > 1
      ? Math.sqrt(acSamples.reduce((sum, value) => sum + value * value, 0) / acSamples.length)
      : null;

  const reading =
    mode === "dc-voltage"
      ? voltReading !== undefined && Number.isFinite(voltReading)
        ? formatVoltage(voltReading)
        : voltmeters.length > 1
          ? `${voltmeters.length} meters — select one on the canvas`
          : "Connect a voltmeter across two nodes and Run."
      : mode === "ac-rms"
        ? acRms != null
          ? `RMS = ${acRms.toFixed(3)} V`
          : "No time-series samples on the selected voltmeter."
        : mode === "current"
          ? ampReading !== undefined && Number.isFinite(ampReading)
            ? formatCurrent(ampReading)
            : "Insert an ammeter in the current path and Run. Current is not inferred."
          : dcOpen
            ? "Open at DC — no component resistance was measured."
            : ohmReading !== undefined && Number.isFinite(ohmReading) && ohmReading > 0 && ohmReading < 1e8
              ? formatResistance(ohmReading)
              : "Resistance is not valid for this circuit state.";

  const overload =
    (mode === "dc-voltage" && voltReading !== undefined && Math.abs(voltReading) > 1e6) ||
    (mode === "current" && ampReading !== undefined && Math.abs(ampReading) > 1e6) ||
    (mode === "ac-rms" && acRms != null && acRms > 1e6);

  return (
    <div className={`sim-instruments-panel${emphasized ? " sim-instruments-panel--focus" : ""}`}>
      <h4 className="sim-instruments-title">Digital multimeter</h4>
      <label className="sim-inspector-field">
        Mode
        <select
          aria-label="Multimeter mode"
          value={mode}
          onChange={(event) => setMode(event.target.value as DmmMode)}
        >
          <option value="dc-voltage">DC voltage</option>
          <option value="ac-rms">AC voltage (RMS)</option>
          <option value="current">Current</option>
          <option value="resistance">Resistance</option>
        </select>
      </label>
      {!ready ? (
        <p className="sim-measurements-empty" role="status">
          {status === "invalid"
            ? "Circuit invalid — instruments wait for a valid solve."
            : "Run simulation for authoritative instrument readings."}
        </p>
      ) : (
        <div className="sim-instruments-grid">
          <div className="sim-instrument-card">
            <span className="sim-instrument-name">
              {mode === "dc-voltage"
                ? "DC voltage"
                : mode === "ac-rms"
                  ? "AC voltage"
                  : mode === "current"
                    ? "Current"
                    : "Resistance"}
            </span>
            <span className="sim-instrument-reading">{overload ? "Overload" : reading}</span>
          </div>
          {powerMeter && powerReading !== undefined && Number.isFinite(powerReading) && (
            <div className="sim-instrument-card">
              <span className="sim-instrument-name">Power</span>
              <span className="sim-instrument-reading">{formatPower(powerReading)}</span>
            </div>
          )}
        </div>
      )}
      {result?.status === "invalid" && result.validation?.errors?.[0] && (
        <p className="sim-instrument-error" role="alert">
          {result.validation.errors[0].code}: {result.validation.errors[0].message}
        </p>
      )}
    </div>
  );
}

export default InstrumentsPanel;
