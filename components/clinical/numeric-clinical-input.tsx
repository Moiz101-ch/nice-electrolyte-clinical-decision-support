import { forwardRef, type InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export interface NumericClinicalInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "id" | "type"
> {
  description?: string;
  error?: string;
  id: string;
  label: string;
  unit: string;
}

export const NumericClinicalInput = forwardRef<HTMLInputElement, NumericClinicalInputProps>(
  ({ className, description, error, id, label, required, unit, ...props }, ref) => {
    const descriptionId = description ? `${id}-description` : null;
    const errorId = error ? `${id}-error` : null;
    const describedBy = [descriptionId, errorId].filter(Boolean).join(" ");

    return (
      <div className="space-y-1.5">
        <label className="text-foreground block text-sm font-semibold" htmlFor={id}>
          {label}
          {required ? (
            <>
              <span aria-hidden="true" className="text-danger ml-1">
                *
              </span>
              <span className="sr-only"> (required)</span>
            </>
          ) : null}
        </label>
        <div
          className={cn(
            "border-border-strong bg-surface focus-within:border-primary focus-within:ring-primary/15 grid min-h-10 grid-cols-[minmax(0,1fr)_auto] overflow-hidden rounded-md border shadow-xs focus-within:ring-2",
            error && "border-danger focus-within:border-danger focus-within:ring-danger/15",
            props.disabled && "bg-surface-subtle",
            className,
          )}
        >
          <input
            aria-invalid={Boolean(error)}
            className="text-foreground placeholder:text-muted/70 disabled:text-muted min-w-0 border-0 bg-transparent px-3 py-2 text-sm focus:outline-none disabled:cursor-not-allowed"
            id={id}
            inputMode="decimal"
            ref={ref}
            required={required}
            type="number"
            {...(describedBy ? { "aria-describedby": describedBy } : {})}
            {...props}
          />
          <span className="border-border bg-surface-subtle text-muted-strong flex min-w-20 items-center justify-center border-l px-3 text-xs font-semibold">
            {unit}
          </span>
        </div>
        {description ? (
          <p className="text-muted text-xs leading-5" id={descriptionId ?? undefined}>
            {description}
          </p>
        ) : null}
        {error ? (
          <p className="text-danger-strong text-xs leading-5 font-medium" id={errorId ?? undefined}>
            {error}
          </p>
        ) : null}
      </div>
    );
  },
);

NumericClinicalInput.displayName = "NumericClinicalInput";
