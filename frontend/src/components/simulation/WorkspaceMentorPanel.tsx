/**
 * Compact AI Mentor rail for the simulation lab closed loop.
 * Always sends the latest simulation_run_id; never invents circuit state.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Bot, ExternalLink, TriangleAlert } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import * as mentorService from "../../services/mentor/mentorService";
import ChatComposer from "../chat/ChatComposer";
import MarkdownLite from "../chat/MarkdownLite";
import TypingIndicator from "../chat/TypingIndicator";
import type { ChatMessage } from "../../types/chat";
import type { SimulationResult } from "./engine";

interface WorkspaceMentorPanelProps {
  experimentId: string | null;
  experimentTitle: string | null;
  simResult: SimulationResult | null;
  /** Fresh SimulationRun id after each solve — authoritative Mentor context. */
  simulationRunId?: string | null;
}

function formatCurrent(a: number): string {
  if (Math.abs(a) < 1) return `${(a * 1000).toFixed(2)} mA`;
  return `${a.toFixed(4)} A`;
}

function WorkspaceMentorPanel({
  experimentId,
  experimentTitle,
  simResult,
  simulationRunId = null,
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
  // Always read latest IDs at send-time (avoid stale closures mid-stream)
  const runIdRef = useRef(simulationRunId);
  const experimentIdRef = useRef(experimentId);
  const simResultRef = useRef(simResult);

  useEffect(() => {
    runIdRef.current = simulationRunId;
  }, [simulationRunId]);
  useEffect(() => {
    experimentIdRef.current = experimentId;
  }, [experimentId]);
  useEffect(() => {
    simResultRef.current = simResult;
  }, [simResult]);

  // Flash when a new authoritative run arrives (closed-loop freshness)
  useEffect(() => {
    if (!simulationRunId && !simResult) return;
    setContextFlash(true);
    const t = window.setTimeout(() => setContextFlash(false), 2200);
    return () => window.clearTimeout(t);
  }, [simulationRunId, simResult?.status, simResult?.measurements?.totalCurrent]);

  const mentorLink = useMemo(() => {
    const params = new URLSearchParams();
    if (experimentId) params.set("experiment", experimentId);
    params.set("stage", "simulation");
    if (simResult?.status) params.set("sim", simResult.status);
    if (simulationRunId) params.set("simulation", simulationRunId);
    const qs = params.toString();
    return qs ? `/mentor?${qs}` : "/mentor";
  }, [experimentId, simResult?.status, simulationRunId]);

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
    chips.push(`I ${formatCurrent(m.totalCurrent)}`);
    for (const c of m.componentMeasurements) {
      if (c.componentId.startsWith("__")) continue;
      if (["resistor", "diode", "led"].includes(c.type) || c.type === "resistor") {
        chips.push(`${c.componentId} ${c.voltage.toFixed(2)} V`);
      }
    }
    return chips.slice(0, 6);
  }, [simResult]);

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
          ? `I want to build the ${experimentTitle} experiment. What components should I use?`
          : "I want to build a KVL loop. What components do I need?",
        "What should I look for after I run the simulation?",
      ];
    }
    if (simResult.status === "invalid") {
      return ["What did I do wrong?", "What should I change before I run again?"];
    }
    if (simResult.status === "completed") {
      return [
        "Why are these measurement values what they are?",
        "If I change a resistor and rerun, what should I expect conceptually?",
      ];
    }
    return ["Explain the latest simulation result."];
  }, [simResult, experimentTitle, experimentId]);

  async function handleSend() {
    const text = draft.trim();
    if (!text || busy || !user) return;

    setError(null);
    setBusy(true);
    setStreamingText(null);
    setDraft("");

    let activeId = conversationId;
    if (!activeId) {
      try {
        const conv = await mentorService.createConversation(experimentIdRef.current);
        activeId = conv.id;
        setConversationId(conv.id);
      } catch {
        setBusy(false);
        setError("Unable to start Mentor conversation.");
        setDraft(text);
        return;
      }
    }

    const latestRunId = runIdRef.current;
    if (simResultRef.current && !latestRunId) {
      setError(
        "Simulation finished locally, but Mentor needs a saved run. Sign in and Run again so context stays fresh.",
      );
    }

    cancelRef.current?.();
    cancelRef.current = mentorService.sendMessage(
      activeId,
      text,
      {
        experimentId: experimentIdRef.current,
        stage: "simulation",
        // Prefer SimulationRun id so each rerun replaces Mentor facts
        simulationId: latestRunId,
      },
      {
        onUserMessage: (message) => setMessages((prev) => [...prev, message]),
        onToken: (accumulated) => setStreamingText(accumulated),
        onComplete: (message) => {
          setStreamingText(null);
          setBusy(false);
          setMessages((prev) => [...prev, message]);
        },
        onError: (err) => {
          setStreamingText(null);
          setBusy(false);
          setError(err.message || "AI Mentor could not generate a response. Please try again.");
        },
      },
    );
  }

  if (!user) {
    return (
      <aside className="sim2-mentor" aria-label="AI Mentor">
        <div className="sim2-mentor-header">
          <Bot size={16} />
          <span>AI Mentor</span>
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
        <Link to={mentorLink} className="sim2-mentor-expand" title="Open full Mentor">
          <ExternalLink size={14} />
        </Link>
      </div>

      <div
        className={`sim2-mentor-context-card ${contextFlash ? "sim2-mentor-context-card--fresh" : ""}`}
        aria-live="polite"
      >
        <p className="sim2-mentor-context">{contextHint}</p>
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

      <div className="sim2-mentor-messages" role="log" aria-live="polite">
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
          <div className="sim2-mentor-bubble sim2-mentor-bubble--assistant sim2-mentor-bubble--streaming">
            <MarkdownLite content={streamingText} />
          </div>
        )}
        {busy && streamingText === null && <TypingIndicator />}
      </div>

      {error && (
        <div className="sim2-mentor-error" role="alert">
          {error}
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
