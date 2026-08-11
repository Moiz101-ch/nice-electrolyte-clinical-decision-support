import { describe, expect, it } from "vitest";

import {
  CEREBRAL_OEDEMA_SIGN_OPTIONS,
  HYPONATRAEMIA_SOURCE_ID,
  evaluateHyponatraemiaFluidStatus,
  hyponatraemiaInitialAssessmentPathwayDefinition,
  type CerebralOedemaSign,
  type HyponatraemiaFluidStatus,
} from "../../src/clinical/pathways/hyponatraemia/index.ts";

const evaluate = (
  fluidStatus?: HyponatraemiaFluidStatus,
  cerebralOedemaSigns?: readonly CerebralOedemaSign[],
) =>
  evaluateHyponatraemiaFluidStatus({
    ...(cerebralOedemaSigns === undefined ? {} : { cerebralOedemaSigns }),
    ...(fluidStatus === undefined ? {} : { fluidStatus }),
    sodium: 129,
  });

describe("hyponatraemia fluid-status workflow", () => {
  it("loads the cumulative source-traceable initial assessment definition", () => {
    expect(hyponatraemiaInitialAssessmentPathwayDefinition).toMatchObject({
      pathwayId: "hyponatraemia-initial-assessment",
      sourceIds: [HYPONATRAEMIA_SOURCE_ID],
      status: "awaiting-clinical-review",
      version: "0.2.0",
    });
  });

  it("pauses at fluid status after deriving sodium severity", () => {
    const snapshot = evaluate();

    expect(snapshot).toMatchObject({
      currentNode: { id: "fluid-status-question", type: "single-choice-question" },
      status: "awaiting-input",
    });
    expect(snapshot.derivedClassifications[0]?.branchId).toBe("moderate-hyponatraemia");
  });

  it.each([
    ["hypovolaemic", "hypovolaemic-signs"],
    ["euvolaemic", "euvolaemic-signs"],
  ] as const)("routes %s to its source-listed sign check", (fluidStatus, currentNodeId) => {
    const snapshot = evaluate(fluidStatus);

    expect(snapshot).toMatchObject({
      currentNode: { id: currentNodeId, type: "multi-select-question" },
      status: "awaiting-input",
    });
    expect(snapshot.sourceReferences).toContainEqual({
      page: 1,
      section: "Signs of cerebral oedema present?",
      sourceId: HYPONATRAEMIA_SOURCE_ID,
    });
  });

  it.each(CEREBRAL_OEDEMA_SIGN_OPTIONS)(
    "routes confirmed $label through the deferred emergency branch",
    (sign) => {
      for (const fluidStatus of ["hypovolaemic", "euvolaemic"] as const) {
        const snapshot = evaluate(fluidStatus, [sign.value]);

        expect(snapshot).toMatchObject({
          currentNode: { id: "emergency-management-pending" },
          status: "requires-clinical-review",
        });
        expect(snapshot.stopReason).toMatch(/emergency management is intentionally deferred/i);
        expectNoClinicalOutput(snapshot);
      }
    },
  );

  it.each([
    ["hypovolaemic", "hypovolaemic-causes-pending"],
    ["euvolaemic", "euvolaemic-causes-pending"],
  ] as const)("routes %s with no listed signs to its own next step", (fluidStatus, stopNodeId) => {
    const snapshot = evaluate(fluidStatus, ["none-confirmed"]);

    expect(snapshot).toMatchObject({
      currentNode: { id: stopNodeId },
      status: "requires-clinical-review",
    });
    expectNoClinicalOutput(snapshot);
  });

  it("routes hypervolaemia directly to its source endpoint without requesting signs", () => {
    const snapshot = evaluate("hypervolaemic", ["nausea"]);

    expect(snapshot).toMatchObject({
      currentNode: { id: "hypervolaemic-management-pending" },
      status: "requires-clinical-review",
    });
    expect(snapshot.confirmedInputs).not.toHaveProperty("cerebralOedemaSigns");
    expectNoClinicalOutput(snapshot);
  });

  it("provides a fail-closed review state when fluid status cannot be established", () => {
    const snapshot = evaluate("unable-to-establish", ["headache"]);

    expect(snapshot).toMatchObject({
      currentNode: { id: "fluid-status-review-required" },
      status: "requires-clinical-review",
    });
    expect(snapshot.confirmedInputs).not.toHaveProperty("cerebralOedemaSigns");
    expect(snapshot.stopReason).toMatch(/no downstream branch/i);
    expectNoClinicalOutput(snapshot);
  });

  it("blocks contradictory, empty, duplicate and unknown sign selections", () => {
    expect(evaluate("hypovolaemic", ["nausea", "none-confirmed"])).toMatchObject({
      blockReason: "ambiguous-branch",
      status: "blocked",
    });
    expect(evaluate("hypovolaemic", [])).toMatchObject({
      blockReason: "invalid-input",
      status: "blocked",
    });
    expect(evaluate("hypovolaemic", ["nausea", "nausea"])).toMatchObject({
      blockReason: "invalid-request",
      status: "blocked",
    });
    expect(evaluate("hypovolaemic", ["not-a-source-sign" as CerebralOedemaSign])).toMatchObject({
      blockReason: "invalid-input",
      status: "blocked",
    });
  });

  it("blocks invalid fluid status and prevents fluid branching for unsupported sodium", () => {
    expect(evaluate("not-a-fluid-status" as HyponatraemiaFluidStatus)).toMatchObject({
      blockReason: "invalid-input",
      status: "blocked",
    });

    const unsupportedSodium = evaluateHyponatraemiaFluidStatus({
      fluidStatus: "euvolaemic",
      sodium: 129.5,
    });
    expect(unsupportedSodium).toMatchObject({
      currentNode: { id: "outside-source-bands" },
      status: "unsupported",
    });
    expect(unsupportedSodium.confirmedInputs).not.toHaveProperty("fluidStatus");
    expectNoClinicalOutput(unsupportedSodium);
  });

  it("returns an immutable deterministic snapshot", () => {
    const first = evaluate("euvolaemic", ["confusion", "headache"]);
    const second = evaluate("euvolaemic", ["confusion", "headache"]);

    expect(first).toEqual(second);
    expect(Object.isFrozen(first)).toBe(true);
  });
});

function expectNoClinicalOutput(
  snapshot: ReturnType<typeof evaluateHyponatraemiaFluidStatus>,
): void {
  expect(snapshot.immediateActions).toEqual([]);
  expect(snapshot.nextActions).toEqual([]);
  expect(snapshot.monitoring).toEqual([]);
  expect(snapshot.escalations).toEqual([]);
  expect(snapshot.warnings).toEqual([]);
}
