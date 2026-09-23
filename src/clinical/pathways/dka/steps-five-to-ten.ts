import { z } from "zod";

import { createPathwayEngine, type PathwayCalculationResult } from "../../engine/index.ts";
import {
  dkaStepsOneToFourInputSchema,
  dkaSyntheticCases,
  evaluateDkaStepsOneToFour,
} from "./steps-one-to-four.ts";
import { DKA_SOURCE_ID, type DkaSourceStepNumber } from "./source-currentness.ts";

export const DKA_STEPS_FIVE_TO_TEN_VERSION = "0.3.0";

const measurement = z.number().finite().nonnegative().nullable();
const positiveMeasurement = z.number().finite().positive().nullable();

export const dkaStepsFiveToTenInputSchema = z
  .object({
    conversion: z
      .object({
        eating: z.boolean(),
        drinking: z.boolean(),
        metabolicallyStable: z.boolean(),
        regimen: z.enum(["new", "basal-bolus", "twice-daily-mixed", "pump"]).nullable(),
      })
      .strict(),
    fluid: z
      .object({
        elderlyClinicallyConfirmed: z.boolean(),
        firstReplacementBagStarted: z.boolean(),
        fluidChartCompleted: z.boolean(),
        heartFailure: z.boolean(),
        pregnant: z.boolean(),
        renalFailure: z.boolean(),
      })
      .strict(),
    further: z
      .object({
        admissionPotassiumMmolL: measurement,
        bicarbonateMmolL: measurement,
        bloodKetonesMmolL: measurement,
        diabetesTeamReferred: z.boolean(),
        fullExaminationComplete: z.boolean(),
        gcs: z.number().int().min(3).max(15).nullable(),
        investigationsConsidered: z.boolean(),
        normalBaselineRespiratoryFunction: z.boolean().nullable(),
        oxygenSaturationPercent: z.number().finite().min(0).max(100).nullable(),
        ph: z.number().finite().min(0).max(14).nullable(),
        precipitatingFactorsConsidered: z.boolean(),
        pulseBpm: positiveMeasurement,
        systolicBpMmhg: positiveMeasurement,
      })
      .strict(),
    initial: dkaStepsOneToFourInputSchema,
    monitoring: z
      .object({
        bloodGlucoseMmolL: measurement,
        bloodKetonesMmolL: measurement,
        incontinent: z.boolean(),
        insulinRateUnitsPerHour: measurement,
        oxygenSaturationPercent: z.number().finite().min(0).max(100).nullable(),
        persistentVomiting: z.boolean(),
        potassiumMmolL: measurement,
        reducedConsciousness: z.boolean(),
        urineOutputMlPerHour: measurement,
        venousPh: z.number().finite().min(0).max(14).nullable(),
      })
      .strict(),
    resolution: z
      .object({
        bicarbonateMmolL: measurement,
        bloodKetonesMmolL: measurement,
        venousPh: z.number().finite().min(0).max(14).nullable(),
      })
      .strict(),
    response: z
      .object({
        currentBicarbonateMmolL: measurement,
        currentBloodGlucoseMmolL: measurement,
        currentBloodKetonesMmolL: measurement,
        deliveryChecksConfirmed: z.boolean().nullable(),
        intervalMinutes: z.number().int().positive(),
        previousBicarbonateMmolL: measurement,
        previousBloodGlucoseMmolL: measurement,
        previousBloodKetonesMmolL: measurement,
      })
      .strict(),
  })
  .strict();

export type DkaStepsFiveToTenInput = z.infer<typeof dkaStepsFiveToTenInputSchema>;
export type DkaLaterStepNumber = Extract<DkaSourceStepNumber, 5 | 6 | 7 | 8 | 9 | 10>;
export type DkaLaterStageStatus = "complete" | "not-reached" | "requires-review" | "stopped";

