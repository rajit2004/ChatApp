import { type ButtonHTMLAttributes, type ReactNode } from "react";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  children: ReactNode;
  active?: boolean;
}

export default function IconButton({
  label,
  children,
  active = false,
  className = "",
  ...props
}: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      className={[
        "w-9 h-9 flex items-center justify-center rounded-lg transition-colors",
        active
          ? "bg-accent/15 text-accent"
          : "text-muted hover:text-text hover:bg-elevated",
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </button>
  );
}
