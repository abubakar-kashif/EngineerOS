import { BookOpen, ShieldCheck, BarChart3, Brain } from "lucide-react";
import SectionHeading from "../ui/SectionHeading";

const reasons = [
  {
    icon: BookOpen,
    title: "Learn with context",
    desc: "Understand the theory behind the circuit — not just the formula.",
  },
  {
    icon: ShieldCheck,
    title: "Experiment safely",
    desc: "Build and test circuits without physical hardware first.",
  },
  {
    icon: BarChart3,
    title: "Validate your understanding",
    desc: "Connect theory to measurable results and see where predictions match reality.",
  },
  {
    icon: Brain,
    title: "Get intelligent guidance",
    desc: "Understand why results differ and what your measurements really mean.",
  },
];

function WhyEngineerOS() {
  return (
    <section className="home-section home-why-section">
      <SectionHeading
        eyebrow="WHY ENGINEEROS"
        title="Built for how engineers actually learn"
      />

      <div className="home-why-grid">
        {reasons.map((r) => (
          <div key={r.title} className="home-why-item">
            <div className="home-why-icon">
              <r.icon size={22} />
            </div>
            <h3>{r.title}</h3>
            <p>{r.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default WhyEngineerOS;
