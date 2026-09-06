import { Brain, ArrowRight, HelpCircle } from "lucide-react";
import Card from "../ui/Card";
import Button from "../ui/Button";
import SectionHeading from "../ui/SectionHeading";

const prompts = [
  "What happened?",
  "Why did it happen?",
  "What went wrong?",
  "How can I fix it?",
];

function AIMentorPreview() {
  return (
    <section className="home-section home-section--panel" id="ai-mentor">
      <SectionHeading
        eyebrow="AI LAB MENTOR"
        title="Understand results with context"
        description="The AI Mentor helps you connect experiment results to theory — without inventing circuit state the simulator did not produce."
      />

      <Card className="home-mentor-card">
        <div className="home-mentor-layout">
          <div className="home-mentor-info">
            <div className="home-mentor-icon">
              <Brain size={28} />
            </div>
            <div>
              <h3 className="home-mentor-title">AI Lab Mentor</h3>
              <p className="home-mentor-desc">
                Ask about your latest simulation run, validation errors, and quiz context.
                Guidance stays grounded in EngineerOS simulator and experiment data.
              </p>
            </div>
          </div>

          <div className="home-mentor-prompts" aria-label="Example mentor questions">
            {prompts.map((q) => (
              <div key={q} className="home-mentor-prompt">
                <HelpCircle size={14} aria-hidden="true" />
                <span>{q}</span>
              </div>
            ))}
          </div>

          <div className="home-mentor-suggestion">
            <p className="home-mentor-suggestion-label">Example</p>
            <p className="home-mentor-suggestion-text">
              &quot;Why is my current different from the expected Ohm&apos;s law value?&quot;
            </p>
          </div>
        </div>

        <div className="home-section-action">
          <Button to="/mentor" variant="secondary">
            Open AI Mentor <ArrowRight size={14} />
          </Button>
        </div>
      </Card>
    </section>
  );
}

export default AIMentorPreview;
