import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import {
  HYPONATRAEMIA_CONNECTED_ASSESSMENT_VERSION,
  HYPONATRAEMIA_OPERATIONAL_RESULT_VERSION,
  evaluateHyponatraemiaEmergencyManagement,
  evaluateHyponatraemiaOsmolalityClassification,
  evaluateHyponatraemiaSeverity,
  hyponatraemiaEmergencyPathwayDefinition,
  hyponatraemiaInitialAssessmentPathwayDefinition,
  hyponatraemiaManagementPathwayDefinition,
  hyponatraemiaOsmolalityClassificationPathwayDefinition,
  hyponatraemiaSeverityPathwayDefinition,
} from "@/src/clinical/pathways/hyponatraemia";
import type { PathwayDefinition, PathwaySourceReference } from "@/src/clinical/pathways/schema";
import { loadClinicalSourceRegistry } from "@/src/clinical/sources/registry";

interface ClinicalReviewManifest {
  readonly approval: unknown;
  readonly artifacts: {
    readonly checklist: string;
    readonly reviewDocument: string;
    readonly screenshots: readonly string[];
  };
  readonly definitions: readonly {
    readonly pathwayId: string;
    readonly status: string;
    readonly version: string;
  }[];
  readonly packageId: string;
  readonly packageVersion: string;
  readonly reviewRoute: string;
  readonly reviewStatus: string;
  readonly runtimePathwayVersion: string;
  readonly sources: readonly string[];
  readonly testEvidence: readonly string[];
}

const packageRoot = resolve(process.cwd(), "docs/clinical-review/hyponatraemia-v0.7.0");
const manifestPath = resolve(packageRoot, "manifest.json");
const checklistPath = resolve(packageRoot, "review-checklist.csv");
const reviewDocumentPath = resolve(packageRoot, "README.md");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as ClinicalReviewManifest;

const definitions: readonly PathwayDefinition[] = [
  hyponatraemiaSeverityPathwayDefinition,
  hyponatraemiaInitialAssessmentPathwayDefinition,
  hyponatraemiaEmergencyPathwayDefinition,
  hyponatraemiaOsmolalityClassificationPathwayDefinition,
  hyponatraemiaManagementPathwayDefinition,
];

