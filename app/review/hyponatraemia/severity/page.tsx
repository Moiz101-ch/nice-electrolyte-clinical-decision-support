import { ArrowLeft, ClipboardCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { PathwayProgress, SafetyAlert } from "@/components/clinical";
import { AppShell } from "@/components/layout/app-shell";
import { HyponatraemiaSeverityReview } from "@/components/pathways/hyponatraemia/severity-review";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { hyponatraemiaSeverityPathwayDefinition } from "@/src/clinical/pathways/hyponatraemia";

export const metadata: Metadata = {
  title: "Hyponatraemia severity review",
};

const progressSteps = [
  { description: "Hyponatraemia", id: "focus", label: "Assessment focus" },
  { description: "Current step", id: "sodium", label: "Sodium result" },
  { description: "Review available", id: "fluid-status", label: "Fluid status" },
  { description: "Not implemented", id: "result", label: "Management result" },
] as const;

export default function HyponatraemiaSeverityPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="info">Hyponatraemia</Badge>
              <Badge variant="review">
                Pathway v{hyponatraemiaSeverityPathwayDefinition.version}
              </Badge>
            </div>
            <h1 className="text-foreground mt-4 text-2xl font-bold sm:text-[1.75rem]">
              Sodium severity review
            </h1>
            <p className="text-muted mt-2 max-w-3xl text-sm leading-6">
              Technical preview of source-derived sodium severity classification. This pathway is
              not approved for clinical use.
            </p>
          </div>
          <Button asChild variant="secondary">
            <Link href="/">
              <ArrowLeft aria-hidden="true" />
              Return home
            </Link>
          </Button>
        </header>

        <SafetyAlert level="warning" title="Classification only — no management output">
          This preview assigns a source severity band only. Follow approved local guidance and
          escalation procedures for clinical care.
        </SafetyAlert>

        <section aria-labelledby="severity-progress-title">
          <h2 className="sr-only" id="severity-progress-title">
            Hyponatraemia pathway progress
          </h2>
          <PathwayProgress currentStepId="sodium" steps={progressSteps} />
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start">
          <HyponatraemiaSeverityReview />
          <div className="space-y-5">
            <SafetyAlert level="warning" title="Boundary requires clinical review">
              The source prints moderate as 125–129 and mild as 130–135. Decimal values above 129
              and below 130 are not assigned until a clinical reviewer confirms the intended
              boundary.
            </SafetyAlert>
          </div>
        </section>

        <footer className="text-muted flex items-start gap-2 text-xs leading-5">
          <ClipboardCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          The entered preview value remains in this browser page and is not saved as a patient
          record.
        </footer>
      </div>
    </AppShell>
  );
}
