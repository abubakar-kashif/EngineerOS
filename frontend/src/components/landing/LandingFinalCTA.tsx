/**
 * Closing conversion band with the decorative chip artwork.
 */
import { ArrowRight } from "lucide-react";
import LandingButton from "./LandingButton";
import { Reveal } from "./Reveal";
import { ChipTraceArt } from "./illustrations";
import { LANDING_CONTAINER, LANDING_SECTION } from "./landingLayout";

function LandingFinalCTA() {
  return (
    <section className={`${LANDING_SECTION} overflow-hidden`}>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 h-[460px] w-[720px] -translate-x-1/2 blur-3xl"
        style={{
          background: "radial-gradient(ellipse at center, rgba(37,99,235,0.20), rgba(5,7,13,0) 70%)",
        }}
      />

      <div
        className={`${LANDING_CONTAINER} relative grid items-center gap-12 lg:grid-cols-[1.2fr_0.8fr] lg:gap-16`}
      >
        <Reveal>
          <h2 className="max-w-2xl text-3xl font-bold tracking-tight text-white sm:text-[2.6rem] sm:leading-[1.15]">
            Ready to start your engineering journey?
          </h2>
          <p className="mt-6 max-w-xl text-base leading-[1.7] text-[#9CA3AF]">
            Join thousands of students learning electrical engineering the right way.
          </p>
          <div className="mt-10">
            <LandingButton to="/register" variant="primary" size="lg">
              Get Started Now – It&apos;s Free <ArrowRight size={16} aria-hidden="true" />
            </LandingButton>
          </div>
        </Reveal>

        <Reveal className="flex justify-center lg:justify-end">
          <ChipTraceArt />
        </Reveal>
      </div>
    </section>
  );
}

export default LandingFinalCTA;
