import {
  createPathwayEngine,
  type PathwayEvaluationSnapshot,
  type PathwayInputDatum,
} from "../../engine/index.ts";
import type { PathwayDefinition, PathwayNode } from "../schema.ts";
import {
  HYPONATRAEMIA_SEVERITY_BANDS,
  HYPONATRAEMIA_SOURCE_ID,
  SODIUM_INPUT_KEY,
  SODIUM_UNIT,
} from "./severity.ts";

export const FLUID_STATUS_INPUT_KEY = "fluidStatus";
export const CEREBRAL_OEDEMA_SIGNS_INPUT_KEY = "cerebralOedemaSigns";

export type HyponatraemiaFluidStatus =
  "euvolaemic" | "hypervolaemic" | "hypovolaemic" | "unable-to-establish";

export type CerebralOedemaSign =
  "ataxia" | "confusion" | "headache" | "low-gcs" | "nausea" | "none-confirmed" | "vomiting";

export const HYPONATRAEMIA_FLUID_STATUS_OPTIONS = Object.freeze([
  {
    description: "Reduced circulating volume is clinically established.",
    label: "Hypovolaemic",
    sourceSupported: true,
    value: "hypovolaemic",
  },
  {
    description: "Extracellular volume is clinically assessed as normal.",
    label: "Euvolaemic",
    sourceSupported: true,
    value: "euvolaemic",
  },
  {
    description: "Fluid overload is clinically established.",
    label: "Hypervolaemic",
    sourceSupported: true,
    value: "hypervolaemic",
  },
  {
    description: "The status cannot be established confidently from available information.",
    label: "Unable to establish safely",
    sourceSupported: false,
    value: "unable-to-establish",
  },
] satisfies readonly {
  description: string;
  label: string;
  sourceSupported: boolean;
  value: HyponatraemiaFluidStatus;
}[]);

export const CEREBRAL_OEDEMA_SIGN_OPTIONS = Object.freeze([
  { label: "Nausea", value: "nausea" },
  { label: "Vomiting", value: "vomiting" },
  { label: "Low GCS", value: "low-gcs" },
  { label: "Ataxia", value: "ataxia" },
  { label: "Confusion", value: "confusion" },
  { label: "Headache", value: "headache" },
] satisfies readonly { label: string; value: Exclude<CerebralOedemaSign, "none-confirmed"> }[]);

const severityReference = {
  page: 1,
  section: "Severity classification: Mild, Moderate and Severe",
  sourceId: HYPONATRAEMIA_SOURCE_ID,
};
const fluidStatusReference = {
  page: 1,
  section: "Establish Fluid Status",
  sourceId: HYPONATRAEMIA_SOURCE_ID,
};
const signsReference = {
  page: 1,
  section: "Signs of cerebral oedema present?",
  sourceId: HYPONATRAEMIA_SOURCE_ID,
};

type NumericBranch = Extract<PathwayNode, { type: "numeric-branch" }>;
type MultiSelectQuestion = Extract<PathwayNode, { type: "multi-select-question" }>;

const severityBranches: NumericBranch["branches"] = HYPONATRAEMIA_SEVERITY_BANDS.map((band) => ({
  branchId: band.branchId,
  label: band.label,
  nextNodeId: "fluid-status-question",
  range: { ...band.range },
}));

const signOptions: MultiSelectQuestion["options"] = [
  ...CEREBRAL_OEDEMA_SIGN_OPTIONS.map((option) => ({
    label: option.label,
    optionId: `${option.value}-option`,
    value: option.value,
  })),
  {
    label: "None of the listed signs confirmed",
    optionId: "none-confirmed-option",
    value: "none-confirmed",
  },
];

function buildSignsNode(
  id: "euvolaemic-signs" | "hypovolaemic-signs",
  noSignsNextNodeId: "euvolaemic-causes-pending" | "hypovolaemic-causes-pending",
): MultiSelectQuestion {
  return {
    branches: [
      {
        branchId: `${id}-present`,
        label: "One or more listed signs confirmed",
        nextNodeId: "emergency-management-pending",
        operator: "contains-any",
        values: CEREBRAL_OEDEMA_SIGN_OPTIONS.map((option) => option.value),
      },
      {
        branchId: `${id}-none-confirmed`,
        label: "No listed signs confirmed",
        nextNodeId: noSignsNextNodeId,
        operator: "contains-all",
        values: ["none-confirmed"],
      },
    ],
    fallbackBranch: null,
    id,
    inputKey: CEREBRAL_OEDEMA_SIGNS_INPUT_KEY,
    maximumSelections: signOptions.length,
    minimumSelections: 1,
    options: signOptions,
    prompt: "Confirm whether any listed signs of cerebral oedema are present.",
    sourceReferences: [signsReference],
    title: "Cerebral oedema signs",
    type: "multi-select-question",
  };
}

