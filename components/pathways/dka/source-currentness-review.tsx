import {
  Calculator,
  CalendarClock,
  ChartNoAxesCombined,
  CircleCheck,
  CircleX,
  ClipboardList,
  ShieldCheck,
  Workflow,
} from "lucide-react";

import { ReviewStatusBadge, SafetyAlert } from "@/components/clinical";
import { Badge } from "@/components/ui/badge";
import type {
  DkaSourceCurrentnessGate,
  DkaSourceRule,
  DkaSourceStep,
  DkaSupplementarySection,
} from "@/src/clinical/pathways/dka";
import type { ClinicalSource, SourceDate } from "@/src/clinical/sources/schema";

interface DkaSourceCurrentnessReviewProps {
  gate: DkaSourceCurrentnessGate;
  rules: readonly DkaSourceRule[];
  source: Readonly<ClinicalSource>;
  steps: readonly DkaSourceStep[];
  supplementarySections: readonly DkaSupplementarySection[];
}

const ruleKindLabels: Record<DkaSourceRule["kind"], string> = {
  calculation: "Calculation",
  "logical-rule": "Logical rule",
  "threshold-set": "Threshold set",
  "timed-protocol": "Timed protocol",
  trend: "Trend calculation",
};

export function DkaSourceCurrentnessReview({
  gate,
  rules,
  source,
  steps,
  supplementarySections,
}: DkaSourceCurrentnessReviewProps) {
  return (
    <div className="space-y-9">
      <SafetyAlert level="critical" title="DKA calculator activation blocked">
        The registered source passed its stated review date in April 2021. It remains available for
        internal transcription review only and must not be used as an active calculator or clinical
        pathway.
      </SafetyAlert>

      <section aria-labelledby="dka-source-record" className="border-border border-y py-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <CalendarClock aria-hidden="true" className="text-danger size-5" />
              <h2 className="text-foreground text-lg font-bold" id="dka-source-record">
                Registered source and currentness
              </h2>
            </div>
            <p className="text-muted mt-2 max-w-3xl text-sm leading-6">
              Dates and ownership are transcribed from the supplied Trust pathway. No claim of
              current clinical validity is made.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="danger">Review overdue</Badge>
            <ReviewStatusBadge status={source.clinicalReviewStatus} />
          </div>
        </div>

        <dl className="mt-6 grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
          <SourceField label="Document title" value={source.title} />
          <SourceField label="Organisation" value={source.organisation ?? "Not stated"} />
          <SourceField label="Document version" value={source.documentVersion ?? "Not stated"} />
          <SourceField label="Issue date" value={formatSourceDate(source.issueDate)} />
          <SourceField label="Review date" value={formatSourceDate(source.reviewDate)} />
          <SourceField label="Owner" value={source.owner ?? "Not stated"} />
          <SourceField
            label="Authors"
            value={source.authors.length > 0 ? source.authors.join(", ") : "Not stated"}
          />
          <SourceField label="Current use" value="Internal verification only" />
          <SourceField label="Calculator status" value="Not activated" />
        </dl>
      </section>

      <section aria-labelledby="dka-release-gate">
        <div className="flex items-center gap-2">
          <ShieldCheck aria-hidden="true" className="text-primary size-5" />
          <h2 className="text-foreground text-lg font-bold" id="dka-release-gate">
            Clinical-review gate
          </h2>
        </div>
        <p className="text-muted mt-2 max-w-3xl text-sm leading-6">
          Every requirement must be independently satisfied before calculator foundation work can be
          considered for clinical activation.
        </p>

        <ul className="mt-5 grid auto-rows-fr gap-3 lg:grid-cols-2">
          {gate.requirements.map((requirement) => {
            const passed = requirement.status === "met";
            const StatusIcon = passed ? CircleCheck : CircleX;

            return (
              <li
                className="border-border bg-surface flex h-full items-start gap-3 rounded-lg border p-4 shadow-xs"
                key={requirement.requirementId}
              >
                <span
                  className={`flex size-9 shrink-0 items-center justify-center rounded-md ${
                    passed ? "bg-success-subtle text-success" : "bg-danger-subtle text-danger"
                  }`}
                >
                  <StatusIcon aria-hidden="true" className="size-4" />
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-foreground text-sm font-semibold">{requirement.label}</h3>
                    <Badge variant={passed ? "success" : "danger"}>
                      {passed ? "Met" : "Blocked"}
                    </Badge>
                  </div>
                  <p className="text-muted mt-1 text-xs leading-5">{requirement.detail}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="dka-workflow-map" className="border-border border-y py-7">
        <div className="flex items-center gap-2">
          <Workflow aria-hidden="true" className="text-primary size-5" />
          <h2 className="text-foreground text-lg font-bold" id="dka-workflow-map">
            Mapped source workflow
          </h2>
        </div>
        <p className="text-muted mt-2 max-w-3xl text-sm leading-6">
          All ten numbered stages are catalogued for clinical and technical review. This map does
          not provide navigation through treatment.
        </p>

        <ol className="mt-5 grid auto-rows-fr gap-3 md:grid-cols-2 xl:grid-cols-3">
          {steps.map((step) => (
            <li
              className="border-border bg-surface flex h-full min-h-44 flex-col rounded-lg border p-4 shadow-xs"
              key={step.stepNumber}
            >
              <div className="flex items-start justify-between gap-3">
                <Badge variant="info">Step {step.stepNumber}</Badge>
                <Badge variant="neutral">Mapped</Badge>
              </div>
              <h3 className="text-foreground mt-3 text-sm font-bold">{step.title}</h3>
              <ul className="text-muted mt-2 space-y-1 text-xs leading-5">
                {step.mappedElements.map((element) => (
                  <li key={element}>{element}</li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="dka-rule-inventory">
        <div className="flex items-center gap-2">
          <Calculator aria-hidden="true" className="text-primary size-5" />
          <h2 className="text-foreground text-lg font-bold" id="dka-rule-inventory">
            Identified calculations and deterministic rules
          </h2>
        </div>
        <p className="text-muted mt-2 max-w-3xl text-sm leading-6">
          These expressions are source-transcription targets for later implementation. They are not
          executable here and have not been clinically approved.
        </p>

        <ul className="mt-5 space-y-3">
          {rules.map((rule) => (
            <li
              className="border-border bg-surface rounded-lg border p-4 shadow-xs"
              key={rule.ruleId}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-foreground text-sm font-bold">{rule.title}</h3>
                    <Badge variant="neutral">{ruleKindLabels[rule.kind]}</Badge>
                  </div>
                  <p className="text-muted mt-2 text-xs leading-5">{rule.description}</p>
                </div>
                <Badge
                  variant={rule.reviewStatus === "blocked-by-source-conflict" ? "danger" : "review"}
                >
                  {rule.reviewStatus === "blocked-by-source-conflict"
                    ? "Conflict blocks rule"
                    : "Review only"}
                </Badge>
              </div>
              <div className="bg-surface-subtle text-muted-strong mt-3 rounded-md px-3 py-2 text-xs leading-5 [overflow-wrap:anywhere]">
                {rule.expression}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="dka-supplementary-map" className="border-border border-y py-6">
        <div className="flex items-center gap-2">
          <ChartNoAxesCombined aria-hidden="true" className="text-primary size-5" />
          <h2 className="text-foreground text-base font-bold" id="dka-supplementary-map">
            Supplementary source section
          </h2>
        </div>
        {supplementarySections.map((section) => (
          <div className="mt-4" key={section.title}>
            <h3 className="text-foreground text-sm font-semibold">{section.title}</h3>
            <ul className="text-muted mt-2 grid gap-1 text-xs leading-5 sm:grid-cols-2">
              {section.mappedElements.map((element) => (
                <li key={element}>{element}</li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <SafetyAlert level="warning" title="Resolution criteria require clinical decision">
        The numbered resolution step and the hourly monitoring chart use different logical wording,
        including different AND/OR relationships and bicarbonate boundary handling. No resolution
        algorithm will be implemented until clinicians record the intended rule.
      </SafetyAlert>

      <section aria-labelledby="dka-implementation-boundary">
        <div className="flex items-start gap-3">
          <span className="bg-info-subtle text-primary flex size-10 shrink-0 items-center justify-center rounded-md">
            <ClipboardList aria-hidden="true" className="size-5" />
          </span>
          <div>
            <h2 className="text-foreground text-base font-bold" id="dka-implementation-boundary">
              Current implementation boundary
            </h2>
            <p className="text-muted-strong mt-2 max-w-4xl text-sm leading-6">
              This module records source metadata, review blockers, workflow coverage and future
              calculation targets. It does not diagnose DKA, accept patient measurements, calculate
              insulin or fluid rates, recommend treatment, or store an approval decision.
            </p>
          </div>
        </div>
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

function formatSourceDate(sourceDate: SourceDate | null): string {
  if (!sourceDate) {
    return "Not stated";
  }

  const [year, month = "01", day = "01"] = sourceDate.value.split("-");
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));

  return new Intl.DateTimeFormat("en-GB", {
    day: sourceDate.precision === "day" ? "numeric" : undefined,
    month: sourceDate.precision === "year" ? undefined : "long",
    timeZone: "UTC",
    year: "numeric",
  }).format(date);
}
