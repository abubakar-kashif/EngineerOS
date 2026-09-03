/**
 * Core chat types for the AI Mentor experience.
 * These describe the conversation/message architecture that the
 * future AI engine will plug into.
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
   * True when the message was produced by the built-in placeholder
   * responder (no real AI model connected yet). The UI shows a
   * "Simulated" badge so placeholder replies are never mistaken
   * for real AI output.
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

/** Callbacks for the streaming-ready send pipeline. */
export interface SendMessageHandlers {
  /** Called once the user message has been persisted by the backend. */
  onUserMessage?: (message: ChatMessage) => void;
  /** Called repeatedly as response tokens arrive (streaming). */
  onToken?: (accumulated: string) => void;
  /** Called once the assistant message is complete. */
  onComplete?: (message: ChatMessage) => void;
  /** Called when the exchange fails. */
  onError?: (error: Error) => void;
}
