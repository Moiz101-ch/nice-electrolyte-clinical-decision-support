import { z } from "zod";

import { createPathwayEngine, type PathwayCalculationResult } from "../../engine/index.ts";
import { DKA_SOURCE_ID, type DkaSourceStepNumber } from "./source-currentness.ts";

export const DKA_STEPS_ONE_TO_FOUR_VERSION = "0.2.0";

const nonNegativeMeasurement = z.number().finite().nonnegative().nullable();
const assessmentSchema = z
  .object({
    abcdeComplete: z.boolean(),
    earlyWarningScoreComplete: z.boolean(),
    fbcObtained: z.boolean(),
    gcsComplete: z.boolean(),
    ivAccessObtained: z.boolean(),
    laboratoryGlucoseObtained: z.boolean(),
    uAndEObtained: z.boolean(),
    venousBloodGasObtained: z.boolean(),
  })
  .strict();

export const dkaStepsOneToFourInputSchema = z
  .object({
    ageYears: z.number().int().nonnegative(),
    assessment: assessmentSchema,
    bicarbonateMmolL: nonNegativeMeasurement,
    bloodGlucoseMmolL: nonNegativeMeasurement,
    bloodKetonesMmolL: nonNegativeMeasurement,
    longActingInsulinNormallyTaken: z.boolean().nullable(),
    repeatSystolicBpMmhg: nonNegativeMeasurement,
    systolicBpMmhg: nonNegativeMeasurement,
    venousPh: z.number().finite().min(0).max(14).nullable(),
    weightKg: z.number().finite().positive().nullable(),
  })
  .strict();

export type DkaStepsOneToFourInput = z.infer<typeof dkaStepsOneToFourInputSchema>;
export type DkaPreviewStepNumber = Extract<DkaSourceStepNumber, 1 | 2 | 3 | 4>;
export type DkaPreviewStageStatus = "complete" | "not-reached" | "requires-review" | "stopped";

export interface DkaPreviewStage {
  readonly findings: readonly string[];
  readonly sourceReference: {
    readonly page: number;
    readonly section: string;
    readonly sourceId: string;
  };
  readonly status: DkaPreviewStageStatus;
  readonly stepNumber: DkaPreviewStepNumber;
  readonly summary: string;
}

export interface DkaStepsOneToFourResult {
  readonly activeClinicalOutput: false;
  readonly calculation: PathwayCalculationResult | null;
  readonly inputIssues: readonly string[];
  readonly stages: readonly [DkaPreviewStage, DkaPreviewStage, DkaPreviewStage, DkaPreviewStage];
  readonly version: typeof DKA_STEPS_ONE_TO_FOUR_VERSION;
}

export interface DkaSyntheticCase {
  readonly id: string;
  readonly input: DkaStepsOneToFourInput;
  readonly label: string;
  readonly summary: string;
}

const sourceReference = (section: string) =>
  Object.freeze({ page: 1, section, sourceId: DKA_SOURCE_ID });

const stepReferences = Object.freeze([
  sourceReference("Initial Assessment"),
  sourceReference("Confirm the Diagnosis"),
  sourceReference("Initial Fluid Resuscitation"),
  sourceReference("Start Fixed Rate IV Insulin Infusion"),
] as const);

