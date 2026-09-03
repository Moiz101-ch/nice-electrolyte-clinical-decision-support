import {
  createPathwayEngine,
  type PathwayEvaluationSnapshot,
  type PathwayInputDatum,
} from "../../engine/index.ts";
import { pathwayNodeSchema, type PathwayDefinition, type PathwayNode } from "../schema.ts";
import {
  ECG_CHANGES_INPUT_KEY,
  hyperkalaemiaEcgPathwayDefinition,
  type HyperkalaemiaEcgChange,
} from "./ecg.ts";
import {
  HYPERKALAEMIA_SOURCE_ID,
  HYPERKALAEMIA_UKKA_SOURCE_ID,
  POTASSIUM_INPUT_KEY,
  POTASSIUM_UNIT,
} from "./severity.ts";

export const DIGOXIN_TOXICITY_INPUT_KEY = "digoxinToxicityConcern";
export const PRETREATMENT_GLUCOSE_INPUT_KEY = "pretreatmentBloodGlucose";
export const PRETREATMENT_GLUCOSE_UNIT = "mmol/L";
export const SALBUTAMOL_CONTEXT_INPUT_KEY = "salbutamolContext";

export type DigoxinToxicityConcern = "confirmed" | "not-confirmed" | "unable-to-determine";
export type SalbutamolContext =
  "ischaemic-heart-disease" | "no-listed-caution" | "tachycardia" | "unable-to-determine";

export const DIGOXIN_TOXICITY_OPTIONS = Object.freeze([
  {
    description:
      "A concern about digoxin toxicity has been clinically identified; the source gives a slower administration consideration.",
    label: "Concern confirmed",
    value: "confirmed",
  },
  {
    description: "Digoxin-toxicity concern has been assessed and is not currently identified.",
    label: "Concern not confirmed",
    value: "not-confirmed",
  },
  {
    description:
      "Available information is insufficient to select a source-listed administration duration safely.",
    label: "Unable to determine",
    value: "unable-to-determine",
  },
] satisfies readonly {
  description: string;
  label: string;
  value: DigoxinToxicityConcern;
}[]);

export const SALBUTAMOL_CONTEXT_OPTIONS = Object.freeze([
  {
    description: "Tachycardia is clinically confirmed; the source says to avoid salbutamol.",
    label: "Tachycardia confirmed",
    value: "tachycardia",
  },
  {
    description:
      "Ischaemic heart disease is confirmed without tachycardia; the source gives a lower-dose consideration.",
    label: "Ischaemic heart disease",
    value: "ischaemic-heart-disease",
  },
  {
    description: "Neither source-listed caution has been clinically confirmed.",
    label: "No listed caution confirmed",
    value: "no-listed-caution",
  },
  {
    description: "The cautions cannot be established safely from the available information.",
    label: "Unable to determine",
    value: "unable-to-determine",
  },
] satisfies readonly {
  description: string;
  label: string;
  value: SalbutamolContext;
}[]);

const calciumReference = {
  page: 2,
  section: "First 15-30 minutes: intravenous calcium gluconate",
  sourceId: HYPERKALAEMIA_SOURCE_ID,
};
const intracellularShiftReference = {
  page: 2,
  section: "Within 30-60 minutes: insulin, glucose and nebulised salbutamol",
  sourceId: HYPERKALAEMIA_SOURCE_ID,
};
const zirconiumChartReference = {
  page: 1,
  section: "Sodium zirconium prescribing chart",
  sourceId: HYPERKALAEMIA_SOURCE_ID,
};
const zirconiumAlgorithmReference = {
  page: 2,
  section: "Sodium zirconium management algorithm",
  sourceId: HYPERKALAEMIA_SOURCE_ID,
};
const adjunctReference = {
  page: 2,
  section: "Consider adjunctive treatments and relevant escalation",
  sourceId: HYPERKALAEMIA_SOURCE_ID,
};
const monitoringReference = {
  page: 2,
  section: "Ongoing potassium and capillary blood glucose monitoring",
  sourceId: HYPERKALAEMIA_SOURCE_ID,
};
const causeReference = {
  page: 2,
  section: "Establish cause and prevent further rise or recurrence",
  sourceId: HYPERKALAEMIA_SOURCE_ID,
};

