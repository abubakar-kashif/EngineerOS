/**
 * Animated hero lab preview — CSS/SVG motion only (no static artwork).
 * Shows EngineerOS as a live simulation + AI workspace for hackathon demos.
 */
function HeroLabPreview() {
  return (
    <div className="home-hero-preview home-hero-lab" aria-hidden="true">
      <div className="home-hero-preview-bar">
        <span className="home-hero-preview-dot home-hero-preview-dot--blue" />
        <span className="home-hero-preview-dot" />
        <span className="home-hero-preview-dot" />
        <span className="home-hero-preview-label">Live Lab Engine</span>
        <span className="home-hero-lab-live">
          <span className="home-hero-lab-live-dot" />
          LIVE
        </span>
      </div>

      <div className="home-hero-lab-stage">
        <div className="home-hero-lab-scan" />
        <div className="home-hero-lab-orb home-hero-lab-orb--a" />
        <div className="home-hero-lab-orb home-hero-lab-orb--b" />

        <svg
          className="home-hero-lab-svg"
          viewBox="0 0 360 240"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="heroWaveGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.15" />
              <stop offset="50%" stopColor="var(--color-accent)" stopOpacity="0.9" />
              <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.15" />
            </linearGradient>
            <linearGradient id="heroWireGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.35" />
              <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0.85" />
            </linearGradient>
            <filter id="heroGlow" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="2.2" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Soft grid */}
          {Array.from({ length: 7 }).map((_, i) => (
            <line
              key={`h-${i}`}
              x1="16"
              y1={28 + i * 30}
              x2="344"
              y2={28 + i * 30}
              stroke="var(--color-border)"
              strokeWidth="1"
              opacity="0.35"
            />
          ))}
          {Array.from({ length: 9 }).map((_, i) => (
            <line
              key={`v-${i}`}
              x1={20 + i * 40}
              y1="24"
              x2={20 + i * 40}
              y2="216"
              stroke="var(--color-border)"
              strokeWidth="1"
              opacity="0.28"
            />
          ))}

          {/* Circuit mesh */}
          <path
            className="home-hero-lab-wire"
            d="M48 170 H120 V70 H240 V170 H312"
            stroke="url(#heroWireGrad)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            className="home-hero-lab-wire home-hero-lab-wire--dash"
            d="M120 170 V120 H240 V170"
            stroke="var(--color-primary)"
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity="0.55"
          />

          {/* Source */}
          <g filter="url(#heroGlow)">
            <circle cx="48" cy="170" r="16" stroke="var(--color-primary)" strokeWidth="2" fill="var(--color-surface)" />
            <text x="48" y="166" textAnchor="middle" fill="var(--color-primary)" fontSize="11" fontWeight="700">+</text>
            <text x="48" y="180" textAnchor="middle" fill="var(--color-primary)" fontSize="11" fontWeight="700">−</text>
          </g>

          {/* Resistor */}
          <rect
            x="154"
            y="58"
            width="52"
            height="24"
            rx="4"
            fill="var(--color-surface)"
            stroke="var(--color-accent)"
            strokeWidth="1.75"
          />
          <text x="180" y="74" textAnchor="middle" fill="var(--color-text-secondary)" fontSize="10" fontWeight="700">
            R1
          </text>

          {/* Cap */}
          <g transform="translate(228 112)">
            <line x1="-8" y1="-12" x2="-8" y2="12" stroke="var(--color-primary)" strokeWidth="2.5" />
            <line x1="8" y1="-12" x2="8" y2="12" stroke="var(--color-primary)" strokeWidth="2.5" />
            <line x1="-14" y1="0" x2="-8" y2="0" stroke="var(--color-primary)" strokeWidth="1.5" />
            <line x1="8" y1="0" x2="14" y2="0" stroke="var(--color-primary)" strokeWidth="1.5" />
          </g>

          {/* Probe / instrument */}
          <g filter="url(#heroGlow)">
            <circle cx="312" cy="170" r="16" stroke="var(--color-accent)" strokeWidth="2" fill="var(--color-surface)" />
            <text x="312" y="175" textAnchor="middle" fill="var(--color-accent)" fontSize="13" fontWeight="700">
              A
            </text>
          </g>

          {/* Pulsing nodes */}
          <circle className="home-hero-lab-node" cx="120" cy="70" r="4" fill="var(--color-primary)" />
          <circle className="home-hero-lab-node home-hero-lab-node--delay" cx="240" cy="70" r="4" fill="var(--color-accent)" />
          <circle className="home-hero-lab-node" cx="120" cy="170" r="3.5" fill="var(--color-primary)" />
          <circle className="home-hero-lab-node home-hero-lab-node--delay" cx="240" cy="170" r="3.5" fill="var(--color-accent)" />

          {/* Current particles */}
          <circle r="3.5" fill="var(--color-accent)" filter="url(#heroGlow)">
            <animateMotion dur="3.2s" repeatCount="indefinite" path="M48,170 H120 V70 H240 V170 H312" />
          </circle>
          <circle r="2.5" fill="var(--color-primary)" opacity="0.9">
            <animateMotion dur="3.2s" begin="1.05s" repeatCount="indefinite" path="M48,170 H120 V70 H240 V170 H312" />
          </circle>
          <circle r="2" fill="var(--color-accent)" opacity="0.75">
            <animateMotion dur="3.2s" begin="2.1s" repeatCount="indefinite" path="M48,170 H120 V70 H240 V170 H312" />
          </circle>

          {/* Oscilloscope panel */}
          <rect
            x="58"
            y="188"
            width="164"
            height="40"
            rx="8"
            fill="var(--color-bg)"
            stroke="var(--color-border)"
            strokeWidth="1"
          />
          <text x="70" y="204" fill="var(--color-text-muted)" fontSize="8" fontWeight="700" letterSpacing="0.08em">
            SCOPE
          </text>
          <path
            className="home-hero-lab-wave"
            d="M70 212 C86 212, 90 198, 106 198 S126 226, 142 212 S158 198, 174 212 S190 226, 206 212"
            stroke="url(#heroWaveGrad)"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />

          {/* AI mentor pulse */}
          <g transform="translate(278 46)">
            <circle className="home-hero-lab-ai-ring" r="22" fill="none" stroke="var(--color-primary)" strokeWidth="1.25" />
            <circle className="home-hero-lab-ai-ring home-hero-lab-ai-ring--delay" r="16" fill="none" stroke="var(--color-accent)" strokeWidth="1" />
            <circle r="10" fill="var(--color-primary)" opacity="0.18" />
            <circle r="6" fill="var(--color-primary)" />
            <text x="0" y="3.5" textAnchor="middle" fill="#fff" fontSize="8" fontWeight="800">
              AI
            </text>
          </g>
        </svg>

        <div className="home-hero-lab-chip home-hero-lab-chip--v">
          <span className="home-hero-lab-chip-label">V</span>
          <span className="home-hero-lab-chip-value">12.00 V</span>
        </div>
        <div className="home-hero-lab-chip home-hero-lab-chip--i">
          <span className="home-hero-lab-chip-label">I</span>
          <span className="home-hero-lab-chip-value home-hero-lab-chip-value--pulse">24.0 mA</span>
        </div>
        <div className="home-hero-lab-chip home-hero-lab-chip--ai">
          <span className="home-hero-lab-chip-label">Mentor</span>
          <span className="home-hero-lab-chip-value">Explaining…</span>
        </div>
      </div>
    </div>
  );
}

export default HeroLabPreview;
