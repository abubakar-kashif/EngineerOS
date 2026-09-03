type SpinnerProps = {
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizes = { sm: 16, md: 24, lg: 40 };

function Spinner({ size = "md", className = "" }: SpinnerProps) {
  const px = sizes[size];
  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 24 24"
      fill="none"
      className={`ui-spinner ${className}`}
      role="status"
      aria-label="Loading"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="31.4 31.4"
        opacity="0.25"
      />
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="31.4 31.4"
        strokeDashoffset="20"
        style={{ animation: "spinRotate 0.75s linear infinite", transformOrigin: "center" }}
      />
    </svg>
  );
}

export default Spinner;
