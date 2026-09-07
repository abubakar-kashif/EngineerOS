/**
 * Shared motion tokens for the public landing page.
 * Kept separate from the app's CSS motion tokens so the marketing page can be
 * tuned without touching the authenticated product styles.
 */
import type { Variants } from "framer-motion";

/** Full cinematic intro plays once per browser session (demo-day reloads stay fast). */
export const INTRO_SESSION_KEY = "engineeros:landing-intro-played";

export const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

/** Intro sequence milestones in ms, measured from the first animation frame. */
export const INTRO_TIMING = {
  chargeEnd: 600,
  convergeEnd: 1500,
  revealEnd: 2200,
  /** Overlay cross-fade duration in seconds (phase 4). */
  handoff: 0.4,
} as const;

export const VIEWPORT = { once: true, amount: 0.2 } as const;

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE_OUT } },
};

export function staggerParent(staggerChildren = 0.1): Variants {
  return {
    hidden: {},
    visible: { transition: { staggerChildren, delayChildren: 0.05 } },
  };
}
