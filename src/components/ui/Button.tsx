"use client";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "outlined";
  children: React.ReactNode;
}

export function Button({
  variant = "primary",
  children,
  className = "",
  ...props
}: ButtonProps) {
  const base =
    "w-full py-4 rounded-none font-mono text-[11px] uppercase tracking-[2px] cursor-pointer transition-opacity";
  const variants = {
    primary: "bg-btn-bg text-btn-text border-none hover:opacity-90",
    outlined:
      "bg-transparent text-foreground border border-foreground hover:bg-foreground hover:text-background",
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
