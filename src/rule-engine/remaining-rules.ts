import type { ValidatedAssessment } from "./assessment.ts";
import type { RuleEvaluator, RuleEvaluatorDecision, RuleId, RuleMatchFact } from "./types.ts";

type AssessmentContext = ValidatedAssessment["context"];

const noMatch = { kind: "no-match" } as const;

const ivFluidHyponatraemiaEvaluator: RuleEvaluator = {
  contexts: ["iv-fluid-related"],
  evaluate: (assessment) => {
    if (!isAssessment(assessment, "sodium", "hyponatraemia") || assessment.measuredValue >= 130) {
      return noMatch;
    }

    const context = assessment.context;
    const missingFields = missing(context, [
      "alternativeCauseIdentified",
      "baselineValue",
      "egfr",
      "fluidStatus",
      "ivFluidPrescriptionReviewed",
      "ivFluidTemporalRelationship",
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

    if (context.ivFluidPrescriptionReviewed !== true) {
      return blocked(["context.ivFluidPrescriptionReviewed"]);
    }

    return match("NICE-NA-HYPO-IV-001", [
      electrolyteFact(assessment, "Sodium"),
      { field: "context.baselineValue", label: "Baseline sodium", value: context.baselineValue! },
      { field: "context.fluidStatus", label: "Fluid status", value: context.fluidStatus! },
      { field: "context.egfr", label: "eGFR", value: context.egfr! },
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
  id: "remaining-iv-fluid-hyponatraemia",
  order: 10,
};

const ivFluidHypernatraemiaEvaluator: RuleEvaluator = {
  contexts: ["iv-fluid-related"],
  evaluate: (assessment) => {
    if (!isAssessment(assessment, "sodium", "hypernatraemia") || assessment.measuredValue < 155) {
      return noMatch;
    }

    const context = assessment.context;
    const missingFields = missing(context, [
      "alternativeCauseIdentified",
      "baselineValue",
      "baselineValueStatus",
      "egfr",
      "fluidStatus",
      "ivFluidContainsSaline",
      "ivFluidPrescriptionReviewed",
      "ivFluidTemporalRelationship",
      "onIvFluids",
    ]);

    if (missingFields.length > 0) {
      return blocked(missingFields);
    }

    if (context.baselineValueStatus === "unknown") {
      return blocked(["context.baselineValueStatus"]);
    }

    if (
      context.onIvFluids !== true ||
      context.ivFluidTemporalRelationship !== true ||
      context.ivFluidContainsSaline !== true ||
      context.alternativeCauseIdentified !== false ||
      context.baselineValueStatus === "high"
    ) {
      return noMatch;
    }

    if (context.ivFluidPrescriptionReviewed !== true) {
      return blocked(["context.ivFluidPrescriptionReviewed"]);
    }

    return match("NICE-NA-HYPER-IV-001", [
      electrolyteFact(assessment, "Sodium"),
      { field: "context.baselineValue", label: "Baseline sodium", value: context.baselineValue! },
      {
        field: "context.baselineValueStatus",
        label: "Baseline sodium status",
        value: context.baselineValueStatus!,
      },
      {
        field: "context.ivFluidContainsSaline",
        label: "IV regimen included 0.9% sodium chloride",
        value: true,
      },
      { field: "context.fluidStatus", label: "Fluid status", value: context.fluidStatus! },
      { field: "context.egfr", label: "eGFR", value: context.egfr! },
      {
        field: "context.alternativeCauseIdentified",
        label: "Alternative cause identified",
        value: false,
      },
    ]);
  },
  id: "remaining-iv-fluid-hypernatraemia",
  order: 20,
};

const ivFluidHypokalaemiaEvaluator: RuleEvaluator = {
  contexts: ["iv-fluid-related"],
  evaluate: (assessment) => {
    if (!isAssessment(assessment, "potassium", "hypokalaemia") || assessment.measuredValue >= 3) {
      return noMatch;
    }

    const context = assessment.context;
    const missingFields = missing(context, [
      "adequatePotassiumProvision",
      "alternativeCauseIdentified",
      "baselineValue",
      "egfr",
      "ivFluidPrescriptionReviewed",
      "ivFluidTemporalRelationship",
      "medicinesReviewed",
      "onIvFluids",
      "otherPotassiumLossesIdentified",
    ]);

    if (missingFields.length > 0) {
      return blocked(missingFields);
    }

    if (
      context.onIvFluids !== true ||
      context.ivFluidTemporalRelationship !== true ||
      context.adequatePotassiumProvision !== false ||
      context.alternativeCauseIdentified !== false ||
      context.otherPotassiumLossesIdentified !== false
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

    return match("NICE-K-HYPO-IV-001", [
      electrolyteFact(assessment, "Potassium"),
      {
        field: "context.baselineValue",
        label: "Baseline potassium",
        value: context.baselineValue!,
      },
      { field: "context.egfr", label: "eGFR", value: context.egfr! },
      {
        field: "context.adequatePotassiumProvision",
        label: "Adequate potassium provision",
        value: false,
      },
      {
        field: "context.otherPotassiumLossesIdentified",
        label: "Other potassium losses identified",
        value: false,
      },
      {
        field: "context.alternativeCauseIdentified",
        label: "Alternative cause identified",
        value: false,
      },
    ]);
  },
  id: "remaining-iv-fluid-hypokalaemia",
  order: 30,
};

const phptScreeningEvaluator: RuleEvaluator = {
  contexts: ["possible-primary-hyperparathyroidism"],
  evaluate: (assessment) => {
    if (!isAssessment(assessment, "calcium", "hypercalcaemia") || assessment.measuredValue < 2.6) {
      return noMatch;
    }

    const context = assessment.context;
    const missingFields = missing(context, [
      "adjustedCalciumConfirmed",
      "fragilityFractureOrOsteoporosis",
      "primaryHyperparathyroidismSuspected",
      "renalStones",
      "symptoms",
    ]);

    if (missingFields.length > 0) {
      return blocked(missingFields);
    }

    if (
      context.adjustedCalciumConfirmed !== true ||
      context.primaryHyperparathyroidismSuspected !== true
    ) {
      return noMatch;
    }

    return match("NICE-CA-PHPT-SCREEN-001", [
      electrolyteFact(assessment, "Albumin-adjusted calcium"),
      {
        field: "context.primaryHyperparathyroidismSuspected",
        label: "Primary hyperparathyroidism suspected",
        value: true,
      },
      {
        field: "context.symptoms",
        label: "Symptoms",
        value: symptomSummary(context.symptoms!),
      },
      {
        field: "context.renalStones",
        label: "Renal stones",
        value: context.renalStones!,
      },
      {
        field: "context.fragilityFractureOrOsteoporosis",
        label: "Fragility fracture or osteoporosis",
        value: context.fragilityFractureOrOsteoporosis!,
      },
    ]);
  },
  id: "remaining-phpt-screening",
  order: 10,
};

const phptReferralEvaluator: RuleEvaluator = {
  contexts: ["confirmed-primary-hyperparathyroidism"],
  evaluate: (assessment) => {
    if (!isAssessment(assessment, "calcium", "hypercalcaemia")) {
      return noMatch;
    }

    const context = assessment.context;
    const confirmationFields = missing(context, [
      "adjustedCalciumConfirmed",
      "confirmedPrimaryHyperparathyroidism",
    ]);

    if (confirmationFields.length > 0) {
      return blocked(confirmationFields);
    }

    if (
      context.adjustedCalciumConfirmed !== true ||
      context.confirmedPrimaryHyperparathyroidism !== true
    ) {
      return noMatch;
    }

    const criteriaFields = missing(context, [
      "endOrganDisease",
      "fragilityFractureOrOsteoporosis",
      "hypercalcaemiaSymptomsPresent",
      "renalStones",
      "symptoms",
    ]);

    if (criteriaFields.length > 0) {
      return blocked(criteriaFields);
    }

    if (context.hypercalcaemiaSymptomsPresent === true && context.symptoms!.length === 0) {
      return blocked(["context.symptoms"]);
    }

    const criteria = phptReferralCriteria(assessment);

    if (criteria.length === 0) {
      return noMatch;
    }

    return match("NICE-CA-PHPT-REFER-001", [
      {
        field: "context.confirmedPrimaryHyperparathyroidism",
        label: "Primary hyperparathyroidism confirmed",
        value: true,
      },
      ...criteria,
    ]);
  },
  id: "remaining-phpt-referral",
  order: 10,
};

const phptConsiderReferralEvaluator: RuleEvaluator = {
  contexts: ["confirmed-primary-hyperparathyroidism"],
  evaluate: (assessment) => {
    if (!isAssessment(assessment, "calcium", "hypercalcaemia")) {
      return noMatch;
    }

    const context = assessment.context;
    const requiredFields = missing(context, [
      "adjustedCalciumConfirmed",
      "confirmedPrimaryHyperparathyroidism",
      "endOrganDisease",
      "fragilityFractureOrOsteoporosis",
      "hypercalcaemiaSymptomsPresent",
      "renalStones",
      "symptoms",
    ]);

    if (requiredFields.length > 0) {
      return blocked(requiredFields);
    }

    if (
      context.adjustedCalciumConfirmed !== true ||
      context.confirmedPrimaryHyperparathyroidism !== true
    ) {
      return noMatch;
    }

    if (context.hypercalcaemiaSymptomsPresent === true && context.symptoms!.length === 0) {
      return blocked(["context.symptoms"]);
    }

    if (phptReferralCriteria(assessment).length > 0) {
      return noMatch;
    }

    return match("NICE-CA-PHPT-CONSIDER-REFER-001", [
      electrolyteFact(assessment, "Albumin-adjusted calcium"),
      {
        field: "context.confirmedPrimaryHyperparathyroidism",
        label: "Primary hyperparathyroidism confirmed",
        value: true,
      },
      {
        field: "referralCriteria",
        label: "Mandatory referral criteria confirmed",
        value: false,
      },
    ]);
  },
  id: "remaining-phpt-consider-referral",
  order: 20,
};

const adrenalHyponatraemiaEvaluator: RuleEvaluator = {
  contexts: ["primary-adrenal-insufficiency"],
  evaluate: (assessment) => {
    if (!isAssessment(assessment, "sodium", "hyponatraemia")) {
      return noMatch;
    }

    const context = assessment.context;
    const missingFields = missing(context, [
      "fludrocortisoneDoseStatus",
      "hyponatraemiaPersistent",
      "primaryAdrenalInsufficiency",
      "sodiumTrendReviewed",
      "specialistEndocrinologyInvolved",
    ]);

    if (missingFields.length > 0) {
      return blocked(missingFields);
    }

    if (
      context.primaryAdrenalInsufficiency !== true ||
      context.hyponatraemiaPersistent !== true ||
      context.fludrocortisoneDoseStatus !== "maximum"
    ) {
      return noMatch;
    }

    if (context.sodiumTrendReviewed !== true) {
      return blocked(["context.sodiumTrendReviewed"]);
    }

    return match("NICE-NA-ADRENAL-001", [
      electrolyteFact(assessment, "Sodium"),
      {
        field: "context.primaryAdrenalInsufficiency",
        label: "Primary adrenal insufficiency confirmed",
        value: true,
      },
      {
        field: "context.hyponatraemiaPersistent",
        label: "Hyponatraemia persistent",
        value: true,
      },
      {
        field: "context.fludrocortisoneDoseStatus",
        label: "Fludrocortisone dose status",
        value: "maximum",
      },
      {
        field: "context.specialistEndocrinologyInvolved",
        label: "Specialist endocrinology involved",
        value: context.specialistEndocrinologyInvolved!,
      },
    ]);
  },
  id: "remaining-adrenal-hyponatraemia",
  order: 10,
};

export const remainingNiceRuleEvaluators = Object.freeze([
  ivFluidHyponatraemiaEvaluator,
  ivFluidHypernatraemiaEvaluator,
  ivFluidHypokalaemiaEvaluator,
  phptScreeningEvaluator,
  phptReferralEvaluator,
  phptConsiderReferralEvaluator,
  adrenalHyponatraemiaEvaluator,
] satisfies readonly RuleEvaluator[]);

function phptReferralCriteria(assessment: ValidatedAssessment): RuleMatchFact[] {
  const context = assessment.context;
  const facts: RuleMatchFact[] = [];

  if (assessment.measuredValue >= 2.85) {
    facts.push(electrolyteFact(assessment, "Albumin-adjusted calcium"));
  }

  if (context.hypercalcaemiaSymptomsPresent === true) {
    facts.push({
      field: "context.symptoms",
      label: "Hypercalcaemia symptoms",
      value: symptomSummary(context.symptoms!),
    });
  }

  if (context.endOrganDisease === true) {
    facts.push({ field: "context.endOrganDisease", label: "End-organ disease", value: true });
  }

  if (context.renalStones === true) {
    facts.push({ field: "context.renalStones", label: "Renal stones", value: true });
  }

  if (context.fragilityFractureOrOsteoporosis === true) {
    facts.push({
      field: "context.fragilityFractureOrOsteoporosis",
      label: "Fragility fracture or osteoporosis",
      value: true,
    });
  }

  return facts;
}

function isAssessment(
  assessment: ValidatedAssessment,
  electrolyte: ValidatedAssessment["electrolyte"],
  condition: ValidatedAssessment["condition"],
): boolean {
  return assessment.electrolyte === electrolyte && assessment.condition === condition;
}

function electrolyteFact(assessment: ValidatedAssessment, label: string): RuleMatchFact {
  return {
    field: "measuredValue",
    label,
    value: `${assessment.measuredValue} ${assessment.unit}`,
  };
}

function symptomSummary(symptoms: readonly string[]): string {
  return symptoms.length === 0 ? "none reported" : symptoms.join(", ");
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
