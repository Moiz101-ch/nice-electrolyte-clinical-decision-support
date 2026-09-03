"use client";

import {
  Activity,
  Beaker,
  CircleCheck,
  CircleHelp,
  CircleX,
  FlaskConical,
  Gauge,
  Minus,
  Stethoscope,
  TrendingDown,
} from "lucide-react";
import { useMemo, useState } from "react";

import {
  GroupedSymptomSelection,
  MajorDecisionCards,
  NumericClinicalInput,
  PathwayProgress,
  ResultSection,
  ReviewStatusBadge,
  SafetyAlert,
  type SymptomSelectionGroup,
} from "@/components/clinical";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import {
  ADJUSTED_CALCIUM_UNIT,
  HYPOCALCAEMIA_SEVERITY_BANDS,
  HYPOCALCAEMIA_SYMPTOMS,
  evaluateHypocalcaemiaAssessment,
  evaluateHypocalcaemiaSeverity,
  type AlbuminAdjustmentStatus,
  type AlkalinePhosphataseStatus,
  type EcgAssessmentStatus,
  type HypocalcaemiaAssessmentInputs,
  type HypocalcaemiaSeverity,
  type MagnesiumStatus,
  type PhosphateStatus,
  type PthStatus,
  type RateOfFallStatus,
  type RenalFunctionStatus,
  type SurgeryStatus,
  type VitaminDStatus,
} from "@/src/clinical/pathways/hypocalcaemia";

import { HypocalcaemiaManagementReview } from "./management-review";

type SymptomValue = NonNullable<HypocalcaemiaAssessmentInputs["symptoms"]>[number];

const symptomDescriptions: Partial<Record<SymptomValue, string>> = {
  "behavioural-psychiatric-change": "Behavioural change, psychosis or depression.",
  "carpopedal-spasm": "Wrist flexion with the fingers drawn together.",
  paraesthesia: "Usually affecting the fingers, toes or area around the mouth.",
};

const symptomGroups: readonly SymptomSelectionGroup[] = [
  {
    id: "neuromuscular",
    label: "Neuromuscular signs and symptoms",
    options: HYPOCALCAEMIA_SYMPTOMS.filter((symptom) => symptom.group === "neuromuscular").map(
      (symptom) => {
        const description = symptomDescriptions[symptom.value];

        return {
          label: symptom.label,
          value: symptom.value,
          ...(description ? { description } : {}),
        };
      },
    ),
  },
  {
    id: "neurological",
    label: "Neurological and behavioural",
    options: HYPOCALCAEMIA_SYMPTOMS.filter((symptom) => symptom.group === "neurological").map(
      (symptom) => {
        const description = symptomDescriptions[symptom.value];

        return {
          label: symptom.label,
          value: symptom.value,
          ...(description ? { description } : {}),
        };
      },
    ),
  },
  {
    id: "other",
    label: "Other source-listed findings",
    options: HYPOCALCAEMIA_SYMPTOMS.filter((symptom) => symptom.group === "other").map(
      (symptom) => ({ label: symptom.label, value: symptom.value }),
    ),
  },
  {
    description: "Use one explicit state when no listed finding can be selected.",
    id: "explicit-state",
    label: "No listed finding or uncertainty",
    options: [
      { label: "None of the listed findings confirmed", value: "none" },
      { label: "Unable to assess safely", value: "unable" },
    ],
  },
];

const severityTone = {
  mild: "info",
  "moderate-severe": "danger",
} as const satisfies Record<HypocalcaemiaSeverity, "danger" | "info">;

const initialInputs: HypocalcaemiaAssessmentInputs = {};

