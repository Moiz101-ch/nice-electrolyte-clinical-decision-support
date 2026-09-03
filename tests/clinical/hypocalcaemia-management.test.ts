import { describe, expect, it } from "vitest";

import {
  determineHypocalcaemiaManagementBranch,
  evaluateHypocalcaemiaManagement,
  hypocalcaemiaManagementPathwayDefinition,
  type HypocalcaemiaAssessmentInputs,
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

describe("Hypocalcaemia management branches", () => {
  it("registers a review-gated source-derived management pathway", () => {
    expect(hypocalcaemiaManagementPathwayDefinition).toMatchObject({
      pathwayId: "hypocalcaemia-management-branches",
      status: "awaiting-clinical-review",
      version: "0.3.0",
    });
  });

  it("selects the mild branch only for an asymptomatic result above 1.9 with renal failure excluded", () => {
    expect(determineHypocalcaemiaManagementBranch(completedAssessment())).toMatchObject({
      branch: "mild-asymptomatic",
    });
    expect(
      determineHypocalcaemiaManagementBranch(completedAssessment({ adjustedCalcium: 1.9 })),
    ).toMatchObject({ branch: "unsupported", reason: expect.stringMatching(/exact boundary/i) });
    expect(
      determineHypocalcaemiaManagementBranch(
        completedAssessment({ renalFunction: "renal-failure" }),
      ),
    ).toMatchObject({ branch: "unsupported", reason: expect.stringMatching(/renal failure/i) });
    expect(
      determineHypocalcaemiaManagementBranch(completedAssessment({ symptoms: ["weakness"] })),
    ).toMatchObject({ branch: "unsupported", reason: expect.stringMatching(/asymptomatic/i) });
  });

  it("selects the emergency branch only for severe symptomatic hypocalcaemia", () => {
    expect(
      determineHypocalcaemiaManagementBranch(
        completedAssessment({ adjustedCalcium: 1.85, symptoms: ["seizures"] }),
      ),
    ).toMatchObject({ branch: "severe-symptomatic" });
    expect(
      determineHypocalcaemiaManagementBranch(
        completedAssessment({ adjustedCalcium: 1.85, symptoms: ["none"] }),
      ),
    ).toMatchObject({ branch: "unsupported", reason: expect.stringMatching(/symptomatic/i) });
  });

  it("does not select management from an incomplete or uncertain assessment", () => {
    expect(
      determineHypocalcaemiaManagementBranch({
        adjustedCalcium: 2,
        albuminAdjustment: "confirmed",
        symptoms: ["none"],
      }),
    ).toMatchObject({ branch: "unsupported", reason: expect.stringMatching(/complete every/i) });
    expect(
      determineHypocalcaemiaManagementBranch(completedAssessment({ symptoms: ["unable"] })),
    ).toMatchObject({ branch: "unsupported", reason: expect.stringMatching(/definite symptom/i) });
  });

  it("generates the exact first-line mild action and waits for a follow-up result", () => {
    const snapshot = evaluateHypocalcaemiaManagement(
      completedAssessment(),
      { oralCalciumSelection: "calcichew" },
      true,
    );

    expect(snapshot.status).toBe("awaiting-input");
    expect(snapshot.currentNode?.id).toBe("follow-up-calcium-input");
    expect(snapshot.immediateActions).toEqual([
      expect.objectContaining({
        actionId: "commence-calcichew-forte",
        instruction: expect.stringMatching(/2 tablets twice daily.*2500 mg/i),
      }),
    ]);
  });

  it("keeps post-thyroidectomy monitoring explicit instead of inferring it from combined surgery history", () => {
    const assessment = completedAssessment({
      alkalinePhosphatase: undefined,
      phosphate: undefined,
      pth: undefined,
      surgery: "recent-surgery",
      vitaminD: undefined,
    });
    const awaitingConfirmation = evaluateHypocalcaemiaManagement(
      assessment,
      { oralCalciumSelection: "calcichew" },
      true,
    );
    const confirmed = evaluateHypocalcaemiaManagement(
      assessment,
      {
        oralCalciumSelection: "calcichew",
        postThyroidectomy: "confirmed",
      },
      true,
    );

    expect(awaitingConfirmation.currentNode?.id).toBe("post-thyroidectomy-question");
    expect(awaitingConfirmation.monitoring).toEqual([]);
    expect(confirmed.currentNode?.id).toBe("follow-up-calcium-input");
    expect(confirmed.monitoring).toEqual([
      expect.objectContaining({ monitoringId: "repeat-calcium-24-hours" }),
    ]);
  });

  it("branches follow-up calcium without rounding across exact boundaries", () => {
    const mild = completedAssessment();
    const below = evaluateHypocalcaemiaManagement(
      mild,
      { followUpAdjustedCalcium: 1.899, oralCalciumSelection: "calcichew" },
      true,
    );
    const remainsMild = evaluateHypocalcaemiaManagement(
      mild,
      { followUpAdjustedCalcium: 2.1, oralCalciumSelection: "calcichew" },
      true,
    );
    const above = evaluateHypocalcaemiaManagement(
      mild,
      { followUpAdjustedCalcium: 2.101, oralCalciumSelection: "calcichew" },
      true,
    );

    expect(below.warnings).toEqual([
      expect.objectContaining({ warningId: "follow-up-below-mild-range" }),
    ]);
    expect(remainsMild.nextActions).toEqual([
      expect.objectContaining({ actionId: "increase-calcichew-forte" }),
    ]);
    expect(above.nextActions).toEqual([
      expect.objectContaining({ actionId: "discharge-from-mild-pathway" }),
    ]);
    expect(above.monitoring).toEqual([
      expect.objectContaining({ monitoringId: "recheck-calcium-within-one-week" }),
    ]);
  });

  it("adds the 72-hour post-operative treatment only after explicit persistence confirmation", () => {
    const assessment = completedAssessment({
      alkalinePhosphatase: undefined,
      phosphate: undefined,
      pth: undefined,
      surgery: "recent-surgery",
      vitaminD: undefined,
    });
    const snapshot = evaluateHypocalcaemiaManagement(
      assessment,
      {
        followUpAdjustedCalcium: 2,
        oralCalciumSelection: "calcichew",
        persistentMildBeyond72Hours: "confirmed",
        postThyroidectomy: "not-confirmed",
      },
      true,
    );

    expect(snapshot.nextActions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ actionId: "increase-calcichew-forte" }),
        expect.objectContaining({ actionId: "start-postoperative-alfacalcidol" }),
      ]),
    );
    expect(snapshot.monitoring).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ monitoringId: "close-calcium-monitoring" }),
      ]),
    );
  });

  it("generates initial emergency treatment and reveals repeat treatment only when symptoms persist", () => {
    const assessment = completedAssessment({ adjustedCalcium: 1.85, symptoms: ["seizures"] });
    const initial = evaluateHypocalcaemiaManagement(assessment, {}, true);
    const resolved = evaluateHypocalcaemiaManagement(
      assessment,
      { symptomResponse: "resolved" },
      true,
    );
    const unresolved = evaluateHypocalcaemiaManagement(
      assessment,
      { symptomResponse: "not-resolved" },
      true,
    );

    expect(initial.currentNode?.id).toBe("symptom-response-question");
    expect(initial.immediateActions).toEqual([
      expect.objectContaining({
        actionId: "initial-intravenous-calcium-gluconate",
        instruction: expect.stringMatching(/10 mL of 10% calcium gluconate.*50 mL.*10 minutes/i),
      }),
    ]);
    expect(initial.monitoring.map((item) => item.monitoringId)).toEqual([
      "calcium-after-each-dose",
      "ecg-during-initial-dose",
    ]);
    expect(resolved.immediateActions).toHaveLength(1);
    expect(resolved.status).toBe("requires-clinical-review");
    expect(unresolved.immediateActions.map((action) => action.actionId)).toEqual([
      "initial-intravenous-calcium-gluconate",
      "repeat-intravenous-calcium-gluconate",
    ]);
    expect(unresolved.currentNode?.id).toBe("continuous-infusion-need-question");
  });

  it("stops repeat dosing when symptom response is uncertain", () => {
    const snapshot = evaluateHypocalcaemiaManagement(
      completedAssessment({ adjustedCalcium: 1.85, symptoms: ["confusion"] }),
      { symptomResponse: "unable" },
      true,
    );

    expect(snapshot.status).toBe("requires-clinical-review");
    expect(snapshot.immediateActions.map((action) => action.actionId)).toEqual([
      "initial-intravenous-calcium-gluconate",
    ]);
    expect(snapshot.stopReason).toMatch(/no repeat-dose instruction/i);
  });

  it("does not release treatment before guardrail clearance", () => {
    const snapshot = evaluateHypocalcaemiaManagement(completedAssessment(), {
      oralCalciumSelection: "calcichew",
    });

    expect(snapshot.immediateActions).toEqual([]);
    expect(snapshot.currentNode?.id).toBe("guardrails-incomplete-stop");
  });

  it("generates continuous infusion only when required and renal safeguards permit it", () => {
    const assessment = completedAssessment({ adjustedCalcium: 1.85, symptoms: ["seizures"] });
    const permitted = evaluateHypocalcaemiaManagement(
      assessment,
      {
        continuousInfusionNeed: "required",
        infusionRenalContext: "no-renal-failure",
        symptomResponse: "not-resolved",
      },
      true,
    );
    const dialysis = evaluateHypocalcaemiaManagement(
      assessment,
      {
        continuousInfusionNeed: "required",
        infusionRenalContext: "dialysis",
        symptomResponse: "not-resolved",
      },
      true,
    );

    expect(permitted.immediateActions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          actionId: "continuous-calcium-infusion",
          instruction: expect.stringMatching(/100 mL.*1 L.*50-100 mL per hour/i),
        }),
      ]),
    );
    expect(permitted.monitoring).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ monitoringId: "continuous-infusion-calcium-titration" }),
      ]),
    );
    expect(dialysis.immediateActions.map((action) => action.actionId)).not.toContain(
      "continuous-calcium-infusion",
    );
    expect(dialysis.warnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ warningId: "large-volume-infusion-prohibited" }),
      ]),
    );
  });
});
