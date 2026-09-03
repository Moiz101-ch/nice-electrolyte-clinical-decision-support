import { describe, expect, it } from "vitest";

import {
  HYPOCALCAEMIA_SEVERITY_BANDS,
  HYPOCALCAEMIA_SOURCE_ID,
  HYPOCALCAEMIA_SYMPTOMS,
  evaluateHypocalcaemiaAssessment,
  evaluateHypocalcaemiaSeverity,
  hypocalcaemiaAssessmentPathwayDefinition,
} from "@/src/clinical/pathways/hypocalcaemia";

describe("Hypocalcaemia source assessment", () => {
  it("registers a review-gated, source-mapped declarative pathway", () => {
    expect(hypocalcaemiaAssessmentPathwayDefinition).toMatchObject({
      pathwayId: "hypocalcaemia-source-assessment",
      sourceIds: [HYPOCALCAEMIA_SOURCE_ID],
      status: "awaiting-clinical-review",
      version: "0.1.0",
    });
    expect(HYPOCALCAEMIA_SEVERITY_BANDS).toHaveLength(2);
    expect(HYPOCALCAEMIA_SYMPTOMS.map((symptom) => symptom.value)).toEqual([
      "weakness",
      "muscle-cramps",
      "paraesthesia",
      "tetany",
      "carpopedal-spasm",
      "chvostek-sign",
      "trousseau-sign",
      "confusion",
      "seizures",
      "behavioural-psychiatric-change",
      "papilloedema",
      "heart-failure",
    ]);
  });

  it.each([
    [1.899, "classified", "moderate-severe"],
    [1.9, "classified", "mild"],
    [2.1, "classified", "mild"],
    [2.101, "boundary-gap", null],
    [2.199, "boundary-gap", null],
    [2.2, "not-hypocalcaemia", null],
  ] as const)("classifies adjusted calcium %s without rounding", (value, kind, severity) => {
    const evaluation = evaluateHypocalcaemiaSeverity(value);

    expect(evaluation.kind).toBe(kind);
    if (evaluation.kind === "classified") {
      expect(evaluation.band.severity).toBe(severity);
    }
  });

  it("requires albumin adjustment before source severity classification", () => {
    const snapshot = evaluateHypocalcaemiaAssessment({
      adjustedCalcium: 1.85,
      albuminAdjustment: "not-confirmed",
    });

    expect(snapshot.status).toBe("unsupported");
    expect(snapshot.stopReason).toMatch(/adjusted serum calcium/i);
    expect(
      snapshot.derivedClassifications.some(
        (classification) => classification.nodeId === "adjusted-calcium-severity",
      ),
    ).toBe(false);
  });

  it("identifies the severe symptomatic emergency combination without treatment output", () => {
    const snapshot = evaluateHypocalcaemiaAssessment({
      adjustedCalcium: 1.85,
      albuminAdjustment: "confirmed",
      alkalinePhosphatase: "high",
      ecgAssessment: "changes-confirmed",
      magnesium: "below-range",
      phosphate: "low",
      pth: "low",
      rateOfFall: "rapid",
      renalFunction: "no-renal-failure",
      surgery: "no-recent-surgery",
      symptoms: ["seizures"],
      vitaminD: "deficient",
    });

    expect(snapshot.status).toBe("requires-clinical-review");
    expect(snapshot.warnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          severity: "critical",
          warningId: "severe-symptomatic-medical-emergency",
        }),
      ]),
    );
    expect(snapshot.immediateActions).toEqual([]);
    expect(snapshot.nextActions).toEqual([]);
    expect(snapshot.stopReason).toMatch(/no cause diagnosis or management instruction/i);
  });

  it("completes the recent-surgery branch without requesting unrelated extended results", () => {
    const snapshot = evaluateHypocalcaemiaAssessment({
      adjustedCalcium: 2,
      albuminAdjustment: "confirmed",
      ecgAssessment: "no-changes",
      magnesium: "not-below-range",
      rateOfFall: "not-rapid",
      renalFunction: "no-renal-failure",
      surgery: "recent-surgery",
      symptoms: ["none"],
    });

    expect(snapshot.status).toBe("requires-clinical-review");
    expect(snapshot.confirmedInputs).not.toHaveProperty("phosphate");
    expect(snapshot.currentNode?.id).toBe("assessment-review-stop");
  });

  it("blocks contradictory explicit symptom states instead of inferring a branch", () => {
    const snapshot = evaluateHypocalcaemiaAssessment({
      adjustedCalcium: 1.85,
      albuminAdjustment: "confirmed",
      symptoms: ["weakness", "none"],
    });

    expect(snapshot.status).toBe("blocked");
    expect(snapshot.blockReason).toBe("ambiguous-branch");
  });

  it("rejects non-positive and over-precision calcium inputs", () => {
    expect(evaluateHypocalcaemiaSeverity(0)).toMatchObject({ kind: "invalid" });
    expect(evaluateHypocalcaemiaSeverity(1.8999)).toMatchObject({ kind: "invalid" });
  });
});