export function HypocalcaemiaAssessmentReview() {
  const [calciumInput, setCalciumInput] = useState("");
  const [inputs, setInputs] = useState<HypocalcaemiaAssessmentInputs>(initialInputs);
  const numericCalcium = calciumInput.trim() === "" ? null : Number(calciumInput);
  const calciumEvaluation =
    numericCalcium === null ? null : evaluateHypocalcaemiaSeverity(numericCalcium);
  const calciumError =
    calciumEvaluation?.kind === "invalid" ? calciumEvaluation.message : undefined;
  const severityEvaluation = inputs.albuminAdjustment === "confirmed" ? calciumEvaluation : null;
  const assessmentSnapshot = useMemo(() => evaluateHypocalcaemiaAssessment(inputs), [inputs]);
  const symptomValues = inputs.symptoms ?? [];
  const symptomsAnswered = symptomValues.length > 0;
  const hasListedSymptoms = symptomValues.some(
    (symptom) => symptom !== "none" && symptom !== "unable",
  );
  const coreInvestigationsComplete = Boolean(
    inputs.ecgAssessment && inputs.magnesium && inputs.renalFunction && inputs.surgery,
  );
  const extendedDiagnosticsRequired =
    inputs.surgery === "no-recent-surgery" || inputs.surgery === "unable";
  const extendedDiagnosticsComplete = Boolean(
    !extendedDiagnosticsRequired ||
    (inputs.phosphate && inputs.alkalinePhosphatase && inputs.pth && inputs.vitaminD),
  );
  const assessmentComplete = coreInvestigationsComplete && extendedDiagnosticsComplete;
  const classificationAvailable = severityEvaluation?.kind === "classified";
  const currentStepId = getCurrentStepId({
    assessmentComplete,
    classificationAvailable,
    ecgAssessment: inputs.ecgAssessment,
    rateOfFall: inputs.rateOfFall,
    symptomsAnswered,
  });
  const progressSteps = [
    { description: "Hypocalcaemia", id: "focus", label: "Assessment focus" },
    { description: "Adjusted result", id: "calcium", label: "Calcium result" },
    { description: "Confirm findings", id: "symptoms", label: "Symptoms and rate" },
    { description: "ECG and laboratory context", id: "investigations", label: "Investigations" },
    { description: "Review recorded assessment", id: "summary", label: "Assessment summary" },
    { description: "Safeguards and treatment", id: "management", label: "Management" },
  ] as const;

  function resetAfterCalcium(nextValue: string) {
    setCalciumInput(nextValue);
    const numericValue = nextValue.trim() === "" ? undefined : Number(nextValue);
    setInputs(Number.isFinite(numericValue) ? { adjustedCalcium: numericValue } : initialInputs);
  }

  function updateAlbuminAdjustment(value: AlbuminAdjustmentStatus) {
    setInputs((current) => ({
      adjustedCalcium: current.adjustedCalcium,
      albuminAdjustment: value,
    }));
  }

  function updateSymptoms(nextValues: readonly string[]) {
    const typedValues = nextValues as readonly SymptomValue[];
    let normalizedValues = typedValues;

    if (typedValues.includes("none") && !symptomValues.includes("none")) {
      normalizedValues = ["none"];
    } else if (typedValues.includes("unable") && !symptomValues.includes("unable")) {
      normalizedValues = ["unable"];
    } else if (typedValues.some((value) => value !== "none" && value !== "unable")) {
      normalizedValues = typedValues.filter((value) => value !== "none" && value !== "unable");
    }

    setInputs((current) => ({
      adjustedCalcium: current.adjustedCalcium,
      albuminAdjustment: current.albuminAdjustment,
      symptoms: normalizedValues,
    }));
  }

  function updateRateOfFall(value: RateOfFallStatus) {
    setInputs((current) => ({
      adjustedCalcium: current.adjustedCalcium,
      albuminAdjustment: current.albuminAdjustment,
      rateOfFall: value,
      symptoms: current.symptoms,
    }));
  }

  function updateEcgAssessment(value: EcgAssessmentStatus) {
    setInputs((current) => ({
      adjustedCalcium: current.adjustedCalcium,
      albuminAdjustment: current.albuminAdjustment,
      ecgAssessment: value,
      rateOfFall: current.rateOfFall,
      symptoms: current.symptoms,
    }));
  }

  return (
    <div className="space-y-6">
      <section aria-labelledby="hypocalcaemia-progress-title">
        <h2 className="sr-only" id="hypocalcaemia-progress-title">
          Hypocalcaemia assessment progress
        </h2>
        <PathwayProgress currentStepId={currentStepId} steps={progressSteps} />
      </section>

      <article className="border-border bg-surface rounded-lg border shadow-xs">
        <header className="border-border border-b p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-success-strong text-xs font-bold uppercase">
                Connected technical assessment
              </p>
              <h2 className="text-foreground mt-1 text-lg font-bold">
                Calcium, symptoms and diagnostic context
              </h2>
            </div>
            <ReviewStatusBadge status="awaiting-clinical-review" />
          </div>
          <p className="text-muted mt-2 max-w-3xl text-sm leading-6">
            Each confirmed answer reveals only the next source-supported stage. A management branch
            appears only after all required assessment inputs are complete.
          </p>
        </header>

        <div className="p-5 sm:p-6">
          <section aria-labelledby="calcium-result-title">
            <div className="flex items-center gap-2">
              <Gauge aria-hidden="true" className="text-primary size-5" />
              <h3 className="text-foreground text-base font-semibold" id="calcium-result-title">
                Confirm adjusted calcium
              </h3>
            </div>
            <p className="text-muted mt-1 text-xs leading-5">
              Use the laboratory-reported adjusted serum calcium. The source severity bands do not
              apply to an ionised-calcium value.
            </p>

            <div className="mt-4 max-w-xl">
              <NumericClinicalInput
                description="Up to 3 decimal places is accepted. The value is never rounded into a source band."
                id="adjusted-calcium-result"
                label="Latest adjusted serum calcium result"
                min="0.001"
                onChange={(event) => resetAfterCalcium(event.target.value)}
                required
                step="0.001"
                unit={ADJUSTED_CALCIUM_UNIT}
                value={calciumInput}
                {...(calciumError ? { error: calciumError } : {})}
              />
            </div>

            {calciumEvaluation && calciumEvaluation.kind !== "invalid" ? (
              <div className="border-border mt-5 border-t pt-5">
                <MajorDecisionCards
                  description="Classification remains locked until this is explicitly confirmed."
                  legend="Has this serum calcium been adjusted for albumin?"
                  name="albumin-adjustment"
                  onValueChange={(value) =>
                    updateAlbuminAdjustment(value as AlbuminAdjustmentStatus)
                  }
                  options={[
                    {
                      description: "The entered result is reported as albumin-adjusted calcium.",
                      icon: CircleCheck,
                      label: "Adjustment confirmed",
                      value: "confirmed",
                    },
                    {
                      description: "The result is total calcium without confirmed adjustment.",
                      icon: CircleX,
                      label: "Not adjusted",
                      value: "not-confirmed",
                    },
                    {
                      description: "Available information cannot confirm adjustment.",
                      icon: CircleHelp,
                      label: "Unable to confirm",
                      value: "unable",
                    },
                  ]}
                  required
                  value={inputs.albuminAdjustment ?? ""}
                />
              </div>
            ) : null}

            <div className="mt-5">
              <SafetyAlert level="information" title="Emergency measurement context">
                The source advises measuring ionised calcium in an emergency. This review records
                adjusted serum calcium for source-band classification and does not convert between
                the two measurements.
              </SafetyAlert>
            </div>
          </section>

          {inputs.albuminAdjustment && inputs.albuminAdjustment !== "confirmed" ? (
            <div className="mt-6" aria-live="polite">
              <SafetyAlert level="warning" title="Adjusted result required">
                {assessmentSnapshot.stopReason}
              </SafetyAlert>
            </div>
          ) : null}

          {inputs.albuminAdjustment === "confirmed" ? (
            <div aria-live="polite" className="mt-6">
              {severityEvaluation?.kind === "classified" ? (
                <ResultSection
                  dividers={false}
                  headingAs="h3"
                  icon={Gauge}
                  status="Source classification"
                  title={severityEvaluation.band.label}
                  tone={severityTone[severityEvaluation.band.severity]}
                >
                  <p>
                    Adjusted calcium <strong>{severityEvaluation.value} mmol/L</strong> matches the
                    printed band <strong>{severityEvaluation.band.sourceRangeLabel}</strong>.
                  </p>
                  <p className="mt-2">
                    Symptoms and the clinically established rate of fall can materially change the
                    urgency; the calcium value is not interpreted alone.
                  </p>
                </ResultSection>
              ) : null}

              {severityEvaluation?.kind === "boundary-gap" ? (
                <SafetyAlert level="warning" title="Unclassified source boundary">
                  {severityEvaluation.message}
                </SafetyAlert>
              ) : null}

              {severityEvaluation?.kind === "not-hypocalcaemia" ? (
                <SafetyAlert level="information" title="Source definition threshold not met">
                  {severityEvaluation.message}
                </SafetyAlert>
              ) : null}
            </div>
          ) : null}

          {classificationAvailable ? (
            <>
              <section
                aria-labelledby="hypocalcaemia-symptoms-title"
                className="border-border mt-6 border-t pt-6"
              >
                <GroupedSymptomSelection
                  description="Select every finding that is clinically confirmed. The workflow will not infer unreported symptoms."
                  groups={symptomGroups}
                  legend="Source-listed symptoms and signs"
                  name="hypocalcaemia-symptoms"
                  onValuesChange={updateSymptoms}
                  values={symptomValues}
                />
                <span className="sr-only" id="hypocalcaemia-symptoms-title">
                  Hypocalcaemia symptom assessment
                </span>
              </section>

              {assessmentSnapshot.warnings.map((warning) => (
                <div className="mt-5" key={warning.warningId}>
                  <SafetyAlert
                    level={warning.severity === "critical" ? "critical" : "warning"}
                    title={
                      warning.severity === "critical"
                        ? "Source-defined medical emergency"
                        : "Symptom assessment uncertain"
                    }
                  >
                    {warning.message}
                  </SafetyAlert>
                </div>
              ))}

              {symptomsAnswered ? (
                <section className="border-border mt-6 border-t pt-6">
                  <MajorDecisionCards
                    description="The source states that symptom onset depends on the rate of fall but does not provide a numeric rate threshold."
                    legend="Is a rapid fall in calcium clinically established?"
                    name="calcium-rate-of-fall"
                    onValueChange={(value) => updateRateOfFall(value as RateOfFallStatus)}
                    options={[
                      {
                        description:
                          "A rapid decline is clinically confirmed from available results.",
                        icon: TrendingDown,
                        label: "Rapid fall confirmed",
                        value: "rapid",
                      },
                      {
                        description: "A rapid decline has been assessed and is not confirmed.",
                        icon: Minus,
                        label: "Not confirmed",
                        value: "not-rapid",
                      },
                      {
                        description: "The rate cannot be established from available results.",
                        icon: CircleHelp,
                        label: "Unable to establish",
                        value: "unable",
                      },
                    ]}
                    required
                    value={inputs.rateOfFall ?? ""}
                  />
                </section>
              ) : null}
            </>
          ) : null}

          {classificationAvailable && inputs.rateOfFall ? (
            <section
              aria-labelledby="hypocalcaemia-ecg-title"
              className="border-border mt-6 border-t pt-6"
            >
              <div className="flex items-start gap-3">
                <span className="bg-info-subtle text-primary flex size-10 shrink-0 items-center justify-center rounded-md">
                  <Activity aria-hidden="true" className="size-5" />
                </span>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3
                      className="text-foreground text-base font-semibold"
                      id="hypocalcaemia-ecg-title"
                    >
                      ECG assessment
                    </h3>
                    <Badge variant="review">Labelled placeholder</Badge>
                  </div>
                  <p className="text-muted mt-1 text-xs leading-5">
                    The supplied pathway includes a hypocalcaemia-versus-normal QT/QTc comparison,
                    but no approved reusable ECG visual is registered. Review the current 12-lead
                    ECG and record the clinician-confirmed state.
                  </p>
                </div>
              </div>

              <div className="mt-5">
                <MajorDecisionCards
                  legend="Are hypocalcaemia ECG changes clinically confirmed?"
                  name="hypocalcaemia-ecg"
                  onValueChange={(value) => updateEcgAssessment(value as EcgAssessmentStatus)}
                  options={[
                    {
                      description:
                        "The current ECG has been reviewed and relevant changes are confirmed.",
                      icon: Activity,
                      label: "Changes confirmed",
                      value: "changes-confirmed",
                    },
                    {
                      description:
                        "The current ECG has been reviewed and changes are not confirmed.",
                      icon: CircleCheck,
                      label: "No changes confirmed",
                      value: "no-changes",
                    },
                    {
                      description:
                        "Available information is insufficient for a safe ECG assessment.",
                      icon: CircleHelp,
                      label: "Unable to assess",
                      value: "unable",
                    },
                  ]}
                  required
                  value={inputs.ecgAssessment ?? ""}
                />
              </div>
            </section>
          ) : null}

          {classificationAvailable && inputs.ecgAssessment ? (
            <section
              aria-labelledby="diagnostic-context-title"
              className="border-border mt-6 border-t pt-6"
            >
              <div className="flex items-start gap-3">
                <span className="bg-info-subtle text-primary flex size-10 shrink-0 items-center justify-center rounded-md">
                  <FlaskConical aria-hidden="true" className="size-5" />
                </span>
                <div>
                  <h3
                    className="text-foreground text-base font-semibold"
                    id="diagnostic-context-title"
                  >
                    Diagnostic context
                  </h3>
                  <p className="text-muted mt-1 text-xs leading-5">
                    Classify results against the local laboratory reference ranges. No numeric
                    thresholds are inferred where the supplied source gives none.
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-5 md:grid-cols-2">
                <SelectField
                  id="magnesium-status"
                  label="Serum magnesium"
                  onValueChange={(value) =>
                    setInputs((current) => ({
                      ...current,
                      magnesium: value as MagnesiumStatus,
                    }))
                  }
                  options={[
                    ["below-range", "Below local laboratory range"],
                    ["not-below-range", "Not below local laboratory range"],
                    ["unavailable", "Result unavailable"],
                  ]}
                  value={inputs.magnesium}
                />
                <SelectField
                  id="renal-function-status"
                  label="Renal function"
                  onValueChange={(value) =>
                    setInputs((current) => ({
                      ...current,
                      renalFunction: value as RenalFunctionStatus,
                    }))
                  }
                  options={[
                    ["renal-failure", "Renal failure present"],
                    ["no-renal-failure", "Renal failure not present"],
                    ["unable", "Unable to establish safely"],
                  ]}
                  value={inputs.renalFunction}
                />
                <SelectField
                  id="surgery-context"
                  label="Recent thyroid/parathyroid surgery"
                  onValueChange={(value) =>
                    setInputs((current) => ({
                      ...current,
                      alkalinePhosphatase: undefined,
                      phosphate: undefined,
                      pth: undefined,
                      surgery: value as SurgeryStatus,
                      vitaminD: undefined,
                    }))
                  }
                  options={[
                    ["recent-surgery", "Recent surgery confirmed"],
                    ["no-recent-surgery", "No recent surgery"],
                    ["unable", "Surgical context unavailable"],
                  ]}
                  value={inputs.surgery}
                />
              </div>

              {extendedDiagnosticsRequired ? (
                <div className="border-border mt-6 border-t pt-6">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h4 className="text-foreground text-sm font-semibold">
                        Additional cause-investigation results
                      </h4>
                      <p className="text-muted mt-1 text-xs leading-5">
                        The source requires these tests to establish cause when recent thyroid or
                        parathyroid surgery is not confirmed.
                      </p>
                    </div>
                    <Badge variant="info">Required for this branch</Badge>
                  </div>
                  <div className="mt-5 grid gap-5 md:grid-cols-2">
                    <SelectField
                      id="phosphate-status"
                      label="Phosphate"
                      onValueChange={(value) =>
                        setInputs((current) => ({
                          ...current,
                          phosphate: value as PhosphateStatus,
                        }))
                      }
                      options={[
                        ["high", "High"],
                        ["low", "Low"],
                        ["within-range", "Within local laboratory range"],
                        ["unavailable", "Result unavailable"],
                      ]}
                      value={inputs.phosphate}
                    />
                    <SelectField
                      id="alkaline-phosphatase-status"
                      label="Alkaline phosphatase"
                      onValueChange={(value) =>
                        setInputs((current) => ({
                          ...current,
                          alkalinePhosphatase: value as AlkalinePhosphataseStatus,
                        }))
                      }
                      options={[
                        ["high", "High"],
                        ["not-high", "Not high"],
                        ["unavailable", "Result unavailable"],
                      ]}
                      value={inputs.alkalinePhosphatase}
                    />
                    <SelectField
                      id="pth-status"
                      label="Parathyroid hormone (PTH)"
                      onValueChange={(value) =>
                        setInputs((current) => ({ ...current, pth: value as PthStatus }))
                      }
                      options={[
                        ["low", "Low"],
                        ["not-low", "Not low"],
                        ["unavailable", "Result unavailable"],
                      ]}
                      value={inputs.pth}
                    />
                    <SelectField
                      id="vitamin-d-status"
                      label="Vitamin D"
                      onValueChange={(value) =>
                        setInputs((current) => ({
                          ...current,
                          vitaminD: value as VitaminDStatus,
                        }))
                      }
                      options={[
                        ["deficient", "Deficiency confirmed"],
                        ["not-deficient", "Deficiency not confirmed"],
                        ["unavailable", "Result unavailable"],
                      ]}
                      value={inputs.vitaminD}
                    />
                  </div>
                </div>
              ) : null}
            </section>
          ) : null}

          {classificationAvailable && assessmentComplete ? (
            <AssessmentSummary
              hasListedSymptoms={hasListedSymptoms}
              inputs={inputs}
              severity={severityEvaluation.band}
              snapshotStatus={assessmentSnapshot.status}
            />
          ) : null}
        </div>
      </article>

      {classificationAvailable && assessmentComplete ? (
        <HypocalcaemiaManagementReview assessmentInputs={inputs} key={JSON.stringify(inputs)} />
      ) : null}
    </div>
  );
}

