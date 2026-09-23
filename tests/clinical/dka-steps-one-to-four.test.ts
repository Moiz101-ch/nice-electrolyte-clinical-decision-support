import { describe, expect, it } from "vitest";

import {
  DKA_SOURCE_ID,
  dkaSyntheticCases,
  evaluateDkaStepsOneToFour,
  type DkaStepsOneToFourInput,
} from "@/src/clinical/pathways/dka";

const base = dkaSyntheticCases[0]!.input;

function evaluate(changes: Partial<DkaStepsOneToFourInput> = {}) {
  return evaluateDkaStepsOneToFour({ ...base, ...changes });
}

describe("DKA Steps 1–4 technical preview", () => {
  it("retains source mapping and never creates active clinical output", () => {
    const result = evaluate();

    expect(result.activeClinicalOutput).toBe(false);
    expect(result.stages.map(({ status }) => status)).toEqual([
      "complete",
      "complete",
      "complete",
      "complete",
    ]);
    expect(result.stages.map(({ sourceReference }) => sourceReference.sourceId)).toEqual([
      DKA_SOURCE_ID,
      DKA_SOURCE_ID,
      DKA_SOURCE_ID,
      DKA_SOURCE_ID,
    ]);
    expect(result.calculation?.output.value).toBe(7.2);
    expect(result.calculation?.output.unit).toBe("units/hour");
    expect(result.calculation?.operands).toEqual([
      { key: "dka.weightKg", kind: "numeric-input", unit: "kg", value: 72 },
      { key: null, kind: "constant", unit: null, value: 0.1 },
    ]);
    expect(result.calculation?.sourceDefinedLimit).toEqual({
      applied: false,
      kind: "maximum",
      unit: "units/hour",
      value: 15,
    });
  });

  it("rejects people under 18 before any diagnostic or treatment branch", () => {
    const result = evaluate({ ageYears: 17 });

    expect(result.stages[0].status).toBe("stopped");
    expect(result.stages.slice(1).every(({ status }) => status === "not-reached")).toBe(true);
    expect(result.calculation).toBeNull();
    expect(evaluate({ ageYears: 18 }).stages[0].status).toBe("complete");
  });

  it("stops for missing IV access or incomplete source-listed initial checks", () => {
    const missingIv = evaluate({
      assessment: { ...base.assessment, ivAccessObtained: false },
    });
    expect(missingIv.stages[0].status).toBe("requires-review");
    expect(missingIv.stages[0].findings.join(" ")).toMatch(/senior doctor or critical-care/i);
    expect(missingIv.stages[1].status).toBe("not-reached");

    const missingBlood = evaluate({
      assessment: { ...base.assessment, venousBloodGasObtained: false },
    });
    expect(missingBlood.stages[0].findings.join(" ")).toMatch(/venous blood gas/i);
    expect(missingBlood.calculation).toBeNull();

    const missingGlucose = evaluate({ bloodGlucoseMmolL: null });
    expect(missingGlucose.stages[0].status).toBe("requires-review");
    expect(missingGlucose.stages[0].findings.join(" ")).toMatch(/capillary glucose/i);
    expect(missingGlucose.stages[1].status).toBe("not-reached");
  });

  it("uses strict diagnostic thresholds and accepts either acid-base alternative", () => {
    for (const changes of [
      { bloodGlucoseMmolL: 11 },
      { bloodKetonesMmolL: 3 },
      { venousPh: 7.3, bicarbonateMmolL: 15 },
    ]) {
      const result = evaluate(changes);
      expect(result.stages[1].status).toBe("stopped");
      expect(result.stages[2].status).toBe("not-reached");
      expect(result.calculation).toBeNull();
    }

    expect(evaluate({ venousPh: 7.3, bicarbonateMmolL: 14.9 }).stages[1].status).toBe("complete");
    expect(evaluate({ venousPh: 7.29, bicarbonateMmolL: null }).stages[1].status).toBe("complete");
    expect(evaluate({ venousPh: 7.3, bicarbonateMmolL: null }).stages[1].status).toBe(
      "requires-review",
    );
    expect(evaluate({ bloodGlucoseMmolL: 11, venousPh: null }).stages[1].status).toBe("stopped");
  });

  it("stops at each unresolved or escalating fluid boundary", () => {
    const awaiting = evaluate({ systolicBpMmhg: 90, repeatSystolicBpMmhg: null });
    expect(awaiting.stages[2].status).toBe("requires-review");
    expect(awaiting.stages[2].findings.join(" ")).toMatch(/500 mL/);

    const exactBoundary = evaluate({ systolicBpMmhg: 90, repeatSystolicBpMmhg: 90 });
    expect(exactBoundary.stages[2].status).toBe("requires-review");
    expect(exactBoundary.stages[2].findings.join(" ")).toMatch(/exactly 90/);
    expect(exactBoundary.calculation).toBeNull();

    const low = evaluate({ systolicBpMmhg: 80, repeatSystolicBpMmhg: 89 });
    expect(low.stages[2].status).toBe("requires-review");
    expect(low.stages[2].findings.join(" ")).toMatch(/senior review/);
    expect(low.stages[3].status).toBe("not-reached");

    const recovered = evaluate({ systolicBpMmhg: 80, repeatSystolicBpMmhg: 90.1 });
    expect(recovered.stages[2].status).toBe("complete");
    expect(recovered.stages[3].status).toBe("complete");
  });

  it("applies the source insulin maximum and requires explicit context", () => {
    const atLimit = evaluate({ weightKg: 150 });
    expect(atLimit.calculation?.output.value).toBe(15);
    expect(atLimit.calculation?.sourceDefinedLimit?.applied).toBe(false);

    const aboveLimit = evaluate({ weightKg: 160 });
    expect(aboveLimit.calculation?.output.unlimitedValue).toBe(16);
    expect(aboveLimit.calculation?.output.value).toBe(15);
    expect(aboveLimit.calculation?.sourceDefinedLimit?.applied).toBe(true);

    expect(evaluate({ weightKg: null }).stages[0].status).toBe("requires-review");
    expect(evaluate({ longActingInsulinNormallyTaken: null }).calculation).toBeNull();
  });

  it("fails closed for malformed measurements and unknown fields", () => {
    const malformed = evaluate({ weightKg: Number.NaN });
    expect(malformed.stages[0].status).toBe("requires-review");
    expect(malformed.calculation).toBeNull();
    expect(malformed.inputIssues).not.toHaveLength(0);

    const unknownField = evaluateDkaStepsOneToFour({ ...base, inventedThreshold: 1 });
    expect(unknownField.stages[0].status).toBe("requires-review");
    expect(unknownField.calculation).toBeNull();
  });
});
