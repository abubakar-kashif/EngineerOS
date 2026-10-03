import { ArrowRight } from "lucide-react";
import Card from "../ui/Card";
import Button from "../ui/Button";
import SectionHeading from "../ui/SectionHeading";

const FLOW = [
  { step: "01", title: "Build", detail: "Palette, wires, ground" },
  { step: "02", title: "Run", detail: "DC, transient, or AC sweep" },
  { step: "03", title: "Measure", detail: "Meters and oscilloscope" },
  { step: "04", title: "Validate", detail: "Theory beside the solve" },
  { step: "05", title: "Understand", detail: "Mentor reads the run" },
];

function SimulationPreview() {
  return (
    <section className="home-section">
      <SectionHeading
        eyebrow="SIMULATION"
        title="Build. Run. Measure. Validate. Understand."
        description="The workspace is one lab: the circuit you wire is the circuit the solver, the instruments, and the mentor all see."
      />

      <Card className="home-sim-card">
        <ol
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: "0.75rem",
            listStyle: "none",
            margin: 0,
            padding: 0,
          }}
        >
          {FLOW.map((item) => (
            <li
              key={item.step}
              style={{
                border: "1px solid var(--color-border)",
                borderRadius: "0.6rem",
                padding: "0.85rem 0.9rem",
              }}
            >
              <div style={{ fontSize: "0.7rem", letterSpacing: "0.06em", opacity: 0.55 }}>{item.step}</div>
              <div style={{ fontWeight: 650, marginTop: "0.2rem" }}>{item.title}</div>
              <div style={{ fontSize: "0.8rem", opacity: 0.75, marginTop: "0.25rem" }}>{item.detail}</div>
            </li>
          ))}
        </ol>

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
