/**
 * Feature grid — what the platform gives a learner.
 */
import { Bot, ChartNoAxesCombined, CircuitBoard, ClipboardList, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { Reveal, RevealGroup, RevealItem } from "./Reveal";
import { LANDING_CONTAINER, LANDING_SECTION } from "./landingLayout";

const FEATURES = [
  {
    icon: Zap,
    title: "Interactive Experiments",
    description: "Step-by-step experiments designed to build real understanding.",
  },
  {
    icon: CircuitBoard,
    title: "Circuit Simulation",
    description: "Build any circuit and simulate it in a powerful interactive workspace.",
  },
  {
    icon: ChartNoAxesCombined,
    title: "Measurements & Analysis",
    description: "Inspect voltage, current, power and see real-time graphs.",
  },
  {
    icon: Bot,
    title: "AI Mentor",
    description: "Ask questions and get clear, concept-based explanations.",
  },
  {
    icon: ClipboardList,
    title: "Quizzes & Reports",
    description: "Test what you learned and generate detailed lab reports.",
  },
];

function LandingFeatures() {
  return (
    <section id="features" className={`${LANDING_SECTION} overflow-hidden`}>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-[-10%] top-10 h-[420px] w-[420px] rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(124,58,237,0.12), rgba(5,7,13,0) 70%)" }}
      />

      <div className={`${LANDING_CONTAINER} relative`}>
        <Reveal className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#3B82F6]">
            Features
          </p>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-[2.5rem] sm:leading-tight">
            Everything you need to understand circuits
          </h2>
        </Reveal>

        <RevealGroup
          className="mt-14 grid gap-6 sm:grid-cols-2 lg:mt-16 lg:grid-cols-3 lg:gap-7"
          stagger={0.09}
        >
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <RevealItem key={title}>
              <motion.article
                whileHover={{ y: -4 }}
                transition={{ type: "spring", stiffness: 320, damping: 24 }}
                className="group h-full rounded-2xl border border-[#1F2937]/60 bg-[#0D1117] p-7 transition-colors duration-300 hover:border-[#3B82F6] hover:shadow-[0_18px_50px_-24px_rgba(59,130,246,0.85)]"
              >
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[#1F2937] bg-[#111827] text-[#3B82F6] transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110">
                  <Icon size={20} aria-hidden="true" />
                </span>
                <h3 className="mt-6 text-lg font-semibold tracking-tight text-white">{title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-[#9CA3AF]">{description}</p>
              </motion.article>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}

export default LandingFeatures;
