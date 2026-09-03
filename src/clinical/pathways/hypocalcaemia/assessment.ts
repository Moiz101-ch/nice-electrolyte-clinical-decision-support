import {
  createPathwayEngine,
  type PathwayEvaluationSnapshot,
  type PathwayInputDatum,
} from "../../engine/index.ts";
import type { NumericRange, PathwayDefinition, PathwayNode } from "../schema.ts";

export const HYPOCALCAEMIA_SOURCE_ID = "YSTHFT-HYPOCALCAEMIA-V4";
export const ADJUSTED_CALCIUM_INPUT_KEY = "adjustedCalcium";
export const ADJUSTED_CALCIUM_UNIT = "mmol/L";

export const HYPOCALCAEMIA_SYMPTOMS = [
  { group: "neuromuscular", label: "Weakness", value: "weakness" },
  { group: "neuromuscular", label: "Muscle cramps", value: "muscle-cramps" },
  {
    group: "neuromuscular",
    label: "Paraesthesia",
    value: "paraesthesia",
  },
  { group: "neuromuscular", label: "Tetany", value: "tetany" },
  {
    group: "neuromuscular",
    label: "Carpopedal spasm",
    value: "carpopedal-spasm",
  },
  {
    group: "neuromuscular",
    label: "Chvostek's sign",
    value: "chvostek-sign",
  },
  {
    group: "neuromuscular",
    label: "Trousseau's sign",
    value: "trousseau-sign",
  },
  { group: "neurological", label: "Confusion", value: "confusion" },
  { group: "neurological", label: "Seizures", value: "seizures" },
  {
    group: "neurological",
    label: "Behavioural or psychiatric change",
    value: "behavioural-psychiatric-change",
  },
  { group: "other", label: "Papilloedema", value: "papilloedema" },
  { group: "other", label: "Heart failure", value: "heart-failure" },
] as const;

export type HypocalcaemiaSymptom = (typeof HYPOCALCAEMIA_SYMPTOMS)[number]["value"];
export type AlbuminAdjustmentStatus = "confirmed" | "not-confirmed" | "unable";
export type RateOfFallStatus = "rapid" | "not-rapid" | "unable";
export type EcgAssessmentStatus = "changes-confirmed" | "no-changes" | "unable";
export type MagnesiumStatus = "below-range" | "not-below-range" | "unavailable";
export type RenalFunctionStatus = "renal-failure" | "no-renal-failure" | "unable";
export type SurgeryStatus = "recent-surgery" | "no-recent-surgery" | "unable";
export type PhosphateStatus = "high" | "low" | "within-range" | "unavailable";
export type AlkalinePhosphataseStatus = "high" | "not-high" | "unavailable";
export type PthStatus = "low" | "not-low" | "unavailable";
export type VitaminDStatus = "deficient" | "not-deficient" | "unavailable";

export interface HypocalcaemiaAssessmentInputs {
  adjustedCalcium?: number | undefined;
  albuminAdjustment?: AlbuminAdjustmentStatus | undefined;
  alkalinePhosphatase?: AlkalinePhosphataseStatus | undefined;
  ecgAssessment?: EcgAssessmentStatus | undefined;
  magnesium?: MagnesiumStatus | undefined;
  phosphate?: PhosphateStatus | undefined;
  pth?: PthStatus | undefined;
  rateOfFall?: RateOfFallStatus | undefined;
  renalFunction?: RenalFunctionStatus | undefined;
  surgery?: SurgeryStatus | undefined;
  symptoms?: readonly (HypocalcaemiaSymptom | "none" | "unable")[] | undefined;
  vitaminD?: VitaminDStatus | undefined;
}

export type HypocalcaemiaSeverity = "mild" | "moderate-severe";

export interface HypocalcaemiaSeverityBand {
  branchId: string;
  label: string;
  range: NumericRange;
  severity: HypocalcaemiaSeverity;
  sourceRangeLabel: string;
}

