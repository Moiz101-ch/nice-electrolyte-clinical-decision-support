import { z } from "zod";

import {
  clinicalContextSchema,
  getMeasuredValueConsistencyIssue,
  validatedAssessmentSchema,
  type ClinicalContext,
  type ValidatedAssessment,
} from "../rule-engine/assessment.ts";

export type ElectrolyteId = ValidatedAssessment["electrolyte"];
export type ConditionId = ValidatedAssessment["condition"];
export type AssessmentContext = ValidatedAssessment["context"];
export type ContextField = keyof AssessmentContext;
export type PregnancyStatus = NonNullable<AssessmentContext["pregnancyStatus"]>;

export interface SelectOption {
  label: string;
  value: string;
}

interface QuestionBase {
  contextField?: ContextField;
  description: string;
  id: string;
  label: string;
  showWhen?: {
    field: string;
    value: string;
  };
}

export type ContextQuestion =
  | (QuestionBase & {
      type: "boolean";
    })
  | (QuestionBase & {
      inputMode?: "decimal" | "numeric";
      max?: number;
      min?: number;
      step?: number | "any";
      type: "number";
    })
  | (QuestionBase & {
      options: readonly SelectOption[];
      type: "select";
    })
  | (QuestionBase & {
      placeholder: string;
      type: "text";
    });

export interface ClinicalContextOption {
  description: string;
  id: ClinicalContext;
  label: string;
}

export interface AssessmentFormState {
  ageYears: string;
  clinicalContext: ClinicalContext | "";
  condition: ConditionId | "";
  contextAnswers: Record<string, string>;
  electrolyte: ElectrolyteId | "";
  measuredValue: string;
  pregnancyStatus: PregnancyStatus | "";
  reviewed: boolean;
}

export type AssessmentFormErrors = Record<string, string>;

export type BuildAssessmentResult =
  | {
      data: ValidatedAssessment;
      errors: null;
      success: true;
    }
  | {
      data: null;
      errors: AssessmentFormErrors;
      success: false;
    };

export const initialAssessmentFormState: AssessmentFormState = {
  ageYears: "",
  clinicalContext: "",
  condition: "",
  contextAnswers: {},
  electrolyte: "",
  measuredValue: "",
  pregnancyStatus: "",
  reviewed: false,
};

const conditionOptionsByElectrolyte = {
  calcium: [
    { label: "Hypocalcaemia", value: "hypocalcaemia" },
    { label: "Hypercalcaemia", value: "hypercalcaemia" },
  ],
  magnesium: [
    { label: "Hypomagnesaemia", value: "hypomagnesaemia" },
    { label: "Hypermagnesaemia", value: "hypermagnesaemia" },
  ],
  potassium: [
    { label: "Hypokalaemia", value: "hypokalaemia" },
    { label: "Hyperkalaemia", value: "hyperkalaemia" },
    { label: "Monitoring result", value: "no-abnormality" },
  ],
  sodium: [
    { label: "Hyponatraemia", value: "hyponatraemia" },
    { label: "Hypernatraemia", value: "hypernatraemia" },
  ],
} as const satisfies Record<ElectrolyteId, readonly SelectOption[]>;

export const electrolyteOptions = [
  {
    coverage: "IV-fluid and adrenal pathways",
    id: "sodium",
    label: "Sodium",
    symbol: "Na+",
  },
  {
    coverage: "IV-fluid, CKD, medicine and AKI pathways",
    id: "potassium",
    label: "Potassium",
    symbol: "K+",
  },
  {
    coverage: "Primary hyperparathyroidism pathways",
    id: "calcium",
    label: "Adjusted calcium",
    symbol: "Ca2+",
  },
  {
    coverage: "Structured unsupported assessment",
    id: "magnesium",
    label: "Magnesium",
    symbol: "Mg2+",
  },
] as const satisfies readonly {
  coverage: string;
  id: ElectrolyteId;
  label: string;
  symbol: string;
}[];

export const pregnancyStatusOptions = [
  { label: "Not applicable", value: "not-applicable" },
  { label: "Confirmed not pregnant", value: "not-pregnant" },
  { label: "Pregnant", value: "pregnant" },
  { label: "Not confirmed", value: "unknown" },
] as const satisfies readonly SelectOption[];

