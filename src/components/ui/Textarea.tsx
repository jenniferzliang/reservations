"use client";

interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
}

export function Textarea({
  label,
  className = "",
  ...props
}: TextareaProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="font-mono text-[10px] uppercase tracking-[1px] text-foreground">
        {label}
      </label>
      <textarea
        className={`bg-transparent border border-border rounded-none px-3 py-2.5 font-serif text-base text-foreground placeholder:italic placeholder:text-muted focus:outline-none focus:border-foreground transition-colors resize-none ${className}`}
        rows={4}
        {...props}
      />
    </div>
  );
}
