import type { ValidatedAssessment } from "./assessment.ts";
import type { RuleEvaluator, RuleEvaluatorDecision, RuleId, RuleMatchFact } from "./types.ts";

type AssessmentContext = ValidatedAssessment["context"];

const noMatch = { kind: "no-match" } as const;
const eligibleCkdStages = new Set<AssessmentContext["ckdStage"]>(["3b", "4", "5"]);

const acuteLifeThreateningEvaluator: RuleEvaluator = {
  contexts: ["acute-life-threatening-hyperkalaemia"],
  evaluate: (assessment) => {
    if (!isHyperkalaemiaAssessment(assessment)) {
      return noMatch;
    }

    const context = assessment.context;
    const missingFields = missing(context, [
      "acuteLifeThreateningHyperkalaemia",
      "emergencyCare",
      "standardEmergencyCare",
    ]);

    if (missingFields.length > 0) {
      return blocked(missingFields);
    }

    if (
      context.acuteLifeThreateningHyperkalaemia !== true ||
      context.emergencyCare !== true ||
      context.standardEmergencyCare !== true
    ) {
      return noMatch;
    }

    return match("NICE-K-ACUTE-BINDER-OPTIONS-001", [
      potassiumFact(assessment),
      {
        field: "context.acuteLifeThreateningHyperkalaemia",
        label: "Acute life-threatening hyperkalaemia confirmed",
        value: true,
      },
      { field: "context.emergencyCare", label: "Emergency-care setting", value: true },
      {
        field: "context.standardEmergencyCare",
        label: "Standard emergency care underway",
        value: true,
      },
    ]);
  },
  id: "hyperkalaemia-acute-binder-options",
  order: 10,
};

const ivFluidHyperkalaemiaEvaluator: RuleEvaluator = {
  contexts: ["iv-fluid-related"],
  evaluate: (assessment) => {
    if (!isHyperkalaemiaAssessment(assessment) || assessment.measuredValue <= 5.5) {
      return noMatch;
    }

    const context = assessment.context;
    const missingFields = missing(context, [
      "alternativeCauseIdentified",
      "baselineValue",
      "egfr",
      "ivFluidPrescriptionReviewed",
      "ivFluidTemporalRelationship",
      "medicinesReviewed",
      "onIvFluids",
    ]);

    if (missingFields.length > 0) {
      return blocked(missingFields);
    }

    if (
      context.onIvFluids !== true ||
      context.ivFluidTemporalRelationship !== true ||
      context.alternativeCauseIdentified !== false
    ) {
      return noMatch;
    }

    const incompleteReviews = unconfirmed(context, [
      "ivFluidPrescriptionReviewed",
      "medicinesReviewed",
    ]);

    if (incompleteReviews.length > 0) {
      return blocked(incompleteReviews);
    }

    return match("NICE-K-HYPER-IV-001", [
      potassiumFact(assessment),
      {
        field: "context.baselineValue",
        label: "Baseline potassium",
        value: context.baselineValue!,
      },
      { field: "context.egfr", label: "eGFR", value: context.egfr! },
      { field: "context.onIvFluids", label: "Receiving IV fluids", value: true },
      {
        field: "context.ivFluidTemporalRelationship",
        label: "Temporal relationship to IV fluids confirmed",
        value: true,
      },
      {
        field: "context.alternativeCauseIdentified",
        label: "Alternative cause identified",
        value: false,
      },
    ]);
  },
  id: "hyperkalaemia-iv-fluid",
  order: 10,
};

const ckdRaasMonitoringEvaluator: RuleEvaluator = {
  contexts: ["ckd-raas-monitoring"],
  evaluate: (assessment) => {
    if (!isPotassiumAssessment(assessment)) {
      return noMatch;
    }

    const context = assessment.context;
    const prerequisiteFields = missing(context, ["ckdStage", "raasAntagonistStatus"]);

    if (prerequisiteFields.length > 0) {
      return blocked(prerequisiteFields);
    }

    if (
      context.ckdStage === "none" ||
      !["starting", "dose-increased"].includes(context.raasAntagonistStatus!)
    ) {
      return noMatch;
    }

    const requiredFields = missing(context, ["egfr", "raasChangeDateKnown"]);

    if (requiredFields.length > 0) {
      return blocked(requiredFields);
    }

    if (context.raasChangeDateKnown !== true) {
      return blocked(["context.raasChangeDateKnown"]);
    }

    return match("NICE-K-CKD-MONITOR-001", [
      potassiumFact(assessment),
      { field: "context.ckdStage", label: "CKD stage", value: context.ckdStage! },
      { field: "context.egfr", label: "eGFR", value: context.egfr! },
      {
        field: "context.raasAntagonistStatus",
        label: "RAAS antagonist status",
        value: context.raasAntagonistStatus!,
      },
      {
        field: "context.raasChangeDateKnown",
        label: "Medicine or dose-change date confirmed",
        value: true,
      },
    ]);
  },
  id: "hyperkalaemia-ckd-raas-monitoring",
  order: 10,
};

