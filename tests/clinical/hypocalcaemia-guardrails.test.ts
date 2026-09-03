import { describe, expect, it } from "vitest";

import {
  evaluateHypocalcaemiaGuardrails,
  hypocalcaemiaGuardrailPathwayDefinition,
  isHypocalcaemiaGuardrailClear,
  type HypocalcaemiaAssessmentInputs,
  type HypocalcaemiaGuardrailInputs,
} from "@/src/clinical/pathways/hypocalcaemia";

function completedAssessment(
  overrides: Partial<HypocalcaemiaAssessmentInputs> = {},
): HypocalcaemiaAssessmentInputs {
  return {
    adjustedCalcium: 2,
    albuminAdjustment: "confirmed",
    alkalinePhosphatase: "not-high",
    ecgAssessment: "no-changes",
    magnesium: "not-below-range",
    phosphate: "within-range",
    pth: "not-low",
    rateOfFall: "not-rapid",
    renalFunction: "no-renal-failure",
    surgery: "no-recent-surgery",
    symptoms: ["none"],
    vitaminD: "not-deficient",
    ...overrides,
  };
}

function safeGuardrails(
  overrides: Partial<HypocalcaemiaGuardrailInputs> = {},
): HypocalcaemiaGuardrailInputs {
  return {
    acutePancreatitis: "not-confirmed",
    cardiacMonitoringContext: "neither",
    hypoparathyroidismCause: "not-confirmed",
    medicineContexts: ["none"],
    recentBloodTransfusion: "not-confirmed",
    rhabdomyolysis: "not-confirmed",
    ...overrides,
  };
}

