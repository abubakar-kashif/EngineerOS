/**
 * Evidence-based lab diagnosis.
 *
 * Classifications use only the drawing, validator codes, and attached solver
 * metrics. A missing measurement is stated as missing. Normal filter, charge,
 * resonance, and rectifier behavior is Expected, not a fault.
 */
import type { CircuitDefinition, Component } from "./circuitGraph";
import { theoreticalRcLowPassGain } from "./rcLowPassAnalysis";
import type { SimulationResult } from "./types";

export type DiagnosisClass = "Confirmed" | "Likely" | "Possible" | "Expected";

export interface LabDiagnosis {
  classification: DiagnosisClass;
  topic: string;
  evidence: string;
  suggestion: string | null;
}

function connectedTerminals(circuit: CircuitDefinition): Set<string> {
  const ids = new Set<string>();
  for (const conn of circuit.connections ?? []) {
    if (conn.from) ids.add(conn.from);
    if (conn.to) ids.add(conn.to);
  }
  return ids;
}

function componentOpen(component: Component, connected: Set<string>): boolean {
  const terminals = component.terminals ?? [];
  if (terminals.length === 0) return false;
  return terminals.every((terminal) => !connected.has(terminal.id));
}

function push(findings: LabDiagnosis[], finding: LabDiagnosis) {
  const key = `${finding.classification}|${finding.topic}`;
  if (findings.some((item) => `${item.classification}|${item.topic}` === key)) return;
  findings.push(finding);
}

function fromValidation(result: SimulationResult, findings: LabDiagnosis[]) {
  const errors = result.validation?.errors ?? [];
  const warnings = result.validation?.warnings ?? [];
  for (const error of errors) {
    push(findings, {
      classification: "Confirmed",
      topic: error.code,
      evidence: error.message,
      suggestion: error.suggestedFix ?? null,
    });
  }
  for (const warning of warnings) {
    push(findings, {
      classification: "Likely",
      topic: warning.code,
      evidence: warning.message,
      suggestion: warning.suggestedFix ?? null,
    });
  }
}

function fromDrawing(circuit: CircuitDefinition, findings: LabDiagnosis[]) {
  const connected = connectedTerminals(circuit);
  const hasGroundSymbol = circuit.components.some((component) => component.type === "ground");
  if (!hasGroundSymbol) {
    push(findings, {
      classification: "Confirmed",
      topic: "missing ground",
      evidence: "The component list has no ground symbol.",
      suggestion: "Add a ground and connect it to the source return.",
    });
  } else {
    const ground = circuit.components.find((component) => component.type === "ground");
    if (ground && componentOpen(ground, connected)) {
      push(findings, {
        classification: "Confirmed",
        topic: "disconnected ground",
        evidence: `Ground ${ground.id} has no wire on its terminal.`,
        suggestion: "Connect the ground terminal to the source return.",
      });
    }
  }

  for (const component of circuit.components) {
    if (component.type === "ground" || !componentOpen(component, connected)) continue;
    const capacitor = component.type === "capacitor";
    push(findings, {
      classification: "Confirmed",
      topic: capacitor ? "disconnected capacitor" : `disconnected ${component.type}`,
      evidence: `${component.label || component.id} has no wires on its terminals.`,
      suggestion: capacitor
        ? "Connect the capacitor between the output node and ground."
        : `Connect ${component.label || component.id} into the circuit, or remove it.`,
    });
  }
}

