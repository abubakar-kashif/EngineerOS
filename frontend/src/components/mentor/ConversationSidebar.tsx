import { useMemo, useState } from "react";
import { Plus, Search, MessageSquare, Pencil, Trash2, X, MessageSquarePlus } from "lucide-react";
import type { ConversationSummary } from "../../types/chat";

interface ConversationSidebarProps {
  conversations: ConversationSummary[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNewChat: () => void;
  onRenameRequest: (id: string) => void;
  onDeleteRequest: (id: string) => void;
  loading: boolean;
  /** Mobile drawer mode */
  drawerOpen: boolean;
  onDrawerClose: () => void;
}

interface GroupedSummaries {
  group: string;
  conversations: ConversationSummary[];
}

function groupByDate(conversations: ConversationSummary[]): GroupedSummaries[] {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;
  const weekAgo = startOfToday - 7 * 24 * 60 * 60 * 1000;

  const buckets: Record<string, ConversationSummary[]> = {
    Today: [],
    Yesterday: [],
    "Previous 7 Days": [],
    Older: [],
  };

  for (const c of conversations) {
    const t = new Date(c.updated_at).getTime();
    if (t >= startOfToday) buckets.Today.push(c);
    else if (t >= startOfYesterday) buckets.Yesterday.push(c);
    else if (t >= weekAgo) buckets["Previous 7 Days"].push(c);
    else buckets.Older.push(c);
  }

  return Object.entries(buckets)
    .filter(([, items]) => items.length > 0)
    .map(([group, items]) => ({ group, conversations: items }));
}

function ConversationSidebar({
  conversations,
  activeId,
  onSelect,
  onNewChat,
  onRenameRequest,
  onDeleteRequest,
  loading,
  drawerOpen,
  onDrawerClose,
}: ConversationSidebarProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((c) => c.title.toLowerCase().includes(q));
  }, [conversations, query]);

  const groups = useMemo(() => groupByDate(filtered), [filtered]);

  return (
    <>
      {/* Mobile drawer overlay */}
      {drawerOpen && <div className="mentor-drawer-overlay" onClick={onDrawerClose} aria-hidden="true" />}

      <aside
        className={`mentor-sidebar ${drawerOpen ? "mentor-sidebar--open" : ""}`}
        aria-label="Conversations"
      >
        <div className="mentor-sidebar-header">
          <span className="mentor-sidebar-title">Conversations</span>
          <button
            type="button"
            className="mentor-sidebar-close"
            onClick={onDrawerClose}
            aria-label="Close conversations"
          >
            <X size={16} />
          </button>
        </div>

        <div className="mentor-sidebar-actions">
          <button type="button" className="mentor-new-chat" onClick={onNewChat}>
            <Plus size={15} />
            New Chat
          </button>

          <div className="mentor-search">
            <Search size={14} className="mentor-search-icon" />
            <input
              type="text"
              className="mentor-search-input"
              placeholder="Search conversations..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search conversations"
            />
          </div>
        </div>

        <div className="mentor-sidebar-list" role="list">
          {loading && (
            <div className="mentor-sidebar-state">Loading conversations…</div>
          )}

          {!loading && filtered.length === 0 && query.trim() === "" && (
            <div className="mentor-sidebar-state">
              <MessageSquare size={18} />
              <span>No conversations yet.</span>
              <span className="mentor-sidebar-state-hint">
                Start a new conversation with EngineerOS Mentor.
              </span>
            </div>
          )}

          {!loading && filtered.length === 0 && query.trim() !== "" && (
            <div className="mentor-sidebar-state">
              <MessageSquarePlus size={18} />
              <span>No conversations match “{query.trim()}”.</span>
            </div>
          )}

          {!loading &&
            groups.map(({ group, conversations: items }) => (
              <div key={group} className="mentor-sidebar-group">
                <div className="mentor-sidebar-group-label">{group}</div>
                {items.map((c) => (
                  <div
                    key={c.id}
                    className={`mentor-conversation ${c.id === activeId ? "mentor-conversation--active" : ""}`}
                  >
                    <button
                      type="button"
                      className="mentor-conversation-btn"
                      onClick={() => onSelect(c.id)}
                      aria-current={c.id === activeId ? "true" : undefined}
                    >
                      <MessageSquare size={13} className="mentor-conversation-icon" />
                      <span className="mentor-conversation-title">{c.title}</span>
                      {c.message_count > 0 && (
                        <span className="mentor-conversation-count">{c.message_count}</span>
                      )}
                    </button>

                    <div className="mentor-conversation-actions">
                      <button
                        type="button"
                        className="mentor-conversation-action"
                        onClick={() => onRenameRequest(c.id)}
                        aria-label={`Rename ${c.title}`}
                      >
                        <Pencil size={12} />
                      </button>
                      <button
                        type="button"
                        className="mentor-conversation-action mentor-conversation-action--danger"
                        onClick={() => onDeleteRequest(c.id)}
                        aria-label={`Delete ${c.title}`}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ))}
        </div>
      </aside>
    </>
  );
}

export default ConversationSidebar;
