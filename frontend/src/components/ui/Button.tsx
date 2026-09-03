import type { ReactNode } from "react";
import { Link } from "react-router-dom";

type ButtonVariant = "primary" | "secondary" | "ghost" | "outline" | "danger";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  type?: "button" | "submit" | "reset";
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  to?: string;
  icon?: ReactNode;
  iconPosition?: "left" | "right";
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "ui-button-sm",
  md: "",
  lg: "ui-button-lg",
};

function Button({
  children,
  variant = "primary",
  size = "md",
  type = "button",
  onClick,
  disabled = false,
  loading = false,
  className = "",
  to,
  icon,
  iconPosition = "left",
}: ButtonProps) {
  const classes = [
    "ui-button",
    `ui-button-${variant}`,
    sizeClasses[size],
    loading ? "ui-button-loading" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const content = (
    <>
      {icon && iconPosition === "left" && !loading && (
        <span className="ui-button-icon">{icon}</span>
      )}
      {children}
      {icon && iconPosition === "right" && !loading && (
        <span className="ui-button-icon">{icon}</span>
      )}
    </>
  );

  if (to) {
    return (
      <Link to={to} className={classes}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={classes}
    >
      {content}
    </button>
  );
}

export default Button;
