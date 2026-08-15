import { createPathwayEngine, type PathwayEvaluationSnapshot } from "../../engine/index.ts";
import type { NumericRange, PathwayDefinition, PathwayNode } from "../schema.ts";

export const HYPERKALAEMIA_SOURCE_ID = "YSTHFT-ACUTE-HYPERKALAEMIA-V1";
export const POTASSIUM_INPUT_KEY = "potassium";
export const POTASSIUM_UNIT = "mmol/L";

export type HyperkalaemiaSeverity = "mild" | "moderate" | "severe";

export interface HyperkalaemiaSeverityBand {
  branchId: string;
  label: string;
  range: NumericRange;
  severity: HyperkalaemiaSeverity;
  sourceRangeLabel: string;
  sourceSummary: string;
}

const mutableSeverityBands: HyperkalaemiaSeverityBand[] = [
  {
    branchId: "mild-hyperkalaemia",
    label: "Mild hyperkalaemia",
    range: {
      maximum: 5.9,
      maximumInclusive: true,
      minimum: 5.5,
      minimumInclusive: true,
    },
    severity: "mild",
    sourceRangeLabel: "5.5-5.9 mmol/L",
    sourceSummary: "Consider the cause and need for treatment.",
  },
  {
    branchId: "moderate-hyperkalaemia",
    label: "Moderate hyperkalaemia",
    range: {
      maximum: 6.4,
      maximumInclusive: true,
      minimum: 6,
      minimumInclusive: true,
    },
    severity: "moderate",
    sourceRangeLabel: "6.0-6.4 mmol/L",
    sourceSummary: "Management is guided by clinical condition, ECG and rate of rise.",
  },
  {
    branchId: "severe-hyperkalaemia",
    label: "Severe hyperkalaemia",
    range: {
      maximum: null,
      maximumInclusive: false,
      minimum: 6.5,
      minimumInclusive: true,
    },
    severity: "severe",
    sourceRangeLabel: ">=6.5 mmol/L",
    sourceSummary: "Emergency treatment is indicated.",
  },
];

for (const band of mutableSeverityBands) {
  Object.freeze(band.range);
  Object.freeze(band);
}

export const HYPERKALAEMIA_SEVERITY_BANDS: readonly Readonly<HyperkalaemiaSeverityBand>[] =
  Object.freeze(mutableSeverityBands);

const severityReference = {
  page: 2,
  section: "Severity classification: Mild, Moderate and Severe",
  sourceId: HYPERKALAEMIA_SOURCE_ID,
};
const initialChecksReference = {
  page: 2,
  section: "Initial investigations and safety checks",
  sourceId: HYPERKALAEMIA_SOURCE_ID,
};
const sevenPlusReference = {
  page: 2,
  section: "Potassium at or above 7.0 mmol/L",
  sourceId: HYPERKALAEMIA_SOURCE_ID,
};

type ActionGroupNode = Extract<PathwayNode, { type: "action-group" }>;
type NumericBranchNode = Extract<PathwayNode, { type: "numeric-branch" }>;

const commonInitialChecks: ActionGroupNode["actions"] = [
  {
    actionId: "exclude-pseudohyperkalaemia",
    instruction: "Exclude pseudohyperkalaemia.",
    sourceReferences: [initialChecksReference],
    timing: "immediate",
  },
  {
    actionId: "check-calcium-bicarbonate",
    instruction: "Check serum calcium and bicarbonate.",
    sourceReferences: [initialChecksReference],
    timing: "immediate",
  },
  {
    actionId: "check-chronic-potassium-context",
    instruction:
      "Check whether potassium is chronically raised and within the patient's satisfactory range, including in known CKD.",
    sourceReferences: [initialChecksReference],
    timing: "immediate",
  },
];

const ecgCheck: ActionGroupNode["actions"][number] = {
  actionId: "perform-ecg-monitor-rhythm",
  instruction: "Perform a 12-lead ECG and monitor cardiac rhythm.",
  sourceReferences: [initialChecksReference],
  timing: "immediate",
};

