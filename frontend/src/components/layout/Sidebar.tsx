import { NavLink, useLocation } from "react-router-dom";
import { BookOpen, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import EngineerOSMark from "../branding/EngineerOSMark";
import { isActiveRoute, menuGroups } from "./navConfig";

function Sidebar({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  const location = useLocation();

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <EngineerOSMark size="md" />
        <div className="brand-text">
          <div className="brand-name">EngineerOS</div>
        </div>
        <button
          type="button"
          className="sidebar-collapse"
          onClick={onToggle}
          aria-pressed={collapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
        </button>
      </div>

      <nav className="sidebar-nav" aria-label="Main navigation">
        {menuGroups.map((group, gi) => (
          <div key={gi} className="sidebar-group">
            {group.title && (
              <div className="nav-section-title">{group.title}</div>
            )}
            {group.items.map((item) => {
              const Icon = item.icon;
              const active = isActiveRoute(item.path, location.pathname);
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === "/"}
                  className={`nav-item${active ? " nav-item-active" : ""}`}
                  title={item.label}
                >
                  <span className="nav-icon">
                    <Icon size={18} strokeWidth={2} />
                  </span>
                  <span className="nav-label">{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <div className="sidebar-help-card">
          <div className="help-icon">
            <BookOpen size={18} strokeWidth={2} />
          </div>
          <div className="help-content">
            <div className="help-title">Keep Learning</div>
            <div className="help-text">Complete an experiment today.</div>
          </div>
        </div>
        <div className="sidebar-footer">
          <div className="sidebar-status">
            <span className="status-dot"></span>
            <span>EngineerOS</span>
          </div>
          <span className="version-text">v0.2</span>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
