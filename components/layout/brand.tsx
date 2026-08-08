import { ShieldPlus } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      aria-label="NICE Electrolyte CDS home"
      className="inline-flex min-w-0 items-center gap-3 rounded-md"
      href="/"
    >
      <span className="bg-primary flex size-9 shrink-0 items-center justify-center rounded-md text-white shadow-xs">
        <ShieldPlus aria-hidden="true" className="size-5" strokeWidth={2} />
      </span>
      <span className={cn("min-w-0", compact && "hidden sm:block")}>
        <span className="text-foreground block truncate text-sm font-bold sm:text-base">
          NICE Electrolyte CDS
        </span>
        <span className="text-muted block truncate text-xs">Clinical Decision Support</span>
      </span>
    </Link>
  );
}
