type LogoProps = {
  className?: string;
};

function EngineerOSLogo({ className = "" }: LogoProps) {
  return (
    <svg
      className={className}
      width="180"
      height="32"
      viewBox="0 0 180 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="EngineerOS"
    >
      {/* Circuit node icon */}
      <g>
        {/* Central node */}
        <circle cx="16" cy="16" r="6" fill="var(--color-primary)" />
        {/* Connection lines */}
        <path
          d="M16 10 L16 4 M16 22 L16 28 M10 16 L4 16 M22 16 L28 16 M11.8 11.8 L7.8 7.8 M20.2 11.8 L24.2 7.8 M11.8 20.2 L7.8 24.2 M20.2 20.2 L24.2 24.2"
          stroke="var(--color-accent)"
          strokeWidth="2"
          strokeLinecap="round"
        />
        {/* Outer nodes */}
        <circle cx="16" cy="4" r="2" fill="var(--color-accent)" />
        <circle cx="16" cy="28" r="2" fill="var(--color-accent)" />
        <circle cx="4" cy="16" r="2" fill="var(--color-accent)" />
        <circle cx="28" cy="16" r="2" fill="var(--color-accent)" />
        <circle cx="7.8" cy="7.8" r="1.5" fill="var(--color-accent)" opacity="0.6" />
        <circle cx="24.2" cy="7.8" r="1.5" fill="var(--color-accent)" opacity="0.6" />
        <circle cx="7.8" cy="24.2" r="1.5" fill="var(--color-accent)" opacity="0.6" />
        <circle cx="24.2" cy="24.2" r="1.5" fill="var(--color-accent)" opacity="0.6" />
      </g>
      {/* Wordmark */}
      <text
        x="40"
        y="22"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontSize="18"
        fontWeight="600"
        fill="var(--color-text)"
      >
        Engineer<tspan fill="var(--color-primary)">OS</tspan>
      </text>
    </svg>
  );
}

export default EngineerOSLogo;
