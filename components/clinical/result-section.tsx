import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const resultToneStyles = {
  danger: "bg-danger-subtle text-danger-strong",
  info: "bg-info-subtle text-primary",
  neutral: "bg-surface-subtle text-muted-strong",
  success: "bg-success-subtle text-success-strong",
  warning: "bg-warning-subtle text-warning-strong",
} as const;

export interface ResultSectionProps {
  children: ReactNode;
  description?: string;
  dividers?: boolean;
  headingAs?: "h2" | "h3";
  icon: LucideIcon;
  status?: string;
  title: string;
  tone?: keyof typeof resultToneStyles;
}

export function ResultSection({
  children,
  description,
  dividers = true,
  headingAs = "h2",
  icon: Icon,
  status,
  title,
  tone = "neutral",
}: ResultSectionProps) {
  const Heading = headingAs;

  return (
    <section
      className={cn(
        "grid grid-cols-[2.5rem_minmax(0,1fr)] gap-4 py-5",
        dividers && "border-border border-y",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "flex size-10 items-center justify-center rounded-md",
          resultToneStyles[tone],
        )}
      >
        <Icon className="size-5" strokeWidth={1.8} />
      </span>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Heading className="text-foreground text-base font-semibold">{title}</Heading>
          {status ? <Badge variant="neutral">{status}</Badge> : null}
        </div>
        {description ? <p className="text-muted mt-1 text-xs leading-5">{description}</p> : null}
        <div className="text-muted-strong mt-3 text-sm leading-6">{children}</div>
      </div>
    </section>
  );
}
