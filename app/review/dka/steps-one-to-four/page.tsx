import { ArrowLeft } from "lucide-react";
import type { Metadata, Route } from "next";
import Link from "next/link";

import { SafetyAlert } from "@/components/clinical";
import { AppShell } from "@/components/layout/app-shell";
import {
  DkaStepsOneToFourReview,
  type DkaSyntheticReviewCase,
} from "@/components/pathways/dka/steps-one-to-four-review";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DKA_SOURCE_ID,
  dkaSourceSteps,
  dkaSyntheticCases,
  evaluateDkaSourceCurrentnessGate,
  evaluateDkaStepsOneToFour,
  type DkaPreviewStepNumber,
} from "@/src/clinical/pathways/dka";
import { loadClinicalSourceRegistry } from "@/src/clinical/sources/registry";

export const metadata: Metadata = {
  title: "DKA Steps 1–4 technical review",
};

export default async function DkaStepsOneToFourPage({
  searchParams,
}: {
  searchParams: Promise<{ case?: string }>;
}) {
  const registry = loadClinicalSourceRegistry();
  const source = registry.getSource(DKA_SOURCE_ID);

  if (!source) {
    throw new Error("The DKA source is not registered.");
  }

  const gate = evaluateDkaSourceCurrentnessGate(source, registry.auditedOn);
  const { case: requestedCase } = await searchParams;
  const initialCaseId = dkaSyntheticCases.some((item) => item.id === requestedCase)
    ? requestedCase!
    : dkaSyntheticCases[0]!.id;
  const localTechnicalPreview = process.env.NODE_ENV === "development";
  const cases: readonly DkaSyntheticReviewCase[] = localTechnicalPreview
    ? dkaSyntheticCases.map((item) => ({ ...item, result: evaluateDkaStepsOneToFour(item.input) }))
    : [];
  const steps = dkaSourceSteps.slice(0, 4).map((step) => ({
    stepNumber: step.stepNumber as DkaPreviewStepNumber,
    title: step.title,
  }));

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="danger">Clinical execution blocked</Badge>
              <Badge variant="info">Synthetic technical preview</Badge>
            </div>
            <h1 className="text-foreground mt-4 text-2xl font-bold sm:text-[1.75rem]">
              DKA Steps 1–4
            </h1>
            <p className="text-muted mt-2 max-w-3xl text-sm leading-6">
              Review initial assessment, diagnostic criteria, the first fluid branch and the
              weight-based rate against the supplied adult pathway.
            </p>
          </div>
          <Button asChild variant="secondary">
            <Link href={"/review/dka/calculator" as Route}>
              <ArrowLeft aria-hidden="true" />
              Calculator foundation
            </Link>
          </Button>
        </header>

        {localTechnicalPreview ? (
          <DkaStepsOneToFourReview
            cases={cases}
            gate={gate}
            initialCaseId={initialCaseId}
            steps={steps}
          />
        ) : (
          <SafetyAlert level="critical" title="Technical preview unavailable">
            The supplied source is not cleared for public display or clinical use. Its first four
            stages are available for local technical verification only; clinical review and approval
            remain required.
          </SafetyAlert>
        )}
      </div>
    </AppShell>
  );
}