describe("Hyponatraemia clinical-review package", () => {
  it("pins the package to the implemented definition and coordinator versions", () => {
    expect(manifest).toMatchObject({
      approval: null,
      packageId: "hyponatraemia-clinical-review-v0.7.0",
      packageVersion: "0.7.0",
      reviewRoute: "/review/hyponatraemia/assessment",
      reviewStatus: "awaiting-clinical-review",
      runtimePathwayVersion: HYPONATRAEMIA_CONNECTED_ASSESSMENT_VERSION,
    });
    expect(manifest.runtimePathwayVersion).toBe(HYPONATRAEMIA_OPERATIONAL_RESULT_VERSION);
    expect(manifest.definitions).toEqual(
      definitions.map(({ pathwayId, status, version }) => ({
        pathwayId,
        status,
        version,
      })),
    );
  });

  it("maps every source reference to a registered Hyponatraemia source and valid page", () => {
    const registry = loadClinicalSourceRegistry();
    const registeredSourceIds = registry
      .getSourcesForScope("hyponatraemia")
      .map(({ sourceId }) => sourceId);
    const references = definitions.flatMap(collectSourceReferences);

    expect(manifest.sources).toEqual(registeredSourceIds);
    expect(references.length).toBeGreaterThan(0);
    expect(new Set(references.map(({ sourceId }) => sourceId))).toEqual(new Set(manifest.sources));

    for (const reference of references) {
      const source = registry.getSource(reference.sourceId);

      expect(source, `${reference.sourceId} must be registered`).toBeDefined();
      expect(source?.clinicalScope).toBe("hyponatraemia");
      expect(reference.page).toBeLessThanOrEqual(source?.pageCount ?? 0);
    }
  });

  it("keeps every declared review artifact and test-evidence file available", () => {
    const evidencePaths = [
      manifest.artifacts.reviewDocument,
      manifest.artifacts.checklist,
      ...manifest.artifacts.screenshots,
      ...manifest.testEvidence,
    ];

    for (const relativePath of evidencePaths) {
      const absolutePath = resolve(process.cwd(), relativePath);
      const exists = existsSync(absolutePath);

      expect(exists, `${relativePath} must exist`).toBe(true);
      if (exists) {
        expect(statSync(absolutePath).size, `${relativePath} must not be empty`).toBeGreaterThan(0);
      }
    }
  });

  it("starts with a complete pending checklist and an unresolved ambiguity register", () => {
    const checklistLines = readFileSync(checklistPath, "utf8").trim().split(/\r?\n/);
    const checklistRows = checklistLines.slice(1);
    const reviewDocument = readFileSync(reviewDocumentPath, "utf8");
    const reviewItemIds = checklistRows.map((row) => row.match(/^([^,]+),/)?.[1]);

    expect(checklistLines[0]).toBe("review_item_id,domain,review_prompt,status,reviewer_comments");
    expect(checklistRows).toHaveLength(20);
    expect(reviewItemIds.every((id) => /^HYP-CR-\d{3}$/.test(id ?? ""))).toBe(true);
    expect(new Set(reviewItemIds).size).toBe(20);
    expect(checklistRows.every((row) => /,Pending,$/.test(row))).toBe(true);
    expect(manifest.approval).toBeNull();

    for (let index = 1; index <= 12; index += 1) {
      expect(reviewDocument).toContain(`HYP-AMB-${String(index).padStart(3, "0")}`);
    }
  });

  it("preserves the review package's sodium and four-hour response boundaries", () => {
    expect(evaluateHyponatraemiaSeverity(124.9)).toMatchObject({
      band: { severity: "severe" },
      kind: "classified",
    });
    expect(evaluateHyponatraemiaSeverity(125)).toMatchObject({
      band: { severity: "moderate" },
      kind: "classified",
    });
    expect(evaluateHyponatraemiaSeverity(129)).toMatchObject({
      band: { severity: "moderate" },
      kind: "classified",
    });
    expect(evaluateHyponatraemiaSeverity(129.1)).toMatchObject({ kind: "unsupported" });
    expect(evaluateHyponatraemiaSeverity(130)).toMatchObject({
      band: { severity: "mild" },
      kind: "classified",
    });
    expect(evaluateHyponatraemiaSeverity(135)).toMatchObject({
      band: { severity: "mild" },
      kind: "classified",
    });
    expect(evaluateHyponatraemiaSeverity(135.1)).toMatchObject({ kind: "unsupported" });

    expect(evaluateFourHourChange(3.9).immediateActions).toContainEqual(
      expect.objectContaining({ actionId: "repeat-hypertonic-saline-dose" }),
    );
    expect(evaluateFourHourChange(4).currentNode?.id).toBe("four-hour-response-review-required");
    expect(evaluateFourHourChange(5).currentNode?.id).toBe("four-hour-response-review-required");
    expect(evaluateFourHourChange(5.1).nextActions).toContainEqual(
      expect.objectContaining({ actionId: "diagnose-manage-cause-consultant-review" }),
    );
  });

  it("preserves every ambiguous osmolality and urine threshold", () => {
    expect(classifySerumOsmolality(274.9).serumTonicity).toBe("hypotonic");
    expect(classifySerumOsmolality(275).serumTonicity).toBeNull();
    expect(classifySerumOsmolality(275.1).serumTonicity).toBe("isotonic");
    expect(classifySerumOsmolality(294.9).serumTonicity).toBe("isotonic");
    expect(classifySerumOsmolality(295).serumTonicity).toBeNull();
    expect(classifySerumOsmolality(295.1).serumTonicity).toBe("hypertonic");

    expect(classifyEuvolaemicUrine(99.9).causePattern?.id).toBe("primary-polydipsia-low-solute");
    expect(classifyEuvolaemicUrine(100).causePattern).toBeNull();
    expect(classifyEuvolaemicUrine(100.1, 40.1).causePattern?.id).toBe("siadh-compatible");

    expect(classifyHypovolaemicUrine(39.9).causePattern?.id).toBe("non-renal-salt-loss");
    expect(classifyHypovolaemicUrine(40).causePattern).toBeNull();
    expect(classifyHypovolaemicUrine(40.1).causePattern?.id).toBe("renal-salt-loss");
  });
});

function collectSourceReferences(value: unknown): PathwaySourceReference[] {
  if (Array.isArray(value)) {
    return value.flatMap(collectSourceReferences);
  }

  if (!isRecord(value)) {
    return [];
  }

  const nestedReferences = Object.values(value).flatMap(collectSourceReferences);
  if (
    typeof value.sourceId !== "string" ||
    typeof value.page !== "number" ||
    typeof value.section !== "string"
  ) {
    return nestedReferences;
  }

  return [
    {
      page: value.page,
      section: value.section,
      sourceId: value.sourceId,
    },
    ...nestedReferences,
  ];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function evaluateFourHourChange(fourHourSodiumChange: number) {
  return evaluateHyponatraemiaEmergencyManagement({
    cerebralOedemaSigns: ["confusion"],
    fluidStatus: "euvolaemic",
    fourHourSodiumChange,
    odsRiskStatus: "high-risk-not-confirmed",
    sodium: 124,
    symptomResponse: "not-improved",
  });
}

function classifySerumOsmolality(serumOsmolality: number) {
  return evaluateHyponatraemiaOsmolalityClassification({
    serumOsmolality,
    urineResultsAvailable: true,
  });
}

function classifyEuvolaemicUrine(urineOsmolality: number, urineSodium?: number) {
  return evaluateHyponatraemiaOsmolalityClassification({
    fluidStatus: "euvolaemic",
    serumOsmolality: 270,
    urineOsmolality,
    urineResultsAvailable: true,
    ...(urineSodium === undefined ? {} : { urineSodium }),
  });
}

function classifyHypovolaemicUrine(urineSodium: number) {
  return evaluateHyponatraemiaOsmolalityClassification({
    fluidStatus: "hypovolaemic",
    serumOsmolality: 270,
    urineResultsAvailable: true,
    urineSodium,
  });
}
