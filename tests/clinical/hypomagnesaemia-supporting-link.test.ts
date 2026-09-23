import { describe, expect, it } from "vitest";

import {
  evaluateHypocalcaemiaGuardrails,
  hypocalcaemiaGuardrailPathwayDefinition,
  type HypocalcaemiaAssessmentInputs,
} from "@/src/clinical/pathways/hypocalcaemia";
import { loadClinicalSourceRegistry } from "@/src/clinical/sources/registry";

const HYPOMAGNESAEMIA_SOURCE_ID = "TGICFT-HYPOMAGNESAEMIA-UNDATED";
const HYPOCALCAEMIA_SOURCE_ID = "YSTHFT-HYPOCALCAEMIA-V4";

function completedAssessment(): HypocalcaemiaAssessmentInputs {
  return {
    adjustedCalcium: 2,
    albuminAdjustment: "confirmed",
    alkalinePhosphatase: "not-high",
    ecgAssessment: "no-changes",
    magnesium: "below-range",
    phosphate: "within-range",
    pth: "not-low",
    rateOfFall: "not-rapid",
    renalFunction: "no-renal-failure",
    surgery: "no-recent-surgery",
    symptoms: ["none"],
    vitaminD: "not-deficient",
  };
}

describe("Hypomagnesaemia supporting linkage", () => {
  it("registers a draft supporting source with explicit approval blockers", () => {
    const registry = loadClinicalSourceRegistry();
    const source = registry.getSource(HYPOMAGNESAEMIA_SOURCE_ID);

    expect(source).toMatchObject({
      clinicalReviewStatus: "draft",
      clinicalScope: "hypomagnesaemia",
      documentVersion: null,
      issueDate: null,
      reviewDate: null,
      sourceKind: "supporting-guidance",
    });
    expect(source?.governanceFlags).toEqual(
      expect.arrayContaining([
        "internal-content-conflict",
        "metadata-incomplete",
        "reuse-unverified",
        "source-mismatch",
      ]),
    );
    expect(
      registry.getRelatedSources(HYPOMAGNESAEMIA_SOURCE_ID).map(({ sourceId }) => sourceId),
    ).toEqual([HYPOCALCAEMIA_SOURCE_ID]);
  });

  it("keeps the supporting source outside treatment derivation and generates no magnesium dose", () => {
    const snapshot = evaluateHypocalcaemiaGuardrails(completedAssessment(), {
      acutePancreatitis: "not-confirmed",
      hypomagnesaemiaCause: "confirmed",
      hypoparathyroidismCause: "not-confirmed",
      medicineContexts: ["none"],
      recentBloodTransfusion: "not-confirmed",
      rhabdomyolysis: "not-confirmed",
    });
    const action = snapshot.nextActions.find(
      ({ actionId }) => actionId === "hypomagnesaemia-cause-treatment",
    );

    expect(hypocalcaemiaGuardrailPathwayDefinition.sourceIds).toEqual([HYPOCALCAEMIA_SOURCE_ID]);
    expect(hypocalcaemiaGuardrailPathwayDefinition.sourceIds).not.toContain(
      HYPOMAGNESAEMIA_SOURCE_ID,
    );
    expect(action?.instruction).toMatch(/no magnesium dose is generated/i);
    expect(action?.instruction).not.toMatch(/\b\d+(?:\.\d+)?\s*(?:mg|mL|mmol|sachet)/i);
    expect(new Set(action?.sourceReferences.map(({ sourceId }) => sourceId))).toEqual(
      new Set([HYPOCALCAEMIA_SOURCE_ID]),
    );
  });
});