const inheritedNodes = hyperkalaemiaEcgPathwayDefinition.nodes.map((node) =>
  pathwayNodeSchema.parse(node),
);

const managementNodes: PathwayNode[] = inheritedNodes.map((node): PathwayNode => {
  switch (node.id) {
    case "mild-classification-review":
      return {
        id: "mild-classification-review",
        items: [
          {
            instruction: "Check potassium daily.",
            monitoringId: "mild-daily-potassium",
            sourceReferences: [monitoringReference],
          },
          {
            instruction: "Monitor capillary blood glucose.",
            monitoringId: "mild-capillary-glucose",
            sourceReferences: [monitoringReference],
          },
        ],
        nextNodeId: "cause-and-recurrence-actions",
        sourceReferences: [monitoringReference],
        title: "Mild Hyperkalaemia monitoring",
        type: "monitoring",
      };
    case "ecg-changes-confirmed-review":
      return {
        id: "ecg-changes-confirmed-review",
        inputKey: DIGOXIN_TOXICITY_INPUT_KEY,
        options: [
          {
            label: "Concern confirmed",
            nextNodeId: "calcium-digoxin-consideration",
            optionId: "digoxin-concern-confirmed-option",
            value: "confirmed",
          },
          {
            label: "Concern not confirmed",
            nextNodeId: "calcium-standard-administration",
            optionId: "digoxin-concern-not-confirmed-option",
            value: "not-confirmed",
          },
          {
            label: "Unable to determine",
            nextNodeId: "calcium-duration-review-warning",
            optionId: "digoxin-concern-uncertain-option",
            value: "unable-to-determine",
          },
        ],
        prompt: "Confirm whether there is concern about digoxin toxicity.",
        sourceReferences: [calciumReference],
        title: "Calcium administration context",
        type: "single-choice-question",
      };
    case "no-ecg-changes-review":
      return {
        branches: [
          {
            branchId: "moderate-without-listed-ecg-change",
            label: "Moderate Hyperkalaemia without a listed ECG change",
            nextNodeId: "moderate-management-selection-warning",
            range: {
              maximum: 6.4,
              maximumInclusive: true,
              minimum: 6,
              minimumInclusive: true,
            },
          },
          {
            branchId: "severe-without-listed-ecg-change",
            label: "Severe Hyperkalaemia without a listed ECG change",
            nextNodeId: "pretreatment-glucose-input",
            range: {
              maximum: null,
              maximumInclusive: false,
              minimum: 6.5,
              minimumInclusive: true,
            },
          },
        ],
        id: "no-ecg-changes-review",
        inputKey: POTASSIUM_INPUT_KEY,
        noMatchBranch: {
          branchId: "unexpected-no-ecg-severity",
          label: "Unexpected severity for the no-change branch",
          nextNodeId: "management-edge-case-stop",
        },
        sourceReferences: [intracellularShiftReference],
        title: "Select management after a no-change ECG",
        type: "numeric-branch",
        unit: POTASSIUM_UNIT,
      };
    case "ecg-assessment-uncertain-review":
      return {
        branches: [
          {
            branchId: "moderate-ecg-uncertain",
            label: "Moderate Hyperkalaemia with uncertain ECG assessment",
            nextNodeId: "uncertain-ecg-review-warning",
            range: {
              maximum: 6.4,
              maximumInclusive: true,
              minimum: 6,
              minimumInclusive: true,
            },
          },
          {
            branchId: "severe-below-seven-ecg-uncertain",
            label: "Severe Hyperkalaemia below 7.0 mmol/L with uncertain ECG assessment",
            nextNodeId: "uncertain-ecg-severe-warning",
            range: {
              maximum: 7,
              maximumInclusive: false,
              minimum: 6.5,
              minimumInclusive: true,
            },
          },
          {
            branchId: "seven-plus-ecg-uncertain",
            label: "Potassium at or above 7.0 mmol/L with uncertain ECG assessment",
            nextNodeId: "seven-plus-digoxin-context",
            range: {
              maximum: null,
              maximumInclusive: false,
              minimum: 7,
              minimumInclusive: true,
            },
          },
        ],
        id: "ecg-assessment-uncertain-review",
        inputKey: POTASSIUM_INPUT_KEY,
        noMatchBranch: {
          branchId: "unexpected-uncertain-ecg-severity",
          label: "Unexpected severity for the uncertain ECG branch",
          nextNodeId: "management-edge-case-stop",
        },
        sourceReferences: [calciumReference, intracellularShiftReference],
        title: "Apply the ECG uncertainty safeguard",
        type: "numeric-branch",
        unit: POTASSIUM_UNIT,
      };
    default:
      return node;
  }
});