const generalContext: ClinicalContextOption = {
  description: "No condition-specific NICE catalogue context is confirmed.",
  id: "general-adult-presentation",
  label: "General adult presentation",
};

const contextOptions: readonly (ClinicalContextOption & {
  conditions: readonly ConditionId[];
  electrolytes: readonly ElectrolyteId[];
})[] = [
  {
    conditions: ["hyperkalaemia"],
    description: "Acute life-threatening hyperkalaemia being managed in emergency care.",
    electrolytes: ["potassium"],
    id: "acute-life-threatening-hyperkalaemia",
    label: "Acute life-threatening hyperkalaemia",
  },
  {
    conditions: ["hyponatraemia", "hypernatraemia", "hypokalaemia", "hyperkalaemia"],
    description: "The abnormality occurred during or within 24 hours of IV-fluid therapy.",
    electrolytes: ["sodium", "potassium"],
    id: "iv-fluid-related",
    label: "IV-fluid related",
  },
  {
    conditions: ["hyperkalaemia", "no-abnormality"],
    description: "CKD monitoring before starting or after increasing a RAAS antagonist.",
    electrolytes: ["potassium"],
    id: "ckd-raas-monitoring",
    label: "CKD RAAS monitoring",
  },
  {
    conditions: ["hyperkalaemia"],
    description: "Pretreatment potassium assessment before a planned RAAS antagonist.",
    electrolytes: ["potassium"],
    id: "ckd-before-raas-antagonist",
    label: "CKD before RAAS antagonist",
  },
  {
    conditions: ["hyperkalaemia"],
    description: "Hyperkalaemia while currently taking a RAAS antagonist.",
    electrolytes: ["potassium"],
    id: "ckd-on-raas-antagonist",
    label: "CKD on RAAS antagonist",
  },
  {
    conditions: ["hyperkalaemia"],
    description: "Persistent hyperkalaemia being assessed for NICE medicine eligibility.",
    electrolytes: ["potassium"],
    id: "persistent-hyperkalaemia",
    label: "Persistent hyperkalaemia",
  },
  {
    conditions: ["hyperkalaemia"],
    description: "AKI with hyperkalaemia after medical management has been given.",
    electrolytes: ["potassium"],
    id: "aki-not-responding-to-treatment",
    label: "AKI treatment response",
  },
  {
    conditions: ["hypercalcaemia"],
    description: "Albumin-adjusted calcium is being assessed because PHPT is suspected.",
    electrolytes: ["calcium"],
    id: "possible-primary-hyperparathyroidism",
    label: "Possible primary hyperparathyroidism",
  },
  {
    conditions: ["hypercalcaemia"],
    description: "Primary hyperparathyroidism has already been confirmed.",
    electrolytes: ["calcium"],
    id: "confirmed-primary-hyperparathyroidism",
    label: "Confirmed primary hyperparathyroidism",
  },
  {
    conditions: ["hyponatraemia"],
    description: "Hyponatraemia in confirmed primary adrenal insufficiency.",
    electrolytes: ["sodium"],
    id: "primary-adrenal-insufficiency",
    label: "Primary adrenal insufficiency",
  },
];

const booleanAnswerOptions = [
  { label: "Yes", value: "yes" },
  { label: "No", value: "no" },
  { label: "Not confirmed", value: "unknown" },
] as const satisfies readonly SelectOption[];

const fluidStatusOptions = withUnknown([
  { label: "Euvolaemic", value: "euvolaemic" },
  { label: "Hypovolaemic", value: "hypovolaemic" },
  { label: "Hypervolaemic", value: "hypervolaemic" },
  { label: "Uncertain after review", value: "uncertain" },
]);

const ckdStageOptions = withUnknown([
  { label: "No CKD", value: "none" },
  { label: "Stage 1", value: "1" },
  { label: "Stage 2", value: "2" },
  { label: "Stage 3a", value: "3a" },
  { label: "Stage 3b", value: "3b" },
  { label: "Stage 4", value: "4" },
  { label: "Stage 5", value: "5" },
]);

