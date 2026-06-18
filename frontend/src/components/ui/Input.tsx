import { type InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  status?: "success" | "error" | null;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", status, ...props }, ref) => {
    const statusClass =
      status === "success"
        ? "ring-1 ring-success"
        : status === "error"
          ? "ring-1 ring-danger"
          : "";

    return (
      <input
        ref={ref}
        className={[
          "w-full px-3.5 py-2.5 bg-input text-text text-sm rounded-lg",
          "outline-none placeholder:text-muted transition-shadow",
          statusClass,
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";
export default Input;
