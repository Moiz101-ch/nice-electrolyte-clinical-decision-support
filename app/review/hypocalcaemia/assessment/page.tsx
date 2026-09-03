import { ArrowLeft, ClipboardCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { SafetyAlert } from "@/components/clinical";
import { AppShell } from "@/components/layout/app-shell";
import { HypocalcaemiaAssessmentReview } from "@/components/pathways/hypocalcaemia/assessment-review";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { hypocalcaemiaManagementPathwayDefinition } from "@/src/clinical/pathways/hypocalcaemia";

export const metadata: Metadata = {
  title: "Hypocalcaemia assessment and management review",
};

export default function HypocalcaemiaAssessmentPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="warning">Hypocalcaemia</Badge>
              <Badge variant="review">
                Pathway v{hypocalcaemiaManagementPathwayDefinition.version}
              </Badge>
            </div>
            <h1 className="text-foreground mt-4 text-2xl font-bold sm:text-[1.75rem]">
              Hypocalcaemia assessment and management
            </h1>
            <p className="text-muted mt-2 max-w-3xl text-sm leading-6">
              Connected technical review of adjusted calcium, source-listed findings, diagnostic
              context, cause safeguards, mild management and severe symptomatic emergency
              management.
            </p>
          </div>
          <Button asChild variant="secondary">
            <Link href="/assessment/new">
              <ArrowLeft aria-hidden="true" />
              Pathway reviews
            </Link>
          </Button>
        </header>

        <SafetyAlert level="critical" title="Unapproved pathway preview - do not use clinically">
          This source transcription is displayed for technical and clinical review only. Follow the
          current approved local pathway and emergency escalation process for patient care.
        </SafetyAlert>

        <HypocalcaemiaAssessmentReview />

        <footer className="text-muted flex items-start gap-2 text-xs leading-5">
          <ClipboardCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          Entered preview values remain in this browser page and are not saved as a patient record.
        </footer>
      </div>
    </AppShell>
  );
}
