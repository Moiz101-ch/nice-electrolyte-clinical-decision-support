import { ArrowLeft, Calculator, ClipboardCheck } from "lucide-react";
import type { Metadata, Route } from "next";
import Link from "next/link";

import { SafetyAlert } from "@/components/clinical";
import { AppShell } from "@/components/layout/app-shell";
import { DkaSourceCurrentnessReview } from "@/components/pathways/dka/source-currentness-review";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DKA_SOURCE_ID,
  dkaSourceRules,
  dkaSourceSteps,
  dkaSupplementarySections,
  evaluateDkaSourceCurrentnessGate,
} from "@/src/clinical/pathways/dka";
import { loadClinicalSourceRegistry } from "@/src/clinical/sources/registry";

export const metadata: Metadata = {
  title: "DKA source-currentness review",
};

export default function DkaSourceCurrentnessPage() {
  const registry = loadClinicalSourceRegistry();
  const source = registry.getSource(DKA_SOURCE_ID);

  if (!source) {
    throw new Error("The DKA source is not registered.");
  }

  const gate = evaluateDkaSourceCurrentnessGate(source, registry.auditedOn);
  const detailedReviewAvailable =
    process.env.NODE_ENV === "development" || source.reuseStatus === "approved-for-public-display";

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="danger">DKA source overdue</Badge>
              <Badge variant="neutral">Governance review</Badge>
            </div>
            <h1 className="text-foreground mt-4 text-2xl font-bold sm:text-[1.75rem]">
              DKA source-currentness gate
            </h1>
            <p className="text-muted mt-2 max-w-3xl text-sm leading-6">
              Technical mapping of the supplied adult DKA pathway before its calculator foundation
              can become an active clinical workflow.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:items-end">
            <Button asChild variant="secondary">
              <Link href={"/review/dka/calculator" as Route}>
                <Calculator aria-hidden="true" />
                Review calculator foundation
              </Link>
            </Button>
            <Button asChild size="sm" variant="ghost">
              <Link href={"/#clinical-calculators" as Route}>
                <ArrowLeft aria-hidden="true" />
                Planned tools
              </Link>
            </Button>
          </div>
        </header>

        {detailedReviewAvailable ? (
          <DkaSourceCurrentnessReview
            gate={gate}
            rules={dkaSourceRules}
            source={source}
            steps={dkaSourceSteps}
            supplementarySections={dkaSupplementarySections}
          />
        ) : (
          <SafetyAlert level="critical" title="Detailed source review unavailable">
            The registered DKA source is overdue for review and not cleared for public display.
            Technical source mapping is limited to local development until reuse and clinical
            approval are resolved.
          </SafetyAlert>
        )}

        <footer className="text-muted flex items-start gap-2 text-xs leading-5">
          <ClipboardCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          This page contains source-governance information only and does not collect patient data.
        </footer>
      </div>
    </AppShell>
  );
}