const ckdRaasPretreatmentEvaluator: RuleEvaluator = {
  contexts: ["ckd-before-raas-antagonist"],
  evaluate: (assessment) => {
    if (!isHyperkalaemiaAssessment(assessment) || assessment.measuredValue <= 5) {
      return noMatch;
    }

    const context = assessment.context;
    const missingFields = missing(context, ["ckdStage", "raasAntagonistStatus"]);

    if (missingFields.length > 0) {
      return blocked(missingFields);
    }

    if (context.ckdStage === "none" || context.raasAntagonistStatus !== "planned") {
      return noMatch;
    }

    return match("NICE-K-CKD-PRETREAT-001", [
      potassiumFact(assessment),
      { field: "context.ckdStage", label: "CKD stage", value: context.ckdStage! },
      {
        field: "context.raasAntagonistStatus",
        label: "RAAS antagonist status",
        value: context.raasAntagonistStatus!,
      },
    ]);
  },
  id: "hyperkalaemia-ckd-raas-pretreatment",
  order: 10,
};

const ckdRaasStoppingEvaluator: RuleEvaluator = {
  contexts: ["ckd-on-raas-antagonist"],
  evaluate: (assessment) => {
    if (!isHyperkalaemiaAssessment(assessment) || assessment.measuredValue < 6) {
      return noMatch;
    }

    const context = assessment.context;
    const missingFields = missing(context, [
      "ckdStage",
      "otherHyperkalaemiaMedicinesStopped",
      "raasAntagonistStatus",
    ]);

    if (missingFields.length > 0) {
      return blocked(missingFields);
    }

    if (
      context.ckdStage === "none" ||
      context.raasAntagonistStatus !== "taking" ||
      context.otherHyperkalaemiaMedicinesStopped !== true
    ) {
      return noMatch;
    }

    return match("NICE-K-CKD-STOP-001", [
      potassiumFact(assessment),
      { field: "context.ckdStage", label: "CKD stage", value: context.ckdStage! },
      {
        field: "context.raasAntagonistStatus",
        label: "RAAS antagonist status",
        value: context.raasAntagonistStatus!,
      },
      {
        field: "context.otherHyperkalaemiaMedicinesStopped",
        label: "Other hyperkalaemia-promoting medicines stopped",
        value: true,
      },
    ]);
  },
  id: "hyperkalaemia-ckd-raas-stopping",
  order: 10,
};

const persistentBinderOptionsEvaluator: RuleEvaluator = {
  contexts: ["persistent-hyperkalaemia"],
  evaluate: (assessment) =>
    evaluateMedicineEligibility(assessment, {
      applicableRaasStatuses: ["not-taking-because-hyperkalaemia", "reduced-because-hyperkalaemia"],
      minimumPotassium: 6,
      ruleId: "NICE-K-BINDER-OPTIONS-001",
    }),
  id: "hyperkalaemia-persistent-binder-options",
  order: 10,
};

const sodiumZirconiumCyclosilicateEligibilityEvaluator: RuleEvaluator = {
  contexts: ["persistent-hyperkalaemia"],
  evaluate: (assessment) =>
    evaluateMedicineEligibility(assessment, {
      applicableRaasStatuses: [
        "not-optimised-because-hyperkalaemia",
        "not-taking-because-hyperkalaemia",
        "reduced-because-hyperkalaemia",
      ],
      minimumPotassium: 5.5,
      ruleId: "NICE-K-SZC-ELIG-001",
    }),
  id: "hyperkalaemia-szc-eligibility",
  order: 20,
};

const akiEscalationEvaluator: RuleEvaluator = {
  contexts: ["aki-not-responding-to-treatment"],
  evaluate: (assessment) => {
    if (!isHyperkalaemiaAssessment(assessment)) {
      return noMatch;
    }

    const context = assessment.context;
    const prerequisiteFields = missing(context, ["aki", "medicalManagementResponse"]);

    if (prerequisiteFields.length > 0) {
      return blocked(prerequisiteFields);
    }

    if (context.aki !== true || context.medicalManagementResponse !== "not-responding") {
      return noMatch;
    }

    const requiredFields = missing(context, [
      "clinicalConditionReviewed",
      "ecgOrComplicationsReviewed",
      "fluidStatus",
      "potassiumTrendReviewed",
      "treatmentsReviewed",
    ]);

    if (requiredFields.length > 0) {
      return blocked(requiredFields);
    }

    const incompleteReviews = unconfirmed(context, [
      "clinicalConditionReviewed",
      "ecgOrComplicationsReviewed",
      "potassiumTrendReviewed",
      "treatmentsReviewed",
    ]);

    if (incompleteReviews.length > 0) {
      return blocked(incompleteReviews);
    }

    return match("NICE-K-AKI-RRT-001", [
      potassiumFact(assessment),
      { field: "context.aki", label: "AKI confirmed", value: true },
      {
        field: "context.medicalManagementResponse",
        label: "Response to medical management",
        value: "not-responding",
      },
      {
        field: "context.potassiumTrendReviewed",
        label: "Potassium trend reviewed",
        value: true,
      },
      {
        field: "context.ecgOrComplicationsReviewed",
        label: "ECG or complications reviewed",
        value: true,
      },
      { field: "context.fluidStatus", label: "Fluid status", value: context.fluidStatus! },
    ]);
  },
  id: "hyperkalaemia-aki-escalation",
  order: 10,
};

