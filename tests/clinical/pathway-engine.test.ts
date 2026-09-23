import { describe, expect, it } from "vitest";

import { createPathwayEngine } from "../../src/clinical/engine/index.ts";
import { buildFoundationPathway, foundationSources } from "./fixtures/foundation-pathway.ts";

const numericInput = (value: number, unit = "points") => ({
  kind: "numeric" as const,
  unit,
  value,
});

const highBranchInputs = () => ({
  confirmation: { kind: "single-choice" as const, value: "continue" },
  features: { kind: "multi-select" as const, values: ["feature-a"] },
  proceed: { kind: "boolean" as const, value: true },
  score: numericInput(5),
});

describe("deterministic pathway engine", () => {
  it("advances to the first unanswered input and preserves information traceability", () => {
    const engine = createPathwayEngine(buildFoundationPathway(), { sources: foundationSources });

    const snapshot = engine.evaluate({ inputs: {} });

    expect(snapshot.status).toBe("awaiting-input");
    expect(snapshot.currentNode).toMatchObject({ id: "score-input", type: "numeric-input" });
    expect(snapshot.information).toHaveLength(1);
    expect(snapshot.sourceReferences).toEqual([
      {
        page: 1,
        section: "Non-clinical engine test fixture",
        sourceId: "TEST-SOURCE-001",
      },
    ]);
  });

  it("rejects incorrect units, out-of-range values and excess precision", () => {
    const engine = createPathwayEngine(buildFoundationPathway(), { sources: foundationSources });

    expect(engine.evaluate({ inputs: { score: numericInput(5, "wrong-unit") } })).toMatchObject({
      blockReason: "invalid-input",
      status: "blocked",
    });
    expect(engine.evaluate({ inputs: { score: numericInput(11) } })).toMatchObject({
      blockReason: "invalid-input",
      status: "blocked",
    });
    expect(engine.evaluate({ inputs: { score: numericInput(4.99) } })).toMatchObject({
      blockReason: "invalid-input",
      status: "blocked",
    });
  });

  it("uses explicit numeric inclusivity at the exact branch boundary", () => {
    const engine = createPathwayEngine(buildFoundationPathway(), { sources: foundationSources });

    const belowBoundary = engine.evaluate({ inputs: { score: numericInput(4.9) } });
    const atBoundary = engine.evaluate({ inputs: { score: numericInput(5) } });

    expect(belowBoundary.selectedBranches[0]?.branchId).toBe("lower-score");
    expect(belowBoundary.status).toBe("completed");
    expect(belowBoundary.immediateActions[0]?.actionId).toBe("record-result");
    expect(belowBoundary.nextActions[0]?.actionId).toBe("review-result");
    expect(atBoundary.selectedBranches[0]?.branchId).toBe("higher-score");
    expect(atBoundary.currentNode?.id).toBe("confirmation-question");
    expect(atBoundary.status).toBe("awaiting-input");
  });

  it("collects calculations, warnings and escalations on a complete branch", () => {
    const engine = createPathwayEngine(buildFoundationPathway(), { sources: foundationSources });

    const snapshot = engine.evaluate({ inputs: highBranchInputs() });

    expect(snapshot.status).toBe("completed");
    expect(snapshot.derivedValues.adjustedScore).toEqual({ unit: "points", value: 7 });
    expect(snapshot.calculations).toEqual([
      {
        calculationId: "score-calculation",
        formula: "score + 2",
        operands: [
          { key: "score", kind: "numeric-input", unit: "points", value: 5 },
          { key: null, kind: "constant", unit: null, value: 2 },
        ],
        operation: "add",
        output: {
          key: "adjustedScore",
          unit: "points",
          unlimitedValue: 7,
          value: 7,
        },
        precision: 1,
        roundingMode: "half-away-from-zero",
        sourceDefinedLimit: null,
        sourceReferences: [
          {
            page: 1,
            section: "Non-clinical engine test fixture",
            sourceId: "TEST-SOURCE-001",
          },
        ],
        title: "Fixture calculation",
      },
    ]);
    expect(snapshot.warnings[0]?.warningId).toBe("fixture-warning");
    expect(snapshot.escalations[0]?.escalationId).toBe("fixture-review");
    expect(snapshot.selectedBranches.map((branch) => branch.branchId)).toEqual([
      "higher-score",
      "continue-option",
      "feature-a-selected",
      "confirmed",
      "higher-adjusted-score",
    ]);
    expect(snapshot.stopReason).toBe("The non-clinical fixture completed.");
    expect(Object.isFrozen(snapshot)).toBe(true);
  });

  it("returns explicit unsupported and review-gated stop states", () => {
    const engine = createPathwayEngine(buildFoundationPathway(), { sources: foundationSources });

    const unsupported = engine.evaluate({
      inputs: {
        confirmation: { kind: "single-choice", value: "stop" },
        score: numericInput(5),
      },
    });
    const reviewRequired = engine.evaluate({
      inputs: {
        ...highBranchInputs(),
        proceed: { kind: "boolean", value: false },
      },
    });

    expect(unsupported.status).toBe("unsupported");
    expect(reviewRequired.status).toBe("requires-clinical-review");
  });

  it("fails closed when multi-select branches are ambiguous", () => {
    const fixture = buildFoundationPathway();
    const selection = fixture.nodes.find((node) => node.id === "feature-selection")!;

    if (selection.type !== "multi-select-question")
      throw new Error("Fixture changed unexpectedly.");
    selection.branches.push({
      branchId: "feature-b-selected",
      label: "Feature B selected",
      nextNodeId: "boolean-decision",
      operator: "contains-any",
      values: ["feature-b"],
    });
    const engine = createPathwayEngine(fixture, { sources: foundationSources });
    const snapshot = engine.evaluate({
      inputs: {
        ...highBranchInputs(),
        features: { kind: "multi-select", values: ["feature-a", "feature-b"] },
      },
    });

    expect(snapshot).toMatchObject({ blockReason: "ambiguous-branch", status: "blocked" });
  });

  it("fails closed when no explicit numeric branch matches", () => {
    const fixture = buildFoundationPathway();
    const branchNode = fixture.nodes.find((node) => node.id === "score-branch")!;

    if (branchNode.type !== "numeric-branch") throw new Error("Fixture changed unexpectedly.");
    branchNode.branches[1]!.range.minimum = 6;
    const engine = createPathwayEngine(fixture, { sources: foundationSources });
    const snapshot = engine.evaluate({ inputs: { score: numericInput(5.5) } });

    expect(snapshot).toMatchObject({ blockReason: "unmatched-branch", status: "blocked" });
  });

  it("blocks calculation errors without producing a derived result", () => {
    const fixture = buildFoundationPathway();
    const calculation = fixture.nodes.find((node) => node.id === "score-calculation")!;

    if (calculation.type !== "calculation") throw new Error("Fixture changed unexpectedly.");
    calculation.operation = "divide";
    calculation.operands[1] = { kind: "constant", value: 0 };
    const engine = createPathwayEngine(fixture, { sources: foundationSources });
    const snapshot = engine.evaluate({ inputs: highBranchInputs() });

    expect(snapshot).toMatchObject({ blockReason: "calculation-error", status: "blocked" });
    expect(snapshot.derivedValues).toEqual({});
  });

  it("applies the calculation's declared rounding mode", () => {
    const halfAwayFixture = buildFoundationPathway();
    const halfAwayCalculation = halfAwayFixture.nodes.find(
      (node) => node.id === "score-calculation",
    )!;

    if (halfAwayCalculation.type !== "calculation") {
      throw new Error("Fixture changed unexpectedly.");
    }
    halfAwayCalculation.operation = "divide";
    halfAwayCalculation.operands[1] = { kind: "constant", value: 4 };

    const floorFixture = buildFoundationPathway();
    const floorCalculation = floorFixture.nodes.find((node) => node.id === "score-calculation")!;

    if (floorCalculation.type !== "calculation") throw new Error("Fixture changed unexpectedly.");
    floorCalculation.operation = "divide";
    floorCalculation.operands[1] = { kind: "constant", value: 4 };
    floorCalculation.roundingMode = "floor";

    const inputs = { ...highBranchInputs(), score: numericInput(5.5) };
    const halfAway = createPathwayEngine(halfAwayFixture, {
      sources: foundationSources,
    }).evaluate({ inputs });
    const floor = createPathwayEngine(floorFixture, { sources: foundationSources }).evaluate({
      inputs,
    });

    expect(halfAway.derivedValues.adjustedScore?.value).toBe(1.4);
    expect(floor.derivedValues.adjustedScore?.value).toBe(1.3);
  });

  it("applies and reports a source-defined calculation limit", () => {
    const fixture = buildFoundationPathway();
    const calculation = fixture.nodes.find((node) => node.id === "score-calculation")!;

    if (calculation.type !== "calculation") throw new Error("Fixture changed unexpectedly.");
    calculation.sourceDefinedLimit = { kind: "maximum", unit: "points", value: 6 };

    const snapshot = createPathwayEngine(fixture, { sources: foundationSources }).evaluate({
      inputs: highBranchInputs(),
    });

    expect(snapshot.derivedValues.adjustedScore).toEqual({ unit: "points", value: 6 });
    expect(snapshot.calculations[0]).toMatchObject({
      output: { unlimitedValue: 7, value: 6 },
      sourceDefinedLimit: { applied: true, kind: "maximum", unit: "points", value: 6 },
    });
  });

  it("detects graph cycles during evaluation", () => {
    const fixture = buildFoundationPathway();
    const actions = fixture.nodes.find((node) => node.id === "lower-actions")!;

    if (actions.type !== "action-group") throw new Error("Fixture changed unexpectedly.");
    actions.nextNodeId = "start";
    const engine = createPathwayEngine(fixture, { sources: foundationSources });
    const snapshot = engine.evaluate({ inputs: { score: numericInput(4.9) } });

    expect(snapshot).toMatchObject({ blockReason: "cycle-detected", status: "blocked" });
  });

  it("produces identical snapshots for identical confirmed inputs", () => {
    const engine = createPathwayEngine(buildFoundationPathway(), { sources: foundationSources });

    expect(engine.evaluate({ inputs: highBranchInputs() })).toEqual(
      engine.evaluate({ inputs: highBranchInputs() }),
    );
  });

  it("blocks malformed evaluation requests before traversal", () => {
    const engine = createPathwayEngine(buildFoundationPathway(), { sources: foundationSources });

    const snapshot = engine.evaluate({ score: 5 });

    expect(snapshot).toMatchObject({ blockReason: "invalid-request", status: "blocked" });
    expect(snapshot.trace).toEqual([]);
  });
});
