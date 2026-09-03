import {
  createPathwayEngine,
  type PathwayEvaluationSnapshot,
  type PathwayInputDatum,
} from "../../engine/index.ts";
import type { PathwayDefinition, PathwayNode } from "../schema.ts";
import { HYPOCALCAEMIA_SOURCE_ID, type HypocalcaemiaAssessmentInputs } from "./assessment.ts";
import {
  determineHypocalcaemiaManagementBranch,
  type HypocalcaemiaManagementBranch,
} from "./management.ts";

export type ClinicalContextStatus = "confirmed" | "not-confirmed" | "unable";
export type ExpertAdviceStatus = "not-obtained" | "obtained" | "unable";
export type HypocalcaemiaMedicineContext =
  "bisphosphonate" | "cytotoxic-drug" | "denosumab" | "none" | "unable";
export type DetailedRenalContext =
  | "ckd-or-other-renal-failure"
  | "dialysis"
  | "end-stage-renal-failure"
  | "no-renal-failure"
  | "unable";
export type DetailedSurgeryContext =
  "no-recent-surgery" | "other-recent-surgery" | "parathyroidectomy" | "thyroidectomy" | "unable";
export type HypoparathyroidismCauseStatus =
  "not-confirmed" | "other-confirmed" | "postoperative-confirmed" | "unable";
export type AlfacalcidolAdministrationContext = "intravenous-required" | "oral-suitable" | "unable";
export type CardiacMonitoringContext = "both" | "digoxin" | "dysrhythmia" | "neither" | "unable";

export interface HypocalcaemiaGuardrailInputs {
  acutePancreatitis?: ClinicalContextStatus | undefined;
  alfacalcidolAdministration?: AlfacalcidolAdministrationContext | undefined;
  cardiacMonitoringContext?: CardiacMonitoringContext | undefined;
  hypomagnesaemiaCause?: ClinicalContextStatus | undefined;
  hypoparathyroidismCause?: HypoparathyroidismCauseStatus | undefined;
  medicineContexts?: readonly HypocalcaemiaMedicineContext[] | undefined;
  recentBloodTransfusion?: ClinicalContextStatus | undefined;
  renalContext?: DetailedRenalContext | undefined;
  renalPhysicianDiscussion?: ExpertAdviceStatus | undefined;
  rhabdomyolysis?: ClinicalContextStatus | undefined;
  rhabdomyolysisExpertAdvice?: ExpertAdviceStatus | undefined;
  surgeryContext?: DetailedSurgeryContext | undefined;
  vitaminDDeficiencyCause?: ClinicalContextStatus | undefined;
}

const causesReference = {
  page: 1,
  section: "Main causes of hypocalcaemia",
  sourceId: HYPOCALCAEMIA_SOURCE_ID,
};
const diagnosticReference = {
  page: 1,
  section: "Diagnosis of hypocalcaemia - the important questions",
  sourceId: HYPOCALCAEMIA_SOURCE_ID,
};
const emergencyGuardrailReference = {
  page: 2,
  section: "Severe symptomatic hypocalcaemia guardrails",
  sourceId: HYPOCALCAEMIA_SOURCE_ID,
};
const intravenousCalciumReference = {
  page: 2,
  section: "Administer IV calcium gluconate",
  sourceId: HYPOCALCAEMIA_SOURCE_ID,
};
const causeTreatmentReference = {
  page: 2,
  section: "Treat the underlying cause",
  sourceId: HYPOCALCAEMIA_SOURCE_ID,
};

type SingleChoiceQuestionNode = Extract<PathwayNode, { type: "single-choice-question" }>;

function sameTargetOptions(
  options: readonly { label: string; optionId: string; value: string }[],
  nextNodeId: string,
): SingleChoiceQuestionNode["options"] {
  return options.map((option) => ({ ...option, nextNodeId }));
}

const clinicalStatusOptions = (
  idPrefix: string,
  confirmedNextNodeId: string,
  notConfirmedNextNodeId: string,
  unableNextNodeId: string,
): SingleChoiceQuestionNode["options"] => [
  {
    label: "Confirmed",
    nextNodeId: confirmedNextNodeId,
    optionId: `${idPrefix}-confirmed-option`,
    value: "confirmed",
  },
  {
    label: "Not confirmed",
    nextNodeId: notConfirmedNextNodeId,
    optionId: `${idPrefix}-not-confirmed-option`,
    value: "not-confirmed",
  },
  {
    label: "Unable to establish",
    nextNodeId: unableNextNodeId,
    optionId: `${idPrefix}-unable-option`,
    value: "unable",
  },
];

