import {
  createPathwayEngine,
  type PathwayEvaluationSnapshot,
  type PathwayInputDatum,
} from "../../engine/index.ts";
import type { PathwayDefinition } from "../schema.ts";
import {
  ADJUSTED_CALCIUM_UNIT,
  HYPOCALCAEMIA_SOURCE_ID,
  evaluateHypocalcaemiaAssessment,
  evaluateHypocalcaemiaSeverity,
  type HypocalcaemiaAssessmentInputs,
} from "./assessment.ts";

export const FOLLOW_UP_CALCIUM_INPUT_KEY = "followUpAdjustedCalcium";

export type HypocalcaemiaManagementBranch =
  "mild-asymptomatic" | "severe-symptomatic" | "unsupported";
export type OralCalciumSelection = "calcichew" | "sandocal" | "unable";
export type PostoperativeContext = "confirmed" | "not-confirmed" | "unable";
export type PostThyroidectomyStatus = "confirmed" | "not-confirmed" | "unable";
export type PersistentMildStatus = "confirmed" | "not-confirmed" | "unable";
export type SymptomResponseStatus = "not-resolved" | "resolved" | "unable";
export type ContinuousInfusionNeed = "not-required" | "required" | "unable";
export type InfusionRenalContext =
  | "ckd-or-other-renal-failure"
  | "dialysis"
  | "end-stage-renal-failure"
  | "no-renal-failure"
  | "unable";

export interface HypocalcaemiaManagementInputs {
  continuousInfusionNeed?: ContinuousInfusionNeed | undefined;
  followUpAdjustedCalcium?: number | undefined;
  infusionRenalContext?: InfusionRenalContext | undefined;
  oralCalciumSelection?: OralCalciumSelection | undefined;
  postThyroidectomy?: PostThyroidectomyStatus | undefined;
  persistentMildBeyond72Hours?: PersistentMildStatus | undefined;
  symptomResponse?: SymptomResponseStatus | undefined;
}

export interface HypocalcaemiaManagementBranchResult {
  branch: HypocalcaemiaManagementBranch;
  reason: string;
}

const emergencyReference = {
  page: 2,
  section: "Severe symptomatic hypocalcaemia is a medical emergency",
  sourceId: HYPOCALCAEMIA_SOURCE_ID,
};
const intravenousCalciumReference = {
  page: 2,
  section: "Administer IV calcium gluconate",
  sourceId: HYPOCALCAEMIA_SOURCE_ID,
};
const mildManagementReference = {
  page: 2,
  section: "Mild hypocalcaemia",
  sourceId: HYPOCALCAEMIA_SOURCE_ID,
};