interface SelectFieldProps {
  id: string;
  label: string;
  onValueChange: (value: string) => void;
  options: readonly (readonly [value: string, label: string])[];
  value?: string | undefined;
}

function SelectField({ id, label, onValueChange, options, value }: SelectFieldProps) {
  return (
    <div>
      <label className="text-foreground text-sm font-semibold" htmlFor={id}>
        {label}
        <span aria-hidden="true" className="text-danger ml-1">
          *
        </span>
        <span className="sr-only"> (required)</span>
      </label>
      <Select
        className="mt-2"
        id={id}
        onChange={(event) => onValueChange(event.target.value)}
        required
        value={value ?? ""}
      >
        <option disabled value="">
          Select recorded status
        </option>
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </Select>
    </div>
  );
}

interface AssessmentSummaryProps {
  hasListedSymptoms: boolean;
  inputs: HypocalcaemiaAssessmentInputs;
  severity: (typeof HYPOCALCAEMIA_SEVERITY_BANDS)[number];
  snapshotStatus: string;
}

function AssessmentSummary({
  hasListedSymptoms,
  inputs,
  severity,
  snapshotStatus,
}: AssessmentSummaryProps) {
  const flags = getDiagnosticReviewFlags(inputs);

  return (
    <section
      aria-labelledby="assessment-summary-title"
      className="border-border mt-6 border-t pt-6"
    >
      <ResultSection
        headingAs="h3"
        icon={Stethoscope}
        status="Clinical review required"
        title="Assessment inputs complete"
        tone="success"
      >
        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryItem label="Calcium classification" value={severity.label} />
          <SummaryItem
            label="Symptoms"
            value={hasListedSymptoms ? "Listed finding confirmed" : labelSymptoms(inputs.symptoms)}
          />
          <SummaryItem label="ECG" value={labelValue(inputs.ecgAssessment)} />
          <SummaryItem label="Output status" value={snapshotStatus.replaceAll("-", " ")} />
        </dl>
      </ResultSection>
      <span className="sr-only" id="assessment-summary-title">
        Hypocalcaemia assessment summary
      </span>

      <div className="border-border mt-5 border-y py-5">
        <div className="flex flex-wrap items-center gap-2">
          <Beaker aria-hidden="true" className="text-primary size-5" />
          <h4 className="text-foreground text-sm font-semibold">Source-linked review flags</h4>
          <Badge variant="review">Possible associations, not diagnoses</Badge>
        </div>
        {flags.length > 0 ? (
          <ul className="mt-4 space-y-3">
            {flags.map((flag) => (
              <li className="flex items-start gap-3 text-sm leading-6" key={flag}>
                <CircleCheck aria-hidden="true" className="text-success mt-1 size-4 shrink-0" />
                <span>{flag}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted mt-3 text-sm leading-6">
            No source-linked diagnostic pattern is identified from the confirmed statuses. This does
            not exclude an underlying cause.
          </p>
        )}
      </div>

      <div className="mt-5">
        <SafetyAlert level="information" title="Assessment complete">
          Complete the cause and safeguard review below. Treatment remains hidden until every
          required safety context is resolved.
        </SafetyAlert>
      </div>
    </section>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted text-xs">{label}</dt>
      <dd className="text-foreground mt-1 text-sm font-semibold capitalize">{value}</dd>
    </div>
  );
}

function getDiagnosticReviewFlags(inputs: HypocalcaemiaAssessmentInputs): string[] {
  const flags: string[] = [];

  if (inputs.magnesium === "below-range") {
    flags.push(
      "Low magnesium suggests magnesium deficiency may be the primary problem; this assessment does not confirm that diagnosis.",
    );
  }
  if (inputs.renalFunction === "renal-failure") {
    flags.push(
      "Renal failure is present; the source says to consider hypocalcaemia secondary to 1,25-dihydroxyvitamin D deficiency.",
    );
  }
  if (inputs.surgery === "recent-surgery") {
    flags.push(
      "Recent thyroid or parathyroid surgery is confirmed; the source identifies disruption of parathyroid function after surgery as a common acute symptomatic context.",
    );
  }
  if (inputs.phosphate === "high") {
    flags.push(
      "High phosphate is recorded; the source says this most suggests renal disease and that pseudohypoparathyroidism should also be considered.",
    );
  }
  if (inputs.phosphate === "low" && inputs.alkalinePhosphatase === "high") {
    flags.push(
      "Low phosphate with high alkaline phosphatase matches a source-listed pattern associated with malabsorption, severe vitamin D deficiency, osteomalacia or renal tubular acidosis.",
    );
  }
  if (inputs.pth === "low") {
    flags.push(
      "Low PTH in the presence of hypocalcaemia is a source-listed pattern suggesting hypoparathyroidism.",
    );
  }
  if (inputs.vitaminD === "deficient") {
    flags.push("Vitamin D deficiency is confirmed as a possible source-listed cause context.");
  }

  return flags;
}

function labelSymptoms(symptoms: HypocalcaemiaAssessmentInputs["symptoms"]): string {
  if (symptoms?.includes("unable")) return "Unable to assess";
  if (symptoms?.includes("none")) return "No listed finding confirmed";
  return "Awaiting input";
}

function labelValue(value: string | undefined): string {
  return value?.replaceAll("-", " ") ?? "Awaiting input";
}

interface CurrentStepState {
  assessmentComplete: boolean;
  classificationAvailable: boolean;
  ecgAssessment?: EcgAssessmentStatus | undefined;
  rateOfFall?: RateOfFallStatus | undefined;
  symptomsAnswered: boolean;
}

function getCurrentStepId({
  assessmentComplete,
  classificationAvailable,
  ecgAssessment,
  rateOfFall,
  symptomsAnswered,
}: CurrentStepState): "calcium" | "investigations" | "management" | "symptoms" {
  if (!classificationAvailable) return "calcium";
  if (!symptomsAnswered || !rateOfFall) return "symptoms";
  if (!ecgAssessment || !assessmentComplete) return "investigations";
  return "management";
}