describe("Hypocalcaemia causes and guardrails", () => {
  it("registers a review-gated declarative guardrail pathway", () => {
    expect(hypocalcaemiaGuardrailPathwayDefinition).toMatchObject({
      pathwayId: "hypocalcaemia-causes-guardrails",
      sourceIds: ["YSTHFT-HYPOCALCAEMIA-V4"],
      status: "awaiting-clinical-review",
      version: "0.3.0",
    });
  });

  it("clears a fully answered mild branch and derives known negative assessment context", () => {
    const snapshot = evaluateHypocalcaemiaGuardrails(completedAssessment(), safeGuardrails());

    expect(isHypocalcaemiaGuardrailClear(snapshot)).toBe(true);
    expect(snapshot.currentNode?.id).toBe("guardrails-cleared-stop");
    expect(snapshot.confirmedInputs.renalContext).toMatchObject({
      kind: "single-choice",
      value: "no-renal-failure",
    });
    expect(snapshot.confirmedInputs.surgeryContext).toMatchObject({
      kind: "single-choice",
      value: "no-recent-surgery",
    });
  });

  it("accepts explicit cause review when recent surgery omits the extended laboratory panel", () => {
    const snapshot = evaluateHypocalcaemiaGuardrails(
      completedAssessment({
        alkalinePhosphatase: undefined,
        phosphate: undefined,
        pth: undefined,
        surgery: "recent-surgery",
        vitaminD: undefined,
      }),
      safeGuardrails({
        surgeryContext: "thyroidectomy",
        vitaminDDeficiencyCause: "not-confirmed",
      }),
    );

    expect(isHypocalcaemiaGuardrailClear(snapshot)).toBe(true);
    expect(snapshot.confirmedInputs.vitaminDDeficiencyCause).toMatchObject({
      kind: "single-choice",
      value: "not-confirmed",
    });
  });

  it("requires a cardiac monitoring context before clearing a severe branch", () => {
    const assessment = completedAssessment({ adjustedCalcium: 1.85, symptoms: ["seizures"] });
    const awaiting = evaluateHypocalcaemiaGuardrails(assessment, {
      ...safeGuardrails(),
      cardiacMonitoringContext: undefined,
    });
    const digoxin = evaluateHypocalcaemiaGuardrails(
      assessment,
      safeGuardrails({ cardiacMonitoringContext: "digoxin" }),
    );

    expect(awaiting.currentNode?.id).toBe("cardiac-monitoring-question");
    expect(isHypocalcaemiaGuardrailClear(awaiting)).toBe(false);
    expect(isHypocalcaemiaGuardrailClear(digoxin)).toBe(true);
    expect(digoxin.monitoring).toEqual([
      expect.objectContaining({ monitoringId: "continuous-ecg-for-dysrhythmia-digoxin" }),
    ]);
  });

  it("hands transfusion-related hypocalcaemia to the separate unavailable pathway", () => {
    const snapshot = evaluateHypocalcaemiaGuardrails(completedAssessment(), {
      recentBloodTransfusion: "confirmed",
    });

    expect(isHypocalcaemiaGuardrailClear(snapshot)).toBe(false);
    expect(snapshot.warnings).toEqual([
      expect.objectContaining({ warningId: "blood-transfusion-external-pathway" }),
    ]);
    expect(snapshot.stopReason).toMatch(/massive-blood-loss pathway/i);
  });

  it("blocks calcium correction for rhabdomyolysis until expert advice is confirmed", () => {
    const blocked = evaluateHypocalcaemiaGuardrails(completedAssessment(), {
      recentBloodTransfusion: "not-confirmed",
      rhabdomyolysis: "confirmed",
      rhabdomyolysisExpertAdvice: "not-obtained",
    });
    const allowedToContinue = evaluateHypocalcaemiaGuardrails(
      completedAssessment(),
      safeGuardrails({
        rhabdomyolysis: "confirmed",
        rhabdomyolysisExpertAdvice: "obtained",
      }),
    );

    expect(blocked.warnings).toEqual([
      expect.objectContaining({ warningId: "rhabdomyolysis-expert-advice-required" }),
    ]);
    expect(blocked.nextActions).toEqual([]);
    expect(isHypocalcaemiaGuardrailClear(allowedToContinue)).toBe(true);
  });

  it("requires Duty Renal Physician discussion after parathyroidectomy with renal failure", () => {
    const assessment = completedAssessment({
      adjustedCalcium: 1.85,
      alkalinePhosphatase: undefined,
      phosphate: undefined,
      pth: undefined,
      renalFunction: "renal-failure",
      surgery: "recent-surgery",
      symptoms: ["confusion"],
      vitaminD: undefined,
    });
    const base = safeGuardrails({
      renalContext: "ckd-or-other-renal-failure",
      surgeryContext: "parathyroidectomy",
    });
    const awaiting = evaluateHypocalcaemiaGuardrails(assessment, base);
    const blocked = evaluateHypocalcaemiaGuardrails(assessment, {
      ...base,
      renalPhysicianDiscussion: "not-obtained",
    });

    expect(awaiting.currentNode?.id).toBe("renal-physician-discussion-question");
    expect(blocked.warnings).toEqual([
      expect.objectContaining({ warningId: "renal-physician-discussion-required" }),
    ]);
    expect(isHypocalcaemiaGuardrailClear(blocked)).toBe(false);
  });

  it("generates 1-alfacalcidol only from a confirmed hypoparathyroidism cause and route", () => {
    const snapshot = evaluateHypocalcaemiaGuardrails(
      completedAssessment(),
      safeGuardrails({
        alfacalcidolAdministration: "oral-suitable",
        hypoparathyroidismCause: "other-confirmed",
      }),
    );

    expect(snapshot.nextActions).toEqual([
      expect.objectContaining({
        actionId: "oral-alfacalcidol-cause-treatment",
        instruction: expect.stringMatching(/0.25-0.5 microgram per day/i),
      }),
    ]);
    expect(snapshot.monitoring).toEqual([
      expect.objectContaining({ monitoringId: "alfacalcidol-calcium-follow-up" }),
    ]);
    expect(isHypocalcaemiaGuardrailClear(snapshot)).toBe(true);
  });

  it("requires renal discussion before 1-alfacalcidol in a renal patient", () => {
    const assessment = completedAssessment({
      adjustedCalcium: 1.85,
      renalFunction: "renal-failure",
      symptoms: ["confusion"],
    });
    const snapshot = evaluateHypocalcaemiaGuardrails(
      assessment,
      safeGuardrails({
        alfacalcidolAdministration: "oral-suitable",
        hypoparathyroidismCause: "other-confirmed",
        renalContext: "ckd-or-other-renal-failure",
        renalPhysicianDiscussion: "not-obtained",
      }),
    );

    expect(snapshot.warnings).toEqual([
      expect.objectContaining({ warningId: "alfacalcidol-renal-review-required" }),
    ]);
    expect(snapshot.nextActions).toEqual([]);
  });

  it("requires explicit cause confirmation before vitamin D or magnesium actions", () => {
    const assessment = completedAssessment({
      magnesium: "below-range",
      vitaminD: "deficient",
    });
    const withoutCauseConfirmation = evaluateHypocalcaemiaGuardrails(
      assessment,
      safeGuardrails({
        hypomagnesaemiaCause: "not-confirmed",
        vitaminDDeficiencyCause: "not-confirmed",
      }),
    );
    const confirmed = evaluateHypocalcaemiaGuardrails(
      assessment,
      safeGuardrails({
        hypomagnesaemiaCause: "confirmed",
        vitaminDDeficiencyCause: "confirmed",
      }),
    );

    expect(withoutCauseConfirmation.nextActions).toEqual([]);
    expect(confirmed.nextActions.map((action) => action.actionId)).toEqual([
      "oral-vitamin-d-cause-treatment",
      "hypomagnesaemia-cause-treatment",
    ]);
    expect(confirmed.nextActions[1]?.instruction).toMatch(/no magnesium dose/i);
  });

  it("records pancreatitis and medicine exposures as associations rather than diagnoses", () => {
    const snapshot = evaluateHypocalcaemiaGuardrails(
      completedAssessment(),
      safeGuardrails({
        acutePancreatitis: "confirmed",
        medicineContexts: ["bisphosphonate", "denosumab"],
      }),
    );

    expect(snapshot.information.map((item) => item.nodeId)).toEqual([
      "acute-pancreatitis-information",
      "medicine-context-information",
    ]);
    expect(
      snapshot.information.every((item) => /not.*diagnos|does not infer/i.test(item.body)),
    ).toBe(true);
  });

  it("blocks contradictory assessment detail and mutually exclusive medicine states", () => {
    const renalContradiction = evaluateHypocalcaemiaGuardrails(
      completedAssessment(),
      safeGuardrails({ renalContext: "dialysis" }),
    );
    const medicineContradiction = evaluateHypocalcaemiaGuardrails(
      completedAssessment(),
      safeGuardrails({ medicineContexts: ["denosumab", "none"] }),
    );

    expect(renalContradiction.status).toBe("blocked");
    expect(renalContradiction.blockReason).toBe("invalid-input");
    expect(medicineContradiction.status).toBe("blocked");
    expect(medicineContradiction.blockReason).toBe("ambiguous-branch");
  });
});
