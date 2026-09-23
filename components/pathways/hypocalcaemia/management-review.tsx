"use client";

import {
  Activity,
  CircleCheck,
  CircleHelp,
  Clock3,
  Pill,
  RefreshCw,
  ShieldAlert,
  Stethoscope,
} from "lucide-react";
import { useMemo, useState } from "react";

import {
  ActionContent,
  MajorDecisionCards,
  MonitoringTimeline,
  NumericClinicalInput,
  ResultSection,
  ReviewStatusBadge,
  SafetyAlert,
} from "@/components/clinical";
import { Badge } from "@/components/ui/badge";
import type { PathwayAction, PathwayWarning } from "@/src/clinical/engine";
import {
  ADJUSTED_CALCIUM_UNIT,
  determineHypocalcaemiaManagementBranch,
  evaluateHypocalcaemiaGuardrails,
  evaluateHypocalcaemiaManagement,
  isHypocalcaemiaGuardrailClear,
  type ContinuousInfusionNeed,
  type HypocalcaemiaAssessmentInputs,
  type HypocalcaemiaGuardrailInputs,
  type HypocalcaemiaManagementInputs,
  type OralCalciumSelection,
  type PersistentMildStatus,
  type SymptomResponseStatus,
} from "@/src/clinical/pathways/hypocalcaemia";

import { HypocalcaemiaGuardrailReview } from "./guardrail-review";

const monitoringMetadata: Record<string, { label: string; timing: string }> = {
  "calcium-after-each-dose": {
    label: "Serum calcium",
    timing: "After each dose",
  },
  "close-calcium-monitoring": {
    label: "Serum calcium",
    timing: "Close monitoring",
  },
  "continuous-infusion-calcium-titration": {
    label: "Plasma calcium",
    timing: "During continuous infusion",
  },
  "ecg-during-initial-dose": {
    label: "ECG",
    timing: "During the initial dose",
  },
  "recheck-calcium-within-one-week": {
    label: "Serum calcium",
    timing: "Within one week",
  },
  "repeat-calcium-24-hours": {
    label: "Serum calcium",
    timing: "24 hours later",
  },
};

