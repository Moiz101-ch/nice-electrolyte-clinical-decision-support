import { createPathwayEngine, type PathwayEvaluationSnapshot } from "../../engine/index.ts";
import type { NumericRange, PathwayDefinition, PathwayNode } from "../schema.ts";

export const HYPONATRAEMIA_SOURCE_ID = "YSTHFT-HYPONATRAEMIA-EMERGENCY-V1";
export const SODIUM_INPUT_KEY = "sodium";
export const SODIUM_UNIT = "mmol/L";

export type HyponatraemiaSeverity = "mild" | "moderate" | "severe";

export interface HyponatraemiaSeverityBand {
  branchId: string;
  label: string;
  range: NumericRange;
  severity: HyponatraemiaSeverity;
  sourceRangeLabel: string;
}

const mutableSeverityBands: HyponatraemiaSeverityBand[] = [
  {
    branchId: "severe-hyponatraemia",
    label: "Severe hyponatraemia",
    range: {
      maximum: 125,
      maximumInclusive: false,
      minimum: null,
      minimumInclusive: false,
    },
    severity: "severe",
    sourceRangeLabel: "<125 mmol/L",
  },
  {
    branchId: "moderate-hyponatraemia",
    label: "Moderate hyponatraemia",
    range: {
      maximum: 129,
      maximumInclusive: true,
      minimum: 125,
      minimumInclusive: true,
    },
    severity: "moderate",
    sourceRangeLabel: "125–129 mmol/L",
  },
  {
    branchId: "mild-hyponatraemia",
    label: "Mild hyponatraemia",
    range: {
      maximum: 135,
      maximumInclusive: true,
      minimum: 130,
      minimumInclusive: true,
    },
    severity: "mild",
    sourceRangeLabel: "130–135 mmol/L",
  },
];

for (const band of mutableSeverityBands) {
  Object.freeze(band.range);
  Object.freeze(band);
}

export const HYPONATRAEMIA_SEVERITY_BANDS: readonly Readonly<HyponatraemiaSeverityBand>[] =
  Object.freeze(mutableSeverityBands);

const sourceReference = {
  page: 1,
  section: "Severity classification: Mild, Moderate and Severe",
  sourceId: HYPONATRAEMIA_SOURCE_ID,
};

type NumericBranch = Extract<PathwayNode, { type: "numeric-branch" }>;

const severityBranches: NumericBranch["branches"] = HYPONATRAEMIA_SEVERITY_BANDS.map((band) => ({
  branchId: band.branchId,
  label: band.label,
  nextNodeId: `${band.severity}-classification-review`,
  range: { ...band.range },
}));

const severityReviewStops: PathwayNode[] = HYPONATRAEMIA_SEVERITY_BANDS.map((band) => ({
  id: `${band.severity}-classification-review`,
  outcome: "requires-clinical-review",
  reason: `${band.label} was classified from the supplied source and awaits clinical review. No management instruction has been generated.`,
  sourceReferences: [sourceReference],
  title: `${band.label} classification review`,
  type: "stop",
}));

const pathwayDefinitionInput: PathwayDefinition = {
  entryNodeId: "sodium-input",
  name: "Hyponatraemia sodium severity",
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
      sourceReferences: [sourceReference],
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
      sourceReferences: [sourceReference],
      title: "Classify sodium severity",
      type: "numeric-branch",
      unit: SODIUM_UNIT,
    },
    ...severityReviewStops,
    {
      id: "outside-source-bands",
      outcome: "unsupported",
      reason:
        "The entered sodium result does not match an exact severity band printed in the supplied hyponatraemia source. No classification or management instruction has been generated.",
      sourceReferences: [sourceReference],
      title: "No exact source band",
      type: "stop",
    },
  ],
  pathwayId: "hyponatraemia-sodium-severity",
  reviewMetadata: {
    approvedBy: null,
    approvedOn: null,
    notes: [
      "Severity bands are transcribed from page 1 of the supplied Trust pathway.",
      "Decimal values between 129 and 130 are not assigned because the printed source leaves that interval unstated.",
      "This subtask provides classification only and no management output.",
    ],
    reviewedBy: null,
    reviewedOn: null,
    status: "awaiting-clinical-review",
  },
  sourceIds: [HYPONATRAEMIA_SOURCE_ID],
  status: "awaiting-clinical-review",
  version: "0.1.0",
};

const severityEngine = createPathwayEngine(pathwayDefinitionInput);

export const hyponatraemiaSeverityPathwayDefinition = severityEngine.definition;

export type HyponatraemiaSeverityEvaluation =
  | {
      kind: "classified";
      band: Readonly<HyponatraemiaSeverityBand>;
      snapshot: PathwayEvaluationSnapshot;
      unit: typeof SODIUM_UNIT;
      value: number;
    }
  | {
      kind: "invalid";
      message: string;
      snapshot: PathwayEvaluationSnapshot;
    }
  | {
      kind: "unsupported";
      message: string;
      snapshot: PathwayEvaluationSnapshot;
      unit: typeof SODIUM_UNIT;
      value: number;
    };

export function evaluateHyponatraemiaSeverity(
  value: number,
  unit: string = SODIUM_UNIT,
): HyponatraemiaSeverityEvaluation {
  const snapshot = severityEngine.evaluate({
    inputs: {
      [SODIUM_INPUT_KEY]: { kind: "numeric", unit, value },
    },
  });

  if (snapshot.status === "blocked") {
    return {
      kind: "invalid",
      message: toInputMessage(snapshot),
      snapshot,
    };
  }

  const classification = snapshot.derivedClassifications.find(
    (candidate) => candidate.nodeId === "sodium-severity-branch",
  );
  const band = HYPONATRAEMIA_SEVERITY_BANDS.find(
    (candidate) => candidate.branchId === classification?.branchId,
  );

  if (band) {
    return {
      band,
      kind: "classified",
      snapshot,
      unit: SODIUM_UNIT,
      value,
    };
  }

  return {
    kind: "unsupported",
    message:
      snapshot.stopReason ??
      "No exact severity band in the supplied hyponatraemia source matched this result.",
    snapshot,
    unit: SODIUM_UNIT,
    value,
  };
}

function toInputMessage(snapshot: PathwayEvaluationSnapshot): string {
  const message = snapshot.issues[0]?.message ?? "The sodium result could not be validated.";

  if (/expected unit/i.test(message)) {
    return `Use ${SODIUM_UNIT} for the sodium result.`;
  }

  if (/decimal places/i.test(message)) {
    return "Enter sodium with no more than 1 decimal place.";
  }

  if (/accepted range/i.test(message)) {
    return `Enter a sodium result greater than 0 ${SODIUM_UNIT}.`;
  }

  return "Enter a finite numeric sodium result.";
}
