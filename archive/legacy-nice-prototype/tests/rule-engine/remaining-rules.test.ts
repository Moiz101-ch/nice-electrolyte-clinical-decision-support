import { describe, expect, it } from "vitest";

import type { ClinicalContext, ValidatedAssessment } from "@/src/rule-engine/assessment";
import { createRuleEngine } from "@/src/rule-engine/engine";

const engine = createRuleEngine();

describe("remaining supported NICE rules", () => {
  it.each([
    {
      assessment: assessment("iv-fluid-related", "sodium", "hyponatraemia", 116.5, {
        alternativeCauseIdentified: false,
        baselineValue: 145,
        egfr: 94.1,
        fluidStatus: "hypervolaemic",
        ivFluidPrescriptionReviewed: true,
        ivFluidTemporalRelationship: true,
        onIvFluids: true,
      }),
      name: "validation example CASE-0030",
      ruleId: "NICE-NA-HYPO-IV-001",
      sourceId: "NICE-CG174",
    },
    {
      assessment: assessment("iv-fluid-related", "sodium", "hypernatraemia", 161.9, {
        alternativeCauseIdentified: false,
        baselineValue: 137.7,
        baselineValueStatus: "normal",
        egfr: 72.1,
        fluidStatus: "uncertain",
        ivFluidContainsSaline: true,
        ivFluidPrescriptionReviewed: true,
        ivFluidTemporalRelationship: true,
        onIvFluids: true,
      }),
      name: "validation example CASE-0182",
      ruleId: "NICE-NA-HYPER-IV-001",
      sourceId: "NICE-CG174",
    },
    {
      assessment: assessment("iv-fluid-related", "potassium", "hypokalaemia", 2.08, {
        adequatePotassiumProvision: false,
        alternativeCauseIdentified: false,
        baselineValue: 4.05,
        egfr: 31.3,
        ivFluidPrescriptionReviewed: true,
        ivFluidTemporalRelationship: true,
        medicinesReviewed: true,
        onIvFluids: true,
        otherPotassiumLossesIdentified: false,
      }),
      name: "validation example CASE-0290",
      ruleId: "NICE-K-HYPO-IV-001",
      sourceId: "NICE-CG174",
    },
    {
      assessment: assessment(
        "possible-primary-hyperparathyroidism",
        "calcium",
        "hypercalcaemia",
        2.78,
        {
          adjustedCalciumConfirmed: true,
          fragilityFractureOrOsteoporosis: false,
          primaryHyperparathyroidismSuspected: true,
          renalStones: false,
          symptoms: ["polyuria", "confusion", "constipation"],
        },
      ),
      name: "validation example CASE-0551",
      ruleId: "NICE-CA-PHPT-SCREEN-001",
      sourceId: "NICE-NG132",
    },
    {
      assessment: assessment(
        "confirmed-primary-hyperparathyroidism",
        "calcium",
        "hypercalcaemia",
        3.05,
        {
          adjustedCalciumConfirmed: true,
          confirmedPrimaryHyperparathyroidism: true,
          endOrganDisease: true,
          fragilityFractureOrOsteoporosis: false,
          hypercalcaemiaSymptomsPresent: true,
          renalStones: false,
          symptoms: ["confusion"],
        },
      ),
      name: "validation example CASE-0526",
      ruleId: "NICE-CA-PHPT-REFER-001",
      sourceId: "NICE-NG132",
    },
    {
      assessment: assessment("primary-adrenal-insufficiency", "sodium", "hyponatraemia", 134.7, {
        fludrocortisoneDoseStatus: "maximum",
        hyponatraemiaPersistent: true,
        primaryAdrenalInsufficiency: true,
        sodiumTrendReviewed: true,
        specialistEndocrinologyInvolved: true,
      }),
      name: "training example CASE-0072",
      ruleId: "NICE-NA-ADRENAL-001",
      sourceId: "NICE-NG243",
    },
  ])(
    "matches $name to $ruleId with a traceable NICE source",
    ({ assessment, ruleId, sourceId }) => {
      const outcome = engine.evaluate(assessment);

      expect(outcome).toMatchObject({
        ruleId,
        sources: [expect.objectContaining({ sourceId })],
        status: "matched",
      });

      if (outcome.status !== "blocked") {
        expect(outcome.explanation.summary).toContain(`Matched ${ruleId} because`);
        expect(outcome.trace.entries.at(-1)).toMatchObject({ decision: "match" });
      }
    },
  );

  it.each([
    {
      condition: "hyponatraemia" as const,
      context: validIvHyponatraemiaContext(),
      electrolyte: "sodium" as const,
      matchValue: 129.9999,
      nonMatchValue: 130,
      ruleId: "NICE-NA-HYPO-IV-001",
    },
    {
      condition: "hypernatraemia" as const,
      context: validIvHypernatraemiaContext(),
      electrolyte: "sodium" as const,
      matchValue: 155,
      nonMatchValue: 154.9999,
      ruleId: "NICE-NA-HYPER-IV-001",
    },
    {
      condition: "hypokalaemia" as const,
      context: validIvHypokalaemiaContext(),
      electrolyte: "potassium" as const,
      matchValue: 2.9999,
      nonMatchValue: 3,
      ruleId: "NICE-K-HYPO-IV-001",
    },
  ])(
    "applies the exact $ruleId threshold boundary",
    ({ condition, context, electrolyte, matchValue, nonMatchValue, ruleId }) => {
      expect(
        engine.evaluate(
          assessment("iv-fluid-related", electrolyte, condition, nonMatchValue, context),
        ),
      ).toMatchObject({ ruleId: "NICE-UNSUPPORTED-001", status: "unsupported" });
      expect(
        engine.evaluate(
          assessment("iv-fluid-related", electrolyte, condition, matchValue, context),
        ),
      ).toMatchObject({ ruleId, status: "matched" });
    },
  );

  it("applies the PHPT referral calcium boundary at exactly 2.85 mmol/L", () => {
    const context = phptReferralContext();

    expect(
      engine.evaluate(
        assessment(
          "confirmed-primary-hyperparathyroidism",
          "calcium",
          "hypercalcaemia",
          2.8499,
          context,
        ),
      ),
    ).toMatchObject({
      ruleId: "NICE-CA-PHPT-CONSIDER-REFER-001",
      status: "matched",
    });
    expect(
      engine.evaluate(
        assessment(
          "confirmed-primary-hyperparathyroidism",
          "calcium",
          "hypercalcaemia",
          2.85,
          context,
        ),
      ),
    ).toMatchObject({ ruleId: "NICE-CA-PHPT-REFER-001", status: "matched" });
  });

  it("starts the NICE PHPT diagnostic pathway at exactly 2.60 mmol/L", () => {
    const outcome = engine.evaluate(
      assessment("possible-primary-hyperparathyroidism", "calcium", "hypercalcaemia", 2.6, {
        adjustedCalciumConfirmed: true,
        fragilityFractureOrOsteoporosis: false,
        primaryHyperparathyroidismSuspected: true,
        renalStones: false,
        symptoms: [],
      }),
    );

    expect(outcome).toMatchObject({
      managementOutput: expect.stringMatching(/repeat albumin-adjusted serum calcium/i),
      ruleId: "NICE-CA-PHPT-SCREEN-001",
      status: "matched",
    });
  });

  it("considers surgical referral for confirmed PHPT without a mandatory referral criterion", () => {
    const outcome = engine.evaluate(
      assessment(
        "confirmed-primary-hyperparathyroidism",
        "calcium",
        "hypercalcaemia",
        2.7,
        phptReferralContext(),
      ),
    );

    expect(outcome).toMatchObject({
      managementOutput: expect.stringMatching(/consider referral/i),
      ruleId: "NICE-CA-PHPT-CONSIDER-REFER-001",
      sources: [expect.objectContaining({ recommendationSections: ["1.3.2"] })],
      status: "matched",
    });
  });

  it("requires IV timing and cause exclusion for hyponatraemia", () => {
    expect(
      engine.evaluate(
        assessment("iv-fluid-related", "sodium", "hyponatraemia", 129, {
          ...validIvHyponatraemiaContext(),
          alternativeCauseIdentified: true,
        }),
      ),
    ).toMatchObject({ ruleId: "NICE-UNSUPPORTED-001", status: "unsupported" });
    expect(
      engine.evaluate(
        assessment("iv-fluid-related", "sodium", "hyponatraemia", 129, {
          ...validIvHyponatraemiaContext(),
          ivFluidTemporalRelationship: false,
        }),
      ),
    ).toMatchObject({ ruleId: "NICE-UNSUPPORTED-001", status: "unsupported" });
  });

  it("blocks IV hyponatraemia when renal, fluid, or prescription review inputs are incomplete", () => {
    const outcome = engine.evaluate(
      assessment("iv-fluid-related", "sodium", "hyponatraemia", 129, {
        alternativeCauseIdentified: false,
        baselineValue: 138,
        ivFluidPrescriptionReviewed: false,
        ivFluidTemporalRelationship: true,
        onIvFluids: true,
      }),
    );

    expect(outcome).toMatchObject({
      issues: expect.arrayContaining([
        expect.objectContaining({ field: "context.egfr" }),
        expect.objectContaining({ field: "context.fluidStatus" }),
      ]),
      reason: "missing-required-inputs",
      status: "blocked",
    });
  });

  it("requires a normal or low baseline and 0.9% sodium chloride for IV hypernatraemia", () => {
    expect(
      engine.evaluate(
        assessment("iv-fluid-related", "sodium", "hypernatraemia", 155, {
          ...validIvHypernatraemiaContext(),
          baselineValueStatus: "high",
        }),
      ),
    ).toMatchObject({ ruleId: "NICE-UNSUPPORTED-001", status: "unsupported" });
    expect(
      engine.evaluate(
        assessment("iv-fluid-related", "sodium", "hypernatraemia", 155, {
          ...validIvHypernatraemiaContext(),
          ivFluidContainsSaline: false,
        }),
      ),
    ).toMatchObject({ ruleId: "NICE-UNSUPPORTED-001", status: "unsupported" });
    expect(
      engine.evaluate(
        assessment("iv-fluid-related", "sodium", "hypernatraemia", 155, {
          ...validIvHypernatraemiaContext(),
          baselineValueStatus: "unknown",
        }),
      ),
    ).toMatchObject({
      issues: [expect.objectContaining({ field: "context.baselineValueStatus" })],
      status: "blocked",
    });
  });

  it("does not attribute hypokalaemia to IV fluids when potassium was adequate or another loss exists", () => {
    expect(
      engine.evaluate(
        assessment("iv-fluid-related", "potassium", "hypokalaemia", 2.9, {
          ...validIvHypokalaemiaContext(),
          adequatePotassiumProvision: true,
        }),
      ),
    ).toMatchObject({ ruleId: "NICE-UNSUPPORTED-001", status: "unsupported" });
    expect(
      engine.evaluate(
        assessment("iv-fluid-related", "potassium", "hypokalaemia", 2.9, {
          ...validIvHypokalaemiaContext(),
          otherPotassiumLossesIdentified: true,
        }),
      ),
    ).toMatchObject({ ruleId: "NICE-UNSUPPORTED-001", status: "unsupported" });
  });

  it("blocks hypokalaemia guidance until IV prescription and medicines reviews are confirmed", () => {
    const outcome = engine.evaluate(
      assessment("iv-fluid-related", "potassium", "hypokalaemia", 2.9, {
        ...validIvHypokalaemiaContext(),
        ivFluidPrescriptionReviewed: false,
        medicinesReviewed: false,
      }),
    );

    expect(outcome).toMatchObject({
      issues: expect.arrayContaining([
        expect.objectContaining({ field: "context.ivFluidPrescriptionReviewed" }),
        expect.objectContaining({ field: "context.medicinesReviewed" }),
      ]),
      status: "blocked",
    });
  });

  it("requires confirmed adjusted calcium and suspected PHPT for the screening pathway", () => {
    const context: Partial<ValidatedAssessment["context"]> = {
      adjustedCalciumConfirmed: true,
      fragilityFractureOrOsteoporosis: false,
      primaryHyperparathyroidismSuspected: true,
      renalStones: false,
      symptoms: ["polyuria"],
    };

    expect(
      engine.evaluate(
        assessment(
          "possible-primary-hyperparathyroidism",
          "calcium",
          "hypercalcaemia",
          2.7,
          context,
        ),
      ),
    ).toMatchObject({ ruleId: "NICE-CA-PHPT-SCREEN-001", status: "matched" });
    expect(
      engine.evaluate(
        assessment("possible-primary-hyperparathyroidism", "calcium", "hypercalcaemia", 2.7, {
          ...context,
          adjustedCalciumConfirmed: false,
        }),
      ),
    ).toMatchObject({ ruleId: "NICE-UNSUPPORTED-001", status: "unsupported" });
    expect(
      engine.evaluate(
        assessment("possible-primary-hyperparathyroidism", "calcium", "hypercalcaemia", 2.7, {
          ...context,
          primaryHyperparathyroidismSuspected: false,
        }),
      ),
    ).toMatchObject({ ruleId: "NICE-UNSUPPORTED-001", status: "unsupported" });
  });

  it.each([
    { field: "hypercalcaemiaSymptomsPresent", value: true },
    { field: "endOrganDisease", value: true },
    { field: "renalStones", value: true },
    { field: "fragilityFractureOrOsteoporosis", value: true },
  ] as const)("accepts the PHPT referral criterion $field", ({ field, value }) => {
    const context = {
      ...phptReferralContext(),
      [field]: value,
      symptoms: field === "hypercalcaemiaSymptomsPresent" ? ["confusion"] : [],
    };
    const outcome = engine.evaluate(
      assessment(
        "confirmed-primary-hyperparathyroidism",
        "calcium",
        "hypercalcaemia",
        2.7,
        context,
      ),
    );

    expect(outcome).toMatchObject({ ruleId: "NICE-CA-PHPT-REFER-001", status: "matched" });
  });

  it("does not apply PHPT referral without confirmed PHPT and blocks undocumented symptoms", () => {
    expect(
      engine.evaluate(
        assessment("confirmed-primary-hyperparathyroidism", "calcium", "hypercalcaemia", 3, {
          ...phptReferralContext(),
          confirmedPrimaryHyperparathyroidism: false,
        }),
      ),
    ).toMatchObject({ ruleId: "NICE-UNSUPPORTED-001", status: "unsupported" });
    expect(
      engine.evaluate(
        assessment("confirmed-primary-hyperparathyroidism", "calcium", "hypercalcaemia", 2.7, {
          ...phptReferralContext(),
          hypercalcaemiaSymptomsPresent: true,
          symptoms: [],
        }),
      ),
    ).toMatchObject({
      issues: [expect.objectContaining({ field: "context.symptoms" })],
      status: "blocked",
    });
  });

  it("applies adrenal guidance only to persistent hyponatraemia at maximum fludrocortisone dose", () => {
    const context = validAdrenalContext();

    expect(
      engine.evaluate(
        assessment("primary-adrenal-insufficiency", "sodium", "hyponatraemia", 132, context),
      ),
    ).toMatchObject({ ruleId: "NICE-NA-ADRENAL-001", status: "matched" });
    expect(
      engine.evaluate(
        assessment("primary-adrenal-insufficiency", "sodium", "hyponatraemia", 132, {
          ...context,
          fludrocortisoneDoseStatus: "below-maximum",
        }),
      ),
    ).toMatchObject({ ruleId: "NICE-UNSUPPORTED-001", status: "unsupported" });
    expect(
      engine.evaluate(
        assessment("primary-adrenal-insufficiency", "sodium", "hyponatraemia", 132, {
          ...context,
          hyponatraemiaPersistent: false,
        }),
      ),
    ).toMatchObject({ ruleId: "NICE-UNSUPPORTED-001", status: "unsupported" });
  });

  it("blocks adrenal guidance when trend or specialist-involvement status is unconfirmed", () => {
    const missingSpecialist = engine.evaluate(
      assessment("primary-adrenal-insufficiency", "sodium", "hyponatraemia", 132, {
        fludrocortisoneDoseStatus: "maximum",
        hyponatraemiaPersistent: true,
        primaryAdrenalInsufficiency: true,
        sodiumTrendReviewed: true,
      }),
    );
    const trendNotReviewed = engine.evaluate(
      assessment("primary-adrenal-insufficiency", "sodium", "hyponatraemia", 132, {
        ...validAdrenalContext(),
        sodiumTrendReviewed: false,
      }),
    );

    expect(missingSpecialist).toMatchObject({
      issues: [expect.objectContaining({ field: "context.specialistEndocrinologyInvolved" })],
      status: "blocked",
    });
    expect(trendNotReviewed).toMatchObject({
      issues: [expect.objectContaining({ field: "context.sodiumTrendReviewed" })],
      status: "blocked",
    });
  });
});

