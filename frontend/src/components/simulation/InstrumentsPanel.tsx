/**
 * Right-rail instruments — readings come only from SimulationResult measurements.
 */
import type { SimulationResult } from "./engine";

interface InstrumentsPanelProps {
  result: SimulationResult | null;
  selectedComponentId?: string | null;
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

function InstrumentsPanel({ result, selectedComponentId }: InstrumentsPanelProps) {
  const measurements = result?.measurements;
  const comps = measurements?.componentMeasurements ?? [];

  const voltmeter =
    comps.find(c => c.type === "voltmeter") ??
    (selectedComponentId
      ? comps.find(c => c.componentId === selectedComponentId && c.voltage !== undefined)
      : undefined);
  const ammeter = comps.find(c => c.type === "ammeter");
  const ohmmeter = comps.find(c => c.type === "ohmmeter");
  const powerMeter = comps.find(c => c.type === "power_meter");

  const selected = selectedComponentId
    ? comps.find(c => c.componentId === selectedComponentId)
    : undefined;

  const voltReading =
    voltmeter?.type === "voltmeter"
      ? voltmeter.voltage
      : selected?.voltage;
  const ampReading = ammeter?.current ?? selected?.current;
  const ohmReading =
    ohmmeter?.resistance ??
    selected?.resistance ??
    (measurements && measurements.equivalentResistance > 0
      ? measurements.equivalentResistance
      : undefined);
  const powerReading = powerMeter?.power ?? selected?.power ?? measurements?.totalPower;

  const status = result?.status ?? "idle";
  const ready = status === "completed" && Boolean(measurements);

  return (
    <div className="sim-instruments-panel">
      <h4 className="sim-instruments-title">Instruments</h4>
      {!ready ? (
        <p className="sim-measurements-empty" role="status">
          {status === "invalid"
            ? "Circuit invalid — instruments wait for a valid solve."
            : "Run simulation for authoritative instrument readings."}
        </p>
      ) : (
        <div className="sim-instruments-grid">
          <div className="sim-instrument-card">
            <span className="sim-instrument-name">Voltmeter</span>
            <span className="sim-instrument-reading">
              {voltReading !== undefined && Number.isFinite(voltReading)
                ? formatVoltage(voltReading)
                : "— (place meter or select a component)"}
            </span>
          </div>
          <div className="sim-instrument-card">
            <span className="sim-instrument-name">Ammeter</span>
            <span className="sim-instrument-reading">
              {ampReading !== undefined && Number.isFinite(ampReading)
                ? formatCurrent(ampReading)
                : "— (place meter or select a component)"}
            </span>
          </div>
          <div className="sim-instrument-card">
            <span className="sim-instrument-name">Ohmmeter</span>
            <span className="sim-instrument-reading">
              {ohmReading !== undefined && Number.isFinite(ohmReading) && ohmReading > 0
                ? formatResistance(ohmReading)
                : "— (not valid for this circuit state)"}
            </span>
          </div>
          <div className="sim-instrument-card">
            <span className="sim-instrument-name">Power Meter</span>
            <span className="sim-instrument-reading">
              {powerReading !== undefined && Number.isFinite(powerReading)
                ? formatPower(powerReading)
                : "—"}
            </span>
          </div>
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