const raasStatusOptions = withUnknown([
  { label: "Not applicable", value: "not-applicable" },
  { label: "Planned", value: "planned" },
  { label: "Starting", value: "starting" },
  { label: "Dose increased", value: "dose-increased" },
  { label: "Taking", value: "taking" },
  { label: "Optimised", value: "optimised" },
  {
    label: "Not optimised because of hyperkalaemia",
    value: "not-optimised-because-hyperkalaemia",
  },
  {
    label: "Not taking because of hyperkalaemia",
    value: "not-taking-because-hyperkalaemia",
  },
  {
    label: "Reduced because of hyperkalaemia",
    value: "reduced-because-hyperkalaemia",
  },
]);

const questionSets: Record<string, readonly ContextQuestion[]> = {
  "acute-life-threatening-hyperkalaemia": [
    booleanQuestion(
      "acuteLifeThreateningHyperkalaemia",
      "Acute life-threatening hyperkalaemia confirmed",
      "This classification must be confirmed by the responsible clinical team.",
    ),
    booleanQuestion(
      "emergencyCare",
      "Currently in emergency care",
      "Confirm that this assessment is taking place in an emergency-care setting.",
    ),
    booleanQuestion(
      "standardEmergencyCare",
      "Standard emergency care underway",
      "NICE potassium-binder options apply only alongside standard emergency care.",
    ),
  ],
  "aki-not-responding-to-treatment": [
    booleanQuestion("aki", "AKI confirmed", "Confirm the current acute kidney injury status."),
    selectQuestion(
      "medicalManagementResponse",
      "Response to medical management",
      "Record the confirmed response after treatment already given.",
      withUnknown([
        { label: "Treatment not given", value: "not-given" },
        { label: "Responding", value: "responding" },
        { label: "Not responding", value: "not-responding" },
      ]),
    ),
    booleanQuestion(
      "potassiumTrendReviewed",
      "Potassium trend reviewed",
      "Confirm that serial potassium results have been reviewed.",
    ),
    booleanQuestion(
      "treatmentsReviewed",
      "Treatments already given reviewed",
      "Confirm that medical management already provided has been reviewed.",
    ),
    booleanQuestion(
      "clinicalConditionReviewed",
      "Whole clinical condition reviewed",
      "Confirm that escalation is not being based on potassium alone.",
    ),
    booleanQuestion(
      "ecgOrComplicationsReviewed",
      "ECG or complications reviewed",
      "Confirm review of ECG findings and relevant complications.",
    ),
    selectQuestion(
      "fluidStatus",
      "Fluid status",
      "Use the status confirmed during the current assessment.",
      fluidStatusOptions,
    ),
  ],
  "ckd-before-raas-antagonist": [
    selectQuestion("ckdStage", "CKD stage", "Select the confirmed CKD stage.", ckdStageOptions),
    selectQuestion(
      "raasAntagonistStatus",
      "RAAS antagonist status",
      "Record the current prescribing status.",
      raasStatusOptions,
    ),
  ],
  "ckd-on-raas-antagonist": [
    selectQuestion("ckdStage", "CKD stage", "Select the confirmed CKD stage.", ckdStageOptions),
    selectQuestion(
      "raasAntagonistStatus",
      "RAAS antagonist status",
      "Record the current prescribing status.",
      raasStatusOptions,
    ),
    booleanQuestion(
      "otherHyperkalaemiaMedicinesStopped",
      "Other hyperkalaemia-promoting medicines stopped",
      "Confirm the status of other medicines known to promote hyperkalaemia.",
    ),
  ],
  "ckd-raas-monitoring": [
    selectQuestion("ckdStage", "CKD stage", "Select the confirmed CKD stage.", ckdStageOptions),
    numberQuestion("egfr", "eGFR (mL/min/1.73m2)", "Enter the confirmed current eGFR."),
    selectQuestion(
      "raasAntagonistStatus",
      "RAAS antagonist status",
      "Record whether treatment is starting or the dose has increased.",
      raasStatusOptions,
    ),
    booleanQuestion(
      "raasChangeDateKnown",
      "Medicine or dose-change date known",
      "Confirm that the date needed to schedule monitoring is available.",
    ),
  ],
  "confirmed-primary-hyperparathyroidism": [
    booleanQuestion(
      "adjustedCalciumConfirmed",
      "Result is albumin-adjusted calcium",
      "Do not use an unadjusted calcium result for this pathway.",
    ),
    booleanQuestion(
      "confirmedPrimaryHyperparathyroidism",
      "Primary hyperparathyroidism confirmed",
      "Confirm that PHPT has been diagnosed rather than only suspected.",
    ),
    selectQuestion(
      "symptomsStatus",
      "Recorded symptoms",
      "State whether symptoms are present and documented.",
      withUnknown([
        { label: "No symptoms recorded", value: "none" },
        { label: "Symptoms present", value: "present" },
      ]),
    ),
    textQuestion(
      "symptoms",
      "Symptom details",
      "Enter concise comma-separated confirmed symptoms.",
      "For example: confusion, constipation",
      { field: "symptomsStatus", value: "present" },
    ),
    booleanQuestion(
      "hypercalcaemiaSymptomsPresent",
      "Symptoms attributed to hypercalcaemia",
      "Confirm whether the documented symptoms meet this referral criterion.",
    ),
    booleanQuestion(
      "endOrganDisease",
      "End-organ disease present",
      "Confirm the current end-organ disease assessment.",
    ),
    booleanQuestion("renalStones", "Renal stones", "Confirm renal-stone history."),
    booleanQuestion(
      "fragilityFractureOrOsteoporosis",
      "Fragility fracture or osteoporosis",
      "Confirm fracture or osteoporosis history.",
    ),
  ],
  "persistent-hyperkalaemia": [
    booleanQuestion(
      "potassiumConfirmed",
      "Potassium result confirmed",
      "Confirm that the result has been verified for eligibility assessment.",
    ),
    selectQuestion("ckdStage", "CKD stage", "Select the confirmed CKD stage.", ckdStageOptions),
    booleanQuestion("heartFailure", "Heart failure present", "Confirm heart-failure status."),
    booleanQuestion("dialysis", "Receiving dialysis", "Confirm current dialysis status."),
    selectQuestion(
      "raasAntagonistStatus",
      "RAAS antagonist status",
      "Record the reason treatment is absent, reduced or not optimised.",
      raasStatusOptions,
    ),
  ],
  "possible-primary-hyperparathyroidism": [
    booleanQuestion(
      "adjustedCalciumConfirmed",
      "Result is albumin-adjusted calcium",
      "Confirm that the entered value is albumin adjusted.",
    ),
    booleanQuestion(
      "primaryHyperparathyroidismSuspected",
      "Primary hyperparathyroidism suspected",
      "Confirm that symptoms or features have raised suspicion of PHPT.",
    ),
    selectQuestion(
      "symptomsStatus",
      "Recorded symptoms",
      "State whether symptoms are present and documented.",
      withUnknown([
        { label: "No symptoms recorded", value: "none" },
        { label: "Symptoms present", value: "present" },
      ]),
    ),
    textQuestion(
      "symptoms",
      "Symptom details",
      "Enter concise comma-separated confirmed symptoms.",
      "For example: polyuria, constipation",
      { field: "symptomsStatus", value: "present" },
    ),
    booleanQuestion("renalStones", "Renal stones", "Confirm renal-stone history."),
    booleanQuestion(
      "fragilityFractureOrOsteoporosis",
      "Fragility fracture or osteoporosis",
      "Confirm fracture or osteoporosis history.",
    ),
  ],
  "primary-adrenal-insufficiency": [
    booleanQuestion(
      "primaryAdrenalInsufficiency",
      "Primary adrenal insufficiency confirmed",
      "Confirm the diagnosis for this context-specific pathway.",
    ),
    booleanQuestion(
      "hyponatraemiaPersistent",
      "Hyponatraemia remains persistent",
      "Confirm persistence using the reviewed sodium trend.",
    ),
    booleanQuestion(
      "sodiumTrendReviewed",
      "Sodium trend reviewed",
      "Confirm that serial sodium results have been reviewed.",
    ),
    selectQuestion(
      "fludrocortisoneDoseStatus",
      "Fludrocortisone dose status",
      "Record the confirmed current dose status.",
      withUnknown([
        { label: "Not taking", value: "not-taking" },
        { label: "Below maximum dose", value: "below-maximum" },
        { label: "Maximum dose", value: "maximum" },
      ]),
    ),
    booleanQuestion(
      "specialistEndocrinologyInvolved",
      "Specialist endocrinology involved",
      "Confirm the current specialist-involvement status.",
    ),
  ],
};

