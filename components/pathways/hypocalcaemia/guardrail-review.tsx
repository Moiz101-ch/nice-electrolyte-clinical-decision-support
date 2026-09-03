"use client";

import {
  Activity,
  CircleCheck,
  CircleHelp,
  CircleX,
  Droplets,
  FlaskConical,
  HeartPulse,
  Hospital,
  Pill,
  RotateCcw,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";

import {
  ActionContent,
  GroupedSymptomSelection,
  MajorDecisionCards,
  MonitoringTimeline,
  ResultSection,
  SafetyAlert,
  type SymptomSelectionGroup,
} from "@/components/clinical";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import type {
  PathwayAction,
  PathwayEvaluationSnapshot,
  PathwayWarning,
} from "@/src/clinical/engine";
import {
  isHypocalcaemiaGuardrailClear,
  type AlfacalcidolAdministrationContext,
  type CardiacMonitoringContext,
  type ClinicalContextStatus,
  type DetailedRenalContext,
  type DetailedSurgeryContext,
  type ExpertAdviceStatus,
  type HypocalcaemiaGuardrailInputs,
  type HypocalcaemiaMedicineContext,
  type HypoparathyroidismCauseStatus,
} from "@/src/clinical/pathways/hypocalcaemia";

const medicineGroups: readonly SymptomSelectionGroup[] = [
  {
    description: "Select every confirmed exposure, or one explicit none/uncertain state.",
    id: "source-listed-medicines",
    label: "Source-listed medicine exposures",
    options: [
      { label: "Cytotoxic drug", value: "cytotoxic-drug" },
      { label: "Bisphosphonate", value: "bisphosphonate" },
      { label: "Denosumab", value: "denosumab" },
      { label: "None of the listed medicines confirmed", value: "none" },
      { label: "Unable to establish medicine exposure", value: "unable" },
    ],
  },
];

interface HypocalcaemiaGuardrailReviewProps {
  evaluation: PathwayEvaluationSnapshot;
  inputs: HypocalcaemiaGuardrailInputs;
  onChange: (inputs: HypocalcaemiaGuardrailInputs) => void;
  onReset: () => void;
}

export function HypocalcaemiaGuardrailReview({
  evaluation,
  inputs,
  onChange,
  onReset,
}: HypocalcaemiaGuardrailReviewProps) {
  const currentNode = evaluation.currentNode;
  const cleared = isHypocalcaemiaGuardrailClear(evaluation);
  const hasEnteredInput = Object.values(inputs).some((value) =>
    Array.isArray(value) ? value.length > 0 : value !== undefined,
  );

  function update<Key extends keyof HypocalcaemiaGuardrailInputs>(
    key: Key,
    value: HypocalcaemiaGuardrailInputs[Key],
  ) {
    onChange({ ...inputs, [key]: value });
  }

  function updateMedicineContexts(values: readonly string[]) {
    const typedValues = values as readonly HypocalcaemiaMedicineContext[];
    const previousValues = inputs.medicineContexts ?? [];
    let normalized = typedValues;

    if (typedValues.includes("none") && !previousValues.includes("none")) {
      normalized = ["none"];
    } else if (typedValues.includes("unable") && !previousValues.includes("unable")) {
      normalized = ["unable"];
    } else if (typedValues.some((value) => value !== "none" && value !== "unable")) {
      normalized = typedValues.filter((value) => value !== "none" && value !== "unable");
    }

    update("medicineContexts", normalized);
  }

  return (
    <section aria-labelledby="cause-guardrail-title" className="border-border border-y py-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="bg-warning-subtle text-warning-strong flex size-10 shrink-0 items-center justify-center rounded-md">
            <ShieldCheck aria-hidden="true" className="size-5" />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-foreground text-base font-semibold" id="cause-guardrail-title">
                Cause and safeguard review
              </h3>
              <Badge variant={cleared ? "success" : "warning"}>
                {cleared ? "Complete" : "Required before treatment"}
              </Badge>
            </div>
            <p className="text-muted mt-1 max-w-3xl text-xs leading-5">
              Confirm source-listed contexts explicitly. Possible associations from laboratory
              results are not treated as diagnoses.
            </p>
          </div>
        </div>
        {hasEnteredInput ? (
          <Button onClick={onReset} size="sm" type="button" variant="secondary">
            <RotateCcw aria-hidden="true" />
            Reset safeguard review
          </Button>
        ) : null}
      </div>

      <div className="mt-6">
        {currentNode?.id === "recent-blood-transfusion-question" ? (
          <ClinicalStatusDecision
            description="Transfusion-related hypocalcaemia belongs to a separate local massive-blood-loss pathway."
            legend="Is this hypocalcaemia associated with a recent blood transfusion?"
            name="recent-blood-transfusion"
            onValueChange={(value) => update("recentBloodTransfusion", value)}
            value={inputs.recentBloodTransfusion}
          />
        ) : null}

        {currentNode?.id === "rhabdomyolysis-question" ? (
          <ClinicalStatusDecision
            description="The source prohibits correction in rhabdomyolysis without expert advice."
            legend="Is rhabdomyolysis clinically confirmed?"
            name="rhabdomyolysis-context"
            onValueChange={(value) => update("rhabdomyolysis", value)}
            value={inputs.rhabdomyolysis}
          />
        ) : null}

        {currentNode?.id === "rhabdomyolysis-expert-advice-question" ? (
          <MajorDecisionCards
            description="Treatment remains locked unless expert advice is explicitly confirmed."
            legend="Has expert advice been obtained for correction in rhabdomyolysis?"
            name="rhabdomyolysis-expert-advice"
            onValueChange={(value) =>
              update("rhabdomyolysisExpertAdvice", value as ExpertAdviceStatus)
            }
            options={[
              {
                description: "Expert advice has been obtained for this correction decision.",
                icon: CircleCheck,
                label: "Advice obtained",
                value: "obtained",
              },
              {
                description: "Required expert advice has not yet been obtained.",
                icon: CircleX,
                label: "Not obtained",
                value: "not-obtained",
              },
              {
                description: "Available information cannot confirm that advice was obtained.",
                icon: CircleHelp,
                label: "Unable to confirm",
                value: "unable",
              },
            ]}
            required
            value={inputs.rhabdomyolysisExpertAdvice ?? ""}
          />
        ) : null}

        {currentNode?.id === "acute-pancreatitis-question" ? (
          <ClinicalStatusDecision
            description="Acute pancreatitis is a source-listed context in which hypocalcaemia can occur."
            legend="Is acute pancreatitis clinically confirmed?"
            name="acute-pancreatitis-context"
            onValueChange={(value) => update("acutePancreatitis", value)}
            value={inputs.acutePancreatitis}
          />
        ) : null}

        {currentNode?.id === "medicine-context-question" ? (
          <GroupedSymptomSelection
            description="The workflow records exposure only and does not infer that a medicine caused the hypocalcaemia."
            groups={medicineGroups}
            legend="Which source-listed medicines are confirmed?"
            name="hypocalcaemia-medicines"
            onValuesChange={updateMedicineContexts}
            values={inputs.medicineContexts ?? []}
          />
        ) : null}

        {currentNode?.id === "renal-context-question" ? (
          <SelectDecision
            description="End-stage renal failure and dialysis specifically prevent the source's large-volume calcium infusion."
            icon={FlaskConical}
            id="detailed-renal-context"
            label="Detailed renal context"
            onValueChange={(value) => update("renalContext", value as DetailedRenalContext)}
            options={[
              ["no-renal-failure", "No renal failure"],
              ["ckd-or-other-renal-failure", "CKD or other renal failure"],
              ["end-stage-renal-failure", "End-stage renal failure, not on dialysis"],
              ["dialysis", "Currently on dialysis"],
              ["unable", "Unable to establish safely"],
            ]}
            value={inputs.renalContext}
          />
        ) : null}

        {currentNode?.id === "surgery-context-question" ? (
          <SelectDecision
            description="This distinction controls the post-thyroidectomy check and the parathyroidectomy renal safeguard."
            icon={Hospital}
            id="detailed-surgery-context"
            label="Detailed surgery context"
            onValueChange={(value) => update("surgeryContext", value as DetailedSurgeryContext)}
            options={[
              ["no-recent-surgery", "No recent thyroid or parathyroid surgery"],
              ["thyroidectomy", "Total thyroidectomy"],
              ["parathyroidectomy", "Parathyroidectomy"],
              ["other-recent-surgery", "Other recent operation"],
              ["unable", "Unable to establish operation"],
            ]}
            value={inputs.surgeryContext}
          />
        ) : null}

        {currentNode?.id === "renal-physician-discussion-question" ||
        currentNode?.id === "alfacalcidol-renal-discussion-question" ? (
          <MajorDecisionCards
            description="The source requires renal-physician discussion for the current context."
            legend="Has the required renal-physician discussion been completed?"
            name="renal-physician-discussion"
            onValueChange={(value) =>
              update("renalPhysicianDiscussion", value as ExpertAdviceStatus)
            }
            options={[
              {
                description: "The required discussion has been completed.",
                icon: CircleCheck,
                label: "Discussion completed",
                value: "obtained",
              },
              {
                description: "The required discussion has not been completed.",
                icon: CircleX,
                label: "Not completed",
                value: "not-obtained",
              },
              {
                description: "Completion cannot be confirmed from available information.",
                icon: CircleHelp,
                label: "Unable to confirm",
                value: "unable",
              },
            ]}
            required
            value={inputs.renalPhysicianDiscussion ?? ""}
          />
        ) : null}

        {currentNode?.id === "hypoparathyroidism-cause-question" ? (
          <MajorDecisionCards
            description="Choose a confirmed cause state. A low PTH flag alone is not converted into a diagnosis."
            legend="Is hypoparathyroidism clinically confirmed as the cause?"
            name="hypoparathyroidism-cause"
            onValueChange={(value) =>
              update("hypoparathyroidismCause", value as HypoparathyroidismCauseStatus)
            }
            options={[
              {
                description: "Post-operative hypoparathyroidism is clinically confirmed.",
                icon: Hospital,
                label: "Post-operative",
                value: "postoperative-confirmed",
              },
              {
                description: "Another hypoparathyroidism cause is clinically confirmed.",
                icon: Stethoscope,
                label: "Other confirmed",
                value: "other-confirmed",
              },
              {
                description: "Hypoparathyroidism has been assessed and is not confirmed.",
                icon: CircleX,
                label: "Not confirmed",
                value: "not-confirmed",
              },
              {
                description: "The cause cannot be established from available information.",
                icon: CircleHelp,
                label: "Unable to establish",
                value: "unable",
              },
            ]}
            required
            value={inputs.hypoparathyroidismCause ?? ""}
          />
        ) : null}

        {currentNode?.id === "alfacalcidol-administration-question" ? (
          <MajorDecisionCards
            description="Intravenous administration is source-supported only for absorption concerns or oral-administration difficulty."
            legend="Which 1-alfacalcidol administration context applies?"
            name="alfacalcidol-administration"
            onValueChange={(value) =>
              update("alfacalcidolAdministration", value as AlfacalcidolAdministrationContext)
            }
            options={[
              {
                description: "Oral administration and absorption are suitable.",
                icon: Pill,
                label: "Oral suitable",
                value: "oral-suitable",
              },
              {
                description: "Absorption concern or oral-administration difficulty is confirmed.",
                icon: Droplets,
                label: "Intravenous required",
                value: "intravenous-required",
              },
              {
                description: "The administration context cannot be selected safely.",
                icon: CircleHelp,
                label: "Unable to select",
                value: "unable",
              },
            ]}
            required
            value={inputs.alfacalcidolAdministration ?? ""}
          />
        ) : null}

        {currentNode?.id === "vitamin-d-cause-question" ? (
          <ClinicalStatusDecision
            description="Treatment is generated only when vitamin D deficiency is confirmed as the cause, not merely present as a result."
            legend="Is vitamin D deficiency the clinically established cause?"
            name="vitamin-d-cause"
            onValueChange={(value) => update("vitaminDDeficiencyCause", value)}
            value={inputs.vitaminDDeficiencyCause}
          />
        ) : null}

        {currentNode?.id === "hypomagnesaemia-cause-question" ? (
          <ClinicalStatusDecision
            description="The primary source supports underlying-cause treatment but does not supply a magnesium dose."
            legend="Is hypomagnesaemia clinically established as the cause?"
            name="hypomagnesaemia-cause"
            onValueChange={(value) => update("hypomagnesaemiaCause", value)}
            value={inputs.hypomagnesaemiaCause}
          />
        ) : null}

        {currentNode?.id === "cardiac-monitoring-question" ? (
          <SelectDecision
            description="Confirmed dysrhythmia or digoxin therapy requires continuous ECG monitoring."
            icon={HeartPulse}
            id="cardiac-monitoring-context"
            label="Cardiac monitoring context"
            onValueChange={(value) =>
              update("cardiacMonitoringContext", value as CardiacMonitoringContext)
            }
            options={[
              ["neither", "Neither context confirmed"],
              ["dysrhythmia", "Cardiac dysrhythmia confirmed"],
              ["digoxin", "Digoxin therapy confirmed"],
              ["both", "Both contexts confirmed"],
              ["unable", "Unable to establish safely"],
            ]}
            value={inputs.cardiacMonitoringContext}
          />
        ) : null}

        {evaluation.information.length > 0 ? (
          <div className="mt-6 space-y-3">
            {evaluation.information.map((item) => (
              <ResultSection
                dividers={false}
                headingAs="h3"
                icon={Stethoscope}
                key={item.nodeId}
                status="Recorded context"
                title={item.title}
                tone="info"
              >
                <p>{item.body}</p>
              </ResultSection>
            ))}
          </div>
        ) : null}

        {evaluation.nextActions.length > 0 ? (
          <ResultSection
            dividers={false}
            headingAs="h3"
            icon={Pill}
            status="Confirmed cause"
            title="Source-defined cause management"
            tone="info"
          >
            <ActionList actions={evaluation.nextActions} />
          </ResultSection>
        ) : null}

        {evaluation.monitoring.length > 0 ? (
          <MonitoringTimeline
            dividers={false}
            items={evaluation.monitoring.map((item) => ({
              description: item.instruction,
              id: item.monitoringId,
              label:
                item.monitoringId === "continuous-ecg-for-dysrhythmia-digoxin"
                  ? "Continuous ECG"
                  : "Serum calcium",
              status: "upcoming" as const,
              timing:
                item.monitoringId === "continuous-ecg-for-dysrhythmia-digoxin"
                  ? "During intravenous calcium treatment"
                  : "After discharge",
            }))}
            title="Cause and safeguard monitoring"
          />
        ) : null}

        {evaluation.warnings.map((warning) => (
          <GuardrailWarning key={warning.warningId} warning={warning} />
        ))}

        {currentNode?.type === "stop" ? (
          <ResultSection
            dividers={false}
            headingAs="h3"
            icon={ShieldCheck}
            status={cleared ? "Safeguards complete" : "Treatment locked"}
            title={currentNode.title}
            tone={cleared ? "success" : "warning"}
          >
            <p>{evaluation.stopReason}</p>
          </ResultSection>
        ) : null}
      </div>
    </section>
  );
}

function ClinicalStatusDecision({
  description,
  legend,
  name,
  onValueChange,
  value,
}: {
  description: string;
  legend: string;
  name: string;
  onValueChange: (value: ClinicalContextStatus) => void;
  value?: ClinicalContextStatus | undefined;
}) {
  return (
    <MajorDecisionCards
      description={description}
      legend={legend}
      name={name}
      onValueChange={(nextValue) => onValueChange(nextValue as ClinicalContextStatus)}
      options={[
        {
          description: "This context is clinically confirmed.",
          icon: CircleCheck,
          label: "Confirmed",
          value: "confirmed",
        },
        {
          description: "This context has been assessed and is not confirmed.",
          icon: CircleX,
          label: "Not confirmed",
          value: "not-confirmed",
        },
        {
          description: "Available information cannot establish this context safely.",
          icon: CircleHelp,
          label: "Unable to establish",
          value: "unable",
        },
      ]}
      required
      value={value ?? ""}
    />
  );
}

function SelectDecision({
  description,
  icon: Icon,
  id,
  label,
  onValueChange,
  options,
  value,
}: {
  description: string;
  icon: typeof Activity;
  id: string;
  label: string;
  onValueChange: (value: string) => void;
  options: readonly (readonly [value: string, label: string])[];
  value?: string | undefined;
}) {
  return (
    <div className="max-w-2xl">
      <div className="flex items-start gap-3">
        <span className="bg-info-subtle text-primary flex size-10 shrink-0 items-center justify-center rounded-md">
          <Icon aria-hidden="true" className="size-5" />
        </span>
        <div>
          <label className="text-foreground text-sm font-semibold" htmlFor={id}>
            {label}
            <span aria-hidden="true" className="text-danger ml-1">
              *
            </span>
            <span className="sr-only"> (required)</span>
          </label>
          <p className="text-muted mt-1 text-xs leading-5">{description}</p>
        </div>
      </div>
      <Select
        className="mt-4"
        id={id}
        onChange={(event) => onValueChange(event.target.value)}
        required
        value={value ?? ""}
      >
        <option disabled value="">
          Select confirmed context
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

function ActionList({ actions }: { actions: readonly PathwayAction[] }) {
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

function GuardrailWarning({ warning }: { warning: PathwayWarning }) {
  const titles: Record<string, string> = {
    "alfacalcidol-administration-unresolved": "1-alfacalcidol route unresolved",
    "alfacalcidol-renal-review-required": "Renal review required",
    "blood-transfusion-context-uncertain": "Transfusion context uncertain",
    "blood-transfusion-external-pathway": "Different local pathway required",
    "cardiac-monitoring-context-uncertain": "Continuous ECG requirement unresolved",
    "renal-physician-discussion-required": "Renal discussion required",
    "rhabdomyolysis-context-uncertain": "Rhabdomyolysis cannot be excluded",
    "rhabdomyolysis-expert-advice-required": "Expert advice required",
    "surgery-renal-context-unresolved": "Operative renal safeguard unresolved",
  };

  return (
    <div className="mt-5">
      <SafetyAlert
        level={warning.severity === "critical" ? "critical" : "warning"}
        title={titles[warning.warningId] ?? "Cause or safeguard review"}
      >
        {warning.message}
      </SafetyAlert>
    </div>
  );
}
