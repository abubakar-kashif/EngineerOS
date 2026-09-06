/**
 * Real product stats only — no invented user counts.
 */
import SectionHeading from "../ui/SectionHeading";

const stats = [
  { value: "10+", label: "Guided experiments" },
  { value: "4", label: "Learning stages" },
  { value: "Quiz", label: "Difficulty levels: Easy · Medium · Hard" },
  { value: "AI", label: "Mentor with simulation context" },
];

function StatsProof() {
  return (
    <section className="home-section home-section--panel home-stats-section" aria-label="Platform highlights">
      <SectionHeading
        eyebrow="PLATFORM"
        title="Built for structured engineering practice"
        description="Everything below reflects what EngineerOS actually ships today."
      />
      <div className="home-stats-grid">
        {stats.map((item) => (
          <div key={item.label} className="home-stats-card">
            <p className="home-stats-value">{item.value}</p>
            <p className="home-stats-label">{item.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default StatsProof;