const insulinEngine = createPathwayEngine({
  entryNodeId: "record-weight",
  name: "DKA initial insulin rate technical preview",
  nodes: [
    {
      acceptedRange: {
        maximum: null,
        maximumInclusive: false,
        minimum: 0,
        minimumInclusive: false,
      },
      id: "record-weight",
      inputKey: "dka.weightKg",
      nextNodeId: "calculate-initial-rate",
      precision: 8,
      prompt: "Synthetic weight",
      sourceReferences: [stepReferences[3]],
      title: "Record synthetic weight",
      type: "numeric-input",
      unit: "kg",
    },
    {
      formula: "min(weight in kg x 0.1 units/kg/hour, 15 units/hour)",
      id: "calculate-initial-rate",
      nextNodeId: "review-only-stop",
      operands: [
        { key: "dka.weightKg", kind: "numeric-input" },
        { kind: "constant", value: 0.1 },
      ],
      operation: "multiply",
      outputKey: "dka.initialInsulinUnitsPerHour",
      precision: 8,
      roundingMode: "half-away-from-zero",
      sourceDefinedLimit: { kind: "maximum", unit: "units/hour", value: 15 },
      sourceReferences: [stepReferences[3]],
      title: "Source-mapped initial rate",
      type: "calculation",
      unit: "units/hour",
    },
    {
      id: "review-only-stop",
      outcome: "requires-clinical-review",
      reason: "Technical preview only; clinical activation remains blocked.",
      sourceReferences: [stepReferences[3]],
      title: "Clinical review required",
      type: "stop",
    },
  ],
  pathwayId: "dka-initial-insulin-technical-preview",
  reviewMetadata: {
    approvedBy: null,
    approvedOn: null,
    notes: ["Source review overdue; technical preview is not clinical output."],
    reviewedBy: null,
    reviewedOn: null,
    status: "draft",
  },
  sourceIds: [DKA_SOURCE_ID],
  status: "draft",
  version: DKA_STEPS_ONE_TO_FOUR_VERSION,
});

const completeAssessment = Object.freeze({
  abcdeComplete: true,
  earlyWarningScoreComplete: true,
  fbcObtained: true,
  gcsComplete: true,
  ivAccessObtained: true,
  laboratoryGlucoseObtained: true,
  uAndEObtained: true,
  venousBloodGasObtained: true,
});

const standardCase: DkaStepsOneToFourInput = Object.freeze({
  ageYears: 35,
  assessment: completeAssessment,
  bicarbonateMmolL: 12,
  bloodGlucoseMmolL: 18,
  bloodKetonesMmolL: 4.2,
  longActingInsulinNormallyTaken: true,
  repeatSystolicBpMmhg: null,
  systolicBpMmhg: 110,
  venousPh: 7.21,
  weightKg: 72,
});

export const dkaSyntheticCases: readonly DkaSyntheticCase[] = Object.freeze([
  syntheticCase(
    "confirmed",
    "Confirmed criteria",
    "Direct fluid branch; uncapped rate",
    standardCase,
  ),
  syntheticCase(
    "not-dka",
    "Glucose boundary",
    "Exactly 11 mmol/L does not meet the source criterion",
    {
      ...standardCase,
      bloodGlucoseMmolL: 11,
    },
  ),
  syntheticCase(
    "pressure-recovered",
    "Pressure recovers",
    "Initial low pressure; capped rate after repeat",
    {
      ...standardCase,
      repeatSystolicBpMmhg: 95,
      systolicBpMmhg: 80,
      weightKg: 160,
    },
  ),
  syntheticCase(
    "pressure-low",
    "Pressure remains low",
    "Repeat pressure below 90; senior review branch",
    {
      ...standardCase,
      repeatSystolicBpMmhg: 85,
      systolicBpMmhg: 80,
    },
  ),
  syntheticCase(
    "pressure-boundary",
    "Repeat pressure is 90",
    "Unspecified repeat boundary stops the preview",
    {
      ...standardCase,
      repeatSystolicBpMmhg: 90,
      systolicBpMmhg: 90,
    },
  ),
  syntheticCase(
    "acid-base-unknown",
    "Acid-base incomplete",
    "A missing second measure prevents confirmation",
    {
      ...standardCase,
      bicarbonateMmolL: null,
      venousPh: 7.3,
    },
  ),
  syntheticCase("under-eighteen", "Under 18", "Outside the adult pathway", {
    ...standardCase,
    ageYears: 17,
  }),
]);