const ivQuestionSets: Partial<Record<ConditionId, readonly ContextQuestion[]>> = {
  hyperkalaemia: [
    numberQuestion("baselineValue", "Baseline potassium (mmol/L)", "Enter the confirmed baseline."),
    booleanQuestion(
      "onIvFluids",
      "Receiving IV fluids",
      "Confirm current or recent IV-fluid therapy.",
    ),
    booleanQuestion(
      "ivFluidTemporalRelationship",
      "Temporal relationship confirmed",
      "Confirm that the abnormality is temporally related to IV-fluid therapy.",
    ),
    booleanQuestion(
      "ivFluidPrescriptionReviewed",
      "IV-fluid prescription reviewed",
      "Confirm review of the prescribed fluid type and volume.",
    ),
    booleanQuestion(
      "medicinesReviewed",
      "Medicines reviewed",
      "Confirm review of contributing medicines.",
    ),
    numberQuestion("egfr", "eGFR (mL/min/1.73m2)", "Enter the confirmed current eGFR."),
    booleanQuestion(
      "alternativeCauseIdentified",
      "Alternative cause identified",
      "Confirm whether another likely cause has been identified.",
    ),
  ],
  hypernatraemia: [
    numberQuestion("baselineValue", "Baseline sodium (mmol/L)", "Enter the confirmed baseline."),
    selectQuestion(
      "baselineValueStatus",
      "Baseline sodium status",
      "Classify the baseline from the reviewed local result.",
      withUnknown([
        { label: "Low", value: "low" },
        { label: "Normal", value: "normal" },
        { label: "High", value: "high" },
      ]),
    ),
    booleanQuestion(
      "onIvFluids",
      "Receiving IV fluids",
      "Confirm current or recent IV-fluid therapy.",
    ),
    booleanQuestion(
      "ivFluidContainsSaline",
      "IV regimen included 0.9% sodium chloride",
      "Confirm the IV-fluid composition from the prescription.",
    ),
    booleanQuestion(
      "ivFluidTemporalRelationship",
      "Temporal relationship confirmed",
      "Confirm that the abnormality is temporally related to IV-fluid therapy.",
    ),
    booleanQuestion(
      "ivFluidPrescriptionReviewed",
      "IV-fluid prescription reviewed",
      "Confirm review of prescribed fluid type and volume.",
    ),
    selectQuestion(
      "fluidStatus",
      "Fluid status",
      "Record the confirmed fluid status.",
      fluidStatusOptions,
    ),
    numberQuestion("egfr", "eGFR (mL/min/1.73m2)", "Enter the confirmed current eGFR."),
    booleanQuestion(
      "alternativeCauseIdentified",
      "Alternative cause identified",
      "Confirm whether another likely cause has been identified.",
    ),
  ],
  hypokalaemia: [
    numberQuestion("baselineValue", "Baseline potassium (mmol/L)", "Enter the confirmed baseline."),
    booleanQuestion(
      "onIvFluids",
      "Receiving IV fluids",
      "Confirm current or recent IV-fluid therapy.",
    ),
    booleanQuestion(
      "ivFluidTemporalRelationship",
      "Temporal relationship confirmed",
      "Confirm that the abnormality is temporally related to IV-fluid therapy.",
    ),
    booleanQuestion(
      "adequatePotassiumProvision",
      "IV prescription provided adequate potassium",
      "Confirm adequacy after reviewing the IV-fluid prescription.",
    ),
    booleanQuestion(
      "ivFluidPrescriptionReviewed",
      "IV-fluid prescription reviewed",
      "Confirm review of prescribed fluid and electrolyte provision.",
    ),
    booleanQuestion(
      "medicinesReviewed",
      "Medicines reviewed",
      "Confirm review of contributing medicines.",
    ),
    booleanQuestion(
      "otherPotassiumLossesIdentified",
      "Other potassium losses identified",
      "Confirm whether another potassium loss has been identified.",
    ),
    numberQuestion("egfr", "eGFR (mL/min/1.73m2)", "Enter the confirmed current eGFR."),
    booleanQuestion(
      "alternativeCauseIdentified",
      "Alternative cause identified",
      "Confirm whether another obvious cause has been identified.",
    ),
  ],
  hyponatraemia: [
    numberQuestion("baselineValue", "Baseline sodium (mmol/L)", "Enter the confirmed baseline."),
    booleanQuestion(
      "onIvFluids",
      "Receiving IV fluids",
      "Confirm current or recent IV-fluid therapy.",
    ),
    booleanQuestion(
      "ivFluidTemporalRelationship",
      "Temporal relationship confirmed",
      "Confirm that the abnormality is temporally related to IV-fluid therapy.",
    ),
    booleanQuestion(
      "ivFluidPrescriptionReviewed",
      "IV-fluid prescription reviewed",
      "Confirm review of prescribed fluid type and volume.",
    ),
    selectQuestion(
      "fluidStatus",
      "Fluid status",
      "Record the confirmed fluid status.",
      fluidStatusOptions,
    ),
    numberQuestion("egfr", "eGFR (mL/min/1.73m2)", "Enter the confirmed current eGFR."),
    booleanQuestion(
      "alternativeCauseIdentified",
      "Alternative cause identified",
      "Confirm whether another likely cause has been identified.",
    ),
  ],
};

