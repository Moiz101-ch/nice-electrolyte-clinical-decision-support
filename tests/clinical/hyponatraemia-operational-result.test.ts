import { describe, expect, it } from "vitest";

import {
  HYPONATRAEMIA_CLASSIFICATION_SOURCE_IDS,
  HYPONATRAEMIA_OPERATIONAL_RESULT_VERSION,
  HYPONATRAEMIA_SOURCE_ID,
  evaluateHyponatraemiaOperationalResult,
  type HyponatraemiaOperationalResultInput,
} from "../../src/clinical/pathways/hyponatraemia/index.ts";

const completeResult = (overrides: Partial<HyponatraemiaOperationalResultInput> = {}) =>
  evaluateHyponatraemiaOperationalResult({
    cerebralOedemaSigns: ["confusion"],
    fluidStatus: "euvolaemic",
    odsRiskStatus: "high-risk-confirmed",
    serumOsmolality: 270,
    sodium: 124,
    symptomResponse: "improved",
    urineOsmolality: 120,
    urineResultsAvailable: true,
    urineSodium: 40.1,
    ...overrides,
  });

describe("hyponatraemia operational result", () => {
  it("composes the complete severe symptomatic review result", () => {
    const result = completeResult();

    expect(result).toMatchObject({
      causePattern: { id: "siadh-compatible", label: "SIADH-compatible pattern" },
      clinicalReviewStatus: "awaiting-clinical-review",
      confirmedSignLabels: ["Confusion"],
      currentBranch: { label: "Symptomatic emergency management" },
      fluidStatusLabel: "Euvolaemic",
      pathway: {
        id: "hyponatraemia-operational-result",
        version: HYPONATRAEMIA_OPERATIONAL_RESULT_VERSION,
      },
      serumTonicity: "hypotonic",
      severity: { label: "Severe hyponatraemia", unit: "mmol/L", value: 124 },
      status: "requires-clinical-review",
      treatmentTarget: "Goal: increase sodium by 4-6 mmol/L in the first 2-4 hours.",
    });
    expect(result.immediateActions.map((action) => action.actionId)).toEqual([
      "obtain-pre-treatment-investigations",
      "administer-initial-hypertonic-saline",
    ]);
    expect(result.nextActions.map((action) => action.actionId)).toEqual([
      "diagnose-manage-cause-consultant-review",
    ]);
    expect(result.monitoring.map((item) => item.monitoringId)).toEqual([
      "high-risk-ods-hourly-monitoring",
      "high-risk-ods-follow-up-monitoring",
    ]);
    expect(result.warnings.map((warning) => warning.warningId)).toEqual([
      "avoid-excessive-correction",
      "exclude-thyroid-and-adrenal-causes",
    ]);
  });

  it("preserves unique source provenance internally across every evaluated pathway", () => {
    const result = completeResult();
    const sourceIds = new Set(result.sourceReferences.map((reference) => reference.sourceId));
    const referenceKeys = result.sourceReferences.map(
      (reference) => `${reference.sourceId}:${reference.page}:${reference.section}`,
    );

    expect(sourceIds).toEqual(
      new Set([HYPONATRAEMIA_SOURCE_ID, ...HYPONATRAEMIA_CLASSIFICATION_SOURCE_IDS]),
    );
    expect(new Set(referenceKeys).size).toBe(referenceKeys.length);
  });

  it("provides deterministic plain-language selection reasons", () => {
    expect(completeResult().whySelected).toEqual([
      "Sodium 124 mmol/L selected Severe hyponatraemia (<125 mmol/L).",
      "Euvolaemic fluid status and confirmed Confusion selected the symptomatic emergency branch.",
      "Confirmed high ODS risk selected enhanced sodium monitoring.",
      "Confirmed symptomatic improvement selected cause management as the next action.",
      "Serum osmolality 270 mOsm/kg selected the hypotonic classification.",
      "Urine osmolality 120 mOsm/kg was evaluated in the euvolaemic branch.",
      "Urine sodium 40.1 mEq/L was evaluated without inferring an unstated boundary result.",
    ]);
  });

  it("only includes enhanced monitoring when high ODS risk is confirmed", () => {
    const notConfirmed = completeResult({ odsRiskStatus: "high-risk-not-confirmed" });

    expect(notConfirmed.monitoring).toEqual([]);
    expect(notConfirmed.whySelected).not.toContain(
      "Confirmed high ODS risk selected enhanced sodium monitoring.",
    );
  });

  it("does not leak emergency actions into a no-sign branch", () => {
    const result = evaluateHyponatraemiaOperationalResult({
      cerebralOedemaSigns: ["none-confirmed"],
      fluidStatus: "euvolaemic",
      serumOsmolality: 270,
      sodium: 124,
      urineOsmolality: 120,
      urineResultsAvailable: true,
      urineSodium: 40.1,
    });

    expect(result.immediateActions).toEqual([]);
    expect(result.monitoring).toEqual([]);
    expect(result.nextActions).toEqual([]);
    expect(result.status).toBe("awaiting-input");
    expect(result.currentBranch.label).toBe("SIADH-compatible pattern");
    expect(result.whySelected).toContain(
      "Euvolaemic fluid status with no listed sign confirmed did not select emergency treatment.",
    );
  });

  it("composes the non-emergency hypovolaemic management endpoint", () => {
    const result = evaluateHyponatraemiaOperationalResult({
      cerebralOedemaSigns: ["none-confirmed"],
      fluidStatus: "hypovolaemic",
      serumOsmolality: 270,
      sodium: 129,
      urineResultsAvailable: true,
      urineSodium: 20,
    });

    expect(result.currentBranch.label).toBe("Hypovolaemic management");
    expect(result.nextActions.map((action) => action.actionId)).toEqual([
      "review-hypovolaemic-causes",
      "use-hypovolaemic-isotonic-saline",
    ]);
    expect(result.status).toBe("requires-clinical-review");
  });

  it("composes explicit euvolaemic and hypervolaemic endpoints", () => {
    const waterIntoxication = evaluateHyponatraemiaOperationalResult({
      cerebralOedemaSigns: ["none-confirmed"],
      euvolaemicUnderlyingCause: "water-intoxication-established",
      fluidStatus: "euvolaemic",
      serumOsmolality: 270,
      sodium: 129,
      urineOsmolality: 99.9,
      urineResultsAvailable: true,
    });
    const hypervolaemic = evaluateHyponatraemiaOperationalResult({
      fluidStatus: "hypervolaemic",
      serumOsmolality: 270,
      sodium: 129,
      urineResultsAvailable: true,
    });

    expect(waterIntoxication.currentBranch.label).toBe("Euvolaemic water-intoxication management");
    expect(waterIntoxication.nextActions).toContainEqual(
      expect.objectContaining({ actionId: "fluid-restriction-water-intoxication" }),
    );
    expect(hypervolaemic.currentBranch.label).toBe("Hypervolaemic management");
    expect(hypervolaemic.nextActions).toContainEqual(
      expect.objectContaining({ actionId: "refer-senior-hypervolaemic-cause" }),
    );
  });

  it("keeps incomplete response data in an awaiting state", () => {
    const result = evaluateHyponatraemiaOperationalResult({
      cerebralOedemaSigns: ["confusion"],
      fluidStatus: "euvolaemic",
      odsRiskStatus: "high-risk-confirmed",
      serumOsmolality: 270,
      sodium: 124,
      urineOsmolality: 120,
      urineResultsAvailable: true,
      urineSodium: 40.1,
    });

    expect(result.status).toBe("awaiting-input");
    expect(result.currentBranch.detail).toContain("awaiting or requires a follow-up decision");
    expect(result.nextActions).toEqual([]);
  });

  it("fails closed for invalid or contradictory assessment input", () => {
    const result = completeResult({ cerebralOedemaSigns: ["confusion", "none-confirmed"] });

    expect(result.status).toBe("blocked");
    expect(result.immediateActions).toEqual([]);
    expect(result.currentBranch.label).toBe("No branch selected");
    expect(result.issues.length).toBeGreaterThan(0);
  });

  it("keeps emergency output available when urine results are unavailable", () => {
    const result = evaluateHyponatraemiaOperationalResult({
      cerebralOedemaSigns: ["confusion"],
      fluidStatus: "euvolaemic",
      odsRiskStatus: "high-risk-confirmed",
      sodium: 124,
      symptomResponse: "improved",
      urineResultsAvailable: false,
    });

    expect(result.status).toBe("requires-clinical-review");
    expect(result.causePattern).toBeNull();
    expect(result.immediateActions).toHaveLength(2);
    expect(result.monitoring).toHaveLength(2);
  });

  it.each([4, 4.5, 5])(
    "does not invent a follow-up action for the undefined four-hour change %s",
    (fourHourSodiumChange) => {
      const result = completeResult({
        fourHourSodiumChange,
        odsRiskStatus: "high-risk-not-confirmed",
        symptomResponse: "not-improved",
      });

      expect(result.status).toBe("requires-clinical-review");
      expect(result.immediateActions.map((action) => action.actionId)).not.toContain(
        "repeat-hypertonic-saline-dose",
      );
      expect(result.nextActions).toEqual([]);
    },
  );

  it("returns deeply immutable deterministic output", () => {
    const first = completeResult();
    const second = completeResult();

    expect(first).toEqual(second);
    expect(Object.isFrozen(first)).toBe(true);
    expect(Object.isFrozen(first.immediateActions)).toBe(true);
    expect(Object.isFrozen(first.pathway)).toBe(true);
    expect(Object.isFrozen(first.whySelected)).toBe(true);
  });
});
