import { NavLink, useLocation } from "react-router-dom";
import {
  FlaskConical,
  Bot,
  ChartNoAxesCombined,
  Wrench,
  FileText,
  Info,
  Settings,
  Sparkles,
  BookOpen,
  Library,
  House,
  ListChecks,
  type LucideIcon,
} from "lucide-react";
import EngineerOSMark from "../branding/EngineerOSMark";

type MenuItem = {
  path: string;
  label: string;
  icon: LucideIcon;
};

type MenuGroup = {
  title: string;
  items: MenuItem[];
};

const menuGroups: MenuGroup[] = [
  {
    title: "HOME",
    items: [
      { path: "/", label: "Home", icon: House },
      { path: "/dashboard", label: "Dashboard", icon: ChartNoAxesCombined },
    ],
  },
  {
    title: "LEARN",
    items: [
      { path: "/experiments", label: "Experiments", icon: FlaskConical },
      { path: "/quiz", label: "Quiz", icon: ListChecks },
      { path: "/reports", label: "Reports", icon: FileText },
      { path: "/resources", label: "Resources", icon: Library },
    ],
  },
  {
    title: "WORKSPACE",
    items: [
      { path: "/simulation", label: "Simulation", icon: Sparkles },
      { path: "/mentor", label: "AI Mentor", icon: Bot },
    ],
  },
  {
    title: "TOOLS",
    items: [
      { path: "/tools", label: "Engineering Tools", icon: Wrench },
    ],
  },
  {
    title: "SYSTEM",
    items: [
      { path: "/settings", label: "Settings", icon: Settings },
      { path: "/about", label: "About", icon: Info },
    ],
  },
];

function isActiveRoute(itemPath: string, currentPath: string): boolean {
  if (itemPath === "/") return currentPath === "/";
  return currentPath.startsWith(itemPath);
}

function Sidebar() {
  const location = useLocation();

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <EngineerOSMark size="md" />
        <div className="brand-text">
          <div className="brand-name">EngineerOS</div>
        </div>
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
