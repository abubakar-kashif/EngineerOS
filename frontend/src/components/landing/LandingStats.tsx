/**
 * Stats band. The experiment count comes from the catalog.
 * The component library is part of the lab, not a landing statistic.
 */
import CountUp from "./CountUp";
import { RevealGroup, RevealItem } from "./Reveal";
import { CATALOG_EXPERIMENT_COUNT } from "../../data/experimentCatalog";

type Stat = { value: number; suffix?: string; label: string } | { text: string; label: string };

const STATS: Stat[] = [
  { value: CATALOG_EXPERIMENT_COUNT, label: "Experiments" },
  { text: "Unlimited", label: "Simulations" },
  { text: "Real-time", label: "Instruments" },
  { text: "24/7", label: "AI Mentor" },
];

function LandingStats() {
  return (
    <section className="landing-section--band">
      <div className="landing-container landing-stats-wrap">
        <RevealGroup className="landing-stats" stagger={0.1}>
          {STATS.map((stat) => (
            <RevealItem key={stat.label}>
              <p className="landing-stat-value">
                {"value" in stat ? (
                  <CountUp value={stat.value} suffix={stat.suffix ?? ""} />
                ) : (
                  stat.text
                )}
              </p>
              <p className="landing-stat-label">{stat.label}</p>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}

export default LandingStats;
