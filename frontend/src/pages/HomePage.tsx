import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import SectionHeading from "../components/ui/SectionHeading";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import LoadingState from "../components/common/LoadingState";
import { getExperiments } from "../services/experimentService";
import type { Experiment } from "../types/experiment";

function HomePage() {
  const [featuredExperiments, setFeaturedExperiments] = useState<
    Experiment[]
  >([]);
  const [loadingExperiments, setLoadingExperiments] = useState(true);

  useEffect(() => {
    async function loadFeaturedExperiments() {
      try {
        setLoadingExperiments(true);

        const response = await getExperiments();

        setFeaturedExperiments(response.items.slice(0, 3));
      } catch (error) {
        console.error(
          "Failed to load featured experiments:",
          error,
        );

        setFeaturedExperiments([]);
      } finally {
        setLoadingExperiments(false);
      }
    }

    loadFeaturedExperiments();
  }, []);

  return (
    <div className="home-page">
      {/* =====================================================
          HERO
      ===================================================== */}
      <section className="hero-section">
        {/* LEFT SIDE */}
        <div className="hero-content">
          <p className="eyebrow">
            ELECTRICAL ENGINEERING LEARNING PLATFORM
          </p>

          <h1>
            Learn.
            <br />
            Build.
            <br />
            <span>Understand.</span>
          </h1>

          <p className="hero-description">
            EngineerOS is an interactive learning platform designed
            to help electrical engineering students understand
            concepts through theory, experiments, simulation, and
            guided learning.
          </p>

          {/* HERO BUTTONS */}
          <div className="hero-actions">
            <Button to="/experiments" variant="primary">
              Explore Experiments
            </Button>

            <a
              href="#how-it-works"
              className="ui-button ui-button-secondary"
            >
              See How It Works
            </a>
          </div>
        </div>

        {/* RIGHT SIDE WORKSPACE PREVIEW */}
        <div className="hero-workspace">
          <div className="workspace-window">
            <div className="workspace-top">
              <div className="live-status">
                ● Workspace Preview
              </div>

              <div className="workspace-menu">•••</div>
            </div>

            {/* CIRCUIT AREA */}
            <div className="circuit-area">
              <div className="circuit-line top-wire" />
              <div className="circuit-line left-wire" />
              <div className="circuit-line right-wire" />
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
              <div className="circuit-label voltage-label">
                V1
              </div>

              <div className="circuit-label current-label">
                I
              </div>

              {/* SIMULATION PREVIEW ONLY */}
              <div className="play-button" aria-hidden="true">
                ▶
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          HOW IT WORKS
      ===================================================== */}
      <section
        id="how-it-works"
        className="learning-section"
      >
        <SectionHeading
          eyebrow="HOW IT WORKS"
          title="From theory to understanding"
          description="EngineerOS connects the important stages of electrical engineering learning into one workflow."
        />

        <div className="learning-grid">
          <div className="learning-card">
            <span>01</span>

            <h3>Learn</h3>

            <p>
              Understand engineering concepts and theoretical
              foundations.
            </p>
          </div>

          <div className="learning-card">
            <span>02</span>

            <h3>Experiment</h3>

            <p>
              Apply concepts through practical electrical
              engineering experiments.
            </p>
          </div>

          <div className="learning-card">
            <span>03</span>

            <h3>Simulate</h3>

            <p>
              Explore circuit behavior through the simulation
              environment as the platform develops.
            </p>
          </div>

          <div className="learning-card">
            <span>04</span>

            <h3>Understand</h3>

            <p>
              Use guidance and assessment to strengthen your
              engineering understanding.
            </p>
          </div>
        </div>
      </section>

      {/* =====================================================
          FEATURES
      ===================================================== */}
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
              Explore electrical engineering concepts through
              practical experiments.
            </p>
          </Card>

          <Card className="feature-card">
            <div className="feature-icon">◈</div>

            <h3>Simulation Workspace</h3>

            <p>
              Explore the planned circuit workspace and
              simulation experience.
            </p>
          </Card>

          <Card className="feature-card">
            <div className="feature-icon">✦</div>

            <h3>AI Mentor</h3>

            <p>
              AI Mentor is being prepared for the simulation
              phase.
            </p>
          </Card>

          <Card className="feature-card">
            <div className="feature-icon">▦</div>

            <h3>Learning Progress</h3>

            <p>
              Track your learning journey through assessment
              and reports.
            </p>
          </Card>
        </div>
      </section>

      {/* =====================================================
          FEATURED EXPERIMENTS
      ===================================================== */}
      <section className="featured-experiments-section mt-[70px]">
        <SectionHeading
          eyebrow="FEATURED EXPERIMENTS"
          title="Start with the fundamentals"
          description="Explore electrical engineering experiments designed to build your understanding step by step."
        />

        {loadingExperiments && (
          <div className="mt-[25px]">
            <LoadingState message="Loading experiments..." />
          </div>
        )}

        {!loadingExperiments &&
          featuredExperiments.length > 0 && (
            <div className="feature-grid !mt-[25px] !mb-0">
              {featuredExperiments.map((experiment) => (
                <Link
                  key={experiment.id}
                  to={`/experiments/${experiment.id}`}
                  className="block h-full"
                >
                  <Card className="feature-card h-full transition-all duration-200 hover:-translate-y-1 hover:border-violet-200 hover:shadow-[0_8px_24px_rgba(124,58,237,0.10)]">
                    <h3>{experiment.title}</h3>

                    <p>
                      {experiment.short_description ||
                        experiment.description ||
                        "Explore this electrical engineering experiment."}
                    </p>
                  </Card>
                </Link>
              ))}
            </div>
          )}

        {!loadingExperiments &&
          featuredExperiments.length === 0 && (
            <Card className="feature-card !mt-[25px]">
              <h3>Experiments unavailable</h3>

              <p>
                Featured experiments could not be loaded right now.
                Visit the experiments page to try again.
              </p>

              <div className="home-section-action !mt-[22px]">
                <Button
                  to="/experiments"
                  variant="secondary"
                >
                  View Experiments
                </Button>
              </div>
            </Card>
          )}

        <div className="home-section-action !mt-[25px]">
          <Button to="/experiments" variant="secondary">
            View All Experiments
          </Button>
        </div>
      </section>

      {/* =====================================================
          AI MENTOR PREVIEW
      ===================================================== */}
      <section className="ai-preview-section !mt-[55px]">
        <SectionHeading
          eyebrow="AI MENTOR"
          title="Guidance for your engineering journey"
          description="The AI Mentor will provide learning guidance as EngineerOS develops its simulation and AI capabilities."
        />

        <Card className="feature-card !mt-[25px]">
          <h3>AI Mentor is being prepared</h3>

          <p>
            The Week 1 version provides the interface foundation.
            Real AI assistance will be integrated in a later
            development phase.
          </p>

          <div className="home-section-action !mt-[22px]">
            <Button to="/mentor" variant="secondary">
              View Mentor
            </Button>
          </div>
        </Card>
      </section>

      {/* =====================================================
          SIMULATION PREVIEW
      ===================================================== */}
      <section className="simulation-preview-section !mt-[55px]">
        <SectionHeading
          eyebrow="SIMULATION"
          title="Explore circuits through simulation"
          description="The simulation workspace is part of the EngineerOS learning experience and will be developed in a later phase."
        />

        <Card className="feature-card !mt-[25px]">
          <h3>Simulation Workspace Preview</h3>

          <p>
            The current interface provides a visual preview of
            the planned circuit workspace. Real circuit simulation
            is not connected in Week 1.
          </p>

          <div className="home-section-action !mt-[22px]">
            <Button to="/tools" variant="secondary">
              Explore Tools
            </Button>
          </div>
        </Card>
      </section>

      {/* =====================================================
          FINAL CTA
      ===================================================== */}
      <section className="home-cta !mt-[80px]">
        <div className="max-w-[700px]">
          <p className="mb-2 text-[11px] font-medium leading-none text-[#9f82ff]">
            GET STARTED
          </p>

          <h2 className="mb-2 text-[22px] font-semibold leading-[1.2] text-white">
            Ready to start learning?
          </h2>

          <p className="text-[12px] font-normal leading-[1.6] text-[#9aa6b9]">
            Explore electrical engineering concepts through
            experiments, simulation, and guided learning.
          </p>
        </div>
      </section>
    </div>
  );
}

export default HomePage;