export interface DkaLaterStage {
  readonly findings: readonly string[];
  readonly sourceReferences: readonly {
    readonly page: number;
    readonly section: string;
    readonly sourceId: string;
  }[];
  readonly status: DkaLaterStageStatus;
  readonly stepNumber: DkaLaterStepNumber;
  readonly summary: string;
}

export interface DkaResponseTrend {
  readonly bicarbonateRiseMmolLPerHour: number;
  readonly glucoseFallMmolLPerHour: number;
  readonly ketoneFallMmolLPerHour: number;
  readonly sourceTargetsMet: boolean;
}

export interface DkaTransitionReview {
  readonly findings: readonly string[];
  readonly status: "context-missing" | "mapped-for-review" | "not-ready";
  readonly summary: string;
}

export interface DkaStepsFiveToTenResult {
  readonly activeClinicalOutput: false;
  readonly inputIssues: readonly string[];
  readonly oliguriaThreshold: PathwayCalculationResult | null;
  readonly responseTrend: DkaResponseTrend | null;
  readonly stages: readonly [
    DkaLaterStage,
    DkaLaterStage,
    DkaLaterStage,
    DkaLaterStage,
    DkaLaterStage,
    DkaLaterStage,
  ];
  readonly transitionReview: DkaTransitionReview;
  readonly version: typeof DKA_STEPS_FIVE_TO_TEN_VERSION;
}

export interface DkaLaterSyntheticCase {
  readonly id: string;
  readonly input: DkaStepsFiveToTenInput;
  readonly label: string;
  readonly summary: string;
}

const stepReferences = Object.freeze([
  Object.freeze({ page: 2, section: "Further Assessment", sourceId: DKA_SOURCE_ID }),
  Object.freeze({ page: 2, section: "Fluid Replacement", sourceId: DKA_SOURCE_ID }),
  Object.freeze({ page: 2, section: "Further Monitoring", sourceId: DKA_SOURCE_ID }),
  Object.freeze({ page: 2, section: "Assess Response to Treatment", sourceId: DKA_SOURCE_ID }),
  Object.freeze({ page: 2, section: "Resolution of Ketoacidosis", sourceId: DKA_SOURCE_ID }),
  Object.freeze({
    page: 4,
    section: "Conversion to Subcutaneous Insulin",
    sourceId: DKA_SOURCE_ID,
  }),
] as const);

const oliguriaEngine = createPathwayEngine({
  entryNodeId: "record-weight",
  name: "DKA oliguria threshold technical preview",
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
      nextNodeId: "calculate-oliguria-threshold",
      precision: 8,
      prompt: "Synthetic weight",
      sourceReferences: [stepReferences[2]],
      title: "Record synthetic weight",
      type: "numeric-input",
      unit: "kg",
    },
    {
      formula: "weight in kg x 0.5 mL/kg/hour",
      id: "calculate-oliguria-threshold",
      nextNodeId: "review-only-stop",
      operands: [
        { key: "dka.weightKg", kind: "numeric-input" },
        { kind: "constant", value: 0.5 },
      ],
      operation: "multiply",
      outputKey: "dka.oliguriaThresholdMlPerHour",
      precision: 8,
      roundingMode: "half-away-from-zero",
      sourceDefinedLimit: null,
      sourceReferences: [stepReferences[2]],
      title: "Source-mapped oliguria threshold",
      type: "calculation",
      unit: "mL/hour",
    },
    {
      id: "review-only-stop",
      outcome: "requires-clinical-review",
      reason: "Technical preview only; clinical activation remains blocked.",
      sourceReferences: [stepReferences[2]],
      title: "Clinical review required",
      type: "stop",
    },
  ],
  pathwayId: "dka-oliguria-technical-preview",
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
  version: DKA_STEPS_FIVE_TO_TEN_VERSION,
});

