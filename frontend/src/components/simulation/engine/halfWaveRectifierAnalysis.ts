/**
 * Half-wave rectifier metrics from a real transient (AC + diode) solve.
 */
import type { CircuitDefinition } from "./circuitGraph";
import { acSourceAmplitude, isAcVoltageSource } from "./acSolver";
import type { Measurements, HalfWaveRectifierLabMeasurements } from "./types";

function readVinSeries(
  measurements: Measurements,
  circuit: CircuitDefinition,
): { t: number; vin: number; vout: number }[] {
  const series = measurements.timeSeries;
  if (!series || series.length < 2) return [];

  const vs = circuit.components.find((c) => c.type === "voltage_source");
  const load = circuit.components.find((c) => c.type === "resistor");
  const vmOut = circuit.components.find(
    (c) => c.type === "voltmeter" && (c.id === "VM_out" || c.label === "VM_out"),
  );
  const vmIn = circuit.components.find(
    (c) => c.type === "voltmeter" && (c.id === "VM_in" || c.label === "VM_in"),
  );

  const vinKey = vmIn
    ? `V_${vmIn.id}`
    : vs
      ? `V_${vs.id}`
      : "vin";
  const voutKey = vmOut
    ? `V_${vmOut.id}`
    : load
      ? `V_${load.id}`
      : "vout";

  return series.map((s) => ({
    t: s.t,
    vin: Number(s.values[vinKey] ?? s.values.vin ?? 0),
    vout: Number(s.values[voutKey] ?? s.values.vout ?? 0),
  }));
}

/** Count rising zero-crossings of a signal (approx frequency = count / duration). */
function frequencyFromZeroCrossings(
  samples: { t: number; y: number }[],
): number | null {
  if (samples.length < 3) return null;
  let crossings = 0;
  for (let i = 1; i < samples.length; i++) {
    if (samples[i - 1].y < 0 && samples[i].y >= 0) crossings += 1;
  }
  const duration = samples[samples.length - 1].t - samples[0].t;
  if (!(duration > 0) || crossings < 1) return null;
  return crossings / duration;
}

/** Count output pulses (rising edge through a threshold near Vf/2). */
function rippleFrequencyFromPulses(
  samples: { t: number; y: number }[],
  threshold: number,
): number | null {
  if (samples.length < 3) return null;
  let pulses = 0;
  for (let i = 1; i < samples.length; i++) {
    if (samples[i - 1].y < threshold && samples[i].y >= threshold) pulses += 1;
  }
  const duration = samples[samples.length - 1].t - samples[0].t;
  if (!(duration > 0) || pulses < 1) return null;
  return pulses / duration;
}

export function extractHalfWaveRectifierMetrics(
  circuit: CircuitDefinition,
  measurements: Measurements,
): HalfWaveRectifierLabMeasurements | null {
  const vs = circuit.components.find(
    (c) => c.type === "voltage_source" && isAcVoltageSource(c.properties),
  );
  const diode = circuit.components.find((c) => c.type === "diode" || c.type === "led");
  const load = circuit.components.find((c) => c.type === "resistor");
  if (!vs || !diode || !load) return null;

  const samples = readVinSeries(measurements, circuit);
  if (samples.length < 10) return null;

  const VinAmplitude = acSourceAmplitude(vs.properties);
  const inputFrequency =
    typeof vs.properties.frequency === "number" && vs.properties.frequency > 0
      ? vs.properties.frequency
      : null;
  const forwardVoltage =
    typeof diode.properties.forwardVoltage === "number"
      ? diode.properties.forwardVoltage
      : 0.7;
  const RL =
    typeof load.properties.resistance === "number" ? load.properties.resistance : 0;

  let vinPeak = 0;
  let voutPeak = 0;
  let sumOut = 0;
  for (const s of samples) {
    vinPeak = Math.max(vinPeak, Math.abs(s.vin));
    voutPeak = Math.max(voutPeak, s.vout);
    sumOut += s.vout;
  }
  const averageOutput = sumOut / samples.length;

  const finMeasured = frequencyFromZeroCrossings(
    samples.map((s) => ({ t: s.t, y: s.vin })),
  );
  const foutMeasured = rippleFrequencyFromPulses(
    samples.map((s) => ({ t: s.t, y: s.vout })),
    Math.max(forwardVoltage * 0.5, voutPeak * 0.2),
  );

  return {
    VinAmplitude,
    VinPeak: vinPeak,
    VoutPeak: voutPeak,
    inputFrequency: inputFrequency ?? finMeasured,
    inputFrequencyMeasured: finMeasured,
    rippleFrequency: foutMeasured,
    averageOutput,
    forwardVoltage,
    RL,
    sampleCount: samples.length,
    duration: samples[samples.length - 1].t - samples[0].t,
  };
}
