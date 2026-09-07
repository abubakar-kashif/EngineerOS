/**
 * Public, pre-login marketing page served at "/".
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
import "../../components/landing/landing.css";

type IntroMode = "full" | "short" | "none";

function resolveIntroMode(): IntroMode {
  if (typeof window === "undefined") return "none";
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return "none";
  try {
    if (window.sessionStorage.getItem(INTRO_SESSION_KEY)) return "short";
  } catch {
    /* sessionStorage unavailable */
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
      /* sessionStorage unavailable */
    }
  }, []);

  const handleIntroFinish = useCallback(() => setIntroPlaying(false), []);

  return (
    <MotionConfig reducedMotion="user">
      <div className="landing-page">
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
