import { ArrowLeft, ClipboardCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { SafetyAlert } from "@/components/clinical";
import { AppShell } from "@/components/layout/app-shell";
import { HyponatraemiaFluidStatusReview } from "@/components/pathways/hyponatraemia/fluid-status-review";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { hyponatraemiaInitialAssessmentPathwayDefinition } from "@/src/clinical/pathways/hyponatraemia";

export const metadata: Metadata = {
  title: "Hyponatraemia fluid-status review",
};

export default function HyponatraemiaFluidStatusPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="info">Hyponatraemia</Badge>
              <Badge variant="review">
                Pathway v{hyponatraemiaInitialAssessmentPathwayDefinition.version}
              </Badge>
            </div>
            <h1 className="text-foreground mt-4 text-2xl font-bold sm:text-[1.75rem]">
              Fluid-status workflow review
            </h1>
            <p className="text-muted mt-2 max-w-3xl text-sm leading-6">
              Technical preview of the source-derived volume-state and cerebral-oedema-sign
              branches. This pathway is not approved for clinical use.
            </p>
          </div>
          <Button asChild variant="secondary">
            <Link href="/review/hyponatraemia/severity">
              <ArrowLeft aria-hidden="true" />
              Severity review
            </Link>
          </Button>
        </header>

        <SafetyAlert level="warning" title="Branch classification only - no management output">
          This preview selects a source branch only. Follow approved local guidance and escalation
          procedures for clinical care.
        </SafetyAlert>

        <section aria-labelledby="fluid-review-title">
          <h2 className="sr-only" id="fluid-review-title">
            Hyponatraemia fluid-status workflow
          </h2>
          <HyponatraemiaFluidStatusReview />
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          <SafetyAlert level="information" title="Adaptive pathway route">
            Hypovolaemic and euvolaemic selections request the six configured signs. Hypervolaemic
            selection reaches its endpoint directly.
          </SafetyAlert>
          <SafetyAlert level="warning" title="Uncertainty stops the workflow">
            Unable to establish safely records uncertainty without selecting downstream clinical
            content.
          </SafetyAlert>
        </section>

        <footer className="text-muted flex items-start gap-2 text-xs leading-5">
          <ClipboardCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          Review inputs remain in this browser page and are not saved as a patient record.
        </footer>
      </div>
    </AppShell>
  );
}