const mutableSeverityBands: HypocalcaemiaSeverityBand[] = [
  {
    branchId: "moderate-severe-hypocalcaemia",
    label: "Moderate/severe hypocalcaemia",
    range: {
      maximum: 1.9,
      maximumInclusive: false,
      minimum: 0,
      minimumInclusive: false,
    },
    severity: "moderate-severe",
    sourceRangeLabel: "<1.9 mmol/L",
  },
  {
    branchId: "mild-hypocalcaemia",
    label: "Mild hypocalcaemia",
    range: {
      maximum: 2.1,
      maximumInclusive: true,
      minimum: 1.9,
      minimumInclusive: true,
    },
    severity: "mild",
    sourceRangeLabel: "1.9-2.1 mmol/L",
  },
];

for (const band of mutableSeverityBands) {
  Object.freeze(band.range);
  Object.freeze(band);
}

export const HYPOCALCAEMIA_SEVERITY_BANDS: readonly Readonly<HypocalcaemiaSeverityBand>[] =
  Object.freeze(mutableSeverityBands);

const definitionReference = {
  page: 1,
  section: "Hypocalcaemia definition and adjusted calcium",
  sourceId: HYPOCALCAEMIA_SOURCE_ID,
};
const severityReference = {
  page: 1,
  section: "How severe is hypocalcaemia?",
  sourceId: HYPOCALCAEMIA_SOURCE_ID,
};
const symptomsReference = {
  page: 1,
  section: "Signs and symptoms of hypocalcaemia",
  sourceId: HYPOCALCAEMIA_SOURCE_ID,
};
const ecgReference = {
  page: 1,
  section: "ECG changes of hypocalcaemia",
  sourceId: HYPOCALCAEMIA_SOURCE_ID,
};
const diagnosticReference = {
  page: 1,
  section: "Diagnosis of hypocalcaemia - the important questions",
  sourceId: HYPOCALCAEMIA_SOURCE_ID,
};
const emergencyReference = {
  page: 2,
  section: "Severe symptomatic hypocalcaemia is a medical emergency",
  sourceId: HYPOCALCAEMIA_SOURCE_ID,
};

type MultiSelectQuestionNode = Extract<PathwayNode, { type: "multi-select-question" }>;
type SingleChoiceQuestionNode = Extract<PathwayNode, { type: "single-choice-question" }>;

const symptomOptions: MultiSelectQuestionNode["options"] = [
  ...HYPOCALCAEMIA_SYMPTOMS.map((symptom) => ({
    label: symptom.label,
    optionId: symptom.value,
    value: symptom.value,
  })),
  { label: "None of the listed symptoms or signs", optionId: "none", value: "none" },
  { label: "Unable to assess safely", optionId: "unable", value: "unable" },
];
const listedSymptomValues = HYPOCALCAEMIA_SYMPTOMS.map((symptom) => symptom.value);

function symptomNode(id: string, listedSymptomNextNodeId: string): MultiSelectQuestionNode {
  return {
    branches: [
      {
        branchId: `${id}-listed-symptom-confirmed`,
        label: "One or more listed symptoms or signs confirmed",
        nextNodeId: listedSymptomNextNodeId,
        operator: "contains-any",
        values: listedSymptomValues,
      },
      {
        branchId: `${id}-none-confirmed`,
        label: "No listed symptom or sign confirmed",
        nextNodeId: "rate-of-fall-question",
        operator: "contains-any",
        values: ["none"],
      },
      {
        branchId: `${id}-unable-to-assess`,
        label: "Symptoms and signs could not be assessed safely",
        nextNodeId:
          id === "moderate-severe-symptoms"
            ? "symptom-uncertainty-warning"
            : "rate-of-fall-question",
        operator: "contains-any",
        values: ["unable"],
      },
    ],
    fallbackBranch: null,
    id,
    inputKey: "symptoms",
    maximumSelections: HYPOCALCAEMIA_SYMPTOMS.length,
    minimumSelections: 1,
    options: symptomOptions,
    prompt: "Select every source-listed symptom or sign that is clinically confirmed.",
    sourceReferences: [symptomsReference],
    title: "Hypocalcaemia symptoms and signs",
    type: "multi-select-question",
  };
}

function sameTargetOptions(
  options: readonly { label: string; optionId: string; value: string }[],
  nextNodeId: string,
): SingleChoiceQuestionNode["options"] {
  return options.map((option) => ({ ...option, nextNodeId }));
}

