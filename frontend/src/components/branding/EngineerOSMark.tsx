type MarkSize = "sm" | "md" | "lg";

type MarkProps = {
  size?: MarkSize;
  className?: string;
};

const sizeMap: Record<MarkSize, number> = { sm: 24, md: 32, lg: 48 };

function EngineerOSMark({ size = "md", className = "" }: MarkProps) {
  const px = sizeMap[size];
  return (
    <svg
      className={className}
      width={px}
      height={px}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="EngineerOS"
    >
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
    </svg>
  );
}

export default EngineerOSMark;