const pathwayDefinitionInput: PathwayDefinition = {
  entryNodeId: "guardrail-management-branch",
  name: "Hypocalcaemia causes and guardrails",
  nodes: [
    {
      id: "guardrail-management-branch",
      inputKey: "managementBranch",
      options: [
        {
          label: "Mild asymptomatic branch",
          nextNodeId: "recent-blood-transfusion-question",
          optionId: "guardrail-mild-option",
          value: "mild-asymptomatic",
        },
        {
          label: "Severe symptomatic branch",
          nextNodeId: "recent-blood-transfusion-question",
          optionId: "guardrail-severe-option",
          value: "severe-symptomatic",
        },
        {
          label: "Unsupported management branch",
          nextNodeId: "guardrail-unsupported-stop",
          optionId: "guardrail-unsupported-option",
          value: "unsupported",
        },
      ],
      prompt: "Apply causes and safeguards to the source-derived management branch.",
      sourceReferences: [causesReference, emergencyGuardrailReference],
      title: "Guardrail management branch",
      type: "single-choice-question",
    },
    {
      id: "recent-blood-transfusion-question",
      inputKey: "recentBloodTransfusion",
      options: clinicalStatusOptions(
        "recent-transfusion",
        "blood-transfusion-pathway-warning",
        "rhabdomyolysis-question",
        "blood-transfusion-uncertain-warning",
      ),
      prompt: "Confirm whether the hypocalcaemia is in the context of a recent blood transfusion.",
      sourceReferences: [causesReference],
      title: "Blood-transfusion context",
      type: "single-choice-question",
    },
    {
      id: "blood-transfusion-pathway-warning",
      nextNodeId: "blood-transfusion-stop",
      sourceReferences: [causesReference],
      title: "Different source pathway required",
      type: "warning",
      warnings: [
        {
          message:
            "The supplied Hypocalcaemia source states that transfusion-related hypocalcaemia is covered by the local massive-blood-loss guidance. That guidance was not supplied, so no treatment instruction is generated here.",
          severity: "critical",
          sourceReferences: [causesReference],
          warningId: "blood-transfusion-external-pathway",
        },
      ],
    },
    {
      id: "blood-transfusion-uncertain-warning",
      nextNodeId: "blood-transfusion-stop",
      sourceReferences: [causesReference],
      title: "Blood-transfusion context uncertain",
      type: "warning",
      warnings: [
        {
          message:
            "The transfusion context could not be established. No treatment branch is selected because a different local pathway may apply.",
          severity: "caution",
          sourceReferences: [causesReference],
          warningId: "blood-transfusion-context-uncertain",
        },
      ],
    },
    {
      id: "blood-transfusion-stop",
      outcome: "requires-clinical-review",
      reason:
        "Use the current approved massive-blood-loss pathway or establish that transfusion-related hypocalcaemia does not apply.",
      sourceReferences: [causesReference],
      title: "Hypocalcaemia pathway stopped",
      type: "stop",
    },
    {
      id: "rhabdomyolysis-question",
      inputKey: "rhabdomyolysis",
      options: clinicalStatusOptions(
        "rhabdomyolysis",
        "rhabdomyolysis-expert-advice-question",
        "acute-pancreatitis-question",
        "rhabdomyolysis-uncertain-warning",
      ),
      prompt: "Confirm whether rhabdomyolysis is present.",
      sourceReferences: [causesReference, emergencyGuardrailReference],
      title: "Rhabdomyolysis",
      type: "single-choice-question",
    },
    {
      id: "rhabdomyolysis-expert-advice-question",
      inputKey: "rhabdomyolysisExpertAdvice",
      options: [
        {
          label: "Expert advice obtained",
          nextNodeId: "acute-pancreatitis-question",
          optionId: "rhabdomyolysis-advice-obtained-option",
          value: "obtained",
        },
        {
          label: "Expert advice not obtained",
          nextNodeId: "rhabdomyolysis-advice-warning",
          optionId: "rhabdomyolysis-advice-not-obtained-option",
          value: "not-obtained",
        },
        {
          label: "Unable to confirm advice",
          nextNodeId: "rhabdomyolysis-advice-warning",
          optionId: "rhabdomyolysis-advice-uncertain-option",
          value: "unable",
        },
      ],
      prompt: "Confirm that expert advice has been obtained before correcting hypocalcaemia.",
      sourceReferences: [emergencyGuardrailReference],
      title: "Rhabdomyolysis expert advice",
      type: "single-choice-question",
    },
    {
      id: "rhabdomyolysis-uncertain-warning",
      nextNodeId: "rhabdomyolysis-guardrail-stop",
      sourceReferences: [emergencyGuardrailReference],
      title: "Rhabdomyolysis cannot be excluded",
      type: "warning",
      warnings: [
        {
          message:
            "Rhabdomyolysis could not be established or excluded. No calcium-correction instruction is generated until this safety context is reviewed.",
          severity: "critical",
          sourceReferences: [emergencyGuardrailReference],
          warningId: "rhabdomyolysis-context-uncertain",
        },
      ],
    },
    {
      id: "rhabdomyolysis-advice-warning",
      nextNodeId: "rhabdomyolysis-guardrail-stop",
      sourceReferences: [emergencyGuardrailReference],
      title: "Expert advice required",
      type: "warning",
      warnings: [
        {
          message:
            "Do not correct hypocalcaemia in rhabdomyolysis without seeking expert advice. No calcium treatment instruction has been generated.",
          severity: "critical",
          sourceReferences: [emergencyGuardrailReference],
          warningId: "rhabdomyolysis-expert-advice-required",
        },
      ],
    },
    {
      id: "rhabdomyolysis-guardrail-stop",
      outcome: "requires-clinical-review",
      reason: "The rhabdomyolysis safety requirement is not resolved.",
      sourceReferences: [emergencyGuardrailReference],
      title: "Correction locked",
      type: "stop",
    },
    {
      id: "acute-pancreatitis-question",
      inputKey: "acutePancreatitis",
      options: clinicalStatusOptions(
        "acute-pancreatitis",
        "acute-pancreatitis-information",
        "medicine-context-question",
        "medicine-context-question",
      ),
      prompt: "Record whether acute pancreatitis is clinically confirmed.",
      sourceReferences: [causesReference],
      title: "Acute pancreatitis",
      type: "single-choice-question",
    },
    {
      body: "Acute pancreatitis is confirmed as a source-listed context in which hypocalcaemia can occur. This records an association, not an inferred cause diagnosis.",
      id: "acute-pancreatitis-information",
      nextNodeId: "medicine-context-question",
      sourceReferences: [causesReference],
      title: "Acute pancreatitis context recorded",
      type: "information",
    },
    {
      branches: [
        {
          branchId: "source-listed-medicine-selected",
          label: "One or more source-listed medicines selected",
          nextNodeId: "medicine-context-information",
          operator: "contains-any",
          values: ["cytotoxic-drug", "bisphosphonate", "denosumab"],
        },
        {
          branchId: "no-medicine-or-uncertain",
          label: "No source-listed medicine confirmed or unable to assess",
          nextNodeId: "renal-context-question",
          operator: "contains-any",
          values: ["none", "unable"],
        },
      ],
      fallbackBranch: null,
      id: "medicine-context-question",
      inputKey: "medicineContexts",
      maximumSelections: 3,
      minimumSelections: 1,
      options: [
        {
          label: "Cytotoxic drug",
          optionId: "cytotoxic-drug-option",
          value: "cytotoxic-drug",
        },
        {
          label: "Bisphosphonate",
          optionId: "bisphosphonate-option",
          value: "bisphosphonate",
        },
        { label: "Denosumab", optionId: "denosumab-option", value: "denosumab" },
        {
          label: "None of the listed medicines confirmed",
          optionId: "no-listed-medicine-option",
          value: "none",
        },
        {
          label: "Unable to establish medicine exposure",
          optionId: "medicine-context-uncertain-option",
          value: "unable",
        },
      ],
      prompt: "Select every source-listed medicine exposure that is clinically confirmed.",
      sourceReferences: [causesReference],
      title: "Medicine-related context",
      type: "multi-select-question",
    },
    {
      body: "One or more source-listed medicine exposures are confirmed. The pathway records this as a possible drug-related context and does not infer causality.",
      id: "medicine-context-information",
      nextNodeId: "renal-context-question",
      sourceReferences: [causesReference],
      title: "Medicine context recorded",
      type: "information",
    },
    {
      id: "renal-context-question",
      inputKey: "renalContext",
      options: [
        {
          label: "No renal failure",
          nextNodeId: "surgery-context-question",
          optionId: "detailed-no-renal-failure-option",
          value: "no-renal-failure",
        },
        {
          label: "CKD or other renal failure",
          nextNodeId: "renal-context-information",
          optionId: "detailed-ckd-option",
          value: "ckd-or-other-renal-failure",
        },
        {
          label: "End-stage renal failure, not on dialysis",
          nextNodeId: "renal-context-information",
          optionId: "detailed-esrf-option",
          value: "end-stage-renal-failure",
        },
        {
          label: "On dialysis",
          nextNodeId: "renal-context-information",
          optionId: "detailed-dialysis-option",
          value: "dialysis",
        },
        {
          label: "Unable to establish renal context",
          nextNodeId: "renal-context-uncertain-information",
          optionId: "detailed-renal-uncertain-option",
          value: "unable",
        },
      ],
      prompt: "Refine the renal context needed for source safeguards.",
      sourceReferences: [causesReference, diagnosticReference, intravenousCalciumReference],
      title: "Detailed renal context",
      type: "single-choice-question",
    },
    {
      body: "Renal failure is recorded. The source says to consider hypocalcaemia secondary to 1,25-dihydroxyvitamin D deficiency; this is a review flag, not a confirmed diagnosis.",
      id: "renal-context-information",
      nextNodeId: "surgery-context-question",
      sourceReferences: [causesReference, diagnosticReference],
      title: "Renal cause context recorded",
      type: "information",
    },
    {
      body: "The detailed renal context is uncertain. Large-volume calcium infusion will remain locked unless end-stage renal failure and dialysis can be excluded.",
      id: "renal-context-uncertain-information",
      nextNodeId: "surgery-context-question",
      sourceReferences: [intravenousCalciumReference],
      title: "Renal infusion safety unresolved",
      type: "information",
    },
    {
      id: "surgery-context-question",
      inputKey: "surgeryContext",
      options: [
        {
          label: "No recent thyroid or parathyroid surgery",
          nextNodeId: "hypoparathyroidism-cause-question",
          optionId: "detailed-no-recent-surgery-option",
          value: "no-recent-surgery",
        },
        {
          label: "Total thyroidectomy",
          nextNodeId: "surgery-context-information",
          optionId: "detailed-thyroidectomy-option",
          value: "thyroidectomy",
        },
        {
          label: "Parathyroidectomy",
          nextNodeId: "parathyroidectomy-information",
          optionId: "detailed-parathyroidectomy-option",
          value: "parathyroidectomy",
        },
        {
          label: "Other recent operation",
          nextNodeId: "hypoparathyroidism-cause-question",
          optionId: "detailed-other-surgery-option",
          value: "other-recent-surgery",
        },
        {
          label: "Unable to establish operation",
          nextNodeId: "surgery-uncertain-renal-branch",
          optionId: "detailed-surgery-uncertain-option",
          value: "unable",
        },
      ],
      prompt: "Specify the recent operative context without inferring the operation type.",
      sourceReferences: [causesReference, emergencyGuardrailReference],
      title: "Detailed surgery context",
      type: "single-choice-question",
    },
    {
      body: "Total thyroidectomy is confirmed. The source identifies disruption of parathyroid function after thyroidectomy or parathyroidectomy as the commonest acute symptomatic hospital cause.",
      id: "surgery-context-information",
      nextNodeId: "hypoparathyroidism-cause-question",
      sourceReferences: [causesReference],
      title: "Post-thyroidectomy context recorded",
      type: "information",
    },
    {
      body: "Parathyroidectomy is confirmed. The source requires discussion with the Duty Renal Physician when renal failure is also present.",
      id: "parathyroidectomy-information",
      nextNodeId: "parathyroidectomy-renal-branch",
      sourceReferences: [causesReference, emergencyGuardrailReference],
      title: "Post-parathyroidectomy context recorded",
      type: "information",
    },
    {
      id: "parathyroidectomy-renal-branch",
      inputKey: "renalContext",
      options: [
        {
          label: "No renal failure",
          nextNodeId: "hypoparathyroidism-cause-question",
          optionId: "parathyroidectomy-no-renal-option",
          value: "no-renal-failure",
        },
        ...sameTargetOptions(
          [
            {
              label: "CKD or other renal failure",
              optionId: "parathyroidectomy-ckd-option",
              value: "ckd-or-other-renal-failure",
            },
            {
              label: "End-stage renal failure",
              optionId: "parathyroidectomy-esrf-option",
              value: "end-stage-renal-failure",
            },
            {
              label: "On dialysis",
              optionId: "parathyroidectomy-dialysis-option",
              value: "dialysis",
            },
            {
              label: "Renal context uncertain",
              optionId: "parathyroidectomy-renal-uncertain-option",
              value: "unable",
            },
          ],
          "renal-physician-discussion-question",
        ),
      ],
      prompt: "Apply the renal safeguard to confirmed parathyroidectomy.",
      sourceReferences: [emergencyGuardrailReference],
      title: "Parathyroidectomy and renal failure",
      type: "single-choice-question",
    },
    {
      id: "surgery-uncertain-renal-branch",
      inputKey: "renalContext",
      options: [
        {
          label: "No renal failure",
          nextNodeId: "hypoparathyroidism-cause-question",
          optionId: "uncertain-surgery-no-renal-option",
          value: "no-renal-failure",
        },
        ...sameTargetOptions(
          [
            {
              label: "CKD or other renal failure",
              optionId: "uncertain-surgery-ckd-option",
              value: "ckd-or-other-renal-failure",
            },
            {
              label: "End-stage renal failure",
              optionId: "uncertain-surgery-esrf-option",
              value: "end-stage-renal-failure",
            },
            {
              label: "On dialysis",
              optionId: "uncertain-surgery-dialysis-option",
              value: "dialysis",
            },
            {
              label: "Renal context uncertain",
              optionId: "uncertain-surgery-renal-uncertain-option",
              value: "unable",
            },
          ],
          "surgery-renal-uncertainty-warning",
        ),
      ],
      prompt: "Apply the unresolved operative context to the renal safeguard.",
      sourceReferences: [emergencyGuardrailReference],
      title: "Uncertain surgery and renal context",
      type: "single-choice-question",
    },
    {
      id: "surgery-renal-uncertainty-warning",
      nextNodeId: "surgery-renal-uncertainty-stop",
      sourceReferences: [emergencyGuardrailReference],
      title: "Operative renal safeguard unresolved",
      type: "warning",
      warnings: [
        {
          message:
            "Renal failure is present or uncertain and the recent operation cannot be established. Parathyroidectomy cannot be excluded, so treatment remains locked pending clinical review.",
          severity: "critical",
          sourceReferences: [emergencyGuardrailReference],
          warningId: "surgery-renal-context-unresolved",
        },
      ],
    },
    {
      id: "surgery-renal-uncertainty-stop",
      outcome: "requires-clinical-review",
      reason: "Establish the operative context and complete the renal discussion safeguard.",
      sourceReferences: [emergencyGuardrailReference],
      title: "Treatment locked",
      type: "stop",
    },
    {
      id: "renal-physician-discussion-question",
      inputKey: "renalPhysicianDiscussion",
      options: [
        {
          label: "Duty Renal Physician discussion completed",
          nextNodeId: "hypoparathyroidism-cause-question",
          optionId: "renal-discussion-completed-option",
          value: "obtained",
        },
        {
          label: "Discussion not completed",
          nextNodeId: "renal-physician-discussion-warning",
          optionId: "renal-discussion-not-completed-option",
          value: "not-obtained",
        },
        {
          label: "Unable to confirm discussion",
          nextNodeId: "renal-physician-discussion-warning",
          optionId: "renal-discussion-uncertain-option",
          value: "unable",
        },
      ],
      prompt:
        "Confirm discussion with the Duty Renal Physician for hypocalcaemia after parathyroidectomy with renal failure.",
      sourceReferences: [emergencyGuardrailReference],
      title: "Duty Renal Physician discussion",
      type: "single-choice-question",
    },
    {
      id: "renal-physician-discussion-warning",
      nextNodeId: "renal-physician-discussion-stop",
      sourceReferences: [emergencyGuardrailReference, causeTreatmentReference],
      title: "Renal discussion required",
      type: "warning",
      warnings: [
        {
          message:
            "The source requires renal-physician discussion for this context. No context-dependent treatment instruction is generated until the discussion is confirmed.",
          severity: "critical",
          sourceReferences: [emergencyGuardrailReference, causeTreatmentReference],
          warningId: "renal-physician-discussion-required",
        },
      ],
    },
    {
      id: "renal-physician-discussion-stop",
      outcome: "requires-clinical-review",
      reason: "The source-defined renal-physician discussion has not been confirmed.",
      sourceReferences: [emergencyGuardrailReference, causeTreatmentReference],
      title: "Treatment locked",
      type: "stop",
    },
    {
      id: "hypoparathyroidism-cause-question",
      inputKey: "hypoparathyroidismCause",
      options: [
        {
          label: "Post-operative hypoparathyroidism confirmed",
          nextNodeId: "alfacalcidol-renal-branch",
          optionId: "postoperative-hypoparathyroidism-option",
          value: "postoperative-confirmed",
        },
        {
          label: "Other hypoparathyroidism confirmed",
          nextNodeId: "alfacalcidol-renal-branch",
          optionId: "other-hypoparathyroidism-option",
          value: "other-confirmed",
        },
        {
          label: "Hypoparathyroidism not confirmed",
          nextNodeId: "vitamin-d-cause-question",
          optionId: "hypoparathyroidism-not-confirmed-option",
          value: "not-confirmed",
        },
        {
          label: "Unable to establish cause",
          nextNodeId: "vitamin-d-cause-question",
          optionId: "hypoparathyroidism-uncertain-option",
          value: "unable",
        },
      ],
      prompt:
        "Record a confirmed cause diagnosis; do not infer hypoparathyroidism from a low PTH flag alone.",
      sourceReferences: [diagnosticReference, causeTreatmentReference],
      title: "Hypoparathyroidism cause confirmation",
      type: "single-choice-question",
    },
    {
      id: "alfacalcidol-renal-branch",
      inputKey: "renalContext",
      options: [
        {
          label: "No renal failure",
          nextNodeId: "alfacalcidol-administration-question",
          optionId: "alfacalcidol-no-renal-option",
          value: "no-renal-failure",
        },
        ...sameTargetOptions(
          [
            {
              label: "CKD or other renal failure",
              optionId: "alfacalcidol-ckd-option",
              value: "ckd-or-other-renal-failure",
            },
            {
              label: "End-stage renal failure",
              optionId: "alfacalcidol-esrf-option",
              value: "end-stage-renal-failure",
            },
            {
              label: "On dialysis",
              optionId: "alfacalcidol-dialysis-option",
              value: "dialysis",
            },
            {
              label: "Renal context uncertain",
              optionId: "alfacalcidol-renal-uncertain-option",
              value: "unable",
            },
          ],
          "alfacalcidol-renal-discussion-question",
        ),
      ],
      prompt: "Apply the renal discussion safeguard before 1-alfacalcidol.",
      sourceReferences: [causeTreatmentReference],
      title: "1-alfacalcidol renal safeguard",
      type: "single-choice-question",
    },
    {
      id: "alfacalcidol-renal-discussion-question",
      inputKey: "renalPhysicianDiscussion",
      options: [
        {
          label: "Renal physician discussion completed",
          nextNodeId: "alfacalcidol-administration-question",
          optionId: "alfacalcidol-renal-discussion-completed-option",
          value: "obtained",
        },
        {
          label: "Discussion not completed",
          nextNodeId: "alfacalcidol-renal-review-warning",
          optionId: "alfacalcidol-renal-discussion-not-completed-option",
          value: "not-obtained",
        },
        {
          label: "Unable to confirm discussion",
          nextNodeId: "alfacalcidol-renal-review-warning",
          optionId: "alfacalcidol-renal-discussion-uncertain-option",
          value: "unable",
        },
      ],
      prompt: "Confirm renal-physician discussion before using 1-alfacalcidol.",
      sourceReferences: [causeTreatmentReference],
      title: "Renal 1-alfacalcidol review",
      type: "single-choice-question",
    },
    {
      id: "alfacalcidol-renal-review-warning",
      nextNodeId: "alfacalcidol-renal-review-stop",
      sourceReferences: [causeTreatmentReference],
      title: "Renal review required",
      type: "warning",
      warnings: [
        {
          message:
            "Use of 1-alfacalcidol in renal patients should be discussed with a renal physician. No 1-alfacalcidol instruction has been generated.",
          severity: "critical",
          sourceReferences: [causeTreatmentReference],
          warningId: "alfacalcidol-renal-review-required",
        },
      ],
    },
    {
      id: "alfacalcidol-renal-review-stop",
      outcome: "requires-clinical-review",
      reason: "Renal review for 1-alfacalcidol has not been confirmed.",
      sourceReferences: [causeTreatmentReference],
      title: "Cause treatment locked",
      type: "stop",
    },
    {
      id: "alfacalcidol-administration-question",
      inputKey: "alfacalcidolAdministration",
      options: [
        {
          label: "Oral administration suitable",
          nextNodeId: "oral-alfacalcidol-action",
          optionId: "oral-alfacalcidol-option",
          value: "oral-suitable",
        },
        {
          label: "Absorption concern or oral difficulty",
          nextNodeId: "intravenous-alfacalcidol-action",
          optionId: "intravenous-alfacalcidol-option",
          value: "intravenous-required",
        },
        {
          label: "Unable to select administration",
          nextNodeId: "alfacalcidol-administration-warning",
          optionId: "alfacalcidol-administration-uncertain-option",
          value: "unable",
        },
      ],
      prompt: "Record the source-supported 1-alfacalcidol administration context.",
      sourceReferences: [causeTreatmentReference],
      title: "1-alfacalcidol administration",
      type: "single-choice-question",
    },
    {
      actions: [
        {
          actionId: "oral-alfacalcidol-cause-treatment",
          instruction:
            "For post-operative hypocalcaemia or confirmed hypoparathyroidism, include 1-alfacalcidol with an approximate starting dose of 0.25-0.5 microgram per day.",
          sourceReferences: [causeTreatmentReference],
          timing: "next",
        },
      ],
      id: "oral-alfacalcidol-action",
      nextNodeId: "alfacalcidol-monitoring",
      sourceReferences: [causeTreatmentReference],
      title: "1-alfacalcidol cause treatment",
      type: "action-group",
    },
    {
      actions: [
        {
          actionId: "intravenous-alfacalcidol-cause-treatment",
          instruction:
            "When absorption is a concern or oral administration is difficult, 1-alfacalcidol can be administered intravenously at equivalent doses; the source starting dose is approximately 0.25-0.5 microgram per day.",
          sourceReferences: [causeTreatmentReference],
          timing: "next",
        },
      ],
      id: "intravenous-alfacalcidol-action",
      nextNodeId: "alfacalcidol-monitoring",
      sourceReferences: [causeTreatmentReference],
      title: "Intravenous 1-alfacalcidol context",
      type: "action-group",
    },
    {
      id: "alfacalcidol-administration-warning",
      nextNodeId: "vitamin-d-cause-question",
      sourceReferences: [causeTreatmentReference],
      title: "1-alfacalcidol administration unresolved",
      type: "warning",
      warnings: [
        {
          message:
            "The administration context could not be established. No 1-alfacalcidol instruction has been generated.",
          severity: "caution",
          sourceReferences: [causeTreatmentReference],
          warningId: "alfacalcidol-administration-unresolved",
        },
      ],
    },
    {
      id: "alfacalcidol-monitoring",
      items: [
        {
          instruction:
            "Check serum calcium 1 week after discharge and, if satisfactory, at 3 and 6 months.",
          monitoringId: "alfacalcidol-calcium-follow-up",
          sourceReferences: [causeTreatmentReference],
        },
      ],
      nextNodeId: "vitamin-d-cause-question",
      sourceReferences: [causeTreatmentReference],
      title: "1-alfacalcidol monitoring",
      type: "monitoring",
    },
    {
      id: "vitamin-d-cause-question",
      inputKey: "vitaminDDeficiencyCause",
      options: clinicalStatusOptions(
        "vitamin-d-cause",
        "oral-vitamin-d-action",
        "hypomagnesaemia-cause-question",
        "hypomagnesaemia-cause-question",
      ),
      prompt:
        "Confirm whether vitamin D deficiency is the clinically established cause before treatment is generated.",
      sourceReferences: [causesReference, causeTreatmentReference],
      title: "Vitamin D deficiency cause",
      type: "single-choice-question",
    },
    {
      actions: [
        {
          actionId: "oral-vitamin-d-cause-treatment",
          instruction:
            "If vitamin D deficiency is the confirmed cause, treat with oral vitamin D. The supplied source does not specify a dose here.",
          sourceReferences: [causeTreatmentReference],
          timing: "next",
        },
      ],
      id: "oral-vitamin-d-action",
      nextNodeId: "hypomagnesaemia-cause-question",
      sourceReferences: [causeTreatmentReference],
      title: "Vitamin D cause treatment",
      type: "action-group",
    },
    {
      id: "hypomagnesaemia-cause-question",
      inputKey: "hypomagnesaemiaCause",
      options: clinicalStatusOptions(
        "hypomagnesaemia-cause",
        "hypomagnesaemia-cause-action",
        "guardrail-management-router",
        "guardrail-management-router",
      ),
      prompt:
        "Confirm whether hypomagnesaemia is clinically established as the cause before cause treatment is generated.",
      sourceReferences: [causesReference, diagnosticReference, causeTreatmentReference],
      title: "Hypomagnesaemia-related cause",
      type: "single-choice-question",
    },
    {
      actions: [
        {
          actionId: "hypomagnesaemia-cause-treatment",
          instruction:
            "If hypomagnesaemia-related, identify and treat the underlying cause of hypomagnesaemia. No magnesium dose is generated from the supplied Hypocalcaemia source.",
          sourceReferences: [causeTreatmentReference],
          timing: "next",
        },
      ],
      id: "hypomagnesaemia-cause-action",
      nextNodeId: "guardrail-management-router",
      sourceReferences: [causeTreatmentReference],
      title: "Hypomagnesaemia cause treatment",
      type: "action-group",
    },
    {
      id: "guardrail-management-router",
      inputKey: "managementBranch",
      options: [
        {
          label: "Mild asymptomatic branch",
          nextNodeId: "guardrails-cleared-stop",
          optionId: "guardrail-router-mild-option",
          value: "mild-asymptomatic",
        },
        {
          label: "Severe symptomatic branch",
          nextNodeId: "cardiac-monitoring-question",
          optionId: "guardrail-router-severe-option",
          value: "severe-symptomatic",
        },
        {
          label: "Unsupported management branch",
          nextNodeId: "guardrail-unsupported-stop",
          optionId: "guardrail-router-unsupported-option",
          value: "unsupported",
        },
      ],
      prompt: "Apply the branch-specific final safeguard.",
      sourceReferences: [emergencyGuardrailReference, causeTreatmentReference],
      title: "Final branch safeguard",
      type: "single-choice-question",
    },
    {
      id: "cardiac-monitoring-question",
      inputKey: "cardiacMonitoringContext",
      options: [
        {
          label: "Cardiac dysrhythmia confirmed",
          nextNodeId: "continuous-ecg-monitoring",
          optionId: "cardiac-dysrhythmia-option",
          value: "dysrhythmia",
        },
        {
          label: "Digoxin therapy confirmed",
          nextNodeId: "continuous-ecg-monitoring",
          optionId: "cardiac-digoxin-option",
          value: "digoxin",
        },
        {
          label: "Both contexts confirmed",
          nextNodeId: "continuous-ecg-monitoring",
          optionId: "cardiac-both-option",
          value: "both",
        },
        {
          label: "Neither context confirmed",
          nextNodeId: "guardrails-cleared-stop",
          optionId: "cardiac-neither-option",
          value: "neither",
        },
        {
          label: "Unable to establish cardiac context",
          nextNodeId: "cardiac-monitoring-uncertain-warning",
          optionId: "cardiac-context-uncertain-option",
          value: "unable",
        },
      ],
      prompt:
        "Confirm cardiac dysrhythmia and digoxin-therapy context before intravenous calcium treatment.",
      sourceReferences: [intravenousCalciumReference],
      title: "Continuous ECG context",
      type: "single-choice-question",
    },
    {
      id: "continuous-ecg-monitoring",
      items: [
        {
          instruction:
            "Use continuous ECG monitoring because cardiac dysrhythmia or digoxin therapy is confirmed.",
          monitoringId: "continuous-ecg-for-dysrhythmia-digoxin",
          sourceReferences: [intravenousCalciumReference],
        },
      ],
      nextNodeId: "guardrails-cleared-stop",
      sourceReferences: [intravenousCalciumReference],
      title: "Continuous ECG monitoring",
      type: "monitoring",
    },
    {
      id: "cardiac-monitoring-uncertain-warning",
      nextNodeId: "cardiac-monitoring-uncertain-stop",
      sourceReferences: [intravenousCalciumReference],
      title: "Continuous ECG requirement unresolved",
      type: "warning",
      warnings: [
        {
          message:
            "Cardiac dysrhythmia or digoxin therapy could not be established. No intravenous-calcium instruction is generated until the continuous-ECG requirement is reviewed.",
          severity: "critical",
          sourceReferences: [intravenousCalciumReference],
          warningId: "cardiac-monitoring-context-uncertain",
        },
      ],
    },
    {
      id: "cardiac-monitoring-uncertain-stop",
      outcome: "requires-clinical-review",
      reason: "The source-defined continuous-ECG safeguard is unresolved.",
      sourceReferences: [intravenousCalciumReference],
      title: "Intravenous calcium locked",
      type: "stop",
    },
    {
      id: "guardrails-cleared-stop",
      outcome: "requires-clinical-review",
      reason:
        "All implemented cause and guardrail questions are resolved. The source-derived management branch may be displayed for clinical review.",
      sourceReferences: [causesReference, emergencyGuardrailReference, causeTreatmentReference],
      title: "Cause and guardrail review complete",
      type: "stop",
    },
    {
      id: "guardrail-unsupported-stop",
      outcome: "unsupported",
      reason:
        "The completed assessment does not match a source-defined management branch, so no cause-dependent treatment is generated.",
      sourceReferences: [causesReference, emergencyGuardrailReference],
      title: "No supported guardrail branch",
      type: "stop",
    },
  ],
  pathwayId: "hypocalcaemia-causes-guardrails",
  reviewMetadata: {
    approvedBy: null,
    approvedOn: null,
    notes: [
      "Cause associations and safety guardrails are transcribed from pages 1 and 2 of the supplied Trust pathway.",
      "Blood-transfusion-related hypocalcaemia stops because the referenced massive-blood-loss guidance was not supplied.",
      "Rhabdomyolysis requires confirmed expert advice before any calcium-correction instruction is released.",
      "Parathyroidectomy with renal failure and 1-alfacalcidol use in renal patients require confirmed renal-physician discussion.",
      "Large-volume infusion safety is enforced by the connected management definition.",
      "The supplied Hypomagnesaemia document is a different, internally conflicting Trust source, so no magnesium dose is merged into this pathway.",
    ],
    reviewedBy: null,
    reviewedOn: null,
    status: "awaiting-clinical-review",
  },
  sourceIds: [HYPOCALCAEMIA_SOURCE_ID],
  status: "awaiting-clinical-review",
  version: "0.3.0",
};

