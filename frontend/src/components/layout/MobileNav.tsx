import { NavLink, useLocation } from "react-router-dom";
import { X, FlaskConical, Bot, ChartNoAxesCombined, Wrench, FileText, Info, Settings, Sparkles } from "lucide-react";
import EngineerOSMark from "../branding/EngineerOSMark";

const mobileItems = [
  { path: "/dashboard", label: "Dashboard", icon: ChartNoAxesCombined },
  { path: "/experiments", label: "Experiments", icon: FlaskConical },
  { path: "/reports", label: "Reports", icon: FileText },
  { path: "/simulation", label: "Simulation", icon: Sparkles },
  { path: "/mentor", label: "AI Mentor", icon: Bot },
  { path: "/tools", label: "Tools", icon: Wrench },
  { path: "/settings", label: "Settings", icon: Settings },
  { path: "/about", label: "About", icon: Info },
];

type MobileNavProps = {
  open: boolean;
  onClose: () => void;
};

function MobileNav({ open, onClose }: MobileNavProps) {
  const location = useLocation();

  if (!open) return null;

  return (
    <div className="mobile-nav-overlay" onClick={onClose}>
      <div
        className="mobile-nav-drawer animate-slide-down"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation"
      >
        <div className="mobile-nav-header">
          <div className="mobile-nav-brand">
            <EngineerOSMark size="md" />
            <span className="brand-name">EngineerOS</span>
          </div>
          <button className="mobile-nav-close" onClick={onClose} aria-label="Close navigation">
            <X size={20} />
          </button>
        </div>

        <nav className="mobile-nav-list" aria-label="Mobile navigation">
          {mobileItems.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path ||
              (item.path !== "/" && location.pathname.startsWith(item.path));
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`mobile-nav-item${active ? " mobile-nav-item-active" : ""}`}
                onClick={onClose}
              >
                <Icon size={20} strokeWidth={2} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

export default MobileNav;