const selectionSchema = z
  .object({
    condition: z.string().min(1, "Select an abnormality or monitoring result."),
    electrolyte: z.string().min(1, "Select an electrolyte."),
  })
  .superRefine((value, context) => {
    if (!isElectrolyte(value.electrolyte)) {
      return;
    }

    if (
      !getConditionOptions(value.electrolyte).some((option) => option.value === value.condition)
    ) {
      context.addIssue({
        code: "custom",
        message: "Select an option available for the chosen electrolyte.",
        path: ["condition"],
      });
    }
  });

const detailsSchema = z.object({
  ageYears: requiredNumberString("Enter age in completed years.", {
    integer: true,
    max: 130,
    maxMessage: "Enter an age of 130 years or less.",
    min: 16,
    minMessage: "This prototype supports adults aged 16 years or over.",
  }),
  measuredValue: requiredNumberString("Enter the latest result.", {
    min: 0,
    minMessage: "The result cannot be negative.",
  }),
  pregnancyStatus: z.string().min(1, "Select pregnancy status."),
});

const contextSelectionSchema = z.object({
  clinicalContext: z.string().min(1, "Select the clinical context that was confirmed."),
});

export function getConditionOptions(electrolyte: ElectrolyteId | ""): readonly SelectOption[] {
  return electrolyte === "" ? [] : conditionOptionsByElectrolyte[electrolyte];
}