const pathwayDefinitionInput: PathwayDefinition = {
  entryNodeId: "sodium-input",
  name: "Hyponatraemia initial assessment",
  nodes: [
    {
      acceptedRange: {
        maximum: null,
        maximumInclusive: false,
        minimum: 0,
        minimumInclusive: false,
      },
      id: "sodium-input",
      inputKey: SODIUM_INPUT_KEY,
      nextNodeId: "sodium-severity-branch",
      precision: 1,
      prompt: "Enter the latest confirmed sodium result.",
      sourceReferences: [severityReference],
      title: "Sodium result",
      type: "numeric-input",
      unit: SODIUM_UNIT,
    },
    {
      branches: severityBranches,
      id: "sodium-severity-branch",
      inputKey: SODIUM_INPUT_KEY,
      noMatchBranch: {
        branchId: "no-exact-source-band",
        label: "No exact source severity band matched",
        nextNodeId: "outside-source-bands",
      },
      sourceReferences: [severityReference],
      title: "Classify sodium severity",
      type: "numeric-branch",
      unit: SODIUM_UNIT,
    },
    {
      id: "fluid-status-question",
      inputKey: FLUID_STATUS_INPUT_KEY,
      options: [
        {
          label: "Hypovolaemic",
          nextNodeId: "hypovolaemic-signs",
          optionId: "hypovolaemic-option",
          value: "hypovolaemic",
        },
        {
          label: "Euvolaemic",
          nextNodeId: "euvolaemic-signs",
          optionId: "euvolaemic-option",
          value: "euvolaemic",
        },
        {
          label: "Hypervolaemic",
          nextNodeId: "hypervolaemic-management-pending",
          optionId: "hypervolaemic-option",
          value: "hypervolaemic",
        },
        {
          label: "Unable to establish safely",
          nextNodeId: "fluid-status-review-required",
          optionId: "unable-to-establish-option",
          value: "unable-to-establish",
        },
      ],
      prompt: "Establish fluid status.",
      sourceReferences: [fluidStatusReference],
      title: "Establish fluid status",
      type: "single-choice-question",
    },
    buildSignsNode("hypovolaemic-signs", "hypovolaemic-causes-pending"),
    buildSignsNode("euvolaemic-signs", "euvolaemic-causes-pending"),
    {
      id: "emergency-management-pending",
      outcome: "requires-clinical-review",
      reason:
        "One or more source-listed signs were confirmed. Emergency management is intentionally deferred to the dedicated reviewed subtask.",
      sourceReferences: [signsReference],
      title: "Emergency management pending",
      type: "stop",
    },
    {
      id: "hypovolaemic-causes-pending",
      outcome: "requires-clinical-review",
      reason:
        "The hypovolaemic branch was confirmed without a listed sign. Cause assessment and management are not implemented in this subtask.",
      sourceReferences: [
        {
          page: 1,
          section: "Hypovolaemia: review factors of cause and PMHx",
          sourceId: HYPONATRAEMIA_SOURCE_ID,
        },
      ],
      title: "Hypovolaemic next step pending",
      type: "stop",
    },
    {
      id: "euvolaemic-causes-pending",
      outcome: "requires-clinical-review",
      reason:
        "The euvolaemic branch was confirmed without a listed sign. Underlying-cause assessment is not implemented in this subtask.",
      sourceReferences: [
        {
          page: 1,
          section: "Euvolaemia: underlying cause?",
          sourceId: HYPONATRAEMIA_SOURCE_ID,
        },
      ],
      title: "Euvolaemic next step pending",
      type: "stop",
    },
    {
      id: "hypervolaemic-management-pending",
      outcome: "requires-clinical-review",
      reason:
        "The source hypervolaemic endpoint was reached. Its management content is not implemented in this subtask.",
      sourceReferences: [
        {
          page: 1,
          section: "Hypervolaemic: End of pathway",
          sourceId: HYPONATRAEMIA_SOURCE_ID,
        },
      ],
      title: "Hypervolaemic endpoint pending",
      type: "stop",
    },
    {
      id: "fluid-status-review-required",
      outcome: "requires-clinical-review",
      reason:
        "Fluid status could not be established safely. No downstream branch or management instruction has been selected.",
      sourceReferences: [fluidStatusReference],
      title: "Fluid status review required",
      type: "stop",
    },
    {
      id: "outside-source-bands",
      outcome: "unsupported",
      reason:
        "The sodium result does not match an exact source severity band. Fluid-status branching has not been performed.",
      sourceReferences: [severityReference],
      title: "No exact sodium severity band",
      type: "stop",
    },
  ],
  pathwayId: "hyponatraemia-initial-assessment",
  reviewMetadata: {
    approvedBy: null,
    approvedOn: null,
    notes: [
      "Fluid-status and cerebral-oedema-sign branches are transcribed from page 1.",
      "Unable to establish safely is a fail-closed application state and is not a printed source branch.",
      "Treatment, cause assessment, monitoring and escalation are deferred.",
    ],
    reviewedBy: null,
    reviewedOn: null,
    status: "awaiting-clinical-review",
  },
  sourceIds: [HYPONATRAEMIA_SOURCE_ID],
  status: "awaiting-clinical-review",
  version: "0.2.0",
};

const fluidStatusEngine = createPathwayEngine(pathwayDefinitionInput);

export const hyponatraemiaInitialAssessmentPathwayDefinition = fluidStatusEngine.definition;

export interface HyponatraemiaFluidStatusEvaluationInput {
  cerebralOedemaSigns?: readonly CerebralOedemaSign[];
  fluidStatus?: HyponatraemiaFluidStatus;
  sodium: number;
  unit?: string;
}

export function evaluateHyponatraemiaFluidStatus(
  input: HyponatraemiaFluidStatusEvaluationInput,
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

  return fluidStatusEngine.evaluate({ inputs });
}
