/**
 * The six-step learning loop.
 */
import {
  ArrowRight,
  Bot,
  ChartNoAxesCombined,
  CircuitBoard,
  FlaskConical,
  Play,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { Reveal } from "./Reveal";
import { EASE_OUT, VIEWPORT } from "./landingMotion";

const STEPS = [
  {
    icon: CircuitBoard,
    title: "Build",
    description: "Place the parts from the lab palette and wire the starter circuit.",
  },
  {
    icon: Play,
    title: "Run",
    description: "Solve the circuit you built. The engine, not a drawing, produces the result.",
  },
  {
    icon: FlaskConical,
    title: "Measure",
    description: "Read the voltmeter, ammeter, and oscilloscope samples from that run.",
  },
  {
    icon: ChartNoAxesCombined,
    title: "Validate",
    description: "Compare the simulated curve with the theoretical reference for the same R, C, or L.",
  },
  {
    icon: Bot,
    title: "Understand",
    description: "Ask AI Mentor what the measurements mean. It does not invent the waveform.",
  },
];

function LandingHowItWorks() {
  const reduced = useReducedMotion();

  return (
    <section id="how-it-works" className="landing-section landing-section--band">
      <div className="landing-container">
        <Reveal>
          <p className="landing-eyebrow">The workflow</p>
          <h2 className="landing-h2">How EngineerOS works</h2>
        </Reveal>

        <ol className="landing-steps">
          {STEPS.map(({ icon: Icon, title, description }, index) => (
            <li key={title} style={{ position: "relative" }}>
              <motion.div
                className="landing-step"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={VIEWPORT}
                transition={{ duration: 0.5, delay: index * 0.08, ease: EASE_OUT }}
              >
                <div className="landing-step-top">
                  <motion.span
                    className="landing-step-icon"
                    initial={reduced ? undefined : { scale: 0.85 }}
                    whileInView={
                      reduced
                        ? undefined
                        : {
                            scale: [0.85, 1.12, 1],
                            boxShadow: [
                              "0 0 0px rgba(59,130,246,0)",
                              "0 0 20px rgba(59,130,246,0.5)",
                              "0 0 0px rgba(59,130,246,0)",
                            ],
                          }
                    }
                    viewport={VIEWPORT}
                    transition={{ duration: 0.9, delay: 0.15 + index * 0.08, ease: EASE_OUT }}
                  >
                    <Icon size={18} aria-hidden="true" />
                  </motion.span>
                  <span className="landing-step-num">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3>{title}</h3>
                <p>{description}</p>
              </motion.div>

              {index < STEPS.length - 1 && (
                <ArrowRight size={16} aria-hidden="true" className="landing-step-arrow" />
              )}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export default LandingHowItWorks;
