const sizes = {
  sm: "w-9 h-9 text-sm",
  md: "w-10 h-10 text-sm",
  lg: "w-11 h-11 text-base",
  xl: "w-24 h-24 text-3xl",
};

interface AvatarProps {
  src?: string | null;
  name?: string;
  size?: keyof typeof sizes;
  online?: boolean;
  className?: string;
}

export default function Avatar({
  src,
  name = "?",
  size = "md",
  online,
  className = "",
}: AvatarProps) {
  const initial = name.charAt(0).toUpperCase();

  return (
    <div className={`relative flex-shrink-0 ${className}`}>
      <div
        className={[
          sizes[size],
          "rounded-full bg-accent/20 text-accent font-semibold",
          "flex items-center justify-center overflow-hidden uppercase",
        ].join(" ")}
      >
        {src ? (
          <img src={src} alt={name} className="w-full h-full object-cover" />
        ) : (
          initial
        )}
      </div>
      {online && (
        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-online rounded-full border-2 border-surface" />
      )}
    </div>
  );
}
