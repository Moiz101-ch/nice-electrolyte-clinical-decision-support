import { describe, expect, it, vi } from "vitest";

import runtimeCatalogueJson from "@/data/runtime/nice-rule-catalogue.json";
import { loadRuleCatalogue } from "@/src/rule-engine/catalogue";
import { createRuleEngine } from "@/src/rule-engine/engine";
import type { RuleEvaluator } from "@/src/rule-engine/types";

const generalAssessment = {
  ageYears: 49,
  clinicalContext: "general-adult-presentation",
  condition: "hypermagnesaemia",
  context: { dialysis: false },
  electrolyte: "magnesium",
  measuredValue: 3.02,
  unit: "mmol/L",
} as const;

describe("rule-engine foundation", () => {
  it("loads and indexes the validated runtime catalogue", () => {
    const catalogue = loadRuleCatalogue();

    expect(catalogue.catalogueVersion).toBe("1.1.0");
    expect(catalogue.managementSourcePolicy).toBe("NICE-only");
    expect(catalogue.rules).toHaveLength(17);
    expect(catalogue.sources).toHaveLength(8);
    expect(catalogue.getRule("NICE-K-AKI-RRT-001")?.niceSourceIds).toEqual(["NICE-NG148"]);
    expect(catalogue.getSource("NICE-NG148")?.guidanceCode).toBe("NG148");
  });

  it("returns the unsupported safety rule when no context evaluator matches", () => {
    const outcome = createRuleEngine().evaluate(generalAssessment);

    expect(outcome).toMatchObject({
      catalogueVersion: "1.1.0",
      clinicalReviewStatus: "Pending",
      ruleId: "NICE-UNSUPPORTED-001",
      sources: [],
      status: "unsupported",
    });

    if (outcome.status !== "blocked") {
      expect(outcome.managementOutput).toMatch(/Do not generate treatment instructions/i);
      expect(outcome.explanation.summary).toMatch(/intentionally not generated/i);
      expect(Object.isFrozen(outcome)).toBe(true);
      expect(Object.isFrozen(outcome.sources)).toBe(true);
    }
  });

  it("selects evaluators by context before running their predicates", () => {
    const generalEvaluate = vi.fn<RuleEvaluator["evaluate"]>(() => ({
      facts: [
        { field: "ageYears", label: "Adult age", value: 49 },
        { field: "clinicalContext", label: "Context", value: "general-adult-presentation" },
      ],
      kind: "match",
      ruleId: "NICE-GLOBAL-ASSESS-001",
    }));
    const ivFluidEvaluate = vi.fn<RuleEvaluator["evaluate"]>(() => ({ kind: "no-match" }));
    const outcome = createRuleEngine({
      evaluators: [
        {
          contexts: ["iv-fluid-related"],
          evaluate: ivFluidEvaluate,
          id: "iv-only",
          order: 10,
        },
        {
          contexts: ["general-adult-presentation"],
          evaluate: generalEvaluate,
          id: "general-only",
          order: 10,
        },
      ],
    }).evaluate(generalAssessment);

    expect(generalEvaluate).toHaveBeenCalledOnce();
    expect(ivFluidEvaluate).not.toHaveBeenCalled();
    expect(outcome).toMatchObject({
      ruleId: "NICE-GLOBAL-ASSESS-001",
      status: "matched",
      sources: [
        expect.objectContaining({
          guidanceCode: "CG174",
          recommendationSections: ["1.1.1", "1.1.6"],
        }),
      ],
    });

    if (outcome.status !== "blocked") {
      expect(outcome.explanation.summary).toBe(
        "Matched NICE-GLOBAL-ASSESS-001 because Adult age: 49; Context: general-adult-presentation.",
      );
    }
  });

  it("stops at a higher-order blocked evaluator and does not run lower-priority rules", () => {
    const lowerPriorityEvaluate = vi.fn<RuleEvaluator["evaluate"]>(() => ({
      facts: [],
      kind: "match",
      ruleId: "NICE-GLOBAL-ASSESS-001",
    }));
    const outcome = createRuleEngine({
      evaluators: [
        {
          contexts: ["general-adult-presentation"],
          evaluate: () => ({
            kind: "blocked",
            missingFields: ["context.ckdStage", "context.ckdStage"],
          }),
          id: "requires-ckd",
          order: 10,
        },
        {
          contexts: ["general-adult-presentation"],
          evaluate: lowerPriorityEvaluate,
          id: "lower-priority",
          order: 20,
        },
      ],
    }).evaluate(generalAssessment);

    expect(outcome).toEqual({
      issues: [
        {
          field: "context.ckdStage",
          message: "Required confirmed input is missing.",
        },
      ],
      reason: "missing-required-inputs",
      status: "blocked",
      trace: {
        clinicalContext: "general-adult-presentation",
        entries: [{ decision: "blocked", evaluatorId: "requires-ckd" }],
      },
    });
    expect(lowerPriorityEvaluate).not.toHaveBeenCalled();
  });

  it("blocks invalid assessment input before calling any evaluator", () => {
    const evaluate = vi.fn<RuleEvaluator["evaluate"]>(() => ({ kind: "no-match" }));
    const outcome = createRuleEngine({
      evaluators: [
        {
          contexts: ["general-adult-presentation"],
          evaluate,
          id: "never-called",
          order: 10,
        },
      ],
    }).evaluate({ ...generalAssessment, unit: "mEq/L" });

    expect(outcome).toMatchObject({ reason: "invalid-input", status: "blocked", trace: null });
    expect(evaluate).not.toHaveBeenCalled();
  });

  it("blocks a condition and measured-value contradiction before rule evaluation", () => {
    const evaluate = vi.fn<RuleEvaluator["evaluate"]>(() => ({ kind: "no-match" }));
    const outcome = createRuleEngine({
      evaluators: [
        {
          contexts: ["general-adult-presentation"],
          evaluate,
          id: "never-called-for-contradiction",
          order: 10,
        },
      ],
    }).evaluate({
      ...generalAssessment,
      condition: "hypernatraemia",
      electrolyte: "sodium",
      measuredValue: 102,
    });

    expect(outcome).toMatchObject({
      issues: [
        expect.objectContaining({
          field: "measuredValue",
          message: expect.stringMatching(/does not match Hypernatraemia/i),
        }),
      ],
      reason: "invalid-input",
      status: "blocked",
    });
    expect(evaluate).not.toHaveBeenCalled();
  });

  it("fails safely when an evaluator references an unknown or inactive rule", () => {
    const unknownRuleOutcome = createRuleEngine({
      evaluators: [
        {
          contexts: ["general-adult-presentation"],
          evaluate: () => ({ facts: [], kind: "match", ruleId: "NICE-NOT-REAL" }),
          id: "unknown-rule",
          order: 10,
        },
      ],
    }).evaluate(generalAssessment);
    const catalogueWithInactiveRule = structuredClone(runtimeCatalogueJson);
    const rule = catalogueWithInactiveRule.rules.find(
      (candidate) => candidate.ruleId === "NICE-GLOBAL-ASSESS-001",
    );

    if (rule !== undefined) {
      rule.activeForAutomation = false;
    }

    const inactiveRuleOutcome = createRuleEngine({
      catalogue: loadRuleCatalogue(catalogueWithInactiveRule),
      evaluators: [
        {
          contexts: ["general-adult-presentation"],
          evaluate: () => ({ facts: [], kind: "match", ruleId: "NICE-GLOBAL-ASSESS-001" }),
          id: "inactive-rule",
          order: 10,
        },
      ],
    }).evaluate(generalAssessment);

    expect(unknownRuleOutcome).toMatchObject({
      issues: [expect.objectContaining({ message: expect.stringMatching(/not present/i) })],
      reason: "configuration-error",
      status: "blocked",
    });
    expect(inactiveRuleOutcome).toMatchObject({
      issues: [expect.objectContaining({ message: expect.stringMatching(/not active/i) })],
      reason: "configuration-error",
      status: "blocked",
    });
  });

  it("never returns a rule rejected during clinical review", () => {
    const catalogueWithRejectedRule = structuredClone(runtimeCatalogueJson);
    const rule = catalogueWithRejectedRule.rules.find(
      (candidate) => candidate.ruleId === "NICE-GLOBAL-ASSESS-001",
    );

    if (rule !== undefined) {
      rule.clinicianReviewStatus = "Rejected";
    }

    const outcome = createRuleEngine({
      catalogue: loadRuleCatalogue(catalogueWithRejectedRule),
      evaluators: [
        {
          contexts: ["general-adult-presentation"],
          evaluate: () => ({ facts: [], kind: "match", ruleId: "NICE-GLOBAL-ASSESS-001" }),
          id: "rejected-rule",
          order: 10,
        },
      ],
    }).evaluate(generalAssessment);

    expect(outcome).toMatchObject({
      issues: [expect.objectContaining({ message: expect.stringMatching(/rejected/i) })],
      reason: "configuration-error",
      status: "blocked",
    });
  });

  it("converts an unexpected evaluator failure into a blocked outcome", () => {
    const outcome = createRuleEngine({
      evaluators: [
        {
          contexts: ["general-adult-presentation"],
          evaluate: () => {
            throw new Error("Unexpected implementation failure");
          },
          id: "throws",
          order: 10,
        },
      ],
    }).evaluate(generalAssessment);

    expect(outcome).toEqual({
      issues: [{ field: "ruleEngine", message: "Evaluator throws failed safely." }],
      reason: "configuration-error",
      status: "blocked",
      trace: {
        clinicalContext: "general-adult-presentation",
        entries: [{ decision: "error", evaluatorId: "throws" }],
      },
    });
  });

  it("rejects malformed evaluator configuration when the engine is created", () => {
    expect(() =>
      createRuleEngine({
        evaluators: [
          {
            contexts: [],
            evaluate: () => ({ kind: "no-match" }),
            id: "no-context",
            order: 1,
          },
        ],
      }),
    ).toThrow(/declare a clinical context/i);
  });
});
