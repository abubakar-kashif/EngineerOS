import { NavLink } from "react-router-dom";
import {
  House,
  FlaskConical,
  Bot,
  ClipboardList,
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
  { path: "/quiz/demo", label: "Quiz", icon: ClipboardList },
  { path: "/dashboard", label: "Dashboard", icon: ChartNoAxesCombined },
  { path: "/tools", label: "Tools", icon: Wrench },
  { path: "/reports", label: "Reports", icon: FileText },
  { path: "/simulation", label: "Simulation", icon: Zap },
  { path: "/about", label: "About Us", icon: Info },
];

function Sidebar() {
  return (
    <aside className="sidebar">

      {/* EngineerOS Brand */}
      <div className="sidebar-brand">
        <div className="brand-icon">
          <Zap size={24} strokeWidth={2.5} />
        </div>

        <div>
          <div className="brand-name">EngineerOS</div>
          <div className="brand-subtitle">
            Engineering Learning
          </div>
        </div>
      </div>

      {/* Platform Navigation */}
      <div className="sidebar-section-title">
        PLATFORM
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              className={({ isActive }) =>
                `nav-item ${isActive ? "nav-item-active" : ""}`
              }
            >
              <Icon
                className="nav-icon"
                size={19}
                strokeWidth={2}
              />

              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Keep Learning */}
      <div className="sidebar-bottom">
        <div className="keep-learning">
          <div className="keep-learning-icon">
            <Zap size={18} strokeWidth={2.2} />
          </div>

          <div>
            <strong>Keep Learning</strong>
            <p>Complete one experiment today.</p>
          </div>
        </div>

        <div className="sidebar-footer">
          <span className="status-dot"></span>

          <span>EngineerOS</span>

          <span className="version">
            v0.1
          </span>
        </div>
      </div>

    </aside>
  );
}

export default Sidebar;