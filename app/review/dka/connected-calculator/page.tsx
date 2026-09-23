import { ArrowLeft } from "lucide-react";
import type { Metadata, Route } from "next";
import Link from "next/link";

import { SafetyAlert } from "@/components/clinical";
import { AppShell } from "@/components/layout/app-shell";
import { DkaConnectedCalculatorReview } from "@/components/pathways/dka/connected-calculator-review";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  dkaLaterSyntheticCases,
  dkaSourceSteps,
  dkaSyntheticCases,
} from "@/src/clinical/pathways/dka";

export const metadata: Metadata = { title: "DKA connected technical calculator" };

export default function DkaConnectedCalculatorPage() {
  const localTechnicalPreview = process.env.NODE_ENV === "development";
  const standardLaterInput = dkaLaterSyntheticCases[0]!.input;
  const cases = localTechnicalPreview
    ? [
        ...dkaSyntheticCases.map((item) => ({
          id: `initial-${item.id}`,
          input: { ...standardLaterInput, initial: item.input },
          label: `Initial: ${item.label}`,
        })),
        ...dkaLaterSyntheticCases.map((item) => ({
          id: `later-${item.id}`,
          input: item.input,
          label: `Later: ${item.label}`,
        })),
      ]
    : [];

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl space-y-7">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="danger">Clinical execution blocked</Badge>
              <Badge variant="info">Synthetic technical preview</Badge>
            </div>
            <h1 className="text-foreground mt-4 text-2xl font-bold">DKA connected calculator</h1>
          </div>
          <Button asChild variant="secondary">
            <Link href={"/review/dka/calculator" as Route}>
              <ArrowLeft aria-hidden="true" />
              Calculator foundation
            </Link>
          </Button>
        </header>

        {localTechnicalPreview ? (
          <DkaConnectedCalculatorReview cases={cases} steps={dkaSourceSteps} />
        ) : (
          <SafetyAlert level="critical" title="Technical calculator unavailable">
            The supplied DKA source is not cleared for public display or clinical use. Connected
            testing is available only in local development with synthetic data.
          </SafetyAlert>
        )}
      </div>
    </AppShell>
  );
}
