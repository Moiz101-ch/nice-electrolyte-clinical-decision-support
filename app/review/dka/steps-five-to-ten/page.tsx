import { ArrowLeft } from "lucide-react";
import type { Metadata, Route } from "next";
import Link from "next/link";

import { SafetyAlert } from "@/components/clinical";
import { AppShell } from "@/components/layout/app-shell";
import {
  DkaStepsFiveToTenReview,
  type DkaLaterReviewCase,
} from "@/components/pathways/dka/steps-five-to-ten-review";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DKA_SOURCE_ID,
  dkaLaterSyntheticCases,
  dkaSourceSteps,
  dkaSyntheticCases,
  evaluateDkaSourceCurrentnessGate,
  evaluateDkaStepsFiveToTen,
  evaluateDkaStepsOneToFour,
  type DkaLaterStepNumber,
} from "@/src/clinical/pathways/dka";
import { loadClinicalSourceRegistry } from "@/src/clinical/sources/registry";

export const metadata: Metadata = {
  title: "DKA Steps 5-10 technical review",
};

export default async function DkaStepsFiveToTenPage({
  searchParams,
}: {
  searchParams: Promise<{ initial?: string }>;
}) {
  const registry = loadClinicalSourceRegistry();
  const source = registry.getSource(DKA_SOURCE_ID);

  if (!source) {
    throw new Error("The DKA source is not registered.");
  }

  const gate = evaluateDkaSourceCurrentnessGate(source, registry.auditedOn);
  const { initial: requestedInitial } = await searchParams;
  const initialCase =
    dkaSyntheticCases.find(
      (item) =>
        item.id === requestedInitial &&
        evaluateDkaStepsOneToFour(item.input).stages[3].status === "complete",
    ) ?? dkaSyntheticCases[0]!;
  const initialResult = evaluateDkaStepsOneToFour(initialCase.input);
  const localTechnicalPreview = process.env.NODE_ENV === "development";
  const cases: readonly DkaLaterReviewCase[] = localTechnicalPreview
    ? dkaLaterSyntheticCases.map((item) => {
        const input = {
          ...item.input,
          initial: initialCase.input,
          monitoring: {
            ...item.input.monitoring,
            insulinRateUnitsPerHour: initialResult.calculation?.output.value ?? null,
          },
        };
        return { ...item, input, result: evaluateDkaStepsFiveToTen(input) };
      })
    : [];
  const steps = dkaSourceSteps.slice(4).map((step) => ({
    stepNumber: step.stepNumber as DkaLaterStepNumber,
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
              DKA Steps 5-10
            </h1>
            <p className="text-muted mt-2 max-w-3xl text-sm leading-6">
              Connected technical review of further assessment, fluids, monitoring, response and the
              blocked resolution and conversion stages.
            </p>
          </div>
          <Button asChild variant="secondary">
            <Link href={`/review/dka/steps-one-to-four?case=${initialCase.id}` as Route}>
              <ArrowLeft aria-hidden="true" />
              Steps 1-4
            </Link>
          </Button>
        </header>

        {localTechnicalPreview ? (
          <DkaStepsFiveToTenReview
            cases={cases}
            gate={gate}
            initialCaseLabel={initialCase.label}
            steps={steps}
          />
        ) : (
          <SafetyAlert level="critical" title="Technical preview unavailable">
            The supplied source is not cleared for public display or clinical use. Later DKA stages
            are available for local technical verification only; clinical review and approval remain
            required.
          </SafetyAlert>
        )}
      </div>
    </AppShell>
  );
}
