import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex min-h-6 items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
  {
    variants: {
      variant: {
        neutral: "border-border bg-surface-subtle text-muted-strong",
        info: "border-info-border bg-info-subtle text-info-strong",
        success: "border-success-border bg-success-subtle text-success-strong",
        warning: "border-warning-border bg-warning-subtle text-warning-strong",
        danger: "border-danger-border bg-danger-subtle text-danger-strong",
        review: "border-review-border bg-review-subtle text-review-strong",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  },
);

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
