/**
 * Notifications API service (docs/API_CONTRACT.md §6).
 * All endpoints require authentication.
 */
import { apiRequest } from "./api";
import type {
  AppNotification,
  MarkAllReadResult,
  NotificationList,
} from "../types/notification";

/** Newest-first notification list plus the unread counter. */
export async function getNotifications(): Promise<NotificationList> {
  return apiRequest<NotificationList>("/notifications");
}

/** Marks a single notification as read; clicking it again is a no-op. */
export async function markNotificationRead(id: number): Promise<AppNotification> {
  return apiRequest<AppNotification>(`/notifications/${id}/read`, {
    method: "POST",
  });
}

/** Marks every notification as read. */
export async function markAllNotificationsRead(): Promise<MarkAllReadResult> {
  return apiRequest<MarkAllReadResult>("/notifications/read-all", {
    method: "POST",
  });
}