export function getClinicalContextOptions(
  electrolyte: ElectrolyteId | "",
  condition: ConditionId | "",
): readonly ClinicalContextOption[] {
  if (electrolyte === "" || condition === "") {
    return [];
  }

  const matching = contextOptions.filter(
    (option) => option.electrolytes.includes(electrolyte) && option.conditions.includes(condition),
  );

  return [...matching, generalContext];
}

export function getContextQuestions(state: AssessmentFormState): readonly ContextQuestion[] {
  if (state.clinicalContext === "") {
    return [];
  }

  if (state.clinicalContext === "iv-fluid-related") {
    return state.condition === "" ? [] : (ivQuestionSets[state.condition] ?? []);
  }

  return questionSets[state.clinicalContext] ?? [];
}

export function getVisibleContextQuestions(state: AssessmentFormState): readonly ContextQuestion[] {
  return getContextQuestions(state).filter(
    (question) =>
      question.showWhen === undefined ||
      state.contextAnswers[question.showWhen.field] === question.showWhen.value,
  );
}

export function validateAssessmentStep(
  state: AssessmentFormState,
  stepIndex: number,
): AssessmentFormErrors {
  if (stepIndex === 0) {
    return zodErrors(
      selectionSchema.safeParse({ condition: state.condition, electrolyte: state.electrolyte }),
    );
  }

  if (stepIndex === 1) {
    const errors = zodErrors(
      detailsSchema.safeParse({
        ageYears: state.ageYears,
        measuredValue: state.measuredValue,
        pregnancyStatus: state.pregnancyStatus,
      }),
    );

    if (errors.measuredValue === undefined) {
      const consistencyError = measuredValueConsistencyError(state);

      if (consistencyError !== null) {
        errors.measuredValue = consistencyError;
      }
    }

    return errors;
  }

  if (stepIndex === 2) {
    const errors = zodErrors(
      contextSelectionSchema.safeParse({ clinicalContext: state.clinicalContext }),
    );

    if (
      state.clinicalContext !== "" &&
      !getClinicalContextOptions(state.electrolyte, state.condition).some(
        (option) => option.id === state.clinicalContext,
      )
    ) {
      errors.clinicalContext = "Select a context available for this assessment.";
    }

    return errors;
  }

  if (stepIndex === 3) {
    return validateContextAnswers(state);
  }

  return mergeErrors(
    validateAssessmentStep(state, 0),
    validateAssessmentStep(state, 1),
    validateAssessmentStep(state, 2),
    validateAssessmentStep(state, 3),
  );
}

