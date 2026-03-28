"use client";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function Input({ label, error, className = "", ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="font-mono text-[10px] uppercase tracking-[1px] text-foreground">
        {label}
        {props.required && " *"}
      </label>
      <input
        className={`bg-transparent border border-border rounded-none px-3 py-2.5 font-serif text-base text-foreground placeholder:italic placeholder:text-muted focus:outline-none focus:border-foreground transition-colors ${
          error ? "border-error" : ""
        } ${className}`}
        {...props}
      />
      {error && (
        <span className="font-mono text-[10px] text-error uppercase tracking-[0.5px]">
          {error}
        </span>
      )}
    </div>
  );
}
