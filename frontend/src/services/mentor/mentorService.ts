/**
 * AI Mentor service boundary.
 *
 * Conversations are persisted through the Conversations API; ownership is
 * enforced server-side via the bearer token (no client-supplied user_id).
 *
 * Generation uses the real Mentor endpoints:
 *   POST /conversations/{id}/ask
 *   POST /conversations/{id}/ask/stream
 *
 * Streaming is provider-backed SSE from the backend — never simulated with
 * setInterval/setTimeout chunk timers.
 */

import { ApiError, apiRequest, apiStream } from "../api";
import type {
  ChatMessage,
  Conversation,
  ConversationGroup,
  ConversationSummary,
  GroupedConversations,
  MessageFeedback,
  SendMessageHandlers,
} from "../../types/chat";
import { deriveTitleFromMessage } from "../../types/mentor";

const DEFAULT_TITLE = "New conversation";
const MENTOR_USER_ERROR =
  "AI Mentor could not generate a response. Please try again.";

/* ── API shapes ─────────────────────────────────────── */

interface ApiMessage {
  id: string;
  conversation_id: string;
  role: string;
  content: string;
  feedback: MessageFeedback;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

interface ApiConversationDetail {
  id: string;
  title: string;
  experiment_id: string | null;
  created_at: string;
  updated_at: string;
  messages: ApiMessage[];
}

interface ApiConversationSummary {
  id: string;
  title: string;
  experiment_id: string | null;
  created_at: string;
  updated_at: string;
  message_count: number;
}

/** Optional context IDs forwarded to the Mentor ask endpoints. */
export interface MentorAskContext {
  experimentId?: string | null;
  simulationId?: string | null;
  quizId?: string | null;
  reportId?: string | null;
  stage?: string | null;
  /**
   * When false, skip the optimistic onUserMessage callback
   * (used by regenerate — the user turn already exists in the UI).
   */
  emitUserMessage?: boolean;
}

interface StreamEventPayload {
  type: string;
  content?: string | null;
  metadata?: Record<string, unknown> | null;
  error?: string | null;
  error_type?: string | null;
  message_id?: string | null;
  conversation_id?: string | null;
}

function toChatMessage(raw: ApiMessage): ChatMessage {
  return {
    id: raw.id,
    conversation_id: raw.conversation_id,
    role: raw.role as ChatMessage["role"],
    content: raw.content,
    created_at: raw.created_at,
    status: "complete",
    feedback: raw.feedback,
    // Historical placeholder replies only — production never sets this.
    is_simulated: raw.metadata?.is_simulated === true,
  };
}

function isNotFound(error: unknown): boolean {
  return error instanceof ApiError && error.status === 404;
}

function looksUnsafeDetail(message: string): boolean {
  return /traceback|sqlalchemy|providererror|exception at|api[_-]?key|sk-[a-z0-9]|stack trace/i.test(
    message,
  );
}

/** Map transport/API failures to short user-facing errors (no internals). */
export function toMentorUserError(error: unknown): Error {
  if (error instanceof ApiError) {
    if (error.status === 401) {
      return new Error("Please sign in again to use AI Mentor.");
    }
    if (error.status === 403) {
      return new Error("You do not have access to this conversation.");
    }
    if (error.status === 404) {
      return new Error("Conversation not found. Please start a new chat.");
    }
    if (error.status === 429) {
      return new Error("Too many requests. Please wait a moment and try again.");
    }
    if (error.status === 504 || /timed?\s*out/i.test(error.message)) {
      return new Error("AI Mentor timed out. Please try again.");
    }
    const detail = (error.message || "").trim();
    if (detail && detail.length < 160 && !detail.includes("\n") && !looksUnsafeDetail(detail)) {
      // Prefer known safe backend messages (e.g. "AI provider authentication failed").
      if (/ai mentor|provider|timed|rate|unavailable|authentication|conversation/i.test(detail)) {
        return new Error(detail);
      }
    }
  }
  return new Error(MENTOR_USER_ERROR);
}

function askBody(content: string, context: MentorAskContext = {}) {
  return {
    content,
    experiment_id: context.experimentId ?? null,
    simulation_id: context.simulationId ?? null,
    quiz_id: context.quizId ?? null,
    report_id: context.reportId ?? null,
    stage: context.stage ?? null,
  };
}

/* ── conversations ───────────────────────────────────── */

export async function createConversation(
  experimentId: string | null = null,
): Promise<Conversation> {
  const raw = await apiRequest<ApiConversationDetail>("/conversations", {
    method: "POST",
    body: JSON.stringify({ experiment_id: experimentId }),
  });
  return { ...raw, messages: raw.messages.map(toChatMessage) };
}

export async function getConversations(): Promise<ConversationSummary[]> {
  return apiRequest<ApiConversationSummary[]>("/conversations");
}

/** Full conversation with messages; null when it does not exist. */
export async function getConversation(
  conversationId: string,
): Promise<Conversation | null> {
  try {
    const raw = await apiRequest<ApiConversationDetail>(
      `/conversations/${encodeURIComponent(conversationId)}`,
    );
    return { ...raw, messages: raw.messages.map(toChatMessage) };
  } catch (error) {
    if (isNotFound(error)) return null;
    throw error;
  }
}

export async function deleteConversation(conversationId: string): Promise<boolean> {
  try {
    await apiRequest<void>(
      `/conversations/${encodeURIComponent(conversationId)}`,
      { method: "DELETE" },
    );
    return true;
  } catch (error) {
    if (isNotFound(error)) return false;
    throw error;
  }
}

/** Renames a conversation; null when it does not exist. */
export async function renameConversation(
  conversationId: string,
  title: string,
): Promise<ConversationSummary | null> {
  try {
    return await apiRequest<ApiConversationSummary>(
      `/conversations/${encodeURIComponent(conversationId)}`,
      { method: "PATCH", body: JSON.stringify({ title }) },
    );
  } catch (error) {
    if (isNotFound(error)) return null;
    throw error;
  }
}

/** Sets absolute feedback on a message (the caller computes toggles). */
export async function setMessageFeedback(
  conversationId: string,
  messageId: string,
  feedback: MessageFeedback,
): Promise<ChatMessage | null> {
  try {
    const raw = await apiRequest<ApiMessage>(
      `/conversations/${encodeURIComponent(conversationId)}/messages/${encodeURIComponent(messageId)}`,
      { method: "PATCH", body: JSON.stringify({ feedback }) },
    );
    return toChatMessage(raw);
  } catch (error) {
    if (isNotFound(error)) return null;
    throw error;
  }
}

/* ── grouping (sidebar) ──────────────────────────────── */

export function groupConversations(summaries: ConversationSummary[]): GroupedConversations[] {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;
  const weekAgo = startOfToday - 7 * 24 * 60 * 60 * 1000;

  const groupOrder: ConversationGroup[] = ["Today", "Yesterday", "Previous 7 Days", "Older"];
  const groups: Record<ConversationGroup, ConversationSummary[]> = {
    Today: [],
    Yesterday: [],
    "Previous 7 Days": [],
    Older: [],
  };

  for (const s of summaries) {
    const t = new Date(s.updated_at).getTime();
    if (t >= startOfToday) groups.Today.push(s);
    else if (t >= startOfYesterday) groups.Yesterday.push(s);
    else if (t >= weekAgo) groups["Previous 7 Days"].push(s);
    else groups.Older.push(s);
  }

  return groupOrder
    .filter((g) => groups[g].length > 0)
    .map((g) => ({ group: g, conversations: groups[g] }));
}

/* ── SSE parsing ─────────────────────────────────────── */

function parseSseChunk(
  buffer: string,
  onEvent: (event: StreamEventPayload) => void,
): string {
  const parts = buffer.split("\n\n");
  const remainder = parts.pop() ?? "";

  for (const part of parts) {
    const dataLines = part
      .split("\n")
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice(5).trimStart());
    if (dataLines.length === 0) continue;
    const raw = dataLines.join("\n");
    if (!raw || raw === "[DONE]") continue;
    try {
      onEvent(JSON.parse(raw) as StreamEventPayload);
    } catch {
      // Ignore malformed SSE payloads — never invent a successful answer.
    }
  }

