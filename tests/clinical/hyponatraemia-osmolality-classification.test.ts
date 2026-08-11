import { describe, expect, it } from "vitest";

import {
  HYPONATRAEMIA_CLASSIFICATION_SOURCE_IDS,
  OSMOLALITY_UNIT,
  URINE_SODIUM_UNIT,
  evaluateHyponatraemiaOsmolalityClassification,
  hyponatraemiaOsmolalityClassificationPathwayDefinition,
} from "@/src/clinical/pathways/hyponatraemia";

function evaluate(
  overrides: Partial<Parameters<typeof evaluateHyponatraemiaOsmolalityClassification>[0]> = {},
) {
  return evaluateHyponatraemiaOsmolalityClassification({
    urineResultsAvailable: true,
    ...overrides,
  });
}

describe("hyponatraemia urine and osmolality classification", () => {
  it("is versioned, review-gated and mapped to both supplied classification images", () => {
    expect(hyponatraemiaOsmolalityClassificationPathwayDefinition).toMatchObject({
      pathwayId: "hyponatraemia-osmolality-classification",
      sourceIds: [...HYPONATRAEMIA_CLASSIFICATION_SOURCE_IDS],
      status: "awaiting-clinical-review",
      version: "0.4.0",
    });
  });

  it("waits for an explicit urine-result availability answer", () => {
    const result = evaluateHyponatraemiaOsmolalityClassification({});

    expect(result.snapshot.status).toBe("awaiting-input");
    expect(result.snapshot.currentNode?.id).toBe("urine-results-available-question");
    expect(result.snapshot.warnings).toHaveLength(1);
  });

  it("stops classification when urine results are unavailable and ignores stale values", () => {
    const result = evaluateHyponatraemiaOsmolalityClassification({
      fluidStatus: "euvolaemic",
      serumOsmolality: 270,
      urineOsmolality: 120,
      urineResultsAvailable: false,
      urineSodium: 60,
    });

    expect(result.snapshot.currentNode?.id).toBe("classification-results-unavailable");
    expect(result.snapshot.status).toBe("requires-clinical-review");
    expect(result.serumTonicity).toBeNull();
    expect(result.causePattern).toBeNull();
    expect(Object.keys(result.snapshot.confirmedInputs)).toEqual(["urineResultsAvailable"]);
  });

  it("classifies values below 275 mOsm/kg as hypotonic and requests fluid status", () => {
    const result = evaluate({ serumOsmolality: 274.9 });

    expect(result.serumTonicity).toBe("hypotonic");
    expect(result.snapshot.currentNode?.id).toBe("classification-fluid-status-question");
    expect(result.snapshot.status).toBe("awaiting-input");
  });

  it.each([275, 295])("fails closed at the ambiguous serum boundary %s", (serumOsmolality) => {
    const result = evaluate({ serumOsmolality });

    expect(result.snapshot.currentNode?.id).toBe("serum-osmolality-boundary-review");
    expect(result.causePattern).toBeNull();
    expect(result.serumTonicity).toBeNull();
  });

  it("identifies an isotonic pseudohyponatraemia-compatible category without urine inputs", () => {
    const result = evaluate({
      fluidStatus: "euvolaemic",
      serumOsmolality: 280,
      urineOsmolality: 120,
      urineSodium: 60,
    });

    expect(result.serumTonicity).toBe("isotonic");
    expect(result.causePattern?.id).toBe("pseudohyponatraemia-compatible");
    expect(result.causePattern?.causes).toEqual(["Paraproteinaemia", "Hyperlipidaemia"]);
    expect(Object.keys(result.snapshot.confirmedInputs)).toEqual([
      "urineResultsAvailable",
      "serumOsmolality",
    ]);
  });

  it("identifies a hypertonic translocational-compatible category", () => {
    const result = evaluate({ serumOsmolality: 295.1 });

    expect(result.serumTonicity).toBe("hypertonic");
    expect(result.causePattern?.id).toBe("translocational-compatible");
    expect(result.causePattern?.causes).toContain("Hyperglycaemia");
  });

  it.each([
    { expected: "non-renal-salt-loss", urineSodium: 0 },
    { expected: "non-renal-salt-loss", urineSodium: 39.9 },
    { expected: "renal-salt-loss", urineSodium: 40.1 },
  ])("classifies hypovolaemic urine sodium $urineSodium", ({ expected, urineSodium }) => {
    const result = evaluate({
      fluidStatus: "hypovolaemic",
      serumOsmolality: 270,
      urineSodium,
    });

    expect(result.causePattern?.id).toBe(expected);
  });

  it("fails closed when hypovolaemic urine sodium equals 40 mEq/L", () => {
    const result = evaluate({
      fluidStatus: "hypovolaemic",
      serumOsmolality: 270,
      urineSodium: 40,
    });

    expect(result.snapshot.currentNode?.id).toBe("urine-sodium-boundary-review");
    expect(result.causePattern).toBeNull();
  });

  it("identifies the euvolaemic low urine-osmolality category without urine sodium", () => {
    const result = evaluate({
      fluidStatus: "euvolaemic",
      serumOsmolality: 270,
      urineOsmolality: 99.9,
      urineSodium: 60,
    });

    expect(result.causePattern?.id).toBe("primary-polydipsia-low-solute");
    expect(result.snapshot.confirmedInputs).not.toHaveProperty("euvolaemicUrineSodium");
  });

  it("identifies a SIADH-compatible pattern only above both urine thresholds", () => {
    const result = evaluate({
      fluidStatus: "euvolaemic",
      serumOsmolality: 270,
      urineOsmolality: 100.1,
      urineSodium: 40.1,
    });

    expect(result.causePattern?.id).toBe("siadh-compatible");
    expect(result.causePattern?.summary).toContain(
      "A dedicated SIADH management pathway requires an approved source",
    );
  });

  it("fails closed when urine osmolality equals 100 mOsm/kg", () => {
    const result = evaluate({
      fluidStatus: "euvolaemic",
      serumOsmolality: 270,
      urineOsmolality: 100,
    });

    expect(result.snapshot.currentNode?.id).toBe("urine-osmolality-boundary-review");
    expect(result.causePattern).toBeNull();
  });

  it.each([39.9, 40])(
    "does not infer an unstated euvolaemic category at urine sodium %s",
    (urineSodium) => {
      const result = evaluate({
        fluidStatus: "euvolaemic",
        serumOsmolality: 270,
        urineOsmolality: 120,
        urineSodium,
      });

      expect(result.snapshot.currentNode?.id).toBe("euvolaemic-urine-sodium-review");
      expect(result.causePattern).toBeNull();
    },
  );

  it("identifies the hypervolaemic cause category without requiring urine findings", () => {
    const result = evaluate({
      fluidStatus: "hypervolaemic",
      serumOsmolality: 270,
    });

    expect(result.causePattern?.id).toBe("hypervolaemic-pattern");
    expect(result.causePattern?.causes).toEqual([
      "Heart failure",
      "Cirrhosis",
      "Nephrotic syndrome",
    ]);
  });

  it("stops without a cause when fluid status cannot be established", () => {
    const result = evaluate({
      fluidStatus: "unable-to-establish",
      serumOsmolality: 270,
    });

    expect(result.snapshot.currentNode?.id).toBe("classification-fluid-status-review");
    expect(result.causePattern).toBeNull();
  });

  it.each([
    { field: "serumOsmolality", value: -1 },
    { field: "serumOsmolality", value: 270.12 },
    { field: "urineOsmolality", value: -1 },
    { field: "urineSodium", value: -1 },
  ] as const)("blocks invalid $field input $value", ({ field, value }) => {
    const result = evaluate({
      fluidStatus: "euvolaemic",
      serumOsmolality: 270,
      urineOsmolality: 120,
      urineSodium: 60,
      [field]: value,
    });

    expect(result.snapshot.status).toBe("blocked");
    expect(result.causePattern).toBeNull();
  });

  it("blocks incorrect measurement units", () => {
    const serumResult = evaluate({ serumOsmolality: 270, serumOsmolalityUnit: "mmol/L" });
    const urineResult = evaluate({
      fluidStatus: "hypovolaemic",
      serumOsmolality: 270,
      urineSodium: 20,
      urineSodiumUnit: "mmol/L",
    });

    expect(serumResult.snapshot.status).toBe("blocked");
    expect(serumResult.snapshot.issues[0]?.message).toContain(OSMOLALITY_UNIT);
    expect(urineResult.snapshot.status).toBe("blocked");
    expect(urineResult.snapshot.issues[0]?.message).toContain(URINE_SODIUM_UNIT);
  });

  it("returns deterministic deeply frozen output", () => {
    const input = {
      fluidStatus: "euvolaemic" as const,
      serumOsmolality: 270,
      urineOsmolality: 120,
      urineResultsAvailable: true,
      urineSodium: 60,
    };
    const first = evaluateHyponatraemiaOsmolalityClassification(input);
    const second = evaluateHyponatraemiaOsmolalityClassification(input);

    expect(first).toEqual(second);
    expect(Object.isFrozen(first)).toBe(true);
    expect(Object.isFrozen(first.snapshot)).toBe(true);
    expect(Object.isFrozen(first.causePattern)).toBe(true);
  });
});
