import type { ReactNode } from "react";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info" | "primary" | "accent";
type BadgeSize = "sm" | "md";

type BadgeProps = {
  children: ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  className?: string;
};

function Badge({
  children,
  variant = "default",
  size = "md",
  className = "",
}: BadgeProps) {
  return (
    <span
      className={`ui-badge ui-badge-${variant}${size === "sm" ? " ui-badge-sm" : ""} ${className}`}
    >
      {children}
    </span>
  );
}

export default Badge;
