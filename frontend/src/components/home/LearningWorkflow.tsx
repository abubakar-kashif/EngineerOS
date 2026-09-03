import {
  BookOpen,
  FlaskConical,
  Wrench,
  Play,
  CheckCircle2,
  BarChart3,
  Brain,
  ClipboardCheck,
  FileText,
  TrendingUp,
} from "lucide-react";
import SectionHeading from "../ui/SectionHeading";

const steps = [
  { num: "01", label: "Theory", icon: BookOpen, desc: "Understand the engineering concept and theoretical foundations." },
  { num: "02", label: "Experiment", icon: FlaskConical, desc: "Apply concepts through practical experiments." },
  { num: "03", label: "Circuit Setup", icon: Wrench, desc: "Build the circuit and configure components." },
  { num: "04", label: "Simulation", icon: Play, desc: "Run simulations and observe circuit behavior." },
  { num: "05", label: "Validation", icon: CheckCircle2, desc: "Compare measured results with theoretical predictions." },
  { num: "06", label: "Results", icon: BarChart3, desc: "Analyze data and interpret findings." },
  { num: "07", label: "AI Explanation", icon: Brain, desc: "Get intelligent guidance on your observations." },
  { num: "08", label: "Quiz", icon: ClipboardCheck, desc: "Test your understanding with targeted questions." },
  { num: "09", label: "Lab Report", icon: FileText, desc: "Document your experiment and conclusions." },
  { num: "10", label: "Progress", icon: TrendingUp, desc: "Track your learning journey over time." },
];

function LearningWorkflow() {
  return (
    <section id="learning-workflow" className="home-section home-workflow-section">
      <SectionHeading
        eyebrow="LEARNING WORKFLOW"
        title="From theory to understanding"
        description="EngineerOS connects every stage of the engineering learning process into one structured workflow."
      />

      <div className="home-workflow-grid">
        {steps.map((step) => (
          <div key={step.num} className="home-workflow-step">
            <span className="home-workflow-num">{step.num}</span>
            <step.icon size={22} className="home-workflow-icon" />
            <h3 className="home-workflow-label">{step.label}</h3>
            <p className="home-workflow-desc">{step.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default LearningWorkflow;
