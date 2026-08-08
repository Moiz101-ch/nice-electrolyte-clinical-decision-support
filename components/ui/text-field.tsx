import type { InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

import { Input } from "./input";

export interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "id"> {
  description?: string | undefined;
  error?: string | undefined;
  id: string;
  label: string;
}

export function TextField({
  className,
  description,
  error,
  id,
  label,
  required,
  ...props
}: TextFieldProps) {
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
      <Input
        aria-invalid={Boolean(error)}
        className={cn(className)}
        id={id}
        required={required}
        {...(describedBy ? { "aria-describedby": describedBy } : {})}
        {...props}
      />
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
}
