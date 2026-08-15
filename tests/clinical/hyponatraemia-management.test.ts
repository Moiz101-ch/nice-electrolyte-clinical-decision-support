import { describe, expect, it } from "vitest";

import {
  HYPONATRAEMIA_SOURCE_ID,
  evaluateHyponatraemiaManagement,
  hyponatraemiaManagementPathwayDefinition,
  type HyponatraemiaManagementEvaluationInput,
} from "@/src/clinical/pathways/hyponatraemia";

function evaluate(overrides: Partial<HyponatraemiaManagementEvaluationInput> = {}) {
  return evaluateHyponatraemiaManagement({
    cerebralOedemaSigns: ["none-confirmed"],
    fluidStatus: "hypovolaemic",
    sodium: 129,
    ...overrides,
  });
}

describe("Hyponatraemia source-supported management", () => {
  it("is versioned, source-traceable and held below the clinical approval gate", () => {
    expect(hyponatraemiaManagementPathwayDefinition).toMatchObject({
      pathwayId: "hyponatraemia-source-supported-management",
      sourceIds: [HYPONATRAEMIA_SOURCE_ID],
      status: "awaiting-clinical-review",
      version: "0.7.0",
    });
  });

  it("selects source-defined cause review and isotonic saline for non-emergency hypovolaemia", () => {
    const snapshot = evaluate();

    expect(snapshot).toMatchObject({
      currentNode: { id: "hypovolaemic-management-review-stop" },
      status: "requires-clinical-review",
    });
    expect(snapshot.nextActions.map((action) => action.actionId)).toEqual([
      "review-hypovolaemic-causes",
      "use-hypovolaemic-isotonic-saline",
    ]);
    expect(snapshot.nextActions[1]?.instruction).toBe(
      "Use 1000 mL of 0.9% sodium chloride over 6 to 8 hours.",
    );
  });

  it("selects the source-defined senior-review endpoint for hypervolaemia", () => {
    const snapshot = evaluate({
      cerebralOedemaSigns: ["confusion"],
      fluidStatus: "hypervolaemic",
    });

    expect(snapshot.currentNode?.id).toBe("hypervolaemic-management-review-stop");
    expect(snapshot.nextActions).toContainEqual(
      expect.objectContaining({ actionId: "refer-senior-hypervolaemic-cause" }),
    );
    expect(snapshot.immediateActions).toEqual([]);
    expect(snapshot.confirmedInputs).not.toHaveProperty("cerebralOedemaSigns");
  });

  it("requires an explicit clinically established euvolaemic cause", () => {
    const snapshot = evaluate({ fluidStatus: "euvolaemic" });

    expect(snapshot).toMatchObject({
      currentNode: { id: "euvolaemic-causes-pending" },
      status: "awaiting-input",
    });
    expect(snapshot.nextActions).toEqual([]);
  });

  it("selects fluid restriction only for clinically established water intoxication", () => {
    const snapshot = evaluate({
      euvolaemicUnderlyingCause: "water-intoxication-established",
      fluidStatus: "euvolaemic",
    });

    expect(snapshot.currentNode?.id).toBe("euvolaemic-management-review-stop");
    expect(snapshot.nextActions).toEqual([
      expect.objectContaining({
        actionId: "fluid-restriction-water-intoxication",
        instruction: "Use fluid restriction and obtain consultant review.",
      }),
    ]);
  });

  it("redirects established SIADH without generating SIADH treatment", () => {
    const snapshot = evaluate({
      euvolaemicUnderlyingCause: "siadh-established",
      fluidStatus: "euvolaemic",
    });

    expect(snapshot.nextActions).toEqual([
      expect.objectContaining({ actionId: "use-separate-siadh-pathway" }),
    ]);
    expect(snapshot.warnings).toContainEqual(
      expect.objectContaining({ warningId: "siadh-source-not-supplied" }),
    );
    expect(snapshot.nextActions.some((action) => /dose|saline/i.test(action.instruction))).toBe(
      false,
    );
  });

  it.each(["other-or-unresolved", "unable-to-establish"] as const)(
    "fails closed for the euvolaemic cause state %s",
    (euvolaemicUnderlyingCause) => {
      const snapshot = evaluate({ euvolaemicUnderlyingCause, fluidStatus: "euvolaemic" });

      expect(snapshot.currentNode?.id).toBe("euvolaemic-cause-review-stop");
      expect(snapshot.nextActions).toEqual([]);
    },
  );

  it("ignores a stale euvolaemic cause outside the non-emergency euvolaemic branch", () => {
    const snapshot = evaluate({
      euvolaemicUnderlyingCause: "water-intoxication-established",
      fluidStatus: "hypovolaemic",
    });

    expect(snapshot.nextActions.map((action) => action.actionId)).toEqual([
      "review-hypovolaemic-causes",
      "use-hypovolaemic-isotonic-saline",
    ]);
    expect(snapshot.confirmedInputs).not.toHaveProperty("euvolaemicUnderlyingCause");
  });

  it("adds isotonic saline only after the hypovolaemic emergency cause-management endpoint", () => {
    const causeEndpoint = evaluate({
      cerebralOedemaSigns: ["confusion"],
      odsRiskStatus: "high-risk-not-confirmed",
      sodium: 124,
      symptomResponse: "improved",
    });
    const repeatEndpoint = evaluate({
      cerebralOedemaSigns: ["confusion"],
      fourHourSodiumChange: 3,
      odsRiskStatus: "high-risk-not-confirmed",
      sodium: 124,
      symptomResponse: "not-improved",
    });

    expect(causeEndpoint.nextActions.map((action) => action.actionId)).toEqual([
      "diagnose-manage-cause-consultant-review",
      "add-hypovolaemic-isotonic-saline",
    ]);
    expect(repeatEndpoint.immediateActions).toContainEqual(
      expect.objectContaining({ actionId: "repeat-hypertonic-saline-dose" }),
    );
    expect(repeatEndpoint.nextActions).toEqual([]);
  });

  it("does not add hypovolaemic saline to the euvolaemic emergency endpoint", () => {
    const snapshot = evaluate({
      cerebralOedemaSigns: ["confusion"],
      fluidStatus: "euvolaemic",
      odsRiskStatus: "high-risk-not-confirmed",
      sodium: 124,
      symptomResponse: "improved",
    });

    expect(snapshot.nextActions.map((action) => action.actionId)).toEqual([
      "diagnose-manage-cause-consultant-review",
    ]);
  });

  it("returns deterministic deeply frozen snapshots", () => {
    const input = {
      cerebralOedemaSigns: ["none-confirmed"] as const,
      fluidStatus: "hypovolaemic" as const,
      sodium: 129,
    };
    const first = evaluateHyponatraemiaManagement(input);
    const second = evaluateHyponatraemiaManagement(input);

    expect(first).toEqual(second);
    expect(Object.isFrozen(first)).toBe(true);
    expect(Object.isFrozen(first.nextActions)).toBe(true);
  });
});
