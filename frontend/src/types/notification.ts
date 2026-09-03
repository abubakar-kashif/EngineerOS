/**
 * Notification shapes returned by the backend Notifications API
 * (see docs/API_CONTRACT.md §6). Notifications are persisted per user;
 * unread state survives refreshes and devices.
 */

export interface AppNotification {
  id: number;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  /** Optional structured context (experiment id, score, …). */
  metadata: Record<string, unknown> | null;
}

export interface NotificationList {
  items: AppNotification[];
  unread_count: number;
  total: number;
}

export interface MarkAllReadResult {
  message: string;
  updated: number;
}
