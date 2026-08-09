import { z } from "zod";

export const clinicalContextSchema = z.enum([
  "general-adult-presentation",
  "acute-life-threatening-hyperkalaemia",
  "iv-fluid-related",
  "ckd-raas-monitoring",
  "ckd-before-raas-antagonist",
  "ckd-on-raas-antagonist",
  "persistent-hyperkalaemia",
  "aki-not-responding-to-treatment",
  "possible-primary-hyperparathyroidism",
  "confirmed-primary-hyperparathyroidism",
  "primary-adrenal-insufficiency",
]);

const assessmentContextSchema = z
  .object({
    acuteLifeThreateningHyperkalaemia: z.boolean().optional(),
    adjustedCalciumConfirmed: z.boolean().optional(),
    adequatePotassiumProvision: z.boolean().optional(),
    aki: z.boolean().optional(),
    alternativeCauseIdentified: z.boolean().optional(),
    baselineValue: z.number().finite().nonnegative().optional(),
    baselineValueStatus: z.enum(["low", "normal", "high", "unknown"]).optional(),
    ckdStage: z.enum(["none", "1", "2", "3a", "3b", "4", "5"]).optional(),
    clinicalConditionReviewed: z.boolean().optional(),
    confirmedPrimaryHyperparathyroidism: z.boolean().optional(),
    dialysis: z.boolean().optional(),
    ecgOrComplicationsReviewed: z.boolean().optional(),
    egfr: z.number().finite().nonnegative().optional(),
    endOrganDisease: z.boolean().optional(),
    emergencyCare: z.boolean().optional(),
    fludrocortisoneDoseStatus: z.enum(["not-taking", "below-maximum", "maximum"]).optional(),
    fluidStatus: z.enum(["euvolaemic", "hypovolaemic", "hypervolaemic", "uncertain"]).optional(),
    fragilityFractureOrOsteoporosis: z.boolean().optional(),
    heartFailure: z.boolean().optional(),
    hypercalcaemiaSymptomsPresent: z.boolean().optional(),
    hyponatraemiaPersistent: z.boolean().optional(),
    ivFluidContainsSaline: z.boolean().optional(),
    ivFluidPrescriptionReviewed: z.boolean().optional(),
    ivFluidTemporalRelationship: z.boolean().optional(),
    medicalManagementResponse: z.enum(["not-given", "responding", "not-responding"]).optional(),
    medicinesReviewed: z.boolean().optional(),
    onIvFluids: z.boolean().optional(),
    otherHyperkalaemiaMedicinesStopped: z.boolean().optional(),
    otherPotassiumLossesIdentified: z.boolean().optional(),
    potassiumConfirmed: z.boolean().optional(),
    potassiumTrendReviewed: z.boolean().optional(),
    pregnancyStatus: z.enum(["not-applicable", "not-pregnant", "pregnant", "unknown"]).optional(),
    primaryAdrenalInsufficiency: z.boolean().optional(),
    primaryHyperparathyroidismSuspected: z.boolean().optional(),
    raasAntagonistStatus: z
      .enum([
        "not-applicable",
        "planned",
        "starting",
        "dose-increased",
        "taking",
        "optimised",
        "not-optimised-because-hyperkalaemia",
        "not-taking-because-hyperkalaemia",
        "reduced-because-hyperkalaemia",
      ])
      .optional(),
    raasChangeDateKnown: z.boolean().optional(),
    renalStones: z.boolean().optional(),
    sodiumTrendReviewed: z.boolean().optional(),
    specialistEndocrinologyInvolved: z.boolean().optional(),
    standardEmergencyCare: z.boolean().optional(),
    symptoms: z.array(z.string().trim().min(1)).optional(),
    treatmentsReviewed: z.boolean().optional(),
  })
  .strict();

const conditionSchema = z.enum([
  "hyponatraemia",
  "hypernatraemia",
  "hypokalaemia",
  "hyperkalaemia",
  "hypocalcaemia",
  "hypercalcaemia",
  "hypomagnesaemia",
  "hypermagnesaemia",
  "no-abnormality",
]);