function fromRcLowPass(circuit: CircuitDefinition, result: SimulationResult, findings: LabDiagnosis[]) {
  const lp = result.measurements?.rcLowPass;
  const isFilter = circuit.experimentId === "rc-low-pass-filter";
  if (!lp) {
    if (isFilter && result.status === "completed" && !findings.some((item) => item.classification === "Confirmed")) {
      push(findings, {
        classification: "Possible",
        topic: "missing low-pass metrics",
        evidence: "The run completed, but no RC low-pass sweep metrics were attached.",
        suggestion: "Use one resistor, one capacitor, and a sine source, then Run again.",
      });
    }
    return;
  }

  if (!(lp.driveFrequency > 0)) {
    push(findings, {
      classification: "Confirmed",
      topic: "incorrect frequency",
      evidence: `The drive frequency attached to this run is ${lp.driveFrequency} Hz.`,
      suggestion: "Set the function generator to a positive frequency.",
    });
    return;
  }

  if (lp.R > 1e9 || lp.R < 0.1 || lp.C > 1 || lp.C < 1e-15) {
    push(findings, {
      classification: "Likely",
      topic: "unrealistic component value",
      evidence: `The solved circuit uses R=${lp.R} Ω and C=${lp.C} F.`,
      suggestion: "Check the resistor and capacitor values against the starter.",
    });
  }

  const probeId = result.measurements?.frequencySweep?.probeId ?? null;
  const capacitor = circuit.components.find((component) => component.type === "capacitor");
  if (probeId && capacitor && probeId !== capacitor.id) {
    push(findings, {
      classification: "Likely",
      topic: "wrong output node",
      evidence: `The frequency sweep probed ${probeId}, not capacitor ${capacitor.id}.`,
      suggestion: "Probe the capacitor voltage for Vout.",
    });
  }

  const theoreticalGain = theoreticalRcLowPassGain(lp.driveFrequency, lp.fcTheoretical);
  const gain = lp.gainAtDrive;
  const fcError =
    lp.fcSimulated != null && lp.fcTheoretical > 0
      ? Math.abs(lp.fcSimulated - lp.fcTheoretical) / lp.fcTheoretical
      : null;

  if (gain == null) {
    push(findings, {
      classification: "Possible",
      topic: "gain unavailable",
      evidence: "The sweep did not include a gain sample at the drive frequency.",
      suggestion: null,
    });
    return;
  }

  const gainError = Math.abs(gain - theoreticalGain);
  if (gainError <= 0.08 && (fcError == null || fcError <= 0.12)) {
    const above = lp.driveFrequency > 3 * lp.fcTheoretical;
    const below = lp.driveFrequency < 0.2 * lp.fcTheoretical;
    push(findings, {
      classification: "Expected",
      topic: above ? "high-frequency attenuation" : below ? "low-frequency passband" : "frequency response",
      evidence: `Simulated gain ${gain.toFixed(3)} matches theoretical ${theoreticalGain.toFixed(3)} at ${lp.driveFrequency.toFixed(2)} Hz. fc_th=${lp.fcTheoretical.toFixed(2)} Hz${lp.fcSimulated != null ? `, fc_sim=${lp.fcSimulated.toFixed(2)} Hz` : ""}.`,
      suggestion: null,
    });
    return;
  }

  if (gainError > 0.25 || (fcError != null && fcError > 0.2)) {
    push(findings, {
      classification: "Likely",
      topic: "unexpected RC filter response",
      evidence: `Simulated gain ${gain.toFixed(3)} differs from theoretical ${theoreticalGain.toFixed(3)} at ${lp.driveFrequency.toFixed(2)} Hz${fcError != null ? ` (cutoff error ${(fcError * 100).toFixed(1)}%)` : ""}.`,
      suggestion: "Check that Vout is across the capacitor and that no extra part is in series or parallel.",
    });
  }
}

function fromRectifiers(result: SimulationResult, findings: LabDiagnosis[]) {
  const half = result.measurements?.halfWaveRectifier;
  if (half && half.VinPeak > 0.5) {
    if (half.VoutPeak < 0.05 * half.VinPeak) {
      push(findings, {
        classification: "Likely",
        topic: "diode not conducting",
        evidence: `Vin peak is ${half.VinPeak.toFixed(3)} V and Vout peak is ${half.VoutPeak.toFixed(3)} V in the transient record.`,
        suggestion: "Check diode polarity and that the load returns to ground.",
      });
    } else if (half.VoutPeak > 0.5 * half.VinPeak) {
      push(findings, {
        classification: "Expected",
        topic: "half-wave conduction",
        evidence: `Vout peak ${half.VoutPeak.toFixed(3)} V follows Vin peak ${half.VinPeak.toFixed(3)} V minus the diode drop in this run.`,
        suggestion: null,
      });
    }
  }

  const full = result.measurements?.fullWaveBridge;
  if (full && full.sampleCount > 0) {
    if (full.conductingDiodeIds.length === 0 && full.VinPeak > 0.5) {
      push(findings, {
        classification: "Confirmed",
        topic: "bridge diodes did not conduct",
        evidence: `The transient window recorded Vin peak ${full.VinPeak.toFixed(3)} V and no diode current above the conduction threshold.`,
        suggestion: "Check bridge polarity and the load connection.",
      });
    } else if (full.conductingDiodeIds.length >= 2) {
      push(findings, {
        classification: "Expected",
        topic: "bridge conduction",
        evidence: `Conducting diodes in this window: ${full.conductingDiodeIds.join(", ")}. Vout peak ${full.VoutPeak.toFixed(3)} V.`,
        suggestion: null,
      });
    }
  }
}

