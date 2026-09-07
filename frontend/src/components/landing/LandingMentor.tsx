/**
 * AI Mentor spotlight: chat preview on the left, value points on the right.
 */
import { Check } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { Reveal } from "./Reveal";
import { MentorRobotArt } from "./illustrations";
import { EASE_OUT, VIEWPORT } from "./landingMotion";

const CHECKS = [
  "Ask anything about your circuit or theory",
  "Get step-by-step explanations",
  "Understand with clarity and confidence",
  "Available 24/7",
];

const ANSWER_LINES = [
  "The LED stays dim because R1 drops most of the source voltage.",
  "Lower R1 and the current through the branch rises, so the LED brightens.",
];

function LandingMentor() {
  const reduced = useReducedMotion();

  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-[35%] top-[-60px] h-[440px] w-[440px] rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(37,99,235,0.16), rgba(5,7,13,0) 70%)" }}
      />

      <div className="relative mx-auto grid w-full max-w-[1280px] items-center gap-12 px-6 py-14 sm:px-8 sm:py-[72px] lg:grid-cols-2 lg:gap-16 lg:py-[120px]">
        <Reveal className="order-2 flex flex-col items-center gap-8 lg:order-1">
          <motion.div
            className="relative flex items-center justify-center"
            animate={reduced ? undefined : { scale: [1, 1.03, 1] }}
            transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 blur-2xl"
              style={{
                background: "radial-gradient(circle, rgba(59,130,246,0.30), rgba(5,7,13,0) 68%)",
              }}
            />
            <MentorRobotArt />
          </motion.div>

          <div className="w-full max-w-[440px] rounded-2xl border border-[#1F2937]/60 bg-[#0D1117] p-5 shadow-[0_24px_70px_-40px_rgba(37,99,235,0.7)]">
            <div className="flex justify-end">
              <p className="max-w-[80%] rounded-2xl rounded-br-md bg-[#2563EB] px-4 py-2.5 text-sm leading-relaxed text-white">
                Why is my LED dim in this circuit?
              </p>
            </div>

            <div className="mt-4 flex gap-3">
              <span className="mt-1 inline-flex h-7 w-7 flex-none items-center justify-center rounded-full border border-[#1F2937] bg-[#111827] text-[11px] font-bold text-[#3B82F6]">
                AI
              </span>
              <div className="max-w-[85%] rounded-2xl rounded-bl-md border border-[#1F2937] bg-[#111827] px-4 py-3">
                {ANSWER_LINES.map((line, i) => (
                  <motion.p
                    key={line}
                    className="text-sm leading-relaxed text-[#D1D5DB] [&:not(:first-child)]:mt-2"
                    initial={{ opacity: 0, y: 6 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={VIEWPORT}
                    transition={{ duration: 0.5, delay: 0.35 + i * 0.5, ease: EASE_OUT }}
                  >
                    {line}
                  </motion.p>
                ))}
              </div>
            </div>
          </div>
        </Reveal>

        <div className="order-1 lg:order-2">
          <Reveal>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#3B82F6]">
              AI Mentor
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Your <span className="text-[#3B82F6]">AI Engineering Mentor</span>
            </h2>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-[#9CA3AF]">
              Get instant, accurate and concept-based explanations for your questions.
              Understand the why behind every result.
            </p>
          </Reveal>

          <ul className="mt-8 space-y-3.5">
            {CHECKS.map((item, i) => (
              <motion.li
                key={item}
                className="flex items-center gap-3 text-sm text-[#D1D5DB]"
                initial={{ opacity: 0, x: -12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={VIEWPORT}
                transition={{ duration: 0.45, delay: i * 0.12, ease: EASE_OUT }}
              >
                <span className="inline-flex h-6 w-6 flex-none items-center justify-center rounded-full border border-[#2563EB]/60 bg-[#2563EB]/15 text-[#60A5FA]">
                  <Check size={13} aria-hidden="true" />
                </span>
                {item}
              </motion.li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

export default LandingMentor;
