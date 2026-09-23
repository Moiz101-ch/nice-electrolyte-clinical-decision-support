import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import {
  HYPOCALCAEMIA_SOURCE_ID,
  evaluateHypocalcaemiaGuardrails,
  evaluateHypocalcaemiaManagement,
  evaluateHypocalcaemiaSeverity,
  hypocalcaemiaAssessmentPathwayDefinition,
  hypocalcaemiaGuardrailPathwayDefinition,
  hypocalcaemiaManagementPathwayDefinition,
  isHypocalcaemiaGuardrailClear,
  type HypocalcaemiaAssessmentInputs,
} from "@/src/clinical/pathways/hypocalcaemia";
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

const packageRoot = resolve(process.cwd(), "docs/clinical-review/hypocalcaemia-v0.3.0");
const manifestPath = resolve(packageRoot, "manifest.json");
const checklistPath = resolve(packageRoot, "review-checklist.csv");
const reviewDocumentPath = resolve(packageRoot, "README.md");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as ClinicalReviewManifest;

const definitions: readonly PathwayDefinition[] = [
  hypocalcaemiaAssessmentPathwayDefinition,
  hypocalcaemiaGuardrailPathwayDefinition,
  hypocalcaemiaManagementPathwayDefinition,
];

function completedAssessment(
  overrides: Partial<HypocalcaemiaAssessmentInputs> = {},
): HypocalcaemiaAssessmentInputs {
  return {
    adjustedCalcium: 2,
    albuminAdjustment: "confirmed",
    alkalinePhosphatase: "not-high",
    ecgAssessment: "no-changes",
    magnesium: "not-below-range",
    phosphate: "within-range",
    pth: "not-low",
    rateOfFall: "not-rapid",
    renalFunction: "no-renal-failure",
    surgery: "no-recent-surgery",
    symptoms: ["none"],
    vitaminD: "not-deficient",
    ...overrides,
  };
}

describe("Hypocalcaemia clinical-review package", () => {
  it("pins the package to the implemented definition versions and review lock", () => {
    expect(manifest).toMatchObject({
      approval: null,
      packageId: "hypocalcaemia-clinical-review-v0.3.0",
      packageVersion: "0.3.0",
      reviewRoute: "/review/hypocalcaemia/assessment",
      reviewStatus: "awaiting-clinical-review",
      runtimePathwayVersion: hypocalcaemiaManagementPathwayDefinition.version,
    });
    expect(manifest.definitions).toEqual(
      definitions.map(({ pathwayId, status, version }) => ({ pathwayId, status, version })),
    );
    expect(definitions.every(({ reviewMetadata }) => reviewMetadata.approvedBy === null)).toBe(
      true,
    );
  });

  it("maps every definition reference to the registered Hypocalcaemia source and a valid page", () => {
    const registry = loadClinicalSourceRegistry();
    const registeredSourceIds = registry
      .getSourcesForScope("hypocalcaemia")
      .map(({ sourceId }) => sourceId);
    const references = definitions.flatMap(collectSourceReferences);

    expect(manifest.sources).toEqual(registeredSourceIds);
    expect(manifest.sources).toEqual([HYPOCALCAEMIA_SOURCE_ID]);
    expect(references.length).toBeGreaterThan(0);
    expect(new Set(references.map(({ sourceId }) => sourceId))).toEqual(
      new Set([HYPOCALCAEMIA_SOURCE_ID]),
    );

    for (const reference of references) {
      const source = registry.getSource(reference.sourceId);

      expect(source, `${reference.sourceId} must be registered`).toBeDefined();
      expect(source?.clinicalScope).toBe("hypocalcaemia");
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

  it("starts with a complete pending checklist and unresolved ambiguity register", () => {
    const checklistLines = readFileSync(checklistPath, "utf8").trim().split(/\r?\n/);
    const checklistRows = checklistLines.slice(1);
    const reviewDocument = readFileSync(reviewDocumentPath, "utf8");
    const reviewItemIds = checklistRows.map((row) => row.match(/^([^,]+),/)?.[1]);

    expect(checklistLines[0]).toBe("review_item_id,domain,review_prompt,status,reviewer_comments");
    expect(checklistRows).toHaveLength(24);
    expect(reviewItemIds.every((id) => /^HC-CR-\d{3}$/.test(id ?? ""))).toBe(true);
    expect(new Set(reviewItemIds).size).toBe(24);
    expect(checklistRows.every((row) => /,Pending,$/.test(row))).toBe(true);
    expect(manifest.approval).toBeNull();
    expect(reviewDocument).toContain("**STOP HERE FOR CLINICAL REVIEW.**");

    for (let index = 1; index <= 15; index += 1) {
      expect(reviewDocument).toContain(`HC-AMB-${String(index).padStart(3, "0")}`);
    }
  });

  it("preserves exact adjusted-calcium boundaries without rounding into source bands", () => {
    expect(evaluateHypocalcaemiaSeverity(1.899)).toMatchObject({
      band: { severity: "moderate-severe" },
      kind: "classified",
    });
    expect(evaluateHypocalcaemiaSeverity(1.9)).toMatchObject({
      band: { severity: "mild" },
      kind: "classified",
    });
    expect(evaluateHypocalcaemiaSeverity(2.1)).toMatchObject({
      band: { severity: "mild" },
      kind: "classified",
    });
    expect(evaluateHypocalcaemiaSeverity(2.101)).toMatchObject({ kind: "boundary-gap" });
    expect(evaluateHypocalcaemiaSeverity(2.199)).toMatchObject({ kind: "boundary-gap" });
    expect(evaluateHypocalcaemiaSeverity(2.2)).toMatchObject({ kind: "not-hypocalcaemia" });
  });

  it("preserves guardrail and treatment locks for unresolved high-risk contexts", () => {
    const mild = completedAssessment();
    const lockedManagement = evaluateHypocalcaemiaManagement(
      mild,
      { oralCalciumSelection: "calcichew" },
      false,
    );
    const rhabdomyolysis = evaluateHypocalcaemiaGuardrails(mild, {
      recentBloodTransfusion: "not-confirmed",
      rhabdomyolysis: "confirmed",
      rhabdomyolysisExpertAdvice: "not-obtained",
    });
    const severe = completedAssessment({ adjustedCalcium: 1.85, symptoms: ["seizures"] });
    const dialysisInfusion = evaluateHypocalcaemiaManagement(
      severe,
      {
        continuousInfusionNeed: "required",
        infusionRenalContext: "dialysis",
        symptomResponse: "not-resolved",
      },
      true,
    );

    expect(lockedManagement.immediateActions).toEqual([]);
    expect(lockedManagement.currentNode?.id).toBe("guardrails-incomplete-stop");
    expect(isHypocalcaemiaGuardrailClear(rhabdomyolysis)).toBe(false);
    expect(rhabdomyolysis.warnings).toContainEqual(
      expect.objectContaining({ warningId: "rhabdomyolysis-expert-advice-required" }),
    );
    expect(dialysisInfusion.immediateActions.map(({ actionId }) => actionId)).not.toContain(
      "continuous-calcium-infusion",
    );
    expect(dialysisInfusion.warnings).toContainEqual(
      expect.objectContaining({ warningId: "large-volume-infusion-prohibited" }),
    );
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
