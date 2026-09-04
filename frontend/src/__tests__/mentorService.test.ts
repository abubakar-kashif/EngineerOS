import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createConversation,
  deleteConversation,
  getConversation,
  getConversations,
  groupConversations,
  regenerateMessage,
  renameConversation,
  sendMessage,
  setMessageFeedback,
  toMentorUserError,
} from "../services/mentor/mentorService";
import { ApiError, setAuthToken } from "../services/api";
import { deriveTitleFromMessage } from "../types/mentor";
import { jsonResponse, mockApiRoutes } from "../test/apiMocks";

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

const iso = (daysAgo: number): string =>
  new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();

const summary = (id: string, title: string, daysAgo: number) => ({
  id,
  title,
  experiment_id: null,
  created_at: iso(daysAgo),
  updated_at: iso(daysAgo),
  message_count: 2,
});

const message = (
  id: string,
  conversationId: string,
  role: "user" | "assistant",
  content: string,
  metadata: Record<string, unknown> | null = null,
) => ({
  id,
  conversation_id: conversationId,
  role,
  content,
  feedback: null,
  metadata,
  created_at: iso(0),
});

function sseResponse(events: Record<string, unknown>[]): Response {
  const body = events.map((event) => `data: ${JSON.stringify(event)}\n\n`).join("");
  return new Response(body, {
    status: 200,
    headers: { "Content-Type": "text/event-stream" },
  });
}

describe("conversation loading", () => {
  it("lists the signed-in user's conversations with the bearer token attached", async () => {
    setAuthToken("token-123");
    const calls = mockApiRoutes({
      "GET /conversations": jsonResponse([summary("c1", "Series help", 0), summary("c2", "Old chat", 9)]),
    });

    const conversations = await getConversations();

    expect(conversations).toHaveLength(2);
    expect(conversations[0]).toMatchObject({ id: "c1", title: "Series help", message_count: 2 });
    expect(calls[0].headers.Authorization).toBe("Bearer token-123");
  });

  it("maps conversation detail messages (legacy is_simulated metadata only)", async () => {
    mockApiRoutes({
      "GET /conversations/c1": jsonResponse({
        id: "c1",
        title: "Series help",
        experiment_id: "series-circuit",
        created_at: iso(0),
        updated_at: iso(0),
        messages: [
          message("m1", "c1", "user", "Why is current the same?"),
          message("m2", "c1", "assistant", "Old placeholder…", { is_simulated: true }),
          message("m3", "c1", "assistant", "Real answer"),
        ],
      }),
    });

    const conversation = await getConversation("c1");

    expect(conversation?.title).toBe("Series help");
    expect(conversation?.messages).toHaveLength(3);
    expect(conversation?.messages[0]).toMatchObject({ role: "user", status: "complete" });
    expect(conversation?.messages[1].is_simulated).toBe(true);
    expect(conversation?.messages[2].is_simulated).toBe(false);
  });

  it("returns null for a conversation owned by someone else (404, no enumeration)", async () => {
    setAuthToken("token-123");
    mockApiRoutes({
      "GET /conversations/not-mine": jsonResponse({ detail: "Conversation not found" }, 404),
    });

    await expect(getConversation("not-mine")).resolves.toBeNull();
  });

  it("creates a conversation through the API", async () => {
    const calls = mockApiRoutes({
      "POST /conversations": jsonResponse({
        id: "c9",
        title: "New conversation",
        experiment_id: "ohms-law",
        created_at: iso(0),
        updated_at: iso(0),
        messages: [],
      }),
    });

    const conversation = await createConversation("ohms-law");

    expect(conversation.experiment_id).toBe("ohms-law");
    expect(conversation.messages).toEqual([]);
    expect(calls[0].body).toEqual({ experiment_id: "ohms-law" });
  });

  it("reports delete/rename/feedback outcomes, mapping 404 to a null/false result", async () => {
    setAuthToken("token-123");
    mockApiRoutes({
      "DELETE /conversations/c1": new Response(null, { status: 204 }),
      "DELETE /conversations/c2": jsonResponse({ detail: "Conversation not found" }, 404),
      "PATCH /conversations/c1": jsonResponse(summary("c1", "Renamed", 0)),
      "PATCH /conversations/c1/messages/m1": jsonResponse({
        ...message("m1", "c1", "assistant", "Answer", null),
        feedback: "helpful",
      }),
    });

    await expect(deleteConversation("c1")).resolves.toBe(true);
    await expect(deleteConversation("c2")).resolves.toBe(false);

    const renamed = await renameConversation("c1", "Renamed");
    expect(renamed?.title).toBe("Renamed");

    const feedback = await setMessageFeedback("c1", "m1", "helpful");
    expect(feedback?.feedback).toBe("helpful");
  });

  it("groups conversations by recency for the sidebar", () => {
    const groups = groupConversations([
      summary("today", "Today chat", 0),
      summary("yesterday", "Yesterday chat", 1),
      summary("this-week", "This week chat", 3),
      summary("old", "Old chat", 30),
    ]);

    expect(groups.map((g) => g.group)).toEqual([
      "Today",
      "Yesterday",
      "Previous 7 Days",
      "Older",
    ]);
    expect(groups[0].conversations[0].id).toBe("today");
    expect(groups[3].conversations[0].id).toBe("old");
  });
});

