import { ArrowLeft, ClipboardCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { SafetyAlert } from "@/components/clinical";
import { AppShell } from "@/components/layout/app-shell";
import { HyponatraemiaConnectedAssessmentReview } from "@/components/pathways/hyponatraemia/connected-assessment-review";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HYPONATRAEMIA_CONNECTED_ASSESSMENT_VERSION } from "@/src/clinical/pathways/hyponatraemia";

export const metadata: Metadata = {
  title: "Connected Hyponatraemia assessment review",
};

export default function HyponatraemiaConnectedAssessmentPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="info">Connected review</Badge>
              <Badge variant="review">Pathway v{HYPONATRAEMIA_CONNECTED_ASSESSMENT_VERSION}</Badge>
            </div>
            <h1 className="text-foreground mt-4 text-2xl font-bold sm:text-[1.75rem]">
              Hyponatraemia assessment
            </h1>
            <p className="text-muted mt-2 max-w-3xl text-sm leading-6">
              Confirm the available adult assessment information and review the deterministic
              pathway output.
            </p>
          </div>
          <Button asChild variant="secondary">
            <Link href="/assessment/new">
              <ArrowLeft aria-hidden="true" />
              All workflows
            </Link>
          </Button>
        </header>

        <SafetyAlert level="critical" title="Unapproved pathway review - do not use clinically">
          This connected workflow is available for technical testing, not patient care. Use current
          approved local guidance and escalation procedures for clinical decisions.
        </SafetyAlert>

        <section aria-labelledby="connected-assessment-title">
          <h2 className="sr-only" id="connected-assessment-title">
            Connected Hyponatraemia assessment workflow
          </h2>
          <HyponatraemiaConnectedAssessmentReview />
        </section>

        <footer className="text-muted flex items-start gap-2 text-xs leading-5">
          <ClipboardCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          Answers remain only in this browser view and are cleared on refresh. No patient record is
          created.
        </footer>
      </div>
    </AppShell>
  );
}