export function buildValidatedAssessment(state: AssessmentFormState): BuildAssessmentResult {
  const errors = validateAssessmentStep(state, 4);

  if (Object.keys(errors).length > 0) {
    return { data: null, errors, success: false };
  }

  const context = buildAssessmentContext(state);
  const parsed = validatedAssessmentSchema.safeParse({
    ageYears: Number(state.ageYears),
    clinicalContext: state.clinicalContext,
    condition: state.condition,
    context,
    electrolyte: state.electrolyte,
    measuredValue: Number(state.measuredValue),
    unit: "mmol/L",
  });

  if (!parsed.success) {
    return { data: null, errors: zodIssueErrors(parsed.error.issues), success: false };
  }

  return { data: parsed.data, errors: null, success: true };
}

export function formatAnswer(question: ContextQuestion, state: AssessmentFormState): string {
  const value = state.contextAnswers[question.id] ?? "";

  if (value === "") {
    return "Not answered";
  }

  if (question.type === "boolean") {
    return booleanAnswerOptions.find((option) => option.value === value)?.label ?? value;
  }

  if (question.type === "select") {
    return question.options.find((option) => option.value === value)?.label ?? value;
  }

  if (question.type === "number") {
    return value;
  }

  return value;
}

export function formatCondition(condition: ConditionId | ""): string {
  if (condition === "") {
    return "Not selected";
  }

  for (const options of Object.values(conditionOptionsByElectrolyte)) {
    const option = options.find((candidate) => candidate.value === condition);

    if (option !== undefined) {
      return option.label;
    }
  }

  return condition;
}

export function formatElectrolyte(electrolyte: ElectrolyteId | ""): string {
  return electrolyteOptions.find((option) => option.id === electrolyte)?.label ?? "Not selected";
}

export function formatClinicalContext(clinicalContext: ClinicalContext | ""): string {
  if (clinicalContext === "") {
    return "Not selected";
  }

  return (
    [...contextOptions, generalContext].find((option) => option.id === clinicalContext)?.label ??
    clinicalContext
  );
}

function validateContextAnswers(state: AssessmentFormState): AssessmentFormErrors {
  const errors: AssessmentFormErrors = {};

  for (const question of getVisibleContextQuestions(state)) {
    const value = state.contextAnswers[question.id] ?? "";
    const parsed = questionAnswerSchema(question).safeParse(value);

    if (!parsed.success) {
      errors[`contextAnswers.${question.id}`] =
        parsed.error.issues[0]?.message ?? "Check this field.";
    }
  }

  return errors;
}

function measuredValueConsistencyError(state: AssessmentFormState): string | null {
  if (state.condition === "" || state.electrolyte === "" || state.measuredValue.trim() === "") {
    return null;
  }

  const value = Number(state.measuredValue);

  if (!Number.isFinite(value)) {
    return null;
  }

  return getMeasuredValueConsistencyIssue({
    condition: state.condition,
    electrolyte: state.electrolyte,
    measuredValue: value,
  });
}

function buildAssessmentContext(state: AssessmentFormState): AssessmentContext {
  const context: Record<string, boolean | number | string | string[]> = {
    pregnancyStatus: state.pregnancyStatus,
  };

  for (const question of getVisibleContextQuestions(state)) {
    if (question.contextField === undefined) {
      continue;
    }

    const value = state.contextAnswers[question.id];

    if (value === undefined || value === "" || value === "unknown") {
      continue;
    }

    if (question.type === "boolean") {
      context[question.contextField] = value === "yes";
      continue;
    }

    if (question.type === "number") {
      context[question.contextField] = Number(value);
      continue;
    }

    if (question.contextField === "symptoms") {
      context.symptoms = value
        .split(",")
        .map((symptom) => symptom.trim())
        .filter(Boolean);
      continue;
    }

    context[question.contextField] = value;
  }

  const symptomsStatus = state.contextAnswers.symptomsStatus;

  if (symptomsStatus === "none") {
    context.symptoms = [];
  }

  return context as AssessmentContext;
}

