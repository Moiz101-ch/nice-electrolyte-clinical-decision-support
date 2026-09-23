import { BookOpenCheck, CircleAlert, Link2, ShieldCheck } from "lucide-react";

import { SafetyAlert } from "@/components/clinical";
import { Badge } from "@/components/ui/badge";
import type { ClinicalSource } from "@/src/clinical/sources/schema";

interface HypomagnesaemiaSupportingGuidanceReviewProps {
  linkedHypocalcaemiaSource: Readonly<ClinicalSource>;
  source: Readonly<ClinicalSource>;
}

export function HypomagnesaemiaSupportingGuidanceReview({
  linkedHypocalcaemiaSource,
  source,
}: HypomagnesaemiaSupportingGuidanceReviewProps) {
  return (
    <div className="space-y-8">
      <SafetyAlert level="warning" title="Supporting source only - no treatment pathway">
        This document is available for source review only. It does not activate a standalone
        Hypomagnesaemia assessment, dose recommendation, prescription or management pathway.
      </SafetyAlert>

      <section aria-labelledby="supporting-source-record" className="border-border border-y py-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <BookOpenCheck aria-hidden="true" className="text-primary size-5" />
              <h2 className="text-foreground text-lg font-bold" id="supporting-source-record">
                Registered supporting source
              </h2>
            </div>
            <p className="text-muted mt-2 max-w-3xl text-sm leading-6">
              Recorded metadata is shown exactly at the level available from the supplied document.
            </p>
          </div>
          <Badge variant="warning">Draft source</Badge>
        </div>

        <dl className="mt-6 grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
          <SourceField label="Document title" value={source.title} />
          <SourceField label="Organisation" value={source.organisation ?? "Not stated"} />
          <SourceField
            label="Authors"
            value={source.authors.length > 0 ? source.authors.join(", ") : "Not stated"}
          />
          <SourceField label="Document version" value={source.documentVersion ?? "Not stated"} />
          <SourceField label="Issue date" value={source.issueDate?.value ?? "Not stated"} />
          <SourceField label="Review date" value={source.reviewDate?.value ?? "Not stated"} />
        </dl>
      </section>

      <section className="grid gap-8 lg:grid-cols-2" aria-label="Supporting-source relationship">
        <div>
          <div className="flex items-center gap-2">
            <Link2 aria-hidden="true" className="text-primary size-5" />
            <h2 className="text-foreground text-base font-bold">Why it is linked</h2>
          </div>
          <p className="text-muted-strong mt-3 text-sm leading-6">
            The Hypocalcaemia workflow can record Hypomagnesaemia as an explicitly confirmed cause.
            This supporting document is therefore linked to {linkedHypocalcaemiaSource.title} for
            evidence review, without becoming one of that pathway&apos;s treatment sources.
          </p>
        </div>

        <div>
          <div className="flex items-center gap-2">
            <CircleAlert aria-hidden="true" className="text-warning size-5" />
            <h2 className="text-foreground text-base font-bold">Why it cannot drive treatment</h2>
          </div>
          <ul className="text-muted-strong mt-3 space-y-2 text-sm leading-6">
            <li>No version, issue date, review date or approval body is visible.</li>
            <li>The narrative and flowchart contain conflicting oral-dose wording.</li>
            <li>
              It is from a different Trust than the magnesium guidance cited by Hypocalcaemia.
            </li>
            <li>Clinical approval and public-display reuse permission remain unresolved.</li>
          </ul>
        </div>
      </section>

      <section aria-labelledby="implementation-boundary" className="border-border border-y py-6">
        <div className="flex items-center gap-2">
          <ShieldCheck aria-hidden="true" className="text-success size-5" />
          <h2 className="text-foreground text-base font-bold" id="implementation-boundary">
            Current implementation boundary
          </h2>
        </div>
        <p className="text-muted-strong mt-3 max-w-4xl text-sm leading-6">
          The application may identify the supporting relationship and return to the connected
          Hypocalcaemia review. It does not interpret magnesium results, choose oral or intravenous
          treatment, calculate a dose, or generate monitoring instructions from this source.
        </p>
      </section>
    </div>
  );
}

function SourceField({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-muted text-xs font-semibold">{label}</dt>
      <dd className="text-foreground mt-1 text-sm leading-6 [overflow-wrap:anywhere]">{value}</dd>
    </div>
  );
}