function assessment(
  clinicalContext: ClinicalContext,
  electrolyte: ValidatedAssessment["electrolyte"],
  condition: ValidatedAssessment["condition"],
  measuredValue: number,
  context: Partial<ValidatedAssessment["context"]>,
): ValidatedAssessment {
  return {
    ageYears: 64,
    clinicalContext,
    condition,
    context,
    electrolyte,
    measuredValue,
    unit: "mmol/L",
  };
}

function validIvHyponatraemiaContext(): Partial<ValidatedAssessment["context"]> {
  return {
    alternativeCauseIdentified: false,
    baselineValue: 138,
    egfr: 68,
    fluidStatus: "euvolaemic",
    ivFluidPrescriptionReviewed: true,
    ivFluidTemporalRelationship: true,
    onIvFluids: true,
  };
}

function validIvHypernatraemiaContext(): Partial<ValidatedAssessment["context"]> {
  return {
    alternativeCauseIdentified: false,
    baselineValue: 138,
    baselineValueStatus: "normal",
    egfr: 68,
    fluidStatus: "euvolaemic",
    ivFluidContainsSaline: true,
    ivFluidPrescriptionReviewed: true,
    ivFluidTemporalRelationship: true,
    onIvFluids: true,
  };
}

function validIvHypokalaemiaContext(): Partial<ValidatedAssessment["context"]> {
  return {
    adequatePotassiumProvision: false,
    alternativeCauseIdentified: false,
    baselineValue: 4.2,
    egfr: 68,
    ivFluidPrescriptionReviewed: true,
    ivFluidTemporalRelationship: true,
    medicinesReviewed: true,
    onIvFluids: true,
    otherPotassiumLossesIdentified: false,
  };
}

function phptReferralContext(): Partial<ValidatedAssessment["context"]> {
  return {
    adjustedCalciumConfirmed: true,
    confirmedPrimaryHyperparathyroidism: true,
    endOrganDisease: false,
    fragilityFractureOrOsteoporosis: false,
    hypercalcaemiaSymptomsPresent: false,
    renalStones: false,
    symptoms: [],
  };
}

function validAdrenalContext(): Partial<ValidatedAssessment["context"]> {
  return {
    fludrocortisoneDoseStatus: "maximum",
    hyponatraemiaPersistent: true,
    primaryAdrenalInsufficiency: true,
    sodiumTrendReviewed: true,
    specialistEndocrinologyInvolved: true,
  };
}
