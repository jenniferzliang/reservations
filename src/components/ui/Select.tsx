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
      <select
        className={`bg-transparent border border-border rounded-none px-3 py-2.5 font-serif text-base text-foreground focus:outline-none focus:border-foreground transition-colors appearance-none ${
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
      {error && (
        <span className="font-mono text-[10px] text-error uppercase tracking-[0.5px]">
          {error}
        </span>
      )}
    </div>
  );
}
