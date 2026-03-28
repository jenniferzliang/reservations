"use client";

interface SelectionCardProps {
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}

export function SelectionCard({
  selected,
  disabled = false,
  onClick,
  children,
  className = "",
}: SelectionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`
        border rounded-none px-2 py-3 text-center transition-all duration-150 cursor-pointer
        ${
          selected
            ? "bg-selected text-selected-text border-selected"
            : disabled
            ? "text-muted border-border cursor-not-allowed pointer-events-none"
            : "bg-background text-foreground border-border hover:border-foreground"
        }
        ${className}
      `}
    >
      {children}
    </button>
  );
}
