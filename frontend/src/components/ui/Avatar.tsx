type AvatarSize = "sm" | "md" | "lg" | "xl";

type AvatarProps = {
  src?: string;
  alt?: string;
  fallback?: string;
  size?: AvatarSize;
  className?: string;
};

const sizeMap: Record<AvatarSize, number> = { sm: 28, md: 36, lg: 48, xl: 64 };

function Avatar({ src, alt, fallback, size = "md", className = "" }: AvatarProps) {
  const px = sizeMap[size];
  const initials =
    fallback ||
    (alt
      ? alt
          .split(" ")
          .map((w) => w[0])
          .join("")
          .toUpperCase()
          .slice(0, 2)
      : "?");

  if (src) {
    return (
      <img
        src={src}
        alt={alt || ""}
        className={`ui-avatar ui-avatar-${size} ${className}`}
        width={px}
        height={px}
      />
    );
  }

  return (
    <span
      className={`ui-avatar ui-avatar-fallback ui-avatar-${size} ${className}`}
      style={{ width: px, height: px, fontSize: px * 0.4 }}
      aria-label={alt}
    >
      {initials}
    </span>
  );
}

export default Avatar;
