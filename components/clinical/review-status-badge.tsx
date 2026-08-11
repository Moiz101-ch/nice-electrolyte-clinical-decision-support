import {
  CircleCheck,
  Clock3,
  FileClock,
  FileWarning,
  History,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { ClinicalSource } from "@/src/clinical/sources/schema";

export type ClinicalReviewStatus = ClinicalSource["clinicalReviewStatus"];

const reviewStatusConfig = {
  "approved-for-project-use": {
    icon: ShieldCheck,
    label: "Approved for project use",
    variant: "success",
  },
  "awaiting-clinical-review": {
    icon: Clock3,
    label: "Awaiting clinical review",
    variant: "review",
  },
  "changes-requested": {
    icon: FileWarning,
    label: "Changes requested",
    variant: "warning",
  },
  "clinically-reviewed": {
    icon: CircleCheck,
    label: "Clinically reviewed",
    variant: "info",
  },
  draft: {
    icon: FileClock,
    label: "Draft",
    variant: "neutral",
  },
  superseded: {
    icon: History,
    label: "Superseded",
    variant: "neutral",
  },
} satisfies Record<
  ClinicalReviewStatus,
  {
    icon: LucideIcon;
    label: string;
    variant: "info" | "neutral" | "review" | "success" | "warning";
  }
>;

export function ReviewStatusBadge({ status }: { status: ClinicalReviewStatus }) {
  const config = reviewStatusConfig[status];
  const Icon = config.icon;

  return (
    <Badge variant={config.variant}>
      <Icon aria-hidden="true" className="size-3.5" strokeWidth={1.9} />
      {config.label}
    </Badge>
  );
}
