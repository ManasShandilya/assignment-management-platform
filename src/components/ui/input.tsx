import { forwardRef, useId, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, Props>(function Input({ label, error, className, id, ...rest }, ref) {
  const auto = useId();
  const inputId = id ?? auto;
  return (
    <div className="space-y-1.5">
      <label htmlFor={inputId} className="text-sm font-medium text-ink">{label}</label>
      <input
        ref={ref}
        id={inputId}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-err` : undefined}
        className={cn(
          "h-10 w-full rounded-xl border bg-white px-3 text-sm placeholder:text-ink-faint",
          error ? "border-status-red" : "border-surface-line", className,
        )}
        {...rest}
      />
      {error && <p id={`${inputId}-err`} className="text-xs text-status-red">{error}</p>}
    </div>
  );
});