const electrolyteSchema = z.enum(["sodium", "potassium", "calcium", "magnesium"]);

type Condition = z.infer<typeof conditionSchema>;
type Electrolyte = z.infer<typeof electrolyteSchema>;

interface MeasuredValueConsistencyRule {
  electrolyte: Electrolyte;
  expected: string;
  isConsistent: (value: number) => boolean;
}

const measuredValueConsistencyRules: Partial<Record<Condition, MeasuredValueConsistencyRule>> = {
  hypercalcaemia: {
    electrolyte: "calcium",
    expected: "2.60 mmol/L or above",
    isConsistent: (value) => value >= 2.6,
  },
  hyperkalaemia: {
    electrolyte: "potassium",
    expected: "above 5.0 mmol/L",
    isConsistent: (value) => value > 5,
  },
  hypermagnesaemia: {
    electrolyte: "magnesium",
    expected: "above 1.0 mmol/L",
    isConsistent: (value) => value > 1,
  },
  hypernatraemia: {
    electrolyte: "sodium",
    expected: "above 145 mmol/L",
    isConsistent: (value) => value > 145,
  },
  hypocalcaemia: {
    electrolyte: "calcium",
    expected: "below 2.20 mmol/L",
    isConsistent: (value) => value < 2.2,
  },
  hypokalaemia: {
    electrolyte: "potassium",
    expected: "below 3.5 mmol/L",
    isConsistent: (value) => value < 3.5,
  },
  hypomagnesaemia: {
    electrolyte: "magnesium",
    expected: "below 0.70 mmol/L",
    isConsistent: (value) => value < 0.7,
  },
  hyponatraemia: {
    electrolyte: "sodium",
    expected: "below 135 mmol/L",
    isConsistent: (value) => value < 135,
  },
};

const conditionLabels: Record<Condition, string> = {
  hypercalcaemia: "Hypercalcaemia",
  hyperkalaemia: "Hyperkalaemia",
  hypermagnesaemia: "Hypermagnesaemia",
  hypernatraemia: "Hypernatraemia",
  hypocalcaemia: "Hypocalcaemia",
  hypokalaemia: "Hypokalaemia",
  hypomagnesaemia: "Hypomagnesaemia",
  hyponatraemia: "Hyponatraemia",
  "no-abnormality": "Monitoring result",
};

const electrolyteLabels: Record<Electrolyte, string> = {
  calcium: "adjusted calcium",
  magnesium: "magnesium",
  potassium: "potassium",
  sodium: "sodium",
};

export function getMeasuredValueConsistencyIssue(input: {
  condition: Condition;
  electrolyte: Electrolyte;
  measuredValue: number;
}): string | null {
  const rule = measuredValueConsistencyRules[input.condition];

  if (rule === undefined) {
    return null;
  }

  if (rule.electrolyte !== input.electrolyte) {
    return `${conditionLabels[input.condition]} is not a ${electrolyteLabels[input.electrolyte]} assessment.`;
  }

  if (rule.isConsistent(input.measuredValue)) {
    return null;
  }

  return `A ${electrolyteLabels[input.electrolyte]} result of ${input.measuredValue} mmol/L does not match ${conditionLabels[input.condition]}. The configured adult reference interval requires ${rule.expected}. Verify the result or change the abnormality.`;
}

export const validatedAssessmentSchema = z
  .object({
    ageYears: z.number().int().min(16).max(130),
    clinicalContext: clinicalContextSchema,
    condition: conditionSchema,
    context: assessmentContextSchema.default({}),
    electrolyte: electrolyteSchema,
    measuredValue: z.number().finite().nonnegative(),
    unit: z.literal("mmol/L"),
  })
  .strict()
  .superRefine((value, context) => {
    const issue = getMeasuredValueConsistencyIssue(value);

    if (issue !== null) {
      context.addIssue({ code: "custom", message: issue, path: ["measuredValue"] });
    }
  });

export type ClinicalContext = z.infer<typeof clinicalContextSchema>;
export type ValidatedAssessment = z.infer<typeof validatedAssessmentSchema>;
