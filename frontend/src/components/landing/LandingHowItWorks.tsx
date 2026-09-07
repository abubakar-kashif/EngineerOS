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
      className="relative scroll-mt-24 overflow-hidden border-y border-[#1F2937]/40 bg-[#070A12]"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-[-8%] bottom-0 h-[380px] w-[380px] rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(34,211,238,0.10), rgba(5,7,13,0) 70%)" }}
      />

      <div className="relative mx-auto w-full max-w-[1280px] px-6 py-14 sm:px-8 sm:py-[72px] lg:py-[120px]">
        <Reveal className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#3B82F6]">
            The workflow
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            How EngineerOS works
          </h2>
        </Reveal>

        <ol className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 xl:gap-4">
          {STEPS.map(({ icon: Icon, title, description }, index) => (
            <li key={title} className="relative">
              <motion.div
                className="group h-full rounded-2xl border border-[#1F2937]/60 bg-[#0D1117] p-5 transition-colors duration-300 hover:border-[#3B82F6] hover:shadow-[0_18px_50px_-24px_rgba(59,130,246,0.85)]"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={VIEWPORT}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.5, delay: index * 0.09, ease: EASE_OUT }}
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
                    transition={{ duration: 0.9, delay: 0.2 + index * 0.09, ease: EASE_OUT }}
                  >
                    <Icon size={18} aria-hidden="true" />
                  </motion.span>
                  <span className="text-xs font-semibold text-[#4B5563]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="mt-4 text-base font-semibold tracking-tight text-white">{title}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-[#9CA3AF]">{description}</p>
              </motion.div>

              {index < STEPS.length - 1 && (
                <ArrowRight
                  size={16}
                  aria-hidden="true"
                  className="absolute -right-3 top-1/2 hidden -translate-y-1/2 text-[#374151] xl:block"
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
