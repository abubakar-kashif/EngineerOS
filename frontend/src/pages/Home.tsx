import SectionHeading from "../component/ui/SectionHeading";
import Card from "../component/ui/Card";

function Home() {
  return (
    <div className="home-page">
      {/* HERO */}
      <section className="hero-section">
        {/* LEFT SIDE */}
        <div className="hero-content">
          <p className="eyebrow">ELECTRICAL ENGINEERING LEARNING PLATFORM</p>

          <h1>
            Learn.
            <br />
            Build.
            <br />
            <span>Understand.</span>
          </h1>

          <p className="hero-description">
            EngineerOS is an interactive learning platform designed to help
            electrical engineering students understand concepts through theory,
            experiments, simulation, and AI guidance.
          </p>

          {/* HERO BUTTONS */}
          <div className="hero-actions">
            <button className="primary-button" type="button">
              Explore Experiments
            </button>

            <button className="secondary-button" type="button">
              Learn More
            </button>
          </div>


        </div>

        {/* RIGHT SIDE WORKSPACE */}
        <div className="hero-workspace">
          <div className="workspace-window">
            <div className="workspace-top">
              <div className="live-status">● Live workspace</div>

              <div className="workspace-menu">•••</div>
            </div>

            {/* CIRCUIT AREA */}
            <div className="circuit-area">
              {/* TOP WIRE */}
              <div className="circuit-line top-wire" />

              {/* LEFT WIRE */}
              <div className="circuit-line left-wire" />

              {/* RIGHT WIRE */}
              <div className="circuit-line right-wire" />

              {/* BOTTOM WIRE */}
              <div className="circuit-line bottom-wire" />

              {/* VOLTAGE SOURCE */}
              <div className="voltage-source">
                <span className="voltage-plus">+</span>
                <span className="voltage-minus">−</span>
              </div>

              {/* AMMETER */}
              <div className="ammeter">
                <span>A</span>
              </div>

              {/* CURRENT FLOW DOT */}
              <div className="current-dot" />

              {/* LABELS */}
              <div className="circuit-label voltage-label">V1</div>
              <div className="circuit-label current-label">I</div>

              {/* RUN BUTTON */}
              <button
                className="play-button"
                type="button"
                aria-label="Run simulation"
              >
                ▶
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="learning-section">
        <SectionHeading
          eyebrow="HOW IT WORKS"
          title="From theory to understanding"
          description="EngineerOS connects the important stages of electrical engineering learning into one workflow."
        />

        <div className="learning-grid">
          <div className="learning-card">
            <span>01</span>
            <h3>Learn</h3>
            <p>Understand engineering concepts and theoretical foundations.</p>
          </div>

          <div className="learning-card">
            <span>02</span>
            <h3>Experiment</h3>
            <p>
              Apply concepts through practical electrical engineering
              experiments.
            </p>
          </div>

          <div className="learning-card">
            <span>03</span>
            <h3>Simulate</h3>
            <p>
              Explore circuit behavior through an interactive simulation
              environment.
            </p>
          </div>

          <div className="learning-card">
            <span>04</span>
            <h3>Understand</h3>
            <p>
              Use guidance and assessment to strengthen your engineering
              understanding.
            </p>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="features-section">
        <SectionHeading
          eyebrow="PLATFORM"
          title="Built for engineering students"
        />

        <div className="feature-grid">
          <Card className="feature-card">
            <div className="feature-icon">⚡</div>

            <h3>Interactive Experiments</h3>

            <p>
              Explore electrical engineering concepts through practical
              experiments.
            </p>
          </Card>

          <div className="feature-card">
            <div className="feature-icon">◈</div>

            <h3>Simulation Workspace</h3>

            <p>Build and analyze circuits in an interactive environment.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">✦</div>

            <h3>AI Mentor</h3>

            <p>Receive contextual guidance while learning and experimenting.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">▦</div>

            <h3>Learning Progress</h3>

            <p>Track your learning journey through assessment and reports.</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="home-cta">
        <div>
          <p className="eyebrow">ENGINEEROS</p>

          <h2>A smarter way to learn electrical engineering.</h2>

          <p>
            Learn concepts, experiment with circuits, and understand the
            results.
          </p>
        </div>
      </section>
    </div>
  );
}

export default Home;