const standardInput: DkaStepsFiveToTenInput = {
  initial: dkaSyntheticCases[0]!.input,
  further: {
    admissionPotassiumMmolL: 4.2,
    bicarbonateMmolL: 12,
    bloodKetonesMmolL: 4.2,
    diabetesTeamReferred: true,
    fullExaminationComplete: true,
    gcs: 15,
    investigationsConsidered: true,
    normalBaselineRespiratoryFunction: true,
    oxygenSaturationPercent: 98,
    ph: 7.21,
    precipitatingFactorsConsidered: true,
    pulseBpm: 84,
    systolicBpMmhg: 110,
  },
  fluid: {
    elderlyClinicallyConfirmed: false,
    firstReplacementBagStarted: true,
    fluidChartCompleted: true,
    heartFailure: false,
    pregnant: false,
    renalFailure: false,
  },
  monitoring: {
    bloodGlucoseMmolL: 13,
    bloodKetonesMmolL: 3.5,
    incontinent: false,
    insulinRateUnitsPerHour: 7.2,
    oxygenSaturationPercent: 98,
    persistentVomiting: false,
    potassiumMmolL: 4.2,
    reducedConsciousness: false,
    urineOutputMlPerHour: 80,
    venousPh: 7.25,
  },
  response: {
    currentBicarbonateMmolL: 13,
    currentBloodGlucoseMmolL: 13,
    currentBloodKetonesMmolL: 3.5,
    deliveryChecksConfirmed: null,
    intervalMinutes: 60,
    previousBicarbonateMmolL: 12,
    previousBloodGlucoseMmolL: 18,
    previousBloodKetonesMmolL: 4.2,
  },
  resolution: {
    bicarbonateMmolL: 19,
    bloodKetonesMmolL: 0.5,
    venousPh: 7.34,
  },
  conversion: {
    drinking: true,
    eating: true,
    metabolicallyStable: true,
    regimen: "basal-bolus",
  },
};

export const dkaLaterSyntheticCases: readonly DkaLaterSyntheticCase[] = Object.freeze([
  syntheticCase(
    "standard",
    "Monitoring targets met",
    "Connected preview reaches the blocked resolution stage",
    standardInput,
  ),
  syntheticCase(
    "critical-care",
    "Critical-care criterion",
    "Step 5 escalates when ketones exceed 6 mmol/L",
    {
      ...standardInput,
      further: { ...standardInput.further, bloodKetonesMmolL: 6.1 },
    },
  ),
  syntheticCase(
    "fluid-caution",
    "Fluid caution",
    "Pregnancy requires individualised fluid review",
    {
      ...standardInput,
      fluid: { ...standardInput.fluid, pregnant: true },
    },
  ),
  syntheticCase(
    "low-potassium",
    "Potassium below 3.5",
    "Step 7 stops for immediate senior or critical-care advice",
    {
      ...standardInput,
      monitoring: { ...standardInput.monitoring, potassiumMmolL: 3.4 },
    },
  ),
  syntheticCase(
    "high-potassium",
    "Potassium above 5.5",
    "Step 7 selects the no-added-potassium branch",
    {
      ...standardInput,
      monitoring: { ...standardInput.monitoring, potassiumMmolL: 5.6 },
    },
  ),
  syntheticCase(
    "inadequate-response",
    "Response below targets",
    "Step 8 stops for delivery-system and senior review",
    {
      ...standardInput,
      response: {
        ...standardInput.response,
        currentBloodGlucoseMmolL: 16,
        currentBloodKetonesMmolL: 4,
        deliveryChecksConfirmed: true,
      },
    },
  ),
  syntheticCase(
    "mixed-insulin",
    "Mixed insulin mapping",
    "Step 10 maps the mixed-regimen branch without executing it",
    {
      ...standardInput,
      conversion: { ...standardInput.conversion, regimen: "twice-daily-mixed" },
    },
  ),
  syntheticCase(
    "pump-insulin",
    "Pump mapping",
    "Step 10 maps the pump branch without executing it",
    {
      ...standardInput,
      conversion: { ...standardInput.conversion, regimen: "pump" },
    },
  ),
  syntheticCase(
    "not-ready",
    "Not ready to convert",
    "Eating and drinking status prevents transition mapping",
    {
      ...standardInput,
      conversion: { ...standardInput.conversion, eating: false },
    },
  ),
]);

