/**
 * Public, pre-login marketing page served at "/".
 * Self-contained: it renders its own navbar/footer and never mounts the
 * authenticated app shell.
 */
import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import IntroOverlay from "../../components/landing/IntroOverlay";
import LandingNavbar from "../../components/landing/LandingNavbar";
import LandingHero from "../../components/landing/LandingHero";
import LandingFeatures from "../../components/landing/LandingFeatures";
import LandingHowItWorks from "../../components/landing/LandingHowItWorks";
import LandingMentor from "../../components/landing/LandingMentor";
import LandingStats from "../../components/landing/LandingStats";
import LandingFinalCTA from "../../components/landing/LandingFinalCTA";
import LandingFooter from "../../components/landing/LandingFooter";
import { INTRO_SESSION_KEY } from "../../components/landing/landingMotion";

type IntroMode = "full" | "short" | "none";

/**
 * Decided once, synchronously, so the overlay never mounts and then vanishes:
 * reduced motion skips the intro entirely, and repeat visits in the same
 * session get a short fade instead of the full sequence.
 */
function resolveIntroMode(): IntroMode {
  if (typeof window === "undefined") return "none";
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return "none";
  try {
    if (window.sessionStorage.getItem(INTRO_SESSION_KEY)) return "short";
  } catch {
    /* sessionStorage unavailable (private mode) — fall through to the full intro */
  }
  return "full";
}

function LandingPage() {
  const [introMode] = useState<IntroMode>(resolveIntroMode);
  const [introPlaying, setIntroPlaying] = useState(introMode === "full");

  useEffect(() => {
    try {
      window.sessionStorage.setItem(INTRO_SESSION_KEY, "1");
    } catch {
      /* sessionStorage unavailable — the intro simply plays again next load */
    }
  }, []);

  const handleIntroFinish = useCallback(() => setIntroPlaying(false), []);

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-[linear-gradient(180deg,#05070D_0%,#0A0E17_45%,#05070D_100%)] text-white antialiased">
        <AnimatePresence>
          {introPlaying && <IntroOverlay key="intro" onFinish={handleIntroFinish} />}
        </AnimatePresence>

        <motion.div
          initial={introMode === "short" ? { opacity: 0 } : false}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          <LandingNavbar />
          <main>
            <LandingHero />
            <LandingFeatures />
            <LandingHowItWorks />
            <LandingMentor />
            <LandingStats />
            <LandingFinalCTA />
          </main>
          <LandingFooter />
        </motion.div>
      </div>
    </MotionConfig>
  );
}

export default LandingPage;