const guardrailEngine = createPathwayEngine(pathwayDefinitionInput);

export const hypocalcaemiaGuardrailPathwayDefinition = guardrailEngine.definition;

export function evaluateHypocalcaemiaGuardrails(
  assessmentInputs: HypocalcaemiaAssessmentInputs,
  guardrailInputs: HypocalcaemiaGuardrailInputs = {},
): PathwayEvaluationSnapshot {
  const branch = determineHypocalcaemiaManagementBranch(assessmentInputs);
  const engineInputs: Record<string, PathwayInputDatum> = {
    managementBranch: { kind: "single-choice", value: branch.branch },
  };

  addSingleChoice(engineInputs, "recentBloodTransfusion", guardrailInputs.recentBloodTransfusion);
  addSingleChoice(engineInputs, "rhabdomyolysis", guardrailInputs.rhabdomyolysis);
  addSingleChoice(
    engineInputs,
    "rhabdomyolysisExpertAdvice",
    guardrailInputs.rhabdomyolysisExpertAdvice,
  );
  addSingleChoice(engineInputs, "acutePancreatitis", guardrailInputs.acutePancreatitis);

  if (guardrailInputs.medicineContexts && guardrailInputs.medicineContexts.length > 0) {
    engineInputs.medicineContexts = {
      kind: "multi-select",
      values: [...guardrailInputs.medicineContexts],
    };
  }

  addSingleChoice(
    engineInputs,
    "renalContext",
    resolveRenalContext(assessmentInputs, guardrailInputs.renalContext),
  );
  addSingleChoice(
    engineInputs,
    "surgeryContext",
    resolveSurgeryContext(assessmentInputs, guardrailInputs.surgeryContext),
  );
  addSingleChoice(
    engineInputs,
    "renalPhysicianDiscussion",
    guardrailInputs.renalPhysicianDiscussion,
  );
  addSingleChoice(engineInputs, "hypoparathyroidismCause", guardrailInputs.hypoparathyroidismCause);
  addSingleChoice(
    engineInputs,
    "alfacalcidolAdministration",
    guardrailInputs.alfacalcidolAdministration,
  );
  addSingleChoice(
    engineInputs,
    "vitaminDDeficiencyCause",
    resolveCauseStatus(
      assessmentInputs.vitaminD,
      "deficient",
      guardrailInputs.vitaminDDeficiencyCause,
    ),
  );
  addSingleChoice(
    engineInputs,
    "hypomagnesaemiaCause",
    resolveCauseStatus(
      assessmentInputs.magnesium,
      "below-range",
      guardrailInputs.hypomagnesaemiaCause,
    ),
  );
  addSingleChoice(
    engineInputs,
    "cardiacMonitoringContext",
    branch.branch === "severe-symptomatic" ? guardrailInputs.cardiacMonitoringContext : "neither",
  );

  return guardrailEngine.evaluate({ inputs: engineInputs });
}

