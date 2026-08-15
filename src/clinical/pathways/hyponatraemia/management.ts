import {
  createPathwayEngine,
  type PathwayEvaluationSnapshot,
  type PathwayInputDatum,
} from "../../engine/index.ts";
import { pathwayNodeSchema, type PathwayDefinition, type PathwayNode } from "../schema.ts";
import {
  FOUR_HOUR_SODIUM_CHANGE_INPUT_KEY,
  ODS_RISK_INPUT_KEY,
  SYMPTOM_RESPONSE_INPUT_KEY,
  hyponatraemiaEmergencyPathwayDefinition,
  type HyponatraemiaEmergencyEvaluationInput,
} from "./emergency-management.ts";
import { CEREBRAL_OEDEMA_SIGNS_INPUT_KEY, FLUID_STATUS_INPUT_KEY } from "./fluid-status.ts";
import { HYPONATRAEMIA_SOURCE_ID, SODIUM_INPUT_KEY, SODIUM_UNIT } from "./severity.ts";

export const EUVOLAEMIC_UNDERLYING_CAUSE_INPUT_KEY = "euvolaemicUnderlyingCause";

export type EuvolaemicUnderlyingCause =
  | "other-or-unresolved"
  | "siadh-established"
  | "unable-to-establish"
  | "water-intoxication-established";

export const EUVOLAEMIC_UNDERLYING_CAUSE_OPTIONS = Object.freeze([
  {
    description:
      "Select only when SIADH has been clinically established independently of this classification.",
    label: "SIADH already established",
    value: "siadh-established",
  },
  {
    description: "Select only when water intoxication has been clinically established.",
    label: "Water intoxication established",
    value: "water-intoxication-established",
  },
  {
    description: "Neither source-listed euvolaemic cause is currently confirmed.",
    label: "Other or unresolved cause",
    value: "other-or-unresolved",
  },
  {
    description: "Available information is insufficient to establish the underlying cause safely.",
    label: "Unable to establish safely",
    value: "unable-to-establish",
  },
] satisfies readonly {
  description: string;
  label: string;
  value: EuvolaemicUnderlyingCause;
}[]);

const hypovolaemicReference = {
  page: 1,
  section: "Hypovolaemia: cause review and 0.9% sodium chloride",
  sourceId: HYPONATRAEMIA_SOURCE_ID,
};
const euvolaemicReference = {
  page: 1,
  section: "Euvolaemia: underlying cause, SIADH and water intoxication",
  sourceId: HYPONATRAEMIA_SOURCE_ID,
};
const hypervolaemicReference = {
  page: 1,
  section: "Hypervolaemia: senior referral, urine dip and underlying cause",
  sourceId: HYPONATRAEMIA_SOURCE_ID,
};
const emergencyAddOnReference = {
  page: 1,
  section: "Post-emergency cause management: add on if hypovolaemic",
  sourceId: HYPONATRAEMIA_SOURCE_ID,
};

const inheritedNodes = hyponatraemiaEmergencyPathwayDefinition.nodes.map((node) =>
  pathwayNodeSchema.parse(node),
);

