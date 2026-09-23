import { ArrowLeft, ArrowRight, ClipboardCheck } from "lucide-react";
import type { Metadata, Route } from "next";
import Link from "next/link";

import { SafetyAlert } from "@/components/clinical";
import { AppShell } from "@/components/layout/app-shell";
import { DkaCalculatorFoundationReview } from "@/components/pathways/dka/calculator-foundation-review";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DKA_SOURCE_ID,
  createDkaCalculatorFoundationSession,
  dkaInputKindContracts,
  dkaTransparentResultFields,
  evaluateDkaSourceCurrentnessGate,
  getDkaFoundationDisplaySteps,
} from "@/src/clinical/pathways/dka";
import { loadClinicalSourceRegistry } from "@/src/clinical/sources/registry";

export const metadata: Metadata = {
  title: "DKA calculator foundation review",
};

export default function DkaCalculatorFoundationPage() {
  const registry = loadClinicalSourceRegistry();
  const source = registry.getSource(DKA_SOURCE_ID);

  if (!source) {
    throw new Error("The DKA source is not registered.");
  }

  const gate = evaluateDkaSourceCurrentnessGate(source, registry.auditedOn);
  const initialSession = createDkaCalculatorFoundationSession();
  const detailedReviewAvailable =
    process.env.NODE_ENV === "development" || source.reuseStatus === "approved-for-public-display";

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="danger">Clinical execution blocked</Badge>
              <Badge variant="info">Technical foundation</Badge>
            </div>
            <h1 className="text-foreground mt-4 text-2xl font-bold sm:text-[1.75rem]">
              DKA calculator foundation
            </h1>
            <p className="text-muted mt-2 max-w-3xl text-sm leading-6">
              Review the typed session, deterministic calculation and source-mapping contracts
              alongside the source-gated Steps 1–4 technical preview.
            </p>
          </div>
          <Button asChild variant="secondary">
            <Link href={"/review/dka/source-currentness" as Route}>
              <ArrowLeft aria-hidden="true" />
              Source-currentness gate
            </Link>
          </Button>
        </header>

        {detailedReviewAvailable ? (
          <>
            <DkaCalculatorFoundationReview
              gate={gate}
              initialSession={initialSession}
              inputKindContracts={dkaInputKindContracts}
              resultFields={dkaTransparentResultFields}
              steps={getDkaFoundationDisplaySteps()}
            />

            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link href={"/review/dka/current-calculator" as Route}>
                  Open current JBDS calculator
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild>
                <Link href={"/review/dka/connected-calculator" as Route}>
                  Open historical York calculator
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href={"/review/dka/steps-one-to-four" as Route}>
                  Review Steps 1–4
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </>
        ) : (
          <SafetyAlert level="critical" title="Calculator review unavailable">
            The registered source is not cleared for public display or clinical use. Its detailed
            calculator mapping is available for local technical verification only.
          </SafetyAlert>
        )}

        <footer className="text-muted flex items-start gap-2 text-xs leading-5">
          <ClipboardCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          This technical route does not collect patient data or provide clinical recommendations.
        </footer>
      </div>
    </AppShell>
  );
}
