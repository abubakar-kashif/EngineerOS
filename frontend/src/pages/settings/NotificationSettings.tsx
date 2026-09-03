import { useEffect, useState } from "react";
import Button from "../../components/ui/Button";
import ErrorState from "../../components/ui/ErrorState";
import Toggle from "../../components/ui/Toggle";
import { toast } from "../../components/ui/useToast";
import {
  getNotificationPreferences,
  saveNotificationPreferences,
} from "../../services/settings/settingsService";
import { NOTIFICATION_SETTING_LABELS } from "../../types/settings";
import type { NotificationPreferences } from "../../types/settings";

const TOGGLE_ORDER: (keyof NotificationPreferences)[] = [
  "quiz_results",
  "report_completion",
  "learning_reminders",
  "activity",
  "email",
];

/** Notification toggles: quiz results, report completion, reminders. */
function NotificationSettings() {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [error, setError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const stored = await getNotificationPreferences();
        if (!cancelled) setPreferences(stored);
      } catch {
        if (!cancelled) setError(true);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  if (error || !preferences) {
    return (
      <div className="settings-section">
        <h2 className="settings-section-title">Notifications</h2>
        <ErrorState
          title="Unable to load your preferences."
          description="Your notification settings couldn't be loaded from the server."
          retryAction={() => setReloadKey((key) => key + 1)}
          retryLabel="Try Again"
        />
      </div>
    );
  }

  async function handleSave() {
    if (!preferences) return;
    setSaving(true);
    try {
      await saveNotificationPreferences(preferences);
      toast.success("Notifications saved", "We'll only ping you about what you chose.");
    } catch {
      toast.error("Couldn't save notifications", "Please try again in a moment.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="settings-section">
      <h2 className="settings-section-title">Notifications</h2>
      <p className="settings-section-description">
        Choose which EngineerOS events deserve your attention.
      </p>

      <div className="settings-toggle-list">
        {TOGGLE_ORDER.map((key) => {
          const meta = NOTIFICATION_SETTING_LABELS[key];
          return (
            <div key={key} className="settings-toggle-row">
              <div className="settings-toggle-copy">
                <span className="settings-toggle-title">{meta.title}</span>
                <span className="settings-toggle-description">{meta.description}</span>
              </div>
              <Toggle
                checked={preferences[key]}
                onChange={(checked) => setPreferences({ ...preferences, [key]: checked })}
                label={meta.title}
              />
            </div>
          );
        })}
      </div>

      <div className="settings-form-actions">
        <Button
          variant="primary"
          size="sm"
          loading={saving}
          disabled={saving}
          onClick={() => void handleSave()}
        >
          Save Notifications
        </Button>
      </div>
    </div>
  );
}

export default NotificationSettings;
