import type { PathwayAction } from "@/src/clinical/engine";

export function ActionContent({ action }: { action: PathwayAction }) {
  return (
    <div className="min-w-0">
      <p className="text-foreground text-sm leading-6">{action.instruction}</p>
      {action.guidance ? (
        <div className="border-primary/30 mt-3 border-l-2 pl-4">
          <p className="text-foreground text-sm font-semibold">{action.guidance.title}</p>
          <ol className="text-muted mt-2 list-decimal space-y-1.5 pl-5 text-xs leading-5">
            {action.guidance.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </div>
      ) : null}
    </div>
  );
}