function questionAnswerSchema(question: ContextQuestion): z.ZodType<string> {
  if (question.type === "boolean") {
    return z.enum(["yes", "no", "unknown"], {
      error: "Select yes, no, or not confirmed.",
    });
  }

  if (question.type === "select") {
    return z
      .string()
      .min(1, "Select a confirmed value or not confirmed.")
      .refine(
        (value) => question.options.some((option) => option.value === value),
        "Select one of the available values.",
      );
  }

  if (question.type === "number") {
    return requiredNumberString("Enter the confirmed value.", {
      ...(question.max === undefined ? {} : { max: question.max }),
      ...(question.min === undefined ? { min: 0 } : { min: question.min }),
    });
  }

  return z.string().trim().min(1, "Enter the confirmed symptom details.");
}

function requiredNumberString(
  requiredMessage: string,
  options: {
    integer?: boolean;
    max?: number;
    maxMessage?: string;
    min?: number;
    minMessage?: string;
  },
): z.ZodType<string> {
  return z
    .string()
    .trim()
    .min(1, requiredMessage)
    .superRefine((value, context) => {
      if (value.length === 0) {
        return;
      }

      const number = Number(value);

      if (!Number.isFinite(number)) {
        context.addIssue({ code: "custom", message: "Enter a valid number." });
        return;
      }

      if (options.integer === true && !Number.isInteger(number)) {
        context.addIssue({ code: "custom", message: "Enter a whole number." });
      }

      if (options.min !== undefined && number < options.min) {
        context.addIssue({
          code: "custom",
          message: options.minMessage ?? `Enter a value of ${options.min} or more.`,
        });
      }

      if (options.max !== undefined && number > options.max) {
        context.addIssue({
          code: "custom",
          message: options.maxMessage ?? `Enter a value of ${options.max} or less.`,
        });
      }
    });
}

function zodErrors(result: z.ZodSafeParseResult<unknown>): AssessmentFormErrors {
  return result.success ? {} : zodIssueErrors(result.error.issues);
}

function zodIssueErrors(issues: readonly z.core.$ZodIssue[]): AssessmentFormErrors {
  const errors: AssessmentFormErrors = {};

  for (const issue of issues) {
    const field = issue.path.length === 0 ? "root" : issue.path.join(".");
    errors[field] ??= issue.message;
  }

  return errors;
}

function mergeErrors(...groups: AssessmentFormErrors[]): AssessmentFormErrors {
  return Object.assign({}, ...groups);
}

function isElectrolyte(value: string): value is ElectrolyteId {
  return electrolyteOptions.some((option) => option.id === value);
}

function withUnknown(options: readonly SelectOption[]): readonly SelectOption[] {
  return [...options, { label: "Not confirmed", value: "unknown" }];
}

function booleanQuestion(field: ContextField, label: string, description: string): ContextQuestion {
  return { contextField: field, description, id: field, label, type: "boolean" };
}

function numberQuestion(field: ContextField, label: string, description: string): ContextQuestion {
  return {
    contextField: field,
    description,
    id: field,
    inputMode: "decimal",
    min: 0,
    step: "any",
    label,
    type: "number",
  };
}

function selectQuestion(
  field: ContextField | "symptomsStatus",
  label: string,
  description: string,
  options: readonly SelectOption[],
): ContextQuestion {
  return {
    ...(field === "symptomsStatus" ? {} : { contextField: field }),
    description,
    id: field,
    label,
    options,
    type: "select",
  };
}

function textQuestion(
  field: ContextField,
  label: string,
  description: string,
  placeholder: string,
  showWhen: NonNullable<ContextQuestion["showWhen"]>,
): ContextQuestion {
  return {
    contextField: field,
    description,
    id: field,
    label,
    placeholder,
    showWhen,
    type: "text",
  };
}

export { booleanAnswerOptions, clinicalContextSchema };
