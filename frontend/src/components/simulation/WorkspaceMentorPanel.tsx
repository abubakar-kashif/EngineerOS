/**
 * Compact AI Mentor rail for the simulation lab closed loop.
 * Always sends the latest simulation_run_id; never invents circuit state.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Bot, ExternalLink, TriangleAlert, X } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import * as mentorService from "../../services/mentor/mentorService";
import ChatComposer from "../chat/ChatComposer";
import MarkdownLite from "../chat/MarkdownLite";
import TypingIndicator from "../chat/TypingIndicator";
import type { ChatMessage } from "../../types/chat";
import type { SimulationResult } from "./engine";
import type { CircuitDefinition } from "./engine/circuitGraph";
import { compactCircuitForMentor } from "./engine/electricalSnapshot";
import { diagnoseLab, type LabDiagnosis } from "./engine/labDiagnosis";
import { labelForComponent } from "./engine/graphData";
import {
  buildMentorExpandHref,
  saveSimMentorSnapshot,
  simMentorConversationStorageKey,
} from "../../services/mentor/simMentorBridge";

interface WorkspaceMentorPanelProps {
  experimentId: string | null;
  experimentTitle: string | null;
  simResult: SimulationResult | null;
  /** Fresh SimulationRun id after each solve — authoritative Mentor context. */
  simulationRunId?: string | null;
  /** Live canvas topology; sent with every ask so Mentor sees the current drawing. */
  liveCircuit?: CircuitDefinition | null;
  /** Close the mentor rail to enlarge the canvas. */
  onClose?: () => void;
}

function formatCurrent(a: number): string {
  if (Math.abs(a) < 1) return `${(a * 1000).toFixed(2)} mA`;
  return `${a.toFixed(4)} A`;
}

function formatHenry(h: number): string {
  if (h >= 1) return `${h.toFixed(3)} H`;
  if (h >= 1e-3) return `${(h * 1e3).toFixed(1)} mH`;
  return `${(h * 1e6).toFixed(1)} µH`;
}

