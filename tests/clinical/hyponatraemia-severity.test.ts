import { describe, expect, it } from "vitest";

import {
  HYPONATRAEMIA_SEVERITY_BANDS,
  HYPONATRAEMIA_SOURCE_ID,
  SODIUM_UNIT,
  evaluateHyponatraemiaSeverity,
  hyponatraemiaSeverityPathwayDefinition,
} from "../../src/clinical/pathways/hyponatraemia/index.ts";

describe("hyponatraemia sodium severity pathway", () => {
  it("loads a source-traceable definition below the clinical approval gate", () => {
    expect(hyponatraemiaSeverityPathwayDefinition).toMatchObject({
      pathwayId: "hyponatraemia-sodium-severity",
      sourceIds: [HYPONATRAEMIA_SOURCE_ID],
      status: "awaiting-clinical-review",
      version: "0.1.0",
    });
    expect(HYPONATRAEMIA_SEVERITY_BANDS.map((band) => band.sourceRangeLabel)).toEqual([
      "<125 mmol/L",
      "125–129 mmol/L",
      "130–135 mmol/L",
    ]);
  });

  it.each([
    [124.9, "severe"],
    [125, "moderate"],
    [129, "moderate"],
    [130, "mild"],
    [135, "mild"],
  ] as const)("classifies sodium %s as %s", (value, severity) => {
    const result = evaluateHyponatraemiaSeverity(value);

    expect(result.kind).toBe("classified");
    if (result.kind !== "classified") throw new Error("Expected a classified result.");

    expect(result.band.severity).toBe(severity);
    expect(result.unit).toBe(SODIUM_UNIT);
    expect(result.snapshot).toMatchObject({
      clinicalReviewStatus: "awaiting-clinical-review",
      status: "requires-clinical-review",
    });
    expect(result.snapshot.immediateActions).toEqual([]);
    expect(result.snapshot.nextActions).toEqual([]);
    expect(result.snapshot.sourceReferences).toContainEqual({
      page: 1,
      section: "Severity classification: Mild, Moderate and Severe",
      sourceId: HYPONATRAEMIA_SOURCE_ID,
    });
  });

  it.each([129.1, 129.5, 129.9, 135.1, 136])(
    "fails closed when sodium %s does not match a printed source band",
    (value) => {
      const result = evaluateHyponatraemiaSeverity(value);

      expect(result.kind).toBe("unsupported");
      expect(result.snapshot.status).toBe("unsupported");
      expect(result.snapshot.derivedClassifications[0]?.branchId).toBe("no-exact-source-band");
      expect(result.snapshot.immediateActions).toEqual([]);
      expect(result.snapshot.nextActions).toEqual([]);
    },
  );

  it("rejects wrong units, non-positive values, non-finite values and excess precision", () => {
    expect(evaluateHyponatraemiaSeverity(130, "mEq/L")).toMatchObject({
      kind: "invalid",
      message: "Use mmol/L for the sodium result.",
    });
    expect(evaluateHyponatraemiaSeverity(0)).toMatchObject({
      kind: "invalid",
      message: "Enter a sodium result greater than 0 mmol/L.",
    });
    expect(evaluateHyponatraemiaSeverity(Number.NaN)).toMatchObject({ kind: "invalid" });
    expect(evaluateHyponatraemiaSeverity(124.99)).toMatchObject({
      kind: "invalid",
      message: "Enter sodium with no more than 1 decimal place.",
    });
  });

  it("returns deterministic snapshots for repeated inputs", () => {
    expect(evaluateHyponatraemiaSeverity(125)).toEqual(evaluateHyponatraemiaSeverity(125));
  });
});