const pathwayDefinitionInput: PathwayDefinition = {
  entryNodeId: "management-branch",
  name: "Hypocalcaemia management branches",
  nodes: [
    {
      id: "management-branch",
      inputKey: "managementBranch",
      options: [
        {
          label: "Mild asymptomatic management",
          nextNodeId: "oral-calcium-selection",
          optionId: "mild-asymptomatic-option",
          value: "mild-asymptomatic",
        },
        {
          label: "Severe symptomatic emergency management",
          nextNodeId: "severe-initial-calcium",
          optionId: "severe-symptomatic-option",
          value: "severe-symptomatic",
        },
        {
          label: "No supported management branch",
          nextNodeId: "unsupported-management-stop",
          optionId: "unsupported-management-option",
          value: "unsupported",
        },
        {
          label: "Cause and guardrail review incomplete",
          nextNodeId: "guardrails-incomplete-stop",
          optionId: "management-guardrails-incomplete-option",
          value: "guardrails-not-cleared",
        },
      ],
      prompt: "Apply the management branch derived from the completed assessment.",
      sourceReferences: [emergencyReference, mildManagementReference],
      title: "Management branch",
      type: "single-choice-question",
    },
    {
      id: "oral-calcium-selection",
      inputKey: "oralCalciumSelection",
      options: [
        {
          label: "Calcichew Forte first-line option",
          nextNodeId: "calcichew-initial-action",
          optionId: "calcichew-option",
          value: "calcichew",
        },
        {
          label: "Sandocal for swallowing difficulty or intolerance",
          nextNodeId: "sandocal-initial-action",
          optionId: "sandocal-option",
          value: "sandocal",
        },
        {
          label: "Unable to select safely",
          nextNodeId: "oral-selection-review-stop",
          optionId: "oral-selection-uncertain-option",
          value: "unable",
        },
      ],
      prompt: "Select the source-supported oral-calcium context.",
      sourceReferences: [mildManagementReference],
      title: "Oral calcium selection",
      type: "single-choice-question",
    },
    {
      actions: [
        {
          actionId: "commence-calcichew-forte",
          instruction:
            "Commence Calcichew Forte without vitamin D, 2 tablets twice daily. Each tablet contains 2500 mg.",
          sourceReferences: [mildManagementReference],
          timing: "immediate",
        },
      ],
      id: "calcichew-initial-action",
      nextNodeId: "postoperative-monitoring-branch",
      sourceReferences: [mildManagementReference],
      title: "First-line oral calcium",
      type: "action-group",
    },
    {
      actions: [
        {
          actionId: "commence-sandocal",
          guidance: {
            steps: ["Discuss any other oral-calcium alternative with pharmacy."],
            title: "If Sandocal is not suitable",
          },
          instruction:
            "For swallowing difficulty or other Calcichew intolerance, commence Sandocal 1000, 2 tablets twice daily.",
          sourceReferences: [mildManagementReference],
          timing: "immediate",
        },
      ],
      id: "sandocal-initial-action",
      nextNodeId: "postoperative-monitoring-branch",
      sourceReferences: [mildManagementReference],
      title: "Alternative oral calcium",
      type: "action-group",
    },
    {
      id: "postoperative-monitoring-branch",
      inputKey: "postoperativeContext",
      options: [
        {
          label: "Recent thyroid or parathyroid surgery confirmed",
          nextNodeId: "post-thyroidectomy-question",
          optionId: "postoperative-confirmed-option",
          value: "confirmed",
        },
        {
          label: "No recent thyroid or parathyroid surgery",
          nextNodeId: "follow-up-calcium-input",
          optionId: "postoperative-not-confirmed-option",
          value: "not-confirmed",
        },
        {
          label: "Surgical context unavailable",
          nextNodeId: "follow-up-calcium-input",
          optionId: "postoperative-uncertain-option",
          value: "unable",
        },
      ],
      prompt: "Apply the recorded post-operative context.",
      sourceReferences: [mildManagementReference],
      title: "Post-operative monitoring context",
      type: "single-choice-question",
    },
    {
      id: "post-thyroidectomy-question",
      inputKey: "postThyroidectomy",
      options: [
        {
          label: "Post-thyroidectomy confirmed",
          nextNodeId: "postoperative-24-hour-monitoring",
          optionId: "post-thyroidectomy-confirmed-option",
          value: "confirmed",
        },
        {
          label: "Recent surgery was not thyroidectomy",
          nextNodeId: "follow-up-calcium-input",
          optionId: "post-thyroidectomy-not-confirmed-option",
          value: "not-confirmed",
        },
        {
          label: "Unable to establish the operation",
          nextNodeId: "follow-up-calcium-input",
          optionId: "post-thyroidectomy-uncertain-option",
          value: "unable",
        },
      ],
      prompt: "Confirm whether the recent operation was specifically thyroidectomy.",
      sourceReferences: [mildManagementReference],
      title: "Post-thyroidectomy confirmation",
      type: "single-choice-question",
    },
    {
      id: "postoperative-24-hour-monitoring",
      items: [
        {
          instruction:
            "For an asymptomatic patient following thyroid surgery, repeat calcium 24 hours later.",
          monitoringId: "repeat-calcium-24-hours",
          sourceReferences: [mildManagementReference],
        },
      ],
      nextNodeId: "follow-up-calcium-input",
      sourceReferences: [mildManagementReference],
      title: "Post-thyroidectomy calcium check",
      type: "monitoring",
    },
    {
      acceptedRange: {
        maximum: null,
        maximumInclusive: false,
        minimum: 0,
        minimumInclusive: false,
      },
      id: "follow-up-calcium-input",
      inputKey: FOLLOW_UP_CALCIUM_INPUT_KEY,
      nextNodeId: "follow-up-calcium-branch",
      precision: 3,
      prompt: "Enter the next confirmed adjusted serum calcium result when available.",
      sourceReferences: [mildManagementReference],
      title: "Follow-up adjusted calcium",
      type: "numeric-input",
      unit: ADJUSTED_CALCIUM_UNIT,
    },
    {
      branches: [
        {
          branchId: "follow-up-below-mild-range",
          label: "Follow-up calcium is below the mild range",
          nextNodeId: "follow-up-left-mild-warning",
          range: {
            maximum: 1.9,
            maximumInclusive: false,
            minimum: 0,
            minimumInclusive: false,
          },
        },
        {
          branchId: "follow-up-remains-mild",
          label: "Follow-up calcium remains 1.9-2.1 mmol/L",
          nextNodeId: "increase-calcichew-action",
          range: {
            maximum: 2.1,
            maximumInclusive: true,
            minimum: 1.9,
            minimumInclusive: true,
          },
        },
        {
          branchId: "follow-up-above-mild-range",
          label: "Follow-up calcium is above 2.1 mmol/L",
          nextNodeId: "discharge-pathway-action",
          range: {
            maximum: null,
            maximumInclusive: false,
            minimum: 2.1,
            minimumInclusive: false,
          },
        },
      ],
      id: "follow-up-calcium-branch",
      inputKey: FOLLOW_UP_CALCIUM_INPUT_KEY,
      noMatchBranch: null,
      sourceReferences: [mildManagementReference],
      title: "Review follow-up calcium",
      type: "numeric-branch",
      unit: ADJUSTED_CALCIUM_UNIT,
    },
    {
      id: "follow-up-left-mild-warning",
      nextNodeId: "follow-up-left-mild-stop",
      sourceReferences: [emergencyReference, mildManagementReference],
      title: "Follow-up result left the mild pathway",
      type: "warning",
      warnings: [
        {
          message:
            "The follow-up adjusted calcium is below 1.9 mmol/L. Stop the mild pathway and reassess severity and symptoms; no further mild-pathway instruction has been generated.",
          severity: "critical",
          sourceReferences: [emergencyReference, mildManagementReference],
          warningId: "follow-up-below-mild-range",
        },
      ],
    },
    {
      id: "follow-up-left-mild-stop",
      outcome: "requires-clinical-review",
      reason:
        "The follow-up result no longer matches the mild management range. Reassessment is required.",
      sourceReferences: [emergencyReference, mildManagementReference],
      title: "Mild pathway stopped",
      type: "stop",
    },
    {
      actions: [
        {
          actionId: "increase-calcichew-forte",
          instruction:
            "If serum calcium remains between 1.9 and 2.1 mmol/L, increase Calcichew Forte to 3 tablets twice daily.",
          sourceReferences: [mildManagementReference],
          timing: "next",
        },
      ],
      id: "increase-calcichew-action",
      nextNodeId: "persistence-applicability-branch",
      sourceReferences: [mildManagementReference],
      title: "Persistent mild hypocalcaemia",
      type: "action-group",
    },
    {
      id: "persistence-applicability-branch",
      inputKey: "postoperativeContext",
      options: [
        {
          label: "Recent thyroid or parathyroid surgery confirmed",
          nextNodeId: "persistent-mild-question",
          optionId: "persistence-postoperative-confirmed-option",
          value: "confirmed",
        },
        {
          label: "No recent thyroid or parathyroid surgery",
          nextNodeId: "mild-increase-review-stop",
          optionId: "persistence-postoperative-not-confirmed-option",
          value: "not-confirmed",
        },
        {
          label: "Surgical context unavailable",
          nextNodeId: "mild-increase-review-stop",
          optionId: "persistence-postoperative-uncertain-option",
          value: "unable",
        },
      ],
      prompt: "Apply post-operative persistence only when the surgical context is confirmed.",
      sourceReferences: [mildManagementReference],
      title: "Post-operative persistence context",
      type: "single-choice-question",
    },
    {
      id: "persistent-mild-question",
      inputKey: "persistentMildBeyond72Hours",
      options: [
        {
          label: "Persistent beyond 72 hours despite calcium",
          nextNodeId: "postoperative-alfacalcidol-action",
          optionId: "persistent-mild-confirmed-option",
          value: "confirmed",
        },
        {
          label: "Not persistent beyond 72 hours",
          nextNodeId: "mild-increase-review-stop",
          optionId: "persistent-mild-not-confirmed-option",
          value: "not-confirmed",
        },
        {
          label: "Unable to establish",
          nextNodeId: "persistence-review-stop",
          optionId: "persistent-mild-uncertain-option",
          value: "unable",
        },
      ],
      prompt:
        "Confirm whether mild post-operative hypocalcaemia persists beyond 72 hours despite calcium supplementation.",
      sourceReferences: [mildManagementReference],
      title: "72-hour post-operative review",
      type: "single-choice-question",
    },
    {
      actions: [
        {
          actionId: "start-postoperative-alfacalcidol",
          instruction:
            "Start 1-alfacalcidol 0.25 microgram once daily when mild post-operative hypocalcaemia persists beyond 72 hours despite calcium supplementation.",
          sourceReferences: [mildManagementReference],
          timing: "next",
        },
      ],
      id: "postoperative-alfacalcidol-action",
      nextNodeId: "postoperative-alfacalcidol-monitoring",
      sourceReferences: [mildManagementReference],
      title: "Persistent post-operative treatment",
      type: "action-group",
    },
    {
      id: "postoperative-alfacalcidol-monitoring",
      items: [
        {
          instruction: "Monitor serum calcium closely after starting 1-alfacalcidol.",
          monitoringId: "close-calcium-monitoring",
          sourceReferences: [mildManagementReference],
        },
      ],
      nextNodeId: "mild-alfacalcidol-review-stop",
      sourceReferences: [mildManagementReference],
      title: "Close calcium monitoring",
      type: "monitoring",
    },
    {
      id: "mild-alfacalcidol-review-stop",
      outcome: "requires-clinical-review",
      reason:
        "The source-defined persistent post-operative mild treatment endpoint has been reached. Clinical review remains required.",
      sourceReferences: [mildManagementReference],
      title: "Persistent mild management review",
      type: "stop",
    },
    {
      id: "mild-increase-review-stop",
      outcome: "requires-clinical-review",
      reason:
        "The source-defined oral calcium increase has been generated. No post-operative persistence action applies from the confirmed context.",
      sourceReferences: [mildManagementReference],
      title: "Mild management review",
      type: "stop",
    },
    {
      id: "persistence-review-stop",
      outcome: "requires-clinical-review",
      reason:
        "Post-operative persistence could not be established. No 1-alfacalcidol instruction has been generated.",
      sourceReferences: [mildManagementReference],
      title: "Persistence requires review",
      type: "stop",
    },
    {
      actions: [
        {
          actionId: "discharge-from-mild-pathway",
          instruction:
            "When adjusted calcium is above 2.1 mmol/L, the source states that the patient may be discharged.",
          sourceReferences: [mildManagementReference],
          timing: "next",
        },
      ],
      id: "discharge-pathway-action",
      nextNodeId: "post-discharge-monitoring",
      sourceReferences: [mildManagementReference],
      title: "Mild pathway discharge threshold",
      type: "action-group",
    },
    {
      id: "post-discharge-monitoring",
      items: [
        {
          instruction: "Recheck serum calcium within one week.",
          monitoringId: "recheck-calcium-within-one-week",
          sourceReferences: [mildManagementReference],
        },
      ],
      nextNodeId: "mild-discharge-review-stop",
      sourceReferences: [mildManagementReference],
      title: "Calcium recheck",
      type: "monitoring",
    },
    {
      id: "mild-discharge-review-stop",
      outcome: "requires-clinical-review",
      reason:
        "The supplied mild-pathway discharge threshold and follow-up check have been generated. Broader discharge criteria remain outside this pathway.",
      sourceReferences: [mildManagementReference],
      title: "Mild pathway endpoint",
      type: "stop",
    },
    {
      id: "oral-selection-review-stop",
      outcome: "requires-clinical-review",
      reason:
        "A source-supported oral-calcium option could not be selected safely. No medicine instruction has been generated.",
      sourceReferences: [mildManagementReference],
      title: "Oral calcium requires review",
      type: "stop",
    },
    {
      actions: [
        {
          actionId: "initial-intravenous-calcium-gluconate",
          instruction:
            "Initially give 10 mL of 10% calcium gluconate in 50 mL of 5% glucose intravenously over 10 minutes with ECG monitoring.",
          sourceReferences: [intravenousCalciumReference],
          timing: "immediate",
        },
      ],
      id: "severe-initial-calcium",
      nextNodeId: "intravenous-calcium-hazards",
      sourceReferences: [emergencyReference, intravenousCalciumReference],
      title: "Initial emergency calcium",
      type: "action-group",
    },
    {
      id: "intravenous-calcium-hazards",
      nextNodeId: "severe-dose-monitoring",
      sourceReferences: [intravenousCalciumReference],
      title: "Intravenous calcium hazards",
      type: "warning",
      warnings: [
        {
          message:
            "Uncommon hazards include local thrombophlebitis, cardiotoxicity, hypotension, metallic taste, flushing, nausea, vomiting and sweating.",
          severity: "caution",
          sourceReferences: [intravenousCalciumReference],
          warningId: "intravenous-calcium-hazards",
        },
      ],
    },
    {
      id: "severe-dose-monitoring",
      items: [
        {
          instruction:
            "Measure serum calcium after each dose; ionised calcium can be obtained quickly.",
          monitoringId: "calcium-after-each-dose",
          sourceReferences: [intravenousCalciumReference],
        },
        {
          instruction: "Use ECG monitoring during the initial intravenous calcium dose.",
          monitoringId: "ecg-during-initial-dose",
          sourceReferences: [intravenousCalciumReference],
        },
      ],
      nextNodeId: "symptom-response-question",
      sourceReferences: [intravenousCalciumReference],
      title: "Emergency monitoring",
      type: "monitoring",
    },
    {
      id: "symptom-response-question",
      inputKey: "symptomResponse",
      options: [
        {
          label: "Symptoms resolved",
          nextNodeId: "severe-response-review-stop",
          optionId: "symptoms-resolved-option",
          value: "resolved",
        },
        {
          label: "Symptoms not resolved",
          nextNodeId: "repeat-intravenous-calcium",
          optionId: "symptoms-not-resolved-option",
          value: "not-resolved",
        },
        {
          label: "Unable to assess response",
          nextNodeId: "response-uncertain-stop",
          optionId: "symptom-response-uncertain-option",
          value: "unable",
        },
      ],
      prompt: "Record the clinically assessed symptom response after the initial treatment.",
      sourceReferences: [intravenousCalciumReference],
      title: "Symptom response",
      type: "single-choice-question",
    },
    {
      actions: [
        {
          actionId: "repeat-intravenous-calcium-gluconate",
          instruction: "If symptoms have not resolved, repeat 10 mL of 10% calcium gluconate.",
          sourceReferences: [intravenousCalciumReference],
          timing: "immediate",
        },
      ],
      id: "repeat-intravenous-calcium",
      nextNodeId: "continuous-infusion-need-question",
      sourceReferences: [intravenousCalciumReference],
      title: "Repeat emergency calcium",
      type: "action-group",
    },
    {
      id: "continuous-infusion-need-question",
      inputKey: "continuousInfusionNeed",
      options: [
        {
          label: "Continuous infusion clinically required",
          nextNodeId: "large-volume-infusion-renal-branch",
          optionId: "continuous-infusion-required-option",
          value: "required",
        },
        {
          label: "Continuous infusion not required",
          nextNodeId: "severe-repeat-review-stop",
          optionId: "continuous-infusion-not-required-option",
          value: "not-required",
        },
        {
          label: "Unable to determine",
          nextNodeId: "continuous-infusion-selection-stop",
          optionId: "continuous-infusion-uncertain-option",
          value: "unable",
        },
      ],
      prompt:
        "Record the clinical decision about continuous calcium infusion; the source provides no deterministic selection criteria.",
      sourceReferences: [intravenousCalciumReference],
      title: "Continuous calcium infusion decision",
      type: "single-choice-question",
    },
    {
      id: "large-volume-infusion-renal-branch",
      inputKey: "infusionRenalContext",
      options: [
        {
          label: "No renal failure",
          nextNodeId: "continuous-calcium-infusion-action",
          optionId: "infusion-no-renal-failure-option",
          value: "no-renal-failure",
        },
        {
          label: "CKD or other renal failure",
          nextNodeId: "continuous-calcium-infusion-action",
          optionId: "infusion-other-renal-failure-option",
          value: "ckd-or-other-renal-failure",
        },
        {
          label: "End-stage renal failure",
          nextNodeId: "large-volume-infusion-prohibited-warning",
          optionId: "infusion-esrf-option",
          value: "end-stage-renal-failure",
        },
        {
          label: "On dialysis",
          nextNodeId: "large-volume-infusion-prohibited-warning",
          optionId: "infusion-dialysis-option",
          value: "dialysis",
        },
        {
          label: "Unable to establish renal context",
          nextNodeId: "large-volume-infusion-renal-uncertain-warning",
          optionId: "infusion-renal-uncertain-option",
          value: "unable",
        },
      ],
      prompt: "Apply the confirmed renal and dialysis context before a large-volume infusion.",
      sourceReferences: [intravenousCalciumReference],
      title: "Large-volume infusion renal safeguard",
      type: "single-choice-question",
    },
    {
      actions: [
        {
          actionId: "continuous-calcium-infusion",
          instruction:
            "Add 100 mL of 10% calcium gluconate to 1 L of 0.9% sodium chloride or 5% glucose solution and infuse at 50-100 mL per hour.",
          sourceReferences: [intravenousCalciumReference],
          timing: "immediate",
        },
      ],
      id: "continuous-calcium-infusion-action",
      nextNodeId: "continuous-calcium-infusion-monitoring",
      sourceReferences: [intravenousCalciumReference],
      title: "Continuous calcium infusion",
      type: "action-group",
    },
    {
      id: "continuous-calcium-infusion-monitoring",
      items: [
        {
          instruction:
            "Titrate the infusion rate to achieve normocalcaemia and continue until treatment of the underlying cause has been effective.",
          monitoringId: "continuous-infusion-calcium-titration",
          sourceReferences: [intravenousCalciumReference],
        },
      ],
      nextNodeId: "severe-infusion-review-stop",
      sourceReferences: [intravenousCalciumReference],
      title: "Continuous-infusion monitoring",
      type: "monitoring",
    },
    {
      id: "large-volume-infusion-prohibited-warning",
      nextNodeId: "large-volume-infusion-prohibited-stop",
      sourceReferences: [intravenousCalciumReference],
      title: "Large-volume infusion prohibited",
      type: "warning",
      warnings: [
        {
          message:
            "Do not use the source's large-volume calcium infusion in end-stage renal failure or for a patient on dialysis. No infusion instruction has been generated.",
          severity: "critical",
          sourceReferences: [intravenousCalciumReference],
          warningId: "large-volume-infusion-prohibited",
        },
      ],
    },
    {
      id: "large-volume-infusion-renal-uncertain-warning",
      nextNodeId: "large-volume-infusion-prohibited-stop",
      sourceReferences: [intravenousCalciumReference],
      title: "Renal infusion safety unresolved",
      type: "warning",
      warnings: [
        {
          message:
            "End-stage renal failure or dialysis could not be excluded. No large-volume calcium-infusion instruction has been generated.",
          severity: "critical",
          sourceReferences: [intravenousCalciumReference],
          warningId: "large-volume-infusion-renal-uncertain",
        },
      ],
    },
    {
      id: "large-volume-infusion-prohibited-stop",
      outcome: "requires-clinical-review",
      reason: "The source-defined renal safety condition prevents a large-volume infusion output.",
      sourceReferences: [intravenousCalciumReference],
      title: "Continuous infusion locked",
      type: "stop",
    },
    {
      id: "continuous-infusion-selection-stop",
      outcome: "requires-clinical-review",
      reason:
        "The source provides no automatic criteria for continuous infusion. No infusion instruction is generated without an explicit clinical decision.",
      sourceReferences: [intravenousCalciumReference],
      title: "Continuous infusion requires review",
      type: "stop",
    },
    {
      id: "severe-infusion-review-stop",
      outcome: "requires-clinical-review",
      reason:
        "The source-defined continuous infusion and titration output has been generated. Ongoing clinical review remains required.",
      sourceReferences: [intravenousCalciumReference],
      title: "Continuous infusion review",
      type: "stop",
    },
    {
      id: "severe-repeat-review-stop",
      outcome: "requires-clinical-review",
      reason:
        "The source-defined initial and repeat emergency doses have been generated. Further treatment requires the cause and guardrail review.",
      sourceReferences: [intravenousCalciumReference],
      title: "Emergency management review",
      type: "stop",
    },
    {
      id: "severe-response-review-stop",
      outcome: "requires-clinical-review",
      reason:
        "Symptoms are recorded as resolved after the initial source-defined treatment. Ongoing cause management requires clinical review.",
      sourceReferences: [intravenousCalciumReference],
      title: "Initial response endpoint",
      type: "stop",
    },
    {
      id: "response-uncertain-stop",
      outcome: "requires-clinical-review",
      reason:
        "Symptom response could not be assessed safely. No repeat-dose instruction has been generated.",
      sourceReferences: [intravenousCalciumReference],
      title: "Response requires review",
      type: "stop",
    },
    {
      id: "guardrails-incomplete-stop",
      outcome: "requires-clinical-review",
      reason:
        "Complete the cause and guardrail review before any source-derived treatment instruction is released.",
      sourceReferences: [emergencyReference, intravenousCalciumReference, mildManagementReference],
      title: "Treatment locked pending safeguards",
      type: "stop",
    },
    {
      id: "unsupported-management-stop",
      outcome: "unsupported",
      reason:
        "The completed assessment does not match a management branch implemented in this subtask. No treatment instruction has been generated.",
      sourceReferences: [emergencyReference, mildManagementReference],
      title: "No supported management branch",
      type: "stop",
    },
  ],
  pathwayId: "hypocalcaemia-management-branches",
  reviewMetadata: {
    approvedBy: null,
    approvedOn: null,
    notes: [
      "Management content is transcribed from page 2 of the supplied Trust pathway.",
      "The mild branch applies only to an asymptomatic adjusted calcium result above 1.9 and at or below 2.1 mmol/L, with renal failure excluded.",
      "The severe emergency branch applies only below 1.9 mmol/L when at least one source-listed symptom is confirmed.",
      "The printed mismatch at exactly 1.9 mmol/L is preserved as an unsupported management state.",
      "Cause and guardrail clearance is required before any management instruction is released.",
      "Continuous infusion requires an explicit clinical decision and is blocked for end-stage renal failure, dialysis, or unresolved renal context.",
    ],
    reviewedBy: null,
    reviewedOn: null,
    status: "awaiting-clinical-review",
  },
  sourceIds: [HYPOCALCAEMIA_SOURCE_ID],
  status: "awaiting-clinical-review",
  version: "0.3.0",
};

