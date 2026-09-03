/**
 * User account API service — the single client for the Users endpoints
 * (docs/API_CONTRACT.md §5). Profile updates, password changes, and
 * account-level preferences all live here.
 */
import { apiRequest } from "./api";
import type { User, UserPreferences } from "../types/auth";

export interface ProfileUpdate {
  name?: string;
  avatar_url?: string | null;
}

interface ChangePasswordResponse {
  message: string;
}

/** Full account payload: profile + preferences + live sessions. */
export async function getMyProfile(): Promise<User> {
  return apiRequest<User>("/users/me");
}

export async function updateProfile(update: ProfileUpdate): Promise<User> {
  const body: Record<string, unknown> = {};
  if (update.name !== undefined) body.name = update.name;
  if (update.avatar_url !== undefined) body.avatar_url = update.avatar_url;

  return apiRequest<User>("/users/me", {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

/**
 * Changes the account password. The current session stays valid; every
 * other session is revoked server-side.
 */
export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<string> {
  const response = await apiRequest<ChangePasswordResponse>("/users/me/password", {
    method: "PUT",
    body: JSON.stringify({
      current_password: currentPassword,
      new_password: newPassword,
    }),
  });
  return response.message;
}

/** Revokes every session except the current one. */
export async function signOutOtherSessions(): Promise<string> {
  const response = await apiRequest<ChangePasswordResponse>("/users/me/sessions", {
    method: "DELETE",
  });
  return response.message;
}

/** Revokes one session by id (ownership enforced server-side). */
export async function revokeSession(sessionId: string): Promise<string> {
  const response = await apiRequest<ChangePasswordResponse>(
    `/users/me/sessions/${sessionId}`,
    { method: "DELETE" },
  );
  return response.message;
}

export async function getPreferences(): Promise<UserPreferences> {
  return apiRequest<UserPreferences>("/users/me/preferences");
}

/** Partial update — only the provided fields change. */
export async function updatePreferences(
  patch: Partial<UserPreferences>,
): Promise<UserPreferences> {
  return apiRequest<UserPreferences>("/users/me/preferences", {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}
