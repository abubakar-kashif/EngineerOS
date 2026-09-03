import type { ExperimentDifficulty } from "./experiment";

/** Theme values supported by ThemeProvider. */
export type ThemePreference = "light" | "dark" | "system";

export const THEME_LABELS: Record<ThemePreference, string> = {
  light: "Light",
  dark: "Dark",
  system: "System",
};

export const THEME_DESCRIPTIONS: Record<ThemePreference, string> = {
  light: "Bright surfaces for well-lit environments.",
  dark: "Low-light surfaces that reduce eye strain.",
  system: "Follow your operating system preference.",
};

/** Which part of an experiment opens first. */
export type DefaultExperimentView = "overview" | "procedure" | "simulation";

export const DEFAULT_VIEW_LABELS: Record<DefaultExperimentView, string> = {
  overview: "Overview",
  procedure: "Procedure",
  simulation: "Simulation",
};

/** Learning preferences persisted per user. */
export interface LearningPreferences {
  preferred_difficulty: ExperimentDifficulty;
  learning_reminders: boolean;
  default_experiment_view: DefaultExperimentView;
}

export const DIFFICULTY_OPTIONS: ExperimentDifficulty[] = [
  "Beginner",
  "Intermediate",
  "Advanced",
];

export const DIFFICULTY_DESCRIPTIONS: Record<ExperimentDifficulty, string> = {
  Beginner: "Step-by-step guidance and fundamental concepts.",
  Intermediate: "Balanced labs that build on the basics.",
  Advanced: "Complex circuits with less hand-holding.",
};

export const VIEW_OPTIONS: DefaultExperimentView[] = [
  "overview",
  "procedure",
  "simulation",
];

/** Notification toggles persisted per user. */
export interface NotificationPreferences {
  quiz_results: boolean;
  report_completion: boolean;
  learning_reminders: boolean;
  email: boolean;
  activity: boolean;
}

export const NOTIFICATION_SETTING_LABELS: Record<
  keyof NotificationPreferences,
  { title: string; description: string }
> = {
  quiz_results: {
    title: "Quiz results",
    description: "Notify me when a quiz attempt is graded.",
  },
  report_completion: {
    title: "Report completion",
    description: "Notify me when a lab report finishes generating.",
  },
  learning_reminders: {
    title: "Learning reminders",
    description: "Remind me to keep up my learning streak.",
  },
  email: {
    title: "Email notifications",
    description: "Allow EngineerOS to send me emails about my account.",
  },
  activity: {
    title: "Activity",
    description: "Notify me about new activity on my account.",
  },
};

/** Fallback values used when nothing has been saved yet. */
export const DEFAULT_LEARNING_PREFERENCES: LearningPreferences = {
  preferred_difficulty: "Beginner",
  learning_reminders: false,
  default_experiment_view: "overview",
};

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  quiz_results: true,
  report_completion: true,
  learning_reminders: false,
  email: true,
  activity: true,
};

/** Device entry shown on the security page. */
export interface ActiveSession {
  id: string;
  device: string;
  browser: string;
  /** ISO date string of last activity. */
  last_active: string;
  current: boolean;
}

/** Settings sidebar navigation metadata (icons are attached in SettingsPage). */
export type SettingsSectionId =
  | "appearance"
  | "account"
  | "preferences"
  | "notifications"
  | "security";

export const SETTINGS_SECTIONS: {
  id: SettingsSectionId;
  label: string;
  path: string;
  /** NavLink must match the index route exactly. */
  end: boolean;
}[] = [
  { id: "appearance", label: "Appearance", path: "/settings", end: true },
  { id: "account", label: "Account", path: "/settings/account", end: false },
  { id: "preferences", label: "Preferences", path: "/settings/preferences", end: false },
  { id: "notifications", label: "Notifications", path: "/settings/notifications", end: false },
  { id: "security", label: "Security", path: "/settings/security", end: false },
];
