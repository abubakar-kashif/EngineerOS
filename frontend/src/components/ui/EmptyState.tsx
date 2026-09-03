import type { ReactNode } from "react";

type EmptyStateProps = {
  icon?: ReactNode;
  title?: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

function EmptyState({ icon, title, description, action, className = "" }: EmptyStateProps) {
  return (
    <div className={`state-container ${className}`}>
      {icon && <div className="state-icon">{icon}</div>}
      {title && <h3 className="state-title">{title}</h3>}
      {description && <p className="state-description">{description}</p>}
      {action && <div className="state-action">{action}</div>}
    </div>
  );
}

export default EmptyState;
