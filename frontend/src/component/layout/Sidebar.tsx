type SidebarProps = {
  currentPage?: string;
  onNavigate?: (page: string) => void;
};

function Sidebar({ currentPage = "home", onNavigate }: SidebarProps) {
  const menuItems = [
    { id: "home", label: "Home", icon: "🏡" },
    { id: "experiments", label: "Experiments", icon: "🧪" },
    { id: "mentor", label: "Mentor (AI)", icon: "🤖" },
    { id: "quiz", label: "Quiz", icon: "📝" },
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "tools", label: "Tools", icon: "⚡" },
    { id: "reports", label: "Reports", icon: "📈" },
    { id: "about", label: "About Us", icon: "ℹ️" },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-logo">ϟ</div>

        <div className="brand-text">
          <div className="brand-name">EngineerOS</div>
          <div className="brand-subtitle">Engineering Learning</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-title">PLATFORM</div>

        {menuItems.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`nav-item ${
              currentPage === item.id ? "nav-item-active" : ""
            }`}
            onClick={() => onNavigate?.(item.id)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <div className="sidebar-help-card">
          <div className="help-icon">⚡</div>

          <div className="help-content">
            <div className="help-title">Keep Learning</div>
            <div className="help-text">complete one experiment today.</div>
          </div>
        </div>

        <div className="sidebar-footer">
          <div className="sidebar-status">
            <span className="status-dot"></span>
            <span>EngineerOS</span>
          </div>

          <span className="version-text">v0.1</span>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
