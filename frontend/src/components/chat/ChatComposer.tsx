import { useRef, useState, type KeyboardEvent } from "react";
import { Send, Square } from "lucide-react";

interface ChatComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  /** True while the assistant response is being produced. */
  busy: boolean;
  disabled?: boolean;
  disabledReason?: string;
}

const MAX_LENGTH = 4000;

function ChatComposer({
  value,
  onChange,
  onSend,
  busy,
  disabled = false,
  disabledReason,
}: ChatComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showHint, setShowHint] = useState(false);

  const canSend = !disabled && !busy && value.trim().length > 0;

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (canSend) {
        onSend();
        setShowHint(false);
      } else if (value.trim().length === 0) {
        setShowHint(true);
        setTimeout(() => setShowHint(false), 2200);
      }
    }
  }

  function autoResize(el: HTMLTextAreaElement) {
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }

  const stateLabel = disabled
    ? "disabled"
    : busy
      ? "sending"
      : value.length > 0
        ? "typing"
        : "ready";

  return (
    <div className={`chat-composer chat-composer--${stateLabel}`}>
      <div className="chat-composer-row">
        <textarea
          ref={textareaRef}
          className="chat-composer-input"
          placeholder={disabled ? disabledReason ?? "Unavailable" : "Ask your engineering question..."}
          value={value}
          maxLength={MAX_LENGTH}
          disabled={disabled}
          aria-label="Message the AI Mentor"
          onChange={(e) => {
            onChange(e.target.value);
            autoResize(e.target);
          }}
          onKeyDown={handleKeyDown}
          rows={1}
        />

        <button
          type="button"
          className="chat-composer-send"
          onClick={() => {
            if (canSend) onSend();
          }}
          disabled={!canSend}
          aria-label={busy ? "AI Mentor is responding" : "Send message"}
        >
          {busy ? <Square size={15} /> : <Send size={15} />}
        </button>
      </div>

      <div className="chat-composer-footer">
        <span className={`chat-composer-hint ${showHint ? "chat-composer-hint--visible" : ""}`}>
          Type a message before sending.
        </span>
        <span className="chat-composer-shortcut" aria-hidden="true">
          <kbd>Enter</kbd> to send · <kbd>Shift</kbd>+<kbd>Enter</kbd> for a new line
        </span>
      </div>
    </div>
  );
}

export default ChatComposer;
