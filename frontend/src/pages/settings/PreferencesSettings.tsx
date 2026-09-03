import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import Button from "../../components/ui/Button";
import ErrorState from "../../components/ui/ErrorState";
import Toggle from "../../components/ui/Toggle";
import { toast } from "../../components/ui/useToast";
import {
  getLearningPreferences,
  saveLearningPreferences,
} from "../../services/settings/settingsService";
import {
  DEFAULT_VIEW_LABELS,
  DIFFICULTY_DESCRIPTIONS,
  DIFFICULTY_OPTIONS,
  VIEW_OPTIONS,
} from "../../types/settings";
import type { LearningPreferences } from "../../types/settings";

/** Learning preferences: difficulty, reminders and the default experiment view. */
function PreferencesSettings() {
  const [preferences, setPreferences] = useState<LearningPreferences | null>(null);
  const [error, setError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const stored = await getLearningPreferences();
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
        <h2 className="settings-section-title">Preferences</h2>
        <ErrorState
          title="Unable to load your preferences."
          description="Your saved preferences couldn't be loaded from the server."
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
      await saveLearningPreferences(preferences);
      toast.success("Preferences saved", "Your learning setup has been updated.");
    } catch {
      toast.error("Couldn't save preferences", "Please try again in a moment.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="settings-section">
      <h2 className="settings-section-title">Preferences</h2>
      <p className="settings-section-description">
        Tune EngineerOS to the way you like to learn. New experiment suggestions on your
        dashboard follow these settings.
      </p>

      <div className="settings-field">
        <label className="settings-field-label">Preferred difficulty</label>
        <div className="settings-option-list" role="radiogroup" aria-label="Preferred difficulty">
          {DIFFICULTY_OPTIONS.map((difficulty) => {
            const active = preferences.preferred_difficulty === difficulty;
            return (
              <button
                key={difficulty}
                type="button"
                role="radio"
                aria-checked={active}
                className={`settings-option${active ? " settings-option-active" : ""}`}
                onClick={() =>
                  setPreferences({ ...preferences, preferred_difficulty: difficulty })
                }
              >
                <span className="settings-option-title">{difficulty}</span>
                <span className="settings-option-description">
                  {DIFFICULTY_DESCRIPTIONS[difficulty]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="settings-field">
        <label className="settings-field-label">Default experiment view</label>
        <div className="settings-pill-row" role="radiogroup" aria-label="Default experiment view">
          {VIEW_OPTIONS.map((view) => {
            const active = preferences.default_experiment_view === view;
            return (
              <button
                key={view}
                type="button"
                role="radio"
                aria-checked={active}
                className={`settings-pill${active ? " settings-pill-active" : ""}`}
                onClick={() =>
                  setPreferences({ ...preferences, default_experiment_view: view })
                }
              >
                {DEFAULT_VIEW_LABELS[view]}
              </button>
            );
          })}
        </div>
      </div>

      <div className="settings-toggle-row">
        <div className="settings-toggle-copy">
          <span className="settings-toggle-title">
            <Bell size={14} /> Learning reminders
          </span>
          <span className="settings-toggle-description">
            Gently nudge me to keep up my learning streak.
          </span>
        </div>
        <Toggle
          checked={preferences.learning_reminders}
          onChange={(checked) =>
            setPreferences({ ...preferences, learning_reminders: checked })
          }
          label="Learning reminders"
        />
      </div>

      <div className="settings-form-actions">
        <Button
          variant="primary"
          size="sm"
          loading={saving}
          disabled={saving}
          onClick={() => void handleSave()}
        >
          Save Preferences
        </Button>
      </div>
    </div>
  );
}

export default PreferencesSettings;
