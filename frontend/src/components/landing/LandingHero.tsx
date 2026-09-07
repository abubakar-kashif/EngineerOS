/**
 * Hero: value proposition, primary CTAs, trust badges and the circuit schematic.
 */
import { ArrowRight, Globe, GraduationCap, Play, Zap } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import LandingButton from "./LandingButton";
import { HeroCircuitArt } from "./illustrations";
import { EASE_OUT } from "./landingMotion";

const TRUST = [
  { icon: Globe, strong: "No installation", rest: "100% web based" },
  { icon: Zap, strong: "Interactive", rest: "Learn by doing" },
  { icon: GraduationCap, strong: "For Everyone", rest: "Students & Teachers" },
];

function LandingHero() {
  const reduced = useReducedMotion();

  const scrollToHowItWorks = () => {
    const target = document.getElementById("how-it-works");
    target?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
  };

  return (
    <section id="product" className="landing-hero">
      <div
        aria-hidden="true"
        className="landing-glow"
        style={{
          left: "-120px",
          top: "-80px",
          width: 420,
          height: 420,
          background: "radial-gradient(circle, rgba(37,99,235,0.22), transparent 70%)",
        }}
      />

      <div className="landing-container landing-hero-grid">
        <div className="landing-hero-copy">
          <motion.span
            className="landing-pill"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE_OUT }}
          >
            <Zap size={14} aria-hidden="true" />
            The Complete Electrical Engineering Learning Platform
          </motion.span>

          <motion.h1
            className="landing-hero-title"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.06, ease: EASE_OUT }}
          >
            Learn Electrical Engineering by{" "}
            <span className="landing-hero-title-accent">Building It.</span>
          </motion.h1>

          <motion.p
            className="landing-hero-sub"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.12, ease: EASE_OUT }}
          >
            EngineerOS connects theory with real understanding. Build circuits, run
            simulations, take measurements, and get AI-powered explanations.
          </motion.p>

          <motion.div
            className="landing-hero-ctas"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.18, ease: EASE_OUT }}
          >
            <LandingButton to="/register" variant="primary" size="lg">
              Get Started Free <ArrowRight size={18} aria-hidden="true" />
            </LandingButton>
            <LandingButton
              href="#how-it-works"
              variant="secondary"
              size="lg"
              onClick={scrollToHowItWorks}
            >
              <Play size={16} aria-hidden="true" /> See How It Works
            </LandingButton>
          </motion.div>

          <motion.ul
            className="landing-trust"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.26 }}
          >
            {TRUST.map(({ icon: Icon, strong, rest }) => (
              <li key={strong} className="landing-trust-item">
                <span className="landing-trust-icon">
                  <Icon size={15} aria-hidden="true" />
                </span>
                <span>
                  <span className="landing-trust-strong">{strong}</span>
                  <span className="landing-trust-rest">{rest}</span>
                </span>
              </li>
            ))}
          </motion.ul>
        </div>

        <motion.div
          className="landing-hero-visual"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.1, ease: EASE_OUT }}
        >
          <div className="landing-hero-glow" aria-hidden="true" />
          <motion.div
            animate={reduced ? undefined : { y: [0, -10, 0] }}
            transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <HeroCircuitArt />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

export default LandingHero;