const pathwayDefinitionInput: PathwayDefinition = {
  entryNodeId: "adjusted-calcium-input",
  name: "Hypocalcaemia source assessment",
  nodes: [
    {
      acceptedRange: {
        maximum: null,
        maximumInclusive: false,
        minimum: 0,
        minimumInclusive: false,
      },
      id: "adjusted-calcium-input",
      inputKey: ADJUSTED_CALCIUM_INPUT_KEY,
      nextNodeId: "albumin-adjustment-question",
      precision: 3,
      prompt: "Enter the latest laboratory-reported adjusted serum calcium result.",
      sourceReferences: [definitionReference],
      title: "Adjusted serum calcium",
      type: "numeric-input",
      unit: ADJUSTED_CALCIUM_UNIT,
    },
    {
      id: "albumin-adjustment-question",
      inputKey: "albuminAdjustment",
      options: [
        {
          label: "Albumin adjustment confirmed",
          nextNodeId: "adjusted-calcium-severity",
          optionId: "albumin-adjustment-confirmed",
          value: "confirmed",
        },
        {
          label: "Not adjusted for albumin",
          nextNodeId: "albumin-adjustment-required",
          optionId: "albumin-adjustment-not-confirmed",
          value: "not-confirmed",
        },
        {
          label: "Unable to confirm adjustment",
          nextNodeId: "albumin-adjustment-required",
          optionId: "albumin-adjustment-unknown",
          value: "unable",
        },
      ],
      prompt: "Confirm that the entered serum calcium has been adjusted for albumin.",
      sourceReferences: [definitionReference, diagnosticReference],
      title: "Albumin adjustment confirmation",
      type: "single-choice-question",
    },
    {
      branches: [
        ...HYPOCALCAEMIA_SEVERITY_BANDS.map((band) => ({
          branchId: band.branchId,
          label: band.label,
          nextNodeId:
            band.severity === "moderate-severe" ? "moderate-severe-symptoms" : "mild-symptoms",
          range: { ...band.range },
        })),
        {
          branchId: "unclassified-source-gap",
          label: "Below the definition threshold but outside the printed severity bands",
          nextNodeId: "source-boundary-review",
          range: {
            maximum: 2.2,
            maximumInclusive: false,
            minimum: 2.1,
            minimumInclusive: false,
          },
        },
        {
          branchId: "does-not-meet-source-definition",
          label: "Does not meet the supplied hypocalcaemia definition",
          nextNodeId: "not-hypocalcaemia-stop",
          range: {
            maximum: null,
            maximumInclusive: false,
            minimum: 2.2,
            minimumInclusive: true,
          },
        },
      ],
      id: "adjusted-calcium-severity",
      inputKey: ADJUSTED_CALCIUM_INPUT_KEY,
      noMatchBranch: null,
      sourceReferences: [definitionReference, severityReference],
      title: "Classify adjusted calcium",
      type: "numeric-branch",
      unit: ADJUSTED_CALCIUM_UNIT,
    },
    symptomNode("moderate-severe-symptoms", "severe-symptomatic-warning"),
    symptomNode("mild-symptoms", "rate-of-fall-question"),
    {
      id: "severe-symptomatic-warning",
      nextNodeId: "rate-of-fall-question",
      sourceReferences: [emergencyReference],
      title: "Severe symptomatic emergency combination",
      type: "warning",
      warnings: [
        {
          message:
            "The supplied pathway identifies severe symptomatic hypocalcaemia as a medical emergency. This technical assessment does not generate treatment instructions; use the approved local emergency pathway.",
          severity: "critical",
          sourceReferences: [emergencyReference],
          warningId: "severe-symptomatic-medical-emergency",
        },
      ],
    },
    {
      id: "symptom-uncertainty-warning",
      nextNodeId: "rate-of-fall-question",
      sourceReferences: [severityReference, symptomsReference],
      title: "Symptoms could not be assessed",
      type: "warning",
      warnings: [
        {
          message:
            "Symptoms materially affect source severity, but they could not be assessed. No symptomatic emergency classification has been inferred.",
          severity: "caution",
          sourceReferences: [severityReference, symptomsReference],
          warningId: "symptoms-not-assessed",
        },
      ],
    },
    {
      id: "rate-of-fall-question",
      inputKey: "rateOfFall",
      options: sameTargetOptions(
        [
          { label: "Rapid fall clinically confirmed", optionId: "rapid-fall", value: "rapid" },
          {
            label: "Rapid fall not confirmed",
            optionId: "rapid-fall-not-confirmed",
            value: "not-rapid",
          },
          {
            label: "Unable to establish rate",
            optionId: "rate-of-fall-unknown",
            value: "unable",
          },
        ],
        "ecg-assessment-question",
      ),
      prompt:
        "Record whether a rapid calcium fall is clinically established; the source gives no numeric rate threshold.",
      sourceReferences: [severityReference],
      title: "Rate of fall",
      type: "single-choice-question",
    },
    {
      id: "ecg-assessment-question",
      inputKey: "ecgAssessment",
      options: sameTargetOptions(
        [
          {
            label: "Hypocalcaemia ECG changes confirmed",
            optionId: "ecg-changes-confirmed",
            value: "changes-confirmed",
          },
          {
            label: "No hypocalcaemia ECG changes confirmed",
            optionId: "ecg-no-changes",
            value: "no-changes",
          },
          {
            label: "Unable to assess ECG safely",
            optionId: "ecg-unable-to-assess",
            value: "unable",
          },
        ],
        "magnesium-question",
      ),
      prompt: "Record the clinician-confirmed ECG assessment.",
      sourceReferences: [ecgReference],
      title: "ECG assessment",
      type: "single-choice-question",
    },
    {
      id: "magnesium-question",
      inputKey: "magnesium",
      options: sameTargetOptions(
        [
          {
            label: "Below the local laboratory range",
            optionId: "magnesium-below-range",
            value: "below-range",
          },
          {
            label: "Not below the local laboratory range",
            optionId: "magnesium-not-below-range",
            value: "not-below-range",
          },
          {
            label: "Result unavailable",
            optionId: "magnesium-unavailable",
            value: "unavailable",
          },
        ],
        "renal-function-question",
      ),
      prompt: "Classify serum magnesium against the reporting laboratory's reference range.",
      sourceReferences: [diagnosticReference],
      title: "Serum magnesium",
      type: "single-choice-question",
    },
    {
      id: "renal-function-question",
      inputKey: "renalFunction",
      options: sameTargetOptions(
        [
          {
            label: "Renal failure present",
            optionId: "renal-failure-present",
            value: "renal-failure",
          },
          {
            label: "Renal failure not present",
            optionId: "renal-failure-not-present",
            value: "no-renal-failure",
          },
          {
            label: "Unable to establish safely",
            optionId: "renal-function-unknown",
            value: "unable",
          },
        ],
        "surgery-context-question",
      ),
      prompt: "Record whether renal failure is clinically established from the available results.",
      sourceReferences: [diagnosticReference],
      title: "Renal function",
      type: "single-choice-question",
    },
    {
      id: "surgery-context-question",
      inputKey: "surgery",
      options: [
        {
          label: "Recent thyroid or parathyroid surgery",
          nextNodeId: "assessment-review-stop",
          optionId: "recent-thyroid-parathyroid-surgery",
          value: "recent-surgery",
        },
        {
          label: "No recent thyroid or parathyroid surgery",
          nextNodeId: "phosphate-question",
          optionId: "no-recent-thyroid-parathyroid-surgery",
          value: "no-recent-surgery",
        },
        {
          label: "Surgical context unavailable",
          nextNodeId: "phosphate-question",
          optionId: "surgery-context-unknown",
          value: "unable",
        },
      ],
      prompt: "Record the recent thyroid or parathyroid surgery context.",
      sourceReferences: [diagnosticReference],
      title: "Surgical context",
      type: "single-choice-question",
    },
    {
      id: "phosphate-question",
      inputKey: "phosphate",
      options: sameTargetOptions(
        [
          { label: "High", optionId: "phosphate-high", value: "high" },
          { label: "Low", optionId: "phosphate-low", value: "low" },
          {
            label: "Within the local laboratory range",
            optionId: "phosphate-within-range",
            value: "within-range",
          },
          { label: "Result unavailable", optionId: "phosphate-unavailable", value: "unavailable" },
        ],
        "alkaline-phosphatase-question",
      ),
      prompt: "Classify phosphate against the reporting laboratory's reference range.",
      sourceReferences: [diagnosticReference],
      title: "Phosphate",
      type: "single-choice-question",
    },
    {
      id: "alkaline-phosphatase-question",
      inputKey: "alkalinePhosphatase",
      options: sameTargetOptions(
        [
          { label: "High", optionId: "alp-high", value: "high" },
          { label: "Not high", optionId: "alp-not-high", value: "not-high" },
          { label: "Result unavailable", optionId: "alp-unavailable", value: "unavailable" },
        ],
        "pth-question",
      ),
      prompt: "Classify alkaline phosphatase against the reporting laboratory's reference range.",
      sourceReferences: [diagnosticReference],
      title: "Alkaline phosphatase",
      type: "single-choice-question",
    },
    {
      id: "pth-question",
      inputKey: "pth",
      options: sameTargetOptions(
        [
          { label: "Low", optionId: "pth-low", value: "low" },
          { label: "Not low", optionId: "pth-not-low", value: "not-low" },
          { label: "Result unavailable", optionId: "pth-unavailable", value: "unavailable" },
        ],
        "vitamin-d-question",
      ),
      prompt: "Classify PTH against the reporting laboratory's reference range.",
      sourceReferences: [diagnosticReference],
      title: "Parathyroid hormone",
      type: "single-choice-question",
    },
    {
      id: "vitamin-d-question",
      inputKey: "vitaminD",
      options: sameTargetOptions(
        [
          {
            label: "Deficiency confirmed",
            optionId: "vitamin-d-deficient",
            value: "deficient",
          },
          {
            label: "Deficiency not confirmed",
            optionId: "vitamin-d-not-deficient",
            value: "not-deficient",
          },
          {
            label: "Result unavailable",
            optionId: "vitamin-d-unavailable",
            value: "unavailable",
          },
        ],
        "assessment-review-stop",
      ),
      prompt: "Record whether vitamin D deficiency is confirmed from the available result.",
      sourceReferences: [diagnosticReference],
      title: "Vitamin D",
      type: "single-choice-question",
    },
    {
      id: "assessment-review-stop",
      outcome: "requires-clinical-review",
      reason:
        "The source-supported Hypocalcaemia assessment is complete. Diagnostic findings are recorded for review; no cause diagnosis or management instruction has been generated.",
      sourceReferences: [
        definitionReference,
        severityReference,
        symptomsReference,
        ecgReference,
        diagnosticReference,
      ],
      title: "Hypocalcaemia assessment review",
      type: "stop",
    },
    {
      id: "albumin-adjustment-required",
      outcome: "unsupported",
      reason:
        "The supplied severity thresholds use adjusted serum calcium. Confirm an albumin-adjusted result before classification.",
      sourceReferences: [definitionReference, diagnosticReference],
      title: "Albumin adjustment required",
      type: "stop",
    },
    {
      id: "source-boundary-review",
      outcome: "requires-clinical-review",
      reason:
        "The result is below the supplied definition threshold of 2.2 mmol/L but above the printed mild band ending at 2.1 mmol/L. No severity has been inferred across this source gap.",
      sourceReferences: [definitionReference, severityReference],
      title: "Unclassified source boundary",
      type: "stop",
    },
    {
      id: "not-hypocalcaemia-stop",
      outcome: "unsupported",
      reason:
        "The entered adjusted calcium does not meet the supplied pathway definition of hypocalcaemia below 2.2 mmol/L.",
      sourceReferences: [definitionReference],
      title: "Definition threshold not met",
      type: "stop",
    },
  ],
  pathwayId: "hypocalcaemia-source-assessment",
  reviewMetadata: {
    approvedBy: null,
    approvedOn: null,
    notes: [
      "Assessment content is transcribed from page 1 of the supplied Trust pathway.",
      "The source-defined gap above 2.1 mmol/L and below 2.2 mmol/L is preserved as an unclassified review state.",
      "The source ECG image is not reused because no approved visual asset is registered; the UI presents a labelled placeholder.",
      "Laboratory statuses use the reporting laboratory's reference ranges because the source does not define numeric thresholds for magnesium, phosphate, alkaline phosphatase, PTH or vitamin D.",
      "Cause confirmation, treatment and monitoring are deferred to later reviewed subtasks.",
    ],
    reviewedBy: null,
    reviewedOn: null,
    status: "awaiting-clinical-review",
  },
  sourceIds: [HYPOCALCAEMIA_SOURCE_ID],
  status: "awaiting-clinical-review",
  version: "0.1.0",
};

