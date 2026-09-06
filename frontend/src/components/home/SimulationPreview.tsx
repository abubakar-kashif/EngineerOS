import { ArrowRight } from "lucide-react";
import Card from "../ui/Card";
import Button from "../ui/Button";
import SectionHeading from "../ui/SectionHeading";

function SimulationPreview() {
  return (
    <section className="home-section home-section--panel" id="simulation">
      <SectionHeading
        eyebrow="SIMULATION"
        title="Here's where you build it"
        description="The workspace lets you place components, wire circuits, run simulations, and inspect measurements and graphs — all in one environment."
      />

      <Card className="home-sim-card home-sim-card--showcase">
        <div className="home-sim-layout">
          <div className="home-sim-sidebar">
            <p className="home-sim-sidebar-title">Components</p>
            <ul className="home-sim-components">
              <li><span className="home-sim-dot home-sim-dot--blue" />Resistor</li>
              <li><span className="home-sim-dot home-sim-dot--cyan" />Voltage Source</li>
              <li><span className="home-sim-dot home-sim-dot--green" />Capacitor</li>
              <li><span className="home-sim-dot home-sim-dot--amber" />Diode</li>
              <li><span className="home-sim-dot home-sim-dot--purple" />Inductor</li>
              <li><span className="home-sim-dot home-sim-dot--blue" />Instruments</li>
            </ul>
            <p className="home-sim-sidebar-title" style={{ marginTop: 16 }}>Results</p>
            <ul className="home-sim-components">
              <li>Measurements</li>
              <li>Graphs</li>
              <li>Validation</li>
            </ul>
          </div>

          <div className="home-sim-canvas">
            <div className="home-sim-canvas-chrome">
              <span className="home-hero-preview-dot home-hero-preview-dot--blue" />
              <span className="home-hero-preview-dot" />
              <span className="home-hero-preview-dot" />
              <span className="home-sim-canvas-title">Circuit workspace</span>
            </div>
            <svg viewBox="0 0 320 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="home-sim-svg home-sim-svg--large" aria-hidden="true">
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
            </svg>
          </div>
        </div>

        <div className="home-section-action">
          <Button to="/simulation" variant="secondary">
            Open Workspace <ArrowRight size={14} />
          </Button>
        </div>
      </Card>
    </section>
  );
}

export default SimulationPreview;
