import { ArrowDown, ArrowRight, ArrowUp } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const accentStyles = {
  calcium: {
    border: "border-t-warning",
    icon: "bg-warning-subtle text-warning-strong",
  },
  potassium: {
    border: "border-t-success",
    icon: "bg-success-subtle text-success-strong",
  },
  sodium: {
    border: "border-t-primary",
    icon: "bg-info-subtle text-info-strong",
  },
} as const;

interface PathwayCardProps {
  accent: keyof typeof accentStyles;
  direction: "high" | "low";
  electrolyte: string;
  href: Route;
  name: string;
  organisation: string;
  reviewDate: string;
  sourceTitle: string;
  symbol: string;
  version: string;
}

export function PathwayCard({
  accent,
  direction,
  electrolyte,
  href,
  name,
  organisation,
  reviewDate,
  sourceTitle,
  symbol,
  version,
}: PathwayCardProps) {
  const styles = accentStyles[accent];
  const DirectionIcon = direction === "low" ? ArrowDown : ArrowUp;

  return (
    <article
      className={`motion-surface border-border bg-surface shadow-card flex min-h-[22rem] flex-col rounded-lg border border-t-2 p-5 ${styles.border}`}
    >
      <div className="flex min-h-12 items-start justify-between gap-3">
        <span
          aria-hidden="true"
          className={`flex h-11 min-w-14 shrink-0 items-center justify-center gap-1 rounded-md px-2 text-xs font-bold ${styles.icon}`}
        >
          {symbol}
          <DirectionIcon className="size-3.5" strokeWidth={2.2} />
        </span>
        <Badge variant="info">Interactive</Badge>
      </div>

      <div className="mt-5">
        <p className="text-muted text-xs font-semibold">{electrolyte} pathway</p>
        <h3 className="text-foreground mt-1 text-lg font-bold">{name}</h3>
      </div>

      <dl className="border-border mt-5 grid flex-1 grid-cols-2 gap-3 border-t pt-4 text-xs">
        <div className="col-span-2">
          <dt className="text-muted">Primary source</dt>
          <dd className="text-foreground mt-1 line-clamp-2 font-semibold">{sourceTitle}</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-muted">Organisation</dt>
          <dd className="text-muted-strong mt-1 line-clamp-2">{organisation}</dd>
        </div>
        <div>
          <dt className="text-muted">Document version</dt>
          <dd className="text-foreground mt-1 font-semibold">{version}</dd>
        </div>
        <div>
          <dt className="text-muted">Source review</dt>
          <dd className="text-foreground mt-1 font-semibold">{reviewDate}</dd>
        </div>
      </dl>

      <Button asChild className="mt-5 w-full" variant="secondary">
        <Link aria-label={`Open ${name} assessment`} href={href} prefetch={false}>
          Open assessment
          <ArrowRight aria-hidden="true" />
        </Link>
      </Button>
    </article>
  );
}
