/**
 * Core chat types for the AI Mentor experience.
 * Conversations and messages are owned by the backend; the Mentor
 * UI streams real provider output through the Mentor API.
 */

export type MessageRole = "user" | "assistant" | "system" | "error";

export type MessageStatus = "pending" | "streaming" | "complete" | "failed";

export type MessageFeedback = "helpful" | "not_helpful" | null;

export interface ChatMessage {
  id: string;
  conversation_id: string;
  role: MessageRole;
  content: string;
  created_at: string;
  status: MessageStatus;
  feedback: MessageFeedback;
  /**
   * Legacy flag for historically persisted placeholder replies.
   * Production Mentor no longer creates simulated messages.
   */
  is_simulated?: boolean;
}

export interface Conversation {
  id: string;
  /** Owner is implicit — the backend scopes conversations to the caller. */
  user_id?: string;
  title: string;
  experiment_id: string | null;
  created_at: string;
  updated_at: string;
  messages: ChatMessage[];
}

/** Sidebar-friendly projection of a conversation (no messages). */
export interface ConversationSummary {
  id: string;
  title: string;
  experiment_id: string | null;
  created_at: string;
  updated_at: string;
  message_count: number;
}

export type ConversationGroup = "Today" | "Yesterday" | "Previous 7 Days" | "Older";

export interface GroupedConversations {
  group: ConversationGroup;
  conversations: ConversationSummary[];
}

/** Callbacks for the real Mentor send / stream pipeline. */
export interface SendMessageHandlers {
  /** Called once the user turn is shown / acknowledged. */
  onUserMessage?: (message: ChatMessage) => void;
  /** Called repeatedly as real provider SSE deltas arrive. */
  onToken?: (accumulated: string) => void;
  /** Called once the assistant message is complete. */
  onComplete?: (message: ChatMessage) => void;
  /** Called when the exchange fails. */
  onError?: (error: Error) => void;
}
