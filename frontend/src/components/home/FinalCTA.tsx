import Button from "../ui/Button";

function FinalCTA() {
  return (
    <section className="home-final-cta home-section--panel">
      <div className="home-final-cta-content">
        <p className="home-final-cta-eyebrow">Ready?</p>
        <h2 className="home-final-cta-title">Ready to build your understanding?</h2>
        <p className="home-final-cta-desc">
          Start with a guided experiment, run the simulator, then check your knowledge with a quiz.
        </p>
        <div className="home-section-action home-final-cta-actions">
          <Button to="/experiments" variant="primary" size="lg">
            Start Learning
          </Button>
          <Button to="/simulation" variant="secondary" size="lg">
            Open Simulation
          </Button>
        </div>
      </div>
    </section>
  );
}

export default FinalCTA;
