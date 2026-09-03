import { useState, useCallback, useEffect } from "react";

type ToastType = "success" | "error" | "info" | "warning";

type Toast = {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
};

type ToastContextValue = {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
};

let globalAddToast: ((toast: Omit<Toast, "id">) => void) | null = null;

export function useToastState(): ToastContextValue {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    globalAddToast = addToast;
  }, [addToast]);

  return { toasts, addToast, removeToast };
}

export const toast = {
  success: (title: string, description?: string, duration?: number) => {
    globalAddToast?.({ type: "success", title, description, duration });
  },
  error: (title: string, description?: string, duration?: number) => {
    globalAddToast?.({ type: "error", title, description, duration });
  },
  info: (title: string, description?: string, duration?: number) => {
    globalAddToast?.({ type: "info", title, description, duration });
  },
  warning: (title: string, description?: string, duration?: number) => {
    globalAddToast?.({ type: "warning", title, description, duration });
  },
};

export type { Toast, ToastType, ToastContextValue };
