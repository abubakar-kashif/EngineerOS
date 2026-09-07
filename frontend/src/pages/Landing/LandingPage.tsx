/**
 * Public, pre-login marketing page served at "/".
 *
 * The cinematic intro is a pre-page gate: while it plays, the landing UI is
 * not mounted. After skip/finish (or on repeat visits), only the landing page
 * shows — the intro never lives inside the page content.
 */
import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import IntroOverlay from "../../components/landing/IntroOverlay";
import AmbientBackground from "../../components/landing/AmbientBackground";
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
      <AnimatePresence mode="wait">
        {introPlaying ? (
          <IntroOverlay key="intro" onFinish={handleIntroFinish} />
        ) : (
          <motion.div
            key="landing"
            className="landing-page"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: introMode === "full" ? 0.45 : 0.35 }}
          >
            <AmbientBackground />
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
        )}
      </AnimatePresence>
    </MotionConfig>
  );
}

export default LandingPage;