export function evaluateDkaStepsFiveToTen(input: unknown): DkaStepsFiveToTenResult {
  const parsed = dkaStepsFiveToTenInputSchema.safeParse(input);
  const stages: [
    DkaLaterStage,
    DkaLaterStage,
    DkaLaterStage,
    DkaLaterStage,
    DkaLaterStage,
    DkaLaterStage,
  ] = [
    stage(5, "Further assessment not reached", "not-reached"),
    stage(6, "Fluid replacement not reached", "not-reached"),
    stage(7, "Monitoring not reached", "not-reached"),
    stage(8, "Response assessment not reached", "not-reached"),
    stage(9, "Resolution review not reached", "not-reached"),
    stage(10, "Conversion cannot be entered", "not-reached"),
  ];
  const emptyTransition = transition("context-missing", "Conversion context unavailable");

  if (!parsed.success) {
    stages[0] = stage(5, "Invalid synthetic input", "requires-review");
    return result(
      stages,
      emptyTransition,
      null,
      null,
      parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`),
    );
  }

  const values = parsed.data;
  const transitionReview = reviewTransition(values.conversion);
  const firstFour = evaluateDkaStepsOneToFour(values.initial);
  if (firstFour.stages[3].status !== "complete") {
    stages[0] = stage(5, "Prerequisite stages are not complete", "not-reached", [
      "The connected preview cannot enter Step 5 until Steps 1-4 resolve in the synthetic case.",
    ]);
    return result(stages, transitionReview);
  }

  const further = values.further;
  if (
    !further.fullExaminationComplete ||
    !further.precipitatingFactorsConsidered ||
    !further.investigationsConsidered ||
    !further.diabetesTeamReferred
  ) {
    stages[0] = stage(5, "Further assessment incomplete", "requires-review", [
      "Full examination, precipitating factors, relevant investigations and diabetes-team referral require explicit confirmation.",
    ]);
    return result(stages, transitionReview);
  }

  const criticalCriteria = [
    [
      further.bloodKetonesMmolL !== null && further.bloodKetonesMmolL > 6,
      "Blood ketones >6 mmol/L",
    ],
    [further.bicarbonateMmolL !== null && further.bicarbonateMmolL < 5, "Bicarbonate <5 mmol/L"],
    [further.ph !== null && further.ph < 7.1, "Venous or arterial pH <7.1"],
    [
      further.admissionPotassiumMmolL !== null && further.admissionPotassiumMmolL < 3.5,
      "Admission potassium <3.5 mmol/L",
    ],
    [further.gcs !== null && further.gcs < 12, "GCS <12"],
    [
      further.oxygenSaturationPercent !== null &&
        further.oxygenSaturationPercent < 92 &&
        further.normalBaselineRespiratoryFunction === true,
      "Oxygen saturation <92% on air with normal respiratory baseline",
    ],
    [further.systolicBpMmhg !== null && further.systolicBpMmhg < 90, "Systolic pressure <90 mmHg"],
    [
      further.pulseBpm !== null && (further.pulseBpm > 100 || further.pulseBpm < 60),
      "Pulse >100 or <60 bpm",
    ],
  ]
    .filter(([matched]) => matched === true)
    .map(([, label]) => label as string);

  if (criticalCriteria.length > 0) {
    stages[0] = stage(5, "Critical-care review criterion present", "requires-review", [
      `Source-listed criteria: ${criticalCriteria.join("; ")}.`,
      "Source branch: request critical-care review.",
    ]);
    return result(stages, transitionReview);
  }

  if (
    Object.entries(further).some(
      ([key, value]) => key !== "normalBaselineRespiratoryFunction" && value === null,
    ) ||
    (further.oxygenSaturationPercent !== null &&
      further.oxygenSaturationPercent < 92 &&
      further.normalBaselineRespiratoryFunction === null)
  ) {
    stages[0] = stage(5, "Critical-care criteria cannot be excluded", "requires-review", [
      "At least one required assessment value or respiratory-baseline determination is unavailable.",
    ]);
    return result(stages, transitionReview);
  }

  stages[0] = stage(5, "Further assessment recorded", "complete", [
    "No source-listed critical-care threshold is met by the confirmed synthetic measurements.",
    "Full examination, precipitating factors, investigations and diabetes-team referral are recorded.",
  ]);

  const fluid = values.fluid;
  const fluidCautions = [
    [values.initial.ageYears >= 18 && values.initial.ageYears <= 25, "Age 18-25"],
    [fluid.elderlyClinicallyConfirmed, "Clinically confirmed older age"],
    [fluid.pregnant, "Pregnancy"],
    [fluid.heartFailure, "Heart failure"],
    [fluid.renalFailure, "Renal failure"],
  ]
    .filter(([matched]) => matched === true)
    .map(([, label]) => label as string);

  if (fluidCautions.length > 0) {
    stages[1] = stage(6, "Individualised fluid review required", "requires-review", [
      `Source caution contexts: ${fluidCautions.join("; ")}.`,
      "The standard replacement sequence is not selected automatically for this context.",
    ]);
    return result(stages, transitionReview);
  }

  if (!fluid.firstReplacementBagStarted || !fluid.fluidChartCompleted) {
    stages[1] = stage(6, "Replacement setup incomplete", "requires-review", [
      "The first replacement bag and completed fluid chart require explicit confirmation.",
    ]);
    return result(stages, transitionReview);
  }

  stages[1] = stage(6, "Standard source sequence mapped", "complete", [
    "Source sequence after initial resuscitation: 1 L of 0.9% sodium chloride over 2 hours, then 1 L over 2 hours, then 1 L over 4 hours.",
    "The source flags severe hypokalaemia risk; potassium content follows the Step 7 branch.",
    "The source requires 10% glucose when blood glucose falls below 14 mmol/L.",
  ]);

  const monitoring = values.monitoring;
  const requiredMonitoring = [
    monitoring.bloodGlucoseMmolL,
    monitoring.bloodKetonesMmolL,
    monitoring.venousPh,
    monitoring.potassiumMmolL,
    monitoring.insulinRateUnitsPerHour,
    monitoring.urineOutputMlPerHour,
    monitoring.oxygenSaturationPercent,
  ];
  if (requiredMonitoring.some((value) => value === null)) {
    stages[2] = stage(7, "Monitoring values incomplete", "requires-review", [
      "Glucose, ketones, venous pH, potassium, insulin rate, urine output and oxygen saturation must be recorded explicitly.",
    ]);
    return result(stages, transitionReview);
  }

  const oliguriaSnapshot = oliguriaEngine.evaluate({
    inputs: { "dka.weightKg": { kind: "numeric", unit: "kg", value: values.initial.weightKg! } },
  });
  const oliguriaThreshold = oliguriaSnapshot.calculations[0] ?? null;
  if (oliguriaSnapshot.status !== "requires-clinical-review" || !oliguriaThreshold) {
    stages[2] = stage(7, "Urine-output calculation blocked", "requires-review");
    return result(
      stages,
      transitionReview,
      null,
      null,
      oliguriaSnapshot.issues.map(({ message }) => message),
    );
  }

  const monitoringFindings = [
    "Record blood glucose, blood ketones, venous pH, potassium and insulin rate hourly in the source chart.",
    monitoring.bloodGlucoseMmolL! < 14
      ? "Glucose <14 mmol/L: source branch adds 10% glucose at 125 mL/hour while continuing 0.9% saline unless fluid overload is a concern."
      : "Glucose is not below the source's 14 mmol/L addition threshold.",
    monitoring.potassiumMmolL! > 5.5
      ? "Potassium >5.5 mmol/L: no added potassium in the saline bag."
      : monitoring.potassiumMmolL! < 3.5
        ? "Potassium <3.5 mmol/L: immediate senior or critical-care advice is required."
        : "Potassium 3.5-5.5 mmol/L: source branch specifies 20 mmol potassium chloride per 1 L saline, with a maximum infusion rate of 10 mmol/hour.",
    monitoring.urineOutputMlPerHour! < oliguriaThreshold.output.value || monitoring.incontinent
      ? "Incontinence or urine output below the weight-based oliguria threshold: consider catheterisation."
      : "Urine output is not below the source's weight-based oliguria threshold.",
  ];

  if (monitoring.oxygenSaturationPercent! < 92) {
    monitoringFindings.push(
      "Oxygen saturation <92%: source requests an arterial rather than venous blood gas.",
    );
  }
  if (monitoring.persistentVomiting || monitoring.reducedConsciousness) {
    monitoringFindings.push(
      "Persistent vomiting or reduced consciousness: source flags nasogastric tube and airway protection.",
    );
  }

  if (
    monitoring.potassiumMmolL! < 3.5 ||
    monitoring.persistentVomiting ||
    monitoring.reducedConsciousness
  ) {
    stages[2] = stage(
      7,
      "Urgent monitoring branch requires review",
      "requires-review",
      monitoringFindings,
    );
    return result(stages, transitionReview, oliguriaThreshold);
  }

  stages[2] = stage(7, "Monitoring branches mapped", "complete", monitoringFindings);

  const response = values.response;
  const responseValues = [
    response.previousBloodKetonesMmolL,
    response.currentBloodKetonesMmolL,
    response.previousBicarbonateMmolL,
    response.currentBicarbonateMmolL,
    response.previousBloodGlucoseMmolL,
    response.currentBloodGlucoseMmolL,
  ];
  if (response.intervalMinutes !== 60 || responseValues.some((value) => value === null)) {
    stages[3] = stage(8, "One-hour response comparison unavailable", "requires-review", [
      "The source defines hourly targets. This preview requires two complete observations exactly one hour apart.",
    ]);
    return result(stages, transitionReview, oliguriaThreshold);
  }

  const ketoneFall = difference(
    response.previousBloodKetonesMmolL!,
    response.currentBloodKetonesMmolL!,
  );
  const bicarbonateRise = difference(
    response.currentBicarbonateMmolL!,
    response.previousBicarbonateMmolL!,
  );
  const glucoseFall = difference(
    response.previousBloodGlucoseMmolL!,
    response.currentBloodGlucoseMmolL!,
  );
  const sourceTargetsMet = (ketoneFall >= 0.5 || bicarbonateRise >= 3) && glucoseFall >= 3;
  const responseTrend = Object.freeze({
    bicarbonateRiseMmolLPerHour: bicarbonateRise,
    glucoseFallMmolLPerHour: glucoseFall,
    ketoneFallMmolLPerHour: ketoneFall,
    sourceTargetsMet,
  });

  if (!sourceTargetsMet) {
    stages[3] = stage(8, "Response below source targets", "requires-review", [
      "Check cannula patency, syringe-driver connection and residual insulin volume.",
      response.deliveryChecksConfirmed === true
        ? "The source mentions 1 unit/hour increases after equipment checks, but no adjusted dose is generated because the Step 4 maximum and later escalation require clinical reconciliation."
        : "No insulin-rate change is calculated without confirmed delivery checks and clinical review.",
    ]);
    return result(stages, transitionReview, oliguriaThreshold, responseTrend);
  }

  stages[3] = stage(8, "Hourly response targets met in this synthetic case", "complete", [
    "The source target is ketones falling at least 0.5 mmol/L/hour OR bicarbonate rising at least 3 mmol/L/hour, AND glucose falling at least 3 mmol/L/hour.",
    "Continue returning to the Step 7 monitoring checks; this is not a DKA-resolution decision.",
  ]);

  stages[4] = stage(9, "Resolution rule blocked by source conflict", "requires-review", [
    "The numbered pathway and hourly monitoring chart disagree on the AND/OR relationship and the bicarbonate boundary.",
    "No automated DKA-resolution result, VRIII transition or treatment-stop instruction is generated.",
  ]);
  stages[5] = stage(10, "Conversion cannot be entered from Step 9", "not-reached", [
    "The connected pathway stops at unresolved Step 9. The separate source-regimen mapping below is review-only.",
  ]);
  return result(stages, transitionReview, oliguriaThreshold, responseTrend);
}

function reviewTransition(conversion: DkaStepsFiveToTenInput["conversion"]): DkaTransitionReview {
  if (!conversion.eating || !conversion.drinking || !conversion.metabolicallyStable) {
    return transition("not-ready", "Source readiness conditions are not all met", [
      "Eating, drinking and metabolic stability all require explicit confirmation before conversion is considered.",
    ]);
  }

  if (conversion.regimen === null) {
    return transition("context-missing", "Insulin regimen not established");
  }

  const branches = {
    new: [
      "New insulin use is normally managed by the specialist diabetes team; review is required before discharge.",
    ],
    "basal-bolus": [
      "Source mapping: continue long-acting insulin if used; restart rapid-acting insulin at the next meal and retain IV overlap for 30 minutes after meal-associated subcutaneous insulin.",
    ],
    "twice-daily-mixed": [
      "Source mapping: reintroduce before breakfast or the evening meal, not at another time; retain IV overlap for 30 minutes after subcutaneous insulin.",
    ],
    pump: [
      "Source mapping: recommence pump at the normal basal rate, retain IV insulin until the meal bolus, and do not recommence at bedtime.",
    ],
  } satisfies Record<NonNullable<typeof conversion.regimen>, string[]>;

  return transition("mapped-for-review", "Source regimen branch mapped, not authorised", [
    "This mapping does not establish DKA resolution or permit IV insulin discontinuation.",
    ...branches[conversion.regimen],
  ]);
}

function transition(
  status: DkaTransitionReview["status"],
  summary: string,
  findings: readonly string[] = [],
): DkaTransitionReview {
  return Object.freeze({ findings: Object.freeze([...findings]), status, summary });
}

function stage(
  stepNumber: DkaLaterStepNumber,
  summary: string,
  status: DkaLaterStageStatus,
  findings: readonly string[] = [],
): DkaLaterStage {
  return Object.freeze({
    findings: Object.freeze([...findings]),
    sourceReferences: Object.freeze(
      stepNumber === 9
        ? [
            stepReferences[4],
            { page: 3, section: "Adult DKA Hourly Monitoring Chart", sourceId: DKA_SOURCE_ID },
          ]
        : [stepReferences[stepNumber - 5]!],
    ),
    status,
    stepNumber,
    summary,
  });
}

function result(
  stages: readonly [
    DkaLaterStage,
    DkaLaterStage,
    DkaLaterStage,
    DkaLaterStage,
    DkaLaterStage,
    DkaLaterStage,
  ],
  transitionReview: DkaTransitionReview,
  oliguriaThreshold: PathwayCalculationResult | null = null,
  responseTrend: DkaResponseTrend | null = null,
  inputIssues: readonly string[] = [],
): DkaStepsFiveToTenResult {
  return Object.freeze({
    activeClinicalOutput: false,
    inputIssues: Object.freeze([...inputIssues]),
    oliguriaThreshold,
    responseTrend,
    stages: Object.freeze([...stages] as const),
    transitionReview,
    version: DKA_STEPS_FIVE_TO_TEN_VERSION,
  });
}

function syntheticCase(
  id: string,
  label: string,
  summary: string,
  input: DkaStepsFiveToTenInput,
): DkaLaterSyntheticCase {
  return Object.freeze({ id, input: Object.freeze(input), label, summary });
}

function difference(left: number, right: number): number {
  return Number((left - right).toFixed(8));
}
