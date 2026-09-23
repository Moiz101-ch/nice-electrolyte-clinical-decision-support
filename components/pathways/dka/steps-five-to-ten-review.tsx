"use client";

import { Calculator, CircleCheck, CircleHelp, ShieldAlert } from "lucide-react";
import { useState } from "react";

import { SafetyAlert } from "@/components/clinical";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type {
  DkaLaterStageStatus,
  DkaLaterStepNumber,
  DkaLaterSyntheticCase,
  DkaSourceCurrentnessGate,
  DkaStepsFiveToTenInput,
  DkaStepsFiveToTenResult,
} from "@/src/clinical/pathways/dka";

export interface DkaLaterReviewCase extends DkaLaterSyntheticCase {
  readonly result: DkaStepsFiveToTenResult;
}

interface DkaStepsFiveToTenReviewProps {
  cases: readonly DkaLaterReviewCase[];
  gate: DkaSourceCurrentnessGate;
  initialCaseLabel: string;
  steps: readonly { readonly stepNumber: DkaLaterStepNumber; readonly title: string }[];
}

export function DkaStepsFiveToTenReview({
  cases,
  gate,
  initialCaseLabel,
  steps,
}: DkaStepsFiveToTenReviewProps) {
  const [caseId, setCaseId] = useState(cases[0]!.id);
  const [stepNumber, setStepNumber] = useState<DkaLaterStepNumber>(5);
  const selectedCase = cases.find((item) => item.id === caseId)!;
  const preview = selectedCase.result;
  const selectedStage = preview.stages[stepNumber - 5]!;
  const blockedCount = gate.requirements.filter(({ status }) => status === "blocked").length;

  return (
    <div className="space-y-7">
      <SafetyAlert level="critical" title="Technical preview only - not for patient care">
        The source-currentness gate has {blockedCount} unresolved requirements. Only fixed synthetic
        cases can be selected. No patient values, prescriptions, DKA-resolution result or conversion
        instruction are generated.
      </SafetyAlert>

      <section aria-labelledby="dka-later-case" className="border-border border-y py-6">
        <h2 className="text-foreground text-base font-bold" id="dka-later-case">
          Synthetic continuation
        </h2>
        <p className="text-muted mt-1 text-sm leading-6">Initial context: {initialCaseLabel}</p>

        <label
          className="text-foreground mt-5 block max-w-md text-sm font-semibold"
          htmlFor="dka-later-case-select"
        >
          Test scenario
        </label>
        <select
          className="border-border bg-surface text-foreground focus-visible:ring-primary mt-2 h-11 w-full max-w-md rounded-md border px-3 text-sm focus-visible:ring-2 focus-visible:outline-none"
          id="dka-later-case-select"
          onChange={(event) => {
            setCaseId(event.target.value);
            setStepNumber(5);
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

      <section aria-label="DKA source stages five through ten">
        <div className="grid auto-rows-fr grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {steps.map((step) => {
            const status = preview.stages[step.stepNumber - 5]!.status;
            const selected = stepNumber === step.stepNumber;

            return (
              <button
                aria-current={selected ? "step" : undefined}
                className={cn(
                  "border-border bg-surface hover:border-primary flex min-h-24 min-w-0 flex-col items-start justify-between gap-2 rounded-md border p-3 text-left transition-colors",
                  selected && "border-primary bg-info-subtle",
                )}
                key={step.stepNumber}
                onClick={() => setStepNumber(step.stepNumber)}
                type="button"
              >
                <span className="text-muted text-xs font-semibold">Step {step.stepNumber}</span>
                <span className="text-foreground text-sm font-semibold">{step.title}</span>
                <span className="text-muted text-xs">{statusLabel(status)}</span>
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
          <h2 className="text-foreground mt-3 text-lg font-bold">{steps[stepNumber - 5]!.title}</h2>
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

          {stepNumber === 7 && preview.oliguriaThreshold ? (
            <div className="border-border mt-6 border-t pt-6">
              <div className="flex items-center gap-2">
                <Calculator aria-hidden="true" className="text-primary size-5" />
                <h3 className="text-foreground text-sm font-bold">
                  Urine-output calculation audit
                </h3>
                <Badge variant="danger">Synthetic output</Badge>
              </div>
              <dl className="mt-4 grid gap-x-6 gap-y-4 text-sm sm:grid-cols-3">
                <AuditItem
                  label="Entered weight"
                  value={`${selectedCase.input.initial.weightKg} kg`}
                />
                <AuditItem label="Formula" value={preview.oliguriaThreshold.formula} />
                <AuditItem
                  label="Oliguria threshold"
                  value={`${preview.oliguriaThreshold.output.value} mL/hour`}
                />
              </dl>
            </div>
          ) : null}

          {stepNumber === 8 && preview.responseTrend ? (
            <div className="border-border mt-6 border-t pt-6">
              <h3 className="text-foreground text-sm font-bold">One-hour response comparison</h3>
              <dl className="mt-4 grid gap-x-6 gap-y-4 text-sm sm:grid-cols-4">
                <AuditItem
                  label="Ketone fall"
                  value={`${preview.responseTrend.ketoneFallMmolLPerHour} mmol/L/hour`}
                />
                <AuditItem
                  label="Bicarbonate rise"
                  value={`${preview.responseTrend.bicarbonateRiseMmolLPerHour} mmol/L/hour`}
                />
                <AuditItem
                  label="Glucose fall"
                  value={`${preview.responseTrend.glucoseFallMmolLPerHour} mmol/L/hour`}
                />
                <AuditItem
                  label="Source targets"
                  value={
                    preview.responseTrend.sourceTargetsMet ? "Met in synthetic case" : "Not met"
                  }
                />
              </dl>
            </div>
          ) : null}

          {stepNumber === 9 ? (
            <SafetyAlert level="critical" title="Resolution rule is not executable">
              The numbered pathway and hourly chart conflict. No DKA-resolution or transition result
              is inferred from these measurements.
            </SafetyAlert>
          ) : null}

          {stepNumber === 10 ? (
            <div className="border-border mt-6 border-t pt-6">
              <div className="flex items-center gap-2">
                <ShieldAlert aria-hidden="true" className="text-danger size-5" />
                <h3 className="text-foreground text-sm font-bold">Isolated conversion mapping</h3>
                <Badge variant="danger">Not executable</Badge>
              </div>
              <p className="text-muted-strong mt-3 text-sm font-medium">
                {preview.transitionReview.summary}
              </p>
              <ul className="text-muted-strong mt-3 space-y-2 text-sm leading-6">
                {preview.transitionReview.findings.map((finding) => (
                  <li className="flex items-start gap-2" key={finding}>
                    <CircleCheck aria-hidden="true" className="text-primary mt-1 size-4 shrink-0" />
                    {finding}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </section>

      <SafetyAlert level="information" title="Clinical review remains required">
        Source currentness, internal rule conflicts, project approval and public-display reuse must
        be resolved before this pathway can be activated.
      </SafetyAlert>
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

function statusLabel(status: DkaLaterStageStatus): string {
  return {
    complete: "Source branch resolved",
    "not-reached": "Not reached",
    "requires-review": "Review required",
    stopped: "Path stopped",
  }[status];
}

function statusVariant(status: DkaLaterStageStatus): "danger" | "info" | "neutral" | "success" {
  return {
    complete: "success" as const,
    "not-reached": "neutral" as const,
    "requires-review": "danger" as const,
    stopped: "info" as const,
  }[status];
}

function getStageInputs(
  stepNumber: DkaLaterStepNumber,
  input: DkaStepsFiveToTenInput,
): readonly (readonly [string, string])[] {
  switch (stepNumber) {
    case 5:
      return [
        ["Blood ketones", measurement(input.further.bloodKetonesMmolL, "mmol/L")],
        ["Bicarbonate", measurement(input.further.bicarbonateMmolL, "mmol/L")],
        ["pH", measurement(input.further.ph, "")],
        ["Admission potassium", measurement(input.further.admissionPotassiumMmolL, "mmol/L")],
        ["GCS", measurement(input.further.gcs, "")],
        ["Oxygen saturation", measurement(input.further.oxygenSaturationPercent, "%")],
        ["Systolic pressure", measurement(input.further.systolicBpMmhg, "mmHg")],
        ["Pulse", measurement(input.further.pulseBpm, "bpm")],
      ];
    case 6:
      return [
        ["Age", `${input.initial.ageYears} years`],
        ["Older-age caution", yesNo(input.fluid.elderlyClinicallyConfirmed)],
        ["Pregnancy", yesNo(input.fluid.pregnant)],
        ["Heart failure", yesNo(input.fluid.heartFailure)],
        ["Renal failure", yesNo(input.fluid.renalFailure)],
        ["First bag started", yesNo(input.fluid.firstReplacementBagStarted)],
        ["Fluid chart complete", yesNo(input.fluid.fluidChartCompleted)],
      ];
    case 7:
      return [
        ["Weight", measurement(input.initial.weightKg, "kg")],
        ["Blood glucose", measurement(input.monitoring.bloodGlucoseMmolL, "mmol/L")],
        ["Potassium", measurement(input.monitoring.potassiumMmolL, "mmol/L")],
        [
          "Initial insulin rate",
          measurement(input.monitoring.insulinRateUnitsPerHour, "units/hour"),
        ],
        ["Urine output", measurement(input.monitoring.urineOutputMlPerHour, "mL/hour")],
        ["Oxygen saturation", measurement(input.monitoring.oxygenSaturationPercent, "%")],
        ["Persistent vomiting", yesNo(input.monitoring.persistentVomiting)],
        ["Reduced consciousness", yesNo(input.monitoring.reducedConsciousness)],
      ];
    case 8:
      return [
        ["Observation interval", `${input.response.intervalMinutes} minutes`],
        [
          "Ketones, previous to current",
          pair(
            input.response.previousBloodKetonesMmolL,
            input.response.currentBloodKetonesMmolL,
            "mmol/L",
          ),
        ],
        [
          "Bicarbonate, previous to current",
          pair(
            input.response.previousBicarbonateMmolL,
            input.response.currentBicarbonateMmolL,
            "mmol/L",
          ),
        ],
        [
          "Glucose, previous to current",
          pair(
            input.response.previousBloodGlucoseMmolL,
            input.response.currentBloodGlucoseMmolL,
            "mmol/L",
          ),
        ],
        [
          "Delivery checks",
          input.response.deliveryChecksConfirmed === null
            ? "Not assessed"
            : yesNo(input.response.deliveryChecksConfirmed),
        ],
      ];
    case 9:
      return [
        ["Blood ketones", measurement(input.resolution.bloodKetonesMmolL, "mmol/L")],
        ["Venous pH", measurement(input.resolution.venousPh, "")],
        ["Bicarbonate", measurement(input.resolution.bicarbonateMmolL, "mmol/L")],
      ];
    case 10:
      return [
        ["Eating", yesNo(input.conversion.eating)],
        ["Drinking", yesNo(input.conversion.drinking)],
        ["Metabolically stable", yesNo(input.conversion.metabolicallyStable)],
        [
          "Usual insulin regimen",
          input.conversion.regimen?.replaceAll("-", " ") ?? "Not established",
        ],
      ];
  }
}

function pair(previous: number | null, current: number | null, unit: string): string {
  return `${measurement(previous, unit)} to ${measurement(current, unit)}`;
}

function measurement(value: number | null, unit: string): string {
  return value === null ? "Not recorded" : `${value}${unit ? ` ${unit}` : ""}`;
}

function yesNo(value: boolean): string {
  return value ? "Yes" : "No";
}