export const hyperkalaemiaEvaluators = Object.freeze([
  acuteLifeThreateningEvaluator,
  ivFluidHyperkalaemiaEvaluator,
  ckdRaasMonitoringEvaluator,
  ckdRaasPretreatmentEvaluator,
  ckdRaasStoppingEvaluator,
  persistentBinderOptionsEvaluator,
  sodiumZirconiumCyclosilicateEligibilityEvaluator,
  akiEscalationEvaluator,
] satisfies readonly RuleEvaluator[]);

interface MedicineEligibilityOptions {
  applicableRaasStatuses: readonly NonNullable<AssessmentContext["raasAntagonistStatus"]>[];
  minimumPotassium: number;
  ruleId: "NICE-K-BINDER-OPTIONS-001" | "NICE-K-SZC-ELIG-001";
}

function evaluateMedicineEligibility(
  assessment: ValidatedAssessment,
  options: MedicineEligibilityOptions,
): RuleEvaluatorDecision {
  if (
    !isHyperkalaemiaAssessment(assessment) ||
    assessment.measuredValue < options.minimumPotassium
  ) {
    return noMatch;
  }

  const context = assessment.context;
  const confirmationFields = missing(context, ["potassiumConfirmed", "raasAntagonistStatus"]);

  if (confirmationFields.length > 0) {
    return blocked(confirmationFields);
  }

  if (
    context.potassiumConfirmed !== true ||
    !options.applicableRaasStatuses.includes(context.raasAntagonistStatus!)
  ) {
    return noMatch;
  }

  const dialysisFields = missing(context, ["dialysis"]);

  if (dialysisFields.length > 0) {
    return blocked(dialysisFields);
  }

  if (context.dialysis === true) {
    return noMatch;
  }

  const eligibility = ckdOrHeartFailureEligibility(context);

  if (eligibility.kind === "blocked") {
    return eligibility;
  }

  if (!eligibility.eligible) {
    return noMatch;
  }

  const indicationFact: RuleMatchFact =
    context.heartFailure === true
      ? { field: "context.heartFailure", label: "Heart failure", value: true }
      : { field: "context.ckdStage", label: "CKD stage", value: context.ckdStage! };

  return match(options.ruleId, [
    potassiumFact(assessment),
    { field: "context.potassiumConfirmed", label: "Potassium confirmed", value: true },
    indicationFact,
    {
      field: "context.raasAntagonistStatus",
      label: "RAAS antagonist status",
      value: context.raasAntagonistStatus!,
    },
    { field: "context.dialysis", label: "Receiving dialysis", value: false },
  ]);
}

function ckdOrHeartFailureEligibility(
  context: AssessmentContext,
): { eligible: boolean; kind: "resolved" } | Extract<RuleEvaluatorDecision, { kind: "blocked" }> {
  if (context.heartFailure === true || eligibleCkdStages.has(context.ckdStage)) {
    return { eligible: true, kind: "resolved" };
  }

  const missingFields: string[] = [];

  if (context.ckdStage === undefined) {
    missingFields.push("context.ckdStage");
  }

  if (context.heartFailure === undefined) {
    missingFields.push("context.heartFailure");
  }

  return missingFields.length > 0
    ? { kind: "blocked", missingFields }
    : { eligible: false, kind: "resolved" };
}

function isHyperkalaemiaAssessment(assessment: ValidatedAssessment): boolean {
  return assessment.electrolyte === "potassium" && assessment.condition === "hyperkalaemia";
}

function isPotassiumAssessment(assessment: ValidatedAssessment): boolean {
  return assessment.electrolyte === "potassium";
}

function potassiumFact(assessment: ValidatedAssessment): RuleMatchFact {
  return {
    field: "measuredValue",
    label: "Potassium",
    value: `${assessment.measuredValue} ${assessment.unit}`,
  };
}

function match(ruleId: RuleId, facts: RuleMatchFact[]): RuleEvaluatorDecision {
  return { facts, kind: "match", ruleId };
}

function blocked(missingFields: string[]): RuleEvaluatorDecision {
  return { kind: "blocked", missingFields };
}

function missing<K extends keyof AssessmentContext>(
  context: AssessmentContext,
  fields: readonly K[],
): string[] {
  return fields
    .filter((field) => context[field] === undefined)
    .map((field) => `context.${String(field)}`);
}

function unconfirmed<K extends keyof AssessmentContext>(
  context: AssessmentContext,
  fields: readonly K[],
): string[] {
  return fields
    .filter((field) => context[field] !== true)
    .map((field) => `context.${String(field)}`);
}
