import {
  createPathwayEngine,
  type PathwayEvaluationSnapshot,
  type PathwayInputDatum,
} from "../../engine/index.ts";
import { pathwayNodeSchema, type PathwayDefinition, type PathwayNode } from "../schema.ts";
import {
  CEREBRAL_OEDEMA_SIGNS_INPUT_KEY,
  FLUID_STATUS_INPUT_KEY,
  hyponatraemiaInitialAssessmentPathwayDefinition,
  type CerebralOedemaSign,
  type HyponatraemiaFluidStatus,
} from "./fluid-status.ts";
import {
  HYPONATRAEMIA_SEVERITY_BANDS,
  HYPONATRAEMIA_SOURCE_ID,
  SODIUM_INPUT_KEY,
  SODIUM_UNIT,
} from "./severity.ts";

export const ODS_RISK_INPUT_KEY = "odsRiskStatus";
export const SYMPTOM_RESPONSE_INPUT_KEY = "symptomResponse";
export const FOUR_HOUR_SODIUM_CHANGE_INPUT_KEY = "fourHourSodiumChange";

export type OdsRiskStatus = "high-risk-confirmed" | "high-risk-not-confirmed" | "unable-to-assess";

export type HyponatraemiaSymptomResponse = "improved" | "not-improved" | "unable-to-assess";

export const HYPONATRAEMIA_CORRECTION_TARGET = Object.freeze({
  increase: "4-6 mmol/L",
  period: "first 2-4 hours",
});

export const HYPONATRAEMIA_CORRECTION_LIMIT = Object.freeze({
  maximumIncrease: "10 mmol/L",
  period: "24 hours",
});

export const ODS_RISK_OPTIONS = Object.freeze([
  {
    description: "High risk of osmotic demyelination syndrome is clinically confirmed.",
    label: "High risk confirmed",
    value: "high-risk-confirmed",
  },
  {
    description: "High risk has been assessed and is not confirmed.",
    label: "High risk not confirmed",
    value: "high-risk-not-confirmed",
  },
  {
    description: "Available information is insufficient to determine ODS risk.",
    label: "Unable to assess safely",
    value: "unable-to-assess",
  },
] satisfies readonly { description: string; label: string; value: OdsRiskStatus }[]);

export const HYPONATRAEMIA_SYMPTOM_RESPONSE_OPTIONS = Object.freeze([
  {
    description: "The source-listed symptoms have improved after initial treatment.",
    label: "Symptoms improved",
    value: "improved",
  },
  {
    description: "The source-listed symptoms have not improved.",
    label: "No symptomatic improvement",
    value: "not-improved",
  },
  {
    description: "Symptomatic response cannot be established confidently.",
    label: "Unable to assess response",
    value: "unable-to-assess",
  },
] satisfies readonly {
  description: string;
  label: string;
  value: HyponatraemiaSymptomResponse;
}[]);

const investigationsReference = {
  page: 1,
  section: "Take blood samples prior to starting treatment (if possible)",
  sourceId: HYPONATRAEMIA_SOURCE_ID,
};
const emergencyTreatmentReference = {
  page: 1,
  section: "Cerebral oedema present: Yes - emergency management",
  sourceId: HYPONATRAEMIA_SOURCE_ID,
};
const responseReference = {
  page: 1,
  section: "Four-hour sodium increase and symptomatic-improvement branches",
  sourceId: HYPONATRAEMIA_SOURCE_ID,
};
const monitoringReference = {
  page: 1,
  section: "Severe symptomatic hyponatraemia at high risk of ODS monitoring",
  sourceId: HYPONATRAEMIA_SOURCE_ID,
};

type NumericBranch = Extract<PathwayNode, { type: "numeric-branch" }>;

const monitoringGateBranches: NumericBranch["branches"] = HYPONATRAEMIA_SEVERITY_BANDS.map(
  (band) => ({
    branchId: `${band.branchId}-emergency-monitoring`,
    label: `${band.label} emergency monitoring route`,
    nextNodeId: band.severity === "severe" ? "ods-risk-question" : "symptom-response-question",
    range: { ...band.range },
  }),
);