const assessmentEngine = createPathwayEngine(pathwayDefinitionInput);

export const hypocalcaemiaAssessmentPathwayDefinition = assessmentEngine.definition;

export function evaluateHypocalcaemiaAssessment(
  inputs: HypocalcaemiaAssessmentInputs,
): PathwayEvaluationSnapshot {
  const engineInputs: Record<string, PathwayInputDatum> = {};

  if (inputs.adjustedCalcium !== undefined) {
    engineInputs[ADJUSTED_CALCIUM_INPUT_KEY] = {
      kind: "numeric",
      unit: ADJUSTED_CALCIUM_UNIT,
      value: inputs.adjustedCalcium,
    };
  }

  addSingleChoice(engineInputs, "albuminAdjustment", inputs.albuminAdjustment);
  addSingleChoice(engineInputs, "rateOfFall", inputs.rateOfFall);
  addSingleChoice(engineInputs, "ecgAssessment", inputs.ecgAssessment);
  addSingleChoice(engineInputs, "magnesium", inputs.magnesium);
  addSingleChoice(engineInputs, "renalFunction", inputs.renalFunction);
  addSingleChoice(engineInputs, "surgery", inputs.surgery);
  addSingleChoice(engineInputs, "phosphate", inputs.phosphate);
  addSingleChoice(engineInputs, "alkalinePhosphatase", inputs.alkalinePhosphatase);
  addSingleChoice(engineInputs, "pth", inputs.pth);
  addSingleChoice(engineInputs, "vitaminD", inputs.vitaminD);

  if (inputs.symptoms !== undefined && inputs.symptoms.length > 0) {
    engineInputs.symptoms = { kind: "multi-select", values: [...inputs.symptoms] };
  }

  return assessmentEngine.evaluate({ inputs: engineInputs });
}

