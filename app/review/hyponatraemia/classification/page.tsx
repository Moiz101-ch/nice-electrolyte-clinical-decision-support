import { ArrowLeft, ArrowRight, ClipboardCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { SafetyAlert } from "@/components/clinical";
import { AppShell } from "@/components/layout/app-shell";
import { HyponatraemiaOsmolalityClassificationReview } from "@/components/pathways/hyponatraemia/osmolality-classification-review";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { hyponatraemiaOsmolalityClassificationPathwayDefinition } from "@/src/clinical/pathways/hyponatraemia";

export const metadata: Metadata = {
  title: "Hyponatraemia classification review",
};

export default function HyponatraemiaClassificationPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="info">Hyponatraemia</Badge>
              <Badge variant="review">
                Pathway v{hyponatraemiaOsmolalityClassificationPathwayDefinition.version}
              </Badge>
            </div>
            <h1 className="text-foreground mt-4 text-2xl font-bold sm:text-[1.75rem]">
              Urine and osmolality classification
            </h1>
            <p className="text-muted mt-2 max-w-3xl text-sm leading-6">
              Technical review of the diagnostic classification workflow. Cause outputs are
              compatible categories and are not definitive diagnoses.
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

        <SafetyAlert level="warning" title="Unapproved classification preview">
          The supplied classification material has incomplete provenance. This workflow remains
          locked pending clinical review and must not be used as an approved diagnostic pathway.
        </SafetyAlert>

        <section aria-labelledby="classification-review-title">
          <h2 className="sr-only" id="classification-review-title">
            Hyponatraemia urine and osmolality classification workflow
          </h2>
          <HyponatraemiaOsmolalityClassificationReview />
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          <SafetyAlert level="information" title="Interpretation only">
            The result identifies compatible cause categories. It does not confirm a diagnosis or
            generate treatment instructions.
          </SafetyAlert>
          <SafetyAlert level="warning" title="Exact boundaries stop safely">
            Equality at serum osmolality 275 or 295, urine osmolality 100, or urine sodium 40 is
            held for clinical review because the supplied thresholds use only below and above.
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
