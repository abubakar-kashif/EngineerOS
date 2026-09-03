/**
 * AI Mentor service boundary.
 *
 * Architecture notes:
 * - Conversations and messages are persisted per user through the backend
 *   Conversations API (docs/API_CONTRACT.md §7); ownership is enforced
 *   server-side via the bearer token, so no user id is passed around.
 * - `sendMessage` is streaming-ready: it accepts an `onToken` callback
 *   so a future provider can stream tokens as they arrive.
 * - No real AI model is connected. Assistant replies come from a
 *   clearly-labeled placeholder responder (`is_simulated: true` in the
 *   message metadata, surfaced as a "Simulated" badge by the UI) and are
 *   persisted like any other message, so history survives devices.
 */

import { ApiError, apiRequest } from "../api";
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

/* ── API shapes (see docs/API_CONTRACT.md §7) ────────── */

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

function toChatMessage(raw: ApiMessage): ChatMessage {
  return {
    id: raw.id,
    conversation_id: raw.conversation_id,
    role: raw.role as ChatMessage["role"],
    content: raw.content,
    created_at: raw.created_at,
    status: "complete",
    feedback: raw.feedback,
    is_simulated: raw.metadata?.is_simulated === true,
  };
}

function isNotFound(error: unknown): boolean {
  return error instanceof ApiError && error.status === 404;
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

/* ── placeholder responder (NOT a real AI model) ─────── */

/**
 * Produces a simulated, clearly-labeled mentor reply.
 * Keyword-based canned content that exercises the markdown renderer.
 * Replaced entirely when the real AI engine is connected.
 */
function buildSimulatedReply(userMessage: string, experimentTitle: string | null): string {
  const q = userMessage.toLowerCase();
  const contextLine = experimentTitle
    ? `You're working on **${experimentTitle}**, so here's a focused answer.`
    : "Here's a focused answer.";

  if (q.includes("series")) {
    return [
      "> **Simulated response** — the AI engine is not connected yet. This placeholder demonstrates the mentor interface.",
      "",
      `${contextLine}`,
      "",
      "### Why current stays the same",
      "",
      "In a **series circuit**, charge has only one path to follow. Since charge is neither created nor destroyed anywhere along that path, the flow rate must be identical at every point.",
      "",
      "- The same current `I` passes through every component",
      "- Supply voltage divides across components: $V = V_1 + V_2 + ... + V_n$",
      "- Total resistance adds up: $R = R_1 + R_2 + ... + R_n$",
      "",
      "### Worked example",
      "",
      "| Quantity | Value |",
      "| --- | --- |",
      "| Source voltage | 12 V |",
      "| R1 | 4 Ω |",
      "| R2 | 2 Ω |",
      "| Total R | 6 Ω |",
      "| Current (everywhere) | $I = 12/6 = 2$ A |",
      "",
      "Measure the current at **any** point — the ammeter reads the same 2 A.",
    ].join("\n");
  }

  if (q.includes("parallel")) {
    return [
      "> **Simulated response** — the AI engine is not connected yet. This placeholder demonstrates the mentor interface.",
      "",
      `${contextLine}`,
      "",
      "### Parallel circuits",
      "",
      "In a **parallel circuit**, components share the same two nodes, so each branch sees the **full source voltage**.",
      "",
      "1. Voltage is equal across all branches: $V = V_1 = V_2$",
      "2. Current divides between branches: $I = I_1 + I_2$",
      "3. Total resistance **reduces**: $1/R = 1/R_1 + 1/R_2$",
      "",
      "Two 6 Ω resistors in parallel behave like a single **3 Ω** resistor — less resistance means more total current drawn from the source.",
    ].join("\n");
  }

  if (q.includes("ohm") || q.includes("v = ir") || q.includes("vir") || q.includes("equation")) {
    return [
      "> **Simulated response** — the AI engine is not connected yet. This placeholder demonstrates the mentor interface.",
      "",
      `${contextLine}`,
      "",
      "### Ohm's Law",
      "",
      "$V = I \\times R$",
      "",
      "| Symbol | Meaning | Unit |",
      "| --- | --- | --- |",
      "| V | Voltage | volts (V) |",
      "| I | Current | amperes (A) |",
      "| R | Resistance | ohms (Ω) |",
      "",
      "Rearranged for each unknown:",
      "",
      "- Current: $I = V / R$",
      "- Resistance: $R = V / I$",
      "",
      "```text",
      "Example: 5 V across 1 kΩ",
      "I = V / R = 5 / 1000 = 0.005 A = 5 mA",
      "```",
      "",
      "Power comes along for free: $P = V \\times I$.",
    ].join("\n");
  }

  if (q.includes("measure")) {
    return [
      "> **Simulated response** — the AI engine is not connected yet. This placeholder demonstrates the mentor interface.",
      "",
      `${contextLine}`,
      "",
      "### Suggested measurement order",
      "",
      "1. **Set the source voltage** first and record it",
      "2. **Measure current** with the ammeter in series",
      "3. **Measure voltage** across each component with the voltmeter in parallel",
      "4. **Compare** measured values against $V = I \\times R$",
      "",
      "Small differences (a few percent) are normal — component tolerance and meter accuracy account for them.",
    ].join("\n");
  }

  if (q.includes("resistance") || q.includes("increase")) {
    return [
      "> **Simulated response** — the AI engine is not connected yet. This placeholder demonstrates the mentor interface.",
      "",
      `${contextLine}`,
      "",
      "### What happens when resistance increases",
      "",
      "From $I = V / R$, with voltage held constant:",
      "",
      "- **Current decreases** — opposition to flow grows",
      "- **Power dissipated changes**: $P = V^2 / R$, so the resistor dissipates *less* power",
      "",
      "In a real lab this is why a higher-value resistor stays cooler at the same supply voltage.",
    ].join("\n");
  }

  return [
    "> **Simulated response** — the AI engine is not connected yet. This placeholder demonstrates the mentor interface.",
    "",
    `${contextLine}`,
    "",
    "I don't have a real model behind me yet, so here is the general approach to questions like yours:",
    "",
    "1. Identify the **known quantities** (voltage, current, resistance)",
    "2. Choose the governing relationship, e.g. $V = I \\times R$",
    "3. Rearrange for the unknown",
    "4. Check units and sanity-check the magnitude",
    "",
    "When the AI engine is connected, this response will be generated from the real model with your experiment context.",
  ].join("\n");
}

/* ── send pipeline (streaming-ready) ────────────────── */

const TOKEN_CHUNK_SIZE = 3; // characters per simulated token
const TOKEN_INTERVAL_MS = 12;

async function persistMessage(
  conversationId: string,
  role: "user" | "assistant",
  content: string,
  metadata?: Record<string, unknown>,
): Promise<ChatMessage> {
  const raw = await apiRequest<ApiMessage>(
    `/conversations/${encodeURIComponent(conversationId)}/messages`,
    {
      method: "POST",
      body: JSON.stringify({ role, content, metadata: metadata ?? null }),
    },
  );
  return toChatMessage(raw);
}

/**
 * Sends a user message and produces the assistant reply.
 *
 * The flow mirrors a streaming AI provider:
 *   user message persisted → tokens arrive → reply grows → reply persisted.
 *
 * Returns a cancel function so the UI can abort an in-flight send
 * (e.g. when switching conversations). Cancelling stops the simulated
 * stream before the assistant message is persisted.
 */
export function sendMessage(
  conversationId: string,
  content: string,
  experimentTitle: string | null,
  handlers: SendMessageHandlers = {},
): () => void {
  let cancelled = false;
  let timer: ReturnType<typeof setInterval> | undefined;

  void (async () => {
    try {
      // Fetch the current detail so the first user message can name the
      // conversation (title derivation stays client-side).
      const detail = await apiRequest<ApiConversationDetail>(
        `/conversations/${encodeURIComponent(conversationId)}`,
      );
      if (cancelled) return;

      const userMessage = await persistMessage(conversationId, "user", content);
      if (cancelled) return;
      handlers.onUserMessage?.(userMessage);

      const isFirstUserMessage = !detail.messages.some((m) => m.role === "user");
      if (isFirstUserMessage && detail.title === DEFAULT_TITLE) {
        try {
          await renameConversation(conversationId, deriveTitleFromMessage(content));
        } catch {
          // A failed auto-rename never blocks the reply.
        }
      }
    } catch {
      if (!cancelled) {
        handlers.onError?.(new Error("Unable to send message."));
      }
      return;
    }

    // Simulated streaming reply.
    const fullText = buildSimulatedReply(content, experimentTitle);
    let index = 0;

    timer = setInterval(() => {
      if (cancelled) return;
      index = Math.min(index + TOKEN_CHUNK_SIZE, fullText.length);
      handlers.onToken?.(fullText.slice(0, index));

      if (index >= fullText.length) {
        clearInterval(timer);
        void (async () => {
          try {
            const assistantMessage = await persistMessage(conversationId, "assistant", fullText, {
              is_simulated: true,
            });
            if (!cancelled) handlers.onComplete?.(assistantMessage);
          } catch {
            if (!cancelled) handlers.onError?.(new Error("Unable to save the reply."));
          }
        })();
      }
    }, TOKEN_INTERVAL_MS);
  })();

  return () => {
    cancelled = true;
    if (timer !== undefined) clearInterval(timer);
  };
}

/**
 * Regenerates a reply for the last user message.
 * History is append-only server-side, so this re-asks the question and
 * appends a fresh (simulated) assistant reply.
 */
export function regenerateMessage(
  conversationId: string,
  experimentTitle: string | null,
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

      cancelSend = sendMessage(conversationId, lastUser.content, experimentTitle, handlers);
    } catch {
      if (!cancelled) handlers.onError?.(new Error("Unable to regenerate the response."));
    }
  })();

  return () => {
    cancelled = true;
    cancelSend?.();
  };
}
