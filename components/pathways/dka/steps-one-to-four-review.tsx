"use client";

import { ArrowRight, Calculator, CircleCheck, CircleHelp } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useState } from "react";

import { SafetyAlert } from "@/components/clinical";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type {
  DkaPreviewStageStatus,
  DkaPreviewStepNumber,
  DkaSourceCurrentnessGate,
  DkaStepsOneToFourInput,
  DkaStepsOneToFourResult,
  DkaSyntheticCase,
} from "@/src/clinical/pathways/dka";

export interface DkaSyntheticReviewCase extends DkaSyntheticCase {
  readonly result: DkaStepsOneToFourResult;
}

interface DkaStepsOneToFourReviewProps {
  cases: readonly DkaSyntheticReviewCase[];
  gate: DkaSourceCurrentnessGate;
  initialCaseId: string;
  steps: readonly { readonly stepNumber: DkaPreviewStepNumber; readonly title: string }[];
}

export function DkaStepsOneToFourReview({
  cases,
  gate,
  initialCaseId,
  steps,
}: DkaStepsOneToFourReviewProps) {
  const [caseId, setCaseId] = useState(initialCaseId);
  const [stepNumber, setStepNumber] = useState<DkaPreviewStepNumber>(1);
  const selectedCase = cases.find((candidate) => candidate.id === caseId)!;
  const preview = selectedCase.result;
  const selectedStage = preview.stages[stepNumber - 1]!;
  const blockedCount = gate.requirements.filter(({ status }) => status === "blocked").length;

  return (
    <div className="space-y-7">
      <SafetyAlert level="critical" title="Technical preview only — not for patient care">
        The source-currentness gate has {blockedCount} unresolved requirements. These are fixed
        synthetic cases, not patient assessments. No patient values can be entered, no prescription
        is generated, and the results must not be used clinically.
      </SafetyAlert>

      <section aria-labelledby="dka-preview-case" className="border-border border-y py-6">
        <h2 className="text-foreground text-base font-bold" id="dka-preview-case">
          Synthetic case
        </h2>
        <p className="text-muted mt-1 text-sm leading-6">
          Choose a test case to inspect source-derived branching through the first four stages.
        </p>

        <label
          className="text-foreground mt-5 block max-w-md text-sm font-semibold"
          htmlFor="dka-case"
        >
          Test scenario
        </label>
        <select
          className="border-border bg-surface text-foreground focus-visible:ring-primary mt-2 h-11 w-full max-w-md rounded-md border px-3 text-sm focus-visible:ring-2 focus-visible:outline-none"
          id="dka-case"
          onChange={(event) => {
            setCaseId(event.target.value);
            setStepNumber(1);
          }}
          value={caseId}
        >
          {cases.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
        <p className="text-muted mt-2 text-sm">{selectedCase.summary}</p>
      </section>

      <section aria-label="DKA first four source stages">
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          {steps.map((step) => {
            const number = step.stepNumber as DkaPreviewStepNumber;
            const stage = preview.stages[number - 1]!;
            const selected = stepNumber === number;

            return (
              <button
                aria-current={selected ? "step" : undefined}
                className={cn(
                  "border-border bg-surface hover:border-primary flex min-h-20 min-w-0 flex-col items-start justify-between gap-2 rounded-md border p-3 text-left transition-colors",
                  selected && "border-primary bg-info-subtle",
                )}
                key={number}
                onClick={() => setStepNumber(number)}
                type="button"
              >
                <span className="text-muted text-xs font-semibold">Step {number}</span>
                <span className="text-foreground text-sm font-semibold">{step.title}</span>
                <span className="text-muted text-xs">{statusLabel(stage.status)}</span>
              </button>
            );
          })}
        </div>

        <div className="border-border mt-6 border-y py-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="info">Step {stepNumber}</Badge>
            <Badge variant={statusVariant(selectedStage.status)}>
              {statusLabel(selectedStage.status)}
            </Badge>
          </div>
          <h2 className="text-foreground mt-3 text-lg font-bold">{steps[stepNumber - 1]!.title}</h2>
          <p className="text-muted-strong mt-2 text-sm font-medium">{selectedStage.summary}</p>

          <div className="mt-6 grid gap-7 lg:grid-cols-2">
            <div>
              <h3 className="text-foreground text-sm font-bold">Synthetic inputs</h3>
              <dl className="border-border mt-3 divide-y border-y text-sm">
                {getStageInputs(stepNumber, selectedCase.input).map(([label, value]) => (
                  <div className="flex items-start justify-between gap-3 py-2.5" key={label}>
                    <dt className="text-muted">{label}</dt>
                    <dd className="text-foreground text-right font-medium">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div>
              <h3 className="text-foreground text-sm font-bold">Source branch preview</h3>
              {selectedStage.findings.length > 0 ? (
                <ul className="border-border mt-3 divide-y border-y text-sm leading-6">
                  {selectedStage.findings.map((finding) => (
                    <li className="flex items-start gap-2 py-2.5" key={finding}>
                      <CircleCheck
                        aria-hidden="true"
                        className="text-primary mt-1 size-4 shrink-0"
                      />
                      <span className="text-muted-strong">{finding}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted mt-3 flex items-center gap-2 text-sm">
                  <CircleHelp aria-hidden="true" className="size-4" />
                  This stage was not reached in the selected case.
                </p>
              )}
            </div>
          </div>

          {stepNumber === 4 && preview.calculation ? (
            <div className="border-border mt-6 border-t pt-6">
              <div className="flex items-center gap-2">
                <Calculator aria-hidden="true" className="text-primary size-5" />
                <h3 className="text-foreground text-sm font-bold">Calculation audit</h3>
                <Badge variant="danger">Synthetic output</Badge>
              </div>
              <dl className="mt-4 grid gap-x-6 gap-y-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
                <AuditItem label="Entered weight" value={`${selectedCase.input.weightKg} kg`} />
                <AuditItem label="Formula" value={preview.calculation.formula} />
                <AuditItem
                  label="Before source maximum"
                  value={`${preview.calculation.output.unlimitedValue} units/hour`}
                />
                <AuditItem
                  label="Final technical value"
                  value={`${preview.calculation.output.value} units/hour`}
                />
              </dl>
              <p className="text-muted mt-4 text-xs leading-5">
                Maximum {preview.calculation.sourceDefinedLimit?.value}{" "}
                {preview.calculation.sourceDefinedLimit?.unit}. Limit{" "}
                {preview.calculation.sourceDefinedLimit?.applied ? "applied" : "not reached"}.
                Display precision is a software representation, not an approved prescribing
                increment.
              </p>
            </div>
          ) : null}
        </div>
      </section>

      {preview.stages[3].status === "complete" ? (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-muted max-w-2xl text-sm leading-6">
            Continue this fixed case to inspect later source branches. Clinical execution remains
            blocked.
          </p>
          <Button asChild>
            <Link href={`/review/dka/steps-five-to-ten?initial=${selectedCase.id}` as Route}>
              Review Steps 5-10
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </div>
      ) : (
        <SafetyAlert level="information" title="Continuation unavailable">
          This case cannot proceed to later stages until the initial source branch is resolved.
        </SafetyAlert>
      )}
      {preview.inputIssues.length > 0 ? (
        <SafetyAlert level="critical" title="Synthetic data validation failed">
          {preview.inputIssues.join(" ")}
        </SafetyAlert>
      ) : null}
    </div>
  );
}

function AuditItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted text-xs font-semibold uppercase">{label}</dt>
      <dd className="text-foreground mt-1 font-medium break-words">{value}</dd>
    </div>
  );
}

function statusLabel(status: DkaPreviewStageStatus): string {
  return {
    complete: "Source branch resolved",
    "not-reached": "Not reached",
    "requires-review": "Review required",
    stopped: "Path stopped",
  }[status];
}

function statusVariant(status: DkaPreviewStageStatus): "danger" | "info" | "neutral" | "success" {
  return {
    complete: "success" as const,
    "not-reached": "neutral" as const,
    "requires-review": "danger" as const,
    stopped: "info" as const,
  }[status];
}

function getStageInputs(
  stepNumber: DkaPreviewStepNumber,
  input: DkaStepsOneToFourInput,
): readonly (readonly [string, string])[] {
  switch (stepNumber) {
    case 1:
      return [
        ["Age", `${input.ageYears} years`],
        ["Capillary glucose", formatMeasurement(input.bloodGlucoseMmolL, "mmol/L")],
        ["Blood ketones", formatMeasurement(input.bloodKetonesMmolL, "mmol/L")],
        ["Weight", formatMeasurement(input.weightKg, "kg")],
        [
          "ABCDE / GCS / NEWS-MEWS",
          input.assessment.abcdeComplete &&
          input.assessment.gcsComplete &&
          input.assessment.earlyWarningScoreComplete
            ? "Confirmed"
            : "Incomplete",
        ],
        ["IV access", input.assessment.ivAccessObtained ? "Obtained" : "Not obtained"],
        [
          "Initial blood tests",
          input.assessment.fbcObtained &&
          input.assessment.uAndEObtained &&
          input.assessment.laboratoryGlucoseObtained &&
          input.assessment.venousBloodGasObtained
            ? "Confirmed"
            : "Incomplete",
        ],
      ];
    case 2:
      return [
        ["Capillary glucose", formatMeasurement(input.bloodGlucoseMmolL, "mmol/L")],
        ["Blood ketones", formatMeasurement(input.bloodKetonesMmolL, "mmol/L")],
        ["Venous pH", formatMeasurement(input.venousPh, "")],
        ["Bicarbonate", formatMeasurement(input.bicarbonateMmolL, "mmol/L")],
      ];
    case 3:
      return [
        ["Initial systolic pressure", formatMeasurement(input.systolicBpMmhg, "mmHg")],
        ["Repeat systolic pressure", formatMeasurement(input.repeatSystolicBpMmhg, "mmHg")],
      ];
    case 4:
      return [
        ["Weight", formatMeasurement(input.weightKg, "kg")],
        [
          "Normally takes long-acting insulin",
          input.longActingInsulinNormallyTaken === null
            ? "Unknown"
            : input.longActingInsulinNormallyTaken
              ? "Yes"
              : "No",
        ],
      ];
  }
}

function formatMeasurement(value: number | null, unit: string): string {
  return value === null ? "Not recorded" : `${value}${unit ? ` ${unit}` : ""}`;
}
