export type AIMessageRole = "user" | "assistant" | "system";

export interface AIMessage {
  id: string;
  conversation_id: string;
  role: AIMessageRole;
  content: string;
  created_at: string;
  metadata?: Record<string, unknown>;
}

export interface AIConversation {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  experiment_id?: string | null;
}

export interface AIChatRequest {
  conversation_id: string;
  message: string;
  experiment_id?: string | null;
  simulation_id?: string | null;
  quiz_id?: string | null;
  question_id?: string | null;
  report_id?: string | null;
}

export interface AIChatResponse {
  message_id: string;
  conversation_id: string;
  content: string;
  model?: string;
  finish_reason?: string | null;
  usage?: Record<string, unknown>;
  context_used?: AIContext;
}

export type AIStreamEvent =
  | {
      type: "start";
      conversation_id: string;
      message_id?: string;
    }
  | {
      type: "delta";
      content: string;
    }
  | {
      type: "metadata";
      data: Record<string, unknown>;
    }
  | {
      type: "complete";
      message_id: string;
      conversation_id: string;
    }
  | {
      type: "error";
      error: AIError;
    };

export interface AIError {
  code: string;
  message: string;
}

export interface AIContext {
  experiment_id?: string | null;
  simulation_id?: string | null;
  quiz_id?: string | null;
  question_id?: string | null;
  report_id?: string | null;
}