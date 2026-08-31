import type { AIConversation } from "../../types/ai";

interface ConversationSidebarProps {
  conversations: AIConversation[];
  activeConversation: string | null;
  loading?: boolean;
  onSelect: (conversationId: string) => void;
  onNew: () => void;
  onRename: (conversationId: string, title: string) => void;
  onDelete: (conversationId: string) => void;
  onRefresh: () => void;
}

function ConversationSidebar({
  conversations,
  activeConversation,
  loading = false,
  onSelect,
  onNew,
  onRename,
  onDelete,
  onRefresh,
}: ConversationSidebarProps) {
  const handleRename = (conversation: AIConversation) => {
    const title = window.prompt(
      "Enter conversation name:",
      conversation.title
    );

    if (title === null) {
      return;
    }

    const trimmedTitle = title.trim();

    if (!trimmedTitle || trimmedTitle === conversation.title) {
      return;
    }

    onRename(conversation.id, trimmedTitle);
  };

  const handleDelete = (conversation: AIConversation) => {
    const confirmed = window.confirm(
      `Delete "${conversation.title}"?`
    );

    if (!confirmed) {
      return;
    }

    onDelete(conversation.id);
  };

  return (
    <aside className="mentor-conversation-sidebar">
      <div className="mentor-conversation-header">
        <h2>Conversations</h2>

        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          aria-label="Refresh conversations"
          title="Refresh conversations"
        >
          ↻
        </button>
      </div>

      <button
        type="button"
        onClick={onNew}
        disabled={loading}
        className="mentor-new-conversation"
      >
        + New Conversation
      </button>

      <div
        className="mentor-conversation-list"
        aria-label="Conversation list"
      >
        {loading && conversations.length === 0 ? (
          <div className="mentor-conversation-empty">
            Loading conversations...
          </div>
        ) : conversations.length === 0 ? (
          <div className="mentor-conversation-empty">
            No conversations yet.
          </div>
        ) : (
          conversations.map((conversation) => {
            const isActive =
              conversation.id === activeConversation;

            return (
              <div
                key={conversation.id}
                className={`mentor-conversation-item ${
                  isActive
                    ? "mentor-conversation-item-active"
                    : ""
                }`}
              >
                <button
                  type="button"
                  onClick={() => onSelect(conversation.id)}
                  className="mentor-conversation-select"
                  aria-current={isActive ? "page" : undefined}
                >
                  <span className="mentor-conversation-title">
                    {conversation.title || "Untitled Conversation"}
                  </span>
                </button>

                <div className="mentor-conversation-actions">
                  <button
                    type="button"
                    onClick={() =>
                      handleRename(conversation)
                    }
                    disabled={loading}
                    aria-label={`Rename ${conversation.title}`}
                    title="Rename"
                  >
                    ✎
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleDelete(conversation)
                    }
                    disabled={loading}
                    aria-label={`Delete ${conversation.title}`}
                    title="Delete"
                  >
                    ×
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}

export default ConversationSidebar;