function WorkspaceMentorPanel({
  experimentId,
  experimentTitle,
  simResult,
  simulationRunId = null,
  liveCircuit = null,
  onClose,
}: WorkspaceMentorPanelProps) {
  const { user } = useAuth();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [streamingText, setStreamingText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [contextFlash, setContextFlash] = useState(false);
  const cancelRef = useRef<(() => void) | null>(null);
  const lastFailedRef = useRef<string | null>(null);
  const conversationIdRef = useRef<string | null>(null);
  // Always read latest IDs at send-time (avoid stale closures mid-stream)
  const runIdRef = useRef(simulationRunId);
  const experimentIdRef = useRef(experimentId);
  const simResultRef = useRef(simResult);
  const liveCircuitRef = useRef(liveCircuit);

  const storageKey = simMentorConversationStorageKey(experimentId);

  useEffect(() => {
    conversationIdRef.current = conversationId;
  }, [conversationId]);

  useEffect(() => {
    runIdRef.current = simulationRunId;
  }, [simulationRunId]);
  useEffect(() => {
    experimentIdRef.current = experimentId;
  }, [experimentId]);
  useEffect(() => {
    simResultRef.current = simResult;
  }, [simResult]);
  useEffect(() => {
    liveCircuitRef.current = liveCircuit;
    saveSimMentorSnapshot(
      experimentId,
      liveCircuit ? compactCircuitForMentor(liveCircuit) : null,
    );
  }, [liveCircuit, experimentId]);

  // Reload persisted Simulation Mentor thread when the panel remounts.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const savedId = sessionStorage.getItem(storageKey);
    if (!savedId) return undefined;

    void mentorService.getConversation(savedId).then((conv) => {
      if (cancelled || !conv) return;
      setConversationId(conv.id);
      setMessages(conv.messages);
    }).catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [user, storageKey]);

  // Flash when a new authoritative run arrives (closed-loop freshness)
  const contextKey = `${simulationRunId ?? ""}|${simResult?.status ?? ""}|${simResult?.measurements?.totalCurrent ?? ""}`;
  const [flashKey, setFlashKey] = useState<string | null>(null);
  if ((simulationRunId || simResult) && contextKey !== flashKey) {
    setFlashKey(contextKey);
    setContextFlash(true);
  }

  useEffect(() => {
    if (!contextFlash) return;
    const t = window.setTimeout(() => setContextFlash(false), 2200);
    return () => window.clearTimeout(t);
  }, [contextFlash, flashKey]);

  const mentorLink = buildMentorExpandHref({
    experimentId,
    simulationRunId,
    simStatus: simResult?.status ?? null,
    conversationId,
  });

  const diagnoses = useMemo(
    () => diagnoseLab(liveCircuit, simResult),
    [liveCircuit, simResult],
  );

  const contextHint = useMemo(() => {
    if (!simResult) {
      return experimentTitle
        ? `Guidance for ${experimentTitle}. Ask before you build — Mentor will not invent your circuit.`
        : "Ask how to build (e.g. KVL). Mentor guides; only the simulator validates.";
    }
    if (simResult.status === "invalid") {
      const code = simResult.validation?.errors?.[0]?.code;
      return code
        ? `Latest simulator error: ${code}. Ask what went wrong.`
        : "Simulator reported an invalid circuit. Ask for an explanation.";
    }
    if (simResult.status === "completed" && simResult.measurements) {
      const m = simResult.measurements;
      if (m.rcLowPass) {
        const lp = m.rcLowPass;
        const fcSim = lp.fcSimulated != null ? `${lp.fcSimulated.toFixed(2)} Hz` : "n/a";
        const gain = lp.gainAtDrive != null ? lp.gainAtDrive.toFixed(3) : "n/a";
        return `RC low-pass: R=${lp.R} Ω, C=${lp.C} F, Vin=${lp.Vin} V, f=${lp.driveFrequency.toFixed(2)} Hz, fc_th=${lp.fcTheoretical.toFixed(2)} Hz, fc_sim=${fcSim}, gain=${gain}`;
      }
      if (m.rc) {
        const tauSim =
          m.rc.tauSimulated != null ? `${m.rc.tauSimulated.toFixed(3)} s` : "n/a";
        return `RC ${m.rc.mode}: Vc=${m.rc.Vc.toFixed(3)} V, Ic=${formatCurrent(m.rc.Ic)}, τ_th=${m.rc.tauTheoretical.toFixed(3)} s, τ_sim=${tauSim}`;
      }
      if (m.rl) {
        const tauSim =
          m.rl.tauSimulated != null ? `${m.rl.tauSimulated.toFixed(6)} s` : "n/a";
        return `RL ${m.rl.mode}: R=${m.rl.R} Ω, L=${m.rl.L} H, Vin=${m.rl.Vin} V, t=${m.rl.time.toFixed(6)} s, i(t)=${formatCurrent(m.rl.iL)}, τ=${m.rl.tauTheoretical.toFixed(6)} s (sim ${tauSim})`;
      }
      if (m.seriesResonance) {
        const sr = m.seriesResonance;
        const fSim =
          sr.f0Simulated != null ? `${sr.f0Simulated.toFixed(2)} Hz` : "n/a";
        return `Series resonance: R=${sr.R} Ω, L=${sr.L} H, C=${sr.C} F, Vin=${sr.Vin} V, sweep ${sr.fStart.toFixed(1)}–${sr.fStop.toFixed(1)} Hz (${sr.points} pts), f0_th=${sr.f0Theoretical.toFixed(2)} Hz, f0_sim(max|I|)=${fSim}`;
      }
      if (m.halfWaveRectifier) {
        const hw = m.halfWaveRectifier;
        const fin =
          hw.inputFrequency != null ? `${hw.inputFrequency.toFixed(2)} Hz` : "n/a";
        const fr =
          hw.rippleFrequency != null
            ? `${hw.rippleFrequency.toFixed(2)} Hz`
            : "n/a";
        return `Half-wave rectifier: Vin_pk=${hw.VinPeak.toFixed(3)} V, Vout_pk=${hw.VoutPeak.toFixed(3)} V, Vavg=${hw.averageOutput.toFixed(3)} V, f_in=${fin}, f_ripple=${fr}, Vf=${hw.forwardVoltage.toFixed(2)} V, RL=${hw.RL} Ω`;
      }
      if (m.fullWaveBridge) {
        const fw = m.fullWaveBridge;
        const fin =
          fw.inputFrequency != null ? `${fw.inputFrequency.toFixed(2)} Hz` : "n/a";
        const fr =
          fw.rippleFrequency != null ? `${fw.rippleFrequency.toFixed(2)} Hz` : "n/a";
        return `Full-wave bridge: Vin_pk=${fw.VinPeak.toFixed(3)} V, Vout_pk=${fw.VoutPeak.toFixed(3)} V, Vavg=${fw.averageOutput.toFixed(3)} V, f_in=${fin}, f_ripple=${fr}, Vf=${fw.forwardVoltage.toFixed(2)} V, RL=${fw.RL} Ω, conducting=${fw.conductingDiodeIds.join(",")}`;
      }
      if (m.rlc) {
        return `RLC: R=${m.rlc.R} Ω, L=${m.rlc.L} H, C=${m.rlc.C} F, Vin=${m.rlc.Vin} V, t=${m.rlc.time.toFixed(6)} s, i=${formatCurrent(m.rlc.i)}, Vc=${m.rlc.Vc.toFixed(3)} V, |i|_pk=${formatCurrent(m.rlc.iPeak)}, |Vc|_pk=${m.rlc.vcPeak.toFixed(3)} V, crossings=${m.rlc.zeroCrossings}`;
      }
      return `Latest run: I=${formatCurrent(m.totalCurrent)}, V=${m.totalVoltage.toFixed(2)} V, Req=${m.equivalentResistance.toFixed(1)} Ω`;
    }
    if (simResult.status === "completed") {
      return "Simulation completed. Ask about the authoritative results.";
    }
    return `Simulation status: ${simResult.status}.`;
  }, [experimentTitle, simResult]);

  const factChips = useMemo(() => {
    if (!simResult?.measurements || simResult.status !== "completed") {
      if (simResult?.status === "invalid") {
        const err = simResult.validation?.errors?.[0];
        return err ? [`${err.code}`] : [];
      }
      return [];
    }
    const chips: string[] = [];
    const m = simResult.measurements;
    if (m.rcLowPass) {
      const lp = m.rcLowPass;
      chips.push("low-pass");
      chips.push(`fc_th ${lp.fcTheoretical.toFixed(1)} Hz`);
      if (lp.fcSimulated != null) chips.push(`fc_sim ${lp.fcSimulated.toFixed(1)} Hz`);
      chips.push(`R ${lp.R} Ω`);
      chips.push(`C ${lp.C} F`);
      if (lp.gainAtDrive != null) chips.push(`gain ${lp.gainAtDrive.toFixed(3)}`);
      return chips.slice(0, 6);
    }
    if (m.rc) {
      chips.push(m.rc.mode);
      chips.push(`τ ${m.rc.tauTheoretical.toFixed(3)} s`);
      chips.push(`Vc ${m.rc.Vc.toFixed(2)} V`);
      chips.push(`Ic ${formatCurrent(m.rc.Ic)}`);
      if (m.rc.tauSimulated != null) {
        chips.push(`τ_sim ${m.rc.tauSimulated.toFixed(3)} s`);
      }
      return chips.slice(0, 6);
    }
    if (m.rl) {
      chips.push(m.rl.mode);
      chips.push(`R ${m.rl.R} Ω`);
      chips.push(`L ${formatHenry(m.rl.L)}`);
      chips.push(`Vin ${m.rl.Vin} V`);
      chips.push(`i ${formatCurrent(m.rl.iL)}`);
      chips.push(`τ ${m.rl.tauTheoretical.toFixed(6)} s`);
      return chips.slice(0, 6);
    }
    if (m.seriesResonance) {
      const sr = m.seriesResonance;
      chips.push("resonance");
      chips.push(`f0_th ${sr.f0Theoretical.toFixed(1)} Hz`);
      if (sr.f0Simulated != null) {
        chips.push(`f0_sim ${sr.f0Simulated.toFixed(1)} Hz`);
      }
      chips.push(`R ${sr.R} Ω`);
      chips.push(`L ${formatHenry(sr.L)}`);
      chips.push(`C ${sr.C} F`);
      return chips.slice(0, 6);
    }
    if (m.halfWaveRectifier) {
      const hw = m.halfWaveRectifier;
      chips.push("rectifier");
      chips.push(`Vin ${hw.VinPeak.toFixed(2)} V`);
      chips.push(`Vout ${hw.VoutPeak.toFixed(2)} V`);
      chips.push(`Vavg ${hw.averageOutput.toFixed(2)} V`);
      if (hw.inputFrequency != null) {
        chips.push(`fin ${hw.inputFrequency.toFixed(0)} Hz`);
      }
      if (hw.rippleFrequency != null) {
        chips.push(`fr ${hw.rippleFrequency.toFixed(0)} Hz`);
      }
      return chips.slice(0, 6);
    }
    if (m.fullWaveBridge) {
      const fw = m.fullWaveBridge;
      chips.push("bridge");
      chips.push(`Vin ${fw.VinPeak.toFixed(2)} V`);
      chips.push(`Vout ${fw.VoutPeak.toFixed(2)} V`);
      chips.push(`Vavg ${fw.averageOutput.toFixed(2)} V`);
      if (fw.rippleFrequency != null) {
        chips.push(`fr ${fw.rippleFrequency.toFixed(0)} Hz`);
      }
      return chips.slice(0, 6);
    }
    if (m.rlc) {
      chips.push("RLC");
      chips.push(`i ${formatCurrent(m.rlc.i)}`);
      chips.push(`Vc ${m.rlc.Vc.toFixed(2)} V`);
      chips.push(`|i|pk ${formatCurrent(m.rlc.iPeak)}`);
      chips.push(`|Vc|pk ${m.rlc.vcPeak.toFixed(2)} V`);
      chips.push(`zx ${m.rlc.zeroCrossings}`);
      return chips.slice(0, 6);
    }
    chips.push(`I ${formatCurrent(m.totalCurrent)}`);
    for (const c of m.componentMeasurements) {
      if (c.componentId.startsWith("__")) continue;
      if (["resistor", "diode", "led"].includes(c.type) || c.type === "resistor") {
        chips.push(
          `${labelForComponent(liveCircuit ?? undefined, c.componentId, c.type)} ${c.voltage.toFixed(2)} V`,
        );
      }
    }
    return chips.slice(0, 6);
  }, [simResult, liveCircuit]);

  const suggestions = useMemo(() => {
    if (!simResult) {
      if (experimentTitle?.toLowerCase().includes("kvl") || experimentId === "kvl") {
        return [
          "I want to build KVL. What components do I need?",
          "What does a loop mean, and what should I measure?",
        ];
      }
      return [
        experimentTitle
          ? `How should I build this circuit?`
          : "How should I build this circuit?",
        "How should I wire a series loop with a source, resistor, and ground?",
      ];
    }
    if (simResult.status === "invalid") {
      return [
        "Why isn't my circuit working?",
        "What's wrong with my wiring?",
        "How do I fix this circuit?",
      ];
    }
    if (simResult.status === "completed") {
      if (
        experimentId === "rc-low-pass-filter" ||
        simResult.measurements?.rcLowPass
      ) {
        return [
          "Compare my simulated cutoff with 1/(2πRC).",
          "Why is the output smaller at this frequency?",
          "Is this attenuation expected, or a wiring mistake?",
        ];
      }
      if (experimentId === "rc-circuit" || simResult.measurements?.rc) {
        return [
          "Compare my simulated τ with RC.",
          "Is this charging or discharging right now?",
          "Why is Ic falling while Vc rises?",
        ];
      }
      if (experimentId === "rl-circuit" || simResult.measurements?.rl) {
        return [
          "Compare my simulated τ with L/R.",
          "What is i(t) doing in this run?",
          "Why does resistor voltage rise with inductor current?",
        ];
      }
      if (experimentId === "rlc-circuit" || simResult.measurements?.rlc) {
        return [
          "Summarize my RLC i(t) and Vc(t) waveforms.",
          "How is energy moving between L and C in this run?",
          "What do the current zero-crossings tell me?",
        ];
      }
      if (
        experimentId === "series-resonance" ||
        simResult.measurements?.seriesResonance
      ) {
        return [
          "Compare my simulated f0 to 1/(2π√LC).",
          "Where is the maximum-current frequency on my sweep?",
          "What do R, L, and C do to the resonance peak?",
        ];
      }
      if (
        experimentId === "half-wave-rectifier" ||
        simResult.measurements?.halfWaveRectifier
      ) {
        return [
          "Why is Vout peak lower than Vin peak?",
          "Why is the ripple frequency equal to the line frequency?",
          "What happens on the negative half-cycle of Vin?",
        ];
      }
      if (
        experimentId === "full-wave-bridge-rectifier" ||
        simResult.measurements?.fullWaveBridge
      ) {
        return [
          "Why does the bridge use two diodes on each half-cycle?",
          "Why is the ripple frequency about twice the line frequency?",
          "Why is Vout peak about Vin peak minus two forward drops?",
        ];
      }
      return [
        "Explain what is happening in my circuit.",
        "Why is my voltmeter showing this value?",
        "Why is my current zero?",
      ];
    }
    return ["Explain the latest simulation result."];
  }, [simResult, experimentTitle, experimentId]);

  async function handleSend(options: { emitUserMessage?: boolean; text?: string } = {}) {
    const text = (options.text ?? draft).trim();
    if (!text || busy || !user) return;

    const emitUser = options.emitUserMessage !== false;
    const pendingId = `local-user-${Date.now()}`;

    setError(null);
    setBusy(true);
    setStreamingText(null);
    setDraft("");
    lastFailedRef.current = null;

    if (emitUser) {
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "user" && last.content === text) return prev;
        return [
          ...prev,
          {
            id: pendingId,
            conversation_id: conversationId ?? "pending",
            role: "user",
            content: text,
            created_at: new Date().toISOString(),
            status: "complete",
            feedback: null,
          },
        ];
      });
    }

    let activeId = conversationId;
    if (!activeId) {
      try {
        const conv = await mentorService.createConversation(experimentIdRef.current);
        activeId = conv.id;
        setConversationId(conv.id);
        sessionStorage.setItem(storageKey, conv.id);
      } catch {
        setBusy(false);
        setError("Unable to start Mentor conversation.");
        setDraft(text);
        if (emitUser) {
          setMessages((prev) => prev.filter((m) => m.id !== pendingId));
        }
        return;
      }
    } else {
      sessionStorage.setItem(storageKey, activeId);
    }

    const latestRunId = runIdRef.current;
    const live = liveCircuitRef.current;
    if (simResultRef.current && !latestRunId) {
      setError(
        "Simulation finished locally, but Mentor needs a saved run. Sign in and Run again so context stays fresh.",
      );
    }

    const baseSnapshot = live ? compactCircuitForMentor(live) : null;
    const rcState = simResultRef.current?.measurements?.rc;
    const rlState = simResultRef.current?.measurements?.rl;
    let circuitSnapshot = baseSnapshot;
    if (baseSnapshot && rcState) {
      circuitSnapshot = {
        ...baseSnapshot,
        simulationState: {
          experiment: "rc-circuit",
          mode: rcState.mode,
          R: rcState.R,
          C: rcState.C,
          Vin: rcState.Vin,
          V0: rcState.V0,
          time: rcState.time,
          Vc: rcState.Vc,
          Ic: rcState.Ic,
          Ic0: rcState.Ic0,
          tauTheoretical: rcState.tauTheoretical,
          tauSimulated: rcState.tauSimulated,
          tauErrorPercent: rcState.tauErrorPercent,
        },
      };
    } else if (baseSnapshot && rlState) {
      circuitSnapshot = {
        ...baseSnapshot,
        simulationState: {
          experiment: "rl-circuit",
          mode: rlState.mode,
          R: rlState.R,
          L: rlState.L,
          Vin: rlState.Vin,
          time: rlState.time,
          i: rlState.iL,
          tau: rlState.tauTheoretical,
          tauSimulated: rlState.tauSimulated,
          tauErrorPercent: rlState.tauErrorPercent,
          Ifinal: rlState.Ifinal,
        },
      };
    } else if (baseSnapshot && simResultRef.current?.measurements?.rlc) {
      const rlc = simResultRef.current.measurements.rlc;
      circuitSnapshot = {
        ...baseSnapshot,
        simulationState: {
          experiment: "rlc-circuit",
          R: rlc.R,
          L: rlc.L,
          C: rlc.C,
          Vin: rlc.Vin,
          time: rlc.time,
          i: rlc.i,
          Vc: rlc.Vc,
          iPeak: rlc.iPeak,
          vcPeak: rlc.vcPeak,
          energyL: rlc.energyL,
          energyC: rlc.energyC,
          zeroCrossings: rlc.zeroCrossings,
          sampleCount: rlc.sampleCount,
          duration: rlc.duration,
          timeStep: rlc.timeStep,
        },
      };
    } else if (baseSnapshot && simResultRef.current?.measurements?.rcLowPass) {
      const lp = simResultRef.current.measurements.rcLowPass;
      circuitSnapshot = {
        ...baseSnapshot,
        simulationState: {
          experiment: "rc-low-pass-filter",
          R: lp.R,
          C: lp.C,
          Vin: lp.Vin,
          driveFrequency: lp.driveFrequency,
          fcTheoretical: lp.fcTheoretical,
          fcSimulated: lp.fcSimulated,
          gainAtDrive: lp.gainAtDrive,
          phaseAtDriveDeg: lp.phaseAtDriveDeg,
          attenuationDbAtDrive: lp.attenuationDbAtDrive,
          frequencySweep: {
            fStart: lp.fStart,
            fStop: lp.fStop,
            points: lp.points,
            scale: lp.scale,
          },
        },
      };
    } else if (baseSnapshot && simResultRef.current?.measurements?.seriesResonance) {
      const sr = simResultRef.current.measurements.seriesResonance;
      circuitSnapshot = {
        ...baseSnapshot,
        simulationState: {
          experiment: "series-resonance",
          R: sr.R,
          L: sr.L,
          C: sr.C,
          Vin: sr.Vin,
          fStart: sr.fStart,
          fStop: sr.fStop,
          points: sr.points,
          frequencySweep: {
            fStart: sr.fStart,
            fStop: sr.fStop,
            points: sr.points,
            scale: sr.scale,
          },
          maximumCurrentFrequency: sr.f0Simulated,
          theoreticalF0: sr.f0Theoretical,
          f0Simulated: sr.f0Simulated,
          errorPercent: sr.errorPercent,
          peakCurrentMag: sr.peakCurrentMag,
          bandwidth: sr.bandwidth,
          Q: sr.Q,
        },
      };
    } else if (baseSnapshot && simResultRef.current?.measurements?.halfWaveRectifier) {
      const hw = simResultRef.current.measurements.halfWaveRectifier;
      circuitSnapshot = {
        ...baseSnapshot,
        simulationState: {
          experiment: "half-wave-rectifier",
          VinPeak: hw.VinPeak,
          VinAmplitude: hw.VinAmplitude,
          VoutPeak: hw.VoutPeak,
          averageOutput: hw.averageOutput,
          inputFrequency: hw.inputFrequency,
          inputFrequencyMeasured: hw.inputFrequencyMeasured,
          rippleFrequency: hw.rippleFrequency,
          forwardVoltage: hw.forwardVoltage,
          RL: hw.RL,
          sampleCount: hw.sampleCount,
          duration: hw.duration,
        },
      };
    } else if (baseSnapshot && simResultRef.current?.measurements?.fullWaveBridge) {
      const fw = simResultRef.current.measurements.fullWaveBridge;
      circuitSnapshot = {
        ...baseSnapshot,
        simulationState: {
          experiment: "full-wave-bridge-rectifier",
          VinPeak: fw.VinPeak,
          VinAmplitude: fw.VinAmplitude,
          VoutPeak: fw.VoutPeak,
          averageOutput: fw.averageOutput,
          inputFrequency: fw.inputFrequency,
          inputFrequencyMeasured: fw.inputFrequencyMeasured,
          rippleFrequency: fw.rippleFrequency,
          forwardVoltage: fw.forwardVoltage,
          RL: fw.RL,
          conductingDiodeIds: fw.conductingDiodeIds,
          sampleCount: fw.sampleCount,
          duration: fw.duration,
        },
      };
    }

    const diagnoses = diagnoseLab(live, simResultRef.current);
    const generatorSources = (live?.components ?? [])
      .filter((component) => component.type === "voltage_source")
      .map((component) => ({
        id: component.id,
        label: component.label,
        waveform: component.properties.waveform ?? "sine",
        amplitude: component.properties.amplitude ?? component.properties.voltage ?? null,
        frequency: component.properties.frequency ?? null,
        phase: component.properties.phase ?? 0,
        offset: component.properties.offset ?? 0,
        outputEnabled: component.properties.outputEnabled !== false,
      }));
    const series = simResultRef.current?.measurements?.timeSeries ?? [];
    const scopeSignals = series[0]
      ? Object.keys(series[0].values).filter((key) => key.startsWith("V_") || key.startsWith("I_")).slice(0, 8)
      : [];
    const graphSummary = (simResultRef.current?.graphs ?? []).slice(0, 8).map((graph) => ({
      id: graph.id,
      title: graph.title,
    }));
    if (circuitSnapshot) {
      const prior = circuitSnapshot.simulationState ?? {};
      circuitSnapshot = {
        ...circuitSnapshot,
        simulationState: {
          ...prior,
          diagnoses,
          functionGenerator: generatorSources,
          oscilloscope: { sampleCount: series.length, signals: scopeSignals },
          graphs: graphSummary,
        },
      };
    }

    cancelRef.current?.();
    cancelRef.current = mentorService.sendMessage(
      activeId,
      text,
      {
        experimentId: experimentIdRef.current,
        stage: "simulation",
        simulationId: latestRunId,
        circuitSnapshot,
        emitUserMessage: false,
        persistUser: true,
      },
      {
        onStart: () => setStreamingText((prev) => prev ?? ""),
        onToken: (accumulated) => setStreamingText(accumulated),
        onComplete: (message) => {
          setStreamingText(null);
          setBusy(false);
          setMessages((prev) => {
            if (prev.some((m) => m.id === message.id)) return prev;
            const last = prev[prev.length - 1];
            if (last?.role === "assistant" && last.content === message.content) return prev;
            return [...prev, message];
          });
          void mentorService.getConversation(activeId).then((conv) => {
            if (conv && conversationIdRef.current === activeId) {
              setMessages(conv.messages);
            }
          }).catch(() => undefined);
        },
        onError: (err) => {
          setStreamingText(null);
          setBusy(false);
          lastFailedRef.current = text;
          setDraft(text);
          setError(err.message || "AI Mentor could not generate a response. Please try again.");
        },
      },
    );
  }

  function handleRetry() {
    const text = lastFailedRef.current || draft.trim();
    if (!text) return;
    const last = messages[messages.length - 1];
    const alreadyShown = last?.role === "user" && last.content === text;
    void handleSend({ text, emitUserMessage: !alreadyShown });
  }

  const headerActions = (
    <div className="sim2-panel-header-actions">
      <Link to={mentorLink} className="sim2-mentor-expand" title="Open full Mentor" aria-label="Open full Mentor">
        <ExternalLink size={14} />
      </Link>
      {onClose && (
        <button
          type="button"
          className="sim2-panel-close"
          onClick={onClose}
          title="Close AI Mentor"
          aria-label="Close AI Mentor"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );

  if (!user) {
    return (
      <aside className="sim2-mentor" aria-label="AI Mentor">
        <div className="sim2-mentor-header">
          <div className="sim2-mentor-header-id">
            <Bot size={16} />
            <span>AI Mentor</span>
          </div>
          {onClose && (
            <button
              type="button"
              className="sim2-panel-close"
              onClick={onClose}
              title="Close AI Mentor"
              aria-label="Close AI Mentor"
            >
              <X size={14} />
            </button>
          )}
        </div>
        <div className="sim2-mentor-offline">
          <TriangleAlert size={14} />
          <p>Sign in to ask Mentor with live simulation context.</p>
          <Link to="/login" className="sim2-mentor-link">
            Sign in
          </Link>
        </div>
      </aside>
    );
  }

  return (
    <aside className="sim2-mentor" aria-label="AI Mentor">
      <div className="sim2-mentor-header">
        <div className="sim2-mentor-header-id">
          <Bot size={16} />
          <span>AI Mentor</span>
        </div>
        {headerActions}
      </div>

      <div
        className={`sim2-mentor-context-card ${contextFlash ? "sim2-mentor-context-card--fresh" : ""}`}
        aria-live="polite"
      >
        <p className="sim2-mentor-context">{contextHint}</p>
        {diagnoses.length > 0 && (
          <ul className="sim2-mentor-facts" aria-label="Simulation diagnosis">
            {diagnoses.slice(0, 4).map((item: LabDiagnosis) => (
              <li key={`${item.classification}-${item.topic}`}>
                {item.classification}: {item.topic}. {item.evidence}
              </li>
            ))}
          </ul>
        )}
        {factChips.length > 0 && (
          <div className="sim2-mentor-facts">
            {factChips.map((chip) => (
              <span key={chip} className="sim2-mentor-fact">
                {chip}
              </span>
            ))}
          </div>
        )}
        {simulationRunId && (
          <p className="sim2-mentor-run-id">
            Context run: {simulationRunId.slice(0, 8)}…
            {contextFlash ? " · updated" : ""}
          </p>
        )}
        {!simulationRunId && simResult && (
          <p className="sim2-mentor-run-id sim2-mentor-run-id--warn">
            Run again while signed in to bind Mentor to this result.
          </p>
        )}
      </div>

      <div
        className="sim2-mentor-messages"
        role="log"
        aria-live="polite"
        aria-busy={busy}
        aria-relevant="additions text"
      >
        {messages.length === 0 && streamingText === null && !busy && (
          <div className="sim2-mentor-empty">
            <p>
              Build → Run → Ask. Change the circuit and Run again — Mentor uses the newest
              simulator facts only.
            </p>
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                className="sim2-mentor-suggestion"
                onClick={() => setDraft(s)}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {messages.map((m) => (
          <div
            key={m.id}
            className={`sim2-mentor-bubble ${m.role === "user" ? "sim2-mentor-bubble--user" : "sim2-mentor-bubble--assistant"}`}
          >
            {m.role === "assistant" ? <MarkdownLite content={m.content} /> : m.content}
          </div>
        ))}

        {streamingText !== null && (
          <div
            className="sim2-mentor-bubble sim2-mentor-bubble--assistant sim2-mentor-bubble--streaming"
            aria-label="AI Mentor is streaming a response"
          >
            <MarkdownLite content={streamingText} />
          </div>
        )}
        {busy && streamingText === null && <TypingIndicator />}
      </div>

      {error && (
        <div className="sim2-mentor-error" role="alert">
          <span>{error}</span>
          <button
            type="button"
            className="sim2-mentor-retry"
            onClick={handleRetry}
          >
            Retry
          </button>
        </div>
      )}

      <div className="sim2-mentor-composer">
        <ChatComposer
          value={draft}
          onChange={setDraft}
          onSend={handleSend}
          busy={busy}
        />
      </div>
    </aside>
  );
}

export default WorkspaceMentorPanel;
