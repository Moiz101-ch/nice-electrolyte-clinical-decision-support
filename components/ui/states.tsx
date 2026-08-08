import { CircleAlert, ClipboardList, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { Skeleton } from "./skeleton";

interface StateProps {
  action?: ReactNode;
  className?: string;
  description: string;
  icon?: LucideIcon;
  title: string;
}

export function EmptyState({
  action,
  className,
  description,
  icon: Icon = ClipboardList,
  title,
}: StateProps) {
  return (
    <div
      className={cn(
        "flex min-h-64 flex-col items-center justify-center px-5 py-10 text-center",
        className,
      )}
    >
      <div className="bg-info-subtle text-primary flex size-12 items-center justify-center rounded-full">
        <Icon aria-hidden="true" className="size-6" strokeWidth={1.7} />
      </div>
      <h2 className="text-foreground mt-4 text-base font-semibold">{title}</h2>
      <p className="text-muted mt-2 max-w-md text-sm leading-6">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function ErrorState({
  action,
  className,
  description,
  icon: Icon = CircleAlert,
  title,
}: StateProps) {
  return (
    <div
      className={cn(
        "flex min-h-64 flex-col items-center justify-center px-5 py-10 text-center",
        className,
      )}
    >
      <div className="bg-danger-subtle text-danger flex size-12 items-center justify-center rounded-full">
        <Icon aria-hidden="true" className="size-6" strokeWidth={1.7} />
      </div>
      <h2 className="text-foreground mt-4 text-base font-semibold">{title}</h2>
      <p className="text-muted mt-2 max-w-md text-sm leading-6">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function LoadingState({ label = "Loading clinical workspace" }: { label?: string }) {
  return (
    <div aria-label={label} className="space-y-5" role="status">
      <span className="sr-only">{label}</span>
      <div className="space-y-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-full max-w-sm" />
        <Skeleton className="h-4 w-full max-w-xl" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-56" />
        <Skeleton className="h-56" />
      </div>
    </div>
  );
}
