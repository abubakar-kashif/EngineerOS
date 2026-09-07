/**
 * Stats band. Numeric values count up once the row scrolls into view.
 */
import CountUp from "./CountUp";
import { RevealGroup, RevealItem } from "./Reveal";
import { LANDING_CONTAINER } from "./landingLayout";

type Stat = { value: number; suffix: string; label: string } | { text: string; label: string };

const STATS: Stat[] = [
  { value: 50, suffix: "+", label: "Experiments" },
  { value: 1000, suffix: "+", label: "Components" },
  { text: "Unlimited", label: "Simulations" },
  { text: "Real-time", label: "Measurements" },
  { text: "24/7", label: "AI Mentor" },
];

function LandingStats() {
  return (
    <section className="border-y border-[#1F2937]/40 bg-[#070A12]">
      <div className={`${LANDING_CONTAINER} py-16 sm:py-20 lg:py-24`}>
        <RevealGroup
          className="grid grid-cols-2 gap-x-8 gap-y-12 sm:grid-cols-3 lg:grid-cols-5 lg:gap-x-10"
          stagger={0.1}
        >
          {STATS.map((stat) => (
            <RevealItem key={stat.label} className="text-center">
              <p className="text-3xl font-bold tracking-tight text-white sm:text-[2.15rem]">
                {"value" in stat ? (
                  <CountUp value={stat.value} suffix={stat.suffix} />
                ) : (
                  stat.text
                )}
              </p>
              <p className="mt-3 text-[13px] font-medium tracking-wide text-[#9CA3AF]">
                {stat.label}
              </p>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}

export default LandingStats;
