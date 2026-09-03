import { NavLink, Outlet } from "react-router-dom";
import { Bell, Palette, Shield, Sliders, User, type LucideIcon } from "lucide-react";
import SectionHeading from "../../components/ui/SectionHeading";
import { SETTINGS_SECTIONS } from "../../types/settings";
import type { SettingsSectionId } from "../../types/settings";

const SECTION_ICONS: Record<SettingsSectionId, LucideIcon> = {
  appearance: Palette,
  account: User,
  preferences: Sliders,
  notifications: Bell,
  security: Shield,
};

/** Settings shell: section navigation on the desktop, stacked on mobile. */
function SettingsPage() {
  return (
    <div className="page settings-page">
      <SectionHeading
        eyebrow="SETTINGS"
        title="Settings"
        description="Manage how EngineerOS looks, feels and keeps you informed."
      />

      <div className="settings-layout">
        <nav
          className="settings-nav"
          aria-label="Settings navigation"
          style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-lg)",
            padding: "6px",
            boxShadow: "var(--shadow-sm)",
            position: "sticky",
            top: "90px",
          }}
        >
          {SETTINGS_SECTIONS.map((section) => {
            const Icon = SECTION_ICONS[section.id];
            return (
              <NavLink
                key={section.path}
                to={section.path}
                end={section.end}
                className={({ isActive }) =>
                  `settings-nav-item${isActive ? " settings-nav-item-active" : ""}`
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "30px",
                        height: "30px",
                        borderRadius: "var(--radius-md)",
                        background: isActive
                          ? "var(--color-primary)"
                          : "var(--color-surface-muted)",
                        color: isActive ? "#ffffff" : "var(--color-text-muted)",
                        flexShrink: 0,
                        transition: "background 0.15s ease, color 0.15s ease",
                      }}
                    >
                      <Icon size={16} />
                    </span>
                    <span>{section.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="settings-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;