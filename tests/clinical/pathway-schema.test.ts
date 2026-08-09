import { describe, expect, it } from "vitest";

import {
  PathwayDefinitionError,
  loadPathwayDefinition,
  pathwayDefinitionSchema,
} from "../../src/clinical/pathways/index.ts";
import { buildFoundationPathway, foundationSources } from "./fixtures/foundation-pathway.ts";

describe("declarative pathway definition", () => {
  it("loads and freezes the non-clinical foundation fixture", () => {
    const pathway = loadPathwayDefinition(buildFoundationPathway(), {
      sources: foundationSources,
    });

    expect(pathway.pathwayId).toBe("foundation-engine-fixture");
    expect(pathway.nodes.map((node) => node.type)).toEqual(
      expect.arrayContaining([
        "action-group",
        "boolean-branch",
        "calculation",
        "escalation",
        "information",
        "monitoring",
        "multi-select-question",
        "numeric-branch",
        "numeric-input",
        "single-choice-question",
        "stop",
        "warning",
      ]),
    );
    expect(Object.isFrozen(pathway)).toBe(true);
    expect(Object.isFrozen(pathway.nodes)).toBe(true);
  });

  it("resolves source references against the real clinical source registry by default", () => {
    const sourceId = "YSTHFT-HYPONATRAEMIA-EMERGENCY-V1";
    const reference = { page: 1, section: "Registry integration fixture", sourceId };
    const pathway = loadPathwayDefinition({
      entryNodeId: "start",
      name: "Source registry integration fixture",
      nodes: [
        {
          body: "Non-clinical registry integration check.",
          id: "start",
          nextNodeId: "complete",
          sourceReferences: [reference],
          title: "Start",
          type: "information",
        },
        {
          id: "complete",
          outcome: "completed",
          reason: "Registry integration check completed.",
          sourceReferences: [reference],
          title: "Complete",
          type: "stop",
        },
      ],
      pathwayId: "source-registry-integration-fixture",
      reviewMetadata: {
        approvedBy: null,
        approvedOn: null,
        notes: ["Automated non-clinical fixture only."],
        reviewedBy: null,
        reviewedOn: null,
        status: "draft",
      },
      sourceIds: [sourceId],
      status: "draft",
      version: "1.0.0",
    });

    expect(pathway.sourceIds).toEqual([sourceId]);
  });

  it("rejects duplicate node IDs and dangling graph targets", () => {
    const fixture = buildFoundationPathway();
    const start = fixture.nodes.find((node) => node.id === "start")!;

    if (start.type !== "information") throw new Error("Fixture changed unexpectedly.");
    fixture.nodes[1]!.id = "start";
    start.nextNodeId = "missing-node";

    const parsed = pathwayDefinitionSchema.safeParse(fixture);

    expect(parsed.success).toBe(false);
    expect(parsed.error?.message).toMatch(/duplicate node id/i);
    expect(parsed.error?.message).toMatch(/missing node/i);
  });

  it("rejects overlapping numeric branch boundaries", () => {
    const fixture = buildFoundationPathway();
    const branchNode = fixture.nodes.find((node) => node.id === "score-branch")!;

    if (branchNode.type !== "numeric-branch") throw new Error("Fixture changed unexpectedly.");
    branchNode.branches[0]!.range.maximumInclusive = true;

    expect(pathwayDefinitionSchema.safeParse(fixture).error?.message).toMatch(/overlap/i);
  });

  it("rejects source references that are not declared by the pathway", () => {
    const fixture = buildFoundationPathway();
    fixture.nodes[0]!.sourceReferences[0]!.sourceId = "OTHER-SOURCE-001";

    expect(pathwayDefinitionSchema.safeParse(fixture).error?.message).toMatch(/undeclared source/i);
  });

  it("rejects unregistered sources and out-of-range source pages", () => {
    const unregistered = buildFoundationPathway();

    expect(() => loadPathwayDefinition(unregistered, { sources: [] })).toThrow(
      /not present in the clinical source registry/i,
    );

    const invalidPage = buildFoundationPathway();
    invalidPage.nodes[0]!.sourceReferences[0]!.page = 3;
    expect(() => loadPathwayDefinition(invalidPage, { sources: foundationSources })).toThrow(
      /exceeds the 2-page source/i,
    );
  });

  it("blocks approval when a source remains below project approval", () => {
    const fixture = buildFoundationPathway();
    fixture.status = "approved-for-project-use";
    fixture.reviewMetadata = {
      approvedBy: "Project approver",
      approvedOn: "2026-08-10",
      notes: ["Test approval metadata."],
      reviewedBy: "Clinical reviewer",
      reviewedOn: "2026-08-09",
      status: "approved-for-project-use",
    };

    expect(() => loadPathwayDefinition(fixture, { sources: foundationSources })).toThrow(
      /cannot depend on unapproved source/i,
    );
  });

  it("requires complete, chronological review and approval metadata", () => {
    const fixture = buildFoundationPathway();
    fixture.status = "approved-for-project-use";
    fixture.reviewMetadata.status = "approved-for-project-use";
    fixture.reviewMetadata.approvedBy = "Approver";
    fixture.reviewMetadata.approvedOn = "2026-08-08";
    fixture.reviewMetadata.reviewedBy = "Reviewer";
    fixture.reviewMetadata.reviewedOn = "2026-08-09";

    expect(pathwayDefinitionSchema.safeParse(fixture).error?.message).toMatch(
      /approval cannot predate clinical review/i,
    );
  });

  it("rejects calculation operands without a typed producer", () => {
    const fixture = buildFoundationPathway();
    const calculation = fixture.nodes.find((node) => node.id === "score-calculation")!;

    if (calculation.type !== "calculation") throw new Error("Fixture changed unexpectedly.");
    calculation.operands[0] = { key: "unknownValue", kind: "numeric-input" };

    expect(pathwayDefinitionSchema.safeParse(fixture).error?.message).toMatch(
      /has no numeric-input producer/i,
    );
  });

  it("rejects arbitrary executable expression fields", () => {
    const fixture = buildFoundationPathway() as ReturnType<typeof buildFoundationPathway> & {
      expression?: string;
    };
    fixture.expression = "inputs.score > 5";

    expect(() => loadPathwayDefinition(fixture, { sources: foundationSources })).toThrow(
      PathwayDefinitionError,
    );
    expect(pathwayDefinitionSchema.safeParse(fixture).error?.message).toMatch(/unrecognized key/i);
  });
});
