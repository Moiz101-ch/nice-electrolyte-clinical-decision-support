import { describe, expect, it } from "vitest";

import {
  buildValidatedAssessment,
  getClinicalContextOptions,
  getContextQuestions,
  initialAssessmentFormState,
  validateAssessmentStep,
  type AssessmentFormState,
} from "@/src/assessment/structured-assessment";
import { createRuleEngine } from "@/src/rule-engine/engine";

describe("structured assessment model", () => {
  it("offers only contexts relevant to the selected abnormality", () => {
    const potassiumContexts = getClinicalContextOptions("potassium", "hyperkalaemia").map(
      (context) => context.id,
    );
    const magnesiumContexts = getClinicalContextOptions("magnesium", "hypomagnesaemia").map(
      (context) => context.id,
    );

    expect(potassiumContexts).toEqual([
      "acute-life-threatening-hyperkalaemia",
      "iv-fluid-related",
      "ckd-raas-monitoring",
      "ckd-before-raas-antagonist",
      "ckd-on-raas-antagonist",
      "persistent-hyperkalaemia",
      "aki-not-responding-to-treatment",
      "general-adult-presentation",
    ]);
    expect(magnesiumContexts).toEqual(["general-adult-presentation"]);
  });

  it("reveals exact IV questions for the selected electrolyte condition", () => {
    const sodiumQuestions = getContextQuestions({
      ...initialAssessmentFormState,
      clinicalContext: "iv-fluid-related",
      condition: "hyponatraemia",
      electrolyte: "sodium",
    }).map((question) => question.id);
    const potassiumQuestions = getContextQuestions({
      ...initialAssessmentFormState,
      clinicalContext: "iv-fluid-related",
      condition: "hypokalaemia",
      electrolyte: "potassium",
    }).map((question) => question.id);

    expect(sodiumQuestions).toEqual([
      "baselineValue",
      "onIvFluids",
      "ivFluidTemporalRelationship",
      "ivFluidPrescriptionReviewed",
      "fluidStatus",
      "egfr",
      "alternativeCauseIdentified",
    ]);
    expect(potassiumQuestions).toContain("adequatePotassiumProvision");
    expect(potassiumQuestions).toContain("otherPotassiumLossesIdentified");
    expect(potassiumQuestions).not.toContain("fluidStatus");
  });

  it("returns inline-ready errors for invalid adult details", () => {
    const errors = validateAssessmentStep(
      {
        ...initialAssessmentFormState,
        ageYears: "15.5",
        measuredValue: "-1",
        pregnancyStatus: "",
      },
      1,
    );

    expect(errors).toMatchObject({
      ageYears: "Enter a whole number.",
      measuredValue: "The result cannot be negative.",
      pregnancyStatus: "Select pregnancy status.",
    });
  });

  it("rejects a sodium value that contradicts the selected abnormality", () => {
    const errors = validateAssessmentStep(
      {
        ...initialAssessmentFormState,
        ageYears: "80",
        condition: "hypernatraemia",
        electrolyte: "sodium",
        measuredValue: "102",
        pregnancyStatus: "not-pregnant",
      },
      1,
    );

    expect(errors.measuredValue).toBe(
      "A sodium result of 102 mmol/L does not match Hypernatraemia. The configured adult reference interval requires above 145 mmol/L. Verify the result or change the abnormality.",
    );
  });

  it.each([
    ["hyponatraemia", "sodium", "135", "134.9"],
    ["hypernatraemia", "sodium", "145", "145.1"],
    ["hypokalaemia", "potassium", "3.5", "3.49"],
    ["hyperkalaemia", "potassium", "5", "5.1"],
    ["hypocalcaemia", "calcium", "2.2", "2.19"],
    ["hypercalcaemia", "calcium", "2.5999", "2.6"],
    ["hypomagnesaemia", "magnesium", "0.7", "0.69"],
    ["hypermagnesaemia", "magnesium", "1", "1.01"],
  ] as const)(
    "enforces the configured adult reference boundary for %s",
    (condition, electrolyte, boundaryValue, consistentValue) => {
      const baseState: AssessmentFormState = {
        ...initialAssessmentFormState,
        ageYears: "60",
        condition,
        electrolyte,
        pregnancyStatus: "not-applicable",
      };

      expect(
        validateAssessmentStep({ ...baseState, measuredValue: boundaryValue }, 1),
      ).toHaveProperty("measuredValue");
      expect(
        validateAssessmentStep({ ...baseState, measuredValue: consistentValue }, 1),
      ).not.toHaveProperty("measuredValue");
    },
  );

  it("does not apply an abnormality-direction guard to a potassium monitoring result", () => {
    const errors = validateAssessmentStep(
      {
        ...initialAssessmentFormState,
        ageYears: "60",
        condition: "no-abnormality",
        electrolyte: "potassium",
        measuredValue: "4.3",
        pregnancyStatus: "not-applicable",
      },
      1,
    );

    expect(errors).not.toHaveProperty("measuredValue");
  });

  it("builds confirmed IV-fluid data and reaches the deterministic rule engine", () => {
    const built = buildValidatedAssessment(validIvHyponatraemiaState());

    expect(built).toMatchObject({ success: true });

    if (!built.success) {
      throw new Error("Expected a validated assessment.");
    }

    expect(built.data.context).toMatchObject({
      alternativeCauseIdentified: false,
      baselineValue: 138,
      egfr: 64,
      fluidStatus: "hypervolaemic",
      ivFluidPrescriptionReviewed: true,
      ivFluidTemporalRelationship: true,
      onIvFluids: true,
      pregnancyStatus: "not-applicable",
    });
    expect(createRuleEngine().evaluate(built.data)).toMatchObject({
      ruleId: "NICE-NA-HYPO-IV-001",
      status: "matched",
    });
  });

  it("preserves not-confirmed answers as missing evidence so the engine blocks safely", () => {
    const built = buildValidatedAssessment({
      ...validIvHyponatraemiaState(),
      contextAnswers: {
        ...validIvHyponatraemiaState().contextAnswers,
        alternativeCauseIdentified: "unknown",
      },
    });

    if (!built.success) {
      throw new Error("Expected a validated assessment draft.");
    }

    expect(built.data.context).not.toHaveProperty("alternativeCauseIdentified");
    expect(createRuleEngine().evaluate(built.data)).toMatchObject({
      issues: [expect.objectContaining({ field: "context.alternativeCauseIdentified" })],
      reason: "missing-required-inputs",
      status: "blocked",
    });
  });

  it("converts confirmed symptom details into a structured list", () => {
    const state: AssessmentFormState = {
      ageYears: "67",
      clinicalContext: "confirmed-primary-hyperparathyroidism",
      condition: "hypercalcaemia",
      contextAnswers: {
        adjustedCalciumConfirmed: "yes",
        confirmedPrimaryHyperparathyroidism: "yes",
        endOrganDisease: "no",
        fragilityFractureOrOsteoporosis: "no",
        hypercalcaemiaSymptomsPresent: "yes",
        renalStones: "no",
        symptoms: "confusion, constipation",
        symptomsStatus: "present",
      },
      electrolyte: "calcium",
      measuredValue: "2.7",
      pregnancyStatus: "not-applicable",
      reviewed: true,
    };
    const built = buildValidatedAssessment(state);

    if (!built.success) {
      throw new Error("Expected a validated PHPT assessment.");
    }

    expect(built.data.context.symptoms).toEqual(["confusion", "constipation"]);
    expect(createRuleEngine().evaluate(built.data)).toMatchObject({
      ruleId: "NICE-CA-PHPT-REFER-001",
      status: "matched",
    });
  });

  it("blocks confirmed pregnancy before any adult-general evaluator runs", () => {
    const built = buildValidatedAssessment({
      ...initialAssessmentFormState,
      ageYears: "31",
      clinicalContext: "general-adult-presentation",
      condition: "hyponatraemia",
      electrolyte: "sodium",
      measuredValue: "126",
      pregnancyStatus: "pregnant",
      reviewed: true,
    });

    if (!built.success) {
      throw new Error("Expected structurally valid input.");
    }

    expect(createRuleEngine().evaluate(built.data)).toMatchObject({
      issues: [expect.objectContaining({ field: "context.pregnancyStatus" })],
      reason: "out-of-scope",
      status: "blocked",
      trace: { entries: [] },
    });
  });
});

function validIvHyponatraemiaState(): AssessmentFormState {
  return {
    ageYears: "74",
    clinicalContext: "iv-fluid-related",
    condition: "hyponatraemia",
    contextAnswers: {
      alternativeCauseIdentified: "no",
      baselineValue: "138",
      egfr: "64",
      fluidStatus: "hypervolaemic",
      ivFluidPrescriptionReviewed: "yes",
      ivFluidTemporalRelationship: "yes",
      onIvFluids: "yes",
    },
    electrolyte: "sodium",
    measuredValue: "129.9",
    pregnancyStatus: "not-applicable",
    reviewed: true,
  };
}