const managementEngine = createPathwayEngine(pathwayDefinitionInput);

export const hypocalcaemiaManagementPathwayDefinition = managementEngine.definition;

export function determineHypocalcaemiaManagementBranch(
  assessmentInputs: HypocalcaemiaAssessmentInputs,
): HypocalcaemiaManagementBranchResult {
  const assessment = evaluateHypocalcaemiaAssessment(assessmentInputs);

  if (assessment.currentNode?.id !== "assessment-review-stop") {
    return {
      branch: "unsupported",
      reason: "Complete every required assessment input before selecting a management branch.",
    };
  }

  const severity =
    assessmentInputs.adjustedCalcium === undefined
      ? null
      : evaluateHypocalcaemiaSeverity(assessmentInputs.adjustedCalcium);

  if (!severity || severity.kind !== "classified") {
    return {
      branch: "unsupported",
      reason: "The adjusted calcium does not have a source-defined management classification.",
    };
  }

  const symptoms = assessmentInputs.symptoms ?? [];
  const listedSymptoms = symptoms.filter((symptom) => symptom !== "none" && symptom !== "unable");

  if (
    symptoms.length === 0 ||
    symptoms.includes("unable") ||
    (symptoms.includes("none") && listedSymptoms.length > 0)
  ) {
    return {
      branch: "unsupported",
      reason:
        "A definite symptom state is required before the source-defined management branch can be selected.",
    };
  }

  if (severity.band.severity === "moderate-severe") {
    return listedSymptoms.length > 0
      ? {
          branch: "severe-symptomatic",
          reason:
            "Adjusted calcium is below 1.9 mmol/L and at least one source-listed symptom is confirmed.",
        }
      : {
          branch: "unsupported",
          reason:
            "The supplied emergency branch is defined for severe symptomatic hypocalcaemia. No asymptomatic treatment branch is inferred below 1.9 mmol/L.",
        };
  }

  if (assessmentInputs.adjustedCalcium === 1.9) {
    return {
      branch: "unsupported",
      reason:
        "The severity table includes 1.9 mmol/L in the mild band, while the printed mild management heading requires a result above 1.9 mmol/L. No treatment is inferred at this exact boundary.",
    };
  }

  if (listedSymptoms.length > 0) {
    return {
      branch: "unsupported",
      reason:
        "The supplied mild management branch is explicitly asymptomatic. No mild symptomatic treatment branch is inferred.",
    };
  }

  if (assessmentInputs.renalFunction !== "no-renal-failure") {
    return {
      branch: "unsupported",
      reason:
        "The supplied mild management guidance does not apply to renal failure. Renal failure must be explicitly excluded before this branch is used.",
    };
  }

  return {
    branch: "mild-asymptomatic",
    reason:
      "Adjusted calcium is above 1.9 and at or below 2.1 mmol/L, no listed symptom is confirmed, and renal failure is excluded.",
  };
}

