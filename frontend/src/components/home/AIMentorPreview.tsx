import { Brain, ArrowRight } from "lucide-react";
import Card from "../ui/Card";
import Button from "../ui/Button";
import SectionHeading from "../ui/SectionHeading";

function AIMentorPreview() {
  return (
    <section className="home-section">
      <SectionHeading
        eyebrow="AI LAB MENTOR"
        title="Your engineering context, understood"
        description="The AI Mentor helps you connect experiment results to theory and understand why your measurements differ from predictions."
      />

      <Card className="home-mentor-card mb-8">
        <div className="home-mentor-layout">
          <div className="home-mentor-info">
            <div className="home-mentor-icon">
              <Brain size={28} />
            </div>
            <div>
              <h3 className="home-mentor-title">AI Lab Mentor</h3>
              <p className="home-mentor-desc">
                Intelligent guidance that understands your experiment context,
                simulation results, and learning progress.
              </p>
            </div>
          </div>

          <div className="home-mentor-context">
            <div className="home-mentor-row">
              <span className="home-mentor-label">Experiment:</span>
              <span className="home-mentor-value">Ohm&apos;s Law</span>
            </div>
            <div className="home-mentor-row">
              <span className="home-mentor-label">Simulation:</span>
              <span className="home-mentor-value home-mentor-value--ready">Ready</span>
            </div>
            <div className="home-mentor-row">
              <span className="home-mentor-label">Validation:</span>
              <span className="home-mentor-value">Not run</span>
            </div>
          </div>

          <div className="home-mentor-suggestion">
            <p className="home-mentor-suggestion-label">Suggested question:</p>
            <p className="home-mentor-suggestion-text">
              &quot;Why is my current different from expected?&quot;
            </p>
          </div>
        </div>

        <div className="home-section-action">
          <Button to="/mentor" variant="secondary">
            Explore AI Mentor <ArrowRight size={14} />
          </Button>
        </div>
      </Card>
    </section>
  );
}

export default AIMentorPreview;