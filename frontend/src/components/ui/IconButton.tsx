import type { ReactNode } from "react";

type IconButtonVariant = "default" | "primary" | "ghost" | "danger";
type IconButtonSize = "sm" | "md" | "lg";

type IconButtonProps = {
  icon: ReactNode;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
};

function IconButton({
  icon,
  variant = "default",
  size = "md",
  label,
  onClick,
  disabled = false,
  className = "",
}: IconButtonProps) {
  return (
    <button
      className={`ui-icon-button ui-icon-button-${variant} ui-icon-button-${size} ${className}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      type="button"
    >
      {icon}
    </button>
  );
}

export default IconButton;
