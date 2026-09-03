import Button from "../ui/Button";

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
          <div className="home-hero-preview">
            <div className="home-hero-preview-bar">
              <span className="home-hero-preview-dot home-hero-preview-dot--blue" />
              <span className="home-hero-preview-dot" />
              <span className="home-hero-preview-dot" />
              <span className="home-hero-preview-label">Workspace Preview</span>
            </div>
            <div className="home-hero-preview-body">
              <svg viewBox="0 0 320 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="home-hero-circuit">
                <line x1="40" y1="40" x2="280" y2="40" stroke="var(--color-border)" strokeWidth="1" />
                <line x1="40" y1="40" x2="40" y2="160" stroke="var(--color-border)" strokeWidth="1" />
                <line x1="280" y1="40" x2="280" y2="160" stroke="var(--color-border)" strokeWidth="1" />
                <line x1="40" y1="160" x2="280" y2="160" stroke="var(--color-border)" strokeWidth="1" />
                <circle cx="40" cy="100" r="18" stroke="var(--color-primary)" strokeWidth="2" fill="none" />
                <text x="40" y="95" textAnchor="middle" fill="var(--color-primary)" fontSize="10" fontWeight="700">+</text>
                <text x="40" y="112" textAnchor="middle" fill="var(--color-primary)" fontSize="10" fontWeight="700">−</text>
                <rect x="130" y="30" width="60" height="20" rx="2" fill="none" stroke="var(--color-accent)" strokeWidth="1.5" />
                <text x="160" y="44" textAnchor="middle" fill="var(--color-text-secondary)" fontSize="9">R1</text>
                <circle cx="280" cy="100" r="18" stroke="var(--color-accent)" strokeWidth="2" fill="none" />
                <text x="280" y="105" textAnchor="middle" fill="var(--color-accent)" fontSize="12" fontWeight="700">A</text>
                <circle r="3" fill="var(--color-accent)">
                  <animateMotion dur="4s" repeatCount="indefinite" path="M40,40 L280,40 L280,160 L40,160 Z" />
                </circle>
                <text x="18" y="104" fill="var(--color-text-muted)" fontSize="8" fontWeight="600">V1</text>
                <text x="160" y="24" fill="var(--color-text-muted)" fontSize="8" fontWeight="600">I</text>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;