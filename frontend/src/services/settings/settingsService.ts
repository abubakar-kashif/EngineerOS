/**
 * Settings service boundary.
 *
 * Phase 9: all persistence moved to the backend Users API (profile,
 * password, sessions) and the account-level preferences stored per user.
 * The exported function names are the contract the settings pages rely on;
 * anonymous visitors fall back to localStorage so the UI still works
 * before sign-in.
 */
import {
  changePassword as apiChangePassword,
  getMyProfile,
  getPreferences,
  revokeSession as apiRevokeSession,
  signOutOtherSessions as apiSignOutOtherSessions,
  updatePreferences,
  updateProfile as apiUpdateProfile,
  type ProfileUpdate,
} from "../userService";
import { getAuthToken } from "../api";
import type { User, UserPreferences } from "../../types/auth";
import type {
  ActiveSession,
  LearningPreferences,
  NotificationPreferences,
} from "../../types/settings";
import {
  DEFAULT_LEARNING_PREFERENCES,
  DEFAULT_NOTIFICATION_PREFERENCES,
} from "../../types/settings";

const LEARNING_KEY = "engineeros_learning_preferences";
const NOTIFICATIONS_KEY = "engineeros_notification_preferences";

/* ── local cache (anonymous fallback + offline tolerance) ── */

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage unavailable (private mode) — preferences stay server-side only.
  }
}

function signedIn(): boolean {
  return getAuthToken() !== null;
}

/* ── Learning preferences ─────────────────────────────── */

function toLearningPreferences(preferences: UserPreferences): LearningPreferences {
  return {
    preferred_difficulty: preferences.preferred_difficulty,
    learning_reminders: preferences.learning_reminders,
    default_experiment_view: preferences.default_experiment_view,
  };
}

/**
 * Loads learning preferences from the account. Signed-out visitors (or a
 * failing request while no token exists) get the localStorage copy.
 */
export async function getLearningPreferences(): Promise<LearningPreferences> {
  if (!signedIn()) {
    return readJson<LearningPreferences>(LEARNING_KEY) ?? { ...DEFAULT_LEARNING_PREFERENCES };
  }

  const preferences = await getPreferences();
  const learning = toLearningPreferences(preferences);
  writeJson(LEARNING_KEY, learning);
  return learning;
}

export async function saveLearningPreferences(
  preferences: LearningPreferences,
): Promise<LearningPreferences> {
  if (!signedIn()) {
    writeJson(LEARNING_KEY, preferences);
    return preferences;
  }

  const saved = await updatePreferences({
    preferred_difficulty: preferences.preferred_difficulty,
    learning_reminders: preferences.learning_reminders,
    default_experiment_view: preferences.default_experiment_view,
  });
  const learning = toLearningPreferences(saved);
  writeJson(LEARNING_KEY, learning);
  return learning;
}

/* ── Notification preferences ─────────────────────────── */

function toNotificationPreferences(preferences: UserPreferences): NotificationPreferences {
  return {
    quiz_results: preferences.notify_quiz_results,
    report_completion: preferences.notify_report_completion,
    learning_reminders: preferences.notify_learning_reminders,
    email: preferences.notify_email,
    activity: preferences.notify_activity,
  };
}

export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  if (!signedIn()) {
    return (
      readJson<NotificationPreferences>(NOTIFICATIONS_KEY) ?? {
        ...DEFAULT_NOTIFICATION_PREFERENCES,
      }
    );
  }

  const preferences = await getPreferences();
  const notifications = toNotificationPreferences(preferences);
  writeJson(NOTIFICATIONS_KEY, notifications);
  return notifications;
}

export async function saveNotificationPreferences(
  preferences: NotificationPreferences,
): Promise<NotificationPreferences> {
  if (!signedIn()) {
    writeJson(NOTIFICATIONS_KEY, preferences);
    return preferences;
  }

  const saved = await updatePreferences({
    notify_quiz_results: preferences.quiz_results,
    notify_report_completion: preferences.report_completion,
    notify_learning_reminders: preferences.learning_reminders,
    notify_email: preferences.email,
    notify_activity: preferences.activity,
  });
  const notifications = toNotificationPreferences(saved);
  writeJson(NOTIFICATIONS_KEY, notifications);
  return notifications;
}

/* ── Account profile ──────────────────────────────────── */

export type { ProfileUpdate };

export async function updateAccountProfile(update: ProfileUpdate): Promise<User> {
  return apiUpdateProfile(update);
}

/* ── Security ─────────────────────────────────────────── */

export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<string> {
  return apiChangePassword(currentPassword, newPassword);
}

function parseUserAgent(ua: string | null | undefined): { device: string; browser: string } {
  if (!ua) return { device: "Unknown device", browser: "EngineerOS" };
  const device = /Windows/i.test(ua)
    ? "Windows PC"
    : /Macintosh|Mac OS/i.test(ua)
      ? "Mac"
      : /Android/i.test(ua)
        ? "Android device"
        : /iPhone|iPad/i.test(ua)
          ? "iOS device"
          : /Linux/i.test(ua)
            ? "Linux PC"
            : "Unknown device";
  const browser = /Edg\//i.test(ua)
    ? "Edge"
    : /OPR\//i.test(ua)
      ? "Opera"
      : /Chrome\//i.test(ua)
        ? "Chrome"
        : /Firefox\//i.test(ua)
          ? "Firefox"
          : /Safari\//i.test(ua)
            ? "Safari"
            : "EngineerOS";
  return { device, browser };
}

/** Live sessions from the account, newest first. */
export async function getActiveSessions(): Promise<ActiveSession[]> {
  const profile = await getMyProfile();
  return (profile.sessions ?? []).map((session) => {
    const { device, browser } = parseUserAgent(session.user_agent);
    return {
      id: session.id,
      device,
      browser,
      last_active: session.created_at,
      current: session.current,
    };
  });
}

/** Revokes every session except the current one. */
export async function signOutOtherSessions(): Promise<string> {
  return apiSignOutOtherSessions();
}

/** Revokes one session by id (ownership enforced server-side). */
export async function revokeSession(sessionId: string): Promise<string> {
  return apiRevokeSession(sessionId);
}
