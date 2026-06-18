import { MessageIcon } from "./Icons";

type LoaderSize = "sm" | "md" | "lg";

const ringSizes: Record<LoaderSize, string> = {
  sm: "w-8 h-8",
  md: "w-12 h-12",
  lg: "w-16 h-16",
};

const iconSizes: Record<LoaderSize, string> = {
  sm: "w-3.5 h-3.5",
  md: "w-5 h-5",
  lg: "w-6 h-6",
};

interface LoaderProps {
  message?: string;
  size?: LoaderSize;
  className?: string;
}

export default function Loader({
  message,
  size = "md",
  className = "",
}: LoaderProps) {
  return (
    <div className={`flex flex-col items-center gap-3 ${className}`} role="status" aria-label={message || "Loading"}>
      <div className={`relative ${ringSizes[size]}`}>
        <div className="absolute inset-0 rounded-full border-2 border-accent/15" />
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-accent animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center loader-pulse text-accent">
          <MessageIcon className={iconSizes[size]} />
        </div>
      </div>

      {message && (
        <div className="flex flex-col items-center gap-2">
          <p className="text-muted text-sm">{message}</p>
          <div className="flex gap-1">
            <span className="loader-dot w-1.5 h-1.5 rounded-full bg-accent" />
            <span className="loader-dot w-1.5 h-1.5 rounded-full bg-accent" />
            <span className="loader-dot w-1.5 h-1.5 rounded-full bg-accent" />
          </div>
        </div>
      )}
    </div>
  );
}

/** Full-screen centered loader for route-level waits */
export function PageLoader({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="h-screen w-full flex items-center justify-center bg-app">
      <Loader message={message} size="lg" />
    </div>
  );
}

/** Inline loader for sections (chat pane, lists) */
export function SectionLoader({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <Loader message={message} size="md" />
    </div>
  );
}
