import { Check, Minus } from "lucide-react";

import { cn } from "@/lib/utils";

export interface PathwayProgressStep {
  description?: string;
  id: string;
  label: string;
}

export interface PathwayProgressProps {
  ariaLabel?: string;
  currentStepId: string;
  skippedStepIds?: readonly string[];
  steps: readonly PathwayProgressStep[];
}

export function PathwayProgress({
  ariaLabel = "Assessment progress",
  currentStepId,
  skippedStepIds = [],
  steps,
}: PathwayProgressProps) {
  const currentStepIndex = steps.findIndex((step) => step.id === currentStepId);
  const skippedSteps = new Set(skippedStepIds);

  if (currentStepIndex === -1) {
    throw new Error(`Current pathway step ${currentStepId} is not present in the supplied steps.`);
  }

  return (
    <nav aria-label={ariaLabel}>
      <ol className={cn("grid auto-rows-fr gap-3", progressGridColumns(steps.length))}>
        {steps.map((step, index) => {
          const state = skippedSteps.has(step.id)
            ? "skipped"
            : index < currentStepIndex
              ? "complete"
              : index === currentStepIndex
                ? "current"
                : "upcoming";

          return (
            <li
              aria-current={state === "current" ? "step" : undefined}
              className={cn(
                "motion-progress-step border-border bg-surface grid h-full min-h-28 grid-cols-[2rem_minmax(0,1fr)] items-start gap-3 rounded-md border p-3",
                state === "current" && "border-primary bg-info-subtle",
                state === "skipped" && "bg-surface-subtle border-dashed",
              )}
              key={step.id}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "motion-progress-dot border-border-strong bg-surface-subtle text-muted flex size-8 items-center justify-center rounded-full border text-xs font-bold",
                  state === "complete" && "border-success bg-success text-white",
                  state === "current" && "border-primary bg-primary text-white",
                  state === "skipped" && "border-border-strong bg-surface text-muted",
                )}
              >
                {state === "complete" ? (
                  <Check className="size-4" strokeWidth={2.4} />
                ) : state === "skipped" ? (
                  <Minus className="size-4" strokeWidth={2.4} />
                ) : (
                  index + 1
                )}
              </span>
              <span className="min-w-0">
                <span className="text-foreground block text-sm leading-5 font-semibold [overflow-wrap:anywhere]">
                  {step.label}
                </span>
                {step.description ? (
                  <span className="text-muted mt-1 block text-xs leading-5 [overflow-wrap:anywhere]">
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

function progressGridColumns(stepCount: number): string {
  if (stepCount <= 1) return "grid-cols-1";
  if (stepCount === 2) return "sm:grid-cols-2";
  if (stepCount === 3) return "sm:grid-cols-2 lg:grid-cols-3";
  if (stepCount === 4) return "sm:grid-cols-2 xl:grid-cols-4";
  if (stepCount === 5) return "sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5";

  return "sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6";
}
