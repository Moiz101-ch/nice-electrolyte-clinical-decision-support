import { ArrowLeft, ArrowRight, ClipboardCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { SafetyAlert } from "@/components/clinical";
import { AppShell } from "@/components/layout/app-shell";
import { HyponatraemiaEmergencyManagementReview } from "@/components/pathways/hyponatraemia/emergency-management-review";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { hyponatraemiaEmergencyPathwayDefinition } from "@/src/clinical/pathways/hyponatraemia";

export const metadata: Metadata = {
  title: "Hyponatraemia emergency-management review",
};

export default function HyponatraemiaEmergencyManagementPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="danger">Emergency review</Badge>
              <Badge variant="review">
                Pathway v{hyponatraemiaEmergencyPathwayDefinition.version}
              </Badge>
            </div>
            <h1 className="text-foreground mt-4 text-2xl font-bold sm:text-[1.75rem]">
              Hyponatraemia emergency management
            </h1>
            <p className="text-muted mt-2 max-w-3xl text-sm leading-6">
              Technical review of the supplied Trust pathway&apos;s symptomatic emergency branch.
              This implementation is not clinically approved or active.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="secondary">
              <Link href="/review/hyponatraemia/fluid-status">
                <ArrowLeft aria-hidden="true" />
                Fluid-status review
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={{ pathname: "/review/hyponatraemia/result" }}>
                Result preview
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </header>

        <SafetyAlert level="critical" title="Unapproved treatment preview - do not use clinically">
          These source-derived instructions are displayed for technical and clinical review only.
          Use the current approved local pathway and emergency escalation process for patient care.
        </SafetyAlert>

        <section aria-labelledby="emergency-review-title">
          <h2 className="sr-only" id="emergency-review-title">
            Hyponatraemia emergency-management workflow
          </h2>
          <HyponatraemiaEmergencyManagementReview />
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          <SafetyAlert level="warning" title="Unstated four-hour interval">
            Actions are defined below 4 mmol/L and above 5 mmol/L. Values from 4 through 5 mmol/L
            stop for clinical review without selecting either action.
          </SafetyAlert>
          <SafetyAlert level="information" title="Adult pathway boundary">
            The displayed adult dose and correction limit remain locked for clinical review. They
            are not labelled as a NICE recommendation.
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