export type HypocalcaemiaSeverityEvaluation =
  | {
      band: Readonly<HypocalcaemiaSeverityBand>;
      kind: "classified";
      snapshot: PathwayEvaluationSnapshot;
      value: number;
    }
  | {
      kind: "boundary-gap" | "not-hypocalcaemia";
      message: string;
      snapshot: PathwayEvaluationSnapshot;
      value: number;
    }
  | {
      kind: "invalid";
      message: string;
      snapshot: PathwayEvaluationSnapshot;
    };

export function evaluateHypocalcaemiaSeverity(value: number): HypocalcaemiaSeverityEvaluation {
  const snapshot = evaluateHypocalcaemiaAssessment({
    adjustedCalcium: value,
    albuminAdjustment: "confirmed",
  });
  const classification = snapshot.derivedClassifications.find(
    (candidate) => candidate.nodeId === "adjusted-calcium-severity",
  );
  const band = HYPOCALCAEMIA_SEVERITY_BANDS.find(
    (candidate) => candidate.branchId === classification?.branchId,
  );

  if (band) {
    return { band, kind: "classified", snapshot, value };
  }

  if (classification?.branchId === "unclassified-source-gap") {
    return {
      kind: "boundary-gap",
      message: snapshot.stopReason ?? "The source does not define a severity for this result.",
      snapshot,
      value,
    };
  }

  if (classification?.branchId === "does-not-meet-source-definition") {
    return {
      kind: "not-hypocalcaemia",
      message: snapshot.stopReason ?? "The source definition threshold is not met.",
      snapshot,
      value,
    };
  }

  return {
    kind: "invalid",
    message: toInputMessage(snapshot),
    snapshot,
  };
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

function toInputMessage(snapshot: PathwayEvaluationSnapshot): string {
  const message = snapshot.issues[0]?.message ?? "The adjusted calcium could not be validated.";

  if (/decimal places/i.test(message)) {
    return "Enter adjusted calcium with no more than 3 decimal places.";
  }

  if (/accepted range/i.test(message)) {
    return `Enter an adjusted calcium result greater than 0 ${ADJUSTED_CALCIUM_UNIT}.`;
  }

  return "Enter a finite adjusted calcium result.";
}