function fromResonance(result: SimulationResult, findings: LabDiagnosis[]) {
  const sr = result.measurements?.seriesResonance;
  if (!sr || sr.f0Simulated == null || !(sr.f0Theoretical > 0)) return;
  const error = Math.abs(sr.f0Simulated - sr.f0Theoretical) / sr.f0Theoretical;
  if (error <= 0.08) {
    push(findings, {
      classification: "Expected",
      topic: "series resonance",
      evidence: `Sweep peak ${sr.f0Simulated.toFixed(2)} Hz is within 8% of 1/(2π√LC) = ${sr.f0Theoretical.toFixed(2)} Hz.`,
      suggestion: null,
    });
  } else if (error > 0.25) {
    push(findings, {
      classification: "Likely",
      topic: "resonance peak disagrees with LC",
      evidence: `Sweep peak ${sr.f0Simulated.toFixed(2)} Hz differs from theoretical ${sr.f0Theoretical.toFixed(2)} Hz by ${(error * 100).toFixed(1)}%.`,
      suggestion: "Confirm the sweep probes the series current and that L and C are the intended values.",
    });
  }
}

function fromRcCharge(result: SimulationResult, findings: LabDiagnosis[]) {
  const rc = result.measurements?.rc;
  if (!rc || rc.tauSimulated == null || !(rc.tauTheoretical > 0)) return;
  const error = Math.abs(rc.tauSimulated - rc.tauTheoretical) / rc.tauTheoretical;
  if (error <= 0.15) {
    push(findings, {
      classification: "Expected",
      topic: "RC time constant",
      evidence: `Simulated τ ${rc.tauSimulated.toFixed(4)} s matches RC ${rc.tauTheoretical.toFixed(4)} s within 15%.`,
      suggestion: null,
    });
  } else if (error > 0.4) {
    push(findings, {
      classification: "Likely",
      topic: "RC time constant mismatch",
      evidence: `Simulated τ ${rc.tauSimulated.toFixed(4)} s differs from RC ${rc.tauTheoretical.toFixed(4)} s by ${(error * 100).toFixed(1)}%.`,
      suggestion: "Check R, C, and that the capacitor voltage is the measured node.",
    });
  }
}

export function diagnoseLab(
  circuit: CircuitDefinition | null | undefined,
  result: SimulationResult | null | undefined,
): LabDiagnosis[] {
  if (!circuit && !result) {
    return [
      {
        classification: "Possible",
        topic: "no evidence",
        evidence: "No circuit drawing and no simulation result are available.",
        suggestion: null,
      },
    ];
  }

  const findings: LabDiagnosis[] = [];
  if (circuit) fromDrawing(circuit, findings);
  if (result) fromValidation(result, findings);

  if (!result) {
    if (findings.length === 0) {
      push(findings, {
        classification: "Possible",
        topic: "not yet simulated",
        evidence: "The drawing is present, but no simulation result is attached.",
        suggestion: "Run the simulation before treating a reading as a fault.",
      });
    }
    return findings;
  }

  if (result.status === "failed" && findings.every((item) => item.classification !== "Confirmed")) {
    push(findings, {
      classification: "Confirmed",
      topic: "solver failure",
      evidence: result.error ?? "The solver reported failure without a measurement record.",
      suggestion: "Read the solver message and correct the listed component or connection.",
    });
  }

  if (result.status === "completed") {
    fromRcLowPass(circuit ?? { components: [], connections: [] }, result, findings);
    fromRectifiers(result, findings);
    fromResonance(result, findings);
    fromRcCharge(result, findings);
    if (!findings.some((item) => item.classification === "Confirmed" || item.classification === "Likely" || item.classification === "Expected")) {
      push(findings, {
        classification: "Expected",
        topic: "no confirmed fault",
        evidence: "The run completed and the validator did not report an error.",
        suggestion: null,
      });
    }
  }

  return findings;
}