export function HypocalcaemiaManagementReview({
  assessmentInputs,
}: {
  assessmentInputs: HypocalcaemiaAssessmentInputs;
}) {
  const [continuousInfusionNeed, setContinuousInfusionNeed] = useState<
    ContinuousInfusionNeed | undefined
  >();
  const [followUpCalcium, setFollowUpCalcium] = useState("");
  const [guardrailInputs, setGuardrailInputs] = useState<HypocalcaemiaGuardrailInputs>({});
  const [oralCalciumSelection, setOralCalciumSelection] = useState<
    OralCalciumSelection | undefined
  >();
  const [persistentMild, setPersistentMild] = useState<PersistentMildStatus | undefined>();
  const [symptomResponse, setSymptomResponse] = useState<SymptomResponseStatus | undefined>();
  const branch = useMemo(
    () => determineHypocalcaemiaManagementBranch(assessmentInputs),
    [assessmentInputs],
  );
  const managementInputs: HypocalcaemiaManagementInputs = useMemo(
    () => ({
      ...(continuousInfusionNeed ? { continuousInfusionNeed } : {}),
      ...(followUpCalcium.trim() === ""
        ? {}
        : { followUpAdjustedCalcium: Number(followUpCalcium) }),
      ...(oralCalciumSelection ? { oralCalciumSelection } : {}),
      ...(persistentMild ? { persistentMildBeyond72Hours: persistentMild } : {}),
      ...(guardrailInputs.surgeryContext
        ? {
            postThyroidectomy:
              guardrailInputs.surgeryContext === "thyroidectomy"
                ? ("confirmed" as const)
                : guardrailInputs.surgeryContext === "unable"
                  ? ("unable" as const)
                  : ("not-confirmed" as const),
          }
        : {}),
      ...(guardrailInputs.renalContext
        ? { infusionRenalContext: guardrailInputs.renalContext }
        : assessmentInputs.renalFunction === "no-renal-failure"
          ? { infusionRenalContext: "no-renal-failure" as const }
          : {}),
      ...(symptomResponse ? { symptomResponse } : {}),
    }),
    [
      assessmentInputs.renalFunction,
      continuousInfusionNeed,
      followUpCalcium,
      guardrailInputs.renalContext,
      guardrailInputs.surgeryContext,
      oralCalciumSelection,
      persistentMild,
      symptomResponse,
    ],
  );
  const guardrailEvaluation = useMemo(
    () => evaluateHypocalcaemiaGuardrails(assessmentInputs, guardrailInputs),
    [assessmentInputs, guardrailInputs],
  );
  const guardrailsCleared = isHypocalcaemiaGuardrailClear(guardrailEvaluation);
  const evaluation = useMemo(
    () => evaluateHypocalcaemiaManagement(assessmentInputs, managementInputs, guardrailsCleared),
    [assessmentInputs, guardrailsCleared, managementInputs],
  );
  const currentNode = evaluation.currentNode;
  const followUpError = getFollowUpError(evaluation, followUpCalcium);
  const isSevere = branch.branch === "severe-symptomatic";

  function resetTreatmentInputs() {
    setContinuousInfusionNeed(undefined);
    setFollowUpCalcium("");
    setOralCalciumSelection(undefined);
    setPersistentMild(undefined);
    setSymptomResponse(undefined);
  }

  return (
    <article className="border-border bg-surface rounded-lg border shadow-xs">
      <header className="border-border border-b p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-warning-strong text-xs font-bold uppercase">
              Source-derived management review
            </p>
            <h2 className="text-foreground mt-1 text-lg font-bold">
              {isSevere
                ? "Severe symptomatic emergency management"
                : branch.branch === "mild-asymptomatic"
                  ? "Mild asymptomatic management"
                  : "Management branch unavailable"}
            </h2>
            <p className="text-muted mt-2 max-w-3xl text-sm leading-6">{branch.reason}</p>
          </div>
          <ReviewStatusBadge status="awaiting-clinical-review" />
        </div>
      </header>

      <div className="space-y-6 p-5 sm:p-6">
        {branch.branch === "unsupported" ? (
          <SafetyAlert level="warning" title="No treatment instruction generated">
            {branch.reason}
          </SafetyAlert>
        ) : (
          <>
            <SafetyAlert
              level={isSevere ? "critical" : "warning"}
              title={
                isSevere
                  ? "Medical emergency - unapproved treatment preview"
                  : "Unapproved treatment preview"
              }
            >
              This source transcription is for technical and clinical review only. Complete every
              displayed safeguard before reviewing treatment, and use the current approved local
              pathway for patient care.
            </SafetyAlert>

            <HypocalcaemiaGuardrailReview
              evaluation={guardrailEvaluation}
              inputs={guardrailInputs}
              onChange={(nextInputs) => {
                setGuardrailInputs(nextInputs);
                resetTreatmentInputs();
              }}
              onReset={() => {
                setGuardrailInputs({});
                resetTreatmentInputs();
              }}
            />

            {guardrailsCleared ? (
              <>
                {currentNode?.id === "oral-calcium-selection" ? (
                  <MajorDecisionCards
                    description="Calcichew Forte is the source's first-line formulary option. Sandocal is reserved for swallowing difficulty or other intolerance."
                    legend="Select the confirmed oral-calcium context"
                    name="oral-calcium-selection"
                    onValueChange={(value) => {
                      setOralCalciumSelection(value as OralCalciumSelection);
                      setFollowUpCalcium("");
                      setPersistentMild(undefined);
                    }}
                    options={[
                      {
                        description: "Use the source's first-line formulary preference.",
                        icon: Pill,
                        label: "Calcichew Forte",
                        value: "calcichew",
                      },
                      {
                        description:
                          "Use for swallowing difficulty or other Calcichew intolerance.",
                        icon: RefreshCw,
                        label: "Sandocal",
                        value: "sandocal",
                      },
                      {
                        description: "Stop without selecting an oral-calcium instruction.",
                        icon: CircleHelp,
                        label: "Unable to select safely",
                        value: "unable",
                      },
                    ]}
                    required
                    value={oralCalciumSelection ?? ""}
                  />
                ) : null}

                {evaluation.immediateActions.length > 0 ? (
                  <ResultSection
                    dividers={false}
                    headingAs="h3"
                    icon={isSevere ? Activity : Pill}
                    status={isSevere ? "Immediate" : "Commence"}
                    title={isSevere ? "Emergency treatment" : "Initial oral treatment"}
                    tone={isSevere ? "danger" : "info"}
                  >
                    <ManagementActionList actions={evaluation.immediateActions} />
                  </ResultSection>
                ) : null}

                {evaluation.nextActions.length > 0 ? (
                  <ResultSection
                    dividers={false}
                    headingAs="h3"
                    icon={Clock3}
                    status="Next"
                    title="Next source action"
                    tone="info"
                  >
                    <ManagementActionList actions={evaluation.nextActions} />
                  </ResultSection>
                ) : null}

                {evaluation.warnings.map((warning) => (
                  <ManagementWarning key={warning.warningId} warning={warning} />
                ))}

                {evaluation.monitoring.length > 0 ? (
                  <MonitoringTimeline
                    dividers={false}
                    items={evaluation.monitoring.map((item) => {
                      const metadata = monitoringMetadata[item.monitoringId] ?? {
                        label: "Clinical monitoring",
                        timing: "As specified",
                      };

                      return {
                        description: item.instruction,
                        id: item.monitoringId,
                        label: metadata.label,
                        status: "upcoming" as const,
                        timing: metadata.timing,
                      };
                    })}
                    title="Source-defined monitoring"
                  />
                ) : null}

                {currentNode?.id === "follow-up-calcium-input" ? (
                  <section
                    className="border-border border-t pt-6"
                    aria-labelledby="follow-up-title"
                  >
                    <div className="flex items-start gap-3">
                      <span className="bg-info-subtle text-primary flex size-10 shrink-0 items-center justify-center rounded-md">
                        <RefreshCw aria-hidden="true" className="size-5" />
                      </span>
                      <div>
                        <h3
                          className="text-foreground text-base font-semibold"
                          id="follow-up-title"
                        >
                          Review the next calcium result
                        </h3>
                        <p className="text-muted mt-1 text-xs leading-5">
                          Enter the next confirmed adjusted result. No unprinted follow-up interval
                          is inferred for non-operative cases.
                        </p>
                      </div>
                    </div>
                    <div className="mt-5 max-w-xl">
                      <NumericClinicalInput
                        description="Up to 3 decimal places is accepted and the result is not rounded into a branch."
                        id="follow-up-adjusted-calcium"
                        label="Follow-up adjusted serum calcium"
                        min="0.001"
                        onChange={(event) => {
                          setFollowUpCalcium(event.target.value);
                          setPersistentMild(undefined);
                        }}
                        required
                        step="0.001"
                        unit={ADJUSTED_CALCIUM_UNIT}
                        value={followUpCalcium}
                        {...(followUpError ? { error: followUpError } : {})}
                      />
                    </div>
                  </section>
                ) : null}

                {currentNode?.id === "persistent-mild-question" ? (
                  <section className="border-border border-t pt-6">
                    <MajorDecisionCards
                      description="This branch applies only after recent surgery, when mild hypocalcaemia persists despite calcium supplementation."
                      legend="Does mild post-operative hypocalcaemia persist beyond 72 hours?"
                      name="persistent-mild-review"
                      onValueChange={(value) => setPersistentMild(value as PersistentMildStatus)}
                      options={[
                        {
                          description: "Persistence beyond 72 hours is clinically confirmed.",
                          icon: Clock3,
                          label: "Persistent beyond 72 hours",
                          value: "confirmed",
                        },
                        {
                          description: "The source-defined persistence point has not been reached.",
                          icon: CircleCheck,
                          label: "Not persistent",
                          value: "not-confirmed",
                        },
                        {
                          description: "Timing or persistence cannot be confirmed safely.",
                          icon: CircleHelp,
                          label: "Unable to establish",
                          value: "unable",
                        },
                      ]}
                      required
                      value={persistentMild ?? ""}
                    />
                  </section>
                ) : null}

                {currentNode?.id === "symptom-response-question" ? (
                  <section className="border-border border-t pt-6">
                    <MajorDecisionCards
                      description="The repeat-dose branch is revealed only when symptoms remain unresolved after the initial source-defined treatment."
                      legend="Have symptoms resolved after the initial treatment?"
                      name="hypocalcaemia-symptom-response"
                      onValueChange={(value) => setSymptomResponse(value as SymptomResponseStatus)}
                      options={[
                        {
                          description:
                            "The source-listed symptoms are clinically assessed as resolved.",
                          icon: CircleCheck,
                          label: "Symptoms resolved",
                          value: "resolved",
                        },
                        {
                          description: "One or more source-listed symptoms remain present.",
                          icon: RefreshCw,
                          label: "Symptoms not resolved",
                          value: "not-resolved",
                        },
                        {
                          description: "The response cannot be established safely.",
                          icon: CircleHelp,
                          label: "Unable to assess",
                          value: "unable",
                        },
                      ]}
                      required
                      value={symptomResponse ?? ""}
                    />
                  </section>
                ) : null}

                {currentNode?.id === "continuous-infusion-need-question" ? (
                  <section className="border-border border-t pt-6">
                    <MajorDecisionCards
                      description="The source says infusion may be required but gives no automatic selection criteria. Record an explicit clinical decision."
                      legend="Is a continuous calcium infusion clinically required?"
                      name="continuous-calcium-infusion-decision"
                      onValueChange={(value) =>
                        setContinuousInfusionNeed(value as ContinuousInfusionNeed)
                      }
                      options={[
                        {
                          description: "A continuous calcium infusion is clinically required.",
                          icon: Activity,
                          label: "Infusion required",
                          value: "required",
                        },
                        {
                          description: "A continuous infusion is not clinically required.",
                          icon: CircleCheck,
                          label: "Not required",
                          value: "not-required",
                        },
                        {
                          description: "The infusion decision cannot be established safely.",
                          icon: CircleHelp,
                          label: "Unable to determine",
                          value: "unable",
                        },
                      ]}
                      required
                      value={continuousInfusionNeed ?? ""}
                    />
                  </section>
                ) : null}

                {currentNode?.type === "stop" ? (
                  <ResultSection
                    dividers={false}
                    headingAs="h3"
                    icon={evaluation.status === "unsupported" ? ShieldAlert : Stethoscope}
                    status="Clinical review required"
                    title={currentNode.title}
                    tone={evaluation.status === "unsupported" ? "warning" : "success"}
                  >
                    <p>{evaluation.stopReason}</p>
                    <Badge className="mt-3" variant="review">
                      Locked pending approval
                    </Badge>
                  </ResultSection>
                ) : null}
              </>
            ) : null}
          </>
        )}
      </div>
    </article>
  );
}

