import { describe, expect, it } from "vitest";

import type { ClinicalContext, ValidatedAssessment } from "@/src/rule-engine/assessment";
import { createRuleEngine } from "@/src/rule-engine/engine";

const engine = createRuleEngine();

describe("hyperkalaemia NICE rules", () => {
  it.each([
    {
      assessment: hyperkalaemiaAssessment("iv-fluid-related", 6.1, {
        alternativeCauseIdentified: false,
        baselineValue: 6.88,
        egfr: 22.6,
        ivFluidPrescriptionReviewed: true,
        ivFluidTemporalRelationship: true,
        medicinesReviewed: true,
        onIvFluids: true,
      }),
      name: "validation example CASE-0396",
      ruleId: "NICE-K-HYPER-IV-001",
      sourceId: "NICE-CG174",
    },
    {
      assessment: potassiumAssessment("ckd-raas-monitoring", 4.33, {
        ckdStage: "3a",
        egfr: 25.7,
        raasAntagonistStatus: "starting",
        raasChangeDateKnown: true,
      }),
      name: "validation example CASE-0376",
      ruleId: "NICE-K-CKD-MONITOR-001",
      sourceId: "NICE-NG203",
    },
    {
      assessment: hyperkalaemiaAssessment("ckd-before-raas-antagonist", 5.01, {
        ckdStage: "3b",
        raasAntagonistStatus: "planned",
      }),
      name: "pretreatment rule",
      ruleId: "NICE-K-CKD-PRETREAT-001",
      sourceId: "NICE-NG203",
    },
    {
      assessment: hyperkalaemiaAssessment("ckd-on-raas-antagonist", 6.9, {
        ckdStage: "3a",
        otherHyperkalaemiaMedicinesStopped: true,
        raasAntagonistStatus: "taking",
      }),
      name: "validation example CASE-0367",
      ruleId: "NICE-K-CKD-STOP-001",
      sourceId: "NICE-NG203",
    },
    {
      assessment: hyperkalaemiaAssessment("persistent-hyperkalaemia", 6.63, {
        ckdStage: "4",
        dialysis: false,
        heartFailure: true,
        potassiumConfirmed: true,
        raasAntagonistStatus: "not-optimised-because-hyperkalaemia",
      }),
      name: "validation example CASE-0331",
      ruleId: "NICE-K-SZC-ELIG-001",
      sourceId: "NICE-TA1148",
    },
    {
      assessment: hyperkalaemiaAssessment("persistent-hyperkalaemia", 6.61, {
        ckdStage: "5",
        dialysis: false,
        heartFailure: false,
        potassiumConfirmed: true,
        raasAntagonistStatus: "not-taking-because-hyperkalaemia",
      }),
      name: "validation example CASE-0357",
      ruleId: "NICE-K-BINDER-OPTIONS-001",
      sourceId: "NICE-TA623",
    },
    {
      assessment: hyperkalaemiaAssessment("aki-not-responding-to-treatment", 6.9, {
        aki: true,
        clinicalConditionReviewed: true,
        ecgOrComplicationsReviewed: true,
        fluidStatus: "hypervolaemic",
        medicalManagementResponse: "not-responding",
        potassiumTrendReviewed: true,
        treatmentsReviewed: true,
      }),
      name: "validation example CASE-0377",
      ruleId: "NICE-K-AKI-RRT-001",
      sourceId: "NICE-NG148",
    },
  ])(
    "matches $name to $ruleId with a traceable NICE source",
    ({ assessment, ruleId, sourceId }) => {
      const outcome = engine.evaluate(assessment);

      expect(outcome).toMatchObject({
        ruleId,
        sources: expect.arrayContaining([expect.objectContaining({ sourceId })]),
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
      context: {
        alternativeCauseIdentified: false,
        baselineValue: 4.8,
        egfr: 65,
        ivFluidPrescriptionReviewed: true,
        ivFluidTemporalRelationship: true,
        medicinesReviewed: true,
        onIvFluids: true,
      },
      contextName: "iv-fluid-related" as const,
      matchValue: 5.5001,
      nonMatchValue: 5.5,
      ruleId: "NICE-K-HYPER-IV-001",
    },
    {
      context: { ckdStage: "3b" as const, raasAntagonistStatus: "planned" as const },
      contextName: "ckd-before-raas-antagonist" as const,
      matchValue: 5.0001,
      nonMatchValue: 5,
      ruleId: "NICE-K-CKD-PRETREAT-001",
    },
    {
      context: {
        ckdStage: "3b" as const,
        otherHyperkalaemiaMedicinesStopped: true,
        raasAntagonistStatus: "taking" as const,
      },
      contextName: "ckd-on-raas-antagonist" as const,
      matchValue: 6,
      nonMatchValue: 5.9999,
      ruleId: "NICE-K-CKD-STOP-001",
    },
    {
      context: {
        ckdStage: "3b" as const,
        dialysis: false,
        heartFailure: false,
        potassiumConfirmed: true,
        raasAntagonistStatus: "not-optimised-because-hyperkalaemia" as const,
      },
      contextName: "persistent-hyperkalaemia" as const,
      matchValue: 5.5,
      nonMatchValue: 5.4999,
      ruleId: "NICE-K-SZC-ELIG-001",
    },
    {
      context: {
        ckdStage: "3b" as const,
        dialysis: false,
        heartFailure: false,
        potassiumConfirmed: true,
        raasAntagonistStatus: "reduced-because-hyperkalaemia" as const,
      },
      contextName: "persistent-hyperkalaemia" as const,
      matchValue: 6,
      nonMatchValue: 5.9999,
      ruleId: "NICE-K-BINDER-OPTIONS-001",
    },
  ])(
    "applies the exact $ruleId threshold boundary",
    ({ context, contextName, matchValue, nonMatchValue, ruleId }) => {
      const nonMatchOutcome = engine.evaluate(
        hyperkalaemiaAssessment(contextName, nonMatchValue, context),
      );

      if (ruleId === "NICE-K-CKD-PRETREAT-001") {
        expect(nonMatchOutcome).toMatchObject({ reason: "invalid-input", status: "blocked" });
      } else if (ruleId === "NICE-K-BINDER-OPTIONS-001") {
        expect(nonMatchOutcome).toMatchObject({
          ruleId: "NICE-K-SZC-ELIG-001",
          status: "matched",
        });
      } else {
        expect(nonMatchOutcome).toMatchObject({
          ruleId: "NICE-UNSUPPORTED-001",
          status: "unsupported",
        });
      }
      expect(
        engine.evaluate(hyperkalaemiaAssessment(contextName, matchValue, context)),
      ).toMatchObject({
        ruleId,
        status: "matched",
      });
    },
  );

  it("returns both NICE potassium-binder options for confirmed acute life-threatening hyperkalaemia", () => {
    const outcome = engine.evaluate(
      hyperkalaemiaAssessment("acute-life-threatening-hyperkalaemia", 6.8, {
        acuteLifeThreateningHyperkalaemia: true,
        emergencyCare: true,
        standardEmergencyCare: true,
      }),
    );

    expect(outcome).toMatchObject({
      priority: "Emergency treatment",
      ruleId: "NICE-K-ACUTE-BINDER-OPTIONS-001",
      sources: [
        expect.objectContaining({ sourceId: "NICE-TA1148" }),
        expect.objectContaining({ sourceId: "NICE-TA623" }),
      ],
      status: "matched",
    });
  });

  it("does not return acute binder options unless standard emergency care is underway", () => {
    const outcome = engine.evaluate(
      hyperkalaemiaAssessment("acute-life-threatening-hyperkalaemia", 6.8, {
        acuteLifeThreateningHyperkalaemia: true,
        emergencyCare: true,
        standardEmergencyCare: false,
      }),
    );

    expect(outcome).toMatchObject({ ruleId: "NICE-UNSUPPORTED-001", status: "unsupported" });
  });

  it.each([
    "not-optimised-because-hyperkalaemia",
    "not-taking-because-hyperkalaemia",
    "reduced-because-hyperkalaemia",
  ] as const)("applies TA1148 when RAAS therapy is %s", (raasAntagonistStatus) => {
    const outcome = engine.evaluate(
      hyperkalaemiaAssessment("persistent-hyperkalaemia", 5.5, {
        ckdStage: "3b",
        dialysis: false,
        heartFailure: false,
        potassiumConfirmed: true,
        raasAntagonistStatus,
      }),
    );

    expect(outcome).toMatchObject({ ruleId: "NICE-K-SZC-ELIG-001", status: "matched" });
  });

  it("supports both starting and dose-increased CKD monitoring, but requires the change date", () => {
    const context = {
      ckdStage: "4" as const,
      egfr: 28,
      raasChangeDateKnown: true,
    };

    for (const status of ["starting", "dose-increased"] as const) {
      expect(
        engine.evaluate(
          potassiumAssessment("ckd-raas-monitoring", 4.9, {
            ...context,
            raasAntagonistStatus: status,
          }),
        ),
      ).toMatchObject({ ruleId: "NICE-K-CKD-MONITOR-001", status: "matched" });
    }

    expect(
      engine.evaluate(
        potassiumAssessment("ckd-raas-monitoring", 4.9, {
          ckdStage: "4",
          egfr: 28,
          raasAntagonistStatus: "starting",
        }),
      ),
    ).toMatchObject({
      issues: [expect.objectContaining({ field: "context.raasChangeDateKnown" })],
      reason: "missing-required-inputs",
      status: "blocked",
    });
  });

  it("does not apply IV-fluid guidance when an alternative cause or no temporal link is confirmed", () => {
    const context = {
      baselineValue: 4.9,
      egfr: 52,
      ivFluidPrescriptionReviewed: true,
      medicinesReviewed: true,
      onIvFluids: true,
    };

    expect(
      engine.evaluate(
        hyperkalaemiaAssessment("iv-fluid-related", 5.8, {
          ...context,
          alternativeCauseIdentified: true,
          ivFluidTemporalRelationship: true,
        }),
      ),
    ).toMatchObject({ ruleId: "NICE-UNSUPPORTED-001", status: "unsupported" });
    expect(
      engine.evaluate(
        hyperkalaemiaAssessment("iv-fluid-related", 5.8, {
          ...context,
          alternativeCauseIdentified: false,
          ivFluidTemporalRelationship: false,
        }),
      ),
    ).toMatchObject({ ruleId: "NICE-UNSUPPORTED-001", status: "unsupported" });
  });

  it("blocks IV-fluid guidance until prescription and medicines reviews are confirmed", () => {
    const outcome = engine.evaluate(
      hyperkalaemiaAssessment("iv-fluid-related", 5.8, {
        alternativeCauseIdentified: false,
        baselineValue: 4.9,
        egfr: 52,
        ivFluidPrescriptionReviewed: false,
        ivFluidTemporalRelationship: true,
        medicinesReviewed: false,
        onIvFluids: true,
      }),
    );

    expect(outcome).toMatchObject({
      issues: [
        expect.objectContaining({ field: "context.ivFluidPrescriptionReviewed" }),
        expect.objectContaining({ field: "context.medicinesReviewed" }),
      ],
      reason: "missing-required-inputs",
      status: "blocked",
    });
  });

  it("does not stop a RAAS antagonist before other contributing medicines are stopped", () => {
    const outcome = engine.evaluate(
      hyperkalaemiaAssessment("ckd-on-raas-antagonist", 6, {
        ckdStage: "4",
        otherHyperkalaemiaMedicinesStopped: false,
        raasAntagonistStatus: "taking",
      }),
    );

    expect(outcome).toMatchObject({ ruleId: "NICE-UNSUPPORTED-001", status: "unsupported" });
  });

  it("excludes dialysis and requires CKD stage 3b to 5 or heart failure for medicine eligibility", () => {
    const baseContext = {
      potassiumConfirmed: true,
      raasAntagonistStatus: "not-optimised-because-hyperkalaemia" as const,
    };

    expect(
      engine.evaluate(
        hyperkalaemiaAssessment("persistent-hyperkalaemia", 5.5, {
          ...baseContext,
          ckdStage: "4",
          dialysis: true,
          heartFailure: false,
        }),
      ),
    ).toMatchObject({ ruleId: "NICE-UNSUPPORTED-001", status: "unsupported" });
    expect(
      engine.evaluate(
        hyperkalaemiaAssessment("persistent-hyperkalaemia", 5.5, {
          ...baseContext,
          ckdStage: "3a",
          dialysis: false,
          heartFailure: false,
        }),
      ),
    ).toMatchObject({ ruleId: "NICE-UNSUPPORTED-001", status: "unsupported" });
    expect(
      engine.evaluate(
        hyperkalaemiaAssessment("persistent-hyperkalaemia", 5.5, {
          ...baseContext,
          ckdStage: "none",
          dialysis: false,
          heartFailure: true,
        }),
      ),
    ).toMatchObject({ ruleId: "NICE-K-SZC-ELIG-001", status: "matched" });
  });

  it("blocks medicine eligibility when confirmation or indication inputs are missing", () => {
    const missingConfirmation = engine.evaluate(
      hyperkalaemiaAssessment("persistent-hyperkalaemia", 5.7, {
        ckdStage: "4",
        dialysis: false,
        heartFailure: false,
        raasAntagonistStatus: "not-optimised-because-hyperkalaemia",
      }),
    );
    const missingIndication = engine.evaluate(
      hyperkalaemiaAssessment("persistent-hyperkalaemia", 5.7, {
        dialysis: false,
        potassiumConfirmed: true,
        raasAntagonistStatus: "not-optimised-because-hyperkalaemia",
      }),
    );

    expect(missingConfirmation).toMatchObject({
      issues: [expect.objectContaining({ field: "context.potassiumConfirmed" })],
      status: "blocked",
    });
    expect(missingIndication).toMatchObject({
      issues: expect.arrayContaining([
        expect.objectContaining({ field: "context.ckdStage" }),
        expect.objectContaining({ field: "context.heartFailure" }),
      ]),
      status: "blocked",
    });
  });

  it("selects AKI escalation from treatment failure and whole-condition review, not a cutoff", () => {
    const completeContext = {
      aki: true,
      clinicalConditionReviewed: true,
      ecgOrComplicationsReviewed: true,
      fluidStatus: "euvolaemic" as const,
      potassiumTrendReviewed: true,
      treatmentsReviewed: true,
    };

    expect(
      engine.evaluate(
        hyperkalaemiaAssessment("aki-not-responding-to-treatment", 5.1, {
          ...completeContext,
          medicalManagementResponse: "not-responding",
        }),
      ),
    ).toMatchObject({ ruleId: "NICE-K-AKI-RRT-001", status: "matched" });
    expect(
      engine.evaluate(
        hyperkalaemiaAssessment("aki-not-responding-to-treatment", 7.2, {
          ...completeContext,
          medicalManagementResponse: "responding",
        }),
      ),
    ).toMatchObject({ ruleId: "NICE-UNSUPPORTED-001", status: "unsupported" });
  });

  it("blocks AKI escalation when the whole-condition safety review is incomplete", () => {
    const outcome = engine.evaluate(
      hyperkalaemiaAssessment("aki-not-responding-to-treatment", 6.9, {
        aki: true,
        clinicalConditionReviewed: true,
        ecgOrComplicationsReviewed: false,
        fluidStatus: "hypervolaemic",
        medicalManagementResponse: "not-responding",
        potassiumTrendReviewed: true,
        treatmentsReviewed: true,
      }),
    );

    expect(outcome).toMatchObject({
      issues: [expect.objectContaining({ field: "context.ecgOrComplicationsReviewed" })],
      reason: "missing-required-inputs",
      status: "blocked",
    });
  });
});

function hyperkalaemiaAssessment(
  clinicalContext: ClinicalContext,
  measuredValue: number,
  context: Partial<ValidatedAssessment["context"]>,
): ValidatedAssessment {
  return {
    ageYears: 64,
    clinicalContext,
    condition: "hyperkalaemia",
    context,
    electrolyte: "potassium",
    measuredValue,
    unit: "mmol/L",
  };
}

function potassiumAssessment(
  clinicalContext: ClinicalContext,
  measuredValue: number,
  context: Partial<ValidatedAssessment["context"]>,
): ValidatedAssessment {
  return {
    ...hyperkalaemiaAssessment(clinicalContext, measuredValue, context),
    condition: "no-abnormality",
  };
}