const severityBranches: NumericBranchNode["branches"] = HYPERKALAEMIA_SEVERITY_BANDS.map(
  (band) => ({
    branchId: band.branchId,
    label: band.label,
    nextNodeId:
      band.severity === "severe"
        ? "severe-urgent-threshold-branch"
        : `${band.severity}-initial-checks`,
    range: { ...band.range },
  }),
);

const pathwayDefinitionInput: PathwayDefinition = {
  entryNodeId: "potassium-input",
  name: "Hyperkalaemia potassium severity",
  nodes: [
    {
      acceptedRange: {
        maximum: null,
        maximumInclusive: false,
        minimum: 0,
        minimumInclusive: false,
      },
      id: "potassium-input",
      inputKey: POTASSIUM_INPUT_KEY,
      nextNodeId: "potassium-severity-branch",
      precision: 2,
      prompt: "Enter the latest confirmed potassium result.",
      sourceReferences: [severityReference],
      title: "Potassium result",
      type: "numeric-input",
      unit: POTASSIUM_UNIT,
    },
    {
      branches: severityBranches,
      id: "potassium-severity-branch",
      inputKey: POTASSIUM_INPUT_KEY,
      noMatchBranch: {
        branchId: "no-exact-source-band",
        label: "No exact source severity band matched",
        nextNodeId: "outside-source-bands",
      },
      sourceReferences: [severityReference],
      title: "Classify potassium severity",
      type: "numeric-branch",
      unit: POTASSIUM_UNIT,
    },
    {
      actions: commonInitialChecks,
      id: "mild-initial-checks",
      nextNodeId: "mild-classification-review",
      sourceReferences: [initialChecksReference],
      title: "Mild hyperkalaemia initial checks",
      type: "action-group",
    },
    {
      actions: [...commonInitialChecks, ecgCheck],
      id: "moderate-initial-checks",
      nextNodeId: "moderate-classification-review",
      sourceReferences: [initialChecksReference],
      title: "Moderate hyperkalaemia initial checks",
      type: "action-group",
    },
    {
      branches: [
        {
          branchId: "severe-below-seven",
          label: "Severe result below 7.0 mmol/L",
          nextNodeId: "severe-initial-checks",
          range: {
            maximum: 7,
            maximumInclusive: false,
            minimum: 6.5,
            minimumInclusive: true,
          },
        },
        {
          branchId: "seven-or-higher",
          label: "Result at or above 7.0 mmol/L",
          nextNodeId: "seven-or-higher-warning",
          range: {
            maximum: null,
            maximumInclusive: false,
            minimum: 7,
            minimumInclusive: true,
          },
        },
      ],
      id: "severe-urgent-threshold-branch",
      inputKey: POTASSIUM_INPUT_KEY,
      noMatchBranch: {
        branchId: "unexpected-severe-value",
        label: "Severe threshold did not match",
        nextNodeId: "outside-source-bands",
      },
      sourceReferences: [sevenPlusReference],
      title: "Check the urgent 7.0 mmol/L threshold",
      type: "numeric-branch",
      unit: POTASSIUM_UNIT,
    },
    {
      id: "seven-or-higher-warning",
      nextNodeId: "severe-initial-checks",
      sourceReferences: [sevenPlusReference],
      title: "Do not wait for ECG",
      type: "warning",
      warnings: [
        {
          message:
            "If potassium is at or above 7.0 mmol/L, do not delay administering calcium gluconate while awaiting ECG.",
          severity: "critical",
          sourceReferences: [sevenPlusReference],
          warningId: "do-not-delay-calcium-for-ecg",
        },
      ],
    },
    {
      actions: [...commonInitialChecks, ecgCheck],
      id: "severe-initial-checks",
      nextNodeId: "severe-classification-review",
      sourceReferences: [initialChecksReference],
      title: "Severe hyperkalaemia initial checks",
      type: "action-group",
    },
    {
      id: "mild-classification-review",
      outcome: "requires-clinical-review",
      reason:
        "Mild hyperkalaemia and its initial checks were transcribed from the supplied protocol and await clinical review. No treatment instruction has been generated.",
      sourceReferences: [severityReference, initialChecksReference],
      title: "Mild classification review",
      type: "stop",
    },
    {
      id: "moderate-classification-review",
      outcome: "requires-clinical-review",
      reason:
        "Moderate hyperkalaemia and its initial checks were transcribed from the supplied protocol and await clinical review. No treatment instruction has been generated.",
      sourceReferences: [severityReference, initialChecksReference],
      title: "Moderate classification review",
      type: "stop",
    },
    {
      id: "severe-classification-review",
      outcome: "requires-clinical-review",
      reason:
        "Severe hyperkalaemia and its initial checks were transcribed from the supplied protocol and await clinical review. Treatment details are not implemented in this subtask.",
      sourceReferences: [severityReference, initialChecksReference],
      title: "Severe classification review",
      type: "stop",
    },
    {
      id: "outside-source-bands",
      outcome: "unsupported",
      reason:
        "The entered potassium result does not match an exact severity band printed in the supplied protocol. No classification or management instruction has been generated.",
      sourceReferences: [severityReference],
      title: "No exact source band",
      type: "stop",
    },
  ],
  pathwayId: "hyperkalaemia-potassium-severity",
  reviewMetadata: {
    approvedBy: null,
    approvedOn: null,
    notes: [
      "Severity bands and initial checks are transcribed from page 2 of the supplied Trust protocol.",
      "Results reported between the printed one-decimal bands are not rounded or inferred.",
      "ECG morphology, treatment doses, timed management and ongoing monitoring are deferred to later reviewed subtasks.",
      "The source review is due in November 2026.",
    ],
    reviewedBy: null,
    reviewedOn: null,
    status: "awaiting-clinical-review",
  },
  sourceIds: [HYPERKALAEMIA_SOURCE_ID],
  status: "awaiting-clinical-review",
  version: "0.1.0",
};

