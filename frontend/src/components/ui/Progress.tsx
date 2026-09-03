type ProgressVariant = "primary" | "success" | "warning" | "danger";
type ProgressSize = "sm" | "md" | "lg";

type ProgressProps = {
  value: number;
  label?: string;
  showValue?: boolean;
  variant?: ProgressVariant;
  size?: ProgressSize;
  className?: string;
};

function Progress({
  value,
  label,
  showValue = false,
  variant = "primary",
  size = "md",
  className = "",
}: ProgressProps) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div className={`ui-progress ui-progress-${size} ${className}`}>
      {(label || showValue) && (
        <div className="ui-progress-header">
          {label && <span className="ui-progress-label">{label}</span>}
          {showValue && <span className="ui-progress-value">{Math.round(clamped)}%</span>}
        </div>
      )}
      <div className="ui-progress-track" role="progressbar" aria-valuenow={clamped} aria-valuemin={0} aria-valuemax={100} aria-label={label || "Progress"}>
        <div
          className={`ui-progress-fill ui-progress-fill-${variant}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}

export default Progress;