describe("sendMessage real Mentor stream", () => {
  it("auto-titles, streams real SSE deltas, and completes without simulating tokens", async () => {
    setAuthToken("token-123");
    const calls = mockApiRoutes({
      "GET /conversations/c1": () =>
        jsonResponse({
          id: "c1",
          title: "New conversation",
          experiment_id: null,
          created_at: iso(0),
          updated_at: iso(0),
          messages: [],
        }),
      "PATCH /conversations/c1": () => jsonResponse(summary("c1", "Renamed", 0)),
      "POST /conversations/c1/ask/stream": () =>
        sseResponse([
          { type: "start", content: "", metadata: { model: "gpt-3.5-turbo" } },
          { type: "delta", content: "Ohm" },
          { type: "delta", content: "'s Law" },
          {
            type: "complete",
            content: "Ohm's Law",
            message_id: "a1",
            conversation_id: "c1",
          },
        ]),
    });

    const tokens: string[] = [];
    const userMessages: string[] = [];
    const completions: { content: string; is_simulated?: boolean; id: string }[] = [];

    await new Promise<void>((resolve, reject) => {
      sendMessage(
        "c1",
        "Explain Ohm's Law in a series circuit context for beginners please",
        { experimentId: "ohms-law" },
        {
          onUserMessage: (m) => userMessages.push(m.content),
          onToken: (accumulated) => tokens.push(accumulated),
          onComplete: (m) => {
            completions.push({ content: m.content, is_simulated: m.is_simulated, id: m.id });
            resolve();
          },
          onError: (error) => reject(error),
        },
      );
    });

    expect(userMessages).toEqual([
      "Explain Ohm's Law in a series circuit context for beginners please",
    ]);
    expect(tokens).toEqual(["Ohm", "Ohm's Law"]);
    expect(completions).toHaveLength(1);
    expect(completions[0]).toMatchObject({
      id: "a1",
      content: "Ohm's Law",
      is_simulated: false,
    });

    const streamCall = calls.find((call) => call.path === "/conversations/c1/ask/stream");
    expect(streamCall?.method).toBe("POST");
    expect(streamCall?.headers.Authorization).toBe("Bearer token-123");
    expect(streamCall?.body).toEqual({
      content: "Explain Ohm's Law in a series circuit context for beginners please",
      experiment_id: "ohms-law",
      simulation_id: null,
      quiz_id: null,
      report_id: null,
      stage: null,
      persist_user: true,
    });

    // Must not POST fake assistant messages or use /messages for generation.
    expect(calls.some((call) => call.path.endsWith("/messages") && call.method === "POST")).toBe(
      false,
    );

    const rename = calls.find((call) => call.method === "PATCH");
    expect(rename?.body).toEqual({
      title: deriveTitleFromMessage(
        "Explain Ohm's Law in a series circuit context for beginners please",
      ),
    });
  });

  it("surfaces a friendly error when the stream reports failure (no fabricated success)", async () => {
    mockApiRoutes({
      "GET /conversations/c1": () =>
        jsonResponse({
          id: "c1",
          title: "Named",
          experiment_id: null,
          created_at: iso(0),
          updated_at: iso(0),
          messages: [message("u1", "c1", "user", "Hello")],
        }),
      "POST /conversations/c1/ask/stream": () =>
        sseResponse([
          { type: "start", content: "" },
          { type: "error", error: "OpenAI authentication failed: invalid or missing API key" },
        ]),
    });

    const errors: string[] = [];
    const completions: string[] = [];

    await new Promise<void>((resolve) => {
      sendMessage("c1", "Hello", {}, {
        onComplete: (m) => {
          completions.push(m.content);
          resolve();
        },
        onError: (error) => {
          errors.push(error.message);
          resolve();
        },
      });
    });

    expect(completions).toEqual([]);
    expect(errors.length).toBe(1);
    expect(errors[0]).not.toMatch(/traceback|ProviderError|sk-/i);
  });

  it("surfaces an error when the conversation cannot be loaded for auto-rename path still attempts stream", async () => {
    // maybeAutoRename swallows 404; stream then fails with 404.
    mockApiRoutes({
      "GET /conversations/c1": jsonResponse({ detail: "Conversation not found" }, 404),
      "POST /conversations/c1/ask/stream": jsonResponse({ detail: "Conversation not found" }, 404),
    });

    const errors: string[] = [];
    await new Promise<void>((resolve) => {
      sendMessage("c1", "Hello", {}, {
        onError: (error) => {
          errors.push(error.message);
          resolve();
        },
      });
    });

    expect(errors[0]).toMatch(/conversation not found|start a new chat/i);
  });
});

