import type { ReactNode } from "react";

import { Alert } from "@/components/ui/alert";

const safetyLevelConfig = {
  critical: { label: "Critical safety alert", variant: "danger" },
  information: { label: "Safety information", variant: "info" },
  warning: { label: "Safety warning", variant: "warning" },
} as const;

export interface SafetyAlertProps {
  children: ReactNode;
  level?: keyof typeof safetyLevelConfig;
  title: string;
}

export function SafetyAlert({ children, level = "warning", title }: SafetyAlertProps) {
  const config = safetyLevelConfig[level];

  return (
    <Alert
      aria-label={`${config.label}: ${title}`}
      role={level === "critical" ? "alert" : "note"}
      title={title}
      variant={config.variant}
    >
      <p>{children}</p>
    </Alert>
  );
}