export function evaluateDkaStepsOneToFour(input: unknown): DkaStepsOneToFourResult {
  const parsed = dkaStepsOneToFourInputSchema.safeParse(input);
  const stages: [DkaPreviewStage, DkaPreviewStage, DkaPreviewStage, DkaPreviewStage] = [
    stage(1, "Initial assessment", "not-reached"),
    stage(2, "Diagnosis not assessed", "not-reached"),
    stage(3, "Fluid branch not assessed", "not-reached"),
    stage(4, "Insulin calculation not assessed", "not-reached"),
  ];

  if (!parsed.success) {
    stages[0] = stage(1, "Invalid synthetic input", "requires-review");
    return result(
      stages,
      null,
      parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`),
    );
  }

  const values = parsed.data;
  if (values.ageYears < 18) {
    stages[0] = stage(1, "Outside the adult pathway", "stopped", [
      "The supplied pathway explicitly excludes people under 18.",
    ]);
    return result(stages);
  }

  const missingChecks = [
    [values.assessment.abcdeComplete, "ABCDE"],
    [values.assessment.gcsComplete, "GCS"],
    [values.assessment.earlyWarningScoreComplete, "NEWS/MEWS"],
    [values.assessment.fbcObtained, "FBC"],
    [values.assessment.uAndEObtained, "U&E"],
    [values.assessment.laboratoryGlucoseObtained, "laboratory glucose"],
    [values.assessment.venousBloodGasObtained, "venous blood gas"],
  ]
    .filter(([confirmed]) => confirmed === false)
    .map(([, label]) => label as string);

  if (!values.assessment.ivAccessObtained) {
    stages[0] = stage(1, "IV access not obtained", "requires-review", [
      "Source branch: request senior doctor or critical-care support immediately.",
    ]);
    return result(stages);
  }

  if (missingChecks.length > 0) {
    stages[0] = stage(1, "Initial assessment incomplete", "requires-review", [
      `Unconfirmed source-listed checks: ${missingChecks.join(", ")}.`,
    ]);
    return result(stages);
  }

  const missingMeasurements = [
    [values.bloodGlucoseMmolL, "capillary glucose"],
    [values.bloodKetonesMmolL, "blood ketones"],
    [values.weightKg, "weight"],
  ]
    .filter(([value]) => value === null)
    .map(([, label]) => label as string);

  if (missingMeasurements.length > 0) {
    stages[0] = stage(1, "Initial measurements incomplete", "requires-review", [
      `Missing source-listed measurements: ${missingMeasurements.join(", ")}.`,
    ]);
    return result(stages);
  }

  stages[0] = stage(1, "Initial checks confirmed", "complete", [
    "ABCDE, GCS, NEWS/MEWS, IV access, glucose, ketones, weight and source-listed initial blood tests are confirmed in this synthetic case.",
  ]);

  const glucose = values.bloodGlucoseMmolL;
  const ketones = values.bloodKetonesMmolL;
  const ph = values.venousPh;
  const bicarbonate = values.bicarbonateMmolL;
  const glucoseFailed = glucose !== null && glucose <= 11;
  const ketonesFailed = ketones !== null && ketones <= 3;
  const acidBaseMet = (ph !== null && ph < 7.3) || (bicarbonate !== null && bicarbonate < 15);
  const acidBaseFailed = ph !== null && ph >= 7.3 && bicarbonate !== null && bicarbonate >= 15;

  if (glucoseFailed || ketonesFailed || acidBaseFailed) {
    stages[1] = stage(2, "Source criteria not all met", "stopped", [
      "The source requires glucose >11, ketones >3, and pH <7.3 or bicarbonate <15.",
      "Source branch: not DKA by these criteria; senior advice may be needed about other management.",
    ]);
    return result(stages);
  }

  if (glucose === null || ketones === null || !acidBaseMet) {
    stages[1] = stage(2, "Diagnosis cannot be confirmed", "requires-review", [
      "A required result is absent or the acid-base alternatives cannot yet be resolved.",
    ]);
    return result(stages);
  }

  stages[1] = stage(2, "All three diagnostic categories met", "complete", [
    `Glucose ${glucose} >11 mmol/L; ketones ${ketones} >3 mmol/L.`,
    `Acid-base category met by ${ph !== null && ph < 7.3 ? `pH ${ph} <7.3` : `bicarbonate ${bicarbonate} <15 mmol/L`}.`,
    "Source branch: inform critical-care outreach and the diabetes team.",
  ]);

  const initialPressure = values.systolicBpMmhg;
  if (initialPressure === null) {
    stages[2] = stage(3, "Systolic pressure required", "requires-review");
    return result(stages);
  }

  if (initialPressure > 90) {
    stages[2] = stage(3, "Above 90 mmHg branch", "complete", [
      "Source branch: 1 L of 0.9% sodium chloride over 1 hour.",
      "Source warning: severe hypokalaemia can occur; monitor potassium regularly during treatment.",
    ]);
  } else {
    const repeatPressure = values.repeatSystolicBpMmhg;
    const initialFinding =
      "Source branch: 500 mL of 0.9% sodium chloride over 10-15 minutes, then recheck pressure.";
    const potassiumCaution =
      "Source warning: potassium chloride may be required if more than 1 L saline has already been given for hypotensive resuscitation; monitor potassium regularly.";

    if (repeatPressure === null) {
      stages[2] = stage(3, "Repeat pressure required", "requires-review", [
        initialFinding,
        potassiumCaution,
      ]);
      return result(stages);
    }

    if (repeatPressure === 90) {
      stages[2] = stage(3, "Repeat pressure boundary is unresolved", "requires-review", [
        initialFinding,
        potassiumCaution,
        "The source specifies >90 and <90 after the recheck, but not exactly 90 mmHg. No next fluid branch is inferred.",
      ]);
      return result(stages);
    }

    if (repeatPressure < 90) {
      stages[2] = stage(3, "Pressure remains below 90 mmHg", "requires-review", [
        initialFinding,
        potassiumCaution,
        "Source branch: a further 500 mL of 0.9% sodium chloride over 10-15 minutes; request senior review and consider ICU.",
      ]);
      return result(stages);
    }

    stages[2] = stage(3, "Pressure rises above 90 mmHg", "complete", [
      initialFinding,
      "Source directs the pathway to the above-90 branch after recheck: 1 L of 0.9% sodium chloride over 1 hour.",
      potassiumCaution,
    ]);
  }

  if (values.weightKg === null || values.longActingInsulinNormallyTaken === null) {
    stages[3] = stage(4, "Weight and insulin context required", "requires-review", [
      "Both weight and the usual long-acting insulin status must be explicitly confirmed for this preview.",
    ]);
    return result(stages);
  }

  const calculationSnapshot = insulinEngine.evaluate({
    inputs: { "dka.weightKg": { kind: "numeric", unit: "kg", value: values.weightKg } },
  });
  const calculation = calculationSnapshot.calculations[0];
  if (calculationSnapshot.status !== "requires-clinical-review" || !calculation) {
    stages[3] = stage(4, "Calculation blocked", "requires-review", [
      "The declared calculation engine did not return a valid result.",
    ]);
    return result(
      stages,
      null,
      calculationSnapshot.issues.map(({ message }) => message),
    );
  }

  stages[3] = stage(4, "Source rate calculated for synthetic weight", "complete", [
    "Source preparation: 50 units of soluble insulin in 49.5 mL of 0.9% sodium chloride, final volume 50 mL.",
    values.longActingInsulinNormallyTaken
      ? "Source context: usual long-acting insulin is continued when normally taken."
      : "No usual long-acting insulin is recorded in this synthetic case.",
    "The source-defined maximum is 15 units/hour; no clinical prescription is generated.",
  ]);
  return result(stages, calculation);
}

function stage(
  stepNumber: DkaPreviewStepNumber,
  summary: string,
  status: DkaPreviewStageStatus,
  findings: readonly string[] = [],
): DkaPreviewStage {
  const reference = stepReferences[stepNumber - 1]!;
  return Object.freeze({
    findings: Object.freeze([...findings]),
    sourceReference: Object.freeze({
      page: reference.page,
      section: reference.section,
      sourceId: reference.sourceId,
    }),
    status,
    stepNumber,
    summary,
  });
}

function result(
  stages: readonly [DkaPreviewStage, DkaPreviewStage, DkaPreviewStage, DkaPreviewStage],
  calculation: PathwayCalculationResult | null = null,
  inputIssues: readonly string[] = [],
): DkaStepsOneToFourResult {
  return Object.freeze({
    activeClinicalOutput: false,
    calculation,
    inputIssues: Object.freeze([...inputIssues]),
    stages: Object.freeze([...stages] as const),
    version: DKA_STEPS_ONE_TO_FOUR_VERSION,
  });
}

function syntheticCase(
  id: string,
  label: string,
  summary: string,
  input: DkaStepsOneToFourInput,
): DkaSyntheticCase {
  return Object.freeze({
    id,
    input: Object.freeze({ ...input }),
    label,
    summary,
  });
}
