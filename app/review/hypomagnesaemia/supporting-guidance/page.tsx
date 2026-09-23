import { ArrowLeft, ClipboardCheck } from "lucide-react";
import type { Metadata, Route } from "next";
import Link from "next/link";

import { AppShell } from "@/components/layout/app-shell";
import { HypomagnesaemiaSupportingGuidanceReview } from "@/components/pathways/hypomagnesaemia/supporting-guidance-review";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { loadClinicalSourceRegistry } from "@/src/clinical/sources/registry";

const HYPOMAGNESAEMIA_SOURCE_ID = "TGICFT-HYPOMAGNESAEMIA-UNDATED";

export const metadata: Metadata = {
  title: "Hypomagnesaemia supporting-guidance review",
};

export default function HypomagnesaemiaSupportingGuidancePage() {
  const registry = loadClinicalSourceRegistry();
  const source = registry.getSource(HYPOMAGNESAEMIA_SOURCE_ID);
  const linkedHypocalcaemiaSource = registry
    .getRelatedSources(HYPOMAGNESAEMIA_SOURCE_ID)
    .find(({ clinicalScope }) => clinicalScope === "hypocalcaemia");

  if (!source || !linkedHypocalcaemiaSource) {
    throw new Error("The Hypomagnesaemia supporting-source relationship is not registered.");
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="warning">Hypomagnesaemia</Badge>
              <Badge variant="neutral">Supporting evidence</Badge>
            </div>
            <h1 className="text-foreground mt-4 text-2xl font-bold sm:text-[1.75rem]">
              Hypomagnesaemia supporting guidance
            </h1>
            <p className="text-muted mt-2 max-w-3xl text-sm leading-6">
              Governance review of the supplied supporting document and its limited relationship to
              the connected Hypocalcaemia workflow.
            </p>
          </div>
          <Button asChild variant="secondary">
            <Link href={"/review/hypocalcaemia/assessment" as Route}>
              <ArrowLeft aria-hidden="true" />
              Hypocalcaemia review
            </Link>
          </Button>
        </header>

        <HypomagnesaemiaSupportingGuidanceReview
          linkedHypocalcaemiaSource={linkedHypocalcaemiaSource}
          source={source}
        />

        <footer className="text-muted flex items-start gap-2 text-xs leading-5">
          <ClipboardCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          This page displays source-governance information only and does not collect patient data.
        </footer>
      </div>
    </AppShell>
  );
}