managementNodes.push(
  {
    actions: [
      {
        actionId: "calcium-gluconate-standard",
        instruction:
          "Administer 30 mL of intravenous calcium gluconate 10% over 10 minutes via large-bore intravenous access.",
        sourceReferences: [calciumReference],
        timing: "immediate",
      },
      {
        actionId: "calcium-repeat-if-ecg-persists",
        instruction: "Consider a further dose if adverse ECG changes remain after 5 minutes.",
        sourceReferences: [calciumReference],
        timing: "next",
      },
    ],
    id: "calcium-standard-administration",
    nextNodeId: "pretreatment-glucose-input",
    sourceReferences: [calciumReference],
    title: "Protect the heart within 15-30 minutes",
    type: "action-group",
  },
  {
    actions: [
      {
        actionId: "calcium-gluconate-digoxin-consideration",
        instruction:
          "Consider administering 30 mL of intravenous calcium gluconate 10% over 30 minutes via large-bore intravenous access because digoxin-toxicity concern is confirmed.",
        sourceReferences: [calciumReference],
        timing: "immediate",
      },
      {
        actionId: "calcium-repeat-if-ecg-persists",
        instruction: "Consider a further dose if adverse ECG changes remain after 5 minutes.",
        sourceReferences: [calciumReference],
        timing: "next",
      },
    ],
    id: "calcium-digoxin-consideration",
    nextNodeId: "pretreatment-glucose-input",
    sourceReferences: [calciumReference],
    title: "Protect the heart with digoxin-toxicity consideration",
    type: "action-group",
  },
  {
    id: "calcium-duration-review-warning",
    nextNodeId: "pretreatment-glucose-input",
    sourceReferences: [calciumReference],
    title: "Calcium duration requires urgent review",
    type: "warning",
    warnings: [
      {
        message:
          "Calcium is indicated by this branch, but digoxin-toxicity concern could not be established. No administration duration has been selected; use the current approved emergency protocol and obtain urgent senior review.",
        severity: "critical",
        sourceReferences: [calciumReference],
        warningId: "calcium-duration-not-selected",
      },
    ],
  },
  {
    id: "seven-plus-digoxin-context",
    inputKey: DIGOXIN_TOXICITY_INPUT_KEY,
    options: [
      {
        label: "Concern confirmed",
        nextNodeId: "calcium-digoxin-consideration",
        optionId: "seven-plus-digoxin-confirmed-option",
        value: "confirmed",
      },
      {
        label: "Concern not confirmed",
        nextNodeId: "calcium-standard-administration",
        optionId: "seven-plus-digoxin-not-confirmed-option",
        value: "not-confirmed",
      },
      {
        label: "Unable to determine",
        nextNodeId: "calcium-duration-review-warning",
        optionId: "seven-plus-digoxin-uncertain-option",
        value: "unable-to-determine",
      },
    ],
    prompt:
      "Potassium at or above 7.0 mmol/L requires calcium without waiting for ECG; confirm the digoxin-toxicity context.",
    sourceReferences: [calciumReference],
    title: "Urgent calcium administration context",
    type: "single-choice-question",
  },
  {
    id: "moderate-management-selection-warning",
    nextNodeId: "moderate-conservative-monitoring",
    sourceReferences: [intracellularShiftReference],
    title: "Moderate management requires clinical selection",
    type: "warning",
    warnings: [
      {
        message:
          "For moderate Hyperkalaemia without a listed ECG change, the source says management depends on clinical condition, ECG and rate of rise but provides no deterministic selection criteria. No acute drug instruction has been generated.",
        severity: "caution",
        sourceReferences: [intracellularShiftReference],
        warningId: "moderate-treatment-selection-unresolved",
      },
    ],
  },
  {
    id: "uncertain-ecg-review-warning",
    nextNodeId: "moderate-conservative-monitoring",
    sourceReferences: [calciumReference],
    title: "Moderate ECG assessment requires review",
    type: "warning",
    warnings: [
      {
        message:
          "ECG findings could not be established for moderate Hyperkalaemia. No ECG-dependent or acute drug branch has been selected; obtain clinical review.",
        severity: "caution",
        sourceReferences: [calciumReference],
        warningId: "moderate-ecg-uncertain",
      },
    ],
  },
  {
    id: "uncertain-ecg-severe-warning",
    nextNodeId: "pretreatment-glucose-input",
    sourceReferences: [calciumReference, intracellularShiftReference],
    title: "Severe ECG assessment requires urgent review",
    type: "warning",
    warnings: [
      {
        message:
          "ECG findings could not be established. Severe-treatment actions continue, but no ECG-dependent calcium instruction has been selected; obtain urgent clinical review.",
        severity: "critical",
        sourceReferences: [calciumReference, intracellularShiftReference],
        warningId: "severe-ecg-uncertain",
      },
    ],
  },
  {
    acceptedRange: {
      maximum: null,
      maximumInclusive: false,
      minimum: 0,
      minimumInclusive: true,
    },
    id: "pretreatment-glucose-input",
    inputKey: PRETREATMENT_GLUCOSE_INPUT_KEY,
    nextNodeId: "pretreatment-glucose-branch",
    precision: 2,
    prompt: "Enter the confirmed capillary blood glucose before insulin/glucose treatment.",
    sourceReferences: [intracellularShiftReference],
    title: "Pre-treatment capillary blood glucose",
    type: "numeric-input",
    unit: PRETREATMENT_GLUCOSE_UNIT,
  },
  {
    branches: [
      {
        branchId: "pretreatment-glucose-below-seven",
        label: "Pre-treatment blood glucose below 7.0 mmol/L",
        nextNodeId: "insulin-glucose-low-baseline-actions",
        range: {
          maximum: 7,
          maximumInclusive: false,
          minimum: 0,
          minimumInclusive: true,
        },
      },
      {
        branchId: "pretreatment-glucose-seven-or-higher",
        label: "Pre-treatment blood glucose at or above 7.0 mmol/L",
        nextNodeId: "insulin-glucose-standard-actions",
        range: {
          maximum: null,
          maximumInclusive: false,
          minimum: 7,
          minimumInclusive: true,
        },
      },
    ],
    id: "pretreatment-glucose-branch",
    inputKey: PRETREATMENT_GLUCOSE_INPUT_KEY,
    noMatchBranch: {
      branchId: "unexpected-pretreatment-glucose",
      label: "Unexpected pre-treatment blood glucose",
      nextNodeId: "management-edge-case-stop",
    },
    sourceReferences: [intracellularShiftReference],
    title: "Apply the pre-treatment glucose threshold",
    type: "numeric-branch",
    unit: PRETREATMENT_GLUCOSE_UNIT,
  },
  {
    actions: [
      {
        actionId: "check-cbg-before-insulin",
        instruction: "Confirm capillary blood glucose before treatment.",
        sourceReferences: [intracellularShiftReference],
        timing: "immediate",
      },
      {
        actionId: "insulin-glucose-infusion",
        instruction:
          "Give 6 units of soluble insulin (Actrapid) in 50 mL of 50% glucose (25 grams) intravenously over 15 minutes.",
        sourceReferences: [intracellularShiftReference],
        timing: "next",
      },
      {
        actionId: "low-baseline-glucose-follow-on",
        instruction:
          "Because pre-treatment blood glucose is below 7.0 mmol/L, consider following with 250 mL of 10% glucose at 50 mL/hour for 5 hours to reduce hypoglycaemia risk.",
        sourceReferences: [intracellularShiftReference],
        timing: "next",
      },
    ],
    id: "insulin-glucose-low-baseline-actions",
    nextNodeId: "salbutamol-context-question",
    sourceReferences: [intracellularShiftReference],
    title: "Shift potassium within 30-60 minutes",
    type: "action-group",
  },
  {
    actions: [
      {
        actionId: "check-cbg-before-insulin",
        instruction: "Confirm capillary blood glucose before treatment.",
        sourceReferences: [intracellularShiftReference],
        timing: "immediate",
      },
      {
        actionId: "insulin-glucose-infusion",
        instruction:
          "Give 6 units of soluble insulin (Actrapid) in 50 mL of 50% glucose (25 grams) intravenously over 15 minutes.",
        sourceReferences: [intracellularShiftReference],
        timing: "next",
      },
    ],
    id: "insulin-glucose-standard-actions",
    nextNodeId: "salbutamol-context-question",
    sourceReferences: [intracellularShiftReference],
    title: "Shift potassium within 30-60 minutes",
    type: "action-group",
  },
  {
    id: "salbutamol-context-question",
    inputKey: SALBUTAMOL_CONTEXT_INPUT_KEY,
    options: [
      {
        label: "Tachycardia confirmed",
        nextNodeId: "salbutamol-tachycardia-warning",
        optionId: "salbutamol-tachycardia-option",
        value: "tachycardia",
      },
      {
        label: "Ischaemic heart disease",
        nextNodeId: "salbutamol-ihd-action",
        optionId: "salbutamol-ihd-option",
        value: "ischaemic-heart-disease",
      },
      {
        label: "No listed caution confirmed",
        nextNodeId: "salbutamol-standard-action",
        optionId: "salbutamol-no-caution-option",
        value: "no-listed-caution",
      },
      {
        label: "Unable to determine",
        nextNodeId: "salbutamol-context-review-warning",
        optionId: "salbutamol-uncertain-option",
        value: "unable-to-determine",
      },
    ],
    prompt: "Confirm whether either source-listed salbutamol caution applies.",
    sourceReferences: [intracellularShiftReference],
    title: "Salbutamol context",
    type: "single-choice-question",
  },
  {
    id: "salbutamol-tachycardia-warning",
    nextNodeId: "zirconium-conflict-warning",
    sourceReferences: [intracellularShiftReference],
    title: "Avoid salbutamol",
    type: "warning",
    warnings: [
      {
        message: "Avoid nebulised salbutamol because tachycardia is confirmed.",
        severity: "caution",
        sourceReferences: [intracellularShiftReference],
        warningId: "avoid-salbutamol-tachycardia",
      },
    ],
  },
  {
    actions: [
      {
        actionId: "salbutamol-ihd-consideration",
        instruction:
          "Consider 10 mg nebulised salbutamol because ischaemic heart disease is confirmed without tachycardia.",
        sourceReferences: [intracellularShiftReference],
        timing: "next",
      },
    ],
    id: "salbutamol-ihd-action",
    nextNodeId: "zirconium-conflict-warning",
    sourceReferences: [intracellularShiftReference],
    title: "Salbutamol consideration",
    type: "action-group",
  },
  {
    actions: [
      {
        actionId: "salbutamol-standard-consideration",
        instruction: "Consider 10-20 mg nebulised salbutamol.",
        sourceReferences: [intracellularShiftReference],
        timing: "next",
      },
    ],
    id: "salbutamol-standard-action",
    nextNodeId: "zirconium-conflict-warning",
    sourceReferences: [intracellularShiftReference],
    title: "Salbutamol consideration",
    type: "action-group",
  },
  {
    id: "salbutamol-context-review-warning",
    nextNodeId: "zirconium-conflict-warning",
    sourceReferences: [intracellularShiftReference],
    title: "Salbutamol context requires review",
    type: "warning",
    warnings: [
      {
        message:
          "Tachycardia and ischaemic-heart-disease status could not be established. No salbutamol instruction has been generated.",
        severity: "caution",
        sourceReferences: [intracellularShiftReference],
        warningId: "salbutamol-context-uncertain",
      },
    ],
  },
  {
    id: "zirconium-conflict-warning",
    nextNodeId: "active-treatment-escalation",
    sourceReferences: [zirconiumChartReference, zirconiumAlgorithmReference],
    title: "Sodium zirconium criteria require resolution",
    type: "warning",
    warnings: [
      {
        message:
          "The supplied protocol uses different sodium-zirconium initiation wording in its prescribing chart and management algorithm. No automated sodium-zirconium instruction is generated until clinical review resolves the conflict.",
        severity: "caution",
        sourceReferences: [zirconiumChartReference, zirconiumAlgorithmReference],
        warningId: "sodium-zirconium-source-conflict",
      },
    ],
  },
  {
    id: "active-treatment-escalation",
    items: [
      {
        escalationId: "unstable-or-multi-organ-failure-escalation",
        instruction:
          "If haemodynamically unstable or affected by multi-organ failure, discuss with a senior clinician and escalate to outreach as appropriate.",
        sourceReferences: [adjunctReference],
        urgency: "immediate",
      },
      {
        escalationId: "dialysis-transplant-renal-discussion",
        instruction: "Discuss dialysis or transplant patients with the renal team.",
        sourceReferences: [adjunctReference],
        urgency: "urgent",
      },
      {
        escalationId: "refractory-or-renal-impairment-discussion",
        instruction:
          "For refractory Hyperkalaemia, unclear cause or severe renal impairment, speak to the renal team.",
        sourceReferences: [adjunctReference],
        urgency: "urgent",
      },
    ],
    nextNodeId: "conditional-adjunct-actions",
    sourceReferences: [adjunctReference],
    title: "Relevant escalation",
    type: "escalation",
  },
  {
    actions: [
      {
        actionId: "sodium-bicarbonate-conditional",
        instruction:
          "If volume depleted and acidotic, seek senior help and consider 1.26% sodium bicarbonate; do not use the same cannula as calcium.",
        sourceReferences: [adjunctReference],
        timing: "next",
      },
      {
        actionId: "furosemide-conditional",
        instruction: "If fluid overloaded and not anuric, consider a furosemide bolus.",
        sourceReferences: [adjunctReference],
        timing: "next",
      },
      {
        actionId: "dialysis-conditional",
        instruction:
          "Contact the renal team about dialysis if there is no urine output, severe renal failure or refractory Hyperkalaemia.",
        sourceReferences: [adjunctReference],
        timing: "next",
      },
    ],
    id: "conditional-adjunct-actions",
    nextNodeId: "active-treatment-monitoring-branch",
    sourceReferences: [adjunctReference],
    title: "Conditional adjunctive treatments",
    type: "action-group",
  },
  {
    branches: [
      {
        branchId: "moderate-active-treatment-monitoring",
        label: "Moderate Hyperkalaemia treatment monitoring",
        nextNodeId: "moderate-treatment-monitoring",
        range: {
          maximum: 6.4,
          maximumInclusive: true,
          minimum: 6,
          minimumInclusive: true,
        },
      },
      {
        branchId: "severe-active-treatment-monitoring",
        label: "Severe Hyperkalaemia treatment monitoring",
        nextNodeId: "severe-treatment-monitoring",
        range: {
          maximum: null,
          maximumInclusive: false,
          minimum: 6.5,
          minimumInclusive: true,
        },
      },
    ],
    id: "active-treatment-monitoring-branch",
    inputKey: POTASSIUM_INPUT_KEY,
    noMatchBranch: {
      branchId: "unexpected-treatment-monitoring-severity",
      label: "Unexpected severity for treatment monitoring",
      nextNodeId: "management-edge-case-stop",
    },
    sourceReferences: [monitoringReference],
    title: "Select treatment monitoring",
    type: "numeric-branch",
    unit: POTASSIUM_UNIT,
  },
  {
    id: "moderate-conservative-monitoring",
    items: [
      {
        instruction: "Consider checking potassium at 1-2 hours, 4-6 hours and again at 24 hours.",
        monitoringId: "moderate-potassium-monitoring",
        sourceReferences: [monitoringReference],
      },
      {
        instruction: "Monitor capillary blood glucose.",
        monitoringId: "moderate-capillary-glucose",
        sourceReferences: [monitoringReference],
      },
    ],
    nextNodeId: "cause-and-recurrence-actions",
    sourceReferences: [monitoringReference],
    title: "Moderate Hyperkalaemia monitoring",
    type: "monitoring",
  },
  {
    id: "moderate-treatment-monitoring",
    items: [
      {
        instruction: "Consider checking potassium at 1-2 hours, 4-6 hours and again at 24 hours.",
        monitoringId: "moderate-treatment-potassium-monitoring",
        sourceReferences: [monitoringReference],
      },
      {
        instruction:
          "After insulin/glucose, check capillary blood glucose at baseline, 30, 60, 90 and 120 minutes, then hourly for 4 more hours.",
        monitoringId: "moderate-insulin-glucose-monitoring",
        sourceReferences: [monitoringReference],
      },
    ],
    nextNodeId: "cause-and-recurrence-actions",
    sourceReferences: [monitoringReference],
    title: "Moderate treatment monitoring",
    type: "monitoring",
  },
  {
    id: "severe-treatment-monitoring",
    items: [
      {
        instruction: "Check potassium at 1, 2, 4 and 6 hours, then again at 24 hours.",
        monitoringId: "severe-potassium-monitoring",
        sourceReferences: [monitoringReference],
      },
      {
        instruction:
          "After insulin/glucose, check capillary blood glucose at baseline, 30, 60, 90 and 120 minutes, then hourly for 4 more hours.",
        monitoringId: "severe-insulin-glucose-monitoring",
        sourceReferences: [monitoringReference],
      },
    ],
    nextNodeId: "cause-and-recurrence-actions",
    sourceReferences: [monitoringReference],
    title: "Severe treatment monitoring",
    type: "monitoring",
  },
  {
    actions: [
      {
        actionId: "consider-underlying-hyperkalaemia-causes",
        instruction:
          "Consider underlying causes, including AKI, CKD, constipation, tissue trauma, blood transfusion and metabolic acidosis.",
        sourceReferences: [causeReference],
        timing: "next",
      },
      {
        actionId: "review-medication-and-diet",
        instruction: "Review medicines and diet to prevent a further rise or recurrence.",
        sourceReferences: [causeReference],
        timing: "next",
      },
    ],
    id: "cause-and-recurrence-actions",
    nextNodeId: "timed-management-review-stop",
    sourceReferences: [causeReference],
    title: "Cause and recurrence prevention",
    type: "action-group",
  },
  {
    id: "timed-management-review-stop",
    outcome: "requires-clinical-review",
    reason:
      "The source-defined management, monitoring and prevention endpoint has been reached. The pathway remains unavailable for clinical use until formal clinical review is complete.",
    sourceReferences: [monitoringReference, causeReference],
    title: "Timed management review complete",
    type: "stop",
  },
  {
    id: "management-edge-case-stop",
    outcome: "requires-clinical-review",
    reason:
      "The connected inputs reached an unexpected management combination. No further treatment instruction has been generated.",
    sourceReferences: [intracellularShiftReference],
    title: "Management combination requires review",
    type: "stop",
  },
);

