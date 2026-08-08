import { CircleAlert, CircleCheck, CircleX, Info, type LucideIcon } from "lucide-react";
import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

const alertConfig = {
  info: {
    icon: Info,
    className: "border-info-border bg-info-subtle text-info-strong",
  },
  success: {
    icon: CircleCheck,
    className: "border-success-border bg-success-subtle text-success-strong",
  },
  warning: {
    icon: CircleAlert,
    className: "border-warning-border bg-warning-subtle text-warning-strong",
  },
  danger: {
    icon: CircleX,
    className: "border-danger-border bg-danger-subtle text-danger-strong",
  },
} satisfies Record<string, { icon: LucideIcon; className: string }>;

export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  variant?: keyof typeof alertConfig;
  children?: ReactNode;
}

export function Alert({ children, className, title, variant = "info", ...props }: AlertProps) {
  const config = alertConfig[variant];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "grid grid-cols-[auto_minmax(0,1fr)] gap-3 rounded-md border p-4 text-sm",
        config.className,
        className,
      )}
      {...props}
    >
      <Icon aria-hidden="true" className="mt-0.5 size-5" strokeWidth={1.8} />
      <div className="min-w-0">
        <p className="font-semibold">{title}</p>
        {children ? <div className="mt-1 leading-6">{children}</div> : null}
      </div>
    </div>
  );
}
