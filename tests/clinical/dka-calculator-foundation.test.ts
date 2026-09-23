import { describe, expect, it } from "vitest";

import {
  DKA_CALCULATOR_FOUNDATION_VERSION,
  createDkaCalculatorFoundationSession,
  dkaInputKindContracts,
  dkaTransparentResultFields,
  getDkaCalculatorFoundationRules,
  getDkaCalculatorFoundationStep,
  navigateDkaCalculatorFoundation,
  type DkaCalculatorSession,
  type DkaSourceStepNumber,
} from "@/src/clinical/pathways/dka";

describe("DKA calculator foundation", () => {
  it("starts with an immutable, source-gated session and no clinical data", () => {
    const session = createDkaCalculatorFoundationSession();

    expect(session).toEqual({
      calculations: [],
      currentStepNumber: 1,
      inputs: {},
      status: "blocked-by-source-currentness",
      version: DKA_CALCULATOR_FOUNDATION_VERSION,
    });
    expect(Object.isFrozen(session)).toBe(true);
    expect(Object.isFrozen(session.inputs)).toBe(true);
    expect(Object.isFrozen(session.calculations)).toBe(true);
  });

  it("navigates only to registered source stages without changing stored state", () => {
    const initial = createDkaCalculatorFoundationSession();
    const selected = navigateDkaCalculatorFoundation(initial, 10);

    expect(selected.currentStepNumber).toBe(10);
    expect(selected.inputs).toBe(initial.inputs);
    expect(selected.calculations).toBe(initial.calculations);
    expect(Object.isFrozen(selected)).toBe(true);
    expect(navigateDkaCalculatorFoundation(selected, 10)).toBe(selected);
    expect(() => navigateDkaCalculatorFoundation(selected, 11 as DkaSourceStepNumber)).toThrow(
      /source step 11 is not registered/i,
    );
  });

  it("preserves typed non-clinical fixture input state across navigation", () => {
    const initial = createDkaCalculatorFoundationSession();
    const typedSession: DkaCalculatorSession<"fixtureMeasurement"> = Object.freeze({
      ...initial,
      inputs: Object.freeze({
        fixtureMeasurement: { kind: "numeric" as const, unit: "test-unit", value: 4 },
      }),
    });
    const selected = navigateDkaCalculatorFoundation(typedSession, 2);

    expect(selected.inputs.fixtureMeasurement).toEqual({
      kind: "numeric",
      unit: "test-unit",
      value: 4,
    });
  });

  it("returns each mapped stage and only its associated future rules", () => {
    expect(getDkaCalculatorFoundationStep(4).title).toBe("Start fixed-rate IV insulin infusion");
    expect(getDkaCalculatorFoundationRules(4).map(({ ruleId }) => ruleId)).toEqual([
      "initial-insulin-rate",
    ]);
    expect(getDkaCalculatorFoundationRules(9)).toEqual([
      expect.objectContaining({
        reviewStatus: "blocked-by-source-conflict",
        ruleId: "dka-resolution",
      }),
    ]);
  });

  it("declares all supported typed input and transparent-result fields", () => {
    expect(dkaInputKindContracts.map(({ kind }) => kind)).toEqual([
      "numeric",
      "single-choice",
      "multi-select",
      "boolean",
    ]);
    expect(dkaTransparentResultFields).toEqual(
      expect.arrayContaining([
        "Confirmed inputs used",
        "Source-defined formula",
        "Applied source-defined limit",
        "Internal source mapping",
      ]),
    );
  });
});
