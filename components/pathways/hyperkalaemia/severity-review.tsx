"use client";

import { Activity, CircleCheck, Gauge, ShieldCheck } from "lucide-react";
import { useState } from "react";

import {
  NumericClinicalInput,
  ResultSection,
  ReviewStatusBadge,
  SafetyAlert,
} from "@/components/clinical";
import { Badge } from "@/components/ui/badge";
import {
  HYPERKALAEMIA_SEVERITY_BANDS,
  POTASSIUM_UNIT,
  evaluateHyperkalaemiaSeverity,
  type HyperkalaemiaSeverity,
} from "@/src/clinical/pathways/hyperkalaemia";

const severityTone = {
  mild: "info",
  moderate: "warning",
  severe: "danger",
} as const satisfies Record<HyperkalaemiaSeverity, "danger" | "info" | "warning">;

export function HyperkalaemiaSeverityReview() {
  const [potassiumInput, setPotassiumInput] = useState("6.0");
  const numericValue = potassiumInput.trim() === "" ? null : Number(potassiumInput);
  const evaluation = numericValue === null ? null : evaluateHyperkalaemiaSeverity(numericValue);
  const error = evaluation?.kind === "invalid" ? evaluation.message : undefined;

  return (
    <article className="border-border bg-surface rounded-lg border shadow-xs">
      <header className="border-border border-b p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-success-strong text-xs font-bold uppercase">
              Confirmed laboratory result
            </p>
            <h2 className="text-foreground mt-1 text-lg font-bold">Enter potassium</h2>
          </div>
          <ReviewStatusBadge status="awaiting-clinical-review" />
        </div>
        <p className="text-muted mt-2 text-sm leading-6">
          Enter the latest confirmed result once. Severity and applicable initial checks update
          automatically.
        </p>
      </header>

      <div className="p-5 sm:p-6">
        <NumericClinicalInput
          description="Use the reported serum potassium value. Up to 2 decimal places is accepted; values are not rounded into a severity band."
          id="potassium-result"
          label="Latest potassium result"
          min="0.01"
          onChange={(event) => setPotassiumInput(event.target.value)}
          required
          step="0.01"
          unit={POTASSIUM_UNIT}
          value={potassiumInput}
          {...(error ? { error } : {})}
        />

        <dl className="border-border mt-6 grid border-y sm:grid-cols-3 sm:divide-x">
          {HYPERKALAEMIA_SEVERITY_BANDS.map((band) => (
            <div
              className="border-border min-h-20 px-4 py-3 first:border-0 max-sm:border-t sm:text-center"
              key={band.severity}
            >
              <dt className="text-muted text-xs capitalize">{band.severity}</dt>
              <dd className="text-foreground mt-1 text-sm font-bold">{band.sourceRangeLabel}</dd>
            </div>
          ))}
        </dl>

        <div aria-live="polite" className="mt-6">
          {evaluation === null ? (
            <div className="border-border bg-surface-subtle rounded-md border p-4" role="status">
              <p className="text-foreground text-sm font-semibold">Awaiting potassium result</p>
              <p className="text-muted mt-1 text-xs leading-5">
                No severity classification or initial checks have been generated.
              </p>
            </div>
          ) : null}

          {evaluation?.kind === "classified" ? (
            <>
              <ResultSection
                dividers={false}
                headingAs="h3"
                icon={Gauge}
                status="Classification and checks only"
                title={evaluation.band.label}
                tone={severityTone[evaluation.band.severity]}
              >
                <p>
                  Potassium <strong>{evaluation.value} mmol/L</strong> matches the source band{" "}
                  <strong>{evaluation.band.sourceRangeLabel}</strong>.
                </p>
                <p className="mt-2">{evaluation.band.sourceSummary}</p>
                <div className="mt-3">
                  <ReviewStatusBadge status={evaluation.snapshot.clinicalReviewStatus} />
                </div>
              </ResultSection>

              {evaluation.snapshot.warnings.map((warning) => (
                <div className="mt-2" key={warning.warningId}>
                  <SafetyAlert level="critical" title="Urgent source safeguard">
                    {warning.message}
                  </SafetyAlert>
                </div>
              ))}

              <section
                aria-labelledby="hyperkalaemia-initial-checks-title"
                className="border-border mt-6 border-t pt-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3
                      className="text-foreground flex items-center gap-2 text-base font-semibold"
                      id="hyperkalaemia-initial-checks-title"
                    >
                      <ShieldCheck aria-hidden="true" className="text-primary size-5" />
                      Initial source-supported checks
                    </h3>
                    <p className="text-muted mt-1 text-xs leading-5">
                      These checks apply to the entered result. Treatment doses are not included.
                    </p>
                  </div>
                  <Badge variant="review">Technical preview</Badge>
                </div>

                <ul className="border-border mt-4 divide-y border-y">
                  {evaluation.snapshot.immediateActions.map((action) => (
                    <li
                      className="grid min-h-14 grid-cols-[1.75rem_minmax(0,1fr)] items-start gap-3 py-3"
                      key={action.actionId}
                    >
                      <span
                        aria-hidden="true"
                        className="bg-success-subtle text-success-strong flex size-7 items-center justify-center rounded-md"
                      >
                        {action.actionId === "perform-ecg-monitor-rhythm" ? (
                          <Activity className="size-4" />
                        ) : (
                          <CircleCheck className="size-4" />
                        )}
                      </span>
                      <span className="text-foreground text-sm leading-6">
                        {action.instruction}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            </>
          ) : null}

          {evaluation?.kind === "unsupported" ? (
            <SafetyAlert level="information" title="No exact source severity band matched">
              {evaluation.message}
            </SafetyAlert>
          ) : null}
        </div>
      </div>
    </article>
  );
}
