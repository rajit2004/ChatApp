import { type ReactNode } from "react";
import IconButton from "./IconButton";
import { XIcon } from "./Icons";

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}

export default function Modal({ title, onClose, children, className = "" }: ModalProps) {
  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 px-0 sm:px-4"
      onClick={onClose}
    >
      <div
        className={[
          "bg-surface rounded-t-xl sm:rounded-xl p-5 sm:p-6 w-full sm:max-w-sm",
          "border border-border shadow-2xl",
          className,
        ].join(" ")}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-text font-semibold text-lg">{title}</h2>
          <IconButton onClick={onClose} label="Close">
            <XIcon className="w-4 h-4" />
          </IconButton>
        </div>
        {children}
      </div>
    </div>
  );
}