const inheritedNodes = hyponatraemiaInitialAssessmentPathwayDefinition.nodes.map((node) =>
  pathwayNodeSchema.parse(node),
);

const emergencyNodes: PathwayNode[] = inheritedNodes.map((node) => {
  if (node.id !== "emergency-management-pending") {
    return node;
  }

  return {
    actions: [
      {
        actionId: "obtain-pre-treatment-investigations",
        instruction:
          "Before starting treatment, if possible, obtain urine osmolality and urinary sodium, random blood glucose, U&Es, TSH and cortisol.",
        sourceReferences: [investigationsReference],
        timing: "immediate",
      },
      {
        actionId: "administer-initial-hypertonic-saline",
        instruction:
          "For hypovolaemia and euvolaemia, use 150 mL of 2.7% hypertonic saline via a central or large peripheral vein.",
        sourceReferences: [emergencyTreatmentReference],
        timing: "immediate",
      },
    ],
    id: "emergency-management-pending",
    nextNodeId: "correction-target-information",
    sourceReferences: [investigationsReference, emergencyTreatmentReference],
    title: "Initial emergency management",
    type: "action-group",
  };
});

emergencyNodes.push(
  {
    body: "Goal: increase sodium by 4-6 mmol/L in the first 2-4 hours.",
    id: "correction-target-information",
    nextNodeId: "correction-limit-warning",
    sourceReferences: [emergencyTreatmentReference],
    title: "Initial correction target",
    type: "information",
  },
  {
    id: "correction-limit-warning",
    nextNodeId: "emergency-monitoring-gate",
    sourceReferences: [emergencyTreatmentReference],
    title: "Correction limit",
    type: "warning",
    warnings: [
      {
        message: "Avoid correction of more than 10 mmol/L in 24 hours.",
        severity: "critical",
        sourceReferences: [emergencyTreatmentReference],
        warningId: "avoid-excessive-correction",
      },
    ],
  },
  {
    branches: monitoringGateBranches,
    id: "emergency-monitoring-gate",
    inputKey: SODIUM_INPUT_KEY,
    noMatchBranch: {
      branchId: "emergency-monitoring-no-source-band",
      label: "No exact source severity band matched",
      nextNodeId: "emergency-monitoring-review-required",
    },
    sourceReferences: [monitoringReference],
    title: "Determine emergency monitoring route",
    type: "numeric-branch",
    unit: SODIUM_UNIT,
  },
  {
    id: "ods-risk-question",
    inputKey: ODS_RISK_INPUT_KEY,
    options: [
      {
        label: "High risk confirmed",
        nextNodeId: "high-risk-ods-monitoring",
        optionId: "high-risk-confirmed-option",
        value: "high-risk-confirmed",
      },
      {
        label: "High risk not confirmed",
        nextNodeId: "symptom-response-question",
        optionId: "high-risk-not-confirmed-option",
        value: "high-risk-not-confirmed",
      },
      {
        label: "Unable to assess safely",
        nextNodeId: "symptom-response-question",
        optionId: "unable-to-assess-ods-option",
        value: "unable-to-assess",
      },
    ],
    prompt: "Confirm whether high risk of osmotic demyelination syndrome is established.",
    sourceReferences: [monitoringReference],
    title: "ODS risk status",
    type: "single-choice-question",
  },
  {
    id: "high-risk-ods-monitoring",
    items: [
      {
        instruction: "Monitor sodium hourly until it has increased by 4-6 mmol/L.",
        monitoringId: "high-risk-ods-hourly-monitoring",
        sourceReferences: [monitoringReference],
      },
      {
        instruction: "Then monitor sodium every 4-6 hours using a blood gas machine.",
        monitoringId: "high-risk-ods-follow-up-monitoring",
        sourceReferences: [monitoringReference],
      },
    ],
    nextNodeId: "symptom-response-question",
    sourceReferences: [monitoringReference],
    title: "High-risk ODS monitoring",
    type: "monitoring",
  },
  {
    id: "symptom-response-question",
    inputKey: SYMPTOM_RESPONSE_INPUT_KEY,
    options: [
      {
        label: "Symptoms improved",
        nextNodeId: "manage-cause-with-consultant-review",
        optionId: "symptoms-improved-option",
        value: "improved",
      },
      {
        label: "No symptomatic improvement",
        nextNodeId: "four-hour-sodium-change-input",
        optionId: "symptoms-not-improved-option",
        value: "not-improved",
      },
      {
        label: "Unable to assess response",
        nextNodeId: "four-hour-sodium-change-input",
        optionId: "symptom-response-uncertain-option",
        value: "unable-to-assess",
      },
    ],
    prompt: "Confirm symptomatic response after initial treatment.",
    sourceReferences: [responseReference],
    title: "Symptomatic response",
    type: "single-choice-question",
  },
  {
    acceptedRange: {
      maximum: null,
      maximumInclusive: false,
      minimum: null,
      minimumInclusive: false,
    },
    id: "four-hour-sodium-change-input",
    inputKey: FOUR_HOUR_SODIUM_CHANGE_INPUT_KEY,
    nextNodeId: "four-hour-sodium-change-branch",
    precision: 1,
    prompt: "Enter the confirmed sodium change at 4 hours.",
    sourceReferences: [responseReference],
    title: "Four-hour sodium change",
    type: "numeric-input",
    unit: SODIUM_UNIT,
  },
  {
    branches: [
      {
        branchId: "increase-below-four",
        label: "Sodium increase below 4 mmol/L at 4 hours",
        nextNodeId: "repeat-hypertonic-saline",
        range: {
          maximum: 4,
          maximumInclusive: false,
          minimum: 0,
          minimumInclusive: true,
        },
      },
      {
        branchId: "increase-above-five",
        label: "Sodium increase above 5 mmol/L",
        nextNodeId: "manage-cause-with-consultant-review",
        range: {
          maximum: null,
          maximumInclusive: false,
          minimum: 5,
          minimumInclusive: false,
        },
      },
    ],
    id: "four-hour-sodium-change-branch",
    inputKey: FOUR_HOUR_SODIUM_CHANGE_INPUT_KEY,
    noMatchBranch: {
      branchId: "four-hour-change-not-explicit",
      label: "No explicit source response branch matched",
      nextNodeId: "four-hour-response-review-required",
    },
    sourceReferences: [responseReference],
    title: "Assess four-hour sodium response",
    type: "numeric-branch",
    unit: SODIUM_UNIT,
  },
  {
    actions: [
      {
        actionId: "repeat-hypertonic-saline-dose",
        instruction: "Repeat 150 mL of 2.7% hypertonic saline and obtain consultant review.",
        sourceReferences: [responseReference],
        timing: "immediate",
      },
    ],
    id: "repeat-hypertonic-saline",
    nextNodeId: "emergency-management-review-stop",
    sourceReferences: [responseReference],
    title: "Repeat hypertonic saline",
    type: "action-group",
  },
  {
    actions: [
      {
        actionId: "diagnose-manage-cause-consultant-review",
        instruction: "Diagnose and manage the cause with consultant review.",
        sourceReferences: [responseReference],
        timing: "next",
      },
    ],
    id: "manage-cause-with-consultant-review",
    nextNodeId: "emergency-management-review-stop",
    sourceReferences: [responseReference],
    title: "Manage the cause",
    type: "action-group",
  },
  {
    id: "emergency-management-review-stop",
    outcome: "requires-clinical-review",
    reason:
      "The source-defined emergency branch reached an explicit response endpoint. Clinical review remains required before project use.",
    sourceReferences: [responseReference],
    title: "Emergency branch review complete",
    type: "stop",
  },
  {
    id: "four-hour-response-review-required",
    outcome: "requires-clinical-review",
    reason:
      "The source does not state a response branch for this four-hour sodium change. No repeat-dose or cause-management branch has been selected.",
    sourceReferences: [responseReference],
    title: "Four-hour response requires review",
    type: "stop",
  },
  {
    id: "emergency-monitoring-review-required",
    outcome: "requires-clinical-review",
    reason:
      "No exact source severity band was available for emergency monitoring. No monitoring schedule has been generated.",
    sourceReferences: [monitoringReference],
    title: "Emergency monitoring requires review",
    type: "stop",
  },
);

