/**
 * The six-step learning loop, connected by arrows on wide screens.
 */
import {
  ArrowRight,
  Bot,
  BookOpen,
  ChartNoAxesCombined,
  CircuitBoard,
  FlaskConical,
  Play,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { Reveal } from "./Reveal";
import { EASE_OUT, VIEWPORT } from "./landingMotion";
import { LANDING_CONTAINER, LANDING_SECTION } from "./landingLayout";

const STEPS = [
  { icon: BookOpen, title: "Learn", description: "Read the theory and understand the concept." },
  {
    icon: FlaskConical,
    title: "Experiment",
    description: "Follow guided experiments and instructions.",
  },
  { icon: CircuitBoard, title: "Build", description: "Build the circuit in the workspace." },
  { icon: Play, title: "Simulate", description: "Run the simulation and see what happens." },
  {
    icon: ChartNoAxesCombined,
    title: "Analyze",
    description: "Check measurements, graphs and results.",
  },
  { icon: Bot, title: "Understand", description: "Ask AI Mentor and understand why." },
];

function LandingHowItWorks() {
  const reduced = useReducedMotion();

  return (
    <section
      id="how-it-works"
      className={`${LANDING_SECTION} overflow-hidden border-y border-[#1F2937]/40 bg-[#070A12]`}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-[-8%] h-[380px] w-[380px] rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(34,211,238,0.10), rgba(5,7,13,0) 70%)" }}
      />

      <div className={`${LANDING_CONTAINER} relative`}>
        <Reveal className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#3B82F6]">
            The workflow
          </p>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-[2.5rem] sm:leading-tight">
            How EngineerOS works
          </h2>
        </Reveal>

        {/* 2×3 on tablet/desktop keeps cards readable; 6-up only on very wide screens */}
        <ol className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:mt-16 lg:grid-cols-3 xl:grid-cols-6 xl:gap-5">
          {STEPS.map(({ icon: Icon, title, description }, index) => (
            <li key={title} className="relative">
              <motion.div
                className="group h-full rounded-2xl border border-[#1F2937]/60 bg-[#0D1117] p-6 transition-colors duration-300 hover:border-[#3B82F6] hover:shadow-[0_18px_50px_-24px_rgba(59,130,246,0.85)]"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={VIEWPORT}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.5, delay: index * 0.08, ease: EASE_OUT }}
              >
                <div className="flex items-center gap-3">
                  <motion.span
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#1F2937] bg-[#111827] text-[#3B82F6]"
                    initial={reduced ? undefined : { scale: 0.8 }}
                    whileInView={
                      reduced
                        ? undefined
                        : {
                            scale: [0.8, 1.14, 1],
                            boxShadow: [
                              "0 0 0px rgba(59,130,246,0)",
                              "0 0 22px rgba(59,130,246,0.55)",
                              "0 0 0px rgba(59,130,246,0)",
                            ],
                          }
                    }
                    viewport={VIEWPORT}
                    transition={{ duration: 0.9, delay: 0.2 + index * 0.08, ease: EASE_OUT }}
                  >
                    <Icon size={18} aria-hidden="true" />
                  </motion.span>
                  <span className="text-xs font-semibold text-[#4B5563]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="mt-5 text-base font-semibold tracking-tight text-white">{title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-[#9CA3AF]">{description}</p>
              </motion.div>

              {index < STEPS.length - 1 && (
                <ArrowRight
                  size={16}
                  aria-hidden="true"
                  className="absolute -right-[14px] top-1/2 z-10 hidden -translate-y-1/2 text-[#4B5563] xl:block"
                />
              )}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export default LandingHowItWorks;
