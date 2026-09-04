import Button from "../ui/Button";
import HeroLabPreview from "./HeroLabPreview";

function HeroSection() {
  return (
    <section className="home-hero">
      <div className="home-hero-inner">
        <div className="home-hero-content">
          <p className="home-hero-eyebrow">ENGINEERING LEARNING PLATFORM</p>
          <h1 className="home-hero-title">
            Understand. Experiment.
            <br />
            Simulate. Validate.
          </h1>
          <p className="home-hero-description">
            Master engineering concepts through theory, experiments,
            simulation and intelligent guidance.
          </p>
          <div className="home-hero-actions">
            <Button to="/experiments" variant="primary" size="lg">
              Explore Experiments
            </Button>
            <a href="#how-it-works" className="ui-button ui-button-secondary home-hero-secondary">
              How It Works
            </a>
          </div>
        </div>

        <div className="home-hero-visual">
          <HeroLabPreview />
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
