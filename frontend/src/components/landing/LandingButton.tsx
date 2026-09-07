/**
 * Landing-page button/link with consistent hover-lift + tap-press motion.
 * Renders a router Link, an anchor, or a button depending on the props given.
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
  /** Stretch to the full width of the parent (used in the mobile menu). */
  block?: boolean;
}

const base =
  "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6] focus-visible:ring-offset-2 focus-visible:ring-offset-[#05070D]";

const variants: Record<Variant, string> = {
  primary:
    "bg-[#2563EB] text-white shadow-[0_10px_30px_-12px_rgba(37,99,235,0.9)] hover:bg-[#3B82F6] hover:shadow-[0_16px_44px_-12px_rgba(59,130,246,0.95)]",
  secondary:
    "border border-solid border-[#4B5563] bg-[#0D1117]/80 text-[#E5E7EB] hover:border-[#3B82F6] hover:text-white",
  ghost:
    "border border-solid border-[#4B5563] bg-transparent text-[#E5E7EB] hover:border-[#3B82F6] hover:bg-[#0D1117] hover:text-white",
};

const sizes = {
  md: "px-4 py-2.5 text-sm",
  lg: "px-6 py-3.5 text-[15px]",
};

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
  const classes = `${base} ${variants[variant]} ${sizes[size]} ${
    block ? "w-full" : ""
  } ${className}`;

  const inner = to ? (
    <Link to={to} className={classes} aria-label={ariaLabel}>
      {children}
    </Link>
  ) : href ? (
    <a
      href={href}
      // An in-page handler takes over so smooth scrolling isn't pre-empted by
      // the browser's instant hash jump.
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
      className={block ? "flex w-full" : "inline-flex"}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 26 }}
    >
      {inner}
    </motion.span>
  );
}

export default LandingButton;