const managementNodes: PathwayNode[] = inheritedNodes.map((node): PathwayNode => {
  switch (node.id) {
    case "hypovolaemic-causes-pending":
      return {
        actions: [
          {
            actionId: "review-hypovolaemic-causes",
            instruction:
              "Review factors of cause and past medical history, including burns, gastrointestinal losses (diarrhoea, vomiting or dehydration) and renal causes.",
            sourceReferences: [hypovolaemicReference],
            timing: "next",
          },
          {
            actionId: "use-hypovolaemic-isotonic-saline",
            instruction: "Use 1000 mL of 0.9% sodium chloride over 6 to 8 hours.",
            sourceReferences: [hypovolaemicReference],
            timing: "next",
          },
        ],
        id: "hypovolaemic-causes-pending",
        nextNodeId: "hypovolaemic-management-review-stop",
        sourceReferences: [hypovolaemicReference],
        title: "Hypovolaemic cause management",
        type: "action-group",
      };
    case "euvolaemic-causes-pending":
      return {
        id: "euvolaemic-causes-pending",
        inputKey: EUVOLAEMIC_UNDERLYING_CAUSE_INPUT_KEY,
        options: [
          {
            label: "SIADH already established",
            nextNodeId: "siadh-separate-pathway-action",
            optionId: "siadh-established-option",
            value: "siadh-established",
          },
          {
            label: "Water intoxication established",
            nextNodeId: "water-intoxication-management-action",
            optionId: "water-intoxication-established-option",
            value: "water-intoxication-established",
          },
          {
            label: "Other or unresolved cause",
            nextNodeId: "euvolaemic-cause-review-stop",
            optionId: "other-or-unresolved-option",
            value: "other-or-unresolved",
          },
          {
            label: "Unable to establish safely",
            nextNodeId: "euvolaemic-cause-review-stop",
            optionId: "unable-to-establish-cause-option",
            value: "unable-to-establish",
          },
        ],
        prompt: "Confirm whether a source-listed euvolaemic underlying cause is established.",
        sourceReferences: [euvolaemicReference],
        title: "Euvolaemic underlying cause",
        type: "single-choice-question",
      };
    case "hypervolaemic-management-pending":
      return {
        actions: [
          {
            actionId: "refer-senior-hypervolaemic-cause",
            instruction:
              "Refer to a senior clinician, obtain a urine dip and treat the underlying cause, including liver failure or nephrotic syndrome where applicable.",
            sourceReferences: [hypervolaemicReference],
            timing: "next",
          },
        ],
        id: "hypervolaemic-management-pending",
        nextNodeId: "hypervolaemic-management-review-stop",
        sourceReferences: [hypervolaemicReference],
        title: "Hypervolaemic endpoint",
        type: "action-group",
      };
    case "manage-cause-with-consultant-review":
      if (node.type !== "action-group") return node;
      return { ...node, nextNodeId: "post-emergency-fluid-status-check" };
    default:
      return node;
  }
});

managementNodes.push(
  {
    id: "hypovolaemic-management-review-stop",
    outcome: "requires-clinical-review",
    reason:
      "The source-defined hypovolaemic management endpoint has been reached and remains awaiting clinical review.",
    sourceReferences: [hypovolaemicReference],
    title: "Hypovolaemic management review",
    type: "stop",
  },
  {
    actions: [
      {
        actionId: "use-separate-siadh-pathway",
        instruction: "Use the separate SIADH pathway and obtain consultant review.",
        sourceReferences: [euvolaemicReference],
        timing: "next",
      },
    ],
    id: "siadh-separate-pathway-action",
    nextNodeId: "siadh-source-missing-warning",
    sourceReferences: [euvolaemicReference],
    title: "Separate SIADH pathway required",
    type: "action-group",
  },
  {
    id: "siadh-source-missing-warning",
    nextNodeId: "euvolaemic-management-review-stop",
    sourceReferences: [euvolaemicReference],
    title: "Dedicated SIADH source not supplied",
    type: "warning",
    warnings: [
      {
        message:
          "No dedicated SIADH source was supplied, so this pathway does not generate SIADH treatment instructions.",
        severity: "caution",
        sourceReferences: [euvolaemicReference],
        warningId: "siadh-source-not-supplied",
      },
    ],
  },
  {
    actions: [
      {
        actionId: "fluid-restriction-water-intoxication",
        instruction: "Use fluid restriction and obtain consultant review.",
        sourceReferences: [euvolaemicReference],
        timing: "next",
      },
    ],
    id: "water-intoxication-management-action",
    nextNodeId: "euvolaemic-management-review-stop",
    sourceReferences: [euvolaemicReference],
    title: "Water-intoxication management",
    type: "action-group",
  },
  {
    id: "euvolaemic-cause-review-stop",
    outcome: "requires-clinical-review",
    reason:
      "No source-listed euvolaemic cause was established. No cause-specific management action has been selected.",
    sourceReferences: [euvolaemicReference],
    title: "Euvolaemic cause requires review",
    type: "stop",
  },
  {
    id: "euvolaemic-management-review-stop",
    outcome: "requires-clinical-review",
    reason:
      "The source-defined euvolaemic endpoint has been reached and remains awaiting clinical review.",
    sourceReferences: [euvolaemicReference],
    title: "Euvolaemic management review",
    type: "stop",
  },
  {
    id: "hypervolaemic-management-review-stop",
    outcome: "requires-clinical-review",
    reason:
      "The source-defined hypervolaemic endpoint has been reached and remains awaiting clinical review.",
    sourceReferences: [hypervolaemicReference],
    title: "Hypervolaemic management review",
    type: "stop",
  },
  {
    id: "post-emergency-fluid-status-check",
    inputKey: FLUID_STATUS_INPUT_KEY,
    options: [
      {
        label: "Hypovolaemic",
        nextNodeId: "post-emergency-hypovolaemic-add-on",
        optionId: "post-emergency-hypovolaemic-option",
        value: "hypovolaemic",
      },
      {
        label: "Euvolaemic",
        nextNodeId: "emergency-management-review-stop",
        optionId: "post-emergency-euvolaemic-option",
        value: "euvolaemic",
      },
      {
        label: "Hypervolaemic",
        nextNodeId: "post-emergency-fluid-status-review-stop",
        optionId: "post-emergency-hypervolaemic-option",
        value: "hypervolaemic",
      },
      {
        label: "Unable to establish safely",
        nextNodeId: "post-emergency-fluid-status-review-stop",
        optionId: "post-emergency-fluid-status-uncertain-option",
        value: "unable-to-establish",
      },
    ],
    prompt: "Apply the source add-on for the established fluid status.",
    sourceReferences: [emergencyAddOnReference],
    title: "Post-emergency fluid-status add-on",
    type: "single-choice-question",
  },
  {
    actions: [
      {
        actionId: "add-hypovolaemic-isotonic-saline",
        instruction: "For hypovolaemia, add 1000 mL of 0.9% sodium chloride over 6 to 8 hours.",
        sourceReferences: [emergencyAddOnReference],
        timing: "next",
      },
    ],
    id: "post-emergency-hypovolaemic-add-on",
    nextNodeId: "emergency-management-review-stop",
    sourceReferences: [emergencyAddOnReference],
    title: "Hypovolaemic add-on",
    type: "action-group",
  },
  {
    id: "post-emergency-fluid-status-review-stop",
    outcome: "requires-clinical-review",
    reason:
      "The emergency branch reached a fluid-status combination not defined by the source add-on. No add-on action has been selected.",
    sourceReferences: [emergencyAddOnReference],
    title: "Post-emergency fluid status requires review",
    type: "stop",
  },
);

