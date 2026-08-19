import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import {
  HYPERKALAEMIA_SOURCE_ID,
  evaluateHyperkalaemiaEcgWorkflow,
  evaluateHyperkalaemiaSeverity,
  evaluateHyperkalaemiaTimedManagement,
  hyperkalaemiaEcgPathwayDefinition,
  hyperkalaemiaSeverityPathwayDefinition,
  hyperkalaemiaTimedManagementPathwayDefinition,
} from "@/src/clinical/pathways/hyperkalaemia";
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

const packageRoot = resolve(process.cwd(), "docs/clinical-review/hyperkalaemia-v0.3.0");
const manifestPath = resolve(packageRoot, "manifest.json");
const checklistPath = resolve(packageRoot, "review-checklist.csv");
const reviewDocumentPath = resolve(packageRoot, "README.md");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as ClinicalReviewManifest;

const definitions: readonly PathwayDefinition[] = [
  hyperkalaemiaSeverityPathwayDefinition,
  hyperkalaemiaEcgPathwayDefinition,
  hyperkalaemiaTimedManagementPathwayDefinition,
];

describe("Hyperkalaemia clinical-review package", () => {
  it("pins the package to the implemented definition versions and review lock", () => {
    expect(manifest).toMatchObject({
      approval: null,
      packageId: "hyperkalaemia-clinical-review-v0.3.0",
      packageVersion: "0.3.0",
      reviewRoute: "/review/hyperkalaemia/assessment",
      reviewStatus: "awaiting-clinical-review",
      runtimePathwayVersion: hyperkalaemiaTimedManagementPathwayDefinition.version,
    });
    expect(manifest.definitions).toEqual(
      definitions.map(({ pathwayId, status, version }) => ({ pathwayId, status, version })),
    );
    expect(definitions.every(({ reviewMetadata }) => reviewMetadata.approvedBy === null)).toBe(
      true,
    );
  });

  it("maps every definition reference to the registered Hyperkalaemia source and a valid page", () => {
    const registry = loadClinicalSourceRegistry();
    const registeredSourceIds = registry
      .getSourcesForScope("hyperkalaemia")
      .map(({ sourceId }) => sourceId);
    const references = definitions.flatMap(collectSourceReferences);

    expect(manifest.sources).toEqual(registeredSourceIds);
    expect(manifest.sources).toEqual([HYPERKALAEMIA_SOURCE_ID]);
    expect(references.length).toBeGreaterThan(0);
    expect(new Set(references.map(({ sourceId }) => sourceId))).toEqual(new Set(manifest.sources));

    for (const reference of references) {
      const source = registry.getSource(reference.sourceId);

      expect(source, `${reference.sourceId} must be registered`).toBeDefined();
      expect(source?.clinicalScope).toBe("hyperkalaemia");
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
    expect(reviewItemIds.every((id) => /^HK-CR-\d{3}$/.test(id ?? ""))).toBe(true);
    expect(new Set(reviewItemIds).size).toBe(24);
    expect(checklistRows.every((row) => /,Pending,$/.test(row))).toBe(true);
    expect(manifest.approval).toBeNull();
    expect(reviewDocument).toContain("**STOP HERE FOR CLINICAL REVIEW.**");

    for (let index = 1; index <= 13; index += 1) {
      expect(reviewDocument).toContain(`HK-AMB-${String(index).padStart(3, "0")}`);
    }
  });

  it("preserves exact potassium boundaries without rounding into printed source bands", () => {
    expect(evaluateHyperkalaemiaSeverity(5.5)).toMatchObject({
      band: { severity: "mild" },
      kind: "classified",
    });
    expect(evaluateHyperkalaemiaSeverity(5.9)).toMatchObject({
      band: { severity: "mild" },
      kind: "classified",
    });
    expect(evaluateHyperkalaemiaSeverity(5.91)).toMatchObject({ kind: "unsupported" });
    expect(evaluateHyperkalaemiaSeverity(5.99)).toMatchObject({ kind: "unsupported" });
    expect(evaluateHyperkalaemiaSeverity(6)).toMatchObject({
      band: { severity: "moderate" },
      kind: "classified",
    });
    expect(evaluateHyperkalaemiaSeverity(6.4)).toMatchObject({
      band: { severity: "moderate" },
      kind: "classified",
    });
    expect(evaluateHyperkalaemiaSeverity(6.41)).toMatchObject({ kind: "unsupported" });
    expect(evaluateHyperkalaemiaSeverity(6.49)).toMatchObject({ kind: "unsupported" });
    expect(evaluateHyperkalaemiaSeverity(6.5)).toMatchObject({
      band: { severity: "severe" },
      kind: "classified",
    });
  });

  it("preserves ECG dependencies, the seven-plus safeguard and fail-closed uncertainty", () => {
    const mild = evaluateHyperkalaemiaEcgWorkflow({
      ecgChanges: ["peaked-t-waves"],
      potassium: 5.9,
    });
    const moderate = evaluateHyperkalaemiaEcgWorkflow({ potassium: 6 });
    const changed = evaluateHyperkalaemiaEcgWorkflow({
      ecgChanges: ["broad-qrs"],
      potassium: 6,
    });
    const contradictory = evaluateHyperkalaemiaEcgWorkflow({
      ecgChanges: ["broad-qrs", "none-confirmed"],
      potassium: 6.5,
    });

    expect(mild.currentNode?.id).toBe("mild-classification-review");
    expect(mild.confirmedInputs).not.toHaveProperty("ecgChanges");
    expect(moderate.currentNode?.id).toBe("ecg-changes-question");
    expect(changed.escalations).toContainEqual(
      expect.objectContaining({ escalationId: "cardiac-monitoring-resuscitation" }),
    );
    expect(contradictory).toMatchObject({ blockReason: "ambiguous-branch", status: "blocked" });

    const sevenPlus = evaluateHyperkalaemiaTimedManagement({
      ecgChanges: ["unable-to-determine"],
      potassium: 7,
    });
    expect(sevenPlus.currentNode?.id).toBe("seven-plus-digoxin-context");
    expect(sevenPlus.warnings).toContainEqual(
      expect.objectContaining({ warningId: "do-not-delay-calcium-for-ecg" }),
    );
  });

  it("preserves review-gated treatment boundaries and unresolved source conflicts", () => {
    const moderate = evaluateHyperkalaemiaTimedManagement({
      ecgChanges: ["none-confirmed"],
      potassium: 6.4,
    });
    expect(moderate.warnings).toContainEqual(
      expect.objectContaining({ warningId: "moderate-treatment-selection-unresolved" }),
    );
    expect(moderate.nextActions).not.toContainEqual(
      expect.objectContaining({ actionId: "insulin-glucose-infusion" }),
    );

    const lowBaseline = evaluateActiveBranch(6.99, "no-listed-caution");
    const thresholdBaseline = evaluateActiveBranch(7, "no-listed-caution");
    expect(lowBaseline.nextActions).toContainEqual(
      expect.objectContaining({ actionId: "low-baseline-glucose-follow-on" }),
    );
    expect(thresholdBaseline.nextActions).not.toContainEqual(
      expect.objectContaining({ actionId: "low-baseline-glucose-follow-on" }),
    );

    const tachycardia = evaluateActiveBranch(7, "tachycardia");
    expect(tachycardia.warnings).toContainEqual(
      expect.objectContaining({ warningId: "avoid-salbutamol-tachycardia" }),
    );
    expect(tachycardia.nextActions).not.toContainEqual(
      expect.objectContaining({ actionId: expect.stringMatching(/^salbutamol/) }),
    );

    expect(thresholdBaseline.warnings).toContainEqual(
      expect.objectContaining({ warningId: "sodium-zirconium-source-conflict" }),
    );
    expect(
      [...thresholdBaseline.immediateActions, ...thresholdBaseline.nextActions].some(
        ({ actionId }) => actionId.includes("zirconium"),
      ),
    ).toBe(false);
  });
});

function evaluateActiveBranch(
  pretreatmentBloodGlucose: number,
  salbutamolContext: "no-listed-caution" | "tachycardia",
) {
  return evaluateHyperkalaemiaTimedManagement({
    digoxinToxicityConcern: "not-confirmed",
    ecgChanges: ["peaked-t-waves"],
    potassium: 6.5,
    pretreatmentBloodGlucose,
    salbutamolContext,
  });
}

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
