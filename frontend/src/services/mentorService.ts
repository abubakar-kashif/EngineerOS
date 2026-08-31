import type {
  AIChatRequest,
  AIChatResponse,
  AIConversation,
  AIMessage,
  AIStreamEvent,
} from "../types/ai";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:8000/api";

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;

    try {
      const errorData = await response.json();

      if (typeof errorData?.detail === "string") {
        message = errorData.detail;
      } else if (Array.isArray(errorData?.detail)) {
        message = errorData.detail
          .map((item: { msg?: string }) => item.msg || "Validation error")
          .join(", ");
      }
    } catch {
      // Keep default error message
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

/* -------------------------------------------------------
   CONVERSATIONS
------------------------------------------------------- */

export async function listConversations(): Promise<AIConversation[]> {
  return request<AIConversation[]>("/conversations");
}

export async function createConversation(): Promise<AIConversation> {
  return request<AIConversation>("/conversations", {
    method: "POST",
  });
}

export async function getConversation(
  id: string
): Promise<AIConversation> {
  return request<AIConversation>(
    `/conversations/${encodeURIComponent(id)}`
  );
}

export async function getMessages(
  conversationId: string
): Promise<AIMessage[]> {
  return request<AIMessage[]>(
    `/conversations/${encodeURIComponent(conversationId)}/messages`
  );
}

export async function renameConversation(
  id: string,
  title: string
): Promise<AIConversation> {
  return request<AIConversation>(
    `/conversations/${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      body: JSON.stringify({
        title,
      }),
    }
  );
}

export async function deleteConversation(
  id: string
): Promise<void> {
  await request<void>(
    `/conversations/${encodeURIComponent(id)}`,
    {
      method: "DELETE",
    }
  );
}

/* -------------------------------------------------------
   SEND MESSAGE
------------------------------------------------------- */

export async function sendMessage(
  data: AIChatRequest
): Promise<AIChatResponse> {
  const response = await request<unknown>(
    `/conversations/${encodeURIComponent(
      data.conversation_id
    )}/messages`,
    {
      method: "POST",
      body: JSON.stringify({
        role: "user",
        content: data.message,
      }),
    }
  );

  /*
   * Current backend Swagger response is a string.
   * Support both the current string response and the
   * future normalized AIChatResponse object.
   */

  if (typeof response === "string") {
    return {
      message_id: "",
      conversation_id: data.conversation_id,
      content: response,
      context_used: {
        experiment_id: data.experiment_id ?? null,
        simulation_id: data.simulation_id ?? null,
        quiz_id: data.quiz_id ?? null,
        question_id: data.question_id ?? null,
        report_id: data.report_id ?? null,
      },
    };
  }

  return response as AIChatResponse;
}

/* -------------------------------------------------------
   STREAMING
------------------------------------------------------- */

export async function streamMessage(
  data: AIChatRequest,
  onEvent: (event: AIStreamEvent) => void
): Promise<void> {
  /*
   * The current backend contract does not expose a streaming
   * endpoint yet. Do NOT fake streaming with setTimeout.
   *
   * Once the backend exposes a real streaming endpoint,
   * this function can consume its SSE/events here.
   */

  const response = await sendMessage(data);

  onEvent({
    type: "start",
    conversation_id: response.conversation_id,
    ...(response.message_id
      ? { message_id: response.message_id }
      : {}),
  });

  if (response.content) {
    onEvent({
      type: "delta",
      content: response.content,
    });
  }

  onEvent({
    type: "complete",
    message_id: response.message_id,
    conversation_id: response.conversation_id,
  });
}