function ManagementActionList({ actions }: { actions: readonly PathwayAction[] }) {
  return (
    <ul className="space-y-3">
      {actions.map((action) => (
        <li className="flex items-start gap-3" key={action.actionId}>
          <CircleCheck aria-hidden="true" className="text-success mt-1 size-4 shrink-0" />
          <ActionContent action={action} />
        </li>
      ))}
    </ul>
  );
}

function ManagementWarning({ warning }: { warning: PathwayWarning }) {
  const titles: Record<string, string> = {
    "follow-up-below-mild-range": "Stop the mild pathway and reassess",
    "intravenous-calcium-hazards": "Intravenous calcium hazards",
    "large-volume-infusion-prohibited": "Large-volume infusion prohibited",
    "large-volume-infusion-renal-uncertain": "Renal infusion safety unresolved",
  };

  return (
    <SafetyAlert
      level={warning.severity === "critical" ? "critical" : "warning"}
      title={titles[warning.warningId] ?? "Management safety note"}
    >
      {warning.message}
    </SafetyAlert>
  );
}

function getFollowUpError(
  evaluation: ReturnType<typeof evaluateHypocalcaemiaManagement>,
  rawValue: string,
): string | undefined {
  if (rawValue.trim() === "") return undefined;
  const value = Number(rawValue);

  if (!Number.isFinite(value)) return "Enter a finite numeric calcium result.";
  const issue = evaluation.issues.find(({ field }) => field === "followUpAdjustedCalcium");

  if (!issue) return undefined;
  if (/decimal places/i.test(issue.message)) return "Enter no more than 3 decimal places.";
  if (/accepted range/i.test(issue.message)) return "Enter a result greater than 0 mmol/L.";
  if (/expected unit/i.test(issue.message)) return `Use ${ADJUSTED_CALCIUM_UNIT}.`;
  return "Check the follow-up adjusted calcium result.";
}
