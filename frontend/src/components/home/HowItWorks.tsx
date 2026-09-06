import { BookOpen, Wrench, PlayCircle, Lightbulb } from "lucide-react";
import SectionHeading from "../ui/SectionHeading";

const pillars = [
  {
    icon: BookOpen,
    step: "01",
    title: "Learn",
    desc: "Each experiment starts with the engineering concept — the equations, the physics, and why it matters.",
  },
  {
    icon: Wrench,
    step: "02",
    title: "Build",
    desc: "Construct circuits visually and assign component values in the simulation workspace.",
  },
  {
    icon: PlayCircle,
    step: "03",
    title: "Simulate",
    desc: "Run simulations with DC analysis, measurements, and graphs that reflect your circuit.",
  },
  {
    icon: Lightbulb,
    step: "04",
    title: "Understand",
    desc: "Connect results to theory with quizzes, lab reports, and AI Mentor guidance.",
  },
];

function HowItWorks() {
  return (
    <section className="home-section home-section--panel" id="how-it-works">
      <SectionHeading
        eyebrow="HOW IT WORKS"
        title="From concept to confidence in four steps"
        description="EngineerOS combines theory, hands-on simulation, and AI guidance into one structured learning path."
      />

      <div className="home-how-grid">
        {pillars.map((p) => (
          <div key={p.step} className="home-how-card animate-slide-up">
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