export function evaluateHypocalcaemiaManagement(
  assessmentInputs: HypocalcaemiaAssessmentInputs,
  managementInputs: HypocalcaemiaManagementInputs = {},
  guardrailsCleared = false,
): PathwayEvaluationSnapshot {
  const branch = determineHypocalcaemiaManagementBranch(assessmentInputs);
  const effectiveBranch =
    branch.branch === "unsupported"
      ? "unsupported"
      : guardrailsCleared
        ? branch.branch
        : "guardrails-not-cleared";
  const engineInputs: Record<string, PathwayInputDatum> = {
    managementBranch: { kind: "single-choice", value: effectiveBranch },
  };

  addSingleChoice(engineInputs, "continuousInfusionNeed", managementInputs.continuousInfusionNeed);
  addSingleChoice(engineInputs, "infusionRenalContext", managementInputs.infusionRenalContext);
  addSingleChoice(engineInputs, "oralCalciumSelection", managementInputs.oralCalciumSelection);
  addSingleChoice(
    engineInputs,
    "persistentMildBeyond72Hours",
    managementInputs.persistentMildBeyond72Hours,
  );
  addSingleChoice(engineInputs, "postThyroidectomy", managementInputs.postThyroidectomy);
  addSingleChoice(engineInputs, "symptomResponse", managementInputs.symptomResponse);

  const postoperativeContext: PostoperativeContext =
    assessmentInputs.surgery === "recent-surgery"
      ? "confirmed"
      : assessmentInputs.surgery === "no-recent-surgery"
        ? "not-confirmed"
        : "unable";
  addSingleChoice(engineInputs, "postoperativeContext", postoperativeContext);

  if (managementInputs.followUpAdjustedCalcium !== undefined) {
    engineInputs[FOLLOW_UP_CALCIUM_INPUT_KEY] = {
      kind: "numeric",
      unit: ADJUSTED_CALCIUM_UNIT,
      value: managementInputs.followUpAdjustedCalcium,
    };
  }

  return managementEngine.evaluate({ inputs: engineInputs });
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