const severityEngine = createPathwayEngine(pathwayDefinitionInput);

export const hyperkalaemiaSeverityPathwayDefinition = severityEngine.definition;

export type HyperkalaemiaSeverityEvaluation =
  | {
      band: Readonly<HyperkalaemiaSeverityBand>;
      kind: "classified";
      snapshot: PathwayEvaluationSnapshot;
      unit: typeof POTASSIUM_UNIT;
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
      unit: typeof POTASSIUM_UNIT;
      value: number;
    };

export function evaluateHyperkalaemiaSeverity(
  value: number,
  unit: string = POTASSIUM_UNIT,
): HyperkalaemiaSeverityEvaluation {
  const snapshot = severityEngine.evaluate({
    inputs: {
      [POTASSIUM_INPUT_KEY]: { kind: "numeric", unit, value },
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
    (candidate) => candidate.nodeId === "potassium-severity-branch",
  );
  const band = HYPERKALAEMIA_SEVERITY_BANDS.find(
    (candidate) => candidate.branchId === classification?.branchId,
  );

  if (band) {
    return {
      band,
      kind: "classified",
      snapshot,
      unit: POTASSIUM_UNIT,
      value,
    };
  }

  return {
    kind: "unsupported",
    message:
      snapshot.stopReason ??
      "No exact severity band in the supplied Hyperkalaemia protocol matched this result.",
    snapshot,
    unit: POTASSIUM_UNIT,
    value,
  };
}

function toInputMessage(snapshot: PathwayEvaluationSnapshot): string {
  const message = snapshot.issues[0]?.message ?? "The potassium result could not be validated.";

  if (/expected unit/i.test(message)) {
    return `Use ${POTASSIUM_UNIT} for the potassium result.`;
  }

  if (/decimal places/i.test(message)) {
    return "Enter potassium with no more than 2 decimal places.";
  }

  if (/accepted range/i.test(message)) {
    return `Enter a potassium result greater than 0 ${POTASSIUM_UNIT}.`;
  }

  return "Enter a finite numeric potassium result.";
}
