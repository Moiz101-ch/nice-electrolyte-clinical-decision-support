import { Check, Circle, Clock3, type LucideIcon } from "lucide-react";
import { useId } from "react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type MonitoringStatus = "complete" | "current" | "upcoming";

export interface MonitoringTimelineItem {
  description: string;
  id: string;
  label: string;
  status: MonitoringStatus;
  timing: string;
}

const timelineStatusConfig = {
  complete: { icon: Check, label: "Complete", variant: "success" },
  current: { icon: Clock3, label: "Current", variant: "info" },
  upcoming: { icon: Circle, label: "Upcoming", variant: "neutral" },
} satisfies Record<
  MonitoringStatus,
  { icon: LucideIcon; label: string; variant: "info" | "neutral" | "success" }
>;

export function MonitoringTimeline({
  items,
  title,
}: {
  items: readonly MonitoringTimelineItem[];
  title: string;
}) {
  const titleId = useId();

  return (
    <section aria-labelledby={titleId}>
      <h2 className="text-foreground text-base font-semibold" id={titleId}>
        {title}
      </h2>
      <ol className="border-border mt-4 border-y">
        {items.map((item, index) => {
          const config = timelineStatusConfig[item.status];
          const Icon = config.icon;

          return (
            <li
              className={cn(
                "grid grid-cols-[2rem_minmax(0,1fr)] gap-3 py-4",
                index > 0 && "border-border border-t",
              )}
              key={item.id}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "bg-surface-subtle text-muted flex size-8 items-center justify-center rounded-full",
                  item.status === "complete" && "bg-success-subtle text-success",
                  item.status === "current" && "bg-info-subtle text-primary",
                )}
              >
                <Icon className="size-4" strokeWidth={2} />
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-foreground text-sm font-semibold">{item.label}</h3>
                  <Badge variant={config.variant}>{config.label}</Badge>
                </div>
                <p className="text-primary mt-1 text-xs font-semibold">{item.timing}</p>
                <p className="text-muted mt-1 text-xs leading-5">{item.description}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
