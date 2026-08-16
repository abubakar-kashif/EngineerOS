import { NavLink } from "react-router-dom";
import {
  House,
  FlaskConical,
  Bot,
  ChartNoAxesCombined,
  Wrench,
  FileText,
  Info,
  Zap,
} from "lucide-react";

const menuItems = [
  { path: "/", label: "Home", icon: House },
  { path: "/experiments", label: "Experiments", icon: FlaskConical },
  { path: "/mentor", label: "Mentor (AI)", icon: Bot },
  { path: "/dashboard", label: "Dashboard", icon: ChartNoAxesCombined },
  { path: "/tools", label: "Tools", icon: Wrench },
  { path: "/reports", label: "Reports", icon: FileText },
  { path: "/about", label: "About Us", icon: Info },
];

function Sidebar() {
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
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.label}
              to={item.path}
              end={item.path === "/"}
              className={({ isActive }) =>
                `nav-item ${isActive ? "nav-item-active" : ""}`
              }
            >
              <span className="nav-icon">
                <Icon size={18} strokeWidth={2} />
              </span>

              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
      <div className="sidebar-bottom">
        <div className="sidebar-help-card">
          <div className="help-icon">
            <Zap size={18} strokeWidth={2} />
          </div>
          <div className="help-content">
            <div className="help-title">Keep Learning</div>
            <div className="help-text">Complete one experiment today.</div>
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