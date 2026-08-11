import {
  createPathwayEngine,
  type PathwayEvaluationSnapshot,
  type PathwayInputDatum,
} from "../../engine/index.ts";
import type { PathwayDefinition, PathwayNode } from "../schema.ts";
import { FLUID_STATUS_INPUT_KEY, type HyponatraemiaFluidStatus } from "./fluid-status.ts";

export const HYPONATRAEMIA_CLASSIFICATION_SOURCE_IDS = Object.freeze([
  "UNVERIFIED-HYPONATRAEMIA-CLASSIFICATION-CAPTURE",
  "UNVERIFIED-HYPONATRAEMIA-CLASSIFICATION-DIAGRAM",
] as const);

export const URINE_RESULTS_AVAILABLE_INPUT_KEY = "urineResultsAvailable";
export const SERUM_OSMOLALITY_INPUT_KEY = "serumOsmolality";
export const URINE_OSMOLALITY_INPUT_KEY = "urineOsmolality";
export const HYPOVOLAEMIC_URINE_SODIUM_INPUT_KEY = "hypovolaemicUrineSodium";
export const EUVOLAEMIC_URINE_SODIUM_INPUT_KEY = "euvolaemicUrineSodium";
export const OSMOLALITY_UNIT = "mOsm/kg";
export const URINE_SODIUM_UNIT = "mEq/L";

export type HyponatraemiaSerumTonicity = "hypertonic" | "hypotonic" | "isotonic";

export type HyponatraemiaCausePatternId =
  | "hypervolaemic-pattern"
  | "non-renal-salt-loss"
  | "primary-polydipsia-low-solute"
  | "pseudohyponatraemia-compatible"
  | "renal-salt-loss"
  | "siadh-compatible"
  | "translocational-compatible";

export interface HyponatraemiaCausePattern {
  causes: readonly string[];
  id: HyponatraemiaCausePatternId;
  label: string;
  summary: string;
}

const mutableCausePatterns: HyponatraemiaCausePattern[] = [
  {
    causes: ["Vomiting", "Diarrhoea"],
    id: "non-renal-salt-loss",
    label: "Non-renal salt-loss pattern",
    summary:
      "Hypotonic hyponatraemia with hypovolaemia and urine sodium below 40 mEq/L is compatible with non-renal salt loss.",
  },
  {
    causes: ["Diuretics", "Primary adrenal insufficiency"],
    id: "renal-salt-loss",
    label: "Renal salt-loss pattern",
    summary:
      "Hypotonic hyponatraemia with hypovolaemia and urine sodium above 40 mEq/L is compatible with renal salt loss.",
  },
  {
    causes: ["Primary polydipsia", "Malnutrition or low-solute intake"],
    id: "primary-polydipsia-low-solute",
    label: "Primary polydipsia or low-solute pattern",
    summary:
      "Hypotonic hyponatraemia with euvolaemia and urine osmolality below 100 mOsm/kg is compatible with primary polydipsia or a low-solute state.",
  },
  {
    causes: ["Syndrome of inappropriate antidiuretic hormone secretion"],
    id: "siadh-compatible",
    label: "SIADH-compatible pattern",
    summary:
      "Hypotonic hyponatraemia with euvolaemia, urine osmolality above 100 mOsm/kg and urine sodium above 40 mEq/L is compatible with the supplied SIADH classification criteria. A dedicated SIADH management pathway requires an approved source.",
  },
  {
    causes: ["Heart failure", "Cirrhosis", "Nephrotic syndrome"],
    id: "hypervolaemic-pattern",
    label: "Hypervolaemic pattern",
    summary:
      "Hypotonic hyponatraemia with clinically established hypervolaemia is compatible with a volume-overload cause category.",
  },
  {
    causes: ["Paraproteinaemia", "Hyperlipidaemia"],
    id: "pseudohyponatraemia-compatible",
    label: "Pseudohyponatraemia-compatible pattern",
    summary:
      "Isotonic hyponatraemia is compatible with a pseudohyponatraemia context in the supplied classification material.",
  },
  {
    causes: ["Hyperglycaemia", "Exogenous solutes such as mannitol"],
    id: "translocational-compatible",
    label: "Translocational hyponatraemia-compatible pattern",
    summary:
      "Hypertonic hyponatraemia is compatible with a translocational cause category in the supplied classification material.",
  },
];

for (const pattern of mutableCausePatterns) {
  Object.freeze(pattern.causes);
  Object.freeze(pattern);
}

export const HYPONATRAEMIA_CAUSE_PATTERNS: readonly Readonly<HyponatraemiaCausePattern>[] =
  Object.freeze(mutableCausePatterns);

function references(section: string) {
  return HYPONATRAEMIA_CLASSIFICATION_SOURCE_IDS.map((sourceId) => ({
    page: 1,
    section,
    sourceId,
  }));
}

const classificationReference = references("Serum osmolality classification");
const fluidStatusReference = references("Hypotonic classification: extracellular-volume status");
const urineFindingsReference = references("Hypotonic classification: urine findings");
const causesReference = references("Classification: common causes");
const exclusionReference = references(
  "Rule out hypothyroidism and secondary adrenal insufficiency in all cases",
);

function patternNode(patternId: HyponatraemiaCausePatternId): PathwayNode {
  const pattern = HYPONATRAEMIA_CAUSE_PATTERNS.find((candidate) => candidate.id === patternId);

  if (!pattern) {
    throw new Error(`Unknown hyponatraemia cause pattern: ${patternId}`);
  }

  return {
    body: pattern.summary,
    id: `${pattern.id}-information`,
    nextNodeId: "classification-review-stop",
    sourceReferences: causesReference,
    title: pattern.label,
    type: "information",
  };
}

const pathwayDefinitionInput: PathwayDefinition = {
  entryNodeId: "classification-exclusion-warning",
  name: "Hyponatraemia urine and osmolality classification",
  nodes: [
    {
      id: "classification-exclusion-warning",
      nextNodeId: "urine-results-available-question",
      sourceReferences: exclusionReference,
      title: "Required exclusion checks",
      type: "warning",
      warnings: [
        {
          message: "Rule out hypothyroidism and secondary adrenal insufficiency in all cases.",
          severity: "caution",
          sourceReferences: exclusionReference,
          warningId: "exclude-thyroid-and-adrenal-causes",
        },
      ],
    },
    {
      falseBranch: {
        branchId: "urine-results-not-available",
        label: "Urine results are not available",
        nextNodeId: "classification-results-unavailable",
      },
      id: "urine-results-available-question",
      inputKey: URINE_RESULTS_AVAILABLE_INPUT_KEY,
      prompt: "Are urine results available?",
      sourceReferences: urineFindingsReference,
      title: "Urine result availability",
      trueBranch: {
        branchId: "urine-results-available",
        label: "Urine results are available",
        nextNodeId: "serum-osmolality-input",
      },
      type: "boolean-branch",
    },
    {
      acceptedRange: {
        maximum: null,
        maximumInclusive: false,
        minimum: 0,
        minimumInclusive: false,
      },
      id: "serum-osmolality-input",
      inputKey: SERUM_OSMOLALITY_INPUT_KEY,
      nextNodeId: "serum-osmolality-branch",
      precision: 1,
      prompt: "Enter the confirmed serum osmolality.",
      sourceReferences: classificationReference,
      title: "Serum osmolality",
      type: "numeric-input",
      unit: OSMOLALITY_UNIT,
    },
    {
      branches: [
        {
          branchId: "hypotonic-serum-osmolality",
          label: "Hypotonic hyponatraemia",
          nextNodeId: "classification-fluid-status-question",
          range: {
            maximum: 275,
            maximumInclusive: false,
            minimum: 0,
            minimumInclusive: false,
          },
        },
        {
          branchId: "isotonic-serum-osmolality",
          label: "Isotonic hyponatraemia",
          nextNodeId: "pseudohyponatraemia-compatible-information",
          range: {
            maximum: 295,
            maximumInclusive: false,
            minimum: 275,
            minimumInclusive: false,
          },
        },
        {
          branchId: "hypertonic-serum-osmolality",
          label: "Hypertonic hyponatraemia",
          nextNodeId: "translocational-compatible-information",
          range: {
            maximum: null,
            maximumInclusive: false,
            minimum: 295,
            minimumInclusive: false,
          },
        },
      ],
      id: "serum-osmolality-branch",
      inputKey: SERUM_OSMOLALITY_INPUT_KEY,
      noMatchBranch: {
        branchId: "serum-osmolality-boundary-undefined",
        label: "Serum osmolality boundary is not explicit",
        nextNodeId: "serum-osmolality-boundary-review",
      },
      sourceReferences: classificationReference,
      title: "Classify serum osmolality",
      type: "numeric-branch",
      unit: OSMOLALITY_UNIT,
    },
    {
      id: "classification-fluid-status-question",
      inputKey: FLUID_STATUS_INPUT_KEY,
      options: [
        {
          label: "Hypovolaemic",
          nextNodeId: "hypovolaemic-urine-sodium-input",
          optionId: "classification-hypovolaemic-option",
          value: "hypovolaemic",
        },
        {
          label: "Euvolaemic",
          nextNodeId: "euvolaemic-urine-osmolality-input",
          optionId: "classification-euvolaemic-option",
          value: "euvolaemic",
        },
        {
          label: "Hypervolaemic",
          nextNodeId: "hypervolaemic-pattern-information",
          optionId: "classification-hypervolaemic-option",
          value: "hypervolaemic",
        },
        {
          label: "Unable to establish safely",
          nextNodeId: "classification-fluid-status-review",
          optionId: "classification-fluid-status-uncertain-option",
          value: "unable-to-establish",
        },
      ],
      prompt: "Confirm the clinically established fluid status for hypotonic hyponatraemia.",
      sourceReferences: fluidStatusReference,
      title: "Fluid status",
      type: "single-choice-question",
    },
    {
      acceptedRange: {
        maximum: null,
        maximumInclusive: false,
        minimum: 0,
        minimumInclusive: true,
      },
      id: "hypovolaemic-urine-sodium-input",
      inputKey: HYPOVOLAEMIC_URINE_SODIUM_INPUT_KEY,
      nextNodeId: "hypovolaemic-urine-sodium-branch",
      precision: 1,
      prompt: "Enter the confirmed urine sodium.",
      sourceReferences: urineFindingsReference,
      title: "Urine sodium",
      type: "numeric-input",
      unit: URINE_SODIUM_UNIT,
    },
    {
      branches: [
        {
          branchId: "hypovolaemic-urine-sodium-below-forty",
          label: "Urine sodium below 40 mEq/L",
          nextNodeId: "non-renal-salt-loss-information",
          range: {
            maximum: 40,
            maximumInclusive: false,
            minimum: 0,
            minimumInclusive: true,
          },
        },
        {
          branchId: "hypovolaemic-urine-sodium-above-forty",
          label: "Urine sodium above 40 mEq/L",
          nextNodeId: "renal-salt-loss-information",
          range: {
            maximum: null,
            maximumInclusive: false,
            minimum: 40,
            minimumInclusive: false,
          },
        },
      ],
      id: "hypovolaemic-urine-sodium-branch",
      inputKey: HYPOVOLAEMIC_URINE_SODIUM_INPUT_KEY,
      noMatchBranch: {
        branchId: "hypovolaemic-urine-sodium-boundary-undefined",
        label: "Urine sodium boundary is not explicit",
        nextNodeId: "urine-sodium-boundary-review",
      },
      sourceReferences: urineFindingsReference,
      title: "Classify hypovolaemic urine sodium",
      type: "numeric-branch",
      unit: URINE_SODIUM_UNIT,
    },
    {
      acceptedRange: {
        maximum: null,
        maximumInclusive: false,
        minimum: 0,
        minimumInclusive: false,
      },
      id: "euvolaemic-urine-osmolality-input",
      inputKey: URINE_OSMOLALITY_INPUT_KEY,
      nextNodeId: "euvolaemic-urine-osmolality-branch",
      precision: 1,
      prompt: "Enter the confirmed urine osmolality.",
      sourceReferences: urineFindingsReference,
      title: "Urine osmolality",
      type: "numeric-input",
      unit: OSMOLALITY_UNIT,
    },
    {
      branches: [
        {
          branchId: "euvolaemic-urine-osmolality-below-one-hundred",
          label: "Urine osmolality below 100 mOsm/kg",
          nextNodeId: "primary-polydipsia-low-solute-information",
          range: {
            maximum: 100,
            maximumInclusive: false,
            minimum: 0,
            minimumInclusive: false,
          },
        },
        {
          branchId: "euvolaemic-urine-osmolality-above-one-hundred",
          label: "Urine osmolality above 100 mOsm/kg",
          nextNodeId: "euvolaemic-urine-sodium-input",
          range: {
            maximum: null,
            maximumInclusive: false,
            minimum: 100,
            minimumInclusive: false,
          },
        },
      ],
      id: "euvolaemic-urine-osmolality-branch",
      inputKey: URINE_OSMOLALITY_INPUT_KEY,
      noMatchBranch: {
        branchId: "urine-osmolality-boundary-undefined",
        label: "Urine osmolality boundary is not explicit",
        nextNodeId: "urine-osmolality-boundary-review",
      },
      sourceReferences: urineFindingsReference,
      title: "Classify euvolaemic urine osmolality",
      type: "numeric-branch",
      unit: OSMOLALITY_UNIT,
    },
    {
      acceptedRange: {
        maximum: null,
        maximumInclusive: false,
        minimum: 0,
        minimumInclusive: true,
      },
      id: "euvolaemic-urine-sodium-input",
      inputKey: EUVOLAEMIC_URINE_SODIUM_INPUT_KEY,
      nextNodeId: "euvolaemic-urine-sodium-branch",
      precision: 1,
      prompt: "Enter the confirmed urine sodium.",
      sourceReferences: urineFindingsReference,
      title: "Urine sodium",
      type: "numeric-input",
      unit: URINE_SODIUM_UNIT,
    },
    {
      branches: [
        {
          branchId: "euvolaemic-urine-sodium-above-forty",
          label: "Urine sodium above 40 mEq/L",
          nextNodeId: "siadh-compatible-information",
          range: {
            maximum: null,
            maximumInclusive: false,
            minimum: 40,
            minimumInclusive: false,
          },
        },
      ],
      id: "euvolaemic-urine-sodium-branch",
      inputKey: EUVOLAEMIC_URINE_SODIUM_INPUT_KEY,
      noMatchBranch: {
        branchId: "euvolaemic-urine-sodium-pattern-undefined",
        label: "No explicit euvolaemic cause branch matched",
        nextNodeId: "euvolaemic-urine-sodium-review",
      },
      sourceReferences: urineFindingsReference,
      title: "Assess euvolaemic urine sodium",
      type: "numeric-branch",
      unit: URINE_SODIUM_UNIT,
    },
    patternNode("non-renal-salt-loss"),
    patternNode("renal-salt-loss"),
    patternNode("primary-polydipsia-low-solute"),
    patternNode("siadh-compatible"),
    patternNode("hypervolaemic-pattern"),
    patternNode("pseudohyponatraemia-compatible"),
    patternNode("translocational-compatible"),
    {
      id: "classification-review-stop",
      outcome: "requires-clinical-review",
      reason:
        "A compatible classification pattern was identified. It is not a definitive diagnosis and remains subject to clinical review.",
      sourceReferences: causesReference,
      title: "Classification pattern review",
      type: "stop",
    },
    {
      id: "classification-results-unavailable",
      outcome: "requires-clinical-review",
      reason:
        "Urine results are unavailable, so the urine/osmolality classification has not been completed. Emergency assessment can continue independently where clinically applicable.",
      sourceReferences: urineFindingsReference,
      title: "Classification results unavailable",
      type: "stop",
    },
    {
      id: "serum-osmolality-boundary-review",
      outcome: "requires-clinical-review",
      reason:
        "The supplied classification uses less than 275 mOsm/kg, approximately 275-295 mOsm/kg and greater than 295 mOsm/kg. Exact equality at 275 or 295 is not assigned automatically.",
      sourceReferences: classificationReference,
      title: "Serum osmolality boundary requires review",
      type: "stop",
    },
    {
      id: "classification-fluid-status-review",
      outcome: "requires-clinical-review",
      reason:
        "Fluid status could not be established safely. No hypotonic cause category has been selected.",
      sourceReferences: fluidStatusReference,
      title: "Fluid status requires review",
      type: "stop",
    },
    {
      id: "urine-sodium-boundary-review",
      outcome: "requires-clinical-review",
      reason:
        "The supplied classification defines urine sodium below and above 40 mEq/L but does not define equality at 40 mEq/L. No cause category has been selected.",
      sourceReferences: urineFindingsReference,
      title: "Urine sodium boundary requires review",
      type: "stop",
    },
    {
      id: "urine-osmolality-boundary-review",
      outcome: "requires-clinical-review",
      reason:
        "The supplied classification defines urine osmolality below and above 100 mOsm/kg but does not define equality at 100 mOsm/kg. No cause category has been selected.",
      sourceReferences: urineFindingsReference,
      title: "Urine osmolality boundary requires review",
      type: "stop",
    },
    {
      id: "euvolaemic-urine-sodium-review",
      outcome: "requires-clinical-review",
      reason:
        "For euvolaemic hypotonic hyponatraemia with urine osmolality above 100 mOsm/kg, the supplied classification states a SIADH-compatible pattern only when urine sodium is above 40 mEq/L. No alternative category has been selected.",
      sourceReferences: urineFindingsReference,
      title: "Euvolaemic urine sodium requires review",
      type: "stop",
    },
  ],
  pathwayId: "hyponatraemia-osmolality-classification",
  reviewMetadata: {
    approvedBy: null,
    approvedOn: null,
    notes: [
      "The two supplied classification images have incomplete provenance and remain unverified.",
      "Exact equality at serum osmolality 275 and 295, urine osmolality 100, and urine sodium 40 is not defined; these values stop for review.",
      "Cause outputs are compatible categories rather than definitive diagnoses.",
      "The supplied material does not include a dedicated SIADH management pathway.",
    ],
    reviewedBy: null,
    reviewedOn: null,
    status: "awaiting-clinical-review",
  },
  sourceIds: [...HYPONATRAEMIA_CLASSIFICATION_SOURCE_IDS],
  status: "awaiting-clinical-review",
  version: "0.4.0",
};

