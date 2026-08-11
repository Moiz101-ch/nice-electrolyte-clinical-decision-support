"use client";

import { ArrowRight, Gauge } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import {
  NumericClinicalInput,
  ResultSection,
  ReviewStatusBadge,
  SafetyAlert,
} from "@/components/clinical";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  HYPONATRAEMIA_SEVERITY_BANDS,
  SODIUM_UNIT,
  evaluateHyponatraemiaSeverity,
  type HyponatraemiaSeverity,
} from "@/src/clinical/pathways/hyponatraemia";

const severityTone = {
  mild: "info",
  moderate: "warning",
  severe: "danger",
} as const satisfies Record<HyponatraemiaSeverity, "danger" | "info" | "warning">;

export function HyponatraemiaSeverityReview() {
  const [sodiumInput, setSodiumInput] = useState("129");
  const numericValue = sodiumInput.trim() === "" ? null : Number(sodiumInput);
  const evaluation = numericValue === null ? null : evaluateHyponatraemiaSeverity(numericValue);
  const error = evaluation?.kind === "invalid" ? evaluation.message : undefined;

  return (
    <article className="border-border bg-surface rounded-lg border shadow-xs">
      <header className="border-border border-b p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-primary text-xs font-bold uppercase">Confirmed laboratory result</p>
            <h2 className="text-foreground mt-1 text-lg font-bold">Enter sodium</h2>
          </div>
          <ReviewStatusBadge status="awaiting-clinical-review" />
        </div>
        <p className="text-muted mt-2 text-sm leading-6">
          Enter the latest confirmed result once. Severity is calculated automatically from the
          supplied source bands.
        </p>
      </header>

      <div className="p-5 sm:p-6">
        <NumericClinicalInput
          description="Use the reported serum sodium value. Up to 1 decimal place is accepted."
          id="sodium-result"
          label="Latest sodium result"
          min="0.1"
          onChange={(event) => setSodiumInput(event.target.value)}
          required
          step="0.1"
          unit={SODIUM_UNIT}
          value={sodiumInput}
          {...(error ? { error } : {})}
        />

        <dl className="border-border mt-6 grid grid-cols-3 divide-x border-y py-4 text-center">
          {HYPONATRAEMIA_SEVERITY_BANDS.map((band) => (
            <div className="min-w-0 px-2" key={band.severity}>
              <dt className="text-muted text-xs capitalize">{band.severity}</dt>
              <dd className="text-foreground mt-1 text-xs font-bold sm:text-sm">
                {band.sourceRangeLabel}
              </dd>
            </div>
          ))}
        </dl>

        <div aria-live="polite" className="mt-6">
          {evaluation === null ? (
            <div className="border-border bg-surface-subtle rounded-md border p-4" role="status">
              <p className="text-foreground text-sm font-semibold">Awaiting sodium result</p>
              <p className="text-muted mt-1 text-xs leading-5">
                No severity classification has been generated.
              </p>
            </div>
          ) : null}

          {evaluation?.kind === "classified" ? (
            <ResultSection
              headingAs="h3"
              icon={Gauge}
              status="Classification only"
              title={evaluation.band.label}
              tone={severityTone[evaluation.band.severity]}
            >
              <p>
                Sodium <strong>{evaluation.value} mmol/L</strong> matches the source band{" "}
                <strong>{evaluation.band.sourceRangeLabel}</strong>.
              </p>
              <div className="mt-3">
                <ReviewStatusBadge status={evaluation.snapshot.clinicalReviewStatus} />
              </div>
              <p className="mt-3 text-xs">
                No management, monitoring or escalation instruction is generated at this stage.
              </p>
            </ResultSection>
          ) : null}

          {evaluation?.kind === "unsupported" ? (
            <SafetyAlert level="information" title="No exact source severity band matched">
              {evaluation.message}
            </SafetyAlert>
          ) : null}
        </div>

        <div className="border-border mt-6 flex flex-wrap items-center justify-between gap-4 border-t pt-5">
          <div>
            <Badge variant="review">Next review step available</Badge>
            <p className="text-muted mt-2 text-xs leading-5">
              Continue to the source-derived fluid-status branch preview. Management remains
              unavailable.
            </p>
          </div>
          <Button asChild size="sm" variant="secondary">
            <Link href={{ pathname: "/review/hyponatraemia/fluid-status" }}>
              Review fluid status
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </div>
    </article>
  );
}
