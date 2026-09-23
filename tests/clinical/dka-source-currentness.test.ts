import { describe, expect, it } from "vitest";

import {
  DKA_SOURCE_ID,
  dkaSourceRules,
  dkaSourceSteps,
  dkaSupplementarySections,
  evaluateDkaSourceCurrentnessGate,
} from "@/src/clinical/pathways/dka";
import { loadClinicalSourceRegistry } from "@/src/clinical/sources/registry";

function getDkaSource() {
  const source = loadClinicalSourceRegistry().getSource(DKA_SOURCE_ID);

  if (!source) {
    throw new Error("Expected the DKA source to be registered.");
  }

  return source;
}

describe("DKA source-currentness gate", () => {
  it("keeps the supplied source in draft with explicit currentness blockers", () => {
    const source = getDkaSource();

    expect(source).toMatchObject({
      clinicalReviewStatus: "draft",
      clinicalScope: "dka",
      documentVersion: "9",
      issueDate: { precision: "month", value: "2019-05" },
      reviewDate: { precision: "month", value: "2021-04" },
      reuseStatus: "internal-verification-only",
      sourceKind: "clinical-pathway",
    });
    expect(source.governanceFlags).toEqual(
      expect.arrayContaining(["internal-content-conflict", "reuse-unverified", "review-overdue"]),
    );
  });

  it("blocks activation when no project clinical approval is recorded", () => {
    const registry = loadClinicalSourceRegistry();
    const gate = evaluateDkaSourceCurrentnessGate(getDkaSource(), registry.auditedOn);

    expect(gate.currentness).toBe("review-overdue");
    expect(gate.activationAllowed).toBe(false);
    expect(gate.requirements).toHaveLength(5);
    expect(gate.requirements.every(({ status }) => status === "blocked")).toBe(true);
  });

  it("rejects approval evidence that does not match the exact source file", () => {
    const registry = loadClinicalSourceRegistry();
    const source = getDkaSource();
    const gate = evaluateDkaSourceCurrentnessGate(source, registry.auditedOn, {
      approvedBy: "Project clinical reviewer",
      approvedOn: "2026-09-18",
      sourceId: source.sourceId,
      sourceSha256: "A".repeat(64),
    });

    expect(
      gate.requirements.find(({ requirementId }) => requirementId === "clinical-approval-record")
        ?.status,
    ).toBe("blocked");
    expect(gate.activationAllowed).toBe(false);
  });

  it.each(["2026-02-30", "2099-01-01"])(
    "rejects invalid or future-dated approval evidence: %s",
    (approvedOn) => {
      const registry = loadClinicalSourceRegistry();
      const source = getDkaSource();
      const gate = evaluateDkaSourceCurrentnessGate(source, registry.auditedOn, {
        approvedBy: "Project clinical reviewer",
        approvedOn,
        sourceId: source.sourceId,
        sourceSha256: source.sha256,
      });

      expect(
        gate.requirements.find(({ requirementId }) => requirementId === "clinical-approval-record")
          ?.status,
      ).toBe("blocked");
      expect(gate.activationAllowed).toBe(false);
    },
  );

  it("does not activate from matching approval evidence while other blockers remain", () => {
    const registry = loadClinicalSourceRegistry();
    const source = getDkaSource();
    const gate = evaluateDkaSourceCurrentnessGate(source, registry.auditedOn, {
      approvedBy: "Project clinical reviewer",
      approvedOn: "2026-09-18",
      sourceId: source.sourceId,
      sourceSha256: source.sha256,
    });

    expect(
      gate.requirements.find(({ requirementId }) => requirementId === "clinical-approval-record")
        ?.status,
    ).toBe("met");
    expect(
      gate.requirements.find(({ requirementId }) => requirementId === "source-currentness")?.status,
    ).toBe("met");
    expect(
      gate.requirements.find(({ requirementId }) => requirementId === "internal-conflict")?.status,
    ).toBe("blocked");
    expect(gate.activationAllowed).toBe(false);
  });

  it("maps all ten numbered stages and links every identified rule to a valid stage", () => {
    expect(dkaSourceSteps.map(({ stepNumber }) => stepNumber)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
    ]);
    expect(new Set(dkaSourceSteps.map(({ title }) => title))).toHaveLength(10);

    const stepNumbers = new Set(dkaSourceSteps.map(({ stepNumber }) => stepNumber));
    const ruleIds = new Set(dkaSourceRules.map(({ ruleId }) => ruleId));

    for (const rule of dkaSourceRules) {
      expect(rule.sourceStepNumbers.every((stepNumber) => stepNumbers.has(stepNumber))).toBe(true);
    }

    for (const step of dkaSourceSteps) {
      expect(step.ruleIds.every((ruleId) => ruleIds.has(ruleId))).toBe(true);
    }

    expect(dkaSupplementarySections).toEqual([
      expect.objectContaining({ title: "Adult DKA hourly monitoring chart" }),
    ]);
  });

  it("records the unresolved resolution wording as a blocked rule", () => {
    const resolutionRule = dkaSourceRules.find(({ ruleId }) => ruleId === "dka-resolution");

    expect(resolutionRule).toMatchObject({
      reviewStatus: "blocked-by-source-conflict",
      sourceStepNumbers: [9],
    });
    expect(resolutionRule?.description).toMatch(/different AND\/OR logic/i);
  });

  it("keeps source mapping collections immutable", () => {
    expect(Object.isFrozen(dkaSourceSteps)).toBe(true);
    expect(Object.isFrozen(dkaSourceRules)).toBe(true);
    expect(Object.isFrozen(dkaSupplementarySections)).toBe(true);
    expect(Object.isFrozen(dkaSourceSteps[0]?.mappedElements)).toBe(true);
    expect(Object.isFrozen(dkaSourceRules[0]?.sourceStepNumbers)).toBe(true);
  });
});
