import { ArrowLeft, ArrowRight, ClipboardCheck } from "lucide-react";
import type { Metadata, Route } from "next";
import Link from "next/link";

import { PathwayProgress, SafetyAlert } from "@/components/clinical";
import { AppShell } from "@/components/layout/app-shell";
import { HyperkalaemiaSeverityReview } from "@/components/pathways/hyperkalaemia/severity-review";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { hyperkalaemiaSeverityPathwayDefinition } from "@/src/clinical/pathways/hyperkalaemia";

export const metadata: Metadata = {
  title: "Hyperkalaemia severity review",
};

const progressSteps = [
  { description: "Hyperkalaemia", id: "focus", label: "Assessment focus" },
  { description: "Current step", id: "potassium", label: "Potassium result" },
  { description: "Connected review available", id: "ecg", label: "ECG review" },
  { description: "Not implemented", id: "management", label: "Timed management" },
] as const;

export default function HyperkalaemiaSeverityPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="success">Hyperkalaemia</Badge>
              <Badge variant="review">
                Pathway v{hyperkalaemiaSeverityPathwayDefinition.version}
              </Badge>
            </div>
            <h1 className="text-foreground mt-4 text-2xl font-bold sm:text-[1.75rem]">
              Potassium severity review
            </h1>
            <p className="text-muted mt-2 max-w-3xl text-sm leading-6">
              Technical preview of source-derived potassium severity and initial checks. This
              pathway is not approved for clinical use.
            </p>
          </div>
          <Button asChild variant="secondary">
            <Link href="/assessment/new">
              <ArrowLeft aria-hidden="true" />
              Pathway reviews
            </Link>
          </Button>
        </header>

        <SafetyAlert level="warning" title="Technical review only - no treatment output">
          This preview classifies severity and shows initial checks only. Follow current approved
          local guidance and emergency escalation procedures for patient care.
        </SafetyAlert>

        <section aria-labelledby="hyperkalaemia-progress-title">
          <h2 className="sr-only" id="hyperkalaemia-progress-title">
            Hyperkalaemia pathway progress
          </h2>
          <PathwayProgress currentStepId="potassium" steps={progressSteps} />
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start">
          <HyperkalaemiaSeverityReview />
          <aside className="space-y-5" aria-label="Review notes">
            <SafetyAlert level="warning" title="Reporting precision requires review">
              The protocol prints one-decimal severity bands. Values in the gaps above 5.9 or 6.4
              are not rounded or classified.
            </SafetyAlert>
            <SafetyAlert level="information" title="Source review approaching">
              The supplied protocol records a review date of November 2026. Clinical collaborators
              must confirm currentness before project approval.
            </SafetyAlert>
            <Button asChild className="w-full" variant="outline">
              <Link href={"/review/hyperkalaemia/assessment" as Route}>
                Open connected ECG review
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          </aside>
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
