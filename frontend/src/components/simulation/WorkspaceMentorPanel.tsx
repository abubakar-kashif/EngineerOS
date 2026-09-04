/**
 * Compact AI Mentor rail for the simulation lab.
 * Uses the real mentor streaming API; does not invent simulation results.
 */
import { useMemo, useRef, useState } from "react";
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
}

function WorkspaceMentorPanel({
  experimentId,
  experimentTitle,
  simResult,
}: WorkspaceMentorPanelProps) {
  const { user } = useAuth();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [streamingText, setStreamingText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const cancelRef = useRef<(() => void) | null>(null);

  const mentorLink = useMemo(() => {
    const params = new URLSearchParams();
    if (experimentId) params.set("experiment", experimentId);
    params.set("stage", "simulation");
    if (simResult?.status) params.set("sim", simResult.status);
    const qs = params.toString();
    return qs ? `/mentor?${qs}` : "/mentor";
  }, [experimentId, simResult?.status]);

  const contextHint = useMemo(() => {
    if (!simResult) {
      return experimentTitle
        ? `Guidance for ${experimentTitle}. Build freely — the simulator validates.`
        : "Ask how to build, wire, or measure. The simulator stays authoritative.";
    }
    if (simResult.status === "invalid") {
      const code = simResult.validation?.errors?.[0]?.code;
      return code
        ? `Simulator reported ${code}. Ask why it failed.`
        : "Simulator reported an invalid circuit. Ask for an explanation.";
    }
    if (simResult.status === "completed") {
      return "Simulation completed. Ask about the authoritative results.";
    }
    return `Simulation status: ${simResult.status}.`;
  }, [experimentTitle, simResult]);

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
        const conv = await mentorService.createConversation(experimentId);
        activeId = conv.id;
        setConversationId(conv.id);
      } catch {
        setBusy(false);
        setError("Unable to start Mentor conversation.");
        setDraft(text);
        return;
      }
    }

    cancelRef.current?.();
    cancelRef.current = mentorService.sendMessage(
      activeId,
      text,
      {
        experimentId,
        stage: "simulation",
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
          <p>Sign in to ask Mentor about this circuit.</p>
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
      <p className="sim2-mentor-context">{contextHint}</p>

      <div className="sim2-mentor-messages" role="log" aria-live="polite">
        {messages.length === 0 && streamingText === null && !busy && (
          <div className="sim2-mentor-empty">
            <p>Ask about components, wiring, or your latest simulation result.</p>
            <button
              type="button"
              className="sim2-mentor-suggestion"
              onClick={() =>
                setDraft(
                  experimentTitle
                    ? `I want to build the ${experimentTitle} experiment. What components should I use?`
                    : "What components should I place first?",
                )
              }
            >
              What components should I use?
            </button>
            <button
              type="button"
              className="sim2-mentor-suggestion"
              onClick={() => setDraft("Why isn't my circuit working?")}
            >
              Why isn't my circuit working?
            </button>
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
