import Button from "../ui/Button";

function HeroSection() {
  return (
    <section className="home-hero home-hero--intro" aria-labelledby="home-hero-heading">
      <div className="home-hero-inner home-hero-inner--centered">
        <p className="home-hero-brand">EngineerOS</p>
        <h1 id="home-hero-heading" className="home-hero-title">
          Learn Electrical Engineering
          <span className="home-hero-title-line">by Building It.</span>
        </h1>
        <p className="home-hero-description">
          Theory, circuit simulation, quizzes, and AI guidance in one engineering
          learning platform — so you understand what happens, why it happens, and how to fix it.
        </p>
        <div className="home-hero-actions">
          <Button to="/experiments" variant="primary" size="lg" className="home-hero-cta">
            Start Learning
          </Button>
          <Button to="/experiments" variant="secondary" size="lg" className="home-hero-cta">
            Explore Experiments
          </Button>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
