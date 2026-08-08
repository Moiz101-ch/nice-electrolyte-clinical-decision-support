import { forwardRef, type InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type = "text", ...props }, ref) => (
    <input
      className={cn(
        "border-border-strong bg-surface text-foreground placeholder:text-muted/70 hover:border-muted focus:border-primary disabled:bg-surface-subtle disabled:text-muted aria-invalid:border-danger aria-invalid:ring-danger/15 h-10 w-full rounded-md border px-3 text-sm shadow-xs focus:outline-none disabled:cursor-not-allowed aria-invalid:ring-2",
        className,
      )}
      ref={ref}
      type={type}
      {...props}
    />
  ),
);

Input.displayName = "Input";
