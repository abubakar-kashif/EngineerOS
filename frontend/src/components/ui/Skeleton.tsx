type SkeletonVariant = "text" | "circular" | "rectangular";

type SkeletonProps = {
  variant?: SkeletonVariant;
  width?: string | number;
  height?: string | number;
  lines?: number;
  className?: string;
};

function Skeleton({ variant = "text", width, height, lines = 1, className = "" }: SkeletonProps) {
  const style = {
    width: typeof width === "number" ? `${width}px` : width,
    height: typeof height === "number" ? `${height}px` : height,
  };

  if (variant === "text" && lines > 1) {
    return (
      <div className={`ui-skeleton-group ${className}`}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className="ui-skeleton ui-skeleton-text"
            style={{
              width: i === lines - 1 ? "75%" : "100%",
              height: height ? style.height : undefined,
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`ui-skeleton ui-skeleton-${variant} ${className}`}
      style={style}
    />
  );
}

export default Skeleton;
