import { describe, expect, it } from "vitest";

import {
  HYPONATRAEMIA_SOURCE_ID,
  evaluateHyponatraemiaEmergencyManagement,
  hyponatraemiaEmergencyPathwayDefinition,
  type CerebralOedemaSign,
  type HyponatraemiaEmergencyEvaluationInput,
} from "../../src/clinical/pathways/hyponatraemia/index.ts";

const severeEmergency = (overrides: Partial<HyponatraemiaEmergencyEvaluationInput> = {}) =>
  evaluateHyponatraemiaEmergencyManagement({
    cerebralOedemaSigns: ["confusion"],
    fluidStatus: "euvolaemic",
    sodium: 124,
    ...overrides,
  });

describe("hyponatraemia emergency management", () => {
  it("loads the cumulative source-traceable emergency definition", () => {
    expect(hyponatraemiaEmergencyPathwayDefinition).toMatchObject({
      pathwayId: "hyponatraemia-emergency-management",
      sourceIds: [HYPONATRAEMIA_SOURCE_ID],
      status: "awaiting-clinical-review",
      version: "0.3.0",
    });
  });

  it("emits the exact initial emergency actions, target and correction warning", () => {
    const snapshot = severeEmergency();

    expect(snapshot).toMatchObject({
      currentNode: { id: "ods-risk-question" },
      status: "awaiting-input",
    });
    expect(snapshot.immediateActions.map((action) => action.actionId)).toEqual([
      "obtain-pre-treatment-investigations",
      "administer-initial-hypertonic-saline",
    ]);
    expect(snapshot.information).toContainEqual(
      expect.objectContaining({
        body: "Goal: increase sodium by 4-6 mmol/L in the first 2-4 hours.",
      }),
    );
    expect(snapshot.warnings).toContainEqual(
      expect.objectContaining({
        message: "Avoid correction of more than 10 mmol/L in 24 hours.",
        severity: "critical",
      }),
    );
  });

  it("applies high-risk ODS monitoring only to severe confirmed-risk cases", () => {
    const highRisk = severeEmergency({ odsRiskStatus: "high-risk-confirmed" });
    const notConfirmed = severeEmergency({ odsRiskStatus: "high-risk-not-confirmed" });
    const moderateWithStaleRisk = severeEmergency({
      odsRiskStatus: "high-risk-confirmed",
      sodium: 129,
    });

    expect(highRisk.monitoring).toContainEqual(
      expect.objectContaining({ monitoringId: "high-risk-ods-hourly-monitoring" }),
    );
    expect(highRisk.monitoring).toHaveLength(2);
    expect(highRisk.currentNode?.id).toBe("symptom-response-question");
    expect(notConfirmed.monitoring).toEqual([]);
    expect(moderateWithStaleRisk.monitoring).toEqual([]);
    expect(moderateWithStaleRisk.confirmedInputs).not.toHaveProperty("odsRiskStatus");
    expect(moderateWithStaleRisk.currentNode?.id).toBe("symptom-response-question");
  });

  it("routes symptomatic improvement directly to cause management", () => {
    const snapshot = severeEmergency({
      fourHourSodiumChange: 1,
      odsRiskStatus: "high-risk-confirmed",
      symptomResponse: "improved",
    });

    expect(snapshot).toMatchObject({
      currentNode: { id: "emergency-management-review-stop" },
      status: "requires-clinical-review",
    });
    expect(snapshot.nextActions).toContainEqual(
      expect.objectContaining({ actionId: "diagnose-manage-cause-consultant-review" }),
    );
    expect(snapshot.confirmedInputs).not.toHaveProperty("fourHourSodiumChange");
  });

  it.each([0, 3.9])(
    "repeats hypertonic saline when the four-hour increase is %s mmol/L",
    (fourHourSodiumChange) => {
      const snapshot = severeEmergency({
        fourHourSodiumChange,
        odsRiskStatus: "high-risk-not-confirmed",
        symptomResponse: "not-improved",
      });

      expect(snapshot).toMatchObject({
        currentNode: { id: "emergency-management-review-stop" },
        status: "requires-clinical-review",
      });
      expect(snapshot.immediateActions).toContainEqual(
        expect.objectContaining({ actionId: "repeat-hypertonic-saline-dose" }),
      );
    },
  );

  it.each([5.1, 10.1])(
    "routes an increase of %s mmol/L to cause management without a repeat dose",
    (fourHourSodiumChange) => {
      const snapshot = severeEmergency({
        fourHourSodiumChange,
        odsRiskStatus: "unable-to-assess",
        symptomResponse: "unable-to-assess",
      });

      expect(snapshot.nextActions).toContainEqual(
        expect.objectContaining({ actionId: "diagnose-manage-cause-consultant-review" }),
      );
      expect(snapshot.immediateActions).not.toContainEqual(
        expect.objectContaining({ actionId: "repeat-hypertonic-saline-dose" }),
      );
      expect(snapshot.warnings[0]?.warningId).toBe("avoid-excessive-correction");
    },
  );

  it.each([-0.1, 4, 4.1, 5])(
    "fails closed for the unstated four-hour response value %s",
    (fourHourSodiumChange) => {
      const snapshot = severeEmergency({
        fourHourSodiumChange,
        odsRiskStatus: "high-risk-not-confirmed",
        symptomResponse: "not-improved",
      });

      expect(snapshot).toMatchObject({
        currentNode: { id: "four-hour-response-review-required" },
        status: "requires-clinical-review",
      });
      expect(snapshot.immediateActions).not.toContainEqual(
        expect.objectContaining({ actionId: "repeat-hypertonic-saline-dose" }),
      );
      expect(snapshot.nextActions).toEqual([]);
    },
  );

  it("blocks invalid emergency inputs and excess follow-up precision", () => {
    expect(
      severeEmergency({ odsRiskStatus: "not-a-status" as "high-risk-confirmed" }),
    ).toMatchObject({ blockReason: "invalid-input", status: "blocked" });
    expect(
      severeEmergency({
        odsRiskStatus: "high-risk-confirmed",
        symptomResponse: "not-improved",
        fourHourSodiumChange: 3.99,
      }),
    ).toMatchObject({ blockReason: "invalid-input", status: "blocked" });
    expect(
      severeEmergency({
        odsRiskStatus: "high-risk-confirmed",
        symptomResponse: "not-improved",
        fourHourSodiumChange: 3,
        fourHourSodiumChangeUnit: "mEq/L",
      }),
    ).toMatchObject({ blockReason: "invalid-input", status: "blocked" });
  });

  it("does not leak emergency output into non-emergency or contradictory branches", () => {
    const noSigns = evaluateHyponatraemiaEmergencyManagement({
      cerebralOedemaSigns: ["none-confirmed"],
      fluidStatus: "euvolaemic",
      fourHourSodiumChange: 3,
      odsRiskStatus: "high-risk-confirmed",
      sodium: 124,
      symptomResponse: "not-improved",
    });
    const contradictory = evaluateHyponatraemiaEmergencyManagement({
      cerebralOedemaSigns: ["nausea", "none-confirmed"] as CerebralOedemaSign[],
      fluidStatus: "hypovolaemic",
      sodium: 124,
    });

    expect(noSigns.immediateActions).toEqual([]);
    expect(noSigns.warnings).toEqual([]);
    expect(noSigns.confirmedInputs).not.toHaveProperty("odsRiskStatus");
    expect(contradictory).toMatchObject({ blockReason: "ambiguous-branch", status: "blocked" });
    expect(contradictory.immediateActions).toEqual([]);
  });

  it("returns immutable deterministic emergency snapshots", () => {
    const input = {
      fourHourSodiumChange: 3,
      odsRiskStatus: "high-risk-confirmed" as const,
      symptomResponse: "not-improved" as const,
    };
    const first = severeEmergency(input);
    const second = severeEmergency(input);

    expect(first).toEqual(second);
    expect(Object.isFrozen(first)).toBe(true);
  });
});
