import { useState } from "react";
import { Bot, Copy, Check, RefreshCw, ThumbsUp, ThumbsDown, AlertCircle, Info } from "lucide-react";
import Avatar from "../ui/Avatar";
import MarkdownLite from "./MarkdownLite";
import type { ChatMessage as ChatMessageType, MessageFeedback } from "../../types/chat";

interface ChatMessageProps {
  message: ChatMessageType;
  userInitials: string;
  onRegenerate?: () => void;
  onFeedback?: (feedback: MessageFeedback) => void;
  onExplainDifferently?: () => void;
  canRegenerate?: boolean;
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

function ChatMessage({
  message,
  userInitials,
  onRegenerate,
  onFeedback,
  onExplainDifferently,
  canRegenerate = false,
}: ChatMessageProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";
  const isAssistant = message.role === "assistant";
  const isError = message.role === "error";
  const isSystem = message.role === "system";

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard unavailable — no-op
    }
  }

  /* System / error banner messages */
  if (isSystem || isError) {
    return (
      <div className={`chat-msg chat-msg--banner ${isError ? "chat-msg--error" : "chat-msg--system"}`} role={isError ? "alert" : undefined}>
        {isError ? <AlertCircle size={14} /> : <Info size={14} />}
        <span>{message.content}</span>
      </div>
    );
  }

  return (
    <article
      className={`chat-msg ${isUser ? "chat-msg--user" : "chat-msg--assistant"}`}
      aria-label={`${isUser ? "You" : "AI Mentor"} said`}
    >
      {isUser ? (
        <Avatar
          fallback={userInitials}
          size="sm"
          className="chat-msg-avatar"
        />
      ) : (
        <span className="chat-msg-avatar chat-msg-avatar--mentor" aria-hidden="true">
          <Bot size={16} />
        </span>
      )}

      <div className="chat-msg-body">
        <div className="chat-msg-meta">
          <span className="chat-msg-sender">{isUser ? "You" : "AI Mentor"}</span>
          <span className="chat-msg-time">{formatTime(message.created_at)}</span>
          {message.is_simulated && (
            <span className="chat-msg-simulated" title="This reply was produced by an older placeholder responder.">
              Legacy
            </span>
          )}
        </div>

        <div className="chat-msg-content">
          <MarkdownLite content={message.content} />
        </div>

        {/* Actions */}
        {isUser && (
          <div className="chat-msg-actions">
            <button type="button" className="chat-action" onClick={handleCopy} aria-label="Copy message">
              {copied ? <Check size={13} /> : <Copy size={13} />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        )}

        {isAssistant && (
          <div className="chat-msg-actions">
            <button type="button" className="chat-action" onClick={handleCopy} aria-label="Copy response">
              {copied ? <Check size={13} /> : <Copy size={13} />}
              {copied ? "Copied" : "Copy"}
            </button>

            {canRegenerate && onRegenerate && (
              <button type="button" className="chat-action" onClick={onRegenerate} aria-label="Regenerate response">
                <RefreshCw size={13} />
                Regenerate
              </button>
            )}

            {onExplainDifferently && (
              <button type="button" className="chat-action" onClick={onExplainDifferently} aria-label="Ask to explain differently">
                <Bot size={13} />
                Explain differently
              </button>
            )}

            {onFeedback && (
              <>
                <button
                  type="button"
                  className={`chat-action ${message.feedback === "helpful" ? "chat-action--active" : ""}`}
                  onClick={() => onFeedback("helpful")}
                  aria-label="Mark response as helpful"
                  aria-pressed={message.feedback === "helpful"}
                >
                  <ThumbsUp size={13} />
                  Helpful
                </button>
                <button
                  type="button"
                  className={`chat-action ${message.feedback === "not_helpful" ? "chat-action--active" : ""}`}
                  onClick={() => onFeedback("not_helpful")}
                  aria-label="Mark response as not helpful"
                  aria-pressed={message.feedback === "not_helpful"}
                >
                  <ThumbsDown size={13} />
                  Not helpful
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

export default ChatMessage;