const managementDefinitionInput: PathwayDefinition = {
  entryNodeId: hyponatraemiaEmergencyPathwayDefinition.entryNodeId,
  name: "Hyponatraemia source-supported management",
  nodes: managementNodes,
  pathwayId: "hyponatraemia-source-supported-management",
  reviewMetadata: {
    approvedBy: null,
    approvedOn: null,
    notes: [
      "Non-emergency hypovolaemic, euvolaemic and hypervolaemic endpoints are transcribed from page 1.",
      "The hypovolaemic 0.9% sodium-chloride add-on is applied after the source cause-management endpoint only.",
      "SIADH treatment is not generated because the separately referenced pathway was not supplied.",
      "Other-or-unresolved and unable-to-establish options are fail-closed application states.",
    ],
    reviewedBy: null,
    reviewedOn: null,
    status: "awaiting-clinical-review",
  },
  sourceIds: [HYPONATRAEMIA_SOURCE_ID],
  status: "awaiting-clinical-review",
  version: "0.7.0",
};

const managementEngine = createPathwayEngine(managementDefinitionInput);

export const hyponatraemiaManagementPathwayDefinition = managementEngine.definition;

export interface HyponatraemiaManagementEvaluationInput extends HyponatraemiaEmergencyEvaluationInput {
  euvolaemicUnderlyingCause?: EuvolaemicUnderlyingCause;
}

export function evaluateHyponatraemiaManagement(
  input: HyponatraemiaManagementEvaluationInput,
): PathwayEvaluationSnapshot {
  const inputs: Record<string, PathwayInputDatum> = {
    [SODIUM_INPUT_KEY]: {
      kind: "numeric",
      unit: input.unit ?? SODIUM_UNIT,
      value: input.sodium,
    },
  };

  if (input.fluidStatus !== undefined) {
    inputs[FLUID_STATUS_INPUT_KEY] = { kind: "single-choice", value: input.fluidStatus };
  }

  if (input.cerebralOedemaSigns !== undefined) {
    inputs[CEREBRAL_OEDEMA_SIGNS_INPUT_KEY] = {
      kind: "multi-select",
      values: [...input.cerebralOedemaSigns],
    };
  }

  if (input.odsRiskStatus !== undefined) {
    inputs[ODS_RISK_INPUT_KEY] = { kind: "single-choice", value: input.odsRiskStatus };
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

  if (input.euvolaemicUnderlyingCause !== undefined) {
    inputs[EUVOLAEMIC_UNDERLYING_CAUSE_INPUT_KEY] = {
      kind: "single-choice",
      value: input.euvolaemicUnderlyingCause,
    };
  }

  return managementEngine.evaluate({ inputs });
}
