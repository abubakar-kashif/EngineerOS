import { BookOpen, Wrench, Brain, TrendingUp } from "lucide-react";
import SectionHeading from "../ui/SectionHeading";

const pillars = [
  {
    icon: BookOpen,
    step: "1",
    title: "Learn the theory",
    desc: "Each experiment starts with the engineering concept — the equations, the physics, and why it matters.",
  },
  {
    icon: Wrench,
    step: "2",
    title: "Build & simulate",
    desc: "Construct circuits visually, assign component values, and run simulations with instant DC analysis.",
  },
  {
    icon: Brain,
    step: "3",
    title: "Ask the AI Mentor",
    desc: "Connect results back to theory. Ask why measurements differ, what went wrong, or how to improve.",
  },
  {
    icon: TrendingUp,
    step: "4",
    title: "Prove your understanding",
    desc: "Take quizzes, write lab reports, and track progress across experiments and topics.",
  },
];

function HowItWorks() {
  return (
    <section className="home-section">
      <SectionHeading
        eyebrow="HOW IT WORKS"
        title="From concept to confidence in four steps"
        description="EngineerOS combines theory, hands-on simulation, and AI guidance into one structured learning path."
      />

      <div className="home-how-grid">
        {pillars.map((p) => (
          <div key={p.step} className="home-how-card">
            <span className="home-how-step">{p.step}</span>
            <div className="home-how-icon">
              <p.icon size={20} />
            </div>
            <h3 className="home-how-title">{p.title}</h3>
            <p className="home-how-desc">{p.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default HowItWorks;