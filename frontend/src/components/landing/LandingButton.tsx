/**
 * Landing-page button/link. Uses landing.css classes so spacing survives the
 * global `* { padding: 0 }` reset that zeros Tailwind utilities.
 */
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

type Variant = "primary" | "secondary" | "ghost";

interface LandingButtonProps {
  children: ReactNode;
  to?: string;
  href?: string;
  onClick?: () => void;
  variant?: Variant;
  size?: "md" | "lg";
  className?: string;
  ariaLabel?: string;
  block?: boolean;
}

function LandingButton({
  children,
  to,
  href,
  onClick,
  variant = "primary",
  size = "md",
  className = "",
  ariaLabel,
  block = false,
}: LandingButtonProps) {
  const classes = [
    "landing-btn",
    `landing-btn--${variant}`,
    size === "lg" ? "landing-btn--lg" : "",
    block ? "landing-btn--block" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const inner = to ? (
    <Link to={to} className={classes} aria-label={ariaLabel}>
      {children}
    </Link>
  ) : href ? (
    <a
      href={href}
      onClick={(event) => {
        if (!onClick) return;
        event.preventDefault();
        onClick();
      }}
      className={classes}
      aria-label={ariaLabel}
    >
      {children}
    </a>
  ) : (
    <button type="button" onClick={onClick} className={classes} aria-label={ariaLabel}>
      {children}
    </button>
  );

  return (
    <motion.span
      style={{ display: block ? "flex" : "inline-flex", width: block ? "100%" : undefined }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 26 }}
    >
      {inner}
    </motion.span>
  );
}

export default LandingButton;
