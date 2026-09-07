/**
 * Hero: value proposition, primary CTAs, trust badges and the circuit artwork.
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
    <section id="product" className="relative scroll-mt-24 overflow-hidden">
      {/* off-centre depth glows */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-40 top-[-120px] h-[520px] w-[520px] rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(37,99,235,0.20), rgba(5,7,13,0) 70%)" }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 top-[220px] h-[460px] w-[460px] rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(34,211,238,0.14), rgba(5,7,13,0) 70%)" }}
      />

      <div className="relative mx-auto grid w-full max-w-[1280px] items-center gap-12 px-6 py-14 sm:px-8 sm:py-[72px] lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:py-[120px]">
        <div>
          <motion.span
            className="inline-flex items-center gap-2 rounded-full border border-[#1F2937]/70 bg-[#0D1117]/70 px-3.5 py-1.5 text-xs font-medium text-[#93C5FD]"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE_OUT }}
          >
            <Zap size={13} aria-hidden="true" />
            The Complete Electrical Engineering Learning Platform
          </motion.span>

          <motion.h1
            className="mt-6 text-4xl font-bold leading-[1.06] tracking-tight text-white sm:text-5xl lg:text-[58px]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.06, ease: EASE_OUT }}
          >
            Learn Electrical Engineering by{" "}
            <span className="text-[#3B82F6]">Building It.</span>
          </motion.h1>

          <motion.p
            className="mt-6 max-w-xl text-base leading-relaxed text-[#9CA3AF] sm:text-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.12, ease: EASE_OUT }}
          >
            EngineerOS connects theory with real understanding. Build circuits, run
            simulations, take measurements, and get AI-powered explanations.
          </motion.p>

          <motion.div
            className="mt-9 flex flex-wrap items-center gap-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.18, ease: EASE_OUT }}
          >
            <LandingButton to="/register" variant="primary" size="lg">
              Get Started Free <ArrowRight size={16} aria-hidden="true" />
            </LandingButton>
            <LandingButton
              href="#how-it-works"
              variant="secondary"
              size="lg"
              onClick={scrollToHowItWorks}
            >
              <Play size={15} aria-hidden="true" /> See How It Works
            </LandingButton>
          </motion.div>

          <motion.ul
            className="mt-10 flex flex-wrap gap-x-7 gap-y-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.26 }}
          >
            {TRUST.map(({ icon: Icon, strong, rest }) => (
              <li key={strong} className="flex items-center gap-2 text-[13px] text-[#9CA3AF]">
                <Icon size={15} className="text-[#3B82F6]" aria-hidden="true" />
                <span className="font-semibold text-[#E5E7EB]">{strong}</span>
                <span aria-hidden="true">—</span>
                {rest}
              </li>
            ))}
          </motion.ul>
        </div>

        <motion.div
          className="relative flex justify-center lg:justify-end"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.1, ease: EASE_OUT }}
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 translate-y-6 blur-3xl"
            style={{
              background: "radial-gradient(circle at 55% 45%, rgba(37,99,235,0.28), rgba(5,7,13,0) 65%)",
            }}
          />
          <motion.div
            className="relative w-full max-w-[640px]"
            animate={reduced ? undefined : { y: [0, -14, 0] }}
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
