import { ArrowLeft, ClipboardCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { PathwayProgress, SafetyAlert } from "@/components/clinical";
import { AppShell } from "@/components/layout/app-shell";
import { HyperkalaemiaTimedManagementReview } from "@/components/pathways/hyperkalaemia/timed-management-review";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { hyperkalaemiaTimedManagementPathwayDefinition } from "@/src/clinical/pathways/hyperkalaemia";

export const metadata: Metadata = {
  title: "Hyperkalaemia timed management review",
};

const progressSteps = [
  { description: "Hyperkalaemia", id: "focus", label: "Assessment focus" },
  { description: "Connected", id: "potassium", label: "Potassium result" },
  { description: "Connected", id: "ecg", label: "ECG review" },
  { description: "Current step", id: "management", label: "Timed management" },
] as const;

export default function HyperkalaemiaAssessmentPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="success">Hyperkalaemia</Badge>
              <Badge variant="review">
                Pathway v{hyperkalaemiaTimedManagementPathwayDefinition.version}
              </Badge>
            </div>
            <h1 className="text-foreground mt-4 text-2xl font-bold sm:text-[1.75rem]">
              Hyperkalaemia timed management
            </h1>
            <p className="text-muted mt-2 max-w-3xl text-sm leading-6">
              Connected technical review of potassium severity, ECG findings, timed actions,
              monitoring and recurrence prevention. This pathway is not approved for clinical use.
            </p>
          </div>
          <Button asChild variant="secondary">
            <Link href="/assessment/new">
              <ArrowLeft aria-hidden="true" />
              Pathway reviews
            </Link>
          </Button>
        </header>

        <SafetyAlert level="critical" title="Unapproved treatment preview - do not use clinically">
          These transcribed treatment instructions are displayed for technical and clinical review
          only. Follow the current approved local pathway and emergency escalation process for
          patient care.
        </SafetyAlert>

        <section aria-labelledby="hyperkalaemia-ecg-progress-title">
          <h2 className="sr-only" id="hyperkalaemia-ecg-progress-title">
            Hyperkalaemia ECG pathway progress
          </h2>
          <PathwayProgress currentStepId="management" steps={progressSteps} />
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
          <HyperkalaemiaTimedManagementReview />
          <aside aria-label="Review notes" className="space-y-5">
            <SafetyAlert level="information" title="Text labels only">
              No approved ECG waveform assets were supplied. The review therefore uses the six
              source-listed text labels without illustrative traces.
            </SafetyAlert>
            <SafetyAlert level="warning" title="Clinical review pending">
              Drug doses, timings, monitoring and escalation remain locked until the formal clinical
              review package is approved.
            </SafetyAlert>
            <SafetyAlert level="warning" title="Source conflict held">
              The protocol uses different sodium-zirconium initiation wording. The application does
              not generate that regimen until the conflict is clinically resolved.
            </SafetyAlert>
          </aside>
        </section>

        <footer className="text-muted flex items-start gap-2 text-xs leading-5">
          <ClipboardCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          The entered preview values remain in this browser page and are not saved as a patient
          record.
        </footer>
      </div>
    </AppShell>
  );
}
