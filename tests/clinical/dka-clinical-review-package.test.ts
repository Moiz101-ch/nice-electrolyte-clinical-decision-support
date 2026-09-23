import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import {
  DKA_CALCULATOR_FOUNDATION_VERSION,
  DKA_SOURCE_ID,
  DKA_STEPS_FIVE_TO_TEN_VERSION,
  DKA_STEPS_ONE_TO_FOUR_VERSION,
  dkaLaterSyntheticCases,
  dkaSourceRules,
  dkaSourceSteps,
  dkaSupplementarySections,
  dkaSyntheticCases,
  evaluateDkaSourceCurrentnessGate,
  evaluateDkaStepsFiveToTen,
  evaluateDkaStepsOneToFour,
} from "@/src/clinical/pathways/dka";
import { loadClinicalSourceRegistry } from "@/src/clinical/sources/registry";

interface DkaReviewManifest {
  readonly approval: null;
  readonly artifacts: {
    readonly captureScript: string;
    readonly checklist: string;
    readonly reviewDocument: string;
    readonly screenshots: readonly string[];
  };
  readonly continuationRoute: string;
  readonly packageId: string;
  readonly packageVersion: string;
  readonly reviewRoute: string;
  readonly reviewStatus: string;
  readonly sourceReviewDate: string;
  readonly sourceSha256: string;
  readonly sources: readonly string[];
  readonly technicalStageVersions: {
    readonly calculatorFoundation: string;
    readonly stepsOneToFour: string;
    readonly stepsFiveToTen: string;
  };
  readonly testEvidence: readonly string[];
  readonly unresolvedGateRequirements: readonly string[];
}

const packageRoot = resolve(process.cwd(), "docs/clinical-review/dka-v0.3.0");
const manifest = JSON.parse(
  readFileSync(resolve(packageRoot, "manifest.json"), "utf8"),
) as DkaReviewManifest;
const checklistPath = resolve(packageRoot, "review-checklist.csv");
const reviewDocumentPath = resolve(packageRoot, "README.md");

