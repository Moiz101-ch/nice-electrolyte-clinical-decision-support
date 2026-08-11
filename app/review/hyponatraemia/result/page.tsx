import { ArrowLeft, ClipboardCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { SafetyAlert } from "@/components/clinical";
import { AppShell } from "@/components/layout/app-shell";
import { HyponatraemiaOperationalResultReview } from "@/components/pathways/hyponatraemia/operational-result-review";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HYPONATRAEMIA_OPERATIONAL_RESULT_VERSION } from "@/src/clinical/pathways/hyponatraemia";

export const metadata: Metadata = {
  title: "Hyponatraemia operational result review",
};

export default function HyponatraemiaOperationalResultPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="danger">Operational review</Badge>
              <Badge variant="review">Pathway v{HYPONATRAEMIA_OPERATIONAL_RESULT_VERSION}</Badge>
            </div>
            <h1 className="text-foreground mt-4 text-2xl font-bold sm:text-[1.75rem]">
              Hyponatraemia operational result
            </h1>
            <p className="text-muted mt-2 max-w-3xl text-sm leading-6">
              Consolidated technical review of one deterministic example, including actions,
              monitoring, safety, compatible causes, rationale, and governance status.
            </p>
          </div>
          <Button asChild variant="secondary">
            <Link href="/review/hyponatraemia/emergency-management">
              <ArrowLeft aria-hidden="true" />
              Emergency review
            </Link>
          </Button>
        </header>

        <SafetyAlert level="critical" title="Unapproved result preview - do not use clinically">
          This example is displayed for technical and clinical review only. Use the current approved
          local pathway and emergency escalation process for patient care.
        </SafetyAlert>

        <section aria-labelledby="operational-result-title">
          <h2 className="sr-only" id="operational-result-title">
            Representative hyponatraemia operational result
          </h2>
          <HyponatraemiaOperationalResultReview />
        </section>

        <footer className="text-muted flex items-start gap-2 text-xs leading-5">
          <ClipboardCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          This representative review state is fixed test data and is not a patient record.
        </footer>
      </div>
    </AppShell>
  );
}