  return remainder;
}

async function maybeAutoRename(conversationId: string, content: string): Promise<void> {
  try {
    const detail = await apiRequest<ApiConversationDetail>(
      `/conversations/${encodeURIComponent(conversationId)}`,
    );
    const isFirstUserMessage = !detail.messages.some((m) => m.role === "user");
    if (isFirstUserMessage && detail.title === DEFAULT_TITLE) {
      await renameConversation(conversationId, deriveTitleFromMessage(content));
    }
  } catch {
    // Auto-rename must never block the real ask.
  }
}

/**
 * Sends a user message through the real Mentor stream endpoint.
 *
 * Flow: optional auto-rename → POST ask/stream → SSE deltas → complete.
 * Backend persists the user + assistant messages; the client does not
 * fabricate replies or use timer-based fake streaming.
 *
 * Returns a cancel function that aborts the in-flight request.
 */
export function sendMessage(
  conversationId: string,
  content: string,
  context: MentorAskContext = {},
  handlers: SendMessageHandlers = {},
): () => void {
  const abortController = new AbortController();
  let cancelled = false;

  void (async () => {
    try {
      await maybeAutoRename(conversationId, content);
      if (cancelled) return;

      // Optimistic user bubble — server persists the authoritative copy.
      if (context.emitUserMessage !== false) {
        handlers.onUserMessage?.({
          id: `local-user-${Date.now()}`,
          conversation_id: conversationId,
          role: "user",
          content,
          created_at: new Date().toISOString(),
          status: "complete",
          feedback: null,
        });
      }

      const response = await apiStream(
        `/conversations/${encodeURIComponent(conversationId)}/ask/stream`,
        {
          method: "POST",
          body: JSON.stringify(askBody(content, context)),
        },
        { signal: abortController.signal, timeoutMs: 90_000 },
      );

      if (cancelled) return;

      if (!response.body) {
        throw new ApiError(0, MENTOR_USER_ERROR);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let accumulated = "";
      let completed = false;
      let streamError: string | null = null;
      let finalMessageId: string | null = null;
      let finalConversationId: string | null = conversationId;

      const handleEvent = (event: StreamEventPayload) => {
        const type = (event.type || "").toLowerCase();

        if (type === "delta" && event.content) {
          accumulated += event.content;
          handlers.onToken?.(accumulated);
          return;
        }

        if (type === "complete") {
          completed = true;
          if (event.content) accumulated = event.content;
          finalMessageId = event.message_id ?? finalMessageId;
          finalConversationId = event.conversation_id ?? finalConversationId;
          return;
        }

        if (type === "error") {
          streamError = event.error || MENTOR_USER_ERROR;
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (cancelled) {
          await reader.cancel().catch(() => undefined);
          return;
        }
        buffer += decoder.decode(value, { stream: true });
        buffer = parseSseChunk(buffer, handleEvent);
      }

      // Flush trailing decoder + any final SSE frame without blank line.
      buffer += decoder.decode();
      if (buffer.trim()) {
        buffer = parseSseChunk(`${buffer}\n\n`, handleEvent);
      }

      if (cancelled) return;

      if (streamError) {
        handlers.onError?.(
          toMentorUserError(new ApiError(502, streamError)),
        );
        return;
      }

      if (!completed || !accumulated.trim()) {
        handlers.onError?.(new Error(MENTOR_USER_ERROR));
        return;
      }

      handlers.onComplete?.({
        id: finalMessageId ?? `assistant-${Date.now()}`,
        conversation_id: finalConversationId ?? conversationId,
        role: "assistant",
        content: accumulated,
        created_at: new Date().toISOString(),
        status: "complete",
        feedback: null,
        is_simulated: false,
      });
    } catch (error) {
      if (cancelled || (error instanceof DOMException && error.name === "AbortError")) {
        return;
      }
      if (!cancelled) {
        handlers.onError?.(toMentorUserError(error));
      }
    }
  })();

  return () => {
    cancelled = true;
    abortController.abort();
  };
}

/**
 * Regenerates a reply for the last user message via a real Mentor request.
 * Append-only: does not invent local answers.
 */
export function regenerateMessage(
  conversationId: string,
  context: MentorAskContext = {},
  handlers: SendMessageHandlers = {},
): () => void {
  let cancelled = false;
  let cancelSend: (() => void) | null = null;

  void (async () => {
    try {
      const detail = await apiRequest<ApiConversationDetail>(
        `/conversations/${encodeURIComponent(conversationId)}`,
      );
      if (cancelled) return;

      const lastUser = [...detail.messages].reverse().find((m) => m.role === "user");
      if (!lastUser) {
        handlers.onError?.(new Error("Nothing to regenerate."));
        return;
      }

      // Do not re-emit onUserMessage — the question is already in the thread.
      cancelSend = sendMessage(
        conversationId,
        lastUser.content,
        { ...context, emitUserMessage: false },
        {
          onToken: handlers.onToken,
          onComplete: handlers.onComplete,
          onError: handlers.onError,
        },
      );
    } catch (error) {
      if (!cancelled) {
        handlers.onError?.(toMentorUserError(error));
      }
    }
  })();

  return () => {
    cancelled = true;
    cancelSend?.();
  };
}