const emergencyDefinitionInput: PathwayDefinition = {
  entryNodeId: hyponatraemiaInitialAssessmentPathwayDefinition.entryNodeId,
  name: "Hyponatraemia emergency management",
  nodes: emergencyNodes,
  pathwayId: "hyponatraemia-emergency-management",
  reviewMetadata: {
    approvedBy: null,
    approvedOn: null,
    notes: [
      "Emergency treatment, target, limit, response and monitoring wording is transcribed from page 1.",
      "The source leaves sodium changes from 4 through 5 mmol/L without an explicit response branch; these values stop for review.",
      "Unable-to-assess options are fail-closed application states and are not printed source branches.",
      "The pathway is Trust-source-derived and is not labelled as NICE management guidance.",
    ],
    reviewedBy: null,
    reviewedOn: null,
    status: "awaiting-clinical-review",
  },
  sourceIds: [HYPONATRAEMIA_SOURCE_ID],
  status: "awaiting-clinical-review",
  version: "0.3.0",
};

const emergencyEngine = createPathwayEngine(emergencyDefinitionInput);

export const hyponatraemiaEmergencyPathwayDefinition = emergencyEngine.definition;

export interface HyponatraemiaEmergencyEvaluationInput {
  cerebralOedemaSigns?: readonly CerebralOedemaSign[];
  fluidStatus?: HyponatraemiaFluidStatus;
  fourHourSodiumChange?: number;
  fourHourSodiumChangeUnit?: string;
  odsRiskStatus?: OdsRiskStatus;
  sodium: number;
  symptomResponse?: HyponatraemiaSymptomResponse;
  unit?: string;
}

