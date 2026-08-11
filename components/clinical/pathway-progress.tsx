import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

export interface PathwayProgressStep {
  description?: string;
  id: string;
  label: string;
}

export interface PathwayProgressProps {
  ariaLabel?: string;
  currentStepId: string;
  steps: readonly PathwayProgressStep[];
}

export function PathwayProgress({
  ariaLabel = "Assessment progress",
  currentStepId,
  steps,
}: PathwayProgressProps) {
  const currentStepIndex = steps.findIndex((step) => step.id === currentStepId);

  if (currentStepIndex === -1) {
    throw new Error(`Current pathway step ${currentStepId} is not present in the supplied steps.`);
  }

  return (
    <nav aria-label={ariaLabel}>
      <ol className="grid gap-3 md:auto-cols-fr md:grid-flow-col">
        {steps.map((step, index) => {
          const state =
            index < currentStepIndex
              ? "complete"
              : index === currentStepIndex
                ? "current"
                : "upcoming";

          return (
            <li
              aria-current={state === "current" ? "step" : undefined}
              className={cn(
                "border-border bg-surface grid min-h-20 grid-cols-[2rem_minmax(0,1fr)] gap-3 rounded-md border p-3",
                state === "current" && "border-primary bg-info-subtle",
              )}
              key={step.id}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "border-border-strong bg-surface-subtle text-muted flex size-8 items-center justify-center rounded-full border text-xs font-bold",
                  state === "complete" && "border-success bg-success text-white",
                  state === "current" && "border-primary bg-primary text-white",
                )}
              >
                {state === "complete" ? <Check className="size-4" strokeWidth={2.4} /> : index + 1}
              </span>
              <span className="min-w-0">
                <span className="text-foreground block text-sm font-semibold">{step.label}</span>
                {step.description ? (
                  <span className="text-muted mt-1 block text-xs leading-5">
                    {step.description}
                  </span>
                ) : null}
                <span className="sr-only">Status: {state}</span>
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
