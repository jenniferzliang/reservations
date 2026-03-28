"use client";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: { value: string; label: string }[];
  error?: string;
}

export function Select({
  label,
  options,
  error,
  className = "",
  ...props
}: SelectProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="font-mono text-[10px] uppercase tracking-[1px] text-foreground">
        {label}
        {props.required && " *"}
      </label>
      <div className="relative">
        <select
          className={`bg-transparent border border-border rounded-none px-3 py-2.5 pr-8 font-serif text-base text-foreground focus:outline-none focus:border-foreground transition-colors appearance-none w-full ${
            error ? "border-error" : ""
          } ${className}`}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <svg
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>
      {error && (
        <span className="font-mono text-[10px] text-error uppercase tracking-[0.5px]">
          {error}
        </span>
      )}
    </div>
  );
}
