/**
 * AI Mentor spotlight: chat preview + robot on the left, value points on the right.
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
    <section className="landing-section">
      <div
        aria-hidden="true"
        className="landing-glow"
        style={{
          left: "30%",
          top: "-40px",
          width: 420,
          height: 420,
          background: "radial-gradient(circle, rgba(37,99,235,0.16), transparent 70%)",
        }}
      />

      <div className="landing-container landing-mentor-grid">
        <Reveal className="landing-mentor-visual">
          <motion.div
            animate={reduced ? undefined : { scale: [1, 1.03, 1] }}
            transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
          >
            <MentorRobotArt />
          </motion.div>

          <div className="landing-chat">
            <p className="landing-chat-user">Why is my LED dim in this circuit?</p>
            <div className="landing-chat-ai">
              <span className="landing-chat-avatar">AI</span>
              <div className="landing-chat-bubble">
                {ANSWER_LINES.map((line, i) => (
                  <motion.p
                    key={line}
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

        <div className="landing-mentor-copy">
          <Reveal>
            <p className="landing-eyebrow">AI Mentor</p>
            <h2 className="landing-h2">
              Your <span style={{ color: "#3B82F6" }}>AI Engineering Mentor</span>
            </h2>
            <p className="landing-lead">
              Get instant, accurate and concept-based explanations for your questions.
              Understand the why behind every result.
            </p>
          </Reveal>

          <ul className="landing-checklist">
            {CHECKS.map((item, i) => (
              <motion.li
                key={item}
                initial={{ opacity: 0, x: -12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={VIEWPORT}
                transition={{ duration: 0.45, delay: i * 0.12, ease: EASE_OUT }}
              >
                <span className="landing-check">
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
