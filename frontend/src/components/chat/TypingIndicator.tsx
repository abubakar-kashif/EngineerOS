/** Subtle "AI Mentor is thinking..." indicator. */
function TypingIndicator() {
  return (
    <div className="chat-typing" aria-live="polite" aria-label="AI Mentor is thinking">
      <span className="chat-typing-text">AI Mentor is thinking</span>
      <span className="chat-typing-dots" aria-hidden="true">
        <span className="chat-typing-dot" />
        <span className="chat-typing-dot" />
        <span className="chat-typing-dot" />
      </span>
    </div>
  );
}

export default TypingIndicator;
