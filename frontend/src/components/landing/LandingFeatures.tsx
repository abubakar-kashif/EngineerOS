/**
 * Feature grid — what the platform gives a learner.
 */
import { Bot, ChartNoAxesCombined, CircuitBoard, ClipboardList, Zap } from "lucide-react";
import { Reveal, RevealGroup, RevealItem } from "./Reveal";

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
    <section id="features" className="landing-section">
      <div
        aria-hidden="true"
        className="landing-glow"
        style={{
          right: "-80px",
          top: "40px",
          width: 380,
          height: 380,
          background: "radial-gradient(circle, rgba(124,58,237,0.12), transparent 70%)",
        }}
      />

      <div className="landing-container">
        <Reveal>
          <p className="landing-eyebrow">Features</p>
          <h2 className="landing-h2">Everything you need to understand circuits</h2>
        </Reveal>

        <RevealGroup className="landing-feature-grid" stagger={0.09}>
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <RevealItem key={title}>
              <article className="landing-card">
                <span className="landing-card-icon">
                  <Icon size={20} aria-hidden="true" />
                </span>
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}

export default LandingFeatures;