export function evaluateHyponatraemiaEmergencyManagement(
  input: HyponatraemiaEmergencyEvaluationInput,
): PathwayEvaluationSnapshot {
  const inputs: Record<string, PathwayInputDatum> = {
    [SODIUM_INPUT_KEY]: {
      kind: "numeric",
      unit: input.unit ?? SODIUM_UNIT,
      value: input.sodium,
    },
  };

  if (input.fluidStatus !== undefined) {
    inputs[FLUID_STATUS_INPUT_KEY] = {
      kind: "single-choice",
      value: input.fluidStatus,
    };
  }

  if (input.cerebralOedemaSigns !== undefined) {
    inputs[CEREBRAL_OEDEMA_SIGNS_INPUT_KEY] = {
      kind: "multi-select",
      values: [...input.cerebralOedemaSigns],
    };
  }

  if (input.odsRiskStatus !== undefined) {
    inputs[ODS_RISK_INPUT_KEY] = {
      kind: "single-choice",
      value: input.odsRiskStatus,
    };
  }

  if (input.symptomResponse !== undefined) {
    inputs[SYMPTOM_RESPONSE_INPUT_KEY] = {
      kind: "single-choice",
      value: input.symptomResponse,
    };
  }

  if (input.fourHourSodiumChange !== undefined) {
    inputs[FOUR_HOUR_SODIUM_CHANGE_INPUT_KEY] = {
      kind: "numeric",
      unit: input.fourHourSodiumChangeUnit ?? SODIUM_UNIT,
      value: input.fourHourSodiumChange,
    };
  }

  return emergencyEngine.evaluate({ inputs });
}