const managementDefinitionInput: PathwayDefinition = {
  entryNodeId: hyperkalaemiaEcgPathwayDefinition.entryNodeId,
  name: "Hyperkalaemia connected timed management",
  nodes: managementNodes,
  pathwayId: "hyperkalaemia-timed-management",
  reviewMetadata: {
    approvedBy: null,
    approvedOn: null,
    notes: [
      "The first 15-30 minute, 30-60 minute, monitoring, adjunct and recurrence-prevention instructions are transcribed from the supplied Trust protocol.",
      "The registered UK Kidney Association guideline supports the detailed pseudohyperkalaemia exclusion and blood-gas guidance; these additions await project clinical review.",
      "Active drug treatment is generated for severe Hyperkalaemia or when a source-listed ECG change is confirmed; moderate Hyperkalaemia without a listed ECG change stops short of acute drug selection because the source provides no deterministic criteria based on clinical condition or rate of rise.",
      "The sodium-zirconium prescribing chart and management algorithm use different initiation wording, so no automated sodium-zirconium instruction is generated.",
      "Unable-to-determine states do not infer absent cautions or select an unsupported dose or administration duration.",
      "The source review is due in November 2026.",
    ],
    reviewedBy: null,
    reviewedOn: null,
    status: "awaiting-clinical-review",
  },
  sourceIds: [HYPERKALAEMIA_SOURCE_ID, HYPERKALAEMIA_UKKA_SOURCE_ID],
  status: "awaiting-clinical-review",
  version: "0.3.0",
};

