/**
 * Closing conversion band with the decorative chip artwork.
 */
import { ArrowRight } from "lucide-react";
import LandingButton from "./LandingButton";
import { Reveal } from "./Reveal";
import { ChipTraceArt } from "./illustrations";

function LandingFinalCTA() {
  return (
    <section className="landing-section">
      <div
        aria-hidden="true"
        className="landing-glow"
        style={{
          left: "50%",
          top: 0,
          width: 720,
          height: 420,
          transform: "translateX(-50%)",
          background: "radial-gradient(ellipse at center, rgba(37,99,235,0.2), transparent 70%)",
        }}
      />

      <div className="landing-container landing-cta-grid">
        <Reveal>
          <h2 className="landing-h2" style={{ maxWidth: 560 }}>
            Ready to start your engineering journey?
          </h2>
          <p className="landing-lead">
            Join thousands of students learning electrical engineering the right way.
          </p>
          <div style={{ marginTop: 36 }}>
            <LandingButton to="/register" variant="primary" size="lg">
              Get Started Now – It&apos;s Free <ArrowRight size={18} aria-hidden="true" />
            </LandingButton>
          </div>
        </Reveal>

        <Reveal className="landing-cta-art">
          <ChipTraceArt />
        </Reveal>
      </div>
    </section>
  );
}

export default LandingFinalCTA;
