import { createPathwayEngine, type PathwayInputDatum } from "../../engine/index.ts";
import { pathwayNodeSchema, type PathwayDefinition, type PathwayNode } from "../schema.ts";
import {
  HYPERKALAEMIA_SOURCE_ID,
  HYPERKALAEMIA_UKKA_SOURCE_ID,
  POTASSIUM_INPUT_KEY,
  POTASSIUM_UNIT,
  hyperkalaemiaSeverityPathwayDefinition,
} from "./severity.ts";

export const ECG_CHANGES_INPUT_KEY = "ecgChanges";

export type HyperkalaemiaEcgChange =
  | "bradycardia"
  | "broad-qrs"
  | "flat-absent-p-waves"
  | "none-confirmed"
  | "peaked-t-waves"
  | "sine-wave"
  | "unable-to-determine"
  | "ventricular-tachycardia";

export const HYPERKALAEMIA_ECG_CHANGE_OPTIONS = Object.freeze([
  { label: "Peaked T waves", value: "peaked-t-waves" },
  { label: "Broad QRS", value: "broad-qrs" },
  { label: "Flat or absent P waves", value: "flat-absent-p-waves" },
  { label: "Bradycardia", value: "bradycardia" },
  { label: "Ventricular tachycardia (VT)", value: "ventricular-tachycardia" },
  { label: "Sine wave", value: "sine-wave" },
] satisfies readonly {
  label: string;
  value: Exclude<HyperkalaemiaEcgChange, "none-confirmed" | "unable-to-determine">;
}[]);

const ecgReference = {
  page: 2,
  section: "Are ECG changes present?",
  sourceId: HYPERKALAEMIA_SOURCE_ID,
};
const ecgEscalationReference = {
  page: 2,
  section: "ECG changes present: cardiac monitoring, resuscitation and outreach",
  sourceId: HYPERKALAEMIA_SOURCE_ID,
};

type ActionGroupNode = Extract<PathwayNode, { type: "action-group" }>;
type MultiSelectQuestionNode = Extract<PathwayNode, { type: "multi-select-question" }>;

const ecgQuestionOptions: MultiSelectQuestionNode["options"] = [
  ...HYPERKALAEMIA_ECG_CHANGE_OPTIONS.map((option) => ({
    label: option.label,
    optionId: `${option.value}-option`,
    value: option.value,
  })),
  {
    label: "None of the listed ECG changes confirmed",
    optionId: "none-confirmed-option",
    value: "none-confirmed",
  },
  {
    label: "Unable to determine safely",
    optionId: "unable-to-determine-option",
    value: "unable-to-determine",
  },
];

const listedEcgChangeValues = HYPERKALAEMIA_ECG_CHANGE_OPTIONS.map((option) => option.value);

const inheritedNodes = hyperkalaemiaSeverityPathwayDefinition.nodes
  .filter(
    (node) =>
      node.id !== "moderate-classification-review" && node.id !== "severe-classification-review",
  )
  .map((node) => pathwayNodeSchema.parse(node))
  .map((node): PathwayNode => {
    if (
      node.type === "action-group" &&
      (node.id === "moderate-initial-checks" || node.id === "severe-initial-checks")
    ) {
      return { ...node, nextNodeId: "ecg-changes-question" } satisfies ActionGroupNode;
    }

    return node;
  });

