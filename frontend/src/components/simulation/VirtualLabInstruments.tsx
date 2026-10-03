/**
 * Function generator and oscilloscope bound to the placed source and the
 * solver time series. Readings are not drawn unless a run produced samples.
 */
import { useMemo, useState } from "react";
import type { SimulationResult } from "./engine";
import type { ComponentInstance } from "./editorTypes";

const SCOPE_LABS = new Set([
  "rc-circuit",
  "rl-circuit",
  "rlc-circuit",
  "capacitor-charging",
  "rc-low-pass-filter",
  "series-resonance",
  "half-wave-rectifier",
  "full-wave-bridge-rectifier",
  "diode-characteristics",
  "led-circuit",
]);

const GENERATOR_LABS = new Set([
  "rc-low-pass-filter",
  "series-resonance",
  "half-wave-rectifier",
  "full-wave-bridge-rectifier",
]);

export type LabInstrument = "generator" | "oscilloscope" | "dmm";

interface VirtualLabInstrumentsProps {
  experimentId?: string | null;
  components: ComponentInstance[];
  result: SimulationResult | null;
  focus: LabInstrument | null;
  onUpdateProperty: (id: string, property: string, value: number | string | boolean) => void;
}

function num(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function channelLabel(signalId: string, components: ComponentInstance[]): string {
  const match = /^(V|I|P)_(.+)$/.exec(signalId);
  if (!match) return signalId;
  const kind = match[1] === "V" ? "voltage" : match[1] === "I" ? "current" : "power";
  const component = components.find((item) => item.id === match[2]);
  return `${component?.label || match[2]} ${kind}`;
}

function ScopeTrace({
  samples,
  channelA,
  channelB,
}: {
  samples: { t: number; values: Record<string, number> }[];
  channelA: string;
  channelB: string;
}) {
  const width = 280;
  const height = 120;
  const pad = 28;
  const channels = [channelA, channelB].filter((id, index, all) => id && all.indexOf(id) === index);
  const points = samples.filter((sample) => Number.isFinite(sample.t));
  if (points.length < 2 || channels.length === 0) {
    return <p className="sim-measurements-empty">Choose a channel that this run recorded.</p>;
  }
  const t0 = points[0].t;
  const t1 = points[points.length - 1].t;
  const span = t1 - t0 || 1;
  let vmin = Infinity;
  let vmax = -Infinity;
  for (const sample of points) {
    for (const id of channels) {
      const value = sample.values[id];
      if (typeof value === "number" && Number.isFinite(value)) {
        vmin = Math.min(vmin, value);
        vmax = Math.max(vmax, value);
      }
    }
  }
  if (!Number.isFinite(vmin) || !Number.isFinite(vmax)) {
    return <p className="sim-measurements-empty">This run has no samples on the selected channels.</p>;
  }
  if (vmax - vmin < 1e-9) {
    vmax += 1;
    vmin -= 1;
  }
  const step = Math.max(1, Math.floor(points.length / 180));
  const colors = ["#1d4e89", "#b45309"];
  const polylines = channels.map((id, index) => {
    const coords: string[] = [];
    for (let i = 0; i < points.length; i += step) {
      const value = points[i].values[id];
      if (typeof value !== "number" || !Number.isFinite(value)) continue;
      const x = pad + ((points[i].t - t0) / span) * (width - pad * 2);
      const y = pad + ((vmax - value) / (vmax - vmin)) * (height - pad * 2);
      coords.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    }
    return { id, color: colors[index] ?? colors[0], coords: coords.join(" ") };
  });

  return (
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Oscilloscope voltage versus time" width="100%">
      <rect x="0" y="0" width={width} height={height} fill="#f8fafc" />
      <line x1={pad} y1={height - pad} x2={width - 8} y2={height - pad} stroke="#94a3b8" />
      <line x1={pad} y1={8} x2={pad} y2={height - pad} stroke="#94a3b8" />
      <text x={pad} y={12} fontSize="9" fill="#334155">
        {vmax.toFixed(2)} V
      </text>
      <text x={pad} y={height - 8} fontSize="9" fill="#334155">
        {t0.toExponential(1)} s → {t1.toExponential(1)} s
      </text>
      {polylines.map((line) => (
        <polyline key={line.id} fill="none" stroke={line.color} strokeWidth="1.4" points={line.coords} />
      ))}
    </svg>
  );
}

function VirtualLabInstruments({
  experimentId,
  components,
  result,
  focus,
  onUpdateProperty,
}: VirtualLabInstrumentsProps) {
  const sources = components.filter((component) => component.type === "voltage_source");
  const acSources = sources.filter(
    (component) =>
      component.properties.acMode === true ||
      typeof component.properties.waveform === "string" ||
      (typeof component.properties.frequency === "number" && component.properties.frequency > 0),
  );
  const [pickedSourceId, setPickedSourceId] = useState<string | null>(null);
  const source =
    sources.find((item) => item.id === pickedSourceId) ?? acSources[0] ?? sources[0] ?? null;

  const signalIds = useMemo(() => {
    const series = result?.measurements?.timeSeries ?? [];
    const keys = new Set<string>();
    const first = series[0];
    if (first) {
      for (const key of Object.keys(first.values)) {
        if (key.startsWith("V_") || key.startsWith("I_")) keys.add(key);
      }
    }
    return [...keys];
  }, [result]);

  const defaultA = source ? `V_${source.id}` : signalIds[0] ?? "";
  const capacitor = components.find((component) => component.type === "capacitor");
  const voltmeter = components.find((component) => component.type === "voltmeter");
  const defaultB = capacitor
    ? `V_${capacitor.id}`
    : voltmeter
      ? `V_${voltmeter.id}`
      : signalIds.find((id) => id !== defaultA) ?? "";

  const [pickedA, setPickedA] = useState<string | null>(null);
  const [pickedB, setPickedB] = useState<string | null>(null);
  const resolvedA = signalIds.includes(defaultA) ? defaultA : (signalIds[0] ?? "");
  const resolvedB = signalIds.includes(defaultB) ? defaultB : "";
  const channelA = pickedA && signalIds.includes(pickedA) ? pickedA : resolvedA;
  const channelB = pickedB === null ? resolvedB : pickedB;
  const samples = result?.measurements?.timeSeries ?? [];

  const showGenerator =
    focus === "generator" ||
    acSources.length > 0 ||
    (experimentId != null && GENERATOR_LABS.has(experimentId));
  const showScope =
    focus === "oscilloscope" ||
    samples.length > 1 ||
    (experimentId != null && SCOPE_LABS.has(experimentId));

  if (!showGenerator && !showScope) return null;

  const waveform = String(source?.properties.waveform ?? "sine").toLowerCase();
  const selectedWave = waveform === "square" || waveform === "triangle" ? waveform : "sine";
  const outputOn = source?.properties.outputEnabled !== false;

  return (
    <div className="sim-instruments-panel">
      {showGenerator && (
        <section aria-label="Function generator">
          <h4 className="sim-instruments-title">Function generator</h4>
          {!source ? (
            <p className="sim-measurements-empty">Place a function generator, then set its output and Run.</p>
          ) : (
            <>
              {sources.length > 1 && (
                <label className="sim-inspector-field">
                  Source
                  <select
                    aria-label="Function generator source"
                    value={source.id}
                    onChange={(event) => setPickedSourceId(event.target.value)}
                  >
                    {sources.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <label className="sim-inspector-field">
                Waveform
                <select
                  aria-label="Function generator waveform"
                  value={selectedWave}
                  onChange={(event) => onUpdateProperty(source.id, "waveform", event.target.value)}
                >
                  <option value="sine">Sine</option>
                  <option value="square">Square</option>
                  <option value="triangle">Triangle</option>
                </select>
              </label>
              {(
                [
                  ["amplitude", "Amplitude", "V", num(source.properties.amplitude, num(source.properties.voltage, 0))],
                  ["frequency", "Frequency", "Hz", num(source.properties.frequency, 0)],
                  ["phase", "Phase", "deg", num(source.properties.phase, 0)],
                  ["offset", "DC offset", "V", num(source.properties.offset, 0)],
                ] as const
              ).map(([key, label, unit, value]) => (
                <label key={key} className="sim-inspector-field">
                  {label} ({unit})
                  <input
                    aria-label={`Function generator ${label}`}
                    inputMode="decimal"
                    value={String(value)}
                    onChange={(event) => {
                      const next = Number(event.target.value);
                      if (!Number.isFinite(next)) return;
                      onUpdateProperty(source.id, key, next);
                      if (key === "amplitude") onUpdateProperty(source.id, "voltage", next);
                    }}
                  />
                </label>
              ))}
              <button
                type="button"
                className={`sim-inspector-toggle${outputOn ? " sim-inspector-toggle--on" : ""}`}
                aria-pressed={outputOn}
                onClick={() => onUpdateProperty(source.id, "outputEnabled", !outputOn)}
              >
                Output {outputOn ? "on" : "off"}
              </button>
              <p className="sim-measurements-empty">
                {selectedWave === "sine"
                  ? "Sine drives the circuit, oscilloscope, sweep, and measurements. Run after each change."
                  : "Square and triangle are solved in the time domain and shown on the oscilloscope. The frequency sweep stays off for non-sine output. Run after each change."}
              </p>
            </>
          )}
        </section>
      )}
      {showScope && (
        <section aria-label="Oscilloscope">
          <h4 className="sim-instruments-title">Oscilloscope</h4>
          {samples.length < 2 ? (
            <p className="sim-measurements-empty">Run the simulation to plot voltage against time.</p>
          ) : (
            <>
              <label className="sim-inspector-field">
                Channel A
                <select aria-label="Oscilloscope channel A" value={channelA} onChange={(event) => setPickedA(event.target.value)}>
                  {signalIds.map((id) => (
                    <option key={id} value={id}>
                      {channelLabel(id, components)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="sim-inspector-field">
                Channel B
                <select
                  aria-label="Oscilloscope channel B"
                  value={channelB}
                  onChange={(event) => setPickedB(event.target.value)}
                >
                  <option value="">None</option>
                  {signalIds.map((id) => (
                    <option key={id} value={id}>
                      {channelLabel(id, components)}
                    </option>
                  ))}
                </select>
              </label>
              <ScopeTrace samples={samples} channelA={channelA} channelB={channelB} />
              <p className="sim-measurements-empty">
                CH A {channelA || "—"} · CH B {channelB || "—"} · {samples.length} samples
              </p>
            </>
          )}
        </section>
      )}
    </div>
  );
}

export default VirtualLabInstruments;
