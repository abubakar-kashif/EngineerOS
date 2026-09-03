import type { ReactNode } from "react";

type CardVariant = "default" | "elevated" | "outlined" | "muted";
type CardPadding = "none" | "sm" | "md" | "lg";

type CardProps = {
  children: ReactNode;
  variant?: CardVariant;
  padding?: CardPadding;
  hoverable?: boolean;
  className?: string;
  onClick?: () => void;
};

const paddingStyles: Record<CardPadding, string> = {
  none: "",
  sm: "ui-card-p-sm",
  md: "ui-card-p-md",
  lg: "ui-card-p-lg",
};

function Card({
  children,
  variant = "default",
  padding = "md",
  hoverable = false,
  className = "",
  onClick,
}: CardProps) {
  const classes = [
    "ui-card",
    variant !== "default" ? `ui-card-${variant}` : "",
    paddingStyles[padding],
    hoverable ? "ui-card-hoverable" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes} onClick={onClick} role={onClick ? "button" : undefined} tabIndex={onClick ? 0 : undefined}>
      {children}
    </div>
  );
}

export default Card;