describe("DKA clinical-review package", () => {
  it("pins the exact source and all technical versions without recording approval", () => {
    const registry = loadClinicalSourceRegistry();
    const source = registry.getSource(DKA_SOURCE_ID)!;
    const gate = evaluateDkaSourceCurrentnessGate(source, registry.auditedOn);

    expect(manifest).toMatchObject({
      approval: null,
      packageId: "dka-clinical-review-v0.3.0",
      packageVersion: DKA_STEPS_FIVE_TO_TEN_VERSION,
      reviewRoute: "/review/dka/steps-one-to-four",
      continuationRoute: "/review/dka/steps-five-to-ten",
      reviewStatus: "awaiting-clinical-review",
      technicalStageVersions: {
        calculatorFoundation: DKA_CALCULATOR_FOUNDATION_VERSION,
        stepsOneToFour: DKA_STEPS_ONE_TO_FOUR_VERSION,
        stepsFiveToTen: DKA_STEPS_FIVE_TO_TEN_VERSION,
      },
    });
    expect(manifest.sources).toEqual([DKA_SOURCE_ID]);
    expect(manifest.sourceSha256).toBe(source.sha256);
    expect(manifest.sourceReviewDate).toBe(source.reviewDate?.value);
    expect(source.clinicalReviewStatus).toBe("draft");
    expect(source.reuseStatus).toBe("internal-verification-only");
    expect(gate.activationAllowed).toBe(false);
    expect(manifest.unresolvedGateRequirements).toEqual(
      gate.requirements
        .filter(({ status }) => status === "blocked")
        .map(({ requirementId }) => requirementId),
    );
  });

  it("maps all ten stages and every rule to valid pages of the registered source", () => {
    const source = loadClinicalSourceRegistry().getSource(DKA_SOURCE_ID)!;
    const knownRuleIds = new Set(dkaSourceRules.map(({ ruleId }) => ruleId));

    expect(dkaSourceSteps.map(({ stepNumber }) => stepNumber)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
    ]);
    expect(knownRuleIds.size).toBe(dkaSourceRules.length);
    expect(dkaSourceRules).toHaveLength(10);
    expect(dkaSupplementarySections.some(({ sourcePage }) => sourcePage === 3)).toBe(true);

    for (const step of dkaSourceSteps) {
      expect(step.sourcePage).toBeGreaterThanOrEqual(1);
      expect(step.sourcePage).toBeLessThanOrEqual(source.pageCount);
      for (const ruleId of step.ruleIds) expect(knownRuleIds.has(ruleId)).toBe(true);
    }
    for (const rule of dkaSourceRules) {
      expect(rule.sourcePage).toBeGreaterThanOrEqual(1);
      expect(rule.sourcePage).toBeLessThanOrEqual(source.pageCount);
      expect(rule.sourceStepNumbers.length).toBeGreaterThan(0);
      for (const number of rule.sourceStepNumbers) {
        expect(dkaSourceSteps.some(({ stepNumber }) => stepNumber === number)).toBe(true);
      }
    }

    const initial = evaluateDkaStepsOneToFour(dkaSyntheticCases[0]!.input);
    const later = evaluateDkaStepsFiveToTen(dkaLaterSyntheticCases[0]!.input);
    const references = [
      ...initial.stages.map(({ sourceReference }) => sourceReference),
      ...later.stages.flatMap(({ sourceReferences }) => sourceReferences),
    ];
    expect(references.length).toBeGreaterThan(10);
    for (const reference of references) {
      expect(reference.sourceId).toBe(DKA_SOURCE_ID);
      expect(reference.page).toBeGreaterThanOrEqual(1);
      expect(reference.page).toBeLessThanOrEqual(source.pageCount);
    }
    expect(later.stages[4].sourceReferences.map(({ page }) => page)).toEqual([2, 3]);
    expect(dkaSourceRules.find(({ ruleId }) => ruleId === "dka-resolution")?.reviewStatus).toBe(
      "blocked-by-source-conflict",
    );
  });

  it("keeps all synthetic branches non-clinical and never permits resolution or conversion", () => {
    for (const initialCase of dkaSyntheticCases) {
      const initial = evaluateDkaStepsOneToFour(initialCase.input);
      expect(initial.activeClinicalOutput).toBe(false);

      for (const laterCase of dkaLaterSyntheticCases) {
        const later = evaluateDkaStepsFiveToTen({
          ...laterCase.input,
          initial: initialCase.input,
        });
        expect(later.activeClinicalOutput).toBe(false);
        expect(later.stages[4].status).not.toBe("complete");
        expect(later.stages[5].status).toBe("not-reached");
      }
    }
  });

  it("retains calculation and exact-boundary evidence in the package", () => {
    const initialCase = dkaSyntheticCases[0]!.input;
    const laterCase = dkaLaterSyntheticCases[0]!.input;
    const rateAtLimit = evaluateDkaStepsOneToFour({ ...initialCase, weightKg: 150 });
    const rateAboveLimit = evaluateDkaStepsOneToFour({ ...initialCase, weightKg: 160 });
    const atUrineBoundary = evaluateDkaStepsFiveToTen({
      ...laterCase,
      monitoring: { ...laterCase.monitoring, urineOutputMlPerHour: 36 },
    });

    expect(rateAtLimit.calculation?.output.value).toBe(15);
    expect(rateAtLimit.calculation?.sourceDefinedLimit?.applied).toBe(false);
    expect(rateAboveLimit.calculation?.output.value).toBe(15);
    expect(rateAboveLimit.calculation?.sourceDefinedLimit?.applied).toBe(true);
    expect(atUrineBoundary.oliguriaThreshold?.output.value).toBe(36);
    expect(atUrineBoundary.stages[2].findings.join(" ")).toMatch(/not below/i);
    expect(atUrineBoundary.responseTrend?.sourceTargetsMet).toBe(true);
    expect(atUrineBoundary.stages[4].status).toBe("requires-review");
  });

  it("contains every declared artifact and valid desktop/mobile PNG evidence", () => {
    const paths = [
      manifest.artifacts.reviewDocument,
      manifest.artifacts.checklist,
      manifest.artifacts.captureScript,
      ...manifest.artifacts.screenshots,
      ...manifest.testEvidence,
    ];
    for (const relativePath of paths) {
      const absolutePath = resolve(process.cwd(), relativePath);
      expect(existsSync(absolutePath), `${relativePath} must exist`).toBe(true);
      expect(statSync(absolutePath).size, `${relativePath} must not be empty`).toBeGreaterThan(0);
    }

    expect(manifest.artifacts.screenshots).toHaveLength(4);
    for (const relativePath of manifest.artifacts.screenshots) {
      const image = readFileSync(resolve(process.cwd(), relativePath));
      expect(image.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))).toBe(
        true,
      );
      expect(image.readUInt32BE(20)).toBeGreaterThan(600);
      expect(image.readUInt32BE(16)).toBe(relativePath.includes("mobile") ? 390 : 1280);
    }
  });

  it("starts with a complete pending checklist and an explicit stop for clinical review", () => {
    const lines = readFileSync(checklistPath, "utf8").trim().split(/\r?\n/);
    const rows = lines.slice(1).map((line) => line.split(","));
    const document = readFileSync(reviewDocumentPath, "utf8");

    expect(lines[0]).toBe("review_item_id,domain,review_prompt,status,reviewer_comments");
    expect(rows).toHaveLength(25);
    expect(new Set(rows.map(([id]) => id)).size).toBe(25);
    expect(rows.every((row) => row.length === 5 && row[3] === "Pending" && row[4] === "")).toBe(
      true,
    );
    expect(manifest.approval).toBeNull();
    expect(document).toContain("**STOP HERE FOR CLINICAL REVIEW.**");
    for (let number = 1; number <= 10; number += 1) {
      expect(document).toContain(`DKA-AMB-${String(number).padStart(3, "0")}`);
    }
  });
});
