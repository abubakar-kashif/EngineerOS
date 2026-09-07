import { NavLink, useLocation } from "react-router-dom";
import { X } from "lucide-react";
import EngineerOSMark from "../branding/EngineerOSMark";
import { isActiveRoute, menuGroups } from "./navConfig";

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
          {menuGroups.map((group) => (
            <div key={group.title} className="mobile-nav-group">
              <div className="mobile-nav-group-title">{group.title}</div>
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActiveRoute(item.path, location.pathname);
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === "/"}
                    className={`mobile-nav-item${active ? " mobile-nav-item-active" : ""}`}
                    onClick={onClose}
                  >
                    <Icon size={20} strokeWidth={2} />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>
      </div>
    </div>
  );
}

export default MobileNav;
