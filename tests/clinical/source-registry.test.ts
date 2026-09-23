import sourceRegistryJson from "@/src/clinical/sources/clinical-source-registry.json";
import { verifyClinicalSourceIntegrity } from "@/src/clinical/sources/integrity";
import { getSourceCurrentness, loadClinicalSourceRegistry } from "@/src/clinical/sources/registry";
import { clinicalSourceRegistrySchema, sourceDateSchema } from "@/src/clinical/sources/schema";
import { describe, expect, it } from "vitest";

describe("clinical source registry", () => {
  it("loads nine immutable source records grouped by clinical scope", () => {
    const registry = loadClinicalSourceRegistry();

    expect(registry.registryVersion).toBe("1.3.0");
    expect(registry.auditedOn).toBe("2026-09-20");
    expect(registry.sources).toHaveLength(9);
    expect(registry.getSourcesForScope("hyponatraemia")).toHaveLength(3);
    expect(registry.getSourcesForScope("hyperkalaemia")).toHaveLength(2);
    expect(registry.getSourcesForScope("hypocalcaemia")).toHaveLength(1);
    expect(registry.getSourcesForScope("hypomagnesaemia")).toHaveLength(1);
    expect(registry.getSourcesForScope("dka")).toHaveLength(2);
  });

  it("keeps every supplied source below project approval", () => {
    const registry = loadClinicalSourceRegistry();

    expect(
      registry.sources.every(
        (source) => source.clinicalReviewStatus !== "approved-for-project-use",
      ),
    ).toBe(true);
    expect(
      registry
        .getSourcesForScope("hyponatraemia")
        .filter((source) => source.sourceKind === "diagram")
        .every((source) => source.clinicalReviewStatus === "draft"),
    ).toBe(true);
  });

  it("derives source currentness from precision-preserving review dates", () => {
    const registry = loadClinicalSourceRegistry();
    const hyperkalaemia = registry.getSource("YSTHFT-ACUTE-HYPERKALAEMIA-V1");
    const ukkaHyperkalaemia = registry.getSource("UKKA-HYPERKALAEMIA-2023");
    const dka = registry.getSource("YTH-DKA-V9-2019");
    const hypomagnesaemia = registry.getSource("TGICFT-HYPOMAGNESAEMIA-UNDATED");

    expect(hyperkalaemia).toBeDefined();
    expect(ukkaHyperkalaemia).toBeDefined();
    expect(dka).toBeDefined();
    expect(hypomagnesaemia).toBeDefined();
    expect(getSourceCurrentness(hyperkalaemia!, registry.auditedOn)).toBe("review-due-soon");
    expect(getSourceCurrentness(ukkaHyperkalaemia!, registry.auditedOn)).toBe("review-due-soon");
    expect(getSourceCurrentness(dka!, registry.auditedOn)).toBe("review-overdue");
    expect(getSourceCurrentness(hypomagnesaemia!, registry.auditedOn)).toBe("unknown");
  });

  it("links the supporting Hypomagnesaemia source to Hypocalcaemia without merging scopes", () => {
    const registry = loadClinicalSourceRegistry();
    const hypocalcaemiaRelations = registry.getRelatedSources("YSTHFT-HYPOCALCAEMIA-V4");
    const hypomagnesaemiaRelations = registry.getRelatedSources("TGICFT-HYPOMAGNESAEMIA-UNDATED");

    expect(hypocalcaemiaRelations).toHaveLength(1);
    expect(hypocalcaemiaRelations[0]).toMatchObject({
      clinicalReviewStatus: "draft",
      clinicalScope: "hypomagnesaemia",
      sourceId: "TGICFT-HYPOMAGNESAEMIA-UNDATED",
      sourceKind: "supporting-guidance",
    });
    expect(hypomagnesaemiaRelations).toHaveLength(1);
    expect(hypomagnesaemiaRelations[0]?.sourceId).toBe("YSTHFT-HYPOCALCAEMIA-V4");
    expect(registry.getRelatedSources("UNKNOWN-SOURCE")).toEqual([]);
  });

  it("verifies every registered file by path, size and SHA-256", async () => {
    const registry = loadClinicalSourceRegistry();
    const verified = await verifyClinicalSourceIntegrity(registry, process.cwd());

    expect(verified).toHaveLength(9);
    expect(new Set(verified.map((source) => source.localPath)).size).toBe(9);
  });

  it("rejects duplicate registry IDs", () => {
    const parsed = clinicalSourceRegistrySchema.parse(sourceRegistryJson);
    const original = parsed.sources[0]!;
    const duplicate = {
      ...parsed,
      sources: [
        ...parsed.sources,
        {
          ...original,
          localPath: "clinical-sources/supporting/duplicate.pdf",
          originalFileName: "duplicate.pdf",
          sha256: "A".repeat(64),
        },
      ],
    };

    expect(() => clinicalSourceRegistrySchema.parse(duplicate)).toThrow(/sourceId.*unique/i);
  });

  it("prevents unverified sources from being marked approved", () => {
    const parsed = clinicalSourceRegistrySchema.parse(sourceRegistryJson);
    const diagram = parsed.sources.find(
      (source) => source.sourceId === "UNVERIFIED-HYPONATRAEMIA-CLASSIFICATION-DIAGRAM",
    )!;
    const invalid = {
      ...parsed,
      sources: [
        ...parsed.sources.filter((source) => source.sourceId !== diagram.sourceId),
        { ...diagram, clinicalReviewStatus: "approved-for-project-use" as const },
      ],
    };

    expect(() => clinicalSourceRegistrySchema.parse(invalid)).toThrow(/unverified source.*draft/i);
  });

  it("preserves month precision instead of inventing an exact day", () => {
    expect(sourceDateSchema.parse({ precision: "month", value: "2028-02" })).toEqual({
      precision: "month",
      value: "2028-02",
    });
    expect(sourceDateSchema.safeParse({ precision: "month", value: "2028-02-01" }).success).toBe(
      false,
    );
  });
});
