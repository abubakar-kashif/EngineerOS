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
} from "../services/mentor/mentorService";
import { setAuthToken } from "../services/api";
import { deriveTitleFromMessage } from "../types/mentor";
import { jsonResponse, mockApiRoutes } from "../test/apiMocks";

afterEach(() => {
  vi.useRealTimers();
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

  it("maps a conversation detail into chat messages (metadata → is_simulated)", async () => {
    mockApiRoutes({
      "GET /conversations/c1": jsonResponse({
        id: "c1",
        title: "Series help",
        experiment_id: "series-circuit",
        created_at: iso(0),
        updated_at: iso(0),
        messages: [
          message("m1", "c1", "user", "Why is current the same?"),
          message("m2", "c1", "assistant", "Simulated answer…", { is_simulated: true }),
          message("m3", "c1", "assistant", "Real answer later"),
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
        ...message("m1", "c1", "assistant", "Simulated answer…", { is_simulated: true }),
        feedback: "helpful",
      }),
    });

    await expect(deleteConversation("c1")).resolves.toBe(true);
    await expect(deleteConversation("c2")).resolves.toBe(false);

    const renamed = await renameConversation("c1", "Renamed");
    expect(renamed?.title).toBe("Renamed");

    const feedback = await setMessageFeedback("c1", "m1", "helpful");
    expect(feedback?.feedback).toBe("helpful");
    expect(feedback?.is_simulated).toBe(true);
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

describe("sendMessage pipeline", () => {
  interface PersistMessageBody {
    role: "user" | "assistant";
    content: string;
    metadata: Record<string, unknown> | null;
  }

  function routeLog() {
    return mockApiRoutes({
      "GET /conversations/c1": () =>
        jsonResponse({
          id: "c1",
          title: "New conversation",
          experiment_id: null,
          created_at: iso(0),
          updated_at: iso(0),
          messages: [],
        }),
      // Echo the persisted payload so assertions see what was really sent.
      "POST /conversations/c1/messages": (call) => {
        const body = call.body as PersistMessageBody;
        return jsonResponse(
          message(`m-${body.role}`, "c1", body.role, body.content, body.metadata),
        );
      },
      "PATCH /conversations/c1": () => jsonResponse(summary("c1", "Renamed", 0)),
    });
  }

  it("persists the user message, auto-titles, streams a simulated reply, then persists it", async () => {
    vi.useFakeTimers();
    const calls = routeLog();

    const tokens: string[] = [];
    const userMessages: string[] = [];
    const completions: { content: string; is_simulated?: boolean }[] = [];

    const cancel = sendMessage(
      "c1",
      "Why is current the same everywhere in a series circuit?",
      "Series Circuit",
      {
        onUserMessage: (m) => userMessages.push(m.content),
        onToken: (accumulated) => tokens.push(accumulated),
        onComplete: (m) =>
          completions.push({ content: m.content, is_simulated: m.is_simulated }),
      },
    );

    // Flush the detail fetch + user message persistence + auto-rename.
    await vi.advanceTimersByTimeAsync(0);
    expect(userMessages).toEqual([
      "Why is current the same everywhere in a series circuit?",
    ]);

    // Run the simulated token stream to completion and persist the reply.
    await vi.advanceTimersByTimeAsync(10_000);
    cancel();

    // The reply is clearly labeled as simulated, both in the stream and on disk.
    expect(tokens.length).toBeGreaterThan(1);
    expect(completions).toHaveLength(1);
    expect(completions[0].is_simulated).toBe(true);
    expect(completions[0].content).toContain("Simulated response");
    expect(tokens[tokens.length - 1]).toBe(completions[0].content);

    const assistantPersist = calls.find(
      (call) =>
        call.path === "/conversations/c1/messages" &&
        (call.body as { role?: string })?.role === "assistant",
    );
    expect(assistantPersist?.body).toMatchObject({
      role: "assistant",
      metadata: { is_simulated: true },
    });

    // First message in a fresh conversation derives its title client-side
    // (truncated by deriveTitleFromMessage for long messages).
    const rename = calls.find((call) => call.method === "PATCH");
    expect(rename?.body).toEqual({
      title: deriveTitleFromMessage(
        "Why is current the same everywhere in a series circuit?",
      ),
    });
    expect((rename?.body as { title: string }).title.endsWith("…")).toBe(true);
  });

  it("skips the auto-rename when the conversation already has a title", async () => {
    vi.useFakeTimers();
    const calls = mockApiRoutes({
      "GET /conversations/c1": () =>
        jsonResponse({
          id: "c1",
          title: "Already named",
          experiment_id: null,
          created_at: iso(0),
          updated_at: iso(0),
          messages: [],
        }),
      "POST /conversations/c1/messages": () =>
        jsonResponse(message("m-next", "c1", "user", "stored")),
    });

    const cancel = sendMessage("c1", "Hello there", null, {});
    await vi.advanceTimersByTimeAsync(0);

    expect(calls.some((call) => call.method === "PATCH")).toBe(false);
    cancel();
  });

  it("surfaces an error and persists nothing when the conversation cannot be loaded", async () => {
    const calls = mockApiRoutes({
      "GET /conversations/c1": jsonResponse({ detail: "Conversation not found" }, 404),
    });

    const errors: string[] = [];
    sendMessage("c1", "Hello", null, {
      onError: (error) => errors.push(error.message),
    });
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(errors).toEqual(["Unable to send message."]);
    expect(calls.some((call) => call.method === "POST")).toBe(false);
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
    const cancel = regenerateMessage("c1", null, {
      onError: (error) => errors.push(error.message),
    });
    await new Promise((resolve) => setTimeout(resolve, 0));
    cancel();

    expect(errors).toEqual(["Nothing to regenerate."]);
  });
});
