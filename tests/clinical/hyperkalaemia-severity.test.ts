import { describe, expect, it } from "vitest";

import {
  HYPERKALAEMIA_SEVERITY_BANDS,
  HYPERKALAEMIA_SOURCE_ID,
  HYPERKALAEMIA_UKKA_SOURCE_ID,
  POTASSIUM_UNIT,
  evaluateHyperkalaemiaSeverity,
  hyperkalaemiaSeverityPathwayDefinition,
} from "@/src/clinical/pathways/hyperkalaemia";

describe("Hyperkalaemia potassium severity pathway", () => {
  it("loads a source-traceable definition below the clinical approval gate", () => {
    expect(hyperkalaemiaSeverityPathwayDefinition).toMatchObject({
      pathwayId: "hyperkalaemia-potassium-severity",
      sourceIds: [HYPERKALAEMIA_SOURCE_ID, HYPERKALAEMIA_UKKA_SOURCE_ID],
      status: "awaiting-clinical-review",
      version: "0.1.0",
    });
    expect(HYPERKALAEMIA_SEVERITY_BANDS.map((band) => band.sourceRangeLabel)).toEqual([
      "5.5-5.9 mmol/L",
      "6.0-6.4 mmol/L",
      ">=6.5 mmol/L",
    ]);
  });

  it.each([
    [5.5, "mild"],
    [5.9, "mild"],
    [6, "moderate"],
    [6.4, "moderate"],
    [6.5, "severe"],
    [7, "severe"],
  ] as const)("classifies potassium %s as %s", (value, severity) => {
    const result = evaluateHyperkalaemiaSeverity(value);

    expect(result.kind).toBe("classified");
    if (result.kind !== "classified") throw new Error("Expected a classified result.");

    expect(result.band.severity).toBe(severity);
    expect(result.unit).toBe(POTASSIUM_UNIT);
    expect(result.snapshot).toMatchObject({
      clinicalReviewStatus: "awaiting-clinical-review",
      status: "requires-clinical-review",
    });
    expect(result.snapshot.sourceReferences).toContainEqual({
      page: 2,
      section: "Severity classification: Mild, Moderate and Severe",
      sourceId: HYPERKALAEMIA_SOURCE_ID,
    });
  });

  it.each([5.49, 5.91, 5.99, 6.41, 6.49])(
    "fails closed when potassium %s does not match a printed source band",
    (value) => {
      const result = evaluateHyperkalaemiaSeverity(value);

      expect(result.kind).toBe("unsupported");
      expect(result.snapshot.status).toBe("unsupported");
      expect(result.snapshot.derivedClassifications[0]?.branchId).toBe("no-exact-source-band");
      expect(result.snapshot.immediateActions).toEqual([]);
      expect(result.snapshot.warnings).toEqual([]);
    },
  );

  it("returns universal checks for each supported severity", () => {
    for (const value of [5.5, 6, 6.5]) {
      const result = evaluateHyperkalaemiaSeverity(value);

      expect(result.snapshot.immediateActions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ actionId: "exclude-pseudohyperkalaemia" }),
          expect.objectContaining({ actionId: "check-calcium-bicarbonate" }),
          expect.objectContaining({ actionId: "check-chronic-potassium-context" }),
        ]),
      );
    }
  });

  it("keeps pseudohyperkalaemia exclusion and VBG guidance source-traceable", () => {
    const result = evaluateHyperkalaemiaSeverity(6.5);
    const pseudohyperkalaemia = result.snapshot.immediateActions.find(
      ({ actionId }) => actionId === "exclude-pseudohyperkalaemia",
    );
    const calciumAndBicarbonate = result.snapshot.immediateActions.find(
      ({ actionId }) => actionId === "check-calcium-bicarbonate",
    );

    expect(pseudohyperkalaemia?.guidance).toMatchObject({
      title: "How to exclude pseudohyperkalaemia",
      steps: expect.arrayContaining([
        expect.stringMatching(/paired samples/i),
        expect.stringMatching(/more than 0\.4 mmol\/L/i),
        expect.stringMatching(/normal ECG.*does not exclude true hyperkalaemia/i),
      ]),
    });
    expect(pseudohyperkalaemia?.sourceReferences).toContainEqual(
      expect.objectContaining({ page: 71, sourceId: HYPERKALAEMIA_UKKA_SOURCE_ID }),
    );
    expect(calciumAndBicarbonate?.instruction).toMatch(/venous blood gas \(VBG\)/i);
    expect(calciumAndBicarbonate?.sourceReferences).toContainEqual(
      expect.objectContaining({ page: 68, sourceId: HYPERKALAEMIA_UKKA_SOURCE_ID }),
    );
  });

  it("adds ECG and rhythm monitoring only from 6.0 mmol/L", () => {
    const mild = evaluateHyperkalaemiaSeverity(5.9);
    const moderate = evaluateHyperkalaemiaSeverity(6);
    const severe = evaluateHyperkalaemiaSeverity(6.5);

    expect(mild.snapshot.immediateActions).not.toContainEqual(
      expect.objectContaining({ actionId: "perform-ecg-monitor-rhythm" }),
    );
    expect(moderate.snapshot.immediateActions).toContainEqual(
      expect.objectContaining({ actionId: "perform-ecg-monitor-rhythm" }),
    );
    expect(severe.snapshot.immediateActions).toContainEqual(
      expect.objectContaining({ actionId: "perform-ecg-monitor-rhythm" }),
    );
  });

  it("adds the source safeguard at 7.0 mmol/L without inventing a treatment dose", () => {
    const below = evaluateHyperkalaemiaSeverity(6.99);
    const threshold = evaluateHyperkalaemiaSeverity(7);

    expect(below.snapshot.warnings).toEqual([]);
    expect(threshold.snapshot.warnings).toContainEqual(
      expect.objectContaining({
        severity: "critical",
        warningId: "do-not-delay-calcium-for-ecg",
      }),
    );
    expect(threshold.snapshot.warnings[0]?.message).not.toMatch(/\b\d+\s*mL\b/i);
    expect(threshold.snapshot.immediateActions).toHaveLength(4);
  });

  it("rejects wrong units, non-positive values, non-finite values and excess precision", () => {
    expect(evaluateHyperkalaemiaSeverity(6, "mEq/L")).toMatchObject({
      kind: "invalid",
      message: "Use mmol/L for the potassium result.",
    });
    expect(evaluateHyperkalaemiaSeverity(0)).toMatchObject({
      kind: "invalid",
      message: "Enter a potassium result greater than 0 mmol/L.",
    });
    expect(evaluateHyperkalaemiaSeverity(Number.NaN)).toMatchObject({ kind: "invalid" });
    expect(evaluateHyperkalaemiaSeverity(5.499)).toMatchObject({
      kind: "invalid",
      message: "Enter potassium with no more than 2 decimal places.",
    });
  });

  it("returns deterministic immutable snapshots", () => {
    const first = evaluateHyperkalaemiaSeverity(7);
    const second = evaluateHyperkalaemiaSeverity(7);

    expect(first).toEqual(second);
    expect(Object.isFrozen(first.snapshot)).toBe(true);
    expect(Object.isFrozen(first.snapshot.immediateActions)).toBe(true);
    expect(Object.isFrozen(first.snapshot.warnings)).toBe(true);
  });
});
