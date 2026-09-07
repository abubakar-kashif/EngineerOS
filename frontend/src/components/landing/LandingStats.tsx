/**
 * Stats band. Numeric values count up once the row scrolls into view.
 */
import CountUp from "./CountUp";
import { RevealGroup, RevealItem } from "./Reveal";

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
      <div className="mx-auto w-full max-w-[1280px] px-6 py-14 sm:px-8 sm:py-16">
        <RevealGroup
          className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-5"
          stagger={0.1}
        >
          {STATS.map((stat) => (
            <RevealItem key={stat.label} className="text-center">
              <p className="text-3xl font-bold tracking-tight text-white sm:text-[34px]">
                {"value" in stat ? (
                  <CountUp value={stat.value} suffix={stat.suffix} />
                ) : (
                  stat.text
                )}
              </p>
              <p className="mt-2 text-[13px] font-medium text-[#9CA3AF]">{stat.label}</p>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}

export default LandingStats;