const classificationEngine = createPathwayEngine(pathwayDefinitionInput);

export const hyponatraemiaOsmolalityClassificationPathwayDefinition =
  classificationEngine.definition;

export interface HyponatraemiaOsmolalityClassificationInput {
  fluidStatus?: HyponatraemiaFluidStatus;
  serumOsmolality?: number;
  serumOsmolalityUnit?: string;
  urineOsmolality?: number;
  urineOsmolalityUnit?: string;
  urineResultsAvailable?: boolean;
  urineSodium?: number;
  urineSodiumUnit?: string;
}

export interface HyponatraemiaOsmolalityClassificationEvaluation {
  causePattern: Readonly<HyponatraemiaCausePattern> | null;
  serumTonicity: HyponatraemiaSerumTonicity | null;
  snapshot: PathwayEvaluationSnapshot;
}

export function evaluateHyponatraemiaOsmolalityClassification(
  input: HyponatraemiaOsmolalityClassificationInput,
): HyponatraemiaOsmolalityClassificationEvaluation {
  const inputs: Record<string, PathwayInputDatum> = {};

  if (input.urineResultsAvailable !== undefined) {
    inputs[URINE_RESULTS_AVAILABLE_INPUT_KEY] = {
      kind: "boolean",
      value: input.urineResultsAvailable,
    };
  }

  if (input.serumOsmolality !== undefined) {
    inputs[SERUM_OSMOLALITY_INPUT_KEY] = {
      kind: "numeric",
      unit: input.serumOsmolalityUnit ?? OSMOLALITY_UNIT,
      value: input.serumOsmolality,
    };
  }

  if (input.fluidStatus !== undefined) {
    inputs[FLUID_STATUS_INPUT_KEY] = {
      kind: "single-choice",
      value: input.fluidStatus,
    };
  }

  if (input.urineOsmolality !== undefined) {
    inputs[URINE_OSMOLALITY_INPUT_KEY] = {
      kind: "numeric",
      unit: input.urineOsmolalityUnit ?? OSMOLALITY_UNIT,
      value: input.urineOsmolality,
    };
  }

  if (input.urineSodium !== undefined && input.fluidStatus === "hypovolaemic") {
    inputs[HYPOVOLAEMIC_URINE_SODIUM_INPUT_KEY] = {
      kind: "numeric",
      unit: input.urineSodiumUnit ?? URINE_SODIUM_UNIT,
      value: input.urineSodium,
    };
  }

  if (input.urineSodium !== undefined && input.fluidStatus === "euvolaemic") {
    inputs[EUVOLAEMIC_URINE_SODIUM_INPUT_KEY] = {
      kind: "numeric",
      unit: input.urineSodiumUnit ?? URINE_SODIUM_UNIT,
      value: input.urineSodium,
    };
  }

  const snapshot = classificationEngine.evaluate({ inputs });
  const tonicityBranch = snapshot.selectedBranches.find(
    (branch) => branch.nodeId === "serum-osmolality-branch",
  );
  const serumTonicity = tonicityBranch
    ? ((
        {
          "hypertonic-serum-osmolality": "hypertonic",
          "hypotonic-serum-osmolality": "hypotonic",
          "isotonic-serum-osmolality": "isotonic",
        } as const
      )[tonicityBranch.branchId] ?? null)
    : null;
  const causeInformation = snapshot.information.find((item) =>
    item.nodeId.endsWith("-information"),
  );
  const causePattern = causeInformation
    ? (HYPONATRAEMIA_CAUSE_PATTERNS.find(
        (pattern) => `${pattern.id}-information` === causeInformation.nodeId,
      ) ?? null)
    : null;

  return Object.freeze({ causePattern, serumTonicity, snapshot });
}