describe("regenerateMessage", () => {
  it("reports an error when the conversation has no user message to regenerate", async () => {
    mockApiRoutes({
      "GET /conversations/c1": jsonResponse({
        id: "c1",
        title: "Empty",
        experiment_id: null,
        created_at: iso(0),
        updated_at: iso(0),
        messages: [],
      }),
    });

    const errors: string[] = [];
    const cancel = regenerateMessage("c1", {}, {
      onError: (error) => errors.push(error.message),
    });
    await new Promise((resolve) => setTimeout(resolve, 0));
    cancel();

    expect(errors).toEqual(["Nothing to regenerate."]);
  });

  it("re-asks the last user message through the real stream endpoint", async () => {
    mockApiRoutes({
      "GET /conversations/c1": () =>
        jsonResponse({
          id: "c1",
          title: "Ohm",
          experiment_id: null,
          created_at: iso(0),
          updated_at: iso(0),
          messages: [
            message("u1", "c1", "user", "Explain Ohm's Law"),
            message("a1", "c1", "assistant", "Old answer"),
          ],
        }),
      "POST /conversations/c1/ask/stream": () =>
        sseResponse([
          { type: "delta", content: "Fresh" },
          { type: "complete", content: "Fresh", message_id: "a2", conversation_id: "c1" },
        ]),
    });

    const userMessages: string[] = [];
    const completions: string[] = [];

    await new Promise<void>((resolve, reject) => {
      regenerateMessage(
        "c1",
        {},
        {
          onUserMessage: (m) => userMessages.push(m.content),
          onComplete: (m) => {
            completions.push(m.content);
            resolve();
          },
          onError: (error) => reject(error),
        },
      );
    });

    expect(userMessages).toEqual([]);
    expect(completions).toEqual(["Fresh"]);
  });
});

describe("toMentorUserError", () => {
  it("never exposes tracebacks or secrets", () => {
    const err = toMentorUserError(
      new ApiError(500, "Traceback (most recent call last):\nProviderError: sk-secret"),
    );
    expect(err.message).toBe("AI Mentor could not generate a response. Please try again.");
    expect(err.message).not.toMatch(/traceback|sk-secret|ProviderError/i);
  });
});
