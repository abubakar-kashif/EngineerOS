import { AlertCircle, CheckCircle2, AlertTriangle, Info, X } from "lucide-react";
import type { ReactNode } from "react";

type AlertVariant = "info" | "success" | "warning" | "error";

type AlertProps = {
  variant?: AlertVariant;
  title?: string;
  description?: ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
};

const icons: Record<AlertVariant, typeof Info> = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  error: AlertCircle,
};

function Alert({
  variant = "info",
  title,
  description,
  dismissible = false,
  onDismiss,
  className = "",
}: AlertProps) {
  const Icon = icons[variant];

  return (
    <div className={`ui-alert ui-alert-${variant} ${className}`} role="alert">
      <span className="ui-alert-icon">
        <Icon size={18} />
      </span>
      <div className="ui-alert-content">
        {title && <p className="ui-alert-title">{title}</p>}
        {description && <div className="ui-alert-description">{description}</div>}
      </div>
      {dismissible && (
        <button
          type="button"
          className="ui-alert-dismiss"
          onClick={onDismiss}
          aria-label="Dismiss"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}

export default Alert;
