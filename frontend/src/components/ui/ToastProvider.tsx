import { useEffect, type ReactNode } from "react";
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from "lucide-react";
import { useToastState, type Toast, type ToastType } from "./useToast";

const iconMap: Record<ToastType, ReactNode> = {
  success: <CheckCircle2 size={18} />,
  error: <AlertCircle size={18} />,
  info: <Info size={18} />,
  warning: <AlertTriangle size={18} />,
};

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  useEffect(() => {
    const duration = toast.duration ?? 5000;
    if (duration > 0) {
      const timer = setTimeout(() => onRemove(toast.id), duration);
      return () => clearTimeout(timer);
    }
  }, [toast.id, toast.duration, onRemove]);

  return (
    <div className={`ui-toast ui-toast-${toast.type} animate-toast-slide`} role="alert">
      <span className="ui-toast-icon">{iconMap[toast.type]}</span>
      <div className="ui-toast-body">
        <p className="ui-toast-title">{toast.title}</p>
        {toast.description && <p className="ui-toast-description">{toast.description}</p>}
      </div>
      <button
        className="ui-toast-close"
        onClick={() => onRemove(toast.id)}
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  );
}

function ToastProvider({ children }: { children: ReactNode }) {
  const { toasts, removeToast } = useToastState();

  return (
    <>
      {children}
      <div className="ui-toast-container" aria-live="polite">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onRemove={removeToast} />
        ))}
      </div>
    </>
  );
}

export default ToastProvider;
