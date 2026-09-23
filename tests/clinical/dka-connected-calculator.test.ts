import { describe, expect, it } from "vitest";

import { dkaCalculatorFields } from "@/components/pathways/dka/connected-calculator-fields";
import {
  dkaLaterSyntheticCases,
  evaluateDkaConnectedCalculator,
} from "@/src/clinical/pathways/dka";

const standardInput = dkaLaterSyntheticCases[0]!.input;

describe("connected DKA technical calculator", () => {
  it("connects all ten stages without turning the unresolved source rule into an output", () => {
    const result = evaluateDkaConnectedCalculator(standardInput);

    expect(result.inputIssues).toEqual([]);
    expect(result.initial?.stages[3].status).toBe("complete");
    expect(result.initial?.calculation?.output.value).toBe(7.2);
    expect(result.later?.stages[3].status).toBe("complete");
    expect(result.later?.stages[4].status).toBe("requires-review");
    expect(result.later?.stages[5].status).toBe("not-reached");
    expect(result.activeClinicalOutput).toBe(false);
  });

  it("recalculates from changed input and stops downstream stages when diagnosis fails", () => {
    const changed = structuredClone(standardInput);
    changed.initial.weightKg = 160;
    const capped = evaluateDkaConnectedCalculator(changed);
    expect(capped.initial?.calculation?.output.unlimitedValue).toBe(16);
    expect(capped.initial?.calculation?.output.value).toBe(15);
    expect(capped.later?.oliguriaThreshold?.output.value).toBe(80);
    expect(capped.consistencyWarnings).toHaveLength(1);

    changed.initial.bloodGlucoseMmolL = 11;
    const stopped = evaluateDkaConnectedCalculator(changed);
    expect(stopped.initial?.stages[1].status).toBe("stopped");
    expect(stopped.initial?.calculation).toBeNull();
    expect(stopped.later?.stages[0].status).toBe("not-reached");
    expect(stopped.later?.oliguriaThreshold).toBeNull();
  });

  it("rejects invalid measurements and keeps urgent potassium branches stopped", () => {
    const invalid = structuredClone(standardInput);
    invalid.initial.venousPh = 15;
    const rejected = evaluateDkaConnectedCalculator(invalid);
    expect(rejected.inputIssues.some((issue) => issue.path === "initial.venousPh")).toBe(true);
    expect(rejected.initial).toBeNull();
    expect(rejected.later).toBeNull();

    const lowPotassium = structuredClone(standardInput);
    lowPotassium.monitoring.potassiumMmolL = 3.4;
    const result = evaluateDkaConnectedCalculator(lowPotassium);
    expect(result.later?.stages[2].status).toBe("requires-review");
    expect(result.later?.stages[3].status).toBe("not-reached");
  });

  it("exposes every source-input leaf exactly once in the editor", () => {
    const expected = inputLeaves(standardInput);
    const configured = dkaCalculatorFields.flatMap((fields) =>
      fields.map((field) => field.path.join(".")),
    );
    expect(new Set(configured).size).toBe(configured.length);
    expect([...configured].sort()).toEqual([...expected].sort());
  });
});

function inputLeaves(value: unknown, prefix = ""): string[] {
  if (value === null || typeof value !== "object") return [prefix];
  return Object.entries(value).flatMap(([key, child]) =>
    inputLeaves(child, prefix ? `${prefix}.${key}` : key),
  );
}