const managementEngine = createPathwayEngine(managementDefinitionInput);

export const hyperkalaemiaTimedManagementPathwayDefinition = managementEngine.definition;

export interface HyperkalaemiaTimedManagementInput {
  digoxinToxicityConcern?: DigoxinToxicityConcern;
  ecgChanges?: readonly HyperkalaemiaEcgChange[];
  potassium: number;
  pretreatmentBloodGlucose?: number;
  pretreatmentBloodGlucoseUnit?: string;
  salbutamolContext?: SalbutamolContext;
  unit?: string;
}

export function evaluateHyperkalaemiaTimedManagement(
  input: HyperkalaemiaTimedManagementInput,
): PathwayEvaluationSnapshot {
  const inputs: Record<string, PathwayInputDatum> = {
    [POTASSIUM_INPUT_KEY]: {
      kind: "numeric",
      unit: input.unit ?? POTASSIUM_UNIT,
      value: input.potassium,
    },
  };

  if (input.ecgChanges !== undefined) {
    inputs[ECG_CHANGES_INPUT_KEY] = {
      kind: "multi-select",
      values: [...input.ecgChanges],
    };
  }

  if (input.digoxinToxicityConcern !== undefined) {
    inputs[DIGOXIN_TOXICITY_INPUT_KEY] = {
      kind: "single-choice",
      value: input.digoxinToxicityConcern,
    };
  }

  if (input.pretreatmentBloodGlucose !== undefined) {
    inputs[PRETREATMENT_GLUCOSE_INPUT_KEY] = {
      kind: "numeric",
      unit: input.pretreatmentBloodGlucoseUnit ?? PRETREATMENT_GLUCOSE_UNIT,
      value: input.pretreatmentBloodGlucose,
    };
  }

  if (input.salbutamolContext !== undefined) {
    inputs[SALBUTAMOL_CONTEXT_INPUT_KEY] = {
      kind: "single-choice",
      value: input.salbutamolContext,
    };
  }

  return managementEngine.evaluate({ inputs });
}
