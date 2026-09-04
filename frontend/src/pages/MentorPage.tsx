import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Menu, Bot, TriangleAlert, RotateCcw, PanelLeftClose } from "lucide-react";

import ConversationSidebar from "../components/mentor/ConversationSidebar";
import MentorWelcome from "../components/mentor/MentorWelcome";
import ContextPanel from "../components/mentor/ContextPanel";
import ChatMessage from "../components/chat/ChatMessage";
import ChatComposer from "../components/chat/ChatComposer";
import TypingIndicator from "../components/chat/TypingIndicator";
import MarkdownLite from "../components/chat/MarkdownLite";
import Dialog from "../components/ui/Dialog";
import Modal from "../components/ui/Modal";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";

import { useAuth } from "../contexts/AuthContext";
import { getExperimentById } from "../services/experimentService";
import * as mentorService from "../services/mentor/mentorService";

import type { ChatMessage as ChatMessageType, Conversation, ConversationSummary, MessageFeedback } from "../types/chat";
import type { MentorContext } from "../types/mentor";
import { emptyMentorContext, experimentPrompts } from "../types/mentor";
import type { SimulationStatus } from "../types/mentor";
import type { Experiment } from "../types/experiment";

function toSummary(conv: Conversation, messageCount = conv.messages.length): ConversationSummary {
  return {
    id: conv.id,
    title: conv.title,
    experiment_id: conv.experiment_id,
    created_at: conv.created_at,
    updated_at: conv.updated_at,
    message_count: messageCount,
  };
}

/** Keep the newest conversation first in the sidebar. */
function upsertConversation(
  list: ConversationSummary[],
  summary: ConversationSummary,
): ConversationSummary[] {
  const next = [summary, ...list.filter((c) => c.id !== summary.id)];
  return next.sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
  );
}

function MentorPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  /* ── conversation state ── */
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessageType[]>([]);

  /* ── composer / send state ── */
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [streamingText, setStreamingText] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const lastFailedRef = useRef<string | null>(null);

  /* ── dialogs / drawer ── */
  const [deleteTarget, setDeleteTarget] = useState<ConversationSummary | null>(null);
  const [renameTarget, setRenameTarget] = useState<ConversationSummary | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);

  /* ── experiment context (from ?experiment=&stage=&simulation=) ── */
  const experimentParam = searchParams.get("experiment");
  const stageParam = searchParams.get("stage");
  const simulationParam = searchParams.get("simulation");
  const simStatusParam = searchParams.get("sim") as SimulationStatus | null;
  const quizParam = searchParams.get("quiz");
  const [contextExperiment, setContextExperiment] = useState<Experiment | null>(null);

  const cancelSendRef = useRef<(() => void) | null>(null);
  const openRequestRef = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const atBottomRef = useRef(true);

  const userId = user?.id ?? "";
  const userInitials = useMemo(() => {
    if (!user?.name) return "U";
    return user.name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }, [user]);

  const mentorContext: MentorContext = useMemo(
    () =>
      contextExperiment
        ? {
            experimentId: contextExperiment.id,
            experimentTitle: contextExperiment.title,
            difficulty: contextExperiment.difficulty,
            stage: stageParam ? stageParam.replace(/_/g, " ") : null,
            simulationId: simulationParam,
            simulationStatus: simStatusParam ?? "idle",
            circuit: null, // populated from simulation workspace
            measurements: null, // populated from simulation workspace
            quizQuestion: quizParam,
          }
        : {
            ...emptyMentorContext,
            stage: stageParam ? stageParam.replace(/_/g, " ") : null,
            simulationId: simulationParam,
            simulationStatus: simStatusParam ?? "idle",
            quizQuestion: quizParam,
          },
    [contextExperiment, stageParam, simulationParam, simStatusParam, quizParam],
  );

  const activeConversation = conversations.find((c) => c.id === activeId) ?? null;
  const suggestedPrompts = useMemo(
    () => experimentPrompts(contextExperiment?.title ?? null),
    [contextExperiment],
  );

  /* ── load experiment context ── */
  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!experimentParam) {
        if (!cancelled) setContextExperiment(null);
        return;
      }
      try {
        const data = await getExperimentById(experimentParam);
        if (cancelled) return;
        setContextExperiment(data ?? null);
      } catch {
        if (cancelled) return;
        setContextExperiment(null);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [experimentParam]);

  /* ── load conversation list ── */
  async function refreshConversations(): Promise<void> {
    if (!userId) return;
    try {
      const list = await mentorService.getConversations();
      setConversations(list);
    } catch {
      // Keep the current list — a transient failure shouldn't blank the sidebar.
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function init() {
      if (!userId) {
        setListLoading(false);
        return;
      }
      try {
        const list = await mentorService.getConversations();
        if (!cancelled) setConversations(list);
      } catch {
        if (!cancelled) setConversations([]);
      } finally {
        if (!cancelled) setListLoading(false);
      }
    }

    void init();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  /* ── open a conversation ── */
  async function openConversation(id: string) {
    cancelSendRef.current?.();
    cancelSendRef.current = null;
    setBusy(false);
    setStreamingText(null);
    setSendError(null);
    setDraft("");
    setMessages([]);
    setActiveId(id);
    setDrawerOpen(false);
    atBottomRef.current = true;

    if (!userId) return;
    const request = ++openRequestRef.current;
    try {
      const conv = await mentorService.getConversation(id);
      // Ignore stale loads when the user switched conversations meanwhile.
      if (openRequestRef.current === request) {
        setMessages(conv?.messages ?? []);
      }
    } catch {
      if (openRequestRef.current === request) {
        setSendError("Unable to load this conversation. Please try again.");
      }
    }
  }

  /* ── new chat ── */
  function handleNewChat() {
    cancelSendRef.current?.();
    cancelSendRef.current = null;
    setBusy(false);
    setStreamingText(null);
    setSendError(null);
    setDraft("");
    setMessages([]);
    setActiveId(null);
    setDrawerOpen(false);
    // Sync sidebar immediately so the chat you just left is visible.
    void refreshConversations();
    // Keep the experiment context param only when present.
    if (!experimentParam) setSearchParams({}, { replace: true });
  }

  /* ── send ── */
  function performSend(text: string, conversationId: string) {
    if (!userId) return;
    setBusy(true);
    setSendError(null);
    setStreamingText(null);

    const cancel = mentorService.sendMessage(
      conversationId,
      text,
      {
        experimentId: mentorContext.experimentId,
        simulationId: mentorContext.simulationId,
        stage: mentorContext.stage,
      },
      {
        onUserMessage: (message) => {
          setMessages((prev) => [...prev, message]);
          // Bump sidebar entry as soon as the user turn lands.
          setConversations((prev) =>
            prev.map((c) =>
              c.id === conversationId
                ? {
                    ...c,
                    message_count: Math.max(c.message_count, 0) + 1,
                    updated_at: message.created_at,
                  }
                : c,
            ),
          );
        },
        onToken: (accumulated) => {
          setStreamingText(accumulated);
        },
        onComplete: (message) => {
          setStreamingText(null);
          setBusy(false);
          setMessages((prev) => [...prev, message]);
          void refreshConversations();
        },
        onError: (error) => {
          setStreamingText(null);
          setBusy(false);
          setSendError(error.message || "AI Mentor could not generate a response. Please try again.");
          lastFailedRef.current = text;
        },
      },
    );

    cancelSendRef.current = cancel;
  }

  async function handleSend() {
    const text = draft.trim();
    if (!text || busy || !userId) return;

    let conversationId = activeId;
    if (!conversationId) {
      setBusy(true);
      try {
        const conv = await mentorService.createConversation(mentorContext.experimentId);
        conversationId = conv.id;
        setActiveId(conv.id);
        // Show the new conversation in history immediately (don't wait for leave/remount).
        setConversations((prev) => upsertConversation(prev, toSummary(conv)));
        void refreshConversations();
      } catch {
        setBusy(false);
        setSendError("Unable to start a new conversation. Please try again.");
        return;
      }
    }

    setDraft("");
    lastFailedRef.current = null;
    performSend(text, conversationId);
  }

  function handleRetry() {
    const text = lastFailedRef.current;
    if (!text || !activeId) return;
    lastFailedRef.current = null;
    setSendError(null);
    performSend(text, activeId);
  }

  /* ── message actions ── */
  function handleRegenerate() {
    if (!activeId || busy || !userId) return;
    setBusy(true);
    setSendError(null);
    setStreamingText(null);

    // Remove trailing assistant message locally while regenerating
    // (server history is append-only; the fresh reply is appended).
    setMessages((prev) => {
      const last = prev[prev.length - 1];
      return last?.role === "assistant" ? prev.slice(0, -1) : prev;
    });

    const cancel = mentorService.regenerateMessage(
      activeId,
      {
        experimentId: mentorContext.experimentId,
        simulationId: mentorContext.simulationId,
        stage: mentorContext.stage,
      },
      {
        onToken: (accumulated) => setStreamingText(accumulated),
        onComplete: (message) => {
          setStreamingText(null);
          setBusy(false);
          setMessages((prev) => [...prev, message]);
          void refreshConversations();
        },
        onError: (error) => {
          setStreamingText(null);
          setBusy(false);
          setSendError(error.message || "AI Mentor could not generate a response. Please try again.");
        },
      },
    );
    cancelSendRef.current = cancel;
  }

  async function handleFeedback(messageId: string, feedback: MessageFeedback) {
    if (!activeId || !userId) return;
    const current = messages.find((m) => m.id === messageId)?.feedback ?? null;
    const next = current === feedback ? null : feedback;
    try {
      const updated = await mentorService.setMessageFeedback(activeId, messageId, next);
      if (updated) {
        setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, feedback: updated.feedback } : m)));
      }
    } catch {
      // Transient failure — keep the current selection.
    }
  }

  function handleExplainDifferently() {
    setDraft("Can you explain that differently, with a simpler example?");
  }

  /* ── delete / rename ── */
  async function confirmDelete() {
    if (!deleteTarget || !userId) return;
    try {
      await mentorService.deleteConversation(deleteTarget.id);
      if (activeId === deleteTarget.id) {
        setActiveId(null);
        setMessages([]);
      }
    } catch {
      // Keep the list unchanged when the delete request fails.
    } finally {
      setDeleteTarget(null);
    }
    void refreshConversations();
  }

  async function confirmRename() {
    if (!renameTarget || !userId || !renameValue.trim()) {
      setRenameTarget(null);
      return;
    }
    try {
      await mentorService.renameConversation(renameTarget.id, renameValue.trim());
    } catch {
      // Keep the old title when the rename request fails.
    } finally {
      setRenameTarget(null);
    }
    void refreshConversations();
  }

  /* ── scroll behavior ── */
  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    atBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  }

  useEffect(() => {
    const el = scrollRef.current;
    if (el && atBottomRef.current) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, streamingText]);

  /* ── guards ── */
  if (!user) {
    return (
      <main className="page-container">
        <div className="mentor-offline" role="alert">
          <TriangleAlert size={18} />
          <p>AI Mentor is unavailable. Please sign in again.</p>
        </div>
      </main>
    );
  }

  const showWelcome = !activeId && messages.length === 0;
  const lastMessage = messages[messages.length - 1];
  const canRegenerate = !busy && lastMessage?.role === "assistant";

  return (
    <div className="mentor-page">
      <ConversationSidebar
        conversations={conversations}
        activeId={activeId}
        onSelect={openConversation}
        onNewChat={handleNewChat}
        onRenameRequest={(id) => {
          const target = conversations.find((c) => c.id === id);
          if (target) {
            setRenameTarget(target);
            setRenameValue(target.title);
          }
        }}
        onDeleteRequest={(id) => {
          const target = conversations.find((c) => c.id === id);
          if (target) setDeleteTarget(target);
        }}
        loading={listLoading}
        drawerOpen={drawerOpen}
        onDrawerClose={() => setDrawerOpen(false)}
      />

      <div className="mentor-main">
        {/* Header */}
        <header className="mentor-header">
          <button
            type="button"
            className="mentor-menu-btn"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open conversations"
          >
            <Menu size={18} />
          </button>

          <div className="mentor-header-id">
            <span className="mentor-header-bot" aria-hidden="true">
              <Bot size={16} />
            </span>
            <div className="mentor-header-text">
              <span className="mentor-header-title">
                {activeConversation?.title ?? "AI Mentor"}
              </span>
              <span className="mentor-header-sub">
                {mentorContext.experimentTitle
                  ? `Context: ${mentorContext.experimentTitle}`
                  : "Engineering assistant"}
              </span>
            </div>
          </div>

          <div className="mentor-header-right">
            {activeId && (
              <button
                type="button"
                className="mentor-header-action"
                onClick={handleNewChat}
                aria-label="Start a new chat"
              >
                <PanelLeftClose size={15} />
                <span className="mentor-header-action-label">New chat</span>
              </button>
            )}
          </div>
        </header>

        {/* Context panel (experiment aware) */}
        <ContextPanel context={mentorContext} objective={contextExperiment?.objective ?? null} />

        {/* Messages */}
        <div
          className="mentor-chat-scroll"
          ref={scrollRef}
          onScroll={handleScroll}
          role="log"
          aria-label="Conversation messages"
          aria-live="polite"
        >
          {showWelcome && (
            <MentorWelcome
              context={mentorContext}
              experimentTitle={mentorContext.experimentTitle}
              suggestedPrompts={suggestedPrompts}
              onPromptSelect={(prompt) => setDraft(prompt)}
              onTopicSelect={(topic) => setDraft(`Help me understand ${topic}.`)}
            />
          )}

          {!showWelcome && (
            <div className="mentor-messages">
              {messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  userInitials={userInitials}
                  canRegenerate={canRegenerate && message.id === lastMessage?.id}
                  onRegenerate={handleRegenerate}
                  onFeedback={(f) => handleFeedback(message.id, f)}
                  onExplainDifferently={handleExplainDifferently}
                />
              ))}

              {/* Streaming assistant message */}
              {streamingText !== null && (
                <article className="chat-msg chat-msg--assistant" aria-label="AI Mentor is responding">
                  <span className="chat-msg-avatar chat-msg-avatar--mentor" aria-hidden="true">
                    <Bot size={16} />
                  </span>
                  <div className="chat-msg-body">
                    <div className="chat-msg-meta">
                      <span className="chat-msg-sender">AI Mentor</span>
                      <span className="chat-msg-time">Streaming</span>
                    </div>
                    <div className="chat-msg-content chat-msg-content--streaming">
                      <MarkdownLite content={streamingText} />
                      <span className="chat-stream-cursor" aria-hidden="true" />
                    </div>
                  </div>
                </article>
              )}

              {/* Thinking indicator (before first token) */}
              {busy && streamingText === null && <TypingIndicator />}
            </div>
          )}
        </div>

        {/* Send error */}
        {sendError && (
          <div className="mentor-send-error" role="alert">
            <TriangleAlert size={14} />
            <span>{sendError}</span>
            <button type="button" className="mentor-retry" onClick={handleRetry}>
              <RotateCcw size={13} /> Retry
            </button>
          </div>
        )}

        {/* Composer */}
        <div className="mentor-composer-zone">
          {showWelcome && suggestedPrompts.length > 0 && (
            <div className="mentor-composer-prompts" aria-label="Suggested prompts">
              {suggestedPrompts.slice(0, 3).map((p) => (
                <button key={p} type="button" className="mentor-suggestion" onClick={() => setDraft(p)}>
                  {p}
                </button>
              ))}
            </div>
          )}

          <ChatComposer
            value={draft}
            onChange={setDraft}
            onSend={handleSend}
            busy={busy}
          />
        </div>
      </div>

      {/* Delete confirmation */}
      <Dialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete conversation?"
        description={`This will permanently remove “${deleteTarget?.title ?? ""}” and its messages.`}
        confirmLabel="Delete"
        variant="danger"
      />

      {/* Rename */}
      <Modal
        open={renameTarget !== null}
        onClose={() => setRenameTarget(null)}
        title="Rename conversation"
        footer={
          <div className="ui-dialog-actions">
            <Button variant="ghost" onClick={() => setRenameTarget(null)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={confirmRename} disabled={!renameValue.trim()}>
              Save
            </Button>
          </div>
        }
      >
        <Input
          label="Conversation title"
          value={renameValue}
          onChange={(e) => setRenameValue(e.target.value)}
          autoFocus
          maxLength={80}
          onKeyDown={(e) => {
            if (e.key === "Enter" && renameValue.trim()) confirmRename();
          }}
        />
      </Modal>
    </div>
  );
}

export default MentorPage;