export function isHypocalcaemiaGuardrailClear(snapshot: PathwayEvaluationSnapshot): boolean {
  return snapshot.currentNode?.id === "guardrails-cleared-stop";
}

function resolveRenalContext(
  assessmentInputs: HypocalcaemiaAssessmentInputs,
  value: DetailedRenalContext | undefined,
): DetailedRenalContext | "assessment-contradiction" | undefined {
  if (assessmentInputs.renalFunction === "no-renal-failure") {
    return value && value !== "no-renal-failure" ? "assessment-contradiction" : "no-renal-failure";
  }

  if (assessmentInputs.renalFunction === "renal-failure" && value === "no-renal-failure") {
    return "assessment-contradiction";
  }

  return value;
}

function resolveSurgeryContext(
  assessmentInputs: HypocalcaemiaAssessmentInputs,
  value: DetailedSurgeryContext | undefined,
): DetailedSurgeryContext | "assessment-contradiction" | undefined {
  if (assessmentInputs.surgery === "no-recent-surgery") {
    return value && value !== "no-recent-surgery"
      ? "assessment-contradiction"
      : "no-recent-surgery";
  }

  if (assessmentInputs.surgery === "recent-surgery" && value === "no-recent-surgery") {
    return "assessment-contradiction";
  }

  return value;
}

function resolveCauseStatus(
  assessmentValue: string | undefined,
  confirmedAssessmentValue: string,
  value: ClinicalContextStatus | undefined,
): ClinicalContextStatus | "assessment-contradiction" | undefined {
  if (assessmentValue === undefined) return value;
  if (assessmentValue === confirmedAssessmentValue) return value;
  if (value === "confirmed") return "assessment-contradiction";
  return assessmentValue.includes("unavailable") ? "unable" : "not-confirmed";
}

function addSingleChoice(
  inputs: Record<string, PathwayInputDatum>,
  key: string,
  value: string | undefined,
): void {
  if (value !== undefined) {
    inputs[key] = { kind: "single-choice", value };
  }
}

export function getGuardrailManagementBranch(
  assessmentInputs: HypocalcaemiaAssessmentInputs,
): HypocalcaemiaManagementBranch {
  return determineHypocalcaemiaManagementBranch(assessmentInputs).branch;
}
