import { describe, expect, it } from "vitest";

import {
  HYPONATRAEMIA_CONNECTED_ASSESSMENT_VERSION,
  evaluateHyponatraemiaConnectedAssessment,
  type HyponatraemiaConnectedAssessmentInput,
} from "../../src/clinical/pathways/hyponatraemia/index.ts";

const completeInput: HyponatraemiaConnectedAssessmentInput = {
  cerebralOedemaSigns: ["confusion"],
  fluidStatus: "euvolaemic",
  odsRiskStatus: "high-risk-confirmed",
  serumOsmolality: 270,
  sodium: 124,
  symptomResponse: "improved",
  urineOsmolality: 120,
  urineResultsAvailable: true,
  urineSodium: 40.1,
};

describe("connected Hyponatraemia assessment", () => {
  it("coordinates a complete emergency and classification result", () => {
    const evaluation = evaluateHyponatraemiaConnectedAssessment(completeInput);

    expect(evaluation).toMatchObject({
      classification: { causePattern: { id: "siadh-compatible" } },
      completion: {
        classification: true,
        emergency: true,
        fluidStatus: true,
        management: true,
        readyForResult: true,
        severity: true,
      },
      emergencyRequired: true,
      operationalResult: {
        currentBranch: { label: "Symptomatic emergency management" },
        status: "requires-clinical-review",
      },
      pathway: { version: HYPONATRAEMIA_CONNECTED_ASSESSMENT_VERSION },
      severity: { kind: "classified" },
    });
  });

  it("skips emergency follow-up when no listed sign is confirmed", () => {
    const evaluation = evaluateHyponatraemiaConnectedAssessment({
      cerebralOedemaSigns: ["none-confirmed"],
      euvolaemicUnderlyingCause: "other-or-unresolved",
      fluidStatus: "euvolaemic",
      serumOsmolality: 270,
      sodium: 129,
      urineOsmolality: 99.9,
      urineResultsAvailable: true,
    });

    expect(evaluation.emergencyRequired).toBe(false);
    expect(evaluation.completion).toMatchObject({
      classification: true,
      emergency: true,
      fluidStatus: true,
      management: true,
      readyForResult: true,
    });
    expect(evaluation.operationalResult.immediateActions).toEqual([]);
    expect(evaluation.classification.causePattern?.id).toBe("primary-polydipsia-low-solute");
  });

  it("keeps the non-emergency euvolaemic result closed until the cause state is explicit", () => {
    const awaitingCause = evaluateHyponatraemiaConnectedAssessment({
      cerebralOedemaSigns: ["none-confirmed"],
      fluidStatus: "euvolaemic",
      serumOsmolality: 270,
      sodium: 129,
      urineOsmolality: 99.9,
      urineResultsAvailable: true,
    });
    const waterIntoxication = evaluateHyponatraemiaConnectedAssessment({
      cerebralOedemaSigns: ["none-confirmed"],
      euvolaemicUnderlyingCause: "water-intoxication-established",
      fluidStatus: "euvolaemic",
      serumOsmolality: 270,
      sodium: 129,
      urineOsmolality: 99.9,
      urineResultsAvailable: true,
    });

    expect(awaitingCause.euvolaemicCauseRequired).toBe(true);
    expect(awaitingCause.completion).toMatchObject({
      classification: true,
      management: false,
      readyForResult: false,
    });
    expect(waterIntoxication.completion).toMatchObject({
      management: true,
      readyForResult: true,
    });
    expect(waterIntoxication.operationalResult.nextActions).toContainEqual(
      expect.objectContaining({ actionId: "fluid-restriction-water-intoxication" }),
    );
  });

  it("keeps each incomplete stage closed until its engine reaches an endpoint", () => {
    const sodiumOnly = evaluateHyponatraemiaConnectedAssessment({ sodium: 124 });
    const contextOnly = evaluateHyponatraemiaConnectedAssessment({
      cerebralOedemaSigns: ["confusion"],
      fluidStatus: "euvolaemic",
      sodium: 124,
    });
    const emergencyComplete = evaluateHyponatraemiaConnectedAssessment({
      cerebralOedemaSigns: ["confusion"],
      fluidStatus: "euvolaemic",
      odsRiskStatus: "high-risk-not-confirmed",
      sodium: 124,
      symptomResponse: "improved",
    });

    expect(sodiumOnly.completion).toMatchObject({
      classification: false,
      fluidStatus: false,
      readyForResult: false,
      severity: true,
    });
    expect(contextOnly.completion).toMatchObject({ emergency: false, fluidStatus: true });
    expect(emergencyComplete.completion).toMatchObject({
      classification: false,
      emergency: true,
      readyForResult: false,
    });
  });

  it("allows a final review when urine results are unavailable without losing emergency output", () => {
    const evaluation = evaluateHyponatraemiaConnectedAssessment({
      cerebralOedemaSigns: ["confusion"],
      fluidStatus: "euvolaemic",
      odsRiskStatus: "high-risk-confirmed",
      sodium: 124,
      symptomResponse: "improved",
      urineResultsAvailable: false,
    });

    expect(evaluation.completion.readyForResult).toBe(true);
    expect(evaluation.classification.causePattern).toBeNull();
    expect(evaluation.operationalResult.immediateActions).toHaveLength(2);
    expect(evaluation.operationalResult.monitoring).toHaveLength(2);
  });

  it("preserves fail-closed review endpoints in the connected result", () => {
    const evaluation = evaluateHyponatraemiaConnectedAssessment({
      ...completeInput,
      fourHourSodiumChange: 4.5,
      odsRiskStatus: "high-risk-not-confirmed",
      symptomResponse: "not-improved",
    });

    expect(evaluation.completion.readyForResult).toBe(true);
    expect(evaluation.emergency.currentNode?.id).toBe("four-hour-response-review-required");
    expect(
      evaluation.operationalResult.immediateActions.map((action) => action.actionId),
    ).not.toContain("repeat-hypertonic-saline-dose");
    expect(evaluation.operationalResult.nextActions).toEqual([]);
  });

  it("returns deterministic deeply immutable coordination output", () => {
    const first = evaluateHyponatraemiaConnectedAssessment(completeInput);
    const second = evaluateHyponatraemiaConnectedAssessment(completeInput);

    expect(first).toEqual(second);
    expect(Object.isFrozen(first)).toBe(true);
    expect(Object.isFrozen(first.completion)).toBe(true);
    expect(Object.isFrozen(first.pathway)).toBe(true);
  });
});
