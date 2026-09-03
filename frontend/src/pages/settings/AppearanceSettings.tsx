import { CheckCircle2, Monitor, Moon, Palette, Sun } from "lucide-react";
import { useTheme } from "../../components/ui/ThemeContext";
import { toast } from "../../components/ui/useToast";
import { useAuth } from "../../contexts/AuthContext";
import { updatePreferences } from "../../services/userService";
import { THEME_DESCRIPTIONS, THEME_LABELS } from "../../types/settings";
import type { ThemePreference } from "../../types/settings";

const THEME_ICONS: Record<ThemePreference, typeof Sun> = {
  light: Sun,
  dark: Moon,
  system: Monitor,
};

const THEME_OPTIONS: ThemePreference[] = ["light", "dark", "system"];

/** Theme picker — applies instantly and persists to the account. */
function AppearanceSettings() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const { isAuthenticated } = useAuth();

  function selectTheme(next: ThemePreference) {
    if (next === theme) return;
    // Immediate UI change + device-local persistence for anonymous use.
    setTheme(next);
    toast.success(`${THEME_LABELS[next]} theme applied`, THEME_DESCRIPTIONS[next]);

    // Signed-in users get the preference persisted to their account so it
    // follows them across devices and survives sign-out.
    if (isAuthenticated) {
      updatePreferences({ theme: next }).catch(() => {
        toast.error(
          "Couldn't save your theme to your account",
          "It stays applied on this device and will sync when you're back online.",
        );
      });
    }
  }

  return (
    <div className="settings-section" style={{ borderTop: "3px solid var(--color-primary)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "0.35rem" }}>
        <div
          style={{
            width: "38px",
            height: "38px",
            borderRadius: "var(--radius-md)",
            background: "var(--color-primary-muted)",
            color: "var(--color-primary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Palette size={18} />
        </div>
        <h2 className="settings-section-title" style={{ margin: 0 }}>
          Appearance
        </h2>
      </div>

      <p className="settings-section-description">
        Choose how EngineerOS looks. Your choice is saved to your account and
        follows you across devices; it stays on this device while signed out.
      </p>

      <div className="settings-field">
        <label
          className="settings-field-label"
          style={{
            fontSize: "11px",
            fontWeight: 700,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: "var(--color-text-muted)",
          }}
        >
          Theme
        </label>
        <div className="settings-theme-options" role="radiogroup" aria-label="Theme">
          {THEME_OPTIONS.map((option) => {
            const Icon = THEME_ICONS[option];
            const active = theme === option;
            return (
              <button
                key={option}
                type="button"
                role="radio"
                aria-checked={active}
                className={`settings-theme-option${active ? " settings-theme-option-active" : ""}`}
                onClick={() => selectTheme(option)}
                style={{ position: "relative", boxShadow: active ? "var(--shadow-sm)" : "none" }}
              >
                {active && (
                  <span
                    style={{
                      position: "absolute",
                      top: "12px",
                      right: "12px",
                      width: "20px",
                      height: "20px",
                      borderRadius: "50%",
                      background: "var(--color-primary)",
                      color: "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <CheckCircle2 size={13} />
                  </span>
                )}
                <Icon size={18} />
                <span className="settings-theme-option-name">{THEME_LABELS[option]}</span>
                <span className="settings-theme-option-description">
                  {THEME_DESCRIPTIONS[option]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <p
        className="settings-note"
        style={{
          padding: "10px 14px",
          background: "var(--color-surface-muted)",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--color-border)",
        }}
      >
        {theme === "system"
          ? `System mode is currently rendering the ${resolvedTheme} appearance.`
          : `EngineerOS is using the ${resolvedTheme} appearance.`}
      </p>
    </div>
  );
}

export default AppearanceSettings;