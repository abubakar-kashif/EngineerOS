import { ArrowRight } from "lucide-react";
import Card from "../ui/Card";
import Button from "../ui/Button";
import SectionHeading from "../ui/SectionHeading";

function SimulationPreview() {
  return (
    <section className="home-section">
      <SectionHeading
        eyebrow="SIMULATION"
        title="Build. Run. Validate. Understand."
        description="The simulation workspace lets you build circuits, run simulations, and validate results — all in one environment."
      />

      <Card className="home-sim-card">
        <div className="home-sim-layout">
          <div className="home-sim-sidebar">
            <p className="home-sim-sidebar-title">Component Library</p>
            <ul className="home-sim-components">
              <li><span className="home-sim-dot home-sim-dot--blue" />Resistor</li>
              <li><span className="home-sim-dot home-sim-dot--cyan" />Voltage Source</li>
              <li><span className="home-sim-dot home-sim-dot--green" />Capacitor</li>
              <li><span className="home-sim-dot home-sim-dot--amber" />Diode</li>
              <li><span className="home-sim-dot home-sim-dot--purple" />Inductor</li>
            </ul>
          </div>

          <div className="home-sim-canvas">
            <p className="home-sim-canvas-title">Circuit Preview</p>
            <svg viewBox="0 0 300 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="home-sim-svg">
              <line x1="30" y1="30" x2="270" y2="30" stroke="var(--color-border)" strokeWidth="1" />
              <line x1="30" y1="30" x2="30" y2="130" stroke="var(--color-border)" strokeWidth="1" />
              <line x1="270" y1="30" x2="270" y2="130" stroke="var(--color-border)" strokeWidth="1" />
              <line x1="30" y1="130" x2="270" y2="130" stroke="var(--color-border)" strokeWidth="1" />
              <rect x="120" y="22" width="60" height="16" rx="2" fill="none" stroke="var(--color-accent)" strokeWidth="1.5" />
              <text x="150" y="34" textAnchor="middle" fill="var(--color-text-secondary)" fontSize="8" fontWeight="600">R1</text>
              <rect x="120" y="122" width="60" height="16" rx="2" fill="none" stroke="var(--color-primary)" strokeWidth="1.5" />
              <text x="150" y="134" textAnchor="middle" fill="var(--color-text-secondary)" fontSize="8" fontWeight="600">R2</text>
              <circle cx="30" cy="80" r="14" stroke="var(--color-primary)" strokeWidth="1.5" fill="none" />
              <text x="30" y="84" textAnchor="middle" fill="var(--color-primary)" fontSize="9" fontWeight="700">V</text>
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