const pathwayDefinitionInput: PathwayDefinition = {
  entryNodeId: hyperkalaemiaSeverityPathwayDefinition.entryNodeId,
  name: "Hyperkalaemia severity and ECG assessment",
  nodes: [
    ...inheritedNodes,
    {
      branches: [
        {
          branchId: "listed-ecg-changes-confirmed",
          label: "One or more listed ECG changes confirmed",
          nextNodeId: "ecg-change-escalation",
          operator: "contains-any",
          values: listedEcgChangeValues,
        },
        {
          branchId: "no-listed-ecg-changes",
          label: "No listed ECG changes confirmed",
          nextNodeId: "no-ecg-changes-review",
          operator: "contains-all",
          values: ["none-confirmed"],
        },
        {
          branchId: "ecg-unable-to-determine",
          label: "Unable to determine safely",
          nextNodeId: "ecg-assessment-uncertain-review",
          operator: "contains-all",
          values: ["unable-to-determine"],
        },
      ],
      fallbackBranch: null,
      id: "ecg-changes-question",
      inputKey: ECG_CHANGES_INPUT_KEY,
      maximumSelections: ecgQuestionOptions.length,
      minimumSelections: 1,
      options: ecgQuestionOptions,
      prompt: "Confirm whether any source-listed ECG changes are present.",
      sourceReferences: [ecgReference],
      title: "ECG changes",
      type: "multi-select-question",
    },
    {
      id: "ecg-change-escalation",
      items: [
        {
          escalationId: "cardiac-monitoring-resuscitation",
          instruction: "Use cardiac monitoring and resuscitation support.",
          sourceReferences: [ecgEscalationReference],
          urgency: "immediate",
        },
        {
          escalationId: "consider-outreach-referral",
          instruction: "Consider referral to outreach.",
          sourceReferences: [ecgEscalationReference],
          urgency: "urgent",
        },
      ],
      nextNodeId: "ecg-changes-confirmed-review",
      sourceReferences: [ecgEscalationReference],
      title: "ECG-change escalation",
      type: "escalation",
    },
    {
      id: "ecg-changes-confirmed-review",
      outcome: "requires-clinical-review",
      reason:
        "One or more source-listed ECG changes were confirmed. The source escalation branch is shown, while calcium and timed treatment instructions remain deferred.",
      sourceReferences: [ecgReference, ecgEscalationReference],
      title: "ECG changes confirmed",
      type: "stop",
    },
    {
      id: "no-ecg-changes-review",
      outcome: "requires-clinical-review",
      reason:
        "No source-listed ECG change was confirmed. The no-change branch is recorded without generating the deferred timed treatment instructions.",
      sourceReferences: [ecgReference],
      title: "No listed ECG changes confirmed",
      type: "stop",
    },
    {
      id: "ecg-assessment-uncertain-review",
      outcome: "requires-clinical-review",
      reason:
        "ECG changes could not be determined safely. No present-or-absent treatment branch has been selected.",
      sourceReferences: [ecgReference],
      title: "ECG assessment requires review",
      type: "stop",
    },
  ],
  pathwayId: "hyperkalaemia-ecg-assessment",
  reviewMetadata: {
    approvedBy: null,
    approvedOn: null,
    notes: [
      "The six ECG labels and yes-branch escalation are transcribed from page 2 of the supplied Trust protocol.",
      "Unable to determine safely is an application fail-closed state and is not a printed source branch.",
      "The UI displays original schematic waveform placeholders beside the source-listed text labels. They are unapproved, non-diagnostic and do not alter pathway evaluation.",
      "Calcium administration, insulin/glucose and all timed treatment details remain deferred.",
    ],
    reviewedBy: null,
    reviewedOn: null,
    status: "awaiting-clinical-review",
  },
  sourceIds: [HYPERKALAEMIA_SOURCE_ID, HYPERKALAEMIA_UKKA_SOURCE_ID],
  status: "awaiting-clinical-review",
  version: "0.2.1",
};

const ecgEngine = createPathwayEngine(pathwayDefinitionInput);

export const hyperkalaemiaEcgPathwayDefinition = ecgEngine.definition;

export interface HyperkalaemiaEcgEvaluationInput {
  ecgChanges?: readonly HyperkalaemiaEcgChange[];
  potassium: number;
  unit?: string;
}

export function evaluateHyperkalaemiaEcgWorkflow(input: HyperkalaemiaEcgEvaluationInput) {
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

  return ecgEngine.evaluate({ inputs